#!/bin/sh -ceu
# MinIO bootstrap: alias, bucket, policy, CORS (XML)
# POSIX sh; avoids bashisms so it runs cleanly in bitnami/minio-client

echo "==> Configuring MinIO (alias, bucket, policy, CORS)"

# ----------------------------
# Required / derived settings
# ----------------------------
: "${S3_BUCKET:?S3_BUCKET required}"

# MinIO root creds: prefer explicit, fall back to S3_* names
: "${MINIO_ROOT_USER:=${S3_ACCESS_KEY_ID:?S3_ACCESS_KEY_ID required}}"
: "${MINIO_ROOT_PASSWORD:=${S3_SECRET_ACCESS_KEY:?S3_SECRET_ACCESS_KEY required}}"

# Where MinIO lives (in Compose: service name 'minio')
: "${MINIO_ALIAS:=local}"
: "${MINIO_HOST:=http://minio:9000}"

# Policy for anonymous access (common: download | public | none)
: "${S3_POLICY:=download}"

# App origins and CORS knobs
: "${APP_URL:=http://localhost:3000}"
: "${APP_ORIGINS:=${APP_URL}}"
: "${CORS_ALLOWED_METHODS:=GET,PUT}"
: "${CORS_MAX_AGE:=3600}"

echo "Debug:"
echo "  MINIO_ALIAS=${MINIO_ALIAS}"
echo "  MINIO_HOST=${MINIO_HOST}"
echo "  S3_BUCKET=${S3_BUCKET}"
echo "  S3_POLICY=${S3_POLICY}"
echo "  APP_ORIGINS=${APP_ORIGINS}"
echo "  CORS_ALLOWED_METHODS=${CORS_ALLOWED_METHODS}"
echo "  CORS_MAX_AGE=${CORS_MAX_AGE}"

# --------------------------------
# Wait for MinIO to be fully ready
# --------------------------------
# Old (remove this):
# i=0
# until curl -sSf -u "${MINIO_ROOT_USER}:${MINIO_ROOT_PASSWORD}" \
#   "${MINIO_HOST%/}/minio/health/ready" >/dev/null; do
#   i=$((i+1))
#   echo "Waiting for MinIO to be ready... (${i})"
#   sleep 1
# done
# echo "MinIO is ready."

# New: set alias first, then wait on mc's native readiness
mc alias set "${MINIO_ALIAS}" "${MINIO_HOST}" "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}" >/dev/null

i=0
until mc ready --json "${MINIO_ALIAS}" >/dev/null 2>&1; do
  i=$((i+1))
  echo "Waiting for MinIO to be ready... (${i})"
  sleep 1
done
echo "MinIO is ready."

# ----------------------------
# MinIO Client (mc) bootstrap
# ----------------------------


# Bucket (idempotent)
mc mb --ignore-existing "${MINIO_ALIAS}/${S3_BUCKET}" >/dev/null || true

# Anonymous policy (idempotent)
mc anonymous set "${S3_POLICY}" "${MINIO_ALIAS}/${S3_BUCKET}" >/dev/null

# ----------------------------
# Build CORS as *XML* explicitly
# ----------------------------
# Helpers: split comma-list → newline list (trim spaces)
split_csv() {
  # $1 = csv; outputs newline-delimited tokens (trimmed)
  # shellcheck disable=SC2039 # (we're in POSIX sh)
  local s
  s=$1
  # Replace commas with newlines
  printf "%s" "$s" | tr ',' '\n' | while IFS= read -r tok; do
    # trim leading
    tok=${tok##+([[:space:]])}; tok=${tok%%+([[:space:]])}
    # Fallback trimming (busybox ash won't have extglob): manual trim
    # (portable trim)
    # leading
    case "$tok" in
      ' '*) tok=$(printf "%s" "$tok" | sed 's/^[[:space:]]*//');;
    esac
    # trailing
    tok=$(printf "%s" "$tok" | sed 's/[[:space:]]*$//')
    [ -n "$tok" ] && printf "%s\n" "$tok"
  done
}

# Collect origins
ORIGINS_FILE="$(mktemp)"
METHODS_FILE="$(mktemp)"
split_csv "$APP_ORIGINS" > "$ORIGINS_FILE"
split_csv "$CORS_ALLOWED_METHODS" > "$METHODS_FILE"

# If user gave "*", collapse to a single wildcard rule
WILDCARD_ORIGIN=0
if [ "$(wc -l < "$ORIGINS_FILE")" -eq 1 ] && [ "$(cat "$ORIGINS_FILE")" = "*" ]; then
  WILDCARD_ORIGIN=1
fi

CORS_XML_FILE="$(mktemp)"
# Start XML
{
  echo "<CORSConfiguration>"
  if [ "$WILDCARD_ORIGIN" -eq 1 ]; then
    echo "  <CORSRule>"
    echo "    <AllowedOrigin>*</AllowedOrigin>"
    # Methods
    while IFS= read -r m; do
      [ -n "$m" ] && printf "    <AllowedMethod>%s</AllowedMethod>\n" "$m"
    done < "$METHODS_FILE"
    echo "    <AllowedHeader>*</AllowedHeader>"
    echo "    <ExposeHeader>ETag</ExposeHeader>"
    printf "    <MaxAgeSeconds>%s</MaxAgeSeconds>\n" "$CORS_MAX_AGE"
    echo "  </CORSRule>"
  else
    # Safer for some S3 implementations: one rule per origin
    while IFS= read -r origin; do
      [ -z "$origin" ] && continue
      echo "  <CORSRule>"
      printf "    <AllowedOrigin>%s</AllowedOrigin>\n" "$origin"
      while IFS= read -r m; do
        [ -n "$m" ] && printf "    <AllowedMethod>%s</AllowedMethod>\n" "$m"
      done < "$METHODS_FILE"
      echo "    <AllowedHeader>*</AllowedHeader>"
      echo "    <ExposeHeader>ETag</ExposeHeader>"
      printf "    <MaxAgeSeconds>%s</MaxAgeSeconds>\n" "$CORS_MAX_AGE"
      echo "  </CORSRule>"
    done < "$ORIGINS_FILE"
  fi
  echo "</CORSConfiguration>"
} > "$CORS_XML_FILE"

# Apply CORS
# Note: For MinIO, both XML & JSON are accepted in recent mc, but XML avoids any mc-side conversion ambiguity.
if mc bucket cors set "${MINIO_ALIAS}/${S3_BUCKET}" "$CORS_XML_FILE" >/dev/null 2>&1; then
  echo "CORS applied."
else
  echo "WARN: 'mc bucket cors set' failed; trying legacy 'mc cors set'..."
  mc cors set "${MINIO_ALIAS}/${S3_BUCKET}" "$CORS_XML_FILE"
fi

rm -f "$ORIGINS_FILE" "$METHODS_FILE" "$CORS_XML_FILE"

echo "==> MinIO init done."
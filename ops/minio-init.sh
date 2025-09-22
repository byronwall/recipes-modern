#!/bin/sh -ceu

echo "Configuring MinIO (bucket, policy, CORS)"

: "${S3_BUCKET:?S3_BUCKET required}"
: "${MINIO_ROOT_USER:=${S3_ACCESS_KEY_ID:?}}"
: "${MINIO_ROOT_PASSWORD:=${S3_SECRET_ACCESS_KEY:?}}"
: "${APP_ORIGINS:=${APP_URL:-http://localhost:3000}}"

METHODS_VAL="${CORS_ALLOWED_METHODS:-GET,PUT}"
MAX_AGE_VAL="${CORS_MAX_AGE:-3600}"

mc alias set local http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"
mc ready --json local

mc mb --ignore-existing "local/${S3_BUCKET}"
mc anonymous set download "local/${S3_BUCKET}"

to_json_array() {
  IFS=","
  set -- $1
  out="["
  for item in "$@"; do
    item="${item#"${item%%[![:space:]]*}"}"
    item="${item%"${item##*[![:space:]]}"}"
    [ -z "$item" ] && continue
    [ "$out" != "[" ] && out="${out},"
    out="${out}\"$item\""
  done
  echo "${out}]"
}

ORIGINS_JSON=$(to_json_array "$APP_ORIGINS")
METHODS_JSON=$(to_json_array "$METHODS_VAL")

cat > /tmp/cors.effective.json <<EOF
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ${METHODS_JSON},
    "AllowedOrigins": ${ORIGINS_JSON},
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": ${MAX_AGE_VAL}
  }
]
EOF

mc cors set "local/${S3_BUCKET}" /tmp/cors.effective.json
echo "MinIO init done."
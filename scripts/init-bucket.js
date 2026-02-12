import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from "@aws-sdk/client-s3";
import { flexibleChecksumsMiddlewareOptions } from "@aws-sdk/middleware-flexible-checksums";

const {
  S3_ENDPOINT_INTERNAL,
  S3_REGION = "us-east-1",
  S3_BUCKET,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  S3_PUBLIC_READ = "false",
} = process.env;

if (
  !S3_ENDPOINT_INTERNAL ||
  !S3_BUCKET ||
  !S3_ACCESS_KEY_ID ||
  !S3_SECRET_ACCESS_KEY
) {
  console.error(
    "[bucket-init] Missing required envs: S3_ENDPOINT_INTERNAL, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY",
  );
  process.exit(1);
}

const s3 = new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT_INTERNAL,
  forcePathStyle: true,
  // Avoid adding checksum headers that MinIO/S3 may not implement for this operation
  requestChecksumCalculation: "WHEN_REQUIRED",
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
});

// MinIO can return 501 for flexible checksum headers on some operations (e.g., PutBucketCors).
// Remove the middleware entirely to avoid sending those headers.
s3.middlewareStack.remove(
  /** @type {string} */ (
    flexibleChecksumsMiddlewareOptions.name ?? "flexibleChecksumsMiddleware"
  ),
);

/** @type {string} */
// At this point we've validated S3_BUCKET is present
const BUCKET = /** @type {string} */ (S3_BUCKET);

/**
 * @param {number} ms
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForMinioReady(maxSeconds = 60) {
  console.log("[bucket-init] Waiting for MinIO to be ready...");
  const deadline = Date.now() + maxSeconds * 1000;
  while (Date.now() < deadline) {
    try {
      // If MinIO is up, this resolves (404s are caught and ignored)
      await s3
        .send(new HeadBucketCommand({ Bucket: BUCKET }))
        .catch(() => null);
      console.log("[bucket-init] MinIO reachable.");
      return;
    } catch {
      // ignore
    }
    await sleep(1000);
  }
  console.warn(
    "[bucket-init] Proceeding without explicit readiness (healthcheck should have gated this).",
  );
}

// CORS configuration is intentionally omitted; handled via Traefik headers.

/**
 * @param {string} bucket
 */
function buildPublicReadPolicy(bucket) {
  return JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "AllowPublicRead",
        Effect: "Allow",
        Principal: "*",
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  });
}

async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
    console.log(`[bucket-init] Bucket exists: ${BUCKET}`);
  } catch (/** @type {unknown} */ err) {
    const httpStatus =
      err && typeof err === "object" && "$metadata" in err
        ? /** @type {{ $metadata?: { httpStatusCode?: number } }} */ (err)
            .$metadata?.httpStatusCode
        : undefined;
    if (httpStatus === 404) {
      console.log(`[bucket-init] Creating bucket: ${BUCKET}`);
      // For MinIO and most S3-compatible stores this is sufficient.
      await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
      console.log(`[bucket-init] Created bucket: ${BUCKET}`);
    } else {
      console.error("[bucket-init] HeadBucket failed:", err);
      throw err;
    }
  }
}

// ensureCors removed

async function ensurePublicPolicy() {
  if (String(S3_PUBLIC_READ).toLowerCase() !== "true") {
    console.log(
      "[bucket-init] Skipping public-read policy (S3_PUBLIC_READ != true).",
    );
    return;
  }
  const Policy = buildPublicReadPolicy(BUCKET);
  console.log("[bucket-init] Applying public-read bucket policy.");
  await s3.send(new PutBucketPolicyCommand({ Bucket: BUCKET, Policy }));
  console.log("[bucket-init] Public-read policy applied.");
}

async function main() {
  console.log("[bucket-init] Start");
  await waitForMinioReady(60);
  await ensureBucket();
  console.log(
    "[bucket-init] Skipping bucket CORS; handled via Traefik headers.",
  );
  await ensurePublicPolicy();
  console.log("[bucket-init] Done");
}

main().catch((err) => {
  console.error("[bucket-init] FAILED:", err);
  process.exit(1);
});

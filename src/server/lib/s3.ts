import {
  S3Client,
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { flexibleChecksumsMiddlewareOptions } from "@aws-sdk/middleware-flexible-checksums";

type S3ClientOptions = Partial<S3ClientConfig>;

const commonOptions: S3ClientOptions = {
  region: process.env.S3_REGION,
  forcePathStyle: true,
  // Avoid adding checksum headers that MinIO/S3 may not implement for this operation
  requestChecksumCalculation: "WHEN_REQUIRED",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
};

// Normalize endpoints to strip any accidental path prefixes (signing must match MinIO path)
function sanitizeEndpoint(endpoint?: string) {
  if (!endpoint) return undefined;
  try {
    const u = new URL(endpoint);
    return `${u.protocol}//${u.host}`;
  } catch {
    return endpoint;
  }
}

// Internal client used by the server (can point at docker network hostname like http://minio:9000)
export const s3Internal = new S3Client({
  ...commonOptions,
  endpoint: sanitizeEndpoint(process.env.S3_ENDPOINT_INTERNAL),
});

// Public client used only for generating presigned URLs that the browser will call directly
export const s3Public = new S3Client({
  ...commonOptions,
  endpoint: sanitizeEndpoint(process.env.S3_ENDPOINT_PUBLIC),
});

// MinIO can return 403/501 when checksum headers are expected but not provided by callers
// Remove the flexible checksums middleware so presigned URLs don't include checksum params
{
  const checksumMiddlewareName: string =
    (flexibleChecksumsMiddlewareOptions as unknown as { name?: string }).name ??
    "flexibleChecksumsMiddleware";
  s3Internal.middlewareStack.remove(checksumMiddlewareName);
  s3Public.middlewareStack.remove(checksumMiddlewareName);
}

export async function createPutUrl(
  key: string,
  contentType: string,
  maxAgeSeconds = 60,
) {
  const cmd = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    ContentType: contentType,
  });
  // Use the public client so the presigned URL host is browser-reachable
  return getSignedUrl(s3Public, cmd, { expiresIn: maxAgeSeconds });
}

export async function headObject(key: string) {
  return s3Internal.send(
    new HeadObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }),
  );
}

export async function getObjectBuffer(key: string) {
  const result = await s3Internal.send(
    new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }),
  );
  const arr = await result.Body?.transformToByteArray();
  return Buffer.from(arr ?? []);
}

export async function deleteObject(key: string) {
  return s3Internal.send(
    new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }),
  );
}

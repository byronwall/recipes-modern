import {
  S3Client,
  HeadObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Internal client used by the server (can point at docker network hostname like http://minio:9000)
export const s3Internal = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT_INTERNAL ?? process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
});

// Public client used only for generating presigned URLs that the browser will call directly
export const s3Public = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT_PUBLIC ?? process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
});

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

export async function deleteObject(key: string) {
  return s3Internal.send(
    new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }),
  );
}

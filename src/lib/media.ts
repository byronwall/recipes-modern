import { env } from "~/env";

export type S3ImageRef = {
  bucket: string;
  key: string;
};

function getEnvMediaBaseUrl(): string | undefined {
  const anyEnv = env as unknown as Record<string, string | undefined>;
  return anyEnv.NEXT_PUBLIC_MEDIA_BASE_URL;
}

export function getPublicMediaBaseUrl(bucket?: string): string {
  const fromEnv = getEnvMediaBaseUrl();
  if (fromEnv) return fromEnv;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  if (!origin) return bucket ? `/media/${bucket}` : "/media";
  return bucket ? `${origin}/media/${bucket}` : `${origin}/media`;
}

export function getImageUrl(image: S3ImageRef): string {
  const fromEnv = getEnvMediaBaseUrl();
  if (fromEnv) return `${fromEnv}/${image.key}`;
  const base = getPublicMediaBaseUrl(image.bucket);
  return `${base}/${image.key}`;
}

export type LightboxLikeImage = {
  url: string;
  alt?: string | null;
  caption?: string | null;
};

export function buildLightboxImages(
  images: Array<{
    image: { bucket: string; key: string; alt: string | null };
    caption?: string | null;
  }>,
): LightboxLikeImage[] {
  return images.map((ri) => ({
    url: getImageUrl({ bucket: ri.image.bucket, key: ri.image.key }),
    alt: ri.image.alt ?? "",
    caption: ri.caption ?? null,
  }));
}

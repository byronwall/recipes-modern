import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

console.log("env", process.env);

// Derive public media/S3 endpoints when not explicitly provided, mirroring docker-compose
const publicScheme =
  process.env.PUBLIC_SCHEME ??
  (process.env.NODE_ENV === "development" ? "http" : "https");
const appHost = process.env.APP_HOST;
const mediaPathPrefix = process.env.MEDIA_PATH_PREFIX ?? "/media";
const s3Bucket = process.env.S3_BUCKET;

console.log("publicScheme", publicScheme);
console.log("appHost", appHost);
console.log("mediaPathPrefix", mediaPathPrefix);
console.log("s3Bucket", s3Bucket);

// S3 endpoint used for generating signed URLs. IMPORTANT: do NOT include MEDIA_PATH_PREFIX here
const derivedS3EndpointPublic =
  process.env.S3_ENDPOINT_PUBLIC ??
  (appHost ? `${publicScheme}://${appHost}` : undefined);

// Public base URL for media served via Traefik including MEDIA_PATH_PREFIX and bucket
const derivedMediaBaseUrl =
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL ??
  (appHost && s3Bucket
    ? `${publicScheme}://${appHost}${mediaPathPrefix}/${s3Bucket}`
    : undefined);

// process.env.NEXT_PUBLIC_MEDIA_BASE_URL = derivedMediaBaseUrl;

console.log("derivedMediaBaseUrl", derivedMediaBaseUrl);

const derivedKrogerRedirectUri =
  process.env.NEXT_REDIRECT_URI ??
  (appHost ? `${publicScheme}://${appHost}/kroger/auth` : undefined);

const derivedNextAuthUrl =
  process.env.NEXTAUTH_URL ??
  (appHost ? `${publicScheme}://${appHost}` : undefined);

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DB_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    NEXTAUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    NEXTAUTH_URL: z.string().url().optional(),
    KROGER_CLIENT_ID: z.string(),
    CLIENT_SECRET: z.string(),
    NEXT_SKIP_ADD_TO_CART: z.enum(["true", "false"]).default("false"),
    OPENAI_API_KEY: z.string(),
    // S3 / MinIO
    S3_ENDPOINT: z.string().url().optional(),
    S3_ENDPOINT_PUBLIC: z.string().url().optional(),
    S3_ENDPOINT_INTERNAL: z.string().url().optional(),
    S3_REGION: z.string().default("us-east-1"),
    S3_BUCKET: z.string(),
    S3_ACCESS_KEY_ID: z.string(),
    S3_SECRET_ACCESS_KEY: z.string(),
    NEXT_REDIRECT_URI: z.string().url().optional(),
    MEDIA_BASE_URL: z.string().url(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {},

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DB_URL: process.env.DB_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: derivedNextAuthUrl,
    KROGER_CLIENT_ID: process.env.KROGER_CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    NEXT_REDIRECT_URI: derivedKrogerRedirectUri,
    NEXT_SKIP_ADD_TO_CART: process.env.NEXT_SKIP_ADD_TO_CART,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_ENDPOINT_PUBLIC: derivedS3EndpointPublic,
    S3_ENDPOINT_INTERNAL: process.env.S3_ENDPOINT_INTERNAL,
    S3_REGION: process.env.S3_REGION,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    MEDIA_BASE_URL: derivedMediaBaseUrl,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});

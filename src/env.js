import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

console.log("env", process.env);

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
    NEXTAUTH_URL: z.preprocess(
      // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
      // Since NextAuth.js automatically uses the VERCEL_URL if present.
      (str) => process.env.VERCEL_URL ?? str,
      // VERCEL_URL doesn't include `https` so it cant be validated as a URL
      process.env.VERCEL ? z.string() : z.string().url(),
    ),
    NEXT_CLIENT_ID: z.string(),
    CLIENT_SECRET: z.string(),
    NEXT_REDIRECT_URI: z.string(),
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
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_MEDIA_BASE_URL: z.string().url().optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DB_URL: process.env.DB_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXT_CLIENT_ID: process.env.NEXT_CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    NEXT_REDIRECT_URI: process.env.NEXT_REDIRECT_URI,
    NEXT_SKIP_ADD_TO_CART: process.env.NEXT_SKIP_ADD_TO_CART,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_ENDPOINT_PUBLIC: process.env.S3_ENDPOINT_PUBLIC,
    S3_ENDPOINT_INTERNAL: process.env.S3_ENDPOINT_INTERNAL,
    S3_REGION: process.env.S3_REGION,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    NEXT_PUBLIC_MEDIA_BASE_URL: process.env.NEXT_PUBLIC_MEDIA_BASE_URL,
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

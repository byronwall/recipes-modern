/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

/** @type {import("next").NextConfig} */
const config = {
  typescript: {
    // Allow production builds to successfully complete even if there are TypeScript errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ESLint errors during builds.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.PUBLIC_MEDIA_HOST ?? "recipes-media.byroni.us",
      },
      { protocol: "http", hostname: "minio" },
    ],
  },
};

export default config;

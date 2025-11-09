/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
const envFile = await import("./src/env.js");

// for images
// ENV Looks like: NEXT_PUBLIC_MEDIA_BASE_URL=http://localhost:9000/recipes-media
const mediaBaseUrl = envFile.env.MEDIA_BASE_URL;
if (!mediaBaseUrl) {
  if (process.env.IS_BUILD) {
    console.warn(
      "MEDIA_BASE_URL is not set.  Skipping error because IS_BUILD is set.",
    );
  } else {
    throw new Error(
      "MEDIA_BASE_URL is not set.  Throwing error because IS_BUILD is not set.",
    );
  }
}
const mediaAsUri = new URL(mediaBaseUrl);
const protocol = mediaAsUri.protocol.replace(":", "");
if (protocol !== "http" && protocol !== "https") {
  throw new Error(
    "NEXT_PUBLIC_MEDIA_BASE_URL must start with http or https: `" +
      protocol +
      "`",
  );
}

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
        protocol: protocol,
        hostname: mediaAsUri.hostname,
        port: mediaAsUri.port,
        pathname: mediaAsUri.pathname,
      },
    ],
  },
};

export default config;

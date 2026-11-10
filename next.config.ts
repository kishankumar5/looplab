import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // The API docs route reads docs/openapi.yaml at runtime; make sure it ships with the deployment.
  outputFileTracingIncludes: { "/api/openapi": ["./docs/openapi.yaml"] },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

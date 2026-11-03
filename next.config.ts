import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pages here read the session cookie on every request, so we use plain
  // dynamic rendering instead of Cache Components.
  serverExternalPackages: ["sharp"],
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

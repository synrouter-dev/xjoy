import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack root for monorepo
  turbopack: {
    root: process.cwd(),
  },
  // Transpile workspace packages
  transpilePackages: ["@xjoy/shared", "@xjoy/db", "@xjoy/api"],
  // PWA
  headers: async () => [
    {
      source: "/manifest.json",
      headers: [{ key: "Content-Type", value: "application/manifest+json" }],
    },
  ],
};

export default nextConfig;

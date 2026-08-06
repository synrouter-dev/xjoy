import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Monorepo: set turbopack root to project root (where pnpm-lock.yaml lives)
  turbopack: {
    root: path.resolve(__dirname, "../.."),
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

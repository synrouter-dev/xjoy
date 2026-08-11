import type { NextConfig } from "next";
import path from "path";

const isExport = process.env.NEXT_EXPORT === "true";

const nextConfig: NextConfig = {
  // Monorepo: set turbopack root to project root (where pnpm-lock.yaml lives)
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  // Transpile workspace packages
  transpilePackages: ["@xjoy/shared", "@xjoy/db", "@xjoy/api"],

  // ── 静态导出配置（GitHub Pages） ──
  // NEXT_EXPORT=true 时启用静态导出模式
  // NEXT_BASE_PATH: GitHub Pages 子路径（如 /xjoy），自定义域名时为空
  ...(isExport && {
    output: "export" as const,
    basePath: process.env.NEXT_BASE_PATH || "",
    trailingSlash: true,
    images: {
      unoptimized: true,
    },
    // 静态导出不支持 headers() 函数
    // PWA manifest 通过 public/ 目录直接提供
  }),

  // ── PWA Headers（仅非导出模式） ──
  ...(!isExport && {
    headers: async () => [
      {
        source: "/manifest.json",
        headers: [{ key: "Content-Type", value: "application/manifest+json" }],
      },
    ],
  }),
};

export default nextConfig;

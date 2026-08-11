/**
 * 静态导出构建脚本 — Static Export Build
 *
 * GitHub Pages 静态部署不支持 API 路由。此脚本：
 * 1. 临时移除 src/app/api/ 目录
 * 2. 运行 next build（output: "export"）
 * 3. 恢复 src/app/api/ 目录
 *
 * 用法：NEXT_EXPORT=true node scripts/build-static.mjs
 */

import { execSync } from "node:child_process";
import { renameSync, existsSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = join(__dirname, "..");
const apiDir = join(appDir, "src", "app", "api");
// 必须移到 src/app/ 之外，否则 Next.js 仍会将其作为路由处理
const apiBackupDir = join(appDir, "src", "api.export-bak");

console.log("[static-build] 🚀 开始静态导出构建...\n");

// Step 0: 清理旧的构建缓存和残留备份
const nextDir = join(appDir, ".next");
if (existsSync(nextDir)) {
  console.log("[static-build] 🧹 清理 .next 构建缓存...");
  execSync(`rm -rf "${nextDir}"`);
  console.log("[static-build]    ✓ 缓存已清理\n");
}

// 清理可能残留的上次备份
if (existsSync(apiBackupDir)) {
  console.log("[static-build] 🧹 清理残留 API 备份...");
  execSync(`rm -rf "${apiBackupDir}"`);
}

console.log("[static-build] 🚀 开始静态导出构建...\n");

// Step 1: 备份 API 路由
if (existsSync(apiDir)) {
  console.log("[static-build] 📦 临时移除 API 路由...");
  renameSync(apiDir, apiBackupDir);
  console.log("[static-build]    ✓ API 路由已备份\n");
} else {
  console.log("[static-build] ⚠️  API 路由目录不存在，跳过备份\n");
}

try {
  // Step 2: 构建
  console.log("[static-build] 🔨 执行 next build...");
  execSync("npx next build", {
    cwd: appDir,
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_EXPORT: "true",
      NODE_ENV: "production",
      // 注入 basePath 供 ServiceWorkerRegistration 使用
      NEXT_PUBLIC_BASE_PATH: process.env.NEXT_BASE_PATH || "",
    },
  });
  console.log("[static-build] ✅ 构建成功！\n");

// Step 3: 添加 .nojekyll（GitHub Pages 需要）
const outDir = join(appDir, "out");
const nojekyll = join(outDir, ".nojekyll");
writeFileSync(nojekyll, "");
console.log("[static-build]    ✓ .nojekyll 已添加");

  // Step 3.5: 修复 manifest.json 的 basePath（GitHub Pages 子路径兼容）
  const basePath = process.env.NEXT_BASE_PATH || "";
  if (basePath) {
    const manifestPath = join(outDir, "manifest.json");
    if (existsSync(manifestPath)) {
      console.log(`[static-build] 🔧 修复 manifest.json basePath: ${basePath}`);
      let manifest = readFileSync(manifestPath, "utf-8");
      const parsed = JSON.parse(manifest);

      // 修复 start_url
      parsed.start_url = basePath + "/";

      // 修复 icons src
      if (parsed.icons) {
        parsed.icons = parsed.icons.map((icon) => ({
          ...icon,
          src: basePath + icon.src,
        }));
      }

      // 修复 shortcuts icons
      if (parsed.shortcuts) {
        parsed.shortcuts = parsed.shortcuts.map((s) => ({
          ...s,
          url: basePath + s.url,
          icons: s.icons
            ? s.icons.map((i) => ({ ...i, src: basePath + i.src }))
            : s.icons,
        }));
      }

      writeFileSync(manifestPath, JSON.stringify(parsed, null, 2));
      console.log("[static-build]    ✓ manifest.json 路径已修复\n");
    }
  }
  console.log("");
} finally {
  // Step 3: 恢复 API 路由
  if (existsSync(apiBackupDir)) {
    console.log("[static-build] 📦 恢复 API 路由...");
    renameSync(apiBackupDir, apiDir);
    console.log("[static-build]    ✓ API 路由已恢复\n");
  }
}

console.log("[static-build] 🎉 静态导出完成！输出目录: packages/app/out/");
console.log("[static-build]    部署到 GitHub Pages: 将 out/ 目录推送到 gh-pages 分支");

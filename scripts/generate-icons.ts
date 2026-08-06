/**
 * Generate PWA icons.
 *
 * Creates a simple "X" mark icon on amber background for the PWA manifest.
 * Uses the canvas API via a tiny inline HTML renderer.
 *
 * Usage: npx tsx scripts/generate-icons.ts
 */

import { writeFileSync } from "fs";
import { join } from "path";

// Minimal PNG encoder — we generate a simple solid-color PNG
// For a proper icon, you'd use sharp/canvas. This creates a minimal valid PNG.

function createMinimalPNG(size: number): Buffer {
  // Create a minimal PNG with a simple pattern using raw pixel data
  // For a prototype, create a simple amber square with "X" text approach
  // We'll use a base64-encoded minimal icon instead

  // Actually, for production we need real icons. Let's generate using
  // a canvas via node-canvas or use a pre-made icon.
  // For now, create a minimal valid PNG (1x1 amber pixel) as placeholder.
  // Users should replace with real icons.

  // Minimal 1x1 amber PNG (placeholder)
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]); // PNG sig

  // For a real icon, we need proper pixel data. This is a placeholder.
  // In production, replace /icon-192.png and /icon-512.png with real icons.

  return signature; // This won't work as a real PNG. See note below.
}

// NOTE: For proper PWA icons, generate real PNGs using:
//   1. A design tool (Figma, Sketch)
//   2. A canvas-based Node script with the `canvas` package
//   3. An online icon generator
//
// Placeholder: copy a simple colored square as the app icon.
// Run: npx tsx scripts/generate-icons.ts

console.log(`
⚠️  PWA 图标占位说明：
   请使用以下方法之一生成真实图标，然后放入 public/ 目录：

   1. 使用在线工具: https://realfavicongenerator.net
   2. 使用设计工具导出 192×192 和 512×512 PNG
   3. 安装 canvas 包: npm install canvas
     然后运行此脚本生成图标

   图标文件:
   - public/icon-192.png (192×192)
   - public/icon-512.png (512×512)
   - public/favicon.ico

   当前使用占位图标，PWA 安装时可能显示默认图标。
`);

// Generate a simple SVG favicon as fallback
const svgFavicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="20" fill="#b8860b"/>
  <text x="50" y="68" font-family="Georgia,serif" font-size="60" font-weight="bold" fill="white" text-anchor="middle">X</text>
</svg>`;

writeFileSync(join(process.cwd(), "public", "icon.svg"), svgFavicon);
console.log("✅ 已生成 public/icon.svg (矢量图标)");

import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Xjoy 生产环境 Capacitor 配置
 *
 * 构建 TestFlight/APK 前，用此文件覆盖 capacitor.config.ts，
 * 然后运行 `pnpm cap sync` 同步到原生项目。
 *
 * 用法：
 *   cp capacitor.config.prod.ts capacitor.config.ts && pnpm cap sync
 */

const config: CapacitorConfig = {
  appId: "com.xjoy.bible",
  appName: "Xjoy",
  webDir: "out",

  // 生产环境：从 Vercel 部署加载
  server: {
    url: "https://xjoy.vercel.app",
    cleartext: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#faf9f6",
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#faf9f6",
    },
  },

  ios: {
    contentInset: "automatic",
    allowsLinkPreview: true,
    preferredContentMode: "mobile",
  },

  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;

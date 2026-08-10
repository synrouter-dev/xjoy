import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.xjoy.bible",
  appName: "Xjoy",
  webDir: "out",

  // 开发模式：从本地 Next.js dev server 加载
  // 生产模式：注释掉 server 配置，从 Vercel 部署加载
  server: process.env.CAPACITOR_DEV
    ? {
        url: "http://192.168.1.100:3000",
        cleartext: true,
      }
    : undefined,

  // 原生插件配置
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
    // 允许的导航方向
    allowsLinkPreview: true,
    // 状态栏样式
    preferredContentMode: "mobile",
  },

  android: {
    // Android 边距处理
    allowMixedContent: true,
    // 捕获后退按钮
    captureInput: true,
    // WebView 缩放
    webContentsDebuggingEnabled: false,
  },
};

export default config;

# Xjoy 移动端原生分发指南

将 Xjoy Next.js 应用封装为原生 iOS/Android App，通过 TestFlight 和 APK 分发。

## 架构概览

```
┌─────────────────────────────────────────────────┐
│                Vercel (Next.js)                  │
│         https://xjoy.vercel.app                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Web App  │  │ API Routes│  │ AI Chat (RAG)│   │
│  └──────────┘  └──────────┘  └──────────────┘   │
│                       │                          │
│              Neon PostgreSQL                     │
└───────────────────────┼──────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────▼────┐   ┌──────▼──────┐   ┌───▼────┐
   │ Browser │   │  iOS App    │   │Android │
   │  (PWA)  │   │ Capacitor   │   │  App   │
   └─────────┘   │ + WebView   │   └────────┘
                 └─────────────┘
```

**关键决策**：使用 Server URL 模式（而非 bundled assets）：
- 原生 App 中的 WebView 加载 Vercel 部署的 Web 应用
- API 调用直接访问同一 Vercel 后端
- 无需重复构建 web 资源
- 适合依赖网络连接的 AI 应用

## 前置条件

### iOS
- [ ] Apple Developer Program 会员（$99/年）
- [ ] Xcode 16+（macOS）
- [ ] App Store Connect 中已创建 App：`com.xjoy.bible`
- [ ] App Store Connect API Key（用于 CI 上传 TestFlight）

### Android
- [ ] Google Play Developer 账号（$25 一次性）
- [ ] Android Studio + JDK 17
- [ ] 签名密钥（keystore）用于发布 APK

### 两者
- [ ] Vercel 项目部署就绪（vercel.json 已配置）
- [ ] Neon PostgreSQL 数据库运行中
- [ ] 1024×1024 PNG 应用图标

## 快速开始

### 1. 生成应用图标

```bash
# 准备一个 1024x1024 的 PNG 图标放在 packages/app/public/
cp your-icon-1024.png packages/app/public/icon-1024.png

# 生成所有尺寸
./scripts/generate_app_icons.sh
```

### 2. 配置生产环境 URL

编辑 `packages/app/capacitor.config.prod.ts`，将 `server.url` 改为你的 Vercel 域名：

```ts
server: {
  url: "https://your-domain.vercel.app",  // ← 改这里
  cleartext: false,
},
```

### 3. 本地构建测试

```bash
# iOS
./scripts/build_mobile.sh ios

# Android
./scripts/build_mobile.sh android

# 两者
./scripts/build_mobile.sh all
```

## iOS TestFlight 分发

### 初次配置

1. **在 Xcode 中配置签名**（只需一次）：
   ```bash
   open packages/app/ios/App/App.xcworkspace
   ```
   - 选择 App target → Signing & Capabilities
   - 勾选 "Automatically manage signing"
   - 选择你的 Team
   - Bundle Identifier: `com.xjoy.bible`

2. **创建 App Store Connect API Key**：
   - 访问 https://appstoreconnect.apple.com/access/integrations/api
   - 创建 "App Store Connect API" 类型的 Key
   - 下载 `.p8` 文件
   - 记下 Key ID 和 Issuer ID

3. **配置 GitHub Secrets**（用于 CI）：
   ```
   APP_STORE_CONNECT_API_KEY_ID     = "ABC123..."
   APP_STORE_CONNECT_API_ISSUER_ID  = "xxxxx-xxxx-..."
   APP_STORE_CONNECT_API_KEY        = base64 编码的 .p8 文件内容
   ```

4. **可选：配置 Fastlane Match**（多设备/团队开发）：
   ```bash
   cd packages/app/ios/App
   fastlane match init
   fastlane match appstore
   ```

### CI 触发 TestFlight 构建

```bash
# 方式 1: 推送 tag
git tag ios-v0.1.0
git push origin ios-v0.1.0

# 方式 2: 手动触发
# GitHub → Actions → iOS Build → Run workflow
```

构建完成后，在 App Store Connect → TestFlight 中：
1. 填写出口合规信息（Xjoy 不包含加密，选 Exempt）
2. 添加内部测试员（Internal Testers）
3. 添加外部测试组（External Testers，需要 Beta App Review）

### 本地手动上传 TestFlight

```bash
cd packages/app/ios/App

# 使用 Fastlane
fastlane ios beta

# 或通过 Xcode:
# Product → Archive → Distribute App → TestFlight & App Store
```

## Android APK 分发

### 生成签名密钥

```bash
keytool -genkey -v \
  -keystore xjoy-release.keystore \
  -alias xjoy \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storetype JKS
```

**重要**：安全保存密钥文件和密码。丢失后无法更新 Google Play 上的应用。

### 配置 GitHub Secrets

```
ANDROID_KEYSTORE_BASE64   = base64 -i xjoy-release.keystore
ANDROID_KEYSTORE_PASSWORD = <keystore password>
ANDROID_KEY_ALIAS         = xjoy
ANDROID_KEY_PASSWORD      = <key password>
```

### CI 触发 APK 构建

```bash
# 方式 1: 推送 tag
git tag android-v0.1.0
git push origin android-v0.1.0

# 方式 2: 手动触发
# GitHub → Actions → Android Build → Run workflow
```

构建完成后，APK 作为 GitHub Actions Artifact 下载（保留 30 天）。

### 分发渠道

| 渠道 | 适用场景 | 方式 |
|------|---------|------|
| **直接 APK 下载** | 初期测试（< 100 用户） | 上传到 Firebase App Distribution 或直接分享 APK |
| **Google Play 内部测试** | 团队内部（< 100 人） | Google Play Console → Internal Testing |
| **Google Play 封闭测试** | 受邀用户 | Google Play Console → Closed Testing |
| **Google Play 正式版** | 公开发布 | Google Play Console → Production |

## Vercel 部署（首次配置）

```bash
# 安装 Vercel CLI
pnpm add -g vercel

# 登录
vercel login

# 部署（在项目根目录）
vercel --prod

# 设置环境变量
vercel env add DATABASE_URL
vercel env add ANTHROPIC_API_KEY
vercel env add NEXT_PUBLIC_SENTRY_DSN
```

Vercel 会根据 `vercel.json` 中的配置自动检测 Next.js 框架和 pnpm monorepo。

## 版本管理

```bash
# iOS: 在 Xcode 中设置版本
# 或通过 agvtool:
cd packages/app/ios/App
agvtool new-marketing-version 0.1.0
agvtool new-version -all 1

# Android: 在 android/app/build.gradle.kts 中设置
# versionCode 和 versionName

# Web: 遵循 semver，tag 与 native 版本协调
git tag v0.1.0  # web 版本
git tag ios-v0.1.0  # iOS 构建
git tag android-v0.1.0  # Android 构建
```

## 技术栈

| 层 | 技术 | 用途 |
|----|------|------|
| Web 前端 | Next.js 16 + React 19 | PWA + 原生 WebView 内容 |
| 后端 | Next.js API Routes (Vercel) | REST API + AI Chat |
| 数据库 | Neon (serverless PostgreSQL) | 经文数据、向量嵌入、用户数据 |
| 原生壳 | Capacitor 8 | WebView 封装 + 原生插件 |
| iOS 分发 | Fastlane + TestFlight | 构建签名 + 分发 |
| Android 分发 | Gradle + APK | 构建签名 + 分发 |
| CI/CD | GitHub Actions | 自动化构建 |

## 常见问题

### Q: Apple 会拒绝纯 WebView 应用吗？
A: 不会，只要应用提供有意义的功能。Xjoy 拥有离线缓存（Service Worker）、原生状态栏、启动画面等原生集成，符合 App Store 审核要求。

### Q: 为什么不用 React Native / Flutter？
A: 作为单人团队，复用现有 Next.js PWA 通过 Capacitor 封装是最快路径。未来若需要深度原生功能可再评估。

### Q: 用户必须有网络连接吗？
A: 是的。AI 功能和经文搜索需要后端 API。Service Worker 提供了基础的离线缓存（已读章节、UI 资源），但核心功能依赖网络。

### Q: 如何处理 App Store 的"出口合规"问题？
A: Info.plist 中已设置 `ITSAppUsesNonExemptEncryption = false`（Xjoy 使用标准 HTTPS，属于 exempt 范畴）。

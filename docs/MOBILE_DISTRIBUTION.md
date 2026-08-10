# Xjoy 移动端分发指南

> TestFlight (iOS) / APK (Android) 构建与分发操作手册

## 架构概述

```
┌──────────────────────────────────────────────┐
│                 Vercel 云端                    │
│  ┌────────────────────────────────────────┐  │
│  │   Next.js App (SSR + API Routes)       │  │
│  │   • AI 聊天 (/api/chat)                │  │
│  │   • 经文查询 (/api/verses)             │  │
│  │   • 书签/笔记/学习功能                  │  │
│  └────────────────────────────────────────┘  │
│                    ▲                          │
└────────────────────│──────────────────────────┘
                     │ HTTPS
┌────────────────────│──────────────────────────┐
│              Capacitor 原生壳                   │
│  ┌────────────────────────────────────────┐   │
│  │  iOS App (TestFlight)                  │   │
│  │  • 从 Vercel 加载内容                  │   │
│  │  • 原生 Splash Screen                  │   │
│  │  • 原生 Status Bar                     │   │
│  └────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────┐   │
│  │  Android App (APK)                     │   │
│  │  • 从 Vercel 加载内容                  │   │
│  │  • 原生 Splash Screen                  │   │
│  └────────────────────────────────────────┘   │
└───────────────────────────────────────────────┘
```

**为什么不直接打包静态文件？**
Xjoy 依赖服务端 API routes（AI 聊天、数据库查询等），无法完全静态导出。采用"原生壳 + 云端内容"的架构，同时获得原生分发渠道和完整的后端能力。

## 前置条件

### 账号与服务

| 项目 | 用途 | 获取方式 |
|------|------|---------|
| Apple Developer Account | iOS 签名与 TestFlight 分发 | [developer.apple.com](https://developer.apple.com)，$99/年 |
| Google Play Console | Android 分发 | [play.google.com/console](https://play.google.com/console)，$25 一次性 |
| Vercel Account | Next.js 部署 | [vercel.com](https://vercel.com)，Hobby 免费层 |
| Neon Database | PostgreSQL + pgvector | [neon.tech](https://neon.tech)，免费层 |

### 开发环境 (macOS)

| 工具 | 最低版本 | 安装方式 |
|------|---------|---------|
| Xcode | 16+ | Mac App Store |
| Android Studio | Ladybug+ | [developer.android.com](https://developer.android.com/studio) |
| JDK | 17 | `brew install openjdk@17` |
| Node.js | 22+ | `brew install node` |
| pnpm | 9+ | `npm install -g pnpm` |

### 环境变量

在 Vercel 项目设置中配置以下 Environment Variables：

```bash
DATABASE_URL=postgresql://user:pass@ep-xxxx.us-east-2.aws.neon.tech/dbname?sslmode=require
ANTHROPIC_API_KEY=sk-ant-api03-xxxx
OPENAI_API_KEY=sk-xxxx  # 如果使用 OpenAI 兼容 API
```

## Phase 1：Vercel 部署

### 1.1 安装 Vercel CLI

```bash
npm install -g vercel
```

### 1.2 部署

```bash
cd packages/app

# 首次部署（交互式设置）
vercel

# 后续部署（生产环境）
vercel --prod
```

### 1.3 验证部署

```bash
# 健康检查
curl https://xjoy.vercel.app/api/health

# 预期响应：{ "status": "ok" }
```

### 1.4 绑定自定义域名（可选）

```bash
# 在 Vercel Dashboard → Settings → Domains 中添加
# 或通过 CLI：
vercel domain add xjoy.app
```

更新 `capacitor.config.prod.ts` 中的 `server.url` 为实际域名。

## Phase 2：构建原生应用

### 2.1 生成 App 图标

```bash
# 1. 准备 1024x1024 的 PNG 图标
cp your-icon-1024.png packages/app/public/icon-1024.png

# 2. 生成所有尺寸
bash scripts/generate_app_icons.sh
```

> 如无 1024 图标，脚本会自动使用 `public/icon-512.png` 并上采样。

### 2.2 同步 Capacitor 配置

```bash
cd packages/app

# 切换到生产配置
cp capacitor.config.prod.ts capacitor.config.ts

# 同步到原生项目
pnpm cap sync

# 恢复开发配置
git checkout capacitor.config.ts
```

### 2.3 iOS — 构建并上传 TestFlight

#### 首次配置

1. 在 Xcode 中打开 `ios/App/App.xcworkspace`
2. 选择 target `App` → Signing & Capabilities
3. 选择你的 Team（Apple Developer Account）
4. 确保 Bundle Identifier 为 `com.xjoy.bible`（或修改为你自己的）
5. 在 `Info.plist` 中确认 `ITSAppUsesNonExemptEncryption` 为 `NO`

#### 构建和上传

```bash
# 方法 1：通过脚本
bash scripts/build_mobile.sh ios

# 方法 2：通过 Xcode GUI
# 1. 选择目标设备为 "Any iOS Device (arm64)"
# 2. Product → Archive
# 3. Window → Organizer → Distribute App
# 4. 选择 "TestFlight & App Store"
```

#### TestFlight 分发流程

1. 上传成功后，登录 [App Store Connect](https://appstoreconnect.apple.com)
2. 进入 TestFlight → 选择构建版本
3. 添加测试人员（内部测试：最多 100 人，无需审核）
4. 测试人员通过 TestFlight App 安装

#### 首次 App Store 审核清单

- [ ] 隐私政策 URL（可放在 Vercel 部署中）
- [ ] 应用截图（6.7" iPhone + 12.9" iPad）
- [ ] 应用描述和关键词
- [ ] 内容分级问卷（参考类应用通常为 4+）
- [ ] App 审核备注（说明 AI 聊天功能）

### 2.4 Android — 构建 APK

#### 生成签名密钥（首次）

```bash
cd packages/app/android

keytool -genkey -v \
  -keystore xjoy-release.keystore \
  -alias xjoy \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# 记下密钥密码和别名密码！
# 将 keystore 文件安全保存（不要提交到 git）
```

#### 配置签名

在 `android/app/build.gradle` 的 `android` 块中添加：

```groovy
signingConfigs {
    release {
        storeFile file('xjoy-release.keystore')
        storePassword System.getenv('XJOY_KEYSTORE_PASSWORD')
        keyAlias 'xjoy'
        keyPassword System.getenv('XJOY_KEY_PASSWORD')
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        // ...
    }
}
```

#### 构建 APK

```bash
# 通过脚本
bash scripts/build_mobile.sh android

# 或手动
cd packages/app/android
./gradlew assembleRelease
```

APK 输出路径：`android/app/build/outputs/apk/release/app-release.apk`

#### 分发方式

| 方式 | 适用场景 | 操作 |
|------|---------|------|
| 直接分发 | 少量测试用户 | 发送 APK 文件，用户手动安装 |
| Google Play 内部测试 | 最多 100 人 | Play Console → 内部测试 |
| Google Play 封闭测试 | 最多 2000 人 | Play Console → 封闭测试 |
| Google Play 正式版 | 公开发布 | Play Console → 正式版 |

## 日常开发流程

```bash
# 1. 本地开发（Web 模式）
cd packages/app
pnpm dev

# 2. 本地开发（移动端模式 — 连接本地 dev server）
CAPACITOR_DEV=1 pnpm dev
# 然后在 Xcode/Android Studio 中运行原生项目

# 3. 部署到 Vercel
vercel --prod

# 4. 移动端自动获取更新（无需重新构建 APK/IPA）
# 因为内容从 Vercel 加载，部署即更新
```

## 故障排查

### iOS 构建失败

| 问题 | 解决方案 |
|------|---------|
| `Signing requires a team` | 在 Xcode → Signing & Capabilities 中选择 Team |
| `No provisioning profile` | Xcode → Preferences → Accounts 确认账号登录 |
| `AppIcon missing` | 运行 `bash scripts/generate_app_icons.sh` |
| `Module not found` | 运行 `pnpm cap sync` 重新同步插件 |

### Android 构建失败

| 问题 | 解决方案 |
|------|---------|
| `SDK not found` | Android Studio → SDK Manager 安装 API 36 |
| `JDK version mismatch` | 确保 `JAVA_HOME` 指向 JDK 17 |
| `Gradle sync failed` | 运行 `cd android && ./gradlew clean` |
| `Keystore not found` | 检查 `xjoy-release.keystore` 路径 |

### App 白屏或无法加载

| 问题 | 解决方案 |
|------|---------|
| Vercel 部署不可达 | 检查 `curl https://xjoy.vercel.app/api/health` |
| ATS 阻止 HTTP | Info.plist 中已配置 `vercel.app` 例外 |
| 网络权限未授予 | Android: 确认 INTERNET permission 存在 |
| server.url 配置错误 | 检查 `capacitor.config.prod.ts` 域名 |

## 安全注意事项

- ⚠️ **绝不**将签名密钥（keystore）或配置文件提交到 Git
- ⚠️ **绝不**在客户端代码中硬编码 API Key
- ✅ 所有敏感环境变量通过 Vercel Environment Variables 管理
- ✅ `.gitignore` 已配置忽略 `capacitor.config.ts`（自动生成）
- ✅ 生产构建使用 `capacitor.config.prod.ts`

# Xjoy 生产部署指南

本文档描述将 Xjoy 部署到 **Vercel + Neon**（推荐）或 Fly.io 的完整流程。

## 部署架构

```
                     ┌──────────────┐
                     │    GitHub     │
                     │  (git push)   │
                     └──────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
       ┌──────▼──────┐ ┌───▼────┐ ┌──────▼──────┐
       │   Vercel    │ │  Neon  │ │  Anthropic  │
       │  (Next.js)  │ │  (PG)  │ │    API      │
       │  CDN + Edge │ │+vector │ │  (Claude)   │
       └─────────────┘ └────────┘ └─────────────┘
```

- **Vercel**：Next.js 托管 + 全球 CDN + 自动 HTTPS
- **Neon**：Serverless PostgreSQL，支持 pgvector，自带连接池
- **Claude API**：AI 经文问答（RAG 管道）

---

## 快速开始：Vercel + Neon（推荐）

这是当前推荐的生产部署路径，适用于 PWA 分发和用户测试。

### 前置条件

- [ ] **Vercel 账户** — https://vercel.com（Hobby 计划免费）
- [ ] **Neon 账户** — https://neon.tech（免费计划：0.5GB 存储、1 个项目）
- [ ] **Anthropic API Key** — https://console.anthropic.com
- [ ] **GitHub 仓库** — 代码已推送到 GitHub
- [ ] **（可选）Sentry 账户** — 错误追踪
- [ ] **（可选）OpenAI API Key** — 向量嵌入（不设置则使用全文搜索）

### 第一步：Neon 数据库设置

#### 1.1 创建 Neon 项目

1. 登录 [Neon Console](https://console.neon.tech)
2. 点击 **New Project**
3. 填写：
   - **Name**: `xjoy`
   - **Region**: 选择离用户最近的区域（亚洲用户选 `ap-southeast-1` 新加坡，美国用户选 `us-east-1`）
   - **Postgres version**: `17`
4. 点击 **Create Project**

#### 1.2 获取连接字符串

创建完成后，在 **Connection Details** 面板中：

1. **重要**：选择 **Pooled connection**（适配 serverless 连接池）
2. 复制连接字符串，格式类似：
   ```
   postgresql://xjoy_owner:xxxxx@ep-cool-breeze-123456-pooler.ap-southeast-1.aws.neon.tech/xjoy?sslmode=require
   ```
3. 这就是 `DATABASE_URL`，保存备用

#### 1.3 运行数据库迁移

Neon 默认启用 pgvector，可以直接运行迁移：

```bash
# 设置环境变量后运行迁移
DATABASE_URL="<你的 Neon 连接字符串>" pnpm db:migrate
```

输出应显示："Migration complete."

#### 1.4 导入 KJV 经文数据

```bash
DATABASE_URL="<你的 Neon 连接字符串>" pnpm db:seed
```

这会导入 31,102 节经文。预计耗时 ~30 秒。

验证数据导入：

```bash
DATABASE_URL="<你的 Neon 连接字符串>" psql -c "SELECT COUNT(*) FROM verses;"
# 预期：31102
```

#### 1.5 （可选）导入交叉引用

如果之前已下载交叉引用数据：

```bash
DATABASE_URL="<你的 Neon 连接字符串>" pnpm data:crossrefs
```

### 第二步：Vercel 部署

#### 2.1 导入 GitHub 仓库

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **Add New → Project**
3. 选择 Xjoy 的 GitHub 仓库
4. 点击 **Import**

#### 2.2 配置项目

Vercel 会自动检测 Next.js 框架。确认以下配置：

| 配置项 | 值 | 说明 |
|-------|-----|------|
| Framework | Next.js | 自动检测 |
| Root Directory | `packages/app` | 如果从根目录导入需设置，否则留空 |
| Build Command | `pnpm turbo build --filter=@xjoy/app` | monorepo 构建命令 |
| Install Command | `pnpm install --frozen-lockfile` | 使用 pnpm |
| Output Directory | `packages/app/.next` | Next.js 输出目录 |

> **注意**：`vercel.json` 已包含上述配置，Vercel 会优先使用文件配置。

#### 2.3 设置环境变量

在 Vercel Dashboard → Settings → Environment Variables，添加以下变量：

**必需变量：**

| 变量名 | 值 | 说明 |
|-------|-----|------|
| `DATABASE_URL` | `<Neon 连接字符串>` | Neon pooled connection |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Claude API key |

**推荐变量：**

| 变量名 | 值 | 说明 |
|-------|-----|------|
| `NEXT_PUBLIC_APP_URL` | `https://你的域名.vercel.app` | 应用公开 URL |
| `NEXT_PUBLIC_SENTRY_DSN` | `https://...` | Sentry DSN |
| `SENTRY_AUTH_TOKEN` | `sntrys_...` | Sentry 认证令牌 |
| `SENTRY_ORG` | `<org slug>` | Sentry 组织 |
| `SENTRY_PROJECT` | `xjoy` | Sentry 项目名 |

**可选变量：**

| 变量名 | 值 | 说明 |
|-------|-----|------|
| `OPENAI_API_KEY` | `sk-...` | 向量嵌入（不设置回退到全文搜索） |
| `DB_MAX_CONNECTIONS` | `10` | 数据库连接池最大值 |

> **重要**：所有环境变量也应在本地 `.env.local` 中设置，以便本地开发。

#### 2.4 首次部署

1. 点击 **Deploy**
2. 等待构建完成（约 2-3 分钟）
3. 部署完成后，应用在 `https://你的项目名.vercel.app` 可访问

#### 2.5 验证部署

```bash
# 健康检查
curl https://你的域名.vercel.app/api/health
# 预期：{"status":"ok","timestamp":"...","db":"ok"}

# 经文查询
curl "https://你的域名.vercel.app/api/verses?ref=John+3:16"
# 预期：返回 John 3:16 经文
```

### 第三步：PWA 验证

部署到 Vercel 后，验证 PWA 功能：

#### 3.1 Chrome/Edge (Android/Desktop)

1. 打开 Chrome DevTools → Application → Manifest
2. 确认 manifest 正确加载，无错误
3. 检查 Service Workers 已注册
4. 地址栏应出现"安装"按钮

#### 3.2 Safari (iOS)

1. 用 Safari 打开应用 URL
2. 点击分享按钮 → "添加到主屏幕"
3. 确认名称、图标正确显示
4. 从主屏幕打开应无浏览器工具栏（standalone 模式）

#### 3.3 离线测试

1. 在线状态下先访问应用一次（缓存资源）
2. 开启飞行模式
3. 再次打开应用 — 应显示基本 UI 和缓存页面
4. API 调用应显示离线提示

#### 3.4 PWA 检查清单

- [ ] 应用可安装（manifest 有效）
- [ ] 图标显示正常（192x192 和 512x512）
- [ ] iOS 添加到主屏幕正常
- [ ] Service Worker 注册成功
- [ ] 离线时显示基本 UI
- [ ] HTTPS 正常（Vercel 自动提供）

### 第四步：测试用户访问

#### 4.1 Vercel 域名保护（可选）

对于 5-10 人的封闭测试，可以设置简单的访问控制：

**方案 A：Vercel 密码保护（最简单）**

在 Vercel Dashboard → Settings → Deployment Protection：
- 启用 **Vercel Authentication**
- 或启用 **Password Protection** 设置共享密码

**方案 B：不设保护（推荐起步阶段）**

直接分享 Vercel 域名。KJV 经文是公开内容，暂无敏感数据。

#### 4.2 分享给测试用户

1. 发送 Vercel 部署 URL（如 `https://xjoy.vercel.app`）
2. 指导用户在手机浏览器中打开
3. **Android**：Chrome 会提示"安装应用"
4. **iOS**：指导通过 Safari → 分享 → 添加到主屏幕

#### 4.3 收集反馈

应用内已有反馈收集功能（`/feedback` 页面）。

---

## 替代方案：Fly.io 部署

如果 Vercel 不适用，可使用 Fly.io 作为替代。

### Fly.io 部署步骤

#### 1. 安装 Fly CLI

```bash
brew install flyctl
fly auth login
```

#### 2. 创建应用

```bash
fly apps create xjoy
```

#### 3. 创建 PostgreSQL（带 pgvector）

```bash
fly postgres create --name xjoy-db --region iad
fly postgres attach --app xjoy xjoy-db
```

#### 4. 配置密钥

```bash
fly secrets set ANTHROPIC_API_KEY="sk-ant-..." -a xjoy
fly secrets set NEXT_PUBLIC_APP_URL="https://xjoy.fly.dev" -a xjoy
# 可选
fly secrets set OPENAI_API_KEY="sk-..." -a xjoy
fly secrets set NEXT_PUBLIC_SENTRY_DSN="https://..." -a xjoy
```

#### 5. 部署

```bash
fly deploy -a xjoy
```

应用将在 `https://xjoy.fly.dev` 可访问。

#### 6. 数据库初始化

Fly.io 的 `prod-entrypoint.js` 会自动运行迁移和数据导入。首次部署后等待约 1 分钟即可。

---

## 环境变量速查

| 变量 | 必需？ | 用途 |
|-----|-------|------|
| `DATABASE_URL` | ✅ 必需 | PostgreSQL 连接字符串（Neon pooled 连接） |
| `ANTHROPIC_API_KEY` | ✅ 必需 | Claude API 访问 |
| `ANTHROPIC_BASE_URL` | ❌ | 自定义 API 端点（如 DeepSeek 代理） |
| `ANTHROPIC_MODEL` | ❌ | 模型选择（默认 haiku） |
| `OPENAI_API_KEY` | ❌ | 向量嵌入（不设置回退到全文搜索） |
| `NEXT_PUBLIC_APP_URL` | ❌ 推荐 | 应用公开 URL |
| `NEXT_PUBLIC_SENTRY_DSN` | ❌ 推荐 | 前端错误追踪 |
| `SENTRY_AUTH_TOKEN` | ❌ 推荐 | 后端错误追踪 |
| `SENTRY_ORG` | ❌ 推荐 | Sentry 组织 |
| `SENTRY_PROJECT` | ❌ 推荐 | Sentry 项目 |
| `DB_MAX_CONNECTIONS` | ❌ | 连接池最大值（默认 10） |

---

## 常见问题

### Vercel 构建失败

1. 确认 `vercel.json` 中的 `buildCommand` 正确
2. 确认 pnpm workspace 配置正确（`pnpm-workspace.yaml`）
3. 检查 TypeScript 是否有错误（本地先运行 `pnpm typecheck`）

### Neon 连接失败

1. 确认使用 **Pooled connection** 字符串（含 `-pooler` 子域名）
2. 确认连接字符串末尾有 `?sslmode=require`
3. 检查 Neon 项目是否处于 `Active` 状态（免费项目闲置后会暂停，首次连接自动唤醒，约 3-5 秒）

### API 路由超时

Vercel Hobby 计划限制：
- 函数执行时间最长 10 秒
- AI Chat 路由响应较慢（5-8 秒），但仍在限制内
- 如果频繁超时，检查 Anthropic API 延迟

### pgvector 不可用

Neon 默认启用 pgvector。如果不可用：
- 检查 Neon 项目 → Settings → Beta 功能 → pgvector 是否启用
- 如果不启用 pgvector，RAG 管道自动回退到 PostgreSQL 全文搜索（FTS）

### 数据库连接池耗尽

错误信息：`too many clients`

解决方案：
1. 在 Vercel 环境变量中设置 `DB_MAX_CONNECTIONS=5`（Neon 免费计划限制 10 个连接）
2. 检查是否有连接泄漏（确保 `pool.end()` 调用正确）

### 首次部署后经文数据为空

确认已运行 `pnpm db:seed` 导入数据。可以在本地运行连接到 Neon：

```bash
DATABASE_URL="<Neon 连接字符串>" pnpm db:seed
```

---

## 相关文档

- [移动端原生分发指南](MOBILE_DIST.md) — 通过 Capacitor + TestFlight/APK 分发生成本地 App
- [移动端分发状态](MOBILE_DISTRIBUTION.md) — 当前分发阻塞状态和解决路径
- [测试计划](testing-plan.md) — 用户测试流程和验收标准

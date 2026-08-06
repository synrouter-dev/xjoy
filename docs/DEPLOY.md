# Xjoy 生产部署指南

本文档描述将 Xjoy 部署到 Fly.io 生产环境的完整流程。

## 前置条件

在开始之前，需要以下账户和服务：

- [ ] **Fly.io 账户** — https://fly.io（免费额度足够 MVP 使用）
- [ ] **GitHub 仓库** — 代码已推送到 GitHub
- [ ] **Anthropic API Key** — https://console.anthropic.com（Claude API 访问）
- [ ] **OpenAI API Key** — https://platform.openai.com（用于向量嵌入，可选）
- [ ] **Sentry 账户** — https://sentry.io（错误追踪，免费 tier 足够）
- [ ] **自定义域名**（可选）— 从域名注册商获取

## 第一步：Fly.io 部署

### 1.1 安装 Fly CLI 并登录

```bash
# macOS
brew install flyctl

# 登录
fly auth login
```

### 1.2 创建 Fly.io 应用（如果尚未创建）

```bash
fly apps create xjoy
```

### 1.3 创建 PostgreSQL 数据库（带 pgvector）

```bash
# Fly.io 提供托管的 PostgreSQL + pgvector
fly postgres create --name xjoy-db --region iad

# 创建成功后，获取连接字符串
fly postgres attach --app xjoy xjoy-db
```

这会自动创建 `DATABASE_URL` secret 并注入到应用中。

### 1.4 配置生产环境密钥

```bash
# Claude API（必需）
fly secrets set ANTHROPIC_API_KEY="sk-ant-..." -a xjoy

# OpenAI API（可选 — 不设置则回退到纯全文搜索）
fly secrets set OPENAI_API_KEY="sk-..." -a xjoy

# Sentry 配置
fly secrets set NEXT_PUBLIC_SENTRY_DSN="https://..." -a xjoy
fly secrets set SENTRY_AUTH_TOKEN="sntrys_..." -a xjoy
fly secrets set SENTRY_ORG="your-org" -a xjoy
fly secrets set SENTRY_PROJECT="xjoy" -a xjoy

# 应用 URL
fly secrets set NEXT_PUBLIC_APP_URL="https://xjoy.fly.dev" -a xjoy
```

### 1.5 首次部署

```bash
fly deploy -a xjoy
```

部署完成后，应用会在 `https://xjoy.fly.dev` 可访问。

## 第二步：GitHub Actions 密钥配置

在 GitHub 仓库中，进入 **Settings → Secrets and variables → Actions**，添加以下 secrets：

| Secret 名称 | 说明 | 获取方式 |
|---|---|---|
| `FLY_API_TOKEN` | Fly.io 部署令牌 | `fly tokens create deploy` |
| `SENTRY_AUTH_TOKEN` | Sentry 认证令牌 | Sentry → Settings → Auth Tokens |
| `SENTRY_ORG` | Sentry 组织名称 | Sentry 组织 slug |
| `SENTRY_PROJECT` | Sentry 项目名称 | 通常为 `xjoy` |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN | Sentry → Project → Settings → Client Keys |

配置完成后，`git push main` 将自动触发 lint → test → build → deploy 流水线。

## 第三步：自定义域名和 SSL

### 3.1 添加域名证书

```bash
fly certs create your-domain.com -a xjoy
fly certs create www.your-domain.com -a xjoy
```

### 3.2 配置 DNS

在域名注册商处添加以下 DNS 记录：

| 类型 | 名称 | 值 |
|---|---|---|
| A | @ | Fly.io IPv4 地址（`fly ips list -a xjoy`） |
| AAAA | @ | Fly.io IPv6 地址 |
| CNAME | www | xjoy.fly.dev |

### 3.3 更新应用 URL

```bash
fly secrets set NEXT_PUBLIC_APP_URL="https://your-domain.com" -a xjoy
fly deploy -a xjoy
```

## 第四步：数据库管理

### 数据初始化

首次部署时，`prod-entrypoint.js` 会自动：
1. 运行 schema 迁移（创建表结构）
2. 导入 KJV 经文数据（31,102 节）

两个步骤都是幂等的，可以安全地重复运行。

### 生成向量嵌入（可选）

如果设置了 `OPENAI_API_KEY`，在数据导入后生成向量嵌入以启用语义搜索：

```bash
# 先确保数据库中有数据
fly ssh console -a xjoy
# 在 Fly VM 中运行嵌入生成脚本需要 tsx，但生产镜像中没有。
# 可以在本地运行，连接到生产数据库：
DATABASE_URL="<production-db-url>" OPENAI_API_KEY="sk-..." npx tsx scripts/generate_embeddings.ts
```

如果不生成嵌入，RAG 管道会优雅降级到 PostgreSQL 全文搜索（FTS），仍然可以正常工作。

## 第五步：验证部署

### 健康检查

```bash
curl https://xjoy.fly.dev/api/health
# 预期返回: {"status":"ok","timestamp":"...","db":"ok"}
```

### Sentry 验证

部署后检查 Sentry 仪表板，确认：
- 错误事件正在上报
- Release 已创建（对应 git commit SHA）
- Source maps 已上传

### 功能验证

1. 打开 `https://xjoy.fly.dev` — 确认页面加载正常
2. 进入 Chat 页面，发送一个经文问题 — 确认 AI 回复正确引用经文
3. 进入 Reader 页面，浏览经文 — 确认数据加载正常

## 常见问题

### 首次部署失败："relation 'verses' does not exist"

数据库迁移可能因为 race condition 未完成。解决方法：
```bash
fly ssh console -a xjoy
# 手动迁移（在 VM 内）
node -e "const{Pool}=require('pg');const fs=require('fs');const p=new Pool({connectionString:process.env.DATABASE_URL});p.query(fs.readFileSync('schema.sql','utf8')).then(()=>{console.log('done');p.end()})"
```

### 内存不足 (OOM)

如果 pgvector 操作导致 OOM，增加内存：
```bash
fly scale memory 2048 -a xjoy
```

### 数据库连接池耗尽

默认最大连接数为 10。对于单实例应用一般足够。如需调整：
```bash
fly secrets set DB_MAX_CONNECTIONS="20" -a xjoy
```

## 架构图

```
                    ┌─────────────┐
                    │   GitHub    │
                    │  (git push) │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  GitHub     │
                    │  Actions    │
                    │  CI/CD      │
                    └──────┬──────┘
                           │ flyctl deploy
                    ┌──────▼──────┐
                    │   Fly.io    │
                    │  (Docker)   │
                    │             │
                    │  Next.js    │
                    │  + pg       │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐ ┌──▼──┐ ┌──────▼──────┐
       │  Fly PG     │ │Sentry│ │  Anthropic  │
       │  + pgvector │ │      │ │  API        │
       └─────────────┘ └─────┘ └─────────────┘
```

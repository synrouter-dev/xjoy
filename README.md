# Xjoy

An AI-powered interface to the King James Bible. Ask questions, search scripture, and explore the Word — with faithful, context-aware responses grounded in the KJV text.

## Tech Stack

- **Frontend:** Next.js 16 (App Router) + React 19 + Tailwind CSS 4
- **Backend:** Next.js API routes
- **Database:** PostgreSQL with pgvector (Fly.io managed Postgres)
- **AI:** Claude API (Anthropic)
- **Hosting:** Fly.io
- **Monitoring:** Sentry

## Getting Started

### Prerequisites

- Node.js 22+
- npm
- Fly.io CLI (`brew install flyctl`)
- A Fly.io account (`fly auth signup`)

### Local Development

```bash
# Clone and install
git clone <repo-url> xjoy
cd xjoy
npm install

# Set up environment
cp .env.example .env.local
# Fill in DATABASE_URL, ANTHROPIC_API_KEY, and optional Sentry vars

# Start dev server
npm run dev
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry DSN for error monitoring |
| `SENTRY_AUTH_TOKEN` | No | Sentry auth token for source map uploads |
| `SENTRY_ORG` | No | Sentry organization slug |
| `SENTRY_PROJECT` | No | Sentry project slug |
| `NEXT_PUBLIC_APP_URL` | No | Public app URL (default: http://localhost:3000) |

### Database Setup

```bash
# Provision a Fly.io Postgres cluster with pgvector
fly pg create --name xjoy-db --region iad --vm-size shared-cpu-1x

# Attach to the app
fly pg attach xjoy-db --app xjoy

# Run migrations
npm run db:migrate
```

### Deploy

```bash
# Create the Fly.io app (first time only)
fly apps create xjoy

# Set secrets
fly secrets set DATABASE_URL=<connection-string>
fly secrets set ANTHROPIC_API_KEY=<your-key>

# Deploy
fly deploy
```

Deployments also run automatically via GitHub Actions on push to `main`. Set `FLY_API_TOKEN` in GitHub repository secrets.

### Custom Domain

```bash
# Add a domain
fly certs create <your-domain.com>

# Get DNS records to configure
fly ips list
```

Fly.io provisions SSL certificates automatically via Let's Encrypt.

### CI/CD Pipeline

On every push to `main` and every pull request:
1. **Lint** — ESLint with `next/core-web-vitals`
2. **Type Check** — `tsc --noEmit`
3. **Test** — Jest with coverage
4. **Build** — `next build`
5. **Deploy** — `flyctl deploy` (main branch pushes only)

## Project Structure

```
.
├── src/
│   ├── app/           # Next.js App Router pages
│   ├── components/    # Shared React components
│   ├── db/            # Database schema, client, migrations
│   ├── lib/           # Utilities (env, sentry, etc.)
│   └── __tests__/     # Test files
├── .github/workflows/ # CI/CD (GitHub Actions)
├── fly.toml           # Fly.io deployment config
├── Dockerfile         # Production container image
├── sentry.*.config.ts # Sentry monitoring configs
└── jest.config.ts     # Test runner config
```

## License

Private — all rights reserved.

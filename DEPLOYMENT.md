# COSMAN — Production Deployment Guide

> **Stack:** Static Frontend (Vercel) + Node.js API (Railway/Render) + PostgreSQL (Supabase/Neon) + Redis (Upstash)
> **Repo:** https://github.com/orvexuim/cosan

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    cosman.com                           │
│                                                         │
│   GitHub Repo ──► GitHub Actions CI/CD                  │
│        │                │                               │
│        │    ┌───────────┴───────────┐                   │
│        │    │                       │                   │
│        ▼    ▼                       ▼                   │
│   Vercel CDN              Docker / Railway               │
│  (frontend/)             (backend/Node.js API)           │
│  cosman.com              api.cosman.com:5000             │
│        │                       │                        │
│        │               ┌───────┴────────┐               │
│        │               ▼                ▼               │
│        │        PostgreSQL (DB)    Redis (Cache)         │
│        │        Supabase/Neon      Upstash               │
│        │                                                 │
│        └─── config.js ──► cosmanFetch() ──► API calls   │
└─────────────────────────────────────────────────────────┘
```

---

## 1. Run Locally

### Prerequisites
| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | nodejs.org |
| Docker | 24+ | docker.com |
| Git | 2.40+ | pre-installed |

### Option A — Docker (recommended, all-in-one)

```bash
# Clone the repo
git clone https://github.com/orvexuim/cosan.git
cd cosan

# Copy env files
cp backend/.env.example backend/.env
# Edit backend/.env with your secrets (see Section 2)

# Start all services (db + redis + backend)
docker-compose up -d

# Run DB migrations
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed   # optional sample data

# Open frontend in browser
open http://localhost        # nginx serves frontend/
# Backend API available at:
open http://localhost:5000/api/health
```

### Option B — Manual (two terminals)

```bash
# Terminal 1: Backend
cd cosan/backend
cp .env.example .env         # fill in your secrets
npm install
npx prisma migrate dev       # apply migrations
npm run dev                  # starts on :5000

# Terminal 2: Frontend (any static server)
cd cosan/frontend
npx serve .                  # starts on :3000
# or: python3 -m http.server 3000
```

---

## 2. Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `DATABASE_URL` | ✅ | `postgresql://user:pass@host/cosman` | Supabase/Neon/local |
| `REDIS_URL` | ✅ | `redis://localhost:6379` | Upstash: `rediss://...` |
| `JWT_SECRET` | ✅ | 64-char random string | `openssl rand -hex 64` |
| `JWT_REFRESH_SECRET` | ✅ | Different 64-char string | `openssl rand -hex 64` |
| `CLOUDINARY_CLOUD_NAME` | ✅ | `your_cloud` | Product image uploads |
| `CLOUDINARY_API_KEY` | ✅ | `123456789` | |
| `CLOUDINARY_API_SECRET` | ✅ | `abc...` | |
| `SMTP_HOST` | ✅ | `smtp.gmail.com` | Order confirmation emails |
| `SMTP_USER` | ✅ | `noreply@cosman.com` | |
| `SMTP_PASS` | ✅ | Gmail App Password | |
| `STRIPE_SECRET_KEY` | ✅ | `sk_live_...` | Card payments |
| `PAYPAL_CLIENT_ID` | ✅ | `...` | PayPal payments |
| `PAYPAL_CLIENT_SECRET` | ✅ | `...` | |
| `FRONTEND_URL` | ✅ | `https://cosman.com` | CORS allowlist |
| `NODE_ENV` | ✅ | `production` | |
| `PORT` | — | `5000` | Default: 5000 |

### GitHub Secrets (for CI/CD)

Go to **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|--------|-------|
| `VERCEL_TOKEN` | From vercel.com/account/tokens |
| `VERCEL_ORG_ID` | From `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | From `.vercel/project.json` after `vercel link` |

---

## 3. Production Deployment

### Frontend → Vercel

```bash
# One-time setup
npm i -g vercel
cd cosan
vercel login
vercel link                    # creates .vercel/project.json
vercel env add COSMAN_API_URL  # set to https://api.cosman.com

# Deploy
vercel --prod

# Or use the deploy script:
chmod +x scripts/deploy.sh
VERCEL_TOKEN=xxx ./scripts/deploy.sh vercel
```

### Backend → Railway

```bash
# Install Railway CLI
npm i -g @railway/cli
railway login
railway init                   # link to new project

# Set environment variables
railway variables set DATABASE_URL="postgresql://..."
railway variables set JWT_SECRET="$(openssl rand -hex 64)"
# ... (set all vars from Section 2)

# Deploy
railway up --service backend
# Railway auto-detects package.json and deploys Node.js
```

### Backend → Render (alternative)

1. Go to render.com → **New Web Service**
2. Connect `github.com/orvexuim/cosan`
3. Set **Root Directory** to `backend`
4. Build command: `npm install && npx prisma generate`
5. Start command: `npx prisma migrate deploy && node src/app.js`
6. Add all env variables from Section 2

### Database → Supabase

```bash
# 1. Create project at supabase.com
# 2. Get connection string from Settings → Database → Connection string
# 3. Set as DATABASE_URL in backend/.env and Railway/Render
# 4. Run migrations:
DATABASE_URL="postgresql://postgres:[pass]@db.[project].supabase.co:5432/postgres" \
  npx prisma migrate deploy
```

### Database → Neon (alternative)

```bash
# 1. Create project at neon.tech
# 2. Copy connection string (includes ?sslmode=require)
# 3. Set as DATABASE_URL — Neon handles scaling automatically
```

---

## 4. Domain Configuration

### DNS Records (add at your registrar)

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `76.76.21.21` | 3600 |
| A | `@` | `76.76.21.22` | 3600 |
| CNAME | `www` | `cname.vercel-dns.com` | 3600 |
| CNAME | `api` | `your-app.railway.app` | 3600 |

### Add domain in Vercel

```bash
vercel domains add cosman.com
vercel domains add www.cosman.com
```

Vercel provisions HTTPS/SSL **automatically** once DNS propagates (5 min – 48 h).

### SSL for Self-hosted (Docker)

```bash
chmod +x scripts/setup-ssl.sh
sudo ./scripts/setup-ssl.sh
# Obtains Let's Encrypt cert for cosman.com + www.cosman.com
# Sets up auto-renewal cron job
```

---

## 5. Database Migrations

```bash
# Development: create + apply migration
cd backend
npx prisma migrate dev --name "migration_name"

# Production: apply pending migrations only (no schema generation)
npx prisma migrate deploy

# Reset (DANGER — deletes all data)
npx prisma migrate reset

# Open Prisma Studio (GUI)
npx prisma studio
```

Migrations run automatically in CI/CD via:
`npx prisma migrate deploy` before the backend starts.

---

## 6. CI/CD Pipeline

Every push to `main` triggers:

```
push → main
  │
  ▼
quality-check (always)
  • Validate HTML pages
  • Validate JSON configs
  • Prisma schema check
  • Unit tests
  │
  ├─ PR? → deploy-preview → Vercel preview URL → PR comment
  │
  └─ main? → build-docker + deploy-production
               • ghcr.io image push
               • vercel --prod
               • environment=production
```

---

## 7. Rollback

```bash
# Frontend (Vercel)
vercel rollback                      # interactive — pick previous deployment
vercel rollback <deployment-url>     # specific deployment

# Backend (Railway)
railway rollback                     # reverts to previous deploy

# Database
# Always back up before migrations:
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
# Restore:
psql $DATABASE_URL < backup_20260717.sql

# Docker
docker pull ghcr.io/orvexuim/cosan:git-<previous-sha>
docker-compose down && docker-compose up -d
```

---

## 8. Monitoring & Logging

| Tool | Purpose | Setup |
|------|---------|-------|
| **Vercel Analytics** | Frontend Web Vitals, traffic | Enable in Vercel dashboard |
| **Railway Metrics** | Backend CPU/RAM/req/s | Built-in Railway dashboard |
| **Sentry** | JS error tracking (FE + BE) | Add `SENTRY_DSN` to env |
| **UptimeRobot** | Uptime alerting (free) | Monitor `https://cosman.com` + `https://api.cosman.com/api/health` |
| **Logtail** | Structured log aggregation | Set `LOGTAIL_TOKEN` in backend env |

Logs from Docker:
```bash
docker-compose logs -f backend     # stream backend logs
docker-compose logs --tail=100 db  # last 100 DB log lines
```

---

## 9. Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| 404 on page refresh | SPA routing | `vercel.json` rewrites handle this — verify outputDirectory is `frontend` |
| API calls failing | CORS | Set `FRONTEND_URL=https://cosman.com` in backend env |
| Fonts not loading | CSP violation | Check Content-Security-Policy header allows `fonts.googleapis.com` |
| `prisma migrate` fails | DB unreachable | Check `DATABASE_URL` and DB firewall rules |
| Service worker stale | Cached old version | Bump `CACHE = 'cosman-v2'` in `frontend/sw.js` |
| Docker DB not ready | Race condition | `docker-compose up` waits for healthcheck — allow 30s |
| Railway deploy fails | Missing env vars | Check all required vars are set via `railway variables` |

---

## 10. Quick Reference

```bash
# Local dev (all services)
docker-compose up -d

# Deploy frontend
vercel --prod

# Deploy backend
railway up

# Run migrations
npx prisma migrate deploy

# Rollback frontend
vercel rollback

# View logs
docker-compose logs -f backend
```

---

*COSMAN · Premium Luxury Footwear · Morocco*
*Built with ♥ by Vesper AI — github.com/orvexuim/cosan*

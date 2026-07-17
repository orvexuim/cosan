# COSMAN — Production Deployment Guide

> Premium luxury footwear e-commerce · github.com/orvexuim/cosan

---

## Architecture Overview

```
  Developer
     │
     ▼
 GitHub Repo ──► GitHub Actions CI/CD
     │                  │
     │           ┌──────┴──────┐
     │       Quality       Deploy
     │       Checks        Jobs
     │                  │
     ▼                  ▼
  main branch ──► Vercel CDN ──► cosman.com (HTTPS)
                    │
              Global Edge Network
              (100+ PoPs worldwide)
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Git | 2.40+ | pre-installed |
| Node.js | 20+ | nodejs.org |
| Vercel CLI | 33+ | `npm i -g vercel` |
| Docker | 24+ | docker.com |

---

## Environment Variables

Set these as **GitHub Repository Secrets** (Settings → Secrets → Actions):

| Variable | Where | Description |
|----------|-------|-------------|
| `VERCEL_TOKEN` | GitHub Secrets | Vercel API token from vercel.com/account/tokens |
| `VERCEL_ORG_ID` | GitHub Secrets | Found in `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | GitHub Secrets | Found in `.vercel/project.json` after `vercel link` |
| `SITE_URL` | GitHub Secrets | `https://cosman.com` |
| `GTAG_ID` | GitHub Secrets | Google Analytics measurement ID |
| `SENTRY_DSN` | GitHub Secrets | Sentry error monitoring DSN |

Copy `.env.example` → `.env` for local use. **Never commit `.env`.**

---

## Quick Deploy — Vercel (Recommended)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link project (run once from repo root)
vercel link

# 4. Deploy preview
vercel

# 5. Deploy to production
vercel --prod

# 6. Add custom domain
vercel domains add cosman.com
vercel domains add www.cosman.com
```

---

## CI/CD Pipeline (GitHub Actions)

The workflow in `.github/workflows/deploy.yml` runs automatically:

```
Push to main branch
       │
       ▼
 ┌─────────────┐
 │ quality-    │  ← Validates HTML, JSON, checks files
 │ check job   │
 └──────┬──────┘
        │ passes
        ▼
 ┌─────────────┐
 │  deploy-    │  ← vercel --prod
 │ production  │
 └─────────────┘

Pull Request → main
       │
       ▼
 ┌─────────────┐
 │  deploy-    │  ← vercel (preview URL)
 │   preview   │
 └─────────────┘
```

**Setup steps:**
1. Go to **github.com/orvexuim/cosan → Settings → Secrets → Actions**
2. Add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
3. Any push to `main` will auto-deploy to production

---

## Docker Deployment (Self-hosted)

```bash
# Build image
docker build -t cosman:latest .

# Run locally (port 8080)
docker run -p 8080:80 cosman:latest

# With docker-compose (includes auto-updates)
docker-compose up -d

# Push to GitHub Container Registry
docker tag cosman:latest ghcr.io/orvexuim/cosan:latest
docker push ghcr.io/orvexuim/cosan:latest
```

Or use the deploy script:
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh docker    # Docker only
./scripts/deploy.sh vercel    # Vercel only
./scripts/deploy.sh all       # Both
```

---

## Custom Domain — DNS Records

Add these records in your DNS provider (Namecheap / GoDaddy / Cloudflare):

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `76.76.21.21` | 3600 |
| A | `@` | `76.76.21.22` | 3600 |
| CNAME | `www` | `cname.vercel-dns.com` | 3600 |

> Vercel provisions HTTPS automatically once DNS propagates (5 min – 48 hrs).

---

## SSL Configuration

**Vercel (automatic):** SSL is provisioned automatically — no action needed.

**Self-hosted (nginx + certbot):**
```bash
chmod +x scripts/setup-ssl.sh
sudo ./scripts/setup-ssl.sh
```
This will:
- Install certbot
- Obtain Let's Encrypt cert for `cosman.com` + `www.cosman.com`
- Configure auto-renewal via cron
- Reload nginx

---

## Performance Checklist

- [x] gzip compression (nginx.conf)
- [x] Security headers (X-Frame-Options, CSP, HSTS)
- [x] Cache-Control: 1 year for assets, 1 hour for HTML
- [x] CDN via Vercel Edge Network
- [x] PWA — Web App Manifest + Service Worker
- [x] Font preconnect / dns-prefetch
- [x] Structured data (JSON-LD)
- [ ] Image optimization — add WebP versions when real product photos are added
- [ ] Minification — run `html-minifier-terser` in CI for smaller bundles

---

## Monitoring

| Tool | Purpose | Setup |
|------|---------|-------|
| Vercel Analytics | Page views, Web Vitals | Enable in Vercel dashboard |
| Google Analytics | Traffic, conversions | Add `GTAG_ID` to env |
| Sentry | JS error tracking | Add `SENTRY_DSN` to env |
| UptimeRobot | Uptime / alerting | Free tier at uptimerobot.com — monitor https://cosman.com |

---

## Rollback

```bash
# List recent deployments
vercel ls

# Roll back to previous deployment
vercel rollback

# Roll back to specific deployment
vercel rollback <deployment-url>
```

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| 404 on page refresh | SPA routing | `vercel.json` rewrites handle this — check the file |
| Fonts not loading | CSP too strict | Allow `fonts.googleapis.com` in CSP header |
| Service worker stale | Cache not updated | Increment `CACHE` version in `sw.js` |
| DNS not resolving | Propagation delay | Wait up to 48h; check with `dig cosman.com` |
| Docker build fails | Missing files | Run `ls *.html` — all pages must be present |

---

*COSMAN · Built with ♥ in Morocco*

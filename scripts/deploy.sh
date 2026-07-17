#!/bin/bash
set -euo pipefail

# ─────────────────────────────────────────
#   COSMAN — Production Deployment Script
# ─────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; GOLD='\033[0;33m'; NC='\033[0m'
info()  { echo -e "${GOLD}[COSMAN] $*${NC}"; }
ok()    { echo -e "${GREEN}[✓] $*${NC}"; }
err()   { echo -e "${RED}[✗] $*${NC}"; exit 1; }

echo -e "${GOLD}"
cat << 'BANNER'
  ██████╗ ██████╗ ███████╗███╗   ███╗ █████╗ ███╗  ██╗
 ██╔════╝██╔═══██╗██╔════╝████╗ ████║██╔══██╗████╗ ██║
 ██║     ██║   ██║███████╗██╔████╔██║███████║██╔██╗██║
 ██║     ██║   ██║╚════██║██║╚██╔╝██║██╔══██║██║╚████║
 ╚██████╗╚██████╔╝███████║██║ ╚═╝ ██║██║  ██║██║ ╚███║
  ╚═════╝ ╚═════╝ ╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚══╝
  Production Deployment Script — github.com/orvexuim/cosan
BANNER
echo -e "${NC}"

check_prereqs() {
  info "Checking prerequisites..."
  command -v git     >/dev/null 2>&1 || err "git not installed"
  command -v docker  >/dev/null 2>&1 || err "docker not installed"
  command -v vercel  >/dev/null 2>&1 || err "Vercel CLI not installed — run: npm i -g vercel"
  ok "All prerequisites met"
}

run_checks() {
  info "Running quality checks..."
  local pages="index.html shop.html product.html cart.html auth.html admin.html"
  for f in $pages; do
    [ -f "$f" ] && ok "Found $f" || { echo -e "${RED}  Missing: $f${NC}"; }
  done
  python3 -m json.tool manifest.json > /dev/null 2>&1 && ok "manifest.json valid" || err "manifest.json is invalid JSON"
  [ -f sw.js ] && ok "sw.js present" || err "sw.js missing"
  info "File sizes:"
  ls -lh *.html manifest.json sw.js 2>/dev/null | awk '{print "  " $5 "\t" $9}'
}

deploy_vercel() {
  info "Deploying to Vercel..."
  [ -z "${VERCEL_TOKEN:-}" ] && err "VERCEL_TOKEN env var not set"
  vercel --prod --token="$VERCEL_TOKEN" --yes
  ok "Deployed to Vercel production ✦"
}

deploy_docker() {
  info "Building Docker image..."
  docker build -t cosman:latest .
  docker tag cosman:latest ghcr.io/orvexuim/cosan:latest
  info "Pushing to GitHub Container Registry..."
  docker push ghcr.io/orvexuim/cosan:latest
  ok "Docker image pushed: ghcr.io/orvexuim/cosan:latest"
}

MODE="${1:-all}"
check_prereqs
run_checks
case "$MODE" in
  vercel)  deploy_vercel ;;
  docker)  deploy_docker ;;
  all)     deploy_vercel && deploy_docker ;;
  *)       err "Unknown mode: $MODE (use: vercel | docker | all)" ;;
esac

echo ""
ok "COSMAN deployment complete 🚀"
echo -e "${GOLD}  Live at: https://cosman.com${NC}"

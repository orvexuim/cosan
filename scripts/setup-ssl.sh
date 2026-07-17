#!/bin/bash
set -euo pipefail
DOMAIN="cosman.com"
EMAIL="admin@cosman.com"
GREEN='\033[0;32m'; GOLD='\033[0;33m'; NC='\033[0m'

echo -e "${GOLD}[COSMAN] Setting up SSL for $DOMAIN...${NC}"

if ! command -v certbot &>/dev/null; then
  echo "Installing certbot..."
  apt-get update -q && apt-get install -y certbot
fi

certbot certonly \
  --standalone \
  -d "$DOMAIN" -d "www.$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos \
  --non-interactive \
  --keep-until-expiring

cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/ssl/certs/$DOMAIN.crt
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem   /etc/ssl/private/$DOMAIN.key
chmod 600 /etc/ssl/private/$DOMAIN.key

# Auto-renewal cron
CRON="0 3 * * * certbot renew --quiet && nginx -s reload"
(crontab -l 2>/dev/null | grep -v certbot; echo "$CRON") | crontab -

nginx -t && nginx -s reload
echo -e "${GREEN}[✓] SSL configured for $DOMAIN — auto-renewal active${NC}"

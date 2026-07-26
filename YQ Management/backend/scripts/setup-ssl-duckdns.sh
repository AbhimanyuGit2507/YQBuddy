#!/bin/bash
set -euo pipefail

# Setup SSL with Let's Encrypt using DuckDNS DNS-01 challenge
# This works for dynamic IPs and free DuckDNS subdomains

echo "🔒 Setting up SSL with Let's Encrypt + DuckDNS"
echo "=============================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Configuration
DUCKDNS_TOKEN="${DUCKDNS_TOKEN:-}"
DUCKDNS_DOMAIN="${DUCKDNS_DOMAIN:-}"
EMAIL="${EMAIL:-admin@example.com}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Prompt for configuration if not set
if [ -z "${DUCKDNS_TOKEN}" ] || [ -z "${DUCKDNS_DOMAIN}" ]; then
    echo ""
    log_warn "DuckDNS configuration required"
    echo ""
    read -p "Enter your DuckDNS token: " DUCKDNS_TOKEN
    read -p "Enter your DuckDNS domain (e.g., qmover.duckdns.org): " DUCKDNS_DOMAIN
    read -p "Enter your email for Let's Encrypt: " EMAIL
    echo ""
fi

# Install certbot and DNS plugin
log_info "Installing certbot and dependencies..."
apt-get update
apt-get install -y certbot python3-certbot-dns-standalone

# Create certbot hook directory
mkdir -p /opt/certbot/hooks

# Copy our custom hook script
cp /opt/qmover/backend/scripts/certbot-duckdns-hook.sh /opt/certbot/hooks/duckdns-hook.sh
chmod +x /opt/certbot/hooks/duckdns-hook.sh

# Create certbot config
cat > /opt/certbot/duckdns.ini << EOF
dns_duckdns_token = ${DUCKDNS_TOKEN}
EOF

chmod 600 /opt/certbot/duckdns.ini

# Update environment file
log_info "Updating .env with DuckDNS configuration..."
if [ -f "/opt/qmover/backend/.env" ]; then
    if ! grep -q "DUCKDNS_TOKEN" /opt/qmover/backend/.env; then
        echo "" >> /opt/qmover/backend/.env
        echo "# DuckDNS Configuration" >> /opt/qmover/backend/.env
        echo "DUCKDNS_TOKEN=${DUCKDNS_TOKEN}" >> /opt/qmover/backend/.env
        echo "DUCKDNS_DOMAIN=${DUCKDNS_DOMAIN}" >> /opt/qmover/backend/.env
    fi
fi

# Update nginx config
log_info "Updating nginx configuration..."
cat > /etc/nginx/conf.d/qmover.conf << EOF
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name ${DUCKDNS_DOMAIN};
    
    # Let's Encrypt ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name ${DUCKDNS_DOMAIN};

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/${DUCKDNS_DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DUCKDNS_DOMAIN}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Client body size limit
    client_max_body_size 10M;

    # API proxy
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Auth endpoints with stricter rate limiting
    location /api/auth/ {
        limit_req zone=auth burst=10 nodelay;
        
        proxy_pass http://localhost:3000/api/auth/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # WebSocket proxy for Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Test nginx config
nginx -t

# Obtain certificate using DNS-01 challenge
log_info "Obtaining SSL certificate from Let's Encrypt..."
certbot certonly \
    --dns-duckdns \
    --dns-duckdns-credentials /opt/certbot/duckdns.ini \
    --dns-duckdns-propagation-seconds 30 \
    -d "${DUCKDNS_DOMAIN}" \
    --email "${EMAIL}" \
    --agree-tos \
    --no-eff-email \
    --non-interactive

# Test nginx with new certificate
nginx -t && systemctl reload nginx

# Setup auto-renewal
log_info "Setting up auto-renewal..."
cat > /etc/cron.d/certbot-renew << EOF
# Renew certificates twice daily at 2:30 and 14:30
30 2,14 * * * root certbot renew --quiet --post-hook "systemctl reload nginx"
EOF

# Setup DuckDNS auto-update timer
log_info "Setting up DuckDNS auto-update..."
cp /opt/qmover/backend/deploy/duckdns-updater.service /etc/systemd/system/
cp /opt/qmover/backend/deploy/duckdns-updater.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now duckdns-updater.timer

# Final checks
log_info "Running final checks..."
sleep 2

if systemctl is-active --quiet nginx; then
    log_info "✅ Nginx is running"
else
    log_warn "❌ Nginx failed to start"
fi

if [ -f "/etc/letsencrypt/live/${DUCKDNS_DOMAIN}/fullchain.pem" ]; then
    log_info "✅ SSL certificate installed"
else
    log_warn "❌ SSL certificate not found"
fi

# Update DuckDNS immediately
log_info "Updating DuckDNS..."
/opt/qmover/backend/scripts/duckdns-update.sh || true

log_info "🎉 SSL setup complete!"
log_info "Your backend is available at: https://${DUCKDNS_DOMAIN}"
log_info ""
log_info "Next steps:"
log_info "1. Update Vercel NEXT_PUBLIC_API_URL to https://${DUCKDNS_DOMAIN}/api"
log_info "2. Test your application"
log_info ""
log_info "Certificate will auto-renew. Check status with:"
log_info "  certbot certificates"
log_info "  systemctl status duckdns-updater.timer"

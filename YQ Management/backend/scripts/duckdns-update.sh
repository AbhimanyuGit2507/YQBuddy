#!/bin/bash
set -euo pipefail

# DuckDNS IP Updater for QMover
# This script updates your DuckDNS subdomain with your current public IP

# Configuration - Replace these with your actual values
DUCKDNS_TOKEN="${DUCKDNS_TOKEN:-your_duckdns_token_here}"
DUCKDNS_DOMAIN="${DUCKDNS_DOMAIN:-yourdomain.duckdns.org}"
LOG_FILE="/opt/qmover/backend/logs/duckdns-update.log"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[DuckDNS]${NC} $1" | tee -a "${LOG_FILE}"
}

log_warn() {
    echo -e "${YELLOW}[DuckDNS]${NC} $1" | tee -a "${LOG_FILE}"
}

# Get current public IP
CURRENT_IP=$(curl -s https://api.ipify.org || curl -s https://ifconfig.me || echo "")

if [ -z "${CURRENT_IP}" ]; then
    log_warn "Failed to determine public IP"
    exit 1
fi

log_info "Updating DuckDNS: ${DUCKDNS_DOMAIN} -> ${CURRENT_IP}"

# Update DuckDNS
RESPONSE=$(curl -s "https://www.duckdns.org/update?domains=${DUCKDNS_DOMAIN}&token=${DUCKDNS_TOKEN}&ip=${CURRENT_IP}")

if [ "${RESPONSE}" = "OK" ]; then
    log_info "Successfully updated DuckDNS IP to ${CURRENT_IP}"
else
    log_warn "DuckDNS update failed: ${RESPONSE}"
    exit 1
fi

# Also update nginx config if domain changed
if [ -f "/etc/nginx/conf.d/qmover.conf" ]; then
    if ! grep -q "${DUCKDNS_DOMAIN}" /etc/nginx/conf.d/qmover.conf; then
        log_info "Updating nginx config with new domain..."
        sed -i "s/server_name _;/server_name ${DUCKDNS_DOMAIN};/" /etc/nginx/conf.d/qmover.conf
        nginx -t && systemctl reload nginx || true
    fi
fi

#!/bin/bash
set -euo pipefail

# Certbot DNS-01 Hook for DuckDNS
# This script handles the DNS-01 challenge for Let's Encrypt with DuckDNS

# Configuration
DUCKDNS_TOKEN="${DUCKDNS_TOKEN:-your_duckdns_token_here}"
DUCKDNS_DOMAIN="${DUCKDNS_DOMAIN:-yourdomain.duckdns.org}"
LOG_FILE="/opt/qmover/backend/logs/certbot-duckdns.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# Certbot passes these environment variables:
# CERTBOT_DOMAIN: The domain being validated
# CERTBOT_VALIDATION: The validation string
# CERTBOT_TOKEN: The token (for HTTP-01)
# CERTBOT_AUTH_OUTPUT: Where to write authentication results

DOMAIN="${CERTBOT_DOMAIN}"
VALIDATION="${CERTBOT_VALIDATION}"

log "Starting DNS-01 challenge for ${DOMAIN}"

# Extract the DuckDNS domain from the full domain
# e.g., _acme-challenge.qmover.duckdns.org -> qmover.duckdns.org
DUCKDNS_NAME=$(echo "${DOMAIN}" | sed 's/_acme-challenge\.//')

if [ "${DUCKDNS_NAME}" != "${DUCKDNS_DOMAIN}" ]; then
    log "Error: Domain mismatch. Expected ${DUCKDNS_DOMAIN}, got ${DUCKDNS_NAME}"
    exit 1
fi

# Set the TXT record via DuckDNS API
log "Setting TXT record _acme-challenge.${DOMAIN} -> ${VALIDATION}"
RESPONSE=$(curl -s "https://www.duckdns.org/update?domains=${DUCKDNS_DOMAIN}&token=${DUCKDNS_TOKEN}&txt=${VALIDATION}&clear=false")

if [ "${RESPONSE}" != "OK" ]; then
    log "Error setting TXT record: ${RESPONSE}"
    exit 1
fi

log "TXT record set successfully"

# Wait for DNS propagation
log "Waiting for DNS propagation..."
sleep 30

# Verify DNS propagation
MAX_RETRIES=10
RETRY_COUNT=0

while [ ${RETRY_COUNT} -lt ${MAX_RETRIES} ]; do
    RESULT=$(dig +short "_acme-challenge.${DOMAIN}" TXT || echo "")
    if echo "${RESULT}" | grep -q "${VALIDATION}"; then
        log "DNS propagation verified"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    log "Retry ${RETRY_COUNT}/${MAX_RETRIES}..."
    sleep 10
done

if [ ${RETRY_COUNT} -eq ${MAX_RETRIES} ]; then
    log "Warning: DNS propagation timeout, but continuing..."
fi

exit 0

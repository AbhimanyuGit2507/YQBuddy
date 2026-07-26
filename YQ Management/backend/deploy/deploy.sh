#!/bin/bash
set -euo pipefail

# QMover Backend Deployment Script for Oracle Free Tier
# This script sets up the backend on an Oracle Ubuntu VM

echo "🚀 Starting QMover Backend Deployment..."

# Configuration
APP_NAME="qmover-backend"
APP_DIR="/opt/qmover/backend"
SERVICE_USER="ubuntu"
NODE_VERSION="20"
DOMAIN_NAME="${DOMAIN_NAME:-your-domain.com}"
EMAIL="${EMAIL:-admin@example.com}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    log_error "Please run as root (use sudo)"
    exit 1
fi

# Update system
log_info "Updating system packages..."
apt-get update && apt-get upgrade -y

# Install dependencies
log_info "Installing system dependencies..."
apt-get install -y \
    curl \
    wget \
    gnupg \
    lsb-release \
    ca-certificates \
    apt-transport-https \
    software-properties-common \
    build-essential \
    python3 \
    make \
    g++ \
    nginx \
    certbot \
    python3-certbot-nginx \
    redis-server \
    git \
    ufw

# Install Node.js
log_info "Installing Node.js ${NODE_VERSION}..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
fi

# Install PM2 for process management
log_info "Installing PM2..."
npm install -g pm2

# Create application directory
log_info "Creating application directory..."
mkdir -p ${APP_DIR}
mkdir -p ${APP_DIR}/logs
mkdir -p /var/www/certbot

# Set permissions
chown -R ${SERVICE_USER}:${SERVICE_USER} ${APP_DIR}

# Clone repository (if not already present)
if [ ! -d "${APP_DIR}/.git" ]; then
    log_info "Cloning repository..."
    read -p "Enter GitHub repository URL: " REPO_URL
    sudo -u ${SERVICE_USER} git clone ${REPO_URL} ${APP_DIR}
fi

cd ${APP_DIR}

# Install dependencies
log_info "Installing Node.js dependencies..."
sudo -u ${SERVICE_USER} npm ci --only=production

# Build application
log_info "Building application..."
sudo -u ${SERVICE_USER} npm run build

# Setup environment file
if [ ! -f "${APP_DIR}/.env" ]; then
    log_warn "No .env file found. Creating from template..."
    cp .env.example .env 2>/dev/null || true
    
    if [ ! -f ".env" ]; then
        cat > .env << EOF
# Database - Use Oracle Autonomous Database connection string
DATABASE_URL="postgresql://username:password@adb_host:1522/your_service?sslmode=require"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=3000
NODE_ENV=production

# Frontend
FRONTEND_URL=https://${DOMAIN_NAME}
APP_URL=https://${DOMAIN_NAME}
BACKEND_URL=https://${DOMAIN_NAME}

# JWT
JWT_SECRET=$(openssl rand -base64 64)

# Email
BREVO_API_KEY=your_brevo_api_key
BREVO_LIST_ID=2

# WhatsApp / Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your_evolution_api_key
EVOLUTION_INSTANCE_NAME=yq_instance

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Payments
OZOW_SITE_CODE=your_site_code
OZOW_PRIVATE_KEY=your_private_key
OZOW_API_KEY=your_api_key
EOF
    fi
    
    log_warn "Please edit ${APP_DIR}/.env with your actual values before continuing"
    read -p "Press enter when ready to continue..."
fi

# Run database migrations
log_info "Running database migrations..."
sudo -u ${SERVICE_USER} npx prisma migrate deploy

# Setup PM2
log_info "Setting up PM2 process manager..."
sudo -u ${SERVICE_USER} pm2 start dist/main --name ${APP_NAME}
sudo -u ${SERVICE_USER} pm2 save
sudo -u ${SERVICE_USER} pm2 startup systemd

# Setup systemd service
log_info "Setting up systemd service..."
cp ${APP_DIR}/deploy/qmover-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable qmover-backend
systemctl start qmover-backend

# Setup nginx
log_info "Configuring nginx..."
cp ${APP_DIR}/nginx/conf.d/default.conf /etc/nginx/conf.d/qmover.conf
rm -f /etc/nginx/conf.d/default.conf

# Test nginx configuration
nginx -t

# Setup SSL with Let's Encrypt
log_info "Setting up SSL certificate..."
read -p "Do you want to setup SSL with Let's Encrypt? (y/n): " SETUP_SSL
if [ "$SETUP_SSL" = "y" ]; then
    certbot --nginx -d ${DOMAIN_NAME} --non-interactive --agree-tos -m ${EMAIL}
fi

# Start services
log_info "Starting services..."
systemctl restart nginx
systemctl restart redis
systemctl restart qmover-backend

# Setup firewall
log_info "Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Final checks
log_info "Running final checks..."
sleep 5

if systemctl is-active --quiet qmover-backend; then
    log_info "✅ Backend service is running"
else
    log_error "❌ Backend service failed to start"
    systemctl status qmover-backend
    exit 1
fi

if systemctl is-active --quiet nginx; then
    log_info "✅ Nginx is running"
else
    log_error "❌ Nginx failed to start"
    exit 1
fi

if redis-cli ping | grep -q PONG; then
    log_info "✅ Redis is running"
else
    log_error "❌ Redis failed to start"
    exit 1
fi

log_info "🎉 Deployment complete!"
log_info "Backend URL: https://${DOMAIN_NAME}"
log_info "API URL: https://${DOMAIN_NAME}/api"
log_info ""
log_info "Next steps:"
log_info "1. Update your DNS to point ${DOMAIN_NAME} to this server"
log_info "2. Configure frontend on Vercel with NEXT_PUBLIC_API_URL=https://${DOMAIN_NAME}/api"
log_info "3. Test the application"
log_info ""
log_info "Useful commands:"
log_info "  pm2 logs qmover-backend    # View logs"
log_info "  pm2 restart qmover-backend  # Restart backend"
log_info "  systemctl status qmover-backend  # Check service status"

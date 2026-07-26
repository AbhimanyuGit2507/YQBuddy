# Oracle Free Tier Hosting - Quick Start Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel (Frontend)                     │
│                   https://your-app.vercel.app                │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Oracle Cloud (Backend)                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Nginx (Reverse Proxy + SSL)                          │  │
│  │  Port 80/443 → Backend:3000                           │  │
│  └─────────────────────────┬─────────────────────────────┘  │
│                            │                                 │
│  ┌─────────────────────────┴─────────────────────────────┐  │
│  │  Backend (NestJS + Node.js)                           │  │
│  │  - REST API                                            │  │
│  │  - Socket.IO (Redis Adapter)                           │  │
│  │  - BullMQ Workers                                       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Redis (BullMQ + Socket.IO)                            │  │
│  │  Port 6379                                             │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL                                            │  │
│  │  Port 5432                                             │  │
│  │  (Oracle Autonomous DB OR self-hosted)                 │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Evolution API (WhatsApp)                              │  │
│  │  Port 8080                                             │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **Oracle Cloud Account**: Sign up at https://www.oracle.com/cloud/free/
2. **Domain Name**: From any registrar (Namecheap, GoDaddy, Cloudflare, etc.)
3. **GitHub Repository**: Your QMover code pushed to GitHub
4. **Vercel Account**: For frontend deployment

---

## Step 1: Create Oracle VM Instance

### VM Configuration
| Setting | Value |
|---------|-------|
| **Image** | Canonical Ubuntu 22.04/24.04 LTS |
| **Shape** | **ARM VM.Standard.A1.Flex** (Recommended: 2 OCPU, 1GB RAM) |
| **SSH Key** | Generate new or upload existing |
| **Boot Volume** | 50GB |

> **Why ARM?** The Ampere A1 shape provides 2 OCPUs vs 1 OCPU on AMD, giving better performance for the same free tier.

### Create via OCI Console
1. Log into OCI Console
2. Navigate to **Compute → Instances**
3. Click **Create Instance**
4. Select compartment
5. Name: `qmover-backend`
6. Image: Ubuntu 22.04 or 24.04
7. Shape: **VM.Standard.A1.Flex**
8. Add SSH key
9. Create

### Note Public IP
```bash
# SSH into your instance
ssh ubuntu@<your-public-ip>

# Verify connectivity
whoami
# Should output: ubuntu
```

---

## Step 2: Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y \
    curl wget gnupg lsb-release ca-certificates \
    apt-transport-https software-properties-common \
    build-essential python3 make g++ git ufw

# Setup firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Install Redis
sudo apt install -y redis-server
sudo systemctl enable redis
sudo systemctl start redis

# Verify Redis
redis-cli ping
# Output: PONG
```

---

## Step 3: Database Setup (Choose One)

### Option A: Oracle Autonomous Database (Recommended)

Oracle provides a free Autonomous Database with 1GB storage.

1. In OCI Console: **Oracle Database → Autonomous Database**
2. Click **Create Autonomous Database**
3. Choose **Autonomous Transaction Processing**
4. Select **Always Free** option
5. Set admin username/password
6. Create database (takes 5-10 minutes)
7. Download wallet from **DB Connection → Download Wallet**

### Option B: PostgreSQL on VM

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Set password
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'your_secure_password';"

# Create database
sudo -u postgres createdb yq_queue

# Enable remote connections if needed
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/14/main/postgresql.conf
echo "host all all 0.0.0.0/0 md5" | sudo tee -a /etc/postgresql/14/main/pg_hba.conf
sudo systemctl restart postgresql
```

---

## Step 4: Deploy Backend

### Method 1: Automated Script (Recommended)

```bash
# Clone your repository
git clone <your-github-repo-url> /opt/qmover/backend
cd /opt/qmover/backend

# Run setup script
sudo bash scripts/setup-oracle.sh
```

### Method 2: Manual Deployment

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Setup app
sudo mkdir -p /opt/qmover/backend
sudo chown -R $USER:$USER /opt/qmover/backend
git clone <your-repo> /opt/qmover/backend
cd /opt/qmover/backend

# Install and build
npm ci
npm run build

# Setup environment
cp .env.production .env
nano .env  # Edit with your values

# Run migrations
npx prisma migrate deploy

# Start with PM2
pm2 start dist/main --name qmover-backend
pm2 save
pm2 startup systemd
```

---

## Step 5: Environment Configuration

Create `/opt/qmover/backend/.env`:

```env
# Database (Oracle Autonomous DB or self-hosted PostgreSQL)
DATABASE_URL="postgresql://username:password@host:1522/service?sslmode=require"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=3000
NODE_ENV=production

# URLs (update with your actual domains)
FRONTEND_URL=https://your-app.vercel.app
APP_URL=https://your-backend-domain.com
BACKEND_URL=https://your-backend-domain.com

# JWT (generate: openssl rand -base64 64)
JWT_SECRET=your_64_character_secret_here

# Email
BREVO_API_KEY=your_brevo_api_key
BREVO_LIST_ID=2

# WhatsApp
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your_evolution_key
EVOLUTION_INSTANCE_NAME=yq_instance

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Payments
OZOW_SITE_CODE=your_site_code
OZOW_PRIVATE_KEY=your_private_key
OZOW_API_KEY=your_api_key
```

---

## Step 6: Nginx & SSL

```bash
# Install nginx
sudo apt install -y nginx

# Copy config
sudo cp nginx/conf.d/default.conf /etc/nginx/conf.d/qmover.conf
sudo rm -f /etc/nginx/conf.d/default.conf

# Test and start
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx

# Get SSL certificate
sudo certbot --nginx -d your-backend-domain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

---

## Step 7: Frontend Deployment (Vercel)

1. **Push code to GitHub**
2. **Connect to Vercel**:
   - Import repository
   - Framework: Next.js
   - Root directory: `frontend`

3. **Add Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
   ```

4. **Deploy**

---

## Post-Deployment Verification

```bash
# 1. Check backend health
curl https://your-backend-domain.com/health

# 2. Check PM2 status
pm2 status

# 3. Check logs
pm2 logs qmover-backend --lines 50

# 4. Check nginx
sudo systemctl status nginx

# 5. Check Redis
redis-cli ping

# 6. Check database
npx prisma db push
```

---

## Resource Usage on Oracle Free Tier

| Service | Memory | CPU | Notes |
|---------|--------|-----|-------|
| Backend | ~256MB | ~0.25 CPU | PM2 cluster |
| Redis | ~64MB | ~0.1 CPU | Max 128MB |
| Nginx | ~32MB | ~0.05 CPU | Static files |
| PostgreSQL | ~64MB | ~0.1 CPU | Or use Autonomous DB |
| **Total** | **~400MB** | **~0.5 CPU** | **Fits in 1GB/2 OCPU** |

---

## Monitoring & Maintenance

### View Logs
```bash
pm2 logs qmover-backend
sudo tail -f /var/log/nginx/access.log
```

### Restart Services
```bash
pm2 restart qmover-backend
sudo systemctl restart nginx
sudo systemctl restart redis
```

### Update Application
```bash
cd /opt/qmover/backend
git pull
npm ci
npm run build
npx prisma migrate deploy
pm2 restart qmover-backend
```

### Database Backup
```bash
# Automated backup script
cat > /etc/cron.d/qmover-backup << EOF
0 2 * * * root /usr/bin/pg_dump -U postgres yq_queue | gzip > /opt/qmover/backups/db_\$(date +\%Y\%m\%d).sql.gz
EOF

# Keep last 7 days
find /opt/qmover/backups -name "*.sql.gz" -mtime +7 -delete
```

---

## Troubleshooting

### Backend won't start
```bash
pm2 logs qmover-backend
pm2 restart qmover-backend
```

### Database connection failed
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
npx prisma db push
```

### Redis connection failed
```bash
redis-cli ping
sudo systemctl restart redis
```

### Nginx 502 Bad Gateway
```bash
pm2 status
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Out of memory
```bash
# Check memory usage
free -h
pm2 monit

# Reduce Redis memory
echo "maxmemory 64mb" | sudo tee -a /etc/redis/redis.conf
sudo systemctl restart redis
```

---

## Security Hardening

```bash
# Disable password SSH login
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart sshd

# Enable fail2ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban

# Setup automatic updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## Cost Estimate

| Service | Cost |
|---------|------|
| Oracle VM (ARM) | **Free** (Always Free) |
| Oracle Autonomous DB | **Free** (Always Free) |
| Vercel (Hobby) | **Free** |
| Domain | ~$10-15/year |
| **Total** | **~$10-15/year** |

---

## Scaling When Ready

If you outgrow the free tier:

1. **Upgrade VM**: Oracle paid instances start at ~$10/month
2. **Upgrade DB**: Autonomous Database paid tiers
3. **Add CDN**: Cloudflare for static assets
4. **Load Balancer**: For multiple instances

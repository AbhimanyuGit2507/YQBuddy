# QMover Backend Deployment Guide

## $0 MVP Setup (Recommended)

### Architecture
- **Frontend**: Vercel free subdomain (`qmover.vercel.app`)
- **Backend**: Oracle Cloud Always Free VM
- **Database**: Oracle Autonomous Database (free tier) or self-hosted PostgreSQL
- **Proxy**: Vercel rewrites `/api/*` → backend IP

### Why This Setup
- **Zero cost** — Vercel Hobby + Oracle Always Free = $0/month
- **No SSL management** — Vercel handles HTTPS for frontend
- **No DuckDNS needed** — Backend accessed via Oracle public IP
- **WebSocket support** — Socket.IO works through Vercel proxy
- **30-minute deploy** — One script does the heavy lifting

---

## Step 1: Prerequisites

1. **Oracle Cloud Account**: Sign up at https://www.oracle.com/cloud/free/
2. **Vercel Account**: Sign up at https://vercel.com (use GitHub login)
3. **GitHub Repository**: Push your QMover code to GitHub

---

## Step 2: Create Oracle VM Instance

### Recommended Configuration
| Setting | Value |
|---------|-------|
| **Image** | Canonical Ubuntu 22.04/24.04 LTS |
| **Shape** | **ARM VM.Standard.A1.Flex** (2 OCPU, 1GB RAM) |
| **SSH Key** | Generate new or upload existing |
| **Boot Volume** | 50GB |

### Create via OCI Console
1. Log into OCI Console
2. Navigate to **Compute → Instances**
3. Click **Create Instance**
4. Select compartment
5. Name: `qmover-backend`
6. Image: Ubuntu 22.04 or 24.04
7. Shape: **VM.Standard.A1.Flex**
8. Add SSH key
9. Create instance

### Note Public IP
```bash
# SSH into your instance
ssh ubuntu@<your-public-ip>

# Verify connectivity
whoami
# Should output: ubuntu
```

---

## Step 3: Deploy Backend (One Command)

```bash
# SSH into your Oracle VM
ssh ubuntu@<your-public-ip>

# Clone and setup in one go
git clone <your-github-repo-url> /opt/qmover/backend
cd /opt/qmover/backend
sudo bash scripts/setup-oracle.sh
```

The script will:
- Install Node.js 20, PM2, Redis, nginx
- Build the application
- Setup environment from `.env.production`
- Run database migrations
- Start backend with PM2
- Configure nginx as reverse proxy

---

## Step 4: Configure Environment

Edit `/opt/qmover/backend/.env`:

```env
# Database - Oracle Autonomous Database (recommended)
DATABASE_URL="postgresql://admin:password@adb.us-ashburn-1.oraclecloud.com:1522/your_service?sslmode=require"

# Redis (local)
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=3000
NODE_ENV=production

# Frontend - Use your Vercel subdomain
FRONTEND_URL=https://qmover.vercel.app
APP_URL=https://qmover.vercel.app
BACKEND_URL=http://localhost:3000

# JWT Secret (generate: openssl rand -base64 64)
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

> **Note**: `FRONTEND_URL` is your Vercel subdomain. `BACKEND_URL` stays `http://localhost:3000` because it's internal to the VM.

---

## Step 5: Database Setup

### Option A: Oracle Autonomous Database (Recommended)

1. In OCI Console: **Oracle Database → Autonomous Database**
2. Click **Create Autonomous Database**
3. Choose **Autonomous Transaction Processing**
4. Select **Always Free**
5. Set admin credentials
6. Create (5-10 minutes)
7. Download wallet from **DB Connection → Download Wallet**
8. Update `DATABASE_URL` in `.env`

### Option B: PostgreSQL on VM

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Set password
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'your_password';"

# Create database
sudo -u postgres createdb yq_queue

# Update DATABASE_URL in .env
```

---

## Step 6: Run Migrations

```bash
cd /opt/qmover/backend
npx prisma migrate deploy
```

---

## Step 7: Deploy Frontend to Vercel

### Method 1: Vercel CLI (Fastest)
```bash
cd /home/abhimanyu/Projects/YQ/YQ\ Management/frontend
npm install -g vercel
vercel login
vercel --prod
```

### Method 2: GitHub Integration (Recommended)
1. Push frontend code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Set **Root Directory** to `frontend`
5. Add environment variable:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: `/api`
6. Click **Deploy**

Vercel will give you a URL like: `https://qmover.vercel.app`

---

## Step 8: Verify Deployment

```bash
# 1. Check backend health (from your local machine)
curl http://<oracle-ip>:3000/health

# 2. Check frontend
# Visit https://qmover.vercel.app in browser

# 3. Test API through Vercel
curl https://qmover.vercel.app/api/health
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                         │
│               https://qmover.vercel.app                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Next.js App                                           │  │
│  │  /api/* → Proxied to Oracle Backend                    │  │
│  └─────────────────────────┬─────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS (Vercel handles SSL)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Oracle Cloud (Backend)                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Nginx (Reverse Proxy)                                 │  │
│  │  Port 80 → Backend:3000                                │  │
│  └─────────────────────────┬─────────────────────────────┘  │
│                            │                                 │
│  ┌─────────────────────────┴─────────────────────────────┐  │
│  │  Backend (NestJS + Node.js)                           │  │
│  │  Port 3000                                             │  │
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
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Environment Variables Summary

### Vercel (Frontend)
```
NEXT_PUBLIC_API_URL=/api
```

### Oracle VM (Backend `.env`)
```env
DATABASE_URL=postgresql://...
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://qmover.vercel.app
JWT_SECRET=...
BREVO_API_KEY=...
EVOLUTION_API_KEY=...
# ... rest of your config
```

---

## Updating Your Application

```bash
# On Oracle VM
cd /opt/qmover/backend
git pull
npm ci
npm run build
npx prisma migrate deploy
pm2 restart qmover-backend
```

---

## Troubleshooting

### Backend not accessible
```bash
# Check if backend is running
pm2 status

# Check nginx
sudo systemctl status nginx

# Test locally on VM
curl http://localhost:3000/health
```

### CORS errors in browser
```bash
# Ensure FRONTEND_URL matches your Vercel URL
grep FRONTEND_URL /opt/qmover/backend/.env
```

### 502 Bad Gateway from Vercel
```bash
# Check backend logs
pm2 logs qmover-backend

# Restart backend
pm2 restart qmover-backend
```

---

## Resource Usage (Oracle Free Tier)

| Service | Memory | CPU |
|---------|--------|-----|
| Backend | ~256MB | 0.25 |
| Redis | ~64MB | 0.1 |
| Nginx | ~32MB | 0.05 |
| **Total** | **~400MB** | **~0.5** |

Fits comfortably in Oracle's free tier (1GB RAM, 2 OCPU ARM).

---

## Cost: $0/month

| Component | Cost | Notes |
|-----------|------|-------|
| Vercel | Free | Hobby plan, unlimited sites |
| Oracle VM | Free | ARM A1 shape, always free |
| Oracle Autonomous DB | Free | 1GB storage |
| Domain | Free | Vercel subdomain (`*.vercel.app`) |
| **Total** | **$0** | **Forever** |
# QMover $0 Deployment Checklist

## Pre-Deployment
- [ ] Oracle Cloud account created (https://cloud.oracle.com/)
- [ ] DuckDNS account created (https://www.duckdns.org)
- [ ] DuckDNS subdomain created (e.g., `qmover.duckdns.org`)
- [ ] DuckDNS token copied
- [ ] Code pushed to GitHub
- [ ] Vercel account created

## Oracle VM Setup
- [ ] Create VM.Standard.A1.Flex instance (ARM, 2 OCPU, 1GB RAM)
- [ ] Download SSH key
- [ ] Note public IP address
- [ ] SSH into VM: `ssh ubuntu@<ip>`
- [ ] Run: `sudo bash scripts/setup-oracle.sh`

## Backend Deployment
- [ ] Clone repo to `/opt/qmover/backend`
- [ ] Copy `.env.production` to `.env`
- [ ] Edit `.env` with:
  - [ ] `DATABASE_URL` (Oracle Autonomous DB or PostgreSQL)
  - [ ] `JWT_SECRET` (generate with `openssl rand -base64 64`)
  - [ ] `BREVO_API_KEY`
  - [ ] `EVOLUTION_API_KEY`
  - [ ] `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
  - [ ] `DUCKDNS_TOKEN`
  - [ ] `DUCKDNS_DOMAIN`
- [ ] Run: `npm ci && npm run build`
- [ ] Run: `npx prisma migrate deploy`
- [ ] Start: `pm2 start dist/main --name qmover-backend`

## SSL Setup
- [ ] Run: `sudo bash scripts/setup-ssl-duckdns.sh`
- [ ] Enter DuckDNS token, domain, email when prompted
- [ ] Verify: `curl https://qmover.duckdns.org/health`
- [ ] Check certificate: `sudo certbot certificates`

## Nginx Configuration
- [ ] Copy nginx config: `sudo cp nginx/conf.d/default.conf /etc/nginx/conf.d/qmover.conf`
- [ ] Test config: `sudo nginx -t`
- [ ] Start nginx: `sudo systemctl start nginx`

## Services Verification
```bash
# Check all services
pm2 status                              # Backend should be online
sudo systemctl status nginx             # Should be active
redis-cli ping                          # Should return PONG
curl https://qmover.duckdns.org/health  # Should return JSON
```

## Vercel Frontend Setup
- [ ] Push frontend code to GitHub
- [ ] Import repo in Vercel
- [ ] Set environment variable:
  - [ ] `NEXT_PUBLIC_API_URL=https://qmover.duckdns.org/api`
- [ ] Deploy
- [ ] Test login/flow

## Post-Deployment
- [ ] Test user registration
- [ ] Test login
- [ ] Test queue creation
- [ ] Test WhatsApp connection (if Evolution API available)
- [ ] Test email sending (if Brevo configured)

## Monitoring
```bash
# View logs
pm2 logs qmover-backend

# Monitor resources
pm2 monit

# Check disk usage
df -h

# Check memory
free -h
```

## Quick Update Procedure
```bash
cd /opt/qmover/backend
git pull
npm ci
npm run build
npx prisma migrate deploy
pm2 restart qmover-backend
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't start | `pm2 logs qmover-backend` |
| 502 Bad Gateway | Check `pm2 status`, restart backend |
| SSL cert expired | `sudo certbot renew` |
| DuckDNS not updating | `sudo systemctl status duckdns-updater.timer` |
| Database connection | Check `DATABASE_URL` in `.env` |
| Redis connection | `redis-cli ping` |

## Support
- Deployment docs: `DEPLOYMENT.md`
- Oracle free tier guide: `ORACLE_FREE_TIER.md`

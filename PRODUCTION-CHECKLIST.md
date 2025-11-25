# Production Deployment Checklist

## Pre-Deployment

### 1. Azure Storage Setup

- [ ] Create Azure Storage Account
- [ ] Copy Connection String from Access Keys
- [ ] Create `screenshots` container with blob public access

### 2. Environment Configuration

```bash
# Create production environment file
cp .env.production.example .env.production
```

Edit `.env.production`:

- [ ] Set strong `JWT_SECRET` (min 32 characters)
- [ ] Set strong `DB_PASSWORD`
- [ ] Add Azure `AZURE_STORAGE_CONNECTION_STRING`
- [ ] Verify `DB_PORT=5435` (avoids WealthGrow conflict on 5433)

### 3. Files to Upload to Server

```bash
# Required files
.env.production
compose.prod.yml
Dockerfile
server/
client/
```

---

## Deployment Steps

### On Azure VM

```bash
# 1. SSH to server
ssh azureuser@Wealthgrow-vm

# 2. Navigate to project
cd /path/to/aurora-social

# 3. Deploy (migrations run automatically)
docker compose -f compose.prod.yml --env-file .env.production up -d --build

# 4. Monitor startup
docker compose -f compose.prod.yml logs -f aurora-app
```

### Watch for These Log Messages:

```
✅ Running database migrations...
✅ Migrations applied successfully
✅ Starting application...
✅ Server is running on port 3000
```

---

## Post-Deployment

### 1. Create Admin User

```bash
docker exec aurora-app npx tsx scripts/createAdmin.ts
```

### 2. Verify Services

```bash
# Check all containers
docker ps

# Expected output:
# aurora-app        (port 3000)
# aurora-postgres   (port 5435)
```

### 3. Test Endpoints

```bash
# Health check
curl http://localhost:3000/api/auth/health

# Swagger docs
curl http://localhost:3000/api-docs
```

### 4. Configure Nginx Proxy (Optional)

Add to `/etc/nginx/sites-available/default`:

```nginx
location /aurora {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

Then:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Monitoring

### Container Logs

```bash
# Application logs
docker compose -f compose.prod.yml logs -f aurora-app

# Database logs
docker compose -f compose.prod.yml logs -f aurora-postgres

# All services
docker compose -f compose.prod.yml logs -f
```

### Migration Status

```bash
# Check migration history
docker exec aurora-app npx prisma migrate status

# View in database
docker exec aurora-postgres psql -U postgres -d AuroraSocialDb \
  -c "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 10;"
```

### Resource Usage

```bash
# Container stats
docker stats aurora-app aurora-postgres

# Disk usage
docker system df
```

---

## Updates & Maintenance

### Deploy New Version

```bash
# Pull changes
git pull

# Rebuild and restart (migrations run automatically)
docker compose -f compose.prod.yml --env-file .env.production up -d --build

# Verify
docker compose -f compose.prod.yml logs -f aurora-app
```

### Database Backup

```bash
# Export database
docker exec aurora-postgres pg_dump -U postgres AuroraSocialDb > backup-$(date +%Y%m%d).sql

# Restore if needed
cat backup-20251126.sql | docker exec -i aurora-postgres psql -U postgres -d AuroraSocialDb
```

### Clear Old Docker Images

```bash
# Remove unused images
docker image prune -a

# Remove old containers
docker container prune
```

---

## Troubleshooting

### Port Already in Use

```bash
# Check what's using port 5435
sudo lsof -i :5435

# Change port in .env.production
DB_PORT=5436  # or another free port
```

### Migration Failed

```bash
# View migration error
docker compose -f compose.prod.yml logs aurora-app | grep -A 20 "migration"

# Manual migration
docker exec aurora-app npx prisma migrate deploy

# Force reset (DESTRUCTIVE)
docker exec aurora-app npx prisma migrate reset --force
```

### Container Won't Start

```bash
# Check logs
docker logs aurora-app

# Verify environment
docker exec aurora-app env | grep DATABASE_URL

# Test database connection
docker exec aurora-postgres psql -U postgres -d AuroraSocialDb -c "SELECT 1;"
```

### Storage Upload Fails

```bash
# Verify Azure connection
docker exec aurora-app sh -c 'echo $AZURE_STORAGE_CONNECTION_STRING'

# Test from inside container
docker exec aurora-app npx tsx -e "
import { BlobServiceClient } from '@azure/storage-blob';
const client = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
console.log(await client.getProperties());
"
```

---

## Rollback

### Quick Rollback

```bash
# Stop current version
docker compose -f compose.prod.yml down

# Checkout previous version
git checkout <previous-commit>

# Redeploy
docker compose -f compose.prod.yml --env-file .env.production up -d --build
```

### Database Rollback

```bash
# Restore from backup
cat backup-20251126.sql | docker exec -i aurora-postgres psql -U postgres -d AuroraSocialDb
```

---

## Security

- [ ] Change default passwords in `.env.production`
- [ ] Use strong JWT secret (min 32 characters)
- [ ] Configure firewall to allow only necessary ports
- [ ] Set up SSL/TLS with Let's Encrypt
- [ ] Regular security updates: `docker pull postgres:16`
- [ ] Monitor logs for suspicious activity

---

## Support

### Logs Location

- Application: `docker compose logs aurora-app`
- Database: `docker compose logs aurora-postgres`
- System: `/var/log/syslog`

### Useful Commands

```bash
# Full system status
docker ps -a && docker compose -f compose.prod.yml ps

# Quick restart
docker compose -f compose.prod.yml restart aurora-app

# Clean restart
docker compose -f compose.prod.yml down && \
docker compose -f compose.prod.yml up -d --build
```

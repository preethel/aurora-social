# Aurora Social - Docker Deployment Guide (Updated for TypeScript + Prisma)

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- VM with sufficient resources (2GB RAM minimum)
- Port 3000 and 5433 available

### 1. Clone and Setup

```bash
cd ~/workingDirectory/aurora-social

# Create .env file
cp .env.example .env
nano .env  # Edit with your values
```

### 2. Configure Environment

Edit `.env` file:

```env
# Database Configuration
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DB_NAME=auroraDb
DB_PORT=5433

# Application
JWT_SECRET=your_jwt_secret_key_here
IFRAMELY_API_KEY=your_iframely_key

# Optional
APP_PORT=3000
NODE_ENV=production
```

### 3. Deploy

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

## 📦 What Gets Deployed

The deployment includes:

1. **PostgreSQL Database** (Container)
   - Port: 5433 (host) → 5432 (container)
   - Data persisted in Docker volume
   - Auto-healthcheck enabled

2. **Aurora Social App** (Container)
   - TypeScript backend (compiled to JavaScript)
   - React frontend (built and served)
   - Prisma ORM with PostgreSQL
   - Port: 3000 (configurable via APP_PORT)

## 🔧 Manual Deployment Steps

If you prefer manual control:

```bash
# 1. Stop existing containers
docker compose -f compose.prod.yml down

# 2. Build images
docker compose -f compose.prod.yml build --no-cache

# 3. Start services
docker compose -f compose.prod.yml up -d

# 4. Run migrations
docker compose -f compose.prod.yml exec aurora-social sh -c "cd /app/server && npx prisma migrate deploy"

# 5. Create admin user
docker compose -f compose.prod.yml exec aurora-social sh -c "cd /app/server && npm run create-admin admin admin123"
```

## 📊 Monitoring

### View Logs

```bash
# All services
docker compose -f compose.prod.yml logs -f

# Just the app
docker compose -f compose.prod.yml logs -f aurora-social

# Just the database
docker compose -f compose.prod.yml logs -f postgres
```

### Check Status

```bash
# Container status
docker compose -f compose.prod.yml ps

# Health check
curl http://localhost:3000
```

### Database Access

```bash
# Connect to PostgreSQL
docker compose -f compose.prod.yml exec postgres psql -U postgres -d auroraDb

# View tables
\dt

# Exit
\q
```

## 🔄 Updates and Maintenance

### Update Application

```bash
# Pull latest code
git pull

# Redeploy
./deploy.sh
```

### Backup Database

```bash
# Create backup
docker compose -f compose.prod.yml exec postgres pg_dump -U postgres auroraDb > backup_$(date +%Y%m%d).sql

# Restore backup
docker compose -f compose.prod.yml exec -T postgres psql -U postgres auroraDb < backup_20241124.sql
```

### Reset Everything

```bash
# Stop and remove all containers and volumes
docker compose -f compose.prod.yml down -v

# Redeploy from scratch
./deploy.sh
```

## 🌐 Accessing the Application

After successful deployment:

- **Frontend**: `http://YOUR_VM_IP:3000`
- **API Docs**: `http://YOUR_VM_IP:3000/api-docs`
- **Health Check**: `http://YOUR_VM_IP:3000`

Default admin credentials:
- Username: `admin`
- Password: `admin123`

**⚠️ Change the admin password immediately after first login!**

## 🔒 Security Recommendations

1. **Change default passwords** in `.env`
2. **Use strong JWT_SECRET** (generate with `openssl rand -base64 32`)
3. **Setup reverse proxy** (nginx) for HTTPS
4. **Configure firewall** to restrict ports
5. **Regular backups** of database
6. **Monitor logs** for suspicious activity

## 🐛 Troubleshooting

### Container won't start

```bash
# Check logs
docker compose -f compose.prod.yml logs

# Common issues:
# - Port already in use
# - Missing .env file
# - Insufficient memory
```

### Database connection failed

```bash
# Check if postgres is healthy
docker compose -f compose.prod.yml ps

# Verify DATABASE_URL in logs
docker compose -f compose.prod.yml logs aurora-social | grep DATABASE_URL

# Restart database
docker compose -f compose.prod.yml restart postgres
```

### Migration errors

```bash
# Reset migrations (⚠️ will lose data)
docker compose -f compose.prod.yml exec aurora-social sh -c "cd /app/server && npx prisma migrate reset --force"

# Or manually run migrations
docker compose -f compose.prod.yml exec aurora-social sh -c "cd /app/server && npx prisma migrate deploy"
```

### Port conflicts

If port 3000 or 5433 is already in use:

```bash
# Edit .env
APP_PORT=3001
DB_PORT=5434

# Redeploy
./deploy.sh
```

## 📈 Performance Tuning

### Increase PostgreSQL Memory

Edit `compose.prod.yml` and add under postgres service:

```yaml
command: postgres -c shared_buffers=256MB -c max_connections=200
```

### Enable Gzip Compression

The app already serves compressed assets. For additional compression, use nginx reverse proxy.

## 🔗 Integration with Existing Services

If you have other Docker services running:

```yaml
# In compose.prod.yml, use external network
networks:
  aurora-network:
    external: true
    name: your_existing_network
```

## 📞 Support

For issues:
1. Check logs: `docker compose -f compose.prod.yml logs`
2. Verify `.env` configuration
3. Ensure ports are available
4. Check Docker resources: `docker system df`

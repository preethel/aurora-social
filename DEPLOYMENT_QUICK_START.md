# Quick Deployment Guide - Aurora Social with Existing PostgreSQL

## Your Current Setup

Based on your VM output:

- ✅ PostgreSQL container: `wealthgrow-postgres` (running)
- ✅ Network: `tradingapp_app-network`
- ✅ Port: 5433:5432

## Deploy Aurora Social

### Option 1: One-Command Deploy (Recommended)

```bash
chmod +x quick-deploy.sh
./quick-deploy.sh
```

This will automatically:

1. Stop any existing aurora-social container
2. Create database `auroraDb` if needed
3. Build and start the container on `tradingapp_app-network`
4. Run Prisma migrations
5. Verify everything is working

### Option 2: Manual Steps

```bash
# 1. Create database if it doesn't exist
docker exec wealthgrow-postgres psql -U postgres -c "CREATE DATABASE \"auroraDb\";"

# 2. Deploy
docker compose -f compose.prod.yml up -d --build

# 3. Wait for container to start
sleep 10

# 4. Run migrations
docker exec aurora-social-app npx prisma migrate deploy

# 5. Check status
docker ps | grep aurora-social-app
docker logs aurora-social-app
```

## Verify Deployment

```bash
# Check container is running
docker ps | grep aurora-social-app

# Check database connection
docker exec aurora-social-app ping wealthgrow-postgres

# Check migration status
docker exec aurora-social-app npx prisma migrate status

# View logs
docker logs -f aurora-social-app
```

## Access Application

- **URL:** http://localhost:3000
- **Or:** http://your-vm-ip:3000

## Network Configuration

Your `compose.prod.yml` is now configured to use:

```yaml
networks:
  tradingapp_app-network:
    external: true
```

This connects aurora-social to the same network as your PostgreSQL.

## Database Connection

Aurora Social will connect using:

- Host: `wealthgrow-postgres`
- Port: `5432` (internal container port)
- Database: `auroraDb`
- User: `postgres`
- Password: `postgres`

**Note:** Aurora Social connects to the internal port (5432) since both containers are on the same network. The external port (5433) is only for connecting from outside Docker.

## Common Commands

```bash
# View all containers and network
docker ps
docker network inspect tradingapp_app-network

# Restart aurora-social
docker restart aurora-social-app

# Stop aurora-social
docker compose -f compose.prod.yml down

# Rebuild and restart
docker compose -f compose.prod.yml up -d --build

# View real-time logs
docker logs -f aurora-social-app

# Check migration history
docker exec aurora-social-app npx prisma migrate status

# Access database directly
docker exec -it wealthgrow-postgres psql -U postgres -d auroraDb
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs aurora-social-app

# Check if port 3000 is available
sudo netstat -tulpn | grep 3000
```

### Can't connect to database

```bash
# Verify both containers are on same network
docker network inspect tradingapp_app-network | grep -E 'aurora-social|wealthgrow-postgres'

# Test connection
docker exec aurora-social-app ping wealthgrow-postgres
```

### Database doesn't exist

```bash
# Create it manually
docker exec wealthgrow-postgres psql -U postgres -c "CREATE DATABASE \"auroraDb\";"
```

### Migration fails

```bash
# Check Prisma status
docker exec aurora-social-app npx prisma migrate status

# Generate Prisma client
docker exec aurora-social-app npx prisma generate

# Try migration again
docker exec aurora-social-app npx prisma migrate deploy
```

## Environment Variables

Make sure your `.env` file has:

```env
# Database
DB_HOST=wealthgrow-postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=auroraDb
DATABASE_URL=postgresql://postgres:postgres@wealthgrow-postgres:5432/auroraDb?schema=public

# App
NODE_ENV=production
PORT=8080
APP_PORT=3000

# JWT (generate a secure secret)
JWT_SECRET=your-secret-key-here

# Optional: Iframely
IFRAMELY_API_KEY=your-iframely-key
```

## Update Application

```bash
# Pull latest code
git pull

# Rebuild and redeploy
docker compose -f compose.prod.yml down
docker compose -f compose.prod.yml up -d --build

# Run any new migrations
docker exec aurora-social-app npx prisma migrate deploy
```

## Complete Reset

If you need to start fresh:

```bash
# Stop and remove container
docker compose -f compose.prod.yml down
docker rm -f aurora-social-app

# Drop and recreate database
docker exec wealthgrow-postgres psql -U postgres -c "DROP DATABASE IF EXISTS \"auroraDb\";"
docker exec wealthgrow-postgres psql -U postgres -c "CREATE DATABASE \"auroraDb\";"

# Deploy again
./quick-deploy.sh
```

## Support

- Full troubleshooting: [DB_TROUBLESHOOTING.md](./DB_TROUBLESHOOTING.md)
- Azure deployment: [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md)
- VM setup: [VM_QUICK_REFERENCE.md](./VM_QUICK_REFERENCE.md)

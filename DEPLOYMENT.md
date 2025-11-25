# Aurora Social - Deployment Guide

## Local Development

### Using Azurite (Local Azure Storage Emulator)

```bash
# Start local development environment
docker compose -f compose.local.yml up -d

# View logs
docker compose -f compose.local.yml logs -f

# Stop
docker compose -f compose.local.yml down
```

**Features:**

- ✅ Azurite for local Azure Storage testing
- ✅ PostgreSQL database
- ✅ Screenshots stored locally
- ✅ No Azure account needed

---

## Production Deployment (Azure)

### Prerequisites

1. **Azure Storage Account**

   - Go to Azure Portal
   - Create Storage Account
   - Copy Connection String from "Access Keys"

2. **Create `.env.production` file**
   ```bash
   cp .env.production.example .env.production
   # Edit and add your Azure credentials
   ```

### Option 1: Docker Compose on Azure VM (Recommended)

**Note**: Aurora uses PostgreSQL port **5435** to avoid conflicts with WealthGrow (port 5433).

```bash
# 1. SSH to Azure VM
ssh azureuser@your-vm-ip

# 2. Clone/upload project files
# Upload .env.production file with Azure credentials

# 3. Deploy (migrations run automatically)
docker compose -f compose.prod.yml --env-file .env.production up -d --build

# 4. Check migration logs
docker compose -f compose.prod.yml logs aurora-app | grep -i migration

# 5. Verify containers
docker compose -f compose.prod.yml ps

# 6. View application logs
docker compose -f compose.prod.yml logs -f aurora-app

# 7. Create admin user
docker exec aurora-app npx tsx scripts/createAdmin.ts
```

**Automatic Features:**

- ✅ Migrations run automatically on container startup
- ✅ Retry logic for database connection failures
- ✅ Conflict detection and resolution
- ✅ Zero-downtime updates

**Update/Redeploy:**

```bash
# Pull latest changes and rebuild
docker compose -f compose.prod.yml --env-file .env.production up -d --build

# Migrations apply automatically - no manual intervention needed
```

### Option 2: Azure Container Instances

```bash
# Build and push image
docker build -t your-registry.azurecr.io/aurora-social:latest .
docker push your-registry.azurecr.io/aurora-social:latest

# Deploy using Azure CLI
az container create \
  --resource-group your-resource-group \
  --name aurora-social \
  --image your-registry.azurecr.io/aurora-social:latest \
  --ports 3000 \
  --environment-variables \
    NODE_ENV=production \
    DATABASE_URL="your-postgres-url" \
    AZURE_STORAGE_CONNECTION_STRING="your-connection-string" \
    JWT_SECRET="your-jwt-secret"
```

### Option 3: Azure App Service (Container)

1. Create App Service with Docker container
2. Set Environment Variables in Configuration
3. Deploy container image

---

## Database Migrations (Automatic)

### How It Works

Migrations run **automatically** when the container starts via the startup script in Dockerfile:

1. Container starts
2. Script runs `npx prisma migrate deploy`
3. Retry logic (5 attempts) handles temporary connection issues
4. Application starts after successful migration

### Migration Features

- ✅ **Automatic**: No manual commands needed
- ✅ **Retry Logic**: Handles database connection delays
- ✅ **Conflict Resolution**: Prisma handles schema conflicts
- ✅ **Safe**: Only applies pending migrations
- ✅ **Logged**: All migration output visible in container logs

### Checking Migration Status

```bash
# View migration logs
docker compose -f compose.prod.yml logs aurora-app | grep -i migration

# Check current migration status
docker exec aurora-app npx prisma migrate status

# View migration history in database
docker exec aurora-postgres psql -U postgres -d AuroraSocialDb \
  -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"
```

### Manual Migration (if needed)

```bash
# Force re-run migrations
docker exec aurora-app npx prisma migrate deploy

# Reset database (DESTRUCTIVE - wipes all data)
docker exec aurora-app npx prisma migrate reset --force
```

---

## Port Configuration

**Production Server Ports:**

- WealthGrow Postgres: **5433**
- Aurora Postgres: **5435** (configured to avoid conflict)
- Aurora App: **3000**
- Nginx: **80, 443**

**Local Development Ports:**

- Aurora Postgres: **5434**
- Aurora App: **3000**
- Azurite: **10000-10002**

---

## Environment Variables Comparison

| Variable                          | Local (Azurite) | Production (Azure)           |
| --------------------------------- | --------------- | ---------------------------- |
| `AZURE_STORAGE_CONNECTION_STRING` | Azurite default | Real Azure connection string |
| `NODE_ENV`                        | `development`   | `production`                 |
| `JWT_SECRET`                      | Simple dev key  | Strong random key            |
| `DATABASE_URL`                    | Docker postgres | Azure PostgreSQL / Docker    |

---

## Storage URL Handling

The `convertToPublicUrl()` function automatically handles both:

- **Local**: `http://azurite:10000/...` → `http://localhost:10000/...`
- **Production**: Azure URLs remain unchanged (already public)

---

## Migration to Production

```bash
# 1. Backup local database (optional)
docker exec aurora-postgres pg_dump -U postgres AuroraSocialDb > backup.sql

# 2. Stop local environment
docker compose -f compose.local.yml down

# 3. Setup production environment
cp .env.production.example .env.production
# Edit .env.production with your Azure credentials

# 4. Deploy to production
docker compose -f compose.prod.yml --env-file .env.production up -d

# 5. Create admin user
docker exec aurora-app npx tsx scripts/createAdmin.ts
```

---

## Azure Storage Setup

### Create Storage Account

```bash
# Using Azure CLI
az storage account create \
  --name aurorasocialstorage \
  --resource-group your-resource-group \
  --location eastus \
  --sku Standard_LRS

# Get connection string
az storage account show-connection-string \
  --name aurorasocialstorage \
  --resource-group your-resource-group
```

### Create Container

```bash
# Create screenshots container
az storage container create \
  --name screenshots \
  --account-name aurorasocialstorage \
  --public-access blob
```

---

## Quick Reference

### Local Development

```bash
docker compose -f compose.local.yml up -d
```

### Production Deployment

```bash
docker compose -f compose.prod.yml --env-file .env.production up -d
```

### Switch Back to Local

```bash
docker compose -f compose.prod.yml down
docker compose -f compose.local.yml up -d
```

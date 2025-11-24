# Database Connection Troubleshooting Guide

## Issue: Can't reach database server at `wealthgrow-postgres:5432`

This error occurs when the Aurora Social container cannot connect to the existing PostgreSQL database.

## Quick Fix Steps

### 1. Check if PostgreSQL container is running

```bash
docker ps | grep postgres
```

Expected output should show `wealthgrow-postgres` container running.

### 2. Find the PostgreSQL network

```bash
# List all networks
docker network ls

# Inspect the postgres container to see which network it's on
docker inspect wealthgrow-postgres | grep -A 10 Networks
```

### 3. Connect Aurora Social to the same network

**Option A: Using the correct network name in compose file**

The network name should match the one used by `wealthgrow-postgres`. Common names:

- `wealthgrow-network`
- `wealthgrow_default`
- `postgres_network`

Update `compose.prod.yml`:

```yaml
networks:
  wealthgrow-network: # Use the actual network name
    external: true
```

**Option B: Connect manually after starting**

```bash
# Start aurora-social
docker compose -f compose.prod.yml up -d

# Find the postgres network
POSTGRES_NETWORK=$(docker inspect wealthgrow-postgres --format='{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}')

# Connect aurora-social to the same network
docker network connect $POSTGRES_NETWORK aurora-social-app
```

### 4. Verify network connectivity

```bash
# Check if both containers are on the same network
docker network inspect wealthgrow-network | grep -E 'aurora-social-app|wealthgrow-postgres'

# Test connection from aurora-social to postgres
docker exec aurora-social-app ping -c 2 wealthgrow-postgres
```

### 5. Run Prisma migrations

```bash
# Once connected, run migrations
docker exec aurora-social-app npx prisma migrate deploy
```

## Complete Deployment Workflow

```bash
# 1. Check existing postgres setup
docker ps | grep postgres
POSTGRES_NETWORK=$(docker inspect wealthgrow-postgres --format='{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}')
echo "PostgreSQL is on network: $POSTGRES_NETWORK"

# 2. Update compose.prod.yml with the correct network name
# Edit the file and change 'wealthgrow-network' to $POSTGRES_NETWORK if different

# 3. Deploy aurora-social
docker compose -f compose.prod.yml down
docker compose -f compose.prod.yml up -d

# 4. Verify connection
docker exec aurora-social-app ping -c 2 wealthgrow-postgres

# 5. Run migrations
docker exec aurora-social-app npx prisma migrate deploy

# 6. Check logs
docker logs aurora-social-app
```

## Alternative: Create the network if it doesn't exist

If you want to create a new shared network:

```bash
# Create network
docker network create wealthgrow-network

# Connect postgres to the network
docker network connect wealthgrow-network wealthgrow-postgres

# Deploy aurora-social (it will join the same network)
docker compose -f compose.prod.yml up -d

# Verify
docker network inspect wealthgrow-network
```

## Database Environment Variables

Make sure these are set correctly in `.env` or `compose.prod.yml`:

```env
DB_HOST=wealthgrow-postgres        # Must match the container name
DB_PORT=5432
DB_USER=postgres                   # Your postgres username
DB_PASSWORD=postgres               # Your postgres password
DB_NAME=auroraDb
DATABASE_URL=postgresql://postgres:postgres@wealthgrow-postgres:5432/auroraDb?schema=public
```

## Common Issues

### Issue 1: Network not found

**Error:** `network wealthgrow-network declared as external, but could not be found`

**Solution:**

```bash
# List existing networks
docker network ls

# Use one of the existing networks OR create it
docker network create wealthgrow-network
```

### Issue 2: Database doesn't exist

**Error:** `database "auroraDb" does not exist`

**Solution:**

```bash
# Connect to postgres and create database
docker exec -it wealthgrow-postgres psql -U postgres -c "CREATE DATABASE \"auroraDb\";"

# Then run migrations
docker exec aurora-social-app npx prisma migrate deploy
```

### Issue 3: Wrong credentials

**Error:** `password authentication failed for user "postgres"`

**Solution:**
Check the actual credentials of your postgres container:

```bash
docker inspect wealthgrow-postgres | grep -i -A 5 env
```

Update `.env` file with correct credentials.

### Issue 4: Containers can't see each other

**Solution:**

```bash
# Both containers must be on the same network
docker network inspect wealthgrow-network

# If aurora-social-app is not listed, add it:
docker network connect wealthgrow-network aurora-social-app

# Restart aurora-social
docker restart aurora-social-app
```

## Health Check Commands

```bash
# Check if app is running
docker ps | grep aurora-social-app

# Check app logs
docker logs -f aurora-social-app

# Check database connection from inside container
docker exec aurora-social-app sh -c 'nc -zv wealthgrow-postgres 5432'

# Check Prisma status
docker exec aurora-social-app npx prisma migrate status

# Test database query
docker exec aurora-social-app node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => console.log('✅ Database connected!'))
  .catch(err => console.error('❌ Connection failed:', err.message))
  .finally(() => prisma.\$disconnect());
"
```

## Automated Fix Script

Save this as `fix-db-connection.sh`:

```bash
#!/bin/bash

echo "🔧 Fixing Aurora Social Database Connection..."

# Find postgres network
POSTGRES_NETWORK=$(docker inspect wealthgrow-postgres --format='{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}' 2>/dev/null)

if [ -z "$POSTGRES_NETWORK" ]; then
  echo "❌ wealthgrow-postgres container not found or not running"
  exit 1
fi

echo "✅ Found PostgreSQL on network: $POSTGRES_NETWORK"

# Check if network exists
if ! docker network inspect $POSTGRES_NETWORK >/dev/null 2>&1; then
  echo "📡 Creating network: $POSTGRES_NETWORK"
  docker network create $POSTGRES_NETWORK
fi

# Stop and remove existing container
docker compose -f compose.prod.yml down 2>/dev/null

# Update compose file with correct network
sed -i.bak "s/wealthgrow-network/$POSTGRES_NETWORK/g" compose.prod.yml

# Start services
echo "🚀 Starting Aurora Social..."
docker compose -f compose.prod.yml up -d

# Wait for container to start
sleep 5

# Connect to network if not already connected
if ! docker network inspect $POSTGRES_NETWORK | grep -q aurora-social-app; then
  echo "🔗 Connecting to network..."
  docker network connect $POSTGRES_NETWORK aurora-social-app 2>/dev/null || true
fi

# Test connection
echo "🧪 Testing database connection..."
if docker exec aurora-social-app ping -c 2 wealthgrow-postgres >/dev/null 2>&1; then
  echo "✅ Network connection successful!"

  # Run migrations
  echo "📦 Running Prisma migrations..."
  docker exec aurora-social-app npx prisma migrate deploy

  echo "✨ Done! Aurora Social is ready."
else
  echo "❌ Cannot reach database. Please check manually."
  exit 1
fi
```

Make it executable and run:

```bash
chmod +x fix-db-connection.sh
./fix-db-connection.sh
```

## Support

If issues persist:

1. Check `docker logs aurora-social-app` for detailed errors
2. Verify PostgreSQL is accessible: `docker exec -it wealthgrow-postgres psql -U postgres`
3. Ensure firewall rules allow container communication
4. Try recreating the network and reconnecting both containers

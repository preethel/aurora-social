#!/bin/bash
# Aurora Social - Quick Deploy for Existing Postgres
# This script deploys aurora-social using your existing wealthgrow-postgres

# Enable Docker BuildKit for faster builds with caching
export DOCKER_BUILDKIT=1

echo "🚀 Aurora Social - Quick Deploy"
echo "================================"
echo ""

# Step 1: Stop existing container if running
echo "⛔ Stopping existing aurora-social container..."
docker compose -f compose.prod.yml down 2>/dev/null || true
docker stop aurora-social-app 2>/dev/null || true
docker rm aurora-social-app 2>/dev/null || true

# Step 2: Create database if it doesn't exist
echo ""
echo "📦 Checking if database exists..."
DB_EXISTS=$(docker exec wealthgrow-postgres psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='auroraDb'" 2>/dev/null)

if [ "$DB_EXISTS" != "1" ]; then
  echo "Creating database 'auroraDb'..."
  docker exec wealthgrow-postgres psql -U postgres -c "CREATE DATABASE \"auroraDb\";" || {
    echo "⚠️  Could not create database. It might already exist or need different credentials."
  }
else
  echo "✅ Database 'auroraDb' already exists"
fi

# Step 3: Build and start
echo ""
echo "🔨 Building and starting Aurora Social..."
echo "💡 Using Docker BuildKit for faster builds with cache"
docker compose -f compose.prod.yml up -d --build

# Wait for container to start
echo "⏳ Waiting for container to initialize..."
sleep 10

# Step 4: Verify container is running
echo ""
if docker ps | grep -q aurora-social-app; then
  echo "✅ Container is running"
  
  # Verify client files exist
  echo ""
  echo "🔍 Verifying client files..."
  if docker exec aurora-social-app test -f /app/server/client/dist/index.html; then
    echo "✅ Client files found"
  else
    echo "❌ Client files not found. Checking directory structure..."
    docker exec aurora-social-app ls -la /app/server/client/ || echo "client directory not found"
    echo ""
    echo "This might indicate a build issue. Check build logs above."
  fi
else
  echo "❌ Container failed to start. Checking logs..."
  docker logs aurora-social-app 2>&1 | tail -20
  exit 1
fi

# Step 5: Test database connection
echo ""
echo "🧪 Testing database connection..."
if docker exec aurora-social-app sh -c "nc -zv wealthgrow-postgres 5432" 2>&1 | grep -q "open"; then
  echo "✅ Database connection successful"
elif docker exec aurora-social-app ping -c 2 wealthgrow-postgres >/dev/null 2>&1; then
  echo "✅ Network connection successful"
else
  echo "❌ Cannot reach database"
  echo ""
  echo "Run this command to check network:"
  echo "docker network inspect tradingapp_app-network | grep -E 'aurora-social-app|wealthgrow-postgres'"
  exit 1
fi

# Step 6: Run Prisma migrations
echo ""
echo "📦 Running database migrations..."
if docker exec aurora-social-app npx prisma migrate deploy; then
  echo "✅ Migrations completed"
else
  echo "⚠️  Migration failed. This might be normal if migrations were already applied."
  echo ""
  echo "Check migration status with:"
  echo "docker exec aurora-social-app npx prisma migrate status"
fi

# Step 7: Show status
echo ""
echo "================================"
echo "✨ Deployment Complete!"
echo "================================"
echo ""
echo "Container Status:"
docker ps | grep -E "CONTAINER|aurora-social-app"
echo ""
echo "Access your app at:"
echo "  http://localhost:3000"
echo ""
echo "Useful commands:"
echo "  View logs:      docker logs -f aurora-social-app"
echo "  Restart:        docker restart aurora-social-app"
echo "  Stop:           docker compose -f compose.prod.yml down"
echo "  Check DB:       docker exec aurora-social-app npx prisma migrate status"
echo ""

#!/bin/bash

# Aurora Social - Production Deployment Script
# For VM deployment with Docker (using existing PostgreSQL)

set -e

# Enable Docker BuildKit for faster builds with caching
export DOCKER_BUILDKIT=1

echo "🚀 Aurora Social - Production Deployment"
echo "========================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "📝 Please create .env file with required variables:"
    echo "   - DB_USER (default: postgres)"
    echo "   - DB_PASSWORD (default: postgres)"
    echo "   - DB_NAME (default: auroraDb)"
    echo "   - JWT_SECRET"
    echo "   - IFRAMELY_API_KEY"
    exit 1
fi

# Load environment variables
echo "📄 Loading environment variables..."
export $(cat .env | grep -v '^#' | xargs)

# Set defaults
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_NAME=${DB_NAME:-auroraDb}

# Check if app-network exists
if ! docker network inspect app-network >/dev/null 2>&1; then
    echo "❌ Error: app-network not found!"
    echo "Please ensure your existing docker-compose services are running."
    exit 1
fi

# Create database if it doesn't exist
echo "🗄️  Checking database..."
docker exec wealthgrow-postgres psql -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
    docker exec wealthgrow-postgres psql -U $DB_USER -c "CREATE DATABASE \"$DB_NAME\"" && \
    echo "✅ Database $DB_NAME created" || \
    echo "ℹ️  Database $DB_NAME already exists"

# Stop existing Aurora Social container
echo "⛔ Stopping existing Aurora Social container..."
docker compose -f compose.prod.yml down || true

# Pull latest code (if using git)
if [ -d .git ]; then
    echo "📥 Pulling latest code..."
    git pull || echo "⚠️  Git pull failed or not needed"
fi

# Build images
echo "🔨 Building Docker images..."
docker compose -f compose.prod.yml build --no-cache

# Start services
echo "🟢 Starting Aurora Social..."
docker compose -f compose.prod.yml up -d

# Wait for app to be ready
echo "⏳ Waiting for application to be ready..."
sleep 10

# Run Prisma migrations
echo "🔄 Running database migrations..."
docker compose -f compose.prod.yml exec -T aurora-social sh -c "cd /app/server && npx prisma migrate deploy"

# Create admin user if needed
echo "👤 Creating admin user..."
docker compose -f compose.prod.yml exec -T aurora-social sh -c "cd /app/server && node dist/scripts/createAdmin.js admin admin123" || echo "ℹ️  Admin user already exists"

# Show status
echo ""
echo "📋 Container Status:"
docker compose -f compose.prod.yml ps

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "🌐 Access your app at: http://$(hostname -I | awk '{print $1}'):${APP_PORT:-3000}"
echo "📊 API Docs: http://$(hostname -I | awk '{print $1}'):${APP_PORT:-3000}/api-docs"
echo ""
echo "📝 Useful commands:"
echo "   View logs:    docker compose -f compose.prod.yml logs -f"
echo "   Stop:         docker compose -f compose.prod.yml down"
echo "   Restart:      docker compose -f compose.prod.yml restart"
echo ""
echo "💡 Note: Using existing PostgreSQL container (wealthgrow-postgres)"
echo ""

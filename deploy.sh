#!/bin/bash

# Aurora Social - Production Deployment Script
# For VM deployment with Docker

set -e

echo "🚀 Aurora Social - Production Deployment"
echo "========================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "📝 Please create .env file with required variables:"
    echo "   - DB_USER"
    echo "   - DB_PASSWORD"
    echo "   - DB_NAME"
    echo "   - JWT_SECRET"
    echo "   - IFRAMELY_API_KEY"
    exit 1
fi

# Load environment variables
echo "📄 Loading environment variables..."
export $(cat .env | grep -v '^#' | xargs)

# Stop existing containers
echo "⛔ Stopping existing containers..."
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
echo "🟢 Starting services..."
docker compose -f compose.prod.yml up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run Prisma migrations
echo "🔄 Running database migrations..."
docker compose -f compose.prod.yml exec -T aurora-social sh -c "cd /app/server && npx prisma migrate deploy"

# Create admin user if needed
echo "👤 Checking admin user..."
docker compose -f compose.prod.yml exec -T aurora-social sh -c "cd /app/server && node dist/scripts/createAdmin.js admin admin123" || echo "ℹ️  Admin user already exists or creation failed"

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

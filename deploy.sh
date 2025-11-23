#!/bin/bash

# Aurora Social - Docker Compose Deployment Script
# Usage: ./deploy.sh [dev|prod]

ENV=${1:-dev}

echo "🚀 Deploying Aurora Social in $ENV mode..."

# Stop existing containers
echo "⛔ Stopping existing containers..."
docker compose -f compose${ENV:+.${ENV}}.yml down || true

# Build image
echo "🔨 Building Docker image..."
docker-compose -f compose${ENV:+.${ENV}}.yml build --no-cache

# Start containers
echo "🟢 Starting containers..."
if [ "$ENV" = "prod" ]; then
  docker compose -f compose.prod.yml up -d
  echo "✅ Production deployment complete!"
  echo "🌐 Access your app at: http://localhost:3000"
else
  docker compose -f compose.yml up -d
  echo "✅ Development deployment complete!"
  echo "🌐 Access your app at: http://localhost:3000"
  echo "📊 View logs: docker compose logs -f aurora-social"
fi

# Show status
echo ""
echo "📋 Container Status:"
docker compose -f compose${ENV:+.${ENV}}.yml ps

# Health check
echo ""
echo "⏳ Waiting for app to be healthy..."
sleep 5
docker compose -f compose${ENV:+.${ENV}}.yml ps

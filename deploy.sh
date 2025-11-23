#!/bin/bash

# Aurora Social - Docker Compose Deployment Script
# Usage: ./deploy.sh [dev|prod]

ENV=${1:-dev}

echo "🚀 Deploying Aurora Social in $ENV mode..."

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  echo "📄 Loading environment variables from .env file..."
  export $(cat .env | grep -v '^#' | xargs)
fi

# Stop existing containers
echo "⛔ Stopping existing containers..."
docker compose -f compose${ENV:+.${ENV}}.yml down || true

# Build image with build arguments
echo "🔨 Building Docker image..."
if [ "$ENV" = "prod" ]; then
  docker compose -f compose.prod.yml build --no-cache
else
  docker compose -f compose.dev.yaml build --no-cache
fi

# Start containers
echo "🟢 Starting containers..."
if [ "$ENV" = "prod" ]; then
  docker compose -f compose.prod.yml up -d
  echo "✅ Production deployment complete!"
  echo "🌐 Access your app at: http://localhost:3000"
else
  docker compose -f compose.dev.yaml up -d
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

echo ""
echo "✨ Deployment Summary:"
echo "   - Test Mode: ${VITE_TEST_MODE:-true}"
echo "   - Node Env: ${NODE_ENV:-production}"
echo "   - Port: ${PORT:-8080}"
echo ""
echo "💡 Tip: Check logs with: docker compose -f compose${ENV:+.${ENV}}.yml logs -f"

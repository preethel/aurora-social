#!/bin/bash

# Aurora Social - Database Connection Fix Script
# Automatically detects and fixes network connectivity issues with PostgreSQL

set -e

echo "🔧 Aurora Social - Database Connection Fixer"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if postgres container exists
echo -e "${YELLOW}Step 1: Checking PostgreSQL container...${NC}"
if ! docker ps -a | grep -q wealthgrow-postgres; then
  echo -e "${RED}❌ Error: wealthgrow-postgres container not found${NC}"
  echo "Please ensure your PostgreSQL container is running first."
  exit 1
fi

if ! docker ps | grep -q wealthgrow-postgres; then
  echo -e "${RED}❌ Error: wealthgrow-postgres container is not running${NC}"
  echo "Starting PostgreSQL container..."
  docker start wealthgrow-postgres
  sleep 3
fi

echo -e "${GREEN}✅ PostgreSQL container is running${NC}"

# Step 2: Find PostgreSQL network
echo ""
echo -e "${YELLOW}Step 2: Detecting PostgreSQL network...${NC}"
POSTGRES_NETWORK=$(docker inspect wealthgrow-postgres --format='{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}')

if [ -z "$POSTGRES_NETWORK" ]; then
  echo -e "${RED}❌ Could not detect PostgreSQL network${NC}"
  echo "Creating default network: wealthgrow-network"
  docker network create wealthgrow-network
  docker network connect wealthgrow-network wealthgrow-postgres
  POSTGRES_NETWORK="wealthgrow-network"
fi

echo -e "${GREEN}✅ PostgreSQL network: $POSTGRES_NETWORK${NC}"

# Step 3: Verify network exists
echo ""
echo -e "${YELLOW}Step 3: Verifying network exists...${NC}"
if ! docker network inspect $POSTGRES_NETWORK >/dev/null 2>&1; then
  echo "Creating network: $POSTGRES_NETWORK"
  docker network create $POSTGRES_NETWORK
fi
echo -e "${GREEN}✅ Network verified${NC}"

# Step 4: Update compose file if needed
echo ""
echo -e "${YELLOW}Step 4: Updating compose configuration...${NC}"
CURRENT_NETWORK=$(grep -A 2 "^networks:" compose.prod.yml | grep -v "^networks:" | grep -v "external" | awk '{print $1}' | tr -d ':')

if [ "$CURRENT_NETWORK" != "$POSTGRES_NETWORK" ]; then
  echo "Updating network name in compose.prod.yml..."
  # Create backup
  cp compose.prod.yml compose.prod.yml.backup
  
  # Replace network name
  sed -i.tmp "s/$CURRENT_NETWORK/$POSTGRES_NETWORK/g" compose.prod.yml
  rm compose.prod.yml.tmp
  
  echo -e "${GREEN}✅ Compose file updated (backup saved as compose.prod.yml.backup)${NC}"
else
  echo -e "${GREEN}✅ Compose file already uses correct network${NC}"
fi

# Step 5: Stop existing container
echo ""
echo -e "${YELLOW}Step 5: Stopping existing Aurora Social container...${NC}"
docker compose -f compose.prod.yml down 2>/dev/null || true
echo -e "${GREEN}✅ Container stopped${NC}"

# Step 6: Build and start
echo ""
echo -e "${YELLOW}Step 6: Building and starting Aurora Social...${NC}"
docker compose -f compose.prod.yml up -d --build

# Wait for container to initialize
echo "Waiting for container to initialize..."
sleep 8

# Step 7: Verify network connection
echo ""
echo -e "${YELLOW}Step 7: Verifying network connectivity...${NC}"

# Check if both containers are on the same network
if docker network inspect $POSTGRES_NETWORK | grep -q aurora-social-app && \
   docker network inspect $POSTGRES_NETWORK | grep -q wealthgrow-postgres; then
  echo -e "${GREEN}✅ Both containers are on the same network${NC}"
else
  echo -e "${YELLOW}Connecting aurora-social-app to network...${NC}"
  docker network connect $POSTGRES_NETWORK aurora-social-app 2>/dev/null || true
  sleep 2
fi

# Test connectivity
echo "Testing database connectivity..."
if docker exec aurora-social-app sh -c "nc -zv wealthgrow-postgres 5432" 2>&1 | grep -q "open"; then
  echo -e "${GREEN}✅ Network connection successful!${NC}"
else
  # Try ping as fallback
  if docker exec aurora-social-app ping -c 2 wealthgrow-postgres >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Network connection successful!${NC}"
  else
    echo -e "${RED}❌ Cannot reach database${NC}"
    echo ""
    echo "Manual steps to try:"
    echo "1. docker network connect $POSTGRES_NETWORK aurora-social-app"
    echo "2. docker restart aurora-social-app"
    echo "3. docker exec aurora-social-app ping wealthgrow-postgres"
    exit 1
  fi
fi

# Step 8: Run Prisma migrations
echo ""
echo -e "${YELLOW}Step 8: Running database migrations...${NC}"
if docker exec aurora-social-app npx prisma migrate deploy; then
  echo -e "${GREEN}✅ Migrations completed successfully${NC}"
else
  echo -e "${RED}❌ Migration failed${NC}"
  echo ""
  echo "This might be due to:"
  echo "1. Database doesn't exist - Create it with:"
  echo "   docker exec -it wealthgrow-postgres psql -U postgres -c 'CREATE DATABASE \"auroraDb\";'"
  echo ""
  echo "2. Wrong credentials - Check your .env file"
  echo ""
  echo "3. Prisma client needs to be regenerated:"
  echo "   docker exec aurora-social-app npx prisma generate"
  echo "   docker exec aurora-social-app npx prisma migrate deploy"
  exit 1
fi

# Step 9: Final health check
echo ""
echo -e "${YELLOW}Step 9: Running health check...${NC}"
sleep 3

if docker ps | grep -q aurora-social-app; then
  echo -e "${GREEN}✅ Container is running${NC}"
  
  # Check logs for errors
  if docker logs aurora-social-app 2>&1 | tail -20 | grep -q -i "error"; then
    echo -e "${YELLOW}⚠️  Some errors detected in logs. Showing last 20 lines:${NC}"
    docker logs aurora-social-app 2>&1 | tail -20
  else
    echo -e "${GREEN}✅ No errors in recent logs${NC}"
  fi
else
  echo -e "${RED}❌ Container is not running${NC}"
  echo "Check logs: docker logs aurora-social-app"
  exit 1
fi

# Summary
echo ""
echo "=============================================="
echo -e "${GREEN}🎉 Database Connection Fixed!${NC}"
echo "=============================================="
echo ""
echo "Summary:"
echo "  PostgreSQL Network: $POSTGRES_NETWORK"
echo "  Database Host: wealthgrow-postgres:5432"
echo "  Database Name: auroraDb"
echo ""
echo "Useful commands:"
echo "  View logs:        docker logs -f aurora-social-app"
echo "  Check status:     docker ps | grep aurora"
echo "  Test DB:          docker exec aurora-social-app npx prisma migrate status"
echo "  Restart:          docker restart aurora-social-app"
echo ""
echo "Access your app at: http://localhost:3000"
echo ""

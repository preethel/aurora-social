#!/bin/bash

# Aurora Social - Azure VM Quick Setup Script
# Usage: ./vm-setup.sh

set -e

echo "🚀 Aurora Social - Azure VM Setup"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
  echo -e "${RED}❌ Please do not run as root${NC}"
  exit 1
fi

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Step 1: Install Docker
echo -e "${YELLOW}📦 Step 1: Checking Docker installation...${NC}"
if command_exists docker; then
  echo -e "${GREEN}✓ Docker is already installed${NC}"
  docker --version
else
  echo -e "${YELLOW}Installing Docker...${NC}"
  
  # Update package index
  sudo apt-get update
  
  # Install dependencies
  sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release
  
  # Add Docker's official GPG key
  sudo mkdir -m 0755 -p /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  
  # Set up repository
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  
  # Install Docker Engine
  sudo apt-get update
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  
  # Add user to docker group
  sudo usermod -aG docker $USER
  
  echo -e "${GREEN}✓ Docker installed successfully${NC}"
  echo -e "${YELLOW}⚠️  Please log out and log back in for docker group changes to take effect${NC}"
  echo -e "${YELLOW}⚠️  Then run this script again${NC}"
  exit 0
fi

# Step 2: Configure Firewall
echo ""
echo -e "${YELLOW}🔒 Step 2: Configuring firewall...${NC}"
if command_exists ufw; then
  echo "Configuring UFW firewall..."
  
  # Allow HTTP
  sudo ufw allow 80/tcp
  echo -e "${GREEN}✓ Allowed port 80 (HTTP)${NC}"
  
  # Allow HTTPS
  sudo ufw allow 443/tcp
  echo -e "${GREEN}✓ Allowed port 443 (HTTPS)${NC}"
  
  # Ensure SSH is allowed
  sudo ufw allow 22/tcp
  echo -e "${GREEN}✓ Allowed port 22 (SSH)${NC}"
  
  # Enable firewall
  sudo ufw --force enable
  
  echo -e "${GREEN}✓ Firewall configured${NC}"
  sudo ufw status
else
  echo -e "${YELLOW}⚠️  UFW not found, skipping firewall configuration${NC}"
fi

# Step 3: Environment Variables
echo ""
echo -e "${YELLOW}🔧 Step 3: Setting up environment variables...${NC}"

if [ -f .env ]; then
  echo -e "${YELLOW}⚠️  .env file already exists${NC}"
  read -p "Do you want to overwrite it? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Keeping existing .env file"
  else
    rm .env
  fi
fi

if [ ! -f .env ]; then
  echo "Creating .env file..."
  
  # Prompt for API key
  read -p "Enter your Iframely API Key (or press Enter to skip): " IFRAMELY_KEY
  
  if [ -z "$IFRAMELY_KEY" ]; then
    IFRAMELY_KEY="your-api-key-here"
  fi
  
  # Create .env file
  cat > .env << EOF
# Aurora Social Environment Variables
VITE_TEST_MODE=true
IFRAMELY_API_KEY=${IFRAMELY_KEY}
PORT=8080
NODE_ENV=production
EOF
  
  echo -e "${GREEN}✓ .env file created${NC}"
  
  if [ "$IFRAMELY_KEY" = "your-api-key-here" ]; then
    echo -e "${YELLOW}⚠️  Don't forget to update IFRAMELY_API_KEY in .env file${NC}"
  fi
else
  echo -e "${GREEN}✓ Using existing .env file${NC}"
fi

# Step 4: Build Docker Image
echo ""
echo -e "${YELLOW}🔨 Step 4: Building Docker image...${NC}"
echo "This may take a few minutes..."

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

docker build --build-arg VITE_TEST_MODE=true -t aurora-social:latest .

echo -e "${GREEN}✓ Docker image built successfully${NC}"

# Step 5: Deploy Application
echo ""
echo -e "${YELLOW}🚀 Step 5: Deploying application...${NC}"

# Stop and remove existing container if it exists
if [ "$(docker ps -aq -f name=aurora-social)" ]; then
  echo "Stopping existing container..."
  docker stop aurora-social || true
  docker rm aurora-social || true
fi

# Run new container
docker run -d \
  --name aurora-social \
  -p 80:8080 \
  --env-file .env \
  --restart unless-stopped \
  aurora-social:latest

echo -e "${GREEN}✓ Application deployed successfully${NC}"

# Step 6: Verify Deployment
echo ""
echo -e "${YELLOW}✅ Step 6: Verifying deployment...${NC}"
sleep 3

if [ "$(docker ps -q -f name=aurora-social)" ]; then
  echo -e "${GREEN}✓ Container is running${NC}"
  
  # Show container logs
  echo ""
  echo "Last 10 lines of logs:"
  docker logs --tail 10 aurora-social
  
  # Get VM IP
  VM_IP=$(curl -s ifconfig.me || echo "localhost")
  
  echo ""
  echo "=================================="
  echo -e "${GREEN}🎉 Deployment Successful!${NC}"
  echo "=================================="
  echo ""
  echo "📍 Application URL: http://${VM_IP}"
  echo ""
  echo "Useful Commands:"
  echo "  View logs:      docker logs -f aurora-social"
  echo "  Stop app:       docker stop aurora-social"
  echo "  Start app:      docker start aurora-social"
  echo "  Restart app:    docker restart aurora-social"
  echo "  Remove app:     docker stop aurora-social && docker rm aurora-social"
  echo ""
  echo "To update the application:"
  echo "  1. git pull"
  echo "  2. ./vm-setup.sh"
  echo ""
else
  echo -e "${RED}❌ Container failed to start${NC}"
  echo "Check logs with: docker logs aurora-social"
  exit 1
fi

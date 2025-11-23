# Azure Deployment Guide for Aurora Social

## Environment Variables Setup

For proper deployment on Azure, you need to configure the following environment variables:

### Required Variables

1. **VITE_TEST_MODE** (Build-time variable)

   - Set to `true` to load test posts automatically
   - Set to `false` for production with empty state
   - **Important**: This must be set during Docker build

2. **IFRAMELY_API_KEY** (Runtime variable)

   - API key for Iframely embed service
   - Get from: https://iframely.com/

3. **PORT** (Runtime variable)

   - Port number for the server (default: 8080)

4. **NODE_ENV** (Runtime variable)
   - Set to `production` for Azure deployment

## Azure Container Apps Configuration

### Option 1: Using Azure Portal

1. Go to your Container App in Azure Portal
2. Navigate to **Settings** > **Environment variables**
3. Add the following variables:

```
Name: VITE_TEST_MODE
Value: true
Type: Build argument (if available) or Environment variable
```

```
Name: IFRAMELY_API_KEY
Value: <your-api-key>
Type: Secret
```

```
Name: PORT
Value: 8080
Type: Environment variable
```

```
Name: NODE_ENV
Value: production
Type: Environment variable
```

### Option 2: Using Azure CLI

```bash
# Set build-time environment variable
az containerapp create \
  --name aurora-social \
  --resource-group <your-resource-group> \
  --environment <your-environment> \
  --image <your-registry>/aurora-social:latest \
  --env-vars \
    "VITE_TEST_MODE=true" \
    "NODE_ENV=production" \
    "PORT=8080" \
  --secrets \
    "iframely-api-key=<your-api-key>" \
  --env-vars \
    "IFRAMELY_API_KEY=secretref:iframely-api-key"
```

## Azure Virtual Machine (VM) Deployment

### Method 1: Using .env File (Recommended)

1. **SSH into your Azure VM:**
   ```bash
   ssh azureuser@<your-vm-ip>
   ```

2. **Clone your repository:**
   ```bash
   git clone https://github.com/preethel/aurora-social.git
   cd aurora-social
   ```

3. **Create .env file:**
   ```bash
   nano .env
   ```

4. **Add environment variables:**
   ```env
   VITE_TEST_MODE=true
   IFRAMELY_API_KEY=<your-api-key>
   PORT=8080
   NODE_ENV=production
   ```

5. **Save and exit** (Ctrl+X, then Y, then Enter)

6. **Deploy with Docker Compose:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh prod
   ```

### Method 2: Using systemd Environment File

1. **Create environment file in system location:**
   ```bash
   sudo nano /etc/aurora-social.env
   ```

2. **Add variables:**
   ```env
   VITE_TEST_MODE=true
   IFRAMELY_API_KEY=your-api-key-here
   PORT=8080
   NODE_ENV=production
   ```

3. **Secure the file:**
   ```bash
   sudo chmod 600 /etc/aurora-social.env
   sudo chown root:root /etc/aurora-social.env
   ```

4. **Update docker-compose to use env file:**
   ```bash
   docker compose -f compose.prod.yml --env-file /etc/aurora-social.env up -d
   ```

### Method 3: Export Environment Variables in Shell

1. **Add to ~/.bashrc or ~/.zshrc:**
   ```bash
   nano ~/.bashrc
   ```

2. **Add at the end:**
   ```bash
   export VITE_TEST_MODE=true
   export IFRAMELY_API_KEY=<your-api-key>
   export PORT=8080
   export NODE_ENV=production
   ```

3. **Reload shell:**
   ```bash
   source ~/.bashrc
   ```

4. **Deploy:**
   ```bash
   ./deploy.sh prod
   ```

### Method 4: Pass as Docker Run Arguments

If running Docker directly without compose:

```bash
docker run -d \
  --name aurora-social \
  -p 80:8080 \
  -e VITE_TEST_MODE=true \
  -e IFRAMELY_API_KEY=<your-api-key> \
  -e PORT=8080 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  aurora-social:latest
```

### VM Setup Prerequisites

1. **Install Docker:**
   ```bash
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
   
   # Add your user to docker group
   sudo usermod -aG docker $USER
   newgrp docker
   ```

2. **Verify Docker installation:**
   ```bash
   docker --version
   docker compose version
   ```

3. **Configure Firewall:**
   ```bash
   # Allow port 80 (HTTP)
   sudo ufw allow 80/tcp
   
   # Allow port 443 (HTTPS) if using SSL
   sudo ufw allow 443/tcp
   
   # Allow SSH (if not already allowed)
   sudo ufw allow 22/tcp
   
   # Enable firewall
   sudo ufw enable
   sudo ufw status
   ```

### Complete VM Deployment Steps

```bash
# 1. SSH into VM
ssh azureuser@<your-vm-ip>

# 2. Install Docker (if not installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# 3. Clone repository
git clone https://github.com/preethel/aurora-social.git
cd aurora-social

# 4. Create .env file
cat > .env << EOF
VITE_TEST_MODE=true
IFRAMELY_API_KEY=<your-api-key>
PORT=8080
NODE_ENV=production
EOF

# 5. Build with environment variables
docker build --build-arg VITE_TEST_MODE=true -t aurora-social:latest .

# 6. Run container
docker run -d \
  --name aurora-social \
  -p 80:8080 \
  --env-file .env \
  --restart unless-stopped \
  aurora-social:latest

# 7. Verify deployment
docker ps
docker logs aurora-social

# 8. Test application
curl http://localhost
```

### Updating the Application on VM

```bash
# 1. Pull latest changes
cd aurora-social
git pull

# 2. Rebuild image
docker build --build-arg VITE_TEST_MODE=true -t aurora-social:latest .

# 3. Stop and remove old container
docker stop aurora-social
docker rm aurora-social

# 4. Start new container
docker run -d \
  --name aurora-social \
  -p 80:8080 \
  --env-file .env \
  --restart unless-stopped \
  aurora-social:latest

# Or use docker-compose
./deploy.sh prod
```

### Monitoring on VM

```bash
# View logs
docker logs -f aurora-social

# Check container status
docker ps -a

# View resource usage
docker stats aurora-social

# Check disk space
df -h

# Monitor system resources
htop
```

### Option 3: Using Docker Compose (Recommended for Local Testing)

Before deploying to Azure, test locally:

```bash
# Create .env file
cp .env.example .env

# Edit .env file with your values
nano .env

# Deploy with docker-compose
./deploy.sh prod
```

Your `.env` file should contain:

```env
VITE_TEST_MODE=true
IFRAMELY_API_KEY=<your-api-key>
PORT=8080
NODE_ENV=production
```

## Building for Azure

### Manual Build

```bash
# Build with test mode enabled
docker build \
  --build-arg VITE_TEST_MODE=true \
  -t aurora-social:latest .

# Run locally to test
docker run -p 8080:8080 \
  -e IFRAMELY_API_KEY=<your-key> \
  -e NODE_ENV=production \
  aurora-social:latest
```

### Push to Azure Container Registry

```bash
# Login to ACR
az acr login --name <your-acr-name>

# Tag image
docker tag aurora-social:latest \
  <your-acr-name>.azurecr.io/aurora-social:latest

# Push image
docker push <your-acr-name>.azurecr.io/aurora-social:latest
```

## Troubleshooting

### Posts not showing in Azure

**Problem**: No posts visible after deployment

**Solution**: Ensure `VITE_TEST_MODE=true` is set as a **build argument** in Dockerfile build process.

```bash
# Rebuild with correct build arg
docker build --build-arg VITE_TEST_MODE=true -t aurora-social .
```

### YouTube previews not working

**Problem**: YouTube videos not displaying

**Solution**: This should be fixed now. The app uses direct YouTube embeds without API calls. Ensure your browser/network allows YouTube iframes.

### Iframely embeds failing

**Problem**: Other social media embeds (Instagram, Facebook, etc.) not loading

**Solution**:

1. Check that `IFRAMELY_API_KEY` is correctly set
2. Verify API key is valid at https://iframely.com/
3. Check server logs: `docker logs <container-id>`

### Container health check failing

**Problem**: Container restarts repeatedly

**Solution**:

1. Check if port 8080 is accessible inside container
2. Verify all dependencies are installed
3. Check logs: `docker logs <container-id>`

## Complete Deployment Checklist

- [ ] Set `VITE_TEST_MODE=true` as build argument
- [ ] Set `IFRAMELY_API_KEY` in Azure secrets
- [ ] Set `PORT=8080` in environment variables
- [ ] Set `NODE_ENV=production` in environment variables
- [ ] Build Docker image with correct build args
- [ ] Push image to Azure Container Registry
- [ ] Deploy to Azure Container Apps
- [ ] Verify health check passes
- [ ] Test YouTube preview functionality
- [ ] Test other social media embeds
- [ ] Verify test posts are visible

## Support

For issues specific to:

- **YouTube embeds**: Check SafeEmbed.tsx implementation
- **Build failures**: Review Dockerfile and build logs
- **Azure deployment**: Check Azure Portal logs and diagnostics
- **Environment variables**: Ensure all required vars are set

## Notes

- **Test Mode**: Enabled by default to provide sample data
- **LocalStorage**: User data is stored in browser localStorage
- **Data Persistence**: Each user has their own data, not shared across browsers
- **Production Usage**: For real production, consider adding a backend database

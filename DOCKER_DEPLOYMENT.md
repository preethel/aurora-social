# Aurora Social - Docker Deployment Guide

## Prerequisites

- Docker installed and running
- Docker Compose (v3.8+)
- `.env` file configured with `IFRAMELY_API_KEY`

## Quick Start (Local Development)

### 1. Build and Run with Docker Compose

```bash
# Build and start containers
docker compose up -d

# View logs
docker compose logs -f aurora-social

# Stop containers
docker compose down
```

The app will be available at: **http://localhost:3000**

## Azure VM Deployment

### 1. Setup on Azure VM

```bash
# SSH into your Azure VM
ssh azureuser@<your-vm-ip>

# Navigate to project directory
cd ~/workingDirectory/aurora-social

# Create .env file with production settings
cat > .env << EOF
IFRAMELY_API_KEY=718690c4bc3c1be271bbd3
VITE_TEST_MODE=false
PORT=8080
NODE_ENV=production
EOF
```

### 2. Deploy using Docker Compose

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Or use the deployment script
./deploy.sh prod
```

### 3. Access Your App

```
http://<your-vm-ip>:3000
```

## Docker Compose Files

### `docker-compose.yml` (Development)

- Test mode: **enabled** (auto-loads test posts)
- Health checks: enabled
- Logs: verbose
- Port mapping: 3000:8080

### `docker-compose.prod.yml` (Production)

- Test mode: **disabled** by default
- Optimized logging (10MB max, 3 files)
- Health checks: enabled
- Same port mapping

## Environment Variables

Create `.env` file in project root:

```env
# Required
IFRAMELY_API_KEY=your_api_key_here

# Optional
VITE_TEST_MODE=true          # Load test posts (dev only)
PORT=8080                     # Server port (default: 8080)
NODE_ENV=production          # production or development
```

## Container Management

### View Logs

```bash
# Real-time logs
docker-compose logs -f aurora-social

# Last 100 lines
docker-compose logs --tail=100 aurora-social

# With timestamp
docker-compose logs -f --timestamps aurora-social
```

### Stop/Start Containers

```bash
# Stop
docker-compose stop

# Start (without rebuilding)
docker-compose start

# Restart
docker-compose restart

# Remove everything
docker-compose down
```

### Check Container Health

```bash
# See status
docker-compose ps

# Inspect container
docker inspect aurora-social-app

# Test health manually
curl http://localhost:3000
```

## Troubleshooting

### App shows "unhealthy"

```bash
# Check logs
docker-compose logs aurora-social

# Common issues:
# 1. Port already in use
# 2. Missing .env file
# 3. Build failure
```

### Port 3000 already in use

```bash
# Change port in docker-compose.yml
# Change: ports: - "3000:8080"
# To:     ports: - "3001:8080"

docker-compose down
docker-compose up -d
```

### Clear everything and rebuild

```bash
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

## Production Deployment Checklist

- [ ] Set `VITE_TEST_MODE=false` in `.env`
- [ ] Verify `IFRAMELY_API_KEY` is correct
- [ ] Use `docker-compose.prod.yml` for deployment
- [ ] Configure firewall to allow port 3000
- [ ] Setup reverse proxy (nginx/Apache) for HTTPS
- [ ] Configure backup/restore strategy
- [ ] Monitor logs and health checks

## Monitoring

### Real-time Monitoring

```bash
# Watch container stats
docker stats aurora-social-app

# Follow logs
docker-compose logs -f --tail=50 aurora-social
```

### Health Check URL

```bash
curl -I http://localhost:3000
```

Expected response:

```
HTTP/1.1 200 OK
```

## Advanced Configuration

### Custom Network

The setup uses a bridge network named `aurora-network`. To connect other services:

```yaml
networks:
  - aurora-network
```

### Volume Persistence

Current setup has read-only volume for dist. For persistent data:

```yaml
volumes:
  - aurora-data:/app/data
```

## API Endpoints

- **Frontend**: `http://localhost:3000`
- **API**: `http://localhost:8080/api/iframely`
- **Health**: `http://localhost:8080`

## Support

For issues:

1. Check logs: `docker-compose logs aurora-social`
2. Verify `.env` configuration
3. Ensure all ports are available
4. Rebuild if needed: `docker-compose up -d --build`

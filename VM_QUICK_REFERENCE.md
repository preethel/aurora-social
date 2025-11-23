# Azure VM Deployment - Quick Reference

## 🚀 Quick Start (Automated)

```bash
# 1. SSH into your VM
ssh azureuser@<your-vm-ip>

# 2. Clone repository
git clone https://github.com/preethel/aurora-social.git
cd aurora-social

# 3. Run setup script
chmod +x vm-setup.sh
./vm-setup.sh

# 4. Enter your Iframely API key when prompted
# Done! 🎉
```

## 📋 Manual Setup Commands

### Install Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### Configure Environment

```bash
cat > .env << EOF
VITE_TEST_MODE=true
IFRAMELY_API_KEY=your-api-key-here
PORT=8080
NODE_ENV=production
EOF
```

### Build & Deploy

```bash
# Build image
docker build --build-arg VITE_TEST_MODE=true -t aurora-social:latest .

# Run container
docker run -d \
  --name aurora-social \
  -p 80:8080 \
  --env-file .env \
  --restart unless-stopped \
  aurora-social:latest
```

## 🔧 Useful Commands

### Container Management

```bash
# View logs
docker logs -f aurora-social

# Stop application
docker stop aurora-social

# Start application
docker start aurora-social

# Restart application
docker restart aurora-social

# Remove container
docker stop aurora-social && docker rm aurora-social
```

### Update Application

```bash
# Pull latest changes
cd aurora-social
git pull

# Rebuild and redeploy
docker build --build-arg VITE_TEST_MODE=true -t aurora-social:latest .
docker stop aurora-social && docker rm aurora-social
docker run -d --name aurora-social -p 80:8080 --env-file .env --restart unless-stopped aurora-social:latest
```

### Monitoring

```bash
# Container status
docker ps -a

# Resource usage
docker stats aurora-social

# Disk space
df -h

# System resources
htop
```

## 🔒 Firewall Configuration

```bash
# Allow HTTP (port 80)
sudo ufw allow 80/tcp

# Allow HTTPS (port 443)
sudo ufw allow 443/tcp

# Ensure SSH is allowed
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## 🌐 Access Application

After deployment, access your application at:

```
http://<your-vm-public-ip>
```

To find your VM's public IP:

```bash
curl ifconfig.me
```

## 📝 Environment Variables

Required variables in `.env` file:

| Variable           | Value        | Description       |
| ------------------ | ------------ | ----------------- |
| `VITE_TEST_MODE`   | `true`       | Load sample posts |
| `IFRAMELY_API_KEY` | `your-key`   | Iframely API key  |
| `PORT`             | `8080`       | Internal port     |
| `NODE_ENV`         | `production` | Environment       |

**Important:** `VITE_TEST_MODE` must be set during build as `--build-arg`

## 🐛 Troubleshooting

### Container won't start

```bash
# Check logs
docker logs aurora-social

# Check if port is in use
sudo netstat -tulpn | grep :80

# Verify .env file
cat .env
```

### No posts showing

```bash
# Rebuild with VITE_TEST_MODE
docker build --build-arg VITE_TEST_MODE=true -t aurora-social:latest .

# Verify build arg was set
docker history aurora-social:latest | grep VITE_TEST_MODE
```

### Can't access from browser

```bash
# Check firewall
sudo ufw status

# Check container is running
docker ps

# Check port binding
docker port aurora-social

# Test locally
curl http://localhost
```

### Out of disk space

```bash
# Clean up Docker
docker system prune -a

# Remove unused images
docker image prune -a

# Check disk usage
df -h
du -sh /var/lib/docker
```

## 🔄 Backup & Restore

### Backup (if using volume for data)

```bash
docker run --rm \
  --volumes-from aurora-social \
  -v $(pwd):/backup \
  ubuntu tar czf /backup/backup.tar.gz /app/data
```

### Restore

```bash
docker run --rm \
  --volumes-from aurora-social \
  -v $(pwd):/backup \
  ubuntu tar xzf /backup/backup.tar.gz -C /
```

## 📊 Health Check

```bash
# Check application health
curl http://localhost/

# Check container health
docker inspect --format='{{.State.Health.Status}}' aurora-social

# View health check logs
docker inspect --format='{{json .State.Health}}' aurora-social | jq
```

## 🔐 Security Best Practices

1. **Keep .env file secure:**

   ```bash
   chmod 600 .env
   ```

2. **Don't commit .env to git:**

   ```bash
   echo ".env" >> .gitignore
   ```

3. **Use SSH keys instead of passwords:**

   ```bash
   ssh-keygen -t ed25519
   ssh-copy-id azureuser@<vm-ip>
   ```

4. **Regular updates:**

   ```bash
   sudo apt-get update && sudo apt-get upgrade -y
   ```

5. **Monitor logs regularly:**
   ```bash
   docker logs --since 1h aurora-social
   ```

## 📞 Support

- **Documentation:** [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md)
- **Issues:** GitHub Issues
- **Docker Hub:** [Docker Documentation](https://docs.docker.com/)

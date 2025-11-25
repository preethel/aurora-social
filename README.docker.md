# Aurora Social - Docker Setup

## Prerequisites

- Docker and Docker Compose installed

> **Note**: Aurora Social এখন সম্পূর্ণ independent - নিজস্ব postgres database আছে।

## Setup Instructions

### 1. Set environment variables

```bash
cp .env.example .env
```

Edit `.env` and update these values:

- **JWT_SECRET**: Use a strong, random secret (required)
- **IFRAMELY_API_KEY**: Your Iframely API key (optional, for rich embeds)

### 2. Build and run the containers

```bash
# Build image
docker compose build

# Start services (postgres + app)
docker compose up -d

# View logs
docker compose logs -f
```

### 3. Create admin user (first time only)

```bash
docker exec -it aurora-app npm run create-admin
```

## Service URLs

- **Application**: http://localhost:3000 (Client UI + API)
- **API Docs**: http://localhost:3000/api-docs
- **Postgres**: localhost:5434 (from host machine)

## Database Information

- **Host**: aurora-postgres (container) or localhost:5434 (from host)
- **Database**: AuroraSocialDb
- **User**: postgres
- **Password**: postgres

Aurora Social has its **own dedicated Postgres database**.

## Architecture

This is a **production-optimized** setup:

- Single container runs both client and server
- Server serves static client files
- Client built with Vite and bundled into the container
- No CORS issues (same origin)
- Lower resource usage
- Simpler deployment

## Useful Commands

```bash
# Stop service
docker compose down

# Rebuild and restart
docker compose up -d --build

# View logs
docker compose logs -f aurora-app

# Access container
docker exec -it aurora-app sh

# Run Prisma migrations manually
docker exec -it aurora-app npx prisma migrate deploy

# Restart service
docker compose restart aurora-app

# Check health
docker inspect --format='{{.State.Health.Status}}' aurora-app
```

## Troubleshooting

### Database connection issues

1. Ensure postgres is running:

   ```bash
   docker ps | grep aurora-postgres
   ```

2. Check postgres logs:
   ```bash
   docker compose logs aurora-postgres
   ```

### Port conflicts

If port 3000 is already in use, modify the port mapping in `compose.yml`:

```yaml
ports:
  - "3001:3000" # Change host port
```

### Build issues

If build fails, try:

```bash
# Clean build
docker compose build --no-cache

# Check build logs
docker compose build --progress=plain
```

## Production Considerations

1. **Change JWT_SECRET**: Use a strong, random secret in production
2. **Use environment files**: Create `.env.production` with production values
3. **Enable HTTPS**: Add nginx reverse proxy with SSL certificates
4. **Database backups**: Set up regular backups of the AuroraSocialDb database
5. **Resource limits**: Add resource constraints in compose.yml:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: "1"
         memory: 512M
   ```
6. **Monitoring**: Implement logging and monitoring solutions
7. **Log aggregation**: Use Docker logging drivers for centralized logging

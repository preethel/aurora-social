# Aurora Social - Integration with Existing Docker Setup

## 🔗 Integration Summary

Aurora Social has been configured to integrate with your existing Docker services:

### Shared Resources

1. **PostgreSQL Database**: Uses existing `wealthgrow-postgres` container
   - No separate postgres container created
   - Creates new database `auroraDb` in existing postgres
   - Port: 5433 (host) → 5432 (container)

2. **Docker Network**: Uses existing `app-network`
   - All services can communicate
   - No network conflicts

3. **Ports**:
   - Aurora Social: `3000` (configurable via `APP_PORT`)
   - No conflict with existing services

### Your Existing Services (Unchanged)

- **RabbitMQ**: ports 5672, 15672
- **PostgreSQL**: port 5433
- **MonolithHost API**: port 5999
- **MongoDB**: port 27017
- **Nginx**: ports 80, 443

## 📋 Deployment Steps

### 1. Create .env File

```bash
cd ~/workingDirectory/aurora-social

cat > .env << EOF
# Database (uses existing wealthgrow-postgres)
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=auroraDb

# Application
JWT_SECRET=$(openssl rand -base64 32)
IFRAMELY_API_KEY=your_iframely_key

# Optional
APP_PORT=3000
NODE_ENV=production
EOF
```

### 2. Deploy

```bash
chmod +x deploy.sh
./deploy.sh
```

The script will:
- ✅ Check if `app-network` exists
- ✅ Create `auroraDb` database in existing postgres
- ✅ Build Aurora Social container
- ✅ Run migrations
- ✅ Create admin user

### 3. Access

- **Aurora Social**: `http://YOUR_IP:3000`
- **API Docs**: `http://YOUR_IP:3000/api-docs`

## 🔍 Verification

Check all services are running:

```bash
docker ps
```

You should see:
- `wealthgrow-mq` (RabbitMQ)
- `wealthgrow-postgres` (PostgreSQL)
- `monolithhost.api` (Your API)
- `wealthgrow-db` (MongoDB)
- `nginx-proxy` (Nginx)
- `aurora-social-app` ← New!

## 🗄️ Database Access

Aurora Social database in existing postgres:

```bash
# Connect to postgres
docker exec -it wealthgrow-postgres psql -U postgres

# Switch to Aurora database
\c auroraDb

# List tables
\dt

# Exit
\q
```

## 🔧 Management Commands

### View Aurora Social Logs

```bash
docker compose -f compose.prod.yml logs -f aurora-social
```

### Restart Aurora Social

```bash
docker compose -f compose.prod.yml restart aurora-social
```

### Stop Aurora Social

```bash
docker compose -f compose.prod.yml down
```

### Update Aurora Social

```bash
git pull
./deploy.sh
```

## 🌐 Nginx Integration (Optional)

To serve Aurora Social through your existing nginx:

Add to `/nginx/default.conf`:

```nginx
# Aurora Social
location /aurora/ {
    proxy_pass http://aurora-social-app:8080/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Then restart nginx:

```bash
docker restart nginx-proxy
```

Access at: `http://YOUR_DOMAIN/aurora/`

## ⚠️ Important Notes

1. **Database Password**: Make sure `DB_PASSWORD` in Aurora's `.env` matches your postgres password
2. **Network**: Aurora Social joins `app-network` automatically
3. **No Conflicts**: Aurora Social doesn't create any conflicting services
4. **Isolated Data**: Aurora data is in separate database `auroraDb`

## 🔄 Backup

Backup Aurora Social database:

```bash
docker exec wealthgrow-postgres pg_dump -U postgres auroraDb > aurora_backup_$(date +%Y%m%d).sql
```

Restore:

```bash
docker exec -i wealthgrow-postgres psql -U postgres auroraDb < aurora_backup_20241124.sql
```

## 🐛 Troubleshooting

### Can't connect to database

```bash
# Check postgres is running
docker ps | grep postgres

# Test connection
docker exec wealthgrow-postgres psql -U postgres -c "SELECT 1"
```

### Network error

```bash
# Verify app-network exists
docker network inspect app-network

# Reconnect Aurora Social to network
docker network connect app-network aurora-social-app
```

### Port conflict

If port 3000 is in use, change in `.env`:

```env
APP_PORT=3001
```

Then redeploy:

```bash
./deploy.sh
```

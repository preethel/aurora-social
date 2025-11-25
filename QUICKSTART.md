# Production Setup Guide

## Quick Start

```bash
# 0. Environment setup (first time only)
cp .env.example .env
# Edit .env: Update JWT_SECRET and IFRAMELY_API_KEY

# 1. Build করুন
docker compose build

# 2. Start করুন
docker compose up -d

# 3. Logs দেখুন
docker compose logs -f

# 4. Admin user তৈরি করুন (first time only)
docker exec -it aurora-app npm run create-admin
```

## Access

- **Application**: http://localhost:8080
- **API Docs**: http://localhost:8080/api-docs

## Architecture

✅ **Single container** - Client + Server একসাথে  
✅ **Static files** - Server থেকে client serve হয়  
✅ **No CORS** - Same origin  
✅ **Less resources** - Lower memory ও CPU usage  
✅ **Production ready** - Optimized build

## Database

- **Own Postgres**: `aurora-postgres` container
- **Database**: `AuroraSocialDb`
- **Port**: 5434 (host) → 5432 (container)
- **Network**: `aurora-network` (isolated)

> **Note**: সম্পূর্ণ independent setup - কোনো external dependency নেই।

## Useful Commands

```bash
# Restart
docker compose restart

# Stop
docker compose down

# Rebuild
docker compose up -d --build

# Shell access
docker exec -it aurora-app sh

# Health check
docker inspect --format='{{.State.Health.Status}}' aurora-app
```

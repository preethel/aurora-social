# Fix Client Path Issue - Immediate Deployment Steps

## Issue

The Docker container couldn't find the client files because they were being copied to the wrong location.

## What Was Fixed

1. ✅ Updated `Dockerfile` - Client files now copied to `/app/server/client/dist`
2. ✅ Updated `server.ts` - Server now looks in the correct path for production
3. ✅ Removed obsolete `version` field from `compose.prod.yml`
4. ✅ Added file verification in `quick-deploy.sh`

## Deploy Now (On Your VM)

Run these commands on your Azure VM:

```bash
# 1. Navigate to project
cd ~/workingDirectory/aurora-social

# 2. Pull latest changes (if using git)
git pull

# 3. Run deployment
chmod +x quick-deploy.sh
./quick-deploy.sh
```

## Or Deploy Manually

```bash
# 1. Stop existing container
docker compose -f compose.prod.yml down

# 2. Rebuild with no cache (ensures fresh build)
docker compose -f compose.prod.yml build --no-cache

# 3. Start container
docker compose -f compose.prod.yml up -d

# 4. Verify client files exist
docker exec aurora-social-app ls -la /app/server/client/dist/

# 5. Check logs
docker logs -f aurora-social-app

# 6. Run migrations
docker exec aurora-social-app npx prisma migrate deploy
```

## Verify Fix

After deployment, check:

```bash
# 1. Container is running
docker ps | grep aurora-social-app

# 2. Client files exist
docker exec aurora-social-app test -f /app/server/client/dist/index.html && echo "✅ Client files OK" || echo "❌ Client files missing"

# 3. Check file structure
docker exec aurora-social-app ls -la /app/server/client/dist/

# 4. Test the application
curl http://localhost:3000
```

## Expected Output

You should see HTML content (not 404 error) when accessing http://localhost:3000

## If Still Having Issues

Check the build logs:

```bash
docker compose -f compose.prod.yml build --no-cache 2>&1 | tee build.log
```

Look for:

- ✅ "Stage 1: Build client" - should complete successfully
- ✅ "Stage 2: Build server" - should complete successfully
- ✅ "Stage 3: Production runtime" - should copy files correctly

## Quick Verification Commands

```bash
# Check directory structure inside container
docker exec aurora-social-app sh -c 'echo "=== Server dist ===" && ls -la /app/server/dist/ && echo "" && echo "=== Client dist ===" && ls -la /app/server/client/dist/'

# Test if index.html is accessible
docker exec aurora-social-app cat /app/server/client/dist/index.html | head -n 5

# Check server logs for errors
docker logs aurora-social-app 2>&1 | grep -i "error\|enoent"
```

## What Should Work Now

✅ Client build files properly copied  
✅ Server serves static files from correct location  
✅ Routes should load the React app  
✅ API endpoints still work at `/api/*`  
✅ Swagger docs at `/api-docs`

## Access Application

- Main app: http://localhost:3000
- API docs: http://localhost:3000/api-docs
- Health: http://localhost:3000 (should return React app HTML)

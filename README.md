<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1SKAfrJLZLP9ZcZMHN3yvDZLWcE00nLma

## Project Structure

The project is organized into separate server and client directories:

```
aurora-social/
├── server/          # Backend Express server
│   ├── server.js    # Main server file with API endpoints
│   └── package.json # Server dependencies
├── client/          # Frontend React application
│   ├── components/  # React components
│   ├── App.tsx      # Main React component
│   ├── index.tsx    # Entry point
│   └── package.json # Client dependencies
├── .env             # Environment variables
└── package.json     # Root package file for scripts
```

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm run install:all
   ```
2. Set up environment variables:

   - Copy `.env.example` to `.env`
   - Set `VITE_TEST_MODE=true` to load sample posts
   - Set `IFRAMELY_API_KEY` to your Iframely API key

3. Run the app:
   - Development (client only):
     ```bash
     npm run dev:client
     ```
   - Development (server only):
     ```bash
     npm run dev:server
     ```
   - Production:
     ```bash
     npm run build
     npm start
     ```

## Deploy with Docker

**Note:** Docker builds may take several minutes due to npm package installations in Alpine Linux.

### Database Connection Issues?

**Using existing PostgreSQL container?** See [DEPLOYMENT_QUICK_START.md](./DEPLOYMENT_QUICK_START.md) for step-by-step guide.

**Quick deploy with existing postgres:**

```bash
chmod +x quick-deploy.sh
./quick-deploy.sh
```

If you encounter database connection errors, use the automated fix script:

```bash
chmod +x fix-db-connection.sh
./fix-db-connection.sh
```

This will automatically:

- Detect your PostgreSQL network
- Update Docker Compose configuration
- Connect containers to the same network
- Run database migrations

For detailed troubleshooting, see [DB_TROUBLESHOOTING.md](./DB_TROUBLESHOOTING.md)

### Local Docker Deployment

```bash
# Production build
./deploy.sh prod

# Development build
./deploy.sh dev
```

### Azure VM Quick Setup

**One-command setup for Azure Virtual Machines:**

```bash
# Make script executable
chmod +x vm-setup.sh

# Run setup script
./vm-setup.sh
```

This script will:

- ✅ Install Docker (if not already installed)
- ✅ Configure firewall (ports 80, 443, 22)
- ✅ Create `.env` file with environment variables
- ✅ Build Docker image with proper build arguments
- ✅ Deploy and start the application
- ✅ Verify deployment

**Manual VM setup:** See [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md) for detailed VM deployment instructions.

### Azure Container Apps Deployment

See [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md) for comprehensive Azure deployment guide.

**Quick Setup:**

1. Ensure `.env` file has `VITE_TEST_MODE=true`
2. Build with: `docker build --build-arg VITE_TEST_MODE=true -t aurora-social .`
3. Set environment variables in Azure:
   - `VITE_TEST_MODE=true` (as build argument)
   - `IFRAMELY_API_KEY=<your-key>` (as secret)
   - `NODE_ENV=production`
   - `PORT=8080`

**Important:** `VITE_TEST_MODE` must be set during Docker build, not just at runtime!

## Iframely Integration

| Key Type                                             | Where to Store                                           | Usage                                                                    | Exposed to Client? |
| ---------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------ |
| Server API Key (`718690c4bc3c1be271bbd3`)            | Azure App Service Application Setting `IFRAMELY_API_KEY` | Server-side proxy calls to `https://iframe.ly/api/oembed` in `server.js` | No                 |
| Client Key Hash (`22823aace0d77c6b9fd20984a04a955a`) | Embedded in `index.html` script tag query param          | Loads Iframely widgets (fallback discovery)                              | Yes (safe hash)    |

### How It Works

1. Frontend requests `/api/iframely?url=<target>`.
2. `server.js` uses `process.env.IFRAMELY_API_KEY` to call Iframely oEmbed API.
3. HTML snippet returned → rendered by `SafeEmbed.tsx`.
4. Client script `embed.js?api_key=<client-hash>` enables rich card fallback/discovery.

### Azure Deployment Checklist

1. Set App Setting: `IFRAMELY_API_KEY=718690c4bc3c1be271bbd3` (do NOT prefix with `VITE_`).
2. Remove any existing `VITE_IFRAMELY_API_KEY` setting.
3. Build & start:
   ```bash
   npm ci
   npm run build
   npm start
   ```
4. Visit: `https://<app>.azurewebsites.net/api/iframely?url=https://example.com` to verify JSON with `html`.
5. Confirm DevTools Network panel DOES NOT show `api_key=` with server key.

### Rotate Keys

If the server key was ever committed or leaked, rotate in Iframely dashboard and update Azure `IFRAMELY_API_KEY`.

### Security Notes

- Never put the server API key inside client bundle or `VITE_` prefixed env vars.
- Client hash is fine to expose; it cannot be used to make API calls.
- Consider adding rate limiting and simple caching for `/api/iframely` if traffic grows.

### Rate Limiting & Caching

The `/api/iframely` endpoint includes:

- Per-IP limit: 30 requests / minute (configured via `iframelyLimiter`).
- In-memory cache: 10 minute TTL for identical URL lookups (reduces latency & quota usage).

Adjust values in `server.js`:

```javascript
const iframelyLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
```

For horizontal scaling, move cache + rate limiting to Redis (e.g. Azure Cache for Redis) or another shared store.

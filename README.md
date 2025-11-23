<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1SKAfrJLZLP9ZcZMHN3yvDZLWcE00nLma

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

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

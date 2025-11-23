import express from 'express';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Iframely proxy: Uses server-side secret (IFRAMELY_API_KEY) to avoid exposing it to clients.
// Falls back to VITE_IFRAMELY_API_KEY only if mistakenly set (not recommended for production).
// This endpoint prevents direct client usage of the key and mitigates abuse.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Basic rate limiter for oEmbed proxy (adjust windowMs/max as needed)
const iframelyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
});

// Simple in-memory cache with TTL (not distributed). Consider Redis for scale.
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const cache = new Map(); // key -> { expires: number, data: any }

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, data });
}

// Lightweight oEmbed proxy for Iframely
app.get('/api/iframely', iframelyLimiter, async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  const apiKey = process.env.IFRAMELY_API_KEY || process.env.VITE_IFRAMELY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Iframely API key not configured on server' });
  }

  // Serve from cache if present
  const cacheKey = targetUrl;
  const cached = getCache(cacheKey);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  try {
    const upstream = await fetch(`https://iframe.ly/api/oembed?url=${encodeURIComponent(targetUrl)}&api_key=${apiKey}&omit_script=1`);
    if (!upstream.ok) {
      console.warn('[IFRAMELY_PROXY] Upstream non-OK', {
        status: upstream.status,
        url: targetUrl,
        planKeySuffix: apiKey.slice(-6)
      });
      return res.status(upstream.status).json({ error: `Upstream error ${upstream.status}` });
    }
    const data = await upstream.json();
    const { html, title, description, url, type, version, provider_name, provider_url, thumbnail_url } = data;
    const shaped = { html, title, description, url, type, version, provider_name, provider_url, thumbnail_url };
    setCache(cacheKey, shaped);
    res.json(shaped);
  } catch (e) {
    console.error('[IFRAMELY_PROXY] Fetch error', {
      message: e && e.message,
      url: targetUrl
    });
    res.status(502).json({ error: 'Proxy fetch failed', detail: (e && e.message) || 'Unknown error' });
  }
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

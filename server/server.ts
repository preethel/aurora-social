import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file in the root directory
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Handle BigInt serialization
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const app = express();

// Middleware - Configure Helmet with relaxed CSP for development
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://connect.facebook.net",
          "https://cdn.iframe.ly",
          "https://www.instagram.com",
          "https://platform.twitter.com",
          "https://www.tiktok.com",
          "https://assets.pinterest.com",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.iframe.ly",
          "https://fonts.googleapis.com",
        ],
        imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
        connectSrc: ["'self'", "https://iframe.ly", "https://cdn.iframe.ly"],
        frameSrc: [
          "'self'",
          "https://www.youtube.com",
          "https://www.youtube-nocookie.com",
          "https://www.facebook.com",
          "https://www.instagram.com",
          "https://platform.twitter.com",
          "https://www.tiktok.com",
          "https://assets.pinterest.com",
          "https://iframe.ly",
        ],
        mediaSrc: ["'self'", "https:", "http:", "data:", "blob:"],
        fontSrc: ["'self'", "data:", "https:", "https://fonts.gstatic.com"],
        // Don't upgrade HTTP to HTTPS
        upgradeInsecureRequests: null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // Disable these for HTTP compatibility
    originAgentCluster: false,
  })
);
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Trust proxy for proper protocol detection
app.set('trust proxy', true);

// Force HTTP for assets in production when behind proxy
app.use((req, res, next) => {
  // Remove any upgrade-insecure-requests header
  res.removeHeader('Upgrade-Insecure-Requests');
  next();
});

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Aurora Social API",
      version: "1.0.0",
      description: "API for Aurora Social Application",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./routes/*.ts"], // Path to the API docs
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);

// Iframely proxy
const iframelyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map();

function getCache(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: any) {
  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, data });
}

app.get(
  "/api/iframely",
  iframelyLimiter,
  async (req: Request, res: Response) => {
    const targetUrl = req.query.url;
    if (!targetUrl || typeof targetUrl !== "string") {
      return res.status(400).json({ error: "Missing url parameter" });
    }

    const apiKey = process.env.IFRAMELY_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "Iframely API key not configured on server" });
    }

    const cacheKey = targetUrl;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    try {
      const upstream = await fetch(
        `https://iframe.ly/api/oembed?url=${encodeURIComponent(
          targetUrl
        )}&api_key=${apiKey}&omit_script=1`
      );
      if (!upstream.ok) {
        return res
          .status(upstream.status)
          .json({ error: `Upstream error ${upstream.status}` });
      }
      const data = await upstream.json();
      const {
        html,
        title,
        description,
        url,
        type,
        version,
        provider_name,
        provider_url,
        thumbnail_url,
      } = data;
      const shaped = {
        html,
        title,
        description,
        url,
        type,
        version,
        provider_name,
        provider_url,
        thumbnail_url,
      };
      setCache(cacheKey, shaped);
      res.json(shaped);
    } catch (e: any) {
      res.status(502).json({
        error: "Proxy fetch failed",
        detail: (e && e.message) || "Unknown error",
      });
    }
  }
);

// YouTube embed proxy
app.get("/api/youtube", (req: Request, res: Response) => {
  const videoId = req.query.id;
  if (!videoId) {
    return res.status(400).json({ error: "Missing video ID" });
  }
  const html = `
    <div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;" class="youtube-container">
      <iframe 
        src="https://www.youtube.com/embed/${videoId}?rel=0" 
        style="top: 0; left: 0; width: 100%; height: 100%; position: absolute; border: 0;" 
        allowfullscreen 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        loading="lazy"
      ></iframe>
    </div>
  `;
  res.json({ html, type: "video", provider_name: "YouTube" });
});

// Serve static files from the client dist directory
// In production (Docker): client/dist relative to /app directory
// In development: ../client/dist relative to server directory
const clientDistPath =
  process.env.NODE_ENV === "production"
    ? path.join(__dirname, "client", "dist")
    : path.join(__dirname, "..", "client", "dist");

app.use(express.static(clientDistPath));

// Handle client-side routing - serve index.html for all routes
app.get("*", (req: Request, res: Response) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
});

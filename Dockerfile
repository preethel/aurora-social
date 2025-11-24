# Multi-stage build for Aurora Social (TypeScript + Prisma)
# Optimized version: avoids repeated npm installs, faster build

# ------------------------------
# Stage 1: Build client
# ------------------------------
FROM node:20-alpine AS client-builder

WORKDIR /app/client

# Copy package files and install deps
COPY client/package*.json ./
RUN npm ci

# Copy client source and build
COPY client/ ./
RUN npm run build

# ------------------------------
# Stage 2: Build server
# ------------------------------
FROM node:20-alpine AS server-builder

WORKDIR /app/server

# Copy server package files and install ALL dependencies (dev + prod)
COPY server/package*.json ./
COPY server/tsconfig.json ./
RUN npm ci

# Copy server source and prisma
COPY server/ ./
COPY server/prisma ./prisma/

# Generate Prisma client & build TypeScript
RUN npx prisma generate
RUN npm run build

# ------------------------------
# Stage 3: Production runtime
# ------------------------------
FROM node:20-alpine

WORKDIR /app/server

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy server build and node_modules from server-builder
COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/node_modules ./node_modules
COPY --from=server-builder /app/server/prisma ./prisma

# Copy client build
COPY --from=client-builder /app/client/dist ../client/dist

# Copy environment file template
COPY .env.example ../.env.example

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080 || exit 1

# Start the application
CMD ["node", "dist/server.js"]

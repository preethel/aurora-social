# ===========================
# Stage 1: Build client
# ===========================
FROM node:20-alpine AS client-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install dependencies with retry
RUN npm ci --retry 5 --fetch-timeout=60000 --network-timeout=60000

# Copy client source
COPY client/ ./

# Build client
RUN npm run build

# ===========================
# Stage 2: Build server
# ===========================
FROM node:20-alpine AS server-builder

WORKDIR /app/server

# Update npm to stable version
RUN npm install -g npm@11.6.3

# Copy server package files
COPY server/package*.json ./
COPY server/tsconfig.json ./

# Install ALL dependencies (including dev) step by step
RUN npm ci --retry 5 --fetch-timeout=60000 --network-timeout=60000

# Copy server source
COPY server/ ./

# Copy Prisma schema
COPY server/prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# ===========================
# Stage 3: Production runtime
# ===========================
FROM node:20-alpine

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy server package files
COPY server/package*.json ./server/

WORKDIR /app/server

# Install production dependencies only
RUN npm ci --omit=dev --retry 5 --fetch-timeout=60000 --network-timeout=60000

# Copy Prisma schema and migrations
COPY server/prisma ./prisma/

# Generate Prisma Client in production
RUN npx prisma generate

# Copy built server from server-builder
COPY --from=server-builder /app/server/dist ./dist

# Copy built client from client-builder
COPY --from=client-builder /app/client/dist ../client/dist

# Copy environment file template
COPY .env.example ../.env.example

WORKDIR /app/server

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080 || exit 1

# Start the application
CMD ["node", "dist/server.js"]

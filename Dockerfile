# Multi-stage build for Aurora Social (TypeScript + Prisma)

# Stage 1: Build client
FROM node:20-alpine AS client-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install dependencies
RUN npm ci

# Copy client source
COPY client/ ./

# Build client
RUN npm run build

# Stage 2: Build server
FROM node:20-alpine AS server-builder

WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./
COPY server/tsconfig.json ./

# Install ALL dependencies (including dev for TypeScript compilation)
RUN npm ci

# Copy server source and Prisma schema
COPY server/ ./

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Stage 3: Production runtime
FROM node:20-alpine

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy server package files
COPY server/package*.json ./server/

# Install production dependencies only
WORKDIR /app/server
RUN npm ci --omit=dev

# Copy Prisma schema and migrations
COPY server/prisma ./prisma/

# Generate Prisma Client in production
RUN npx prisma generate

# Copy built server from builder
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

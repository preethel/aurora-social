# Build stage for client
FROM node:20-alpine AS client-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install client dependencies
RUN npm ci

# Copy client source code
COPY client/ ./

# Build client
RUN npm run build

# Build stage for server
FROM node:20-alpine AS server-builder

WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./
COPY server/prisma ./prisma/

# Install server dependencies
RUN npm ci

# Copy server source code
COPY server/ ./

# Generate Prisma Client
RUN npx prisma generate

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy server package files
COPY server/package*.json ./
COPY server/prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production

# Generate Prisma Client
RUN npx prisma generate

# Copy server source files
COPY server/config ./config
COPY server/controllers ./controllers
COPY server/middleware ./middleware
COPY server/routes ./routes
COPY server/scripts ./scripts
COPY server/services ./services
COPY server/server.ts ./server.ts
COPY server/tsconfig.json ./tsconfig.json

# Copy built client files from client-builder
COPY --from=client-builder /app/client/dist ./client/dist

# Install tsx for running TypeScript
RUN npm install -g tsx

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

# Copy migration startup script
COPY <<'EOF' /app/start.sh
#!/bin/sh
set -e

echo "Running database migrations..."

# Run migrations with retry logic
MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if npx prisma migrate deploy; then
    echo "✅ Migrations applied successfully"
    break
  else
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
      echo "❌ Failed to apply migrations after $MAX_RETRIES attempts"
      exit 1
    fi
    echo "⚠️  Migration attempt $RETRY_COUNT failed, retrying in 5 seconds..."
    sleep 5
  fi
done

echo "Starting application..."
exec npm start
EOF

RUN chmod +x /app/start.sh

# Run migrations and start server
CMD ["/app/start.sh"]

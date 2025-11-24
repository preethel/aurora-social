# Stage 1: Base builder
FROM node:20-slim AS base
WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# ---------------------------
# Stage 2: Build client
# ---------------------------
FROM base AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# ---------------------------
# Stage 3: Build server
# ---------------------------
FROM base AS server-builder
WORKDIR /app/server

COPY server/package*.json ./
COPY server/tsconfig.json ./
COPY server/prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY server/ ./
RUN npm run build

# ---------------------------
# Stage 4: Production
# ---------------------------
FROM node:20-slim AS prod
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci --omit=dev

COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/prisma ./prisma
COPY --from=client-builder /app/client/dist ../client/dist

EXPOSE 8080
CMD ["node", "dist/server.js"]

# Multi-stage build for Aurora Social (TypeScript + Prisma)

# Stage 1: Build client
FROM node:20-alpine AS client-builder

WORKDIR /app/client

COPY client/package*.json ./
RUN npm install   # <-- FAST

COPY client/ ./
RUN npm run build

# Stage 2: Build server
FROM node:20-alpine AS server-builder

WORKDIR /app/server

COPY server/package*.json ./
COPY server/tsconfig.json ./
RUN npm install   # <-- FAST

COPY server/ ./

RUN npx prisma generate
RUN npm run build

# Stage 3: Production runtime
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY server/package*.json ./server/

WORKDIR /app/server
RUN npm install --omit=dev   # <-- FAST

COPY server/prisma ./prisma/
RUN npx prisma generate

COPY --from=server-builder /app/server/dist ./dist
COPY --from=client-builder /app/client/dist ../client/dist

COPY .env.example ../.env.example

WORKDIR /app/server

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080 || exit 1

CMD ["node", "dist/server.js"]

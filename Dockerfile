# Build stage
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies - using npm install for better Alpine Linux compatibility
RUN npm install && \
    cd client && \
    rm -rf package-lock.json && \
    npm install && \
    cd ../server && \
    npm install

# Copy source code
COPY client ./client
COPY server ./server
COPY .env* ./

# Build argument for test mode (passed from docker-compose or build command)
ARG VITE_TEST_MODE=false
ENV VITE_TEST_MODE=${VITE_TEST_MODE}

# Build the client application
RUN cd client && npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Copy server package files
COPY server/package*.json ./server/

# Install production dependencies only
RUN cd server && npm install --omit=dev

# Copy built client application from builder
COPY --from=builder /app/client/dist ./client/dist

# Copy server file
COPY server/server.js ./server/

# Copy environment files
COPY .env* ./

# Expose port (default 8080, but can be overridden)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 8080), (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the application
CMD ["node", "server/server.js"]

# Strapi v5 CMS API — Production Dockerfile
# Multi-stage build for minimal, secure production image

# ── Stage 1: Dependencies ────────────────────────────────────
FROM node:20-alpine AS dependencies
WORKDIR /app

# Install build dependencies for native modules (sharp, bcrypt)
RUN apk add --no-cache \
  build-base \
  gcc \
  autoconf \
  automake \
  zlib-dev \
  libpng-dev \
  vips-dev \
  python3

COPY package.json ./

# Install all deps first (for better layer caching)
RUN npm ci --production=false 2>&1 | tail -5

# ── Stage 2: Build ───────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

RUN apk add --no-cache vips-dev

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Strapi admin panel
RUN NODE_ENV=production npm run build 2>&1 | tail -5

# ── Stage 3: Production ──────────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

# Install only runtime dependencies
RUN apk add --no-cache vips

# Copy built assets and production dependencies
COPY --from=build --chown=appuser:appgroup /app/build ./build
COPY --from=build --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /app/config ./config
COPY --from=build --chown=appuser:appgroup /app/src ./src
COPY --from=build --chown=appuser:appgroup /app/scripts ./scripts
COPY --from=build --chown=appuser:appgroup /app/prisma ./prisma
COPY --from=dependencies --chown=appuser:appgroup /app/package.json ./package.json

# Create upload directory
RUN mkdir -p /app/public/uploads && chown -R appuser:appgroup /app/public

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:1337/api/health || exit 1

EXPOSE 1337

ENV NODE_ENV=production

CMD ["npm", "start"]

# ── Stage 4 (default): Development ───────────────────────────
FROM dependencies AS development
ENV NODE_ENV=development
WORKDIR /app
COPY . .
RUN npx prisma generate
EXPOSE 1337
CMD ["npm", "run", "dev"]

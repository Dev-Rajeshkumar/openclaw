# Next.js 15 Frontend — Production Dockerfile
# Multi-stage build for minimal, secure production image

# ── Stage 1: Dependencies ────────────────────────────────────
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package.json ./
RUN npm ci --production=false 2>&1 | tail -5

# ── Stage 2: Build ───────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (for server-side DB access)
RUN npx prisma generate

# Build Next.js app
RUN NODE_ENV=production npm run build 2>&1 | tail -5

# ── Stage 3: Production ──────────────────────────────────────
FROM node:20-alpine AS production

# Security: non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

# Copy only what's needed to run
COPY --from=build --chown=appuser:appgroup /app/.next ./.next
COPY --from=build --chown=appuser:appgroup /app/public ./public
COPY --from=build --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /app/package.json ./package.json
COPY --from=build --chown=appuser:appgroup /app/prisma ./prisma
COPY --from=build --chown=appuser:appgroup /app/next.config.ts ./next.config.ts
COPY --from=build --chown=appuser:appgroup /app/tsconfig.json ./tsconfig.json
COPY --from=build --chown=appuser:appgroup /app/src ./src

USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]

# ── Stage 4 (default): Development ───────────────────────────
FROM dependencies AS development
ENV NODE_ENV=development
WORKDIR /app
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "run", "dev"]

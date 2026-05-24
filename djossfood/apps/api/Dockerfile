# DjossFood API — Production Dockerfile
# Multi-stage build for a clean, small production image

# ---------------------------------------------------------------------------
# Stage 1: Dependencies
# ---------------------------------------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /app

# Copy root monorepo package files first (npm workspaces)
COPY package.json package-lock.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/config/package.json ./packages/config/
COPY apps/api/package.json ./apps/api/

# Install production dependencies using the workspace lockfile
RUN npm ci --omit=dev --workspace=@djossfood/api --workspace=@djossfood/database --workspace=@djossfood/config

# ---------------------------------------------------------------------------
# Stage 2: Build
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy source
COPY . .

# Install all dependencies (including dev) for TypeScript compilation
RUN npm ci

# Build the API
RUN npm run build --workspace=@djossfood/api

# ---------------------------------------------------------------------------
# Stage 3: Production
# ---------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy compiled output and production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/packages/config/node_modules ./packages/config/node_modules

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/database/src ./packages/database/src
COPY --from=builder /app/packages/config ./packages/config
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

# Only the API runs in this container
WORKDIR /app/apps/api

EXPOSE 3001

CMD ["node", "dist/index.js"]

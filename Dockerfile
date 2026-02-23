# Stage 1: Build frontend + bundle backend
FROM node:22-alpine AS builder

RUN npm install -g pnpm@10 esbuild

WORKDIR /app

# Copy workspace config files first for caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json ./

# Copy all package.json files for dependency resolution
COPY packages/shared/package.json ./packages/shared/
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/backend/package.json ./packages/backend/

# Install all dependencies (including devDeps for build tooling)
RUN pnpm install --frozen-lockfile

# Copy all source files
COPY packages/shared/ ./packages/shared/
COPY packages/frontend/ ./packages/frontend/
COPY packages/backend/ ./packages/backend/

# Build frontend
RUN pnpm --filter frontend run build

# Bundle backend with esbuild into a single file — no tsx needed at runtime
RUN npx esbuild packages/backend/src/index.ts \
  --bundle \
  --platform=node \
  --format=esm \
  --outfile=dist/server.mjs \
  --external:better-sqlite3 \
  --banner:js="import { createRequire } from 'module'; const require = createRequire(import.meta.url);"


# Stage 2: Compile better-sqlite3 native module for alpine
FROM node:22-alpine AS native-builder

RUN apk add --no-cache python3 make g++

WORKDIR /deps
RUN npm init -y && npm install better-sqlite3@11


# Stage 3: Minimal production image
FROM node:22-alpine

WORKDIR /app

# Copy native module (better-sqlite3 + its runtime deps like bindings)
COPY --from=native-builder /deps/node_modules ./node_modules

# Copy bundled backend
COPY --from=builder /app/dist ./dist

# Copy frontend build output to where backend serves it
COPY --from=builder /app/packages/frontend/dist ./packages/frontend/dist

# Create data directory for SQLite volume mount point
RUN mkdir -p /data

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

CMD ["node", "dist/server.mjs"]

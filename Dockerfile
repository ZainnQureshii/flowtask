# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder

# Install pnpm
RUN npm install -g pnpm@10

WORKDIR /app

# Copy workspace config files first for caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json ./

# Copy all package.json files for dependency resolution
COPY packages/shared/package.json ./packages/shared/
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/backend/package.json ./packages/backend/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/shared/ ./packages/shared/
COPY packages/frontend/ ./packages/frontend/

# Build frontend
RUN pnpm --filter frontend run build


# Stage 2: Production image
FROM node:22-alpine AS production

# Install pnpm, tsx (globally), and build tools for native module rebuild
RUN apk add --no-cache python3 make g++
RUN npm install -g pnpm@10 tsx@4

WORKDIR /app

# Copy workspace config files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json ./

# Copy package.json files
COPY packages/shared/package.json ./packages/shared/
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/backend/package.json ./packages/backend/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Rebuild better-sqlite3 for the production environment
RUN pnpm rebuild better-sqlite3

# Copy shared source (tsx will handle .ts imports at runtime)
COPY packages/shared/src ./packages/shared/src

# Copy backend source (tsx runs .ts directly, no build needed)
COPY packages/backend/src ./packages/backend/src

# Copy frontend build output to where backend will serve it
COPY --from=frontend-builder /app/packages/frontend/dist ./packages/frontend/dist

# Create data directory for SQLite volume mount point
RUN mkdir -p /data

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

CMD ["node", "--import", "tsx", "packages/backend/src/index.ts"]

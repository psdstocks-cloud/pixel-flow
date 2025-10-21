# Multi-stage build for Railway deployment
FROM node:22-slim AS base

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY tsconfig.json ./
COPY packages/database/package*.json ./packages/database/
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/

# Copy source code (needed for postinstall script that runs tsc)
COPY packages/database ./packages/database
COPY apps/api ./apps/api
COPY apps/web ./apps/web

# Install dependencies (postinstall will run prisma generate + build)
RUN npm ci

# Build all packages and remove dev node_modules afterwards to keep image light
RUN npm run build && rm -rf node_modules

# Production stage
FROM node:22-slim AS production

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY packages/database/package*.json ./packages/database/
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/

# Copy Prisma schema (needed for Prisma Client at runtime)
COPY packages/database/prisma ./packages/database/prisma

# Install production dependencies only (skip postinstall scripts - we copy built files instead)
RUN npm ci --omit=dev --ignore-scripts && \
    npx --yes prisma@5.22.0 generate --schema ./packages/database/prisma/schema.prisma

# Copy built artifacts from base stage
COPY --from=base /app/packages/database/dist ./packages/database/dist
COPY --from=base /app/apps/api/dist ./apps/api/dist
COPY --from=base /app/apps/web/.next ./apps/web/.next

# Expose port (Railway will set PORT env var)
EXPOSE 4000

# Start the API server
CMD ["npm", "run", "start", "--workspace", "api"]

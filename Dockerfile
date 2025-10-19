# Multi-stage build for Railway deployment
FROM node:22-slim AS base

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY packages/database/package*.json ./packages/database/
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/

# Copy Prisma schema (needed for postinstall script)
COPY packages/database/prisma ./packages/database/prisma

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/database ./packages/database
COPY apps/api ./apps/api
COPY apps/web ./apps/web

# Build all packages
RUN npm run build

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
RUN npm ci --omit=dev --ignore-scripts

# Copy built artifacts from base stage
COPY --from=base /app/packages/database/dist ./packages/database/dist
COPY --from=base /app/apps/api/dist ./apps/api/dist
COPY --from=base /app/apps/web/.next ./apps/web/.next
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base /app/node_modules/@prisma ./node_modules/@prisma

# Expose port (Railway will set PORT env var)
EXPOSE 4000

# Start the API server
CMD ["npm", "run", "start", "--workspace", "api"]

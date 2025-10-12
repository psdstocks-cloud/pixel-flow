FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/database/package*.json ./packages/database/
COPY packages/types/package*.json ./packages/types/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY apps/api ./apps/api
COPY packages/database ./packages/database
COPY packages/types ./packages/types

# Generate Prisma client
RUN cd packages/database && npx prisma generate

# Build the application
RUN npm run build --workspace=apps/api

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start", "--workspace=apps/api"]

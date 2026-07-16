# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configs
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev for building/generating)
RUN npm ci

# Copy codebase
COPY . .

# Generate Prisma Client
RUN npm run prisma:generate

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts and runtime dependencies from builder
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "src/app.js"]

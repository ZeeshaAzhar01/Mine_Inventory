# ==============================================================================
# Multi-Stage Production Dockerfile for Mining Inventory API
# ==============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma engine compatibility on Alpine
RUN apk add --no-cache openssl libc6-compat

# Copy package descriptors
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies including dev dependencies needed for prisma generate
RUN npm ci

# Generate Prisma Client binary bindings
RUN npx prisma generate

# ------------------------------------------------------------------------------
# Production Runner Stage
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user for enhanced security
RUN addgroup -S nodegroup && adduser -S nodeuser -G nodegroup

# Copy application artifacts and node_modules from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY src ./src

# Assign permissions to non-root user
RUN chown -R nodeuser:nodegroup /app

USER nodeuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["npm", "start"]

# ===== Build Stage =====
FROM --platform=linux/amd64 node:20-slim AS base

# 1. Install dependencies
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# 2. Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set production environment variables
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# ===== Deploy Stage =====
FROM gcr.io/distroless/nodejs20-debian12

WORKDIR /app

# Copy the built app from the builder stage
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

# Expose the port the app runs on
EXPOSE 9002

# Set the user and group to a non-root user
USER nonroot
GROUP nonroot

CMD ["server.js"]

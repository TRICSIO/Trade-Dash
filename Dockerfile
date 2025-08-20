# 1. Installer Stage: Install dependencies and cache them
FROM node:20-slim AS installer
WORKDIR /app
COPY package*.json ./
RUN npm install

# 2. Builder Stage: Build the Next.js application
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# 3. Runner Stage: Create the final, minimal production image
FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nonroot:nonroot ./.next/standalone ./
COPY --from=builder --chown=nonroot:nonroot ./.next/static ./.next/static

USER nonroot
EXPOSE 9002
CMD ["server.js"]

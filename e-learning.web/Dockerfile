# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Public env vars must exist at build time so Next.js can inline them into client bundles.
ARG NEXT_PUBLIC_HOST_API_URL
ARG NEXT_PUBLIC_ROOT_DOMAIN
ARG NEXT_PUBLIC_LOGIN_DOMAIN
ARG NEXT_PUBLIC_ADMIN_DOMAIN

ENV NEXT_PUBLIC_HOST_API_URL=$NEXT_PUBLIC_HOST_API_URL
ENV NEXT_PUBLIC_ROOT_DOMAIN=$NEXT_PUBLIC_ROOT_DOMAIN
ENV NEXT_PUBLIC_LOGIN_DOMAIN=$NEXT_PUBLIC_LOGIN_DOMAIN
ENV NEXT_PUBLIC_ADMIN_DOMAIN=$NEXT_PUBLIC_ADMIN_DOMAIN

# Install dependencies
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build Next.js application
RUN yarn build

# Production runtime stage
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install curl for health check
RUN apk add --no-cache curl

# Copy built application from builder
COPY --from=builder /app/package.json /app/yarn.lock /app/.yarnrc.yml ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Install production dependencies only
RUN yarn install --frozen-lockfile --production=true

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["yarn", "start"]

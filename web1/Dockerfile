# ============================================
# DeepTutor Frontend Dockerfile
# ============================================
FROM node:22-slim AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure a public directory exists (Next.js standalone requires it, even if empty)
RUN mkdir -p /app/public

# Create placeholder for API base URL to be replaced at runtime
ENV NEXT_PUBLIC_API_BASE=__NEXT_PUBLIC_API_BASE_PLACEHOLDER__

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV FRONTEND_PORT=3782
ENV PORT=3782

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next && chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create an entrypoint that replaces the API placeholder before starting Next.js
# This allows using environment variables on Coolify without rebuilding the image
RUN echo '#!/bin/sh\n\
if [ -n "$NEXT_PUBLIC_API_BASE" ]; then\n\
  echo "Replacing placeholder with API URL: $NEXT_PUBLIC_API_BASE"\n\
  find /app/.next -type f \\( -name "*.js" -o -name "*.json" \\) -exec sed -i "s|__NEXT_PUBLIC_API_BASE_PLACEHOLDER__|${NEXT_PUBLIC_API_BASE}|g" {} \\; 2>/dev/null || true\n\
fi\n\
exec node server.js\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

USER nextjs

EXPOSE 3782

CMD ["/app/entrypoint.sh"]

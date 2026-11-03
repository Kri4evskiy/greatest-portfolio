# Stage 1: Prune monorepo subgraph for @repo/web
FROM node:22-alpine AS pruner
RUN apk add --no-cache libc6-compat
RUN npm install -g turbo@^2
WORKDIR /app
COPY . .
RUN turbo prune @repo/web --docker

# Stage 2: Install dependencies and build
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.6.5 --activate
WORKDIR /app

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY --from=pruner /app/out/full/ .
COPY tsconfig.base.json ./tsconfig.base.json
ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_STANDALONE=true
ENV API_INTERNAL_URL=http://api:4000
RUN pnpm turbo run build --filter=@repo/web...

# Stage 3: Production non-root runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV API_INTERNAL_URL=http://api:4000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/content ./apps/web/content

USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]

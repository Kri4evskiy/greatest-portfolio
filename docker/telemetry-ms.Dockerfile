# Stage 1: Prune monorepo subgraph for @repo/telemetry-ms
FROM node:22-alpine AS pruner
RUN apk add --no-cache libc6-compat
ENV DO_NOT_TRACK=1
ENV TURBO_TELEMETRY_DISABLED=1
RUN npm install -g turbo@^2
WORKDIR /app
COPY . .
RUN turbo prune @repo/telemetry-ms --docker

# Stage 2: Install dependencies and build
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
ENV DO_NOT_TRACK=1
ENV TURBO_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@12.18.0 --activate && pnpm --version
WORKDIR /app

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

COPY --from=pruner /app/out/full/ .
COPY tsconfig.base.json ./tsconfig.base.json
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm turbo run build --filter=@repo/telemetry-ms... && \
    pnpm prune --prod --ignore-scripts

# Stage 3: Production non-root runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV TELEMETRY_MS_HOST=0.0.0.0
ENV TELEMETRY_MS_PORT=4001

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/packages/shared-schemas ./packages/shared-schemas
COPY --from=builder --chown=node:node /app/apps/telemetry-ms/dist ./apps/telemetry-ms/dist
COPY --from=builder --chown=node:node /app/apps/telemetry-ms/package.json ./apps/telemetry-ms/package.json
COPY --from=builder --chown=node:node /app/apps/telemetry-ms/node_modules ./apps/telemetry-ms/node_modules

USER node
EXPOSE 4001
CMD ["node", "apps/telemetry-ms/dist/main.js"]

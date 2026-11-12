# Stage 1: Prune monorepo subgraph for @repo/api
FROM node:22-alpine AS pruner
RUN apk add --no-cache libc6-compat openssl
ENV DO_NOT_TRACK=1
ENV TURBO_TELEMETRY_DISABLED=1
RUN npm install -g turbo@^2
WORKDIR /app
COPY . .
RUN turbo prune @repo/api --docker

# Stage 2: Install dependencies, generate Prisma Client, and build
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
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
    pnpm turbo run build --filter=@repo/api... && \
    cp -R /app/node_modules/.pnpm/@prisma+client*/node_modules/.prisma /tmp/.prisma && \
    cp -R /app/node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client /tmp/prisma-client && \
    pnpm prune --prod --ignore-scripts && \
    cp -R /tmp/.prisma /app/node_modules/.pnpm/@prisma+client*/node_modules/ && \
    cp -R /tmp/prisma-client/* /app/node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client/ && \
    rm -rf /tmp/.prisma /tmp/prisma-client

# Stage 3: Production non-root runner
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/packages/shared-schemas ./packages/shared-schemas
COPY --from=builder --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=node:node /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder --chown=node:node /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=node:node /app/apps/api/node_modules ./apps/api/node_modules

USER node
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]

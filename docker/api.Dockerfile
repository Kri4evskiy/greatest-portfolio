# Stage 1: Prune monorepo subgraph for @repo/api
FROM node:22-alpine AS pruner
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@10.6.5 --activate
WORKDIR /app
COPY . .
RUN npx turbo prune @repo/api --docker

# Stage 2: Install dependencies, generate Prisma Client, and build
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@10.6.5 --activate
WORKDIR /app

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
COPY tsconfig.base.json ./tsconfig.base.json
RUN pnpm turbo run build --filter=@repo/api...

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

USER node
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]

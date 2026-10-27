# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Stage 1: Prune monorepo for @repo/api
FROM base AS pruner
WORKDIR /app
RUN pnpm add -g turbo@^2.4.4
COPY . .
RUN turbo prune @repo/api --docker

# Stage 2: Install dependencies, generate Prisma client, and build
FROM base AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @repo/api prisma:generate
RUN pnpm turbo build --filter=@repo/api...

# Stage 3: Production non-root runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
USER node
COPY --from=builder --chown=node:node /app ./
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]

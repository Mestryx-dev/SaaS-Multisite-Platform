# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.32.0 --activate

FROM base AS builder
ENV CI=true
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @mestryx/host-resolution build \
  && pnpm --filter @mestryx/tokens build \
  && pnpm --filter @mestryx/api build
# Portable prod tree (pnpm 10); requires injectWorkspacePackages in pnpm-workspace.yaml
RUN pnpm deploy --filter=@mestryx/api --prod /prod/api

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3001

COPY --from=builder /prod/api ./

EXPOSE 3001
CMD ["node", "dist/index.js"]

# syntax=docker/dockerfile:1
# Static Storybook for Dev smoke (Dokploy). Build context = monorepo root.

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.32.0 --activate
ENV CI=true
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/ui/package.json packages/ui/
COPY packages/tokens/package.json packages/tokens/
COPY packages/config/package.json packages/config/
RUN pnpm install --frozen-lockfile --filter @mestryx/ui...
COPY . .
RUN pnpm --filter @mestryx/ui build-storybook

FROM nginx:1.27-alpine
COPY packages/ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/ui/storybook-static /usr/share/nginx/html
EXPOSE 80

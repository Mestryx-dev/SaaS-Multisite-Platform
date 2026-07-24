# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.32.0 --activate
ENV CI=true
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/admin/package.json apps/admin/
COPY packages/ui/package.json packages/ui/
COPY packages/tokens/package.json packages/tokens/
COPY packages/sdk/package.json packages/sdk/
COPY packages/config/package.json packages/config/
RUN pnpm install --frozen-lockfile --filter @mestryx/admin...
COPY . .
ARG VITE_API_URL=
ARG VITE_WEB_ORIGIN=
ARG VITE_PUBLIC_SITES_HOST_SUFFIX=
ENV VITE_API_URL=$VITE_API_URL \
    VITE_WEB_ORIGIN=$VITE_WEB_ORIGIN \
    VITE_PUBLIC_SITES_HOST_SUFFIX=$VITE_PUBLIC_SITES_HOST_SUFFIX
# Vite resolves workspace packages from source (exports.import → src).
RUN pnpm --filter @mestryx/admin build

FROM nginx:1.27-alpine
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html
EXPOSE 80

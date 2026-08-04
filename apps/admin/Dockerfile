# syntax=docker/dockerfile:1

# Align with apps/web: full workspace install + build tokens/ui before Vite.
# Filtered install alone left @mestryx/ui unresolved under tsc in Docker (Dokploy Admin-Dev).

FROM node:22-alpine AS build
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.32.0 --activate
ENV CI=true

COPY . .
RUN pnpm install --frozen-lockfile

ARG VITE_API_URL=
ARG VITE_WEB_ORIGIN=
ARG VITE_PUBLIC_SITES_HOST_SUFFIX=
ENV VITE_API_URL=$VITE_API_URL \
    VITE_WEB_ORIGIN=$VITE_WEB_ORIGIN \
    VITE_PUBLIC_SITES_HOST_SUFFIX=$VITE_PUBLIC_SITES_HOST_SUFFIX

RUN pnpm --filter @mestryx/tokens build \
  && pnpm --filter @mestryx/ui build \
  && pnpm --filter @mestryx/admin build

FROM nginx:1.27-alpine
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html
EXPOSE 80

# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.32.0 --activate
ENV CI=true
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/marketing/package.json apps/marketing/
COPY packages/tokens/package.json packages/tokens/
COPY packages/config/package.json packages/config/
RUN pnpm install --frozen-lockfile --filter @mestryx/marketing...
COPY . .
# Build-time public env (Umami) — unset = no tracker in HTML
ARG PUBLIC_UMAMI_SCRIPT_URL=
ARG PUBLIC_UMAMI_WEBSITE_ID=
ARG PUBLIC_UMAMI_SHARE_URL=
ENV PUBLIC_UMAMI_SCRIPT_URL=$PUBLIC_UMAMI_SCRIPT_URL \
    PUBLIC_UMAMI_WEBSITE_ID=$PUBLIC_UMAMI_WEBSITE_ID \
    PUBLIC_UMAMI_SHARE_URL=$PUBLIC_UMAMI_SHARE_URL
RUN pnpm --filter @mestryx/tokens build \
  && pnpm --filter @mestryx/marketing build

FROM nginx:1.27-alpine
COPY apps/marketing/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/marketing/dist /usr/share/nginx/html
EXPOSE 80

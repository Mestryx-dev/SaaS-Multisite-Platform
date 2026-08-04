# syntax=docker/dockerfile:1

FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.32.0 --activate
ENV CI=true
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/marketing/package.json apps/marketing/
COPY packages/tokens/package.json packages/tokens/
COPY packages/config/package.json packages/config/
RUN pnpm install --frozen-lockfile --filter @mestryx/marketing...
COPY . .

# Build-time public knobs (static site — must be build-args, not runtime-only nginx env)
ARG PUBLIC_SITE_URL=
ARG PUBLIC_CONTACT_EMAIL=
ARG PUBLIC_LINK_DEMO_ADMIN=
ARG PUBLIC_LINK_DEMO_STORE=
ARG PUBLIC_LINK_PORTFOLIO=
ARG PUBLIC_UMAMI_SCRIPT_URL=
ARG PUBLIC_UMAMI_WEBSITE_ID=
ARG PUBLIC_UMAMI_SHARE_URL=
ARG PUBLIC_ANALYTICS_HOST=

ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL \
    PUBLIC_CONTACT_EMAIL=$PUBLIC_CONTACT_EMAIL \
    PUBLIC_LINK_DEMO_ADMIN=$PUBLIC_LINK_DEMO_ADMIN \
    PUBLIC_LINK_DEMO_STORE=$PUBLIC_LINK_DEMO_STORE \
    PUBLIC_LINK_PORTFOLIO=$PUBLIC_LINK_PORTFOLIO \
    PUBLIC_UMAMI_SCRIPT_URL=$PUBLIC_UMAMI_SCRIPT_URL \
    PUBLIC_UMAMI_WEBSITE_ID=$PUBLIC_UMAMI_WEBSITE_ID \
    PUBLIC_UMAMI_SHARE_URL=$PUBLIC_UMAMI_SHARE_URL \
    PUBLIC_ANALYTICS_HOST=$PUBLIC_ANALYTICS_HOST

RUN pnpm --filter @mestryx/tokens build \
  && pnpm --filter @mestryx/marketing build

FROM nginx:1.27-alpine
COPY apps/marketing/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/marketing/dist /usr/share/nginx/html
EXPOSE 80

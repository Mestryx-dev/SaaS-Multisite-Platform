# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/web/package.json apps/web/
COPY packages/host-resolution/package.json packages/host-resolution/
COPY packages/config/package.json packages/config/
RUN pnpm install --frozen-lockfile --filter @mestryx/web...
COPY . .
RUN pnpm --filter @mestryx/host-resolution build && pnpm --filter @mestryx/web build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/web/dist ./dist
COPY --from=build /app/apps/web/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/server.js"]

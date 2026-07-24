# Integrations

Planned external systems for Mestryx Multisite Platform. Credentials: Agent Vault / Infisical — never commit secrets.

## Identity & email

| Service | Role | Notes |
|---------|------|-------|
| Better Auth (self-hosted) | Auth | Default (Q12). Email/password + storefront customer (FB-068). Social: **Google** when `GOOGLE_*` (F-108); **Apple** when `APPLE_*` (F-110 / FB-072). Not Facebook/X. |
| Google OAuth | Storefront (+ optional admin) social login | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`; callback `${BETTER_AUTH_URL}/api/auth/callback/google` |
| Apple Sign In | Storefront social login (optional) | `APPLE_CLIENT_ID` (Services ID) + `APPLE_CLIENT_SECRET` (JWT); callback `${BETTER_AUTH_URL}/api/auth/callback/apple` |
| Resend or SMTP | Transactional mail | FB-067 order emails + **FB-035 org invite** (`OrgInviteEmail`); Resend + React Email; `RESEND_API_KEY` optional (log-only fallback). From `EMAIL_FROM` / `*@mestryx.dev`. Invite accept links use `ADMIN_ORIGIN`. |
| Stalwart (existing) | Mail infra | Align with Mestryx ops where possible |

## Payments

| Service | Role | Notes |
|---------|------|-------|
| Stripe | Platform subscriptions | Customers = Organizations · **FB-051**: Checkout + Customer Portal (test mode); `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_PRO`; stub without keys |
| Stripe (later) | Connect / Checkout for commerce module | After platform billing stable · FB-070 deferred |

## Storage & CDN

| Service | Role | Notes |
|---------|------|-------|
| S3-compatible (R2 / MinIO / AWS) | Media, assets | FB-064: presign upload when `S3_*` set; else register external URL via `POST /v1/media` |
| Cloudflare (optional) | DNS / SSL for SaaS / CDN | Candidate for F-402 |

## Observability

| Service | Role | Notes |
|---------|------|-------|
| Sentry | Errors | Prod + staging projects |
| Uptime (Kuma / UptimeRobot) | Availability | Align with Mestryx monitoring |
| **Umami** | Product + site analytics (privacy-friendly) | **Yes — planned.** Reuse Mestryx Umami ops where possible. Wire after public sites exist (W8 / F-802). Not required for Phase 1–2. |

## Infra (Mestryx)

| Service | Role | Notes |
|---------|------|-------|
| Dokploy | Deploy apps | Homelab Mestryx |
| PostgreSQL | Primary DB | Managed container |
| Redis | Cache / BullMQ | Managed container |
| Traefik | Ingress / TLS | Via Dokploy |

## Not in MVP

| Service | Why deferred |
|---------|--------------|
| Clerk / Auth0 | Prefer self-hosted Better Auth |
| GraphQL gateway | REST/OpenAPI first |
| Push (Expo) | After mobile wave |
| AI providers | After core modules |

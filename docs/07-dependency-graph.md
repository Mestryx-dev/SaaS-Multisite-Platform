# Dependency graph

Visual and tabular view of **what must exist before what**. Feature IDs from [06-feature-catalog-and-priority.md](./06-feature-catalog-and-priority.md).

## 1. Critical path (Sites OS MVP)

```mermaid
flowchart TD
  F001[F-001 Monorepo] --> F002[F-002 CI]
  F001 --> F003[F-003 Postgres]
  F001 --> F004[F-004 Redis]
  F001 --> F005[F-005 Secrets]
  F003 --> F100[F-100 Users]
  F100 --> F101[F-101 Session/JWT]
  F100 --> F102[F-102 Organization]
  F102 --> F103[F-103 Roles]
  F102 --> F104[F-104 Isolation tests]
  F101 --> F200[F-200 Admin shell]
  F102 --> F200
  F104 --> F202[F-202 Site CRUD]
  F200 --> F202
  F202 --> F300[F-300 Host resolution]
  F300 --> F301[F-301 Subdomain]
  F300 --> F302[F-302 Public layout]
  F202 --> F400[F-400 Custom domain]
  F300 --> F400
  F400 --> F401[F-401 Verify]
  F401 --> F402[F-402 TLS]
  F102 --> F500[F-500 Plans]
  F500 --> F501[F-501 Stripe Customer]
  F501 --> F502[F-502 Checkout]
  F501 --> F503[F-503 Sub webhooks]
  F503 --> F504[F-504 Pay fail]
  F503 --> F505[F-505 Entitlements]
  F202 --> F600[F-600 Pages]
  F300 --> F602[F-602 Publish]
  F600 --> F602
  F005 --> F800[F-800 Email DNS]
  F100 --> F800
```

## 2. Critical path (Commerce module add-on)

```mermaid
flowchart TD
  F204[F-204 Module toggles] --> F700[F-700 Products]
  F104[F-104 Isolation] --> F700
  F700 --> F701[F-701 PLP/PDP]
  F300[F-300 Host] --> F701
  F701 --> F702[F-702 Cart]
  F100[F-100 Users] --> F702
  F702 --> F703[F-703 Checkout]
  F703 --> F704[F-704 Orders]
  F200[F-200 Admin] --> F707[F-707 Merch UI]
  F700 --> F707
```

## 3. Hard constraints (never skip)

| Rule | Detail |
|------|--------|
| **No public site without F-104** | Isolation tests must pass before F-300 in staging |
| **No live billing without F-503+F-504** | Test Stripe failure cards first |
| **No custom domain without F-401+F-402** | Avoid half-configured DNS/TLS |
| **No commerce without F-204** | Module must be toggleable / plan-gated |
| **No mobile before F-900** | Typed API contract first |
| **Email before inviting users** | F-800 before F-107 in production |

## 4. Parallelisable tracks (after F-104)

Once isolation is proven, these can proceed in parallel with different agents:

| Track | Features | Owner focus |
|-------|----------|-------------|
| Admin UX | F-200 → F-205 | `apps/admin` |
| Site runtime | F-300 → F-303 | `apps/web` |
| Billing | F-500 → F-505 | `apps/api` billing module |
| DS | F-206 → F-207 | `packages/ui` |
| Domains | F-400 → F-402 | API + infra |

## 5. Anti-patterns (dependency violations)

- Building Expo (F-902) before OpenAPI SDK (F-900)  
- Custom domains before site CRUD  
- Storybook/Remotion before admin shell  
- GraphQL before REST stabilises  
- Stripe Connect (tenant payouts) before platform subscriptions work  
- Rust workers before any production load metrics  

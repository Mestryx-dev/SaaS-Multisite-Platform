# Documentation index — mestryx-platform

**Owner**: Mestryx · **Domain**: mestryx.dev · **GitHub**: Mestryx-dev

## Sources of truth (no status duplicates)

| Doc | Owns | Must NOT contain |
|-----|------|------------------|
| [feature-backlog.md](./feature-backlog.md) | **Only** place for FB-* `todo` / `doing` / `done` / `deferred` | Journey essays, long product prose |
| [06-feature-catalog-and-priority.md](./06-feature-catalog-and-priority.md) | F-* definitions, waves, Requires | Living “done” status |
| [12-commerce-fiscal-complete.md](./12-commerce-fiscal-complete.md) | Target shop / fiscal **scope** | Implementation status tables |
| [13-journey-audit.md](./13-journey-audit.md) | Admin × storefront **routes / steps** + F/FB refs | Gap catalogs copied from 06/12 |
| [PROGRESS.md](../PROGRESS.md) | Thin **milestones** / gates | Per-feature blow-by-blow |
| [design-system/CHANGELOG.md](./design-system/CHANGELOG.md) | DS chronology | Product FB status |
| [plans/](./plans/) | Historical snapshots | Live status sync |

**After a feature ships:** update `feature-backlog.md` → milestone in `PROGRESS.md` if phase-level → OpenAPI / data-dictionary only if schema/contract changed. Do **not** patch status into 06, 12, or 13. See [10 §2.2](./10-agent-ops.md#22-docs-sync-loop-systematic--mestryx-policy).

---

## Read in order

### Product & planning
1. [00 — Identity & context](./00-identity-and-context.md)  
2. [app-spec.md](./app-spec.md)  
3. [06 — Feature catalog & priority](./06-feature-catalog-and-priority.md) — F-* definitions  
4. [07 — Dependency graph](./07-dependency-graph.md)  
5. [feature-backlog.md](./feature-backlog.md) — **FB status SSOT**  
6. [09 — Delivery approach](./09-delivery-approach.md)  
7. [08 — Open questions](./08-open-questions.md)

### Stack (canonical)
8. [technical-stack.md](./technical-stack.md) — short  
9. [02 — Stack detail](./02-stack.md)  
10. [05 — Stack versions](./05-stack-versions.md)  
10b. [design-system/](./design-system/) — DS hub  
11. [11 — SEO + AI discovery](./11-seo-ai-ready.md)  
11b. [12 — Commerce + fiscal scope](./12-commerce-fiscal-complete.md) — target scope only  
11c. [13 — Journey map](./13-journey-audit.md) — routes / steps only  

### Ops & agents
12. [10 — Agent ops (CI/CD, debug, learning)](./10-agent-ops.md)  
13. [04 — Git & GitHub](./04-git-and-github-strategy.md)  
14. [integrations.md](./integrations.md)  
14b. [SECURITY.md](./SECURITY.md) — secrets policy  
14c. [runbooks/repo-history-hygiene.md](./runbooks/repo-history-hygiene.md) — history purge prep  
14d. [runbooks/oss-public-readiness.md](./runbooks/oss-public-readiness.md) — public / OSS checklist  
15. [data-dictionary.yaml](./data-dictionary.yaml)  
16. [brand-brief.md](./brand-brief.md)  
16b. [mvp-confirmation-checklist.md](./mvp-confirmation-checklist.md) — **human MVP / F-01 / staging ticks**  
17. [adr/](./adr/)  
18. [error-journal.md](./error-journal.md)  
19. [runbooks/staging-dokploy.md](./runbooks/staging-dokploy.md)  
19b. [runbooks/dev-dokploy-smoke.md](./runbooks/dev-dokploy-smoke.md) — Dev smoke pattern (generic)  
20. [plans/](./plans/) — historical  

Root: [GAMEPLAN.md](../GAMEPLAN.md) · [PROGRESS.md](../PROGRESS.md) · [AGENTS.md](../AGENTS.md)

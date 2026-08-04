# Git & GitHub strategy (Mestryx-dev)

## Ownership

| Item | Value |
|------|--------|
| GitHub user | **Mestryx-dev** (personal) |
| Umbrella repo | `https://github.com/Mestryx-dev/SaaS-Multisite-Platform` |
| Company org | **Not used** for this platform (for now) |
| WorkSpace | Registered as submodule under `repositories/SaaS-Multisite-Platform` |

## Levels

```
WorkSpace
└── repositories/SaaS-Multisite-Platform   ← this repo
    ├── apps/*      ← optional future nested remotes
    └── packages/*  ← optional future nested remotes
```

## When to split nested repos

Split `apps/api`, `packages/ui`, etc. into their own `Mestryx-dev/*` remotes only when:

- Independent versioning / reuse across Mestryx projects, or  
- Different access needs  

Until then: **one repo**. Prefer folders over premature submodules (YAGNI).

## Naming convention (future remotes)

| Component | Suggested repo |
|-----------|----------------|
| Umbrella | `SaaS-Multisite-Platform` (current) |
| API | `mestryx-platform-api` |
| Admin | `mestryx-platform-admin` |
| Web | `mestryx-platform-web` |
| UI | `mestryx-platform-ui` |
| Mobile | `mestryx-platform-mobile` |

All under **Mestryx-dev**, private by default.

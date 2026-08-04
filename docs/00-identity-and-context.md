# Identity & context

**Date**: 2026-07-16 · **Updated**: 2026-08-04 (OSS scrub)

## Who

| Field | Value |
|-------|--------|
| Upstream maintainer | Mestryx |
| GitHub | [Mestryx-dev](https://github.com/Mestryx-dev) |
| Working product name | **mestryx-platform** |
| Primary product domain (upstream) | **mestryx.dev** |
| Contact (upstream) | `contact@mestryx.dev` / security reports: `security@mestryx.dev` |
| Build style | Solo + AI agents; YAGNI / KISS; self-hosted Docker orchestration |

Forks should substitute their own org, domains, and contact addresses via env and marketing i18n — see [oss-public-readiness.md](./runbooks/oss-public-readiness.md).

## Product

Multi-tenant **multisite CMS**: one admin for many brand sites/domains, modular features, shared UI package, later mobile.

## Principles

1. Docs are source of truth alongside code.  
2. Stack is defined in `docs/02-stack.md`; changes go through a new ADR.  
3. Nested GitHub remotes per app are optional later (`docs/04-git-and-github-strategy.md`).  
4. **Piblox** is a different product (Studio / video).  

## Ops

Deploy with your preferred Docker platform (Dokploy, Coolify, Compose). Keep secrets in the orchestrator or a vault — **never** commit them here. Homelab-specific IDs and LAN details stay in private operator notes, not this repository.

# Identity & context

**Date**: 2026-07-16 · **Owner**: Mestryx

## Who

| Field | Value |
|-------|--------|
| Operator | Mestryx (Florian) |
| GitHub | [Mestryx-dev](https://github.com/Mestryx-dev) — personal |
| Working product name | **mestryx-platform** |
| Primary domain | **mestryx.dev** |
| Email / ops | Prefer `*@mestryx.dev` |
| Build style | Solo + AI agents; YAGNI / KISS; Dokploy |

## Product

Multi-tenant **multisite CMS**: one admin for many brand sites/domains, modular features, shared UI package, later mobile.

## Principles

1. Docs are source of truth alongside code.  
2. Stack is defined in `docs/02-stack.md`; changes go through a new ADR.  
3. Nested GitHub remotes per app are optional later (`docs/04-git-and-github-strategy.md`).  
4. **Piblox** is a different product (Studio / video).  

## Ops

Homelab / Dokploy, Agent Vault, Memorizer, Hindsight — for deploy and memory; never commit secrets here.

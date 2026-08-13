# Error journal

## Format

- **Date** – YYYY-MM-DD  
- **Severity** – Low / Medium / High / Critical  
- **Summary** – One line  
- **Details** – Repro / logs  
- **Root cause** (if known)  
- **Status** – Open / In Progress / Fixed / Won’t Fix  
- **Resolution**

## Entries

### 2026-08-04 — Graphify CLI upgrade blocked by MITM TLS

- **Severity** – Low  
- **Summary** – `uv tool upgrade graphifyy` fails on workstation with `UnknownIssuer` against PyPI when Agent Vault HTTPS proxy MITM is active.  
- **Details** – Local CLI remains `graphify 0.8.13`. `graphify install --platform cursor` and `pnpm graphify` / `./scripts/graphify-update.sh` succeed. CI installs fresh `graphifyy` without the LAN MITM.  
- **Root cause** – uv does not trust `~/.agent-vault/mitm-ca.pem` for PyPI even with `SSL_CERT_FILE` set.  
- **Status** – Open (workaround: keep 0.8.13 locally; CI gets latest)  
- **Resolution** – Prefer upgrading outside the MITM proxy or teach uv the vault CA; do not block agents on upgrade.

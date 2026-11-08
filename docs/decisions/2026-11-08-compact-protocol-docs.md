# Compact installed protocol docs

Status: Accepted
Date: 2026-11-08
Scope: Protocol files the installer copies into target repositories

## Context

Every target repository received ten protocol files across eight directories.
`AGENTS.md`, loaded in every session, restated most of `docs/WORKFLOW.md`; `docs/README.md` repeated the namespace table in `docs/WORKFLOW.md`; the four template namespaces repeated the same filename, supersession, citation, and duplication rules; and `docs/plans/` and `docs/testing/` kept one-paragraph READMEs only to hold empty directories.

## Decision

`docs/WORKFLOW.md` is the single namespace index and holds the rules shared by every artifact namespace.
Each namespace `README.md` keeps only its admission criteria, template, and namespace-specific rules, and overrides a shared rule where it differs.
`docs/plans/README.md` covers `active/` and `completed/`, and `docs/testing/README.md` covers its subdirectories; those subdirectories are created with their first artifact.
`AGENTS.md` keeps only the always-applicable rules and points to `docs/WORKFLOW.md` for the rest.

## Constraints

- A new namespace is indexed in the `docs/WORKFLOW.md` layout tables and has its own `README.md` before it holds artifacts.
- Retired protocol paths stay allowed in installed state so `update --apply` retires unmodified copies and keeps locally edited ones.

## Consequences

- Positive: the core install drops from 10 files and about 31 KB to 8 files and about 25 KB, and the per-session `AGENTS.md` shrinks by about 45%.
- Negative: writing an artifact needs both the namespace `README.md` and the shared rules in `docs/WORKFLOW.md`.

## References

- Human request, 2026-11-08: compact the docs folder copied into workflows, starting with the low-risk consolidation that keeps behavior unchanged.

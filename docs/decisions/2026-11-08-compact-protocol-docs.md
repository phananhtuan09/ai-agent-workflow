# Compact installed protocol docs

Status: Accepted
Date: 2026-11-08
Scope: Protocol files the installer copies into target repositories

## Context

Every target repository received ten protocol files across eight directories, more than the human could keep track of or update.
`AGENTS.md`, loaded in every session, restated most of `docs/WORKFLOW.md`; `docs/README.md` repeated the namespace table in `docs/WORKFLOW.md`; the template namespaces repeated the same filename, supersession, citation, and duplication rules; and `docs/plans/` and `docs/testing/` kept one-paragraph READMEs only to hold empty directories.
In practice the human never used `docs/product/`, `docs/observed/`, or `docs/runbooks/`: agents did not write to them, and the human keeps product context in `docs/PRODUCT.md`.

## Decision

`docs/WORKFLOW.md` is the single namespace index and holds the rules shared by every artifact namespace.
Each namespace `README.md` keeps only its admission criteria, template, and namespace-specific rules, and overrides a shared rule where it differs.
`docs/plans/README.md` covers `active/` and `completed/`, and `docs/testing/README.md` covers its subdirectories; those subdirectories are created with their first artifact.
`AGENTS.md` keeps only the always-applicable rules and points to `docs/WORKFLOW.md` for the rest.
The `docs/product/`, `docs/observed/`, and `docs/runbooks/` namespaces are removed:

- Accepted product and domain rules are recorded as decisions in `docs/decisions/`.
- Knowledge inferred from code, tests, history, or runtime behavior is never recorded as durable knowledge; future work rediscovers it from the repository.
- The runtime E2E capability records how to start the project only in its project runtime reference, not in a separate runbook.

## Constraints

- A new namespace is indexed in the `docs/WORKFLOW.md` layout tables and has its own `README.md` before it holds artifacts.
- Retired protocol paths stay allowed in installed state so `update --apply` retires unmodified copies and keeps locally edited ones.
- `docs/PRODUCT.md` remains a derived brief; `docs/decisions/` stays authoritative when they disagree.

## Consequences

- Positive: the core install drops from 10 files in 8 directories to 5 files in 4 directories, and the per-session `AGENTS.md` shrinks by about 45%.
- Negative: writing an artifact needs both the namespace `README.md` and the shared rules in `docs/WORKFLOW.md`.
- Negative: facts inferred from code are rediscovered in each session instead of being cached, and product rules share a namespace with technical decisions.
- Negative: artifacts already written to the removed namespaces in an existing project are left in place but are no longer indexed.

## References

- Human request, 2026-11-08: compact the docs folder copied into workflows, starting with the low-risk consolidation that keeps behavior unchanged.
- Human request, 2026-11-08: delete `docs/observed/`, `docs/product/`, and `docs/runbooks/` because they are never used and add docs to maintain.

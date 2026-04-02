---
name: delete-feature
description: Use when the user asks to remove, delete, or disable a feature. Inventories all surfaces, analyzes dependencies, chooses deletion strategy, and verifies completeness. Do not use for bug fixes, refactoring, or partial UI changes that are not feature removals.
---

# Delete Feature

Delete a feature without leaving dead paths, dangling dependencies, or hidden entry points. Surface-level deletion is not enough.

## Inputs

- Feature name or description
- Optional: specific files, routes, or components known to belong to the feature
- Optional: deletion approach preference (hard delete / soft disable / phased)

## Codex Tool Mapping

- Claude `Read/Edit/Write` → inspect files with shell reads and edit with `apply_patch`
- Claude `Grep` → `rg <pattern>` to find all surfaces (route names, event names, symbols)
- Claude `Glob` → `rg --files | grep <pattern>` or `find` to locate related files by path
- Claude `AskUserQuestion` → ask the user directly for scope or strategy decisions
- Claude `Bash` → run build or tests to verify no dangling references

## Workflow

### 1. Clarify scope

If any is ambiguous, ask before proceeding:

- What is the feature name or entry point?
- Should related data (DB records, config, env vars) also be removed?
- Are any parts intentionally shared and must be kept?
- Is there a preferred deletion approach?

### 2. Feature inventory

Find every surface before touching any code. Use `rg` and `find` to scan:

| Surface | What to look for |
|---------|-----------------|
| **UI entry points** | Buttons, links, nav items, modals |
| **Routes / navigation** | URL routes, page files, redirects |
| **Business logic** | Services, controllers, handlers, use cases |
| **API calls** | Endpoints, HTTP clients, GraphQL queries/mutations |
| **Permissions / roles** | Feature flags, RBAC rules, auth checks |
| **Config / env vars** | Feature toggles, `.env` keys, app config |
| **Analytics / tracking** | Event names, telemetry calls |
| **Tests** | Unit, integration, E2E tests covering this feature |
| **Docs** | README sections, API docs, user guides |
| **Background jobs** | Cron jobs, event listeners, queues, workers |

Mark items you cannot confirm as `[uncertain]` — do not skip them.

### 3. Dependency analysis

For each surface found, classify:

- `safe to delete` — used only by this feature
- `needs extraction` — shared code, must decouple first
- `defer` — not enough evidence to decide

**Gate before Step 4:**

If any items are `defer` or `[uncertain]`:
1. List them explicitly.
2. Ask the user: block until resolved, or accept risk and proceed?
3. If **block**: stop, request more context.
4. If **proceed**: **strategy is forced to Soft disable — skip Step 4 selection entirely.**

### 4. Choose deletion strategy

Only reached when the gate above passed cleanly (no unresolved items).

| Strategy | When to use |
|----------|-------------|
| **Hard delete** | All items confirmed `safe to delete` |
| **Soft disable** | Gate bypassed with unresolved items, OR uncertain deps need verification |
| **Phased deprecation** | External consumers exist; migration period needed |

Choose one. Do not mix strategies.

### 5. Execute deletion

Remove in dependency order: consumers before providers.
Apply one surface category at a time using `apply_patch`.

Rules:
- Do not delete items marked `needs extraction` until extraction is complete.
- Do not clean up unrelated code discovered along the way.

### 6. Cleanup completeness

After deletion, verify each category:

- [ ] Imports / exports referencing deleted code removed
- [ ] Routes and navigation entries removed
- [ ] Tests deleted or updated
- [ ] Docs sections removed or updated
- [ ] Analytics / telemetry calls removed
- [ ] Config keys and env vars cleaned or documented
- [ ] Permissions / RBAC rules removed
- [ ] Fallback messages or dead copy removed
- [ ] Background jobs deregistered

### 7. Validate

Run build and test suite to confirm no dangling references or broken imports.

### 8. Output summary

```
## Deletion Summary

**Feature**: [name]
**Strategy**: hard delete / soft disable / phased deprecation

**Surfaces found**: [list]
**Dependencies impacted**: [list with safe/extraction/defer status]

**Deleted**:
  - [file or section]: [what was removed]

**Impact**:
  - Entry points removed: [UI / routes / API — what users can no longer access]
  - Data / config affected: [DB tables, env vars, flags — left, removed, or stale]
  - Blast radius:
    - L1 direct: [modules that imported or called deleted code]
    - L2 transitive: [callers of L1 if impact propagates]
    - L3 shared infra: [DB schema / config / event bus — only if touched]

**How to verify**:
  1. Build passes — no missing import errors
  2. Tests pass — no refs to deleted code
  3. Navigate manually — entry points (routes, buttons, menu items) are gone
  4. Check config/env — cleaned or disabled
  5. Deferred items — list what still needs follow-up

**Intentionally retained**:
  - [item]: [reason — shared utility, insufficient evidence, etc.]

**Deferred / follow-ups**:
  - [item]: [what needs to be done and why not done now]
```

## When To Ask The User

Ask only when:
- Feature scope is ambiguous enough that the wrong boundary would cause unintended deletions
- `[uncertain]` items cannot be resolved by reading the codebase
- Strategy selection requires a business decision (e.g., external consumers)

## Quality Bar

- Do not delete only visible UI — check all 10 surface categories
- Hard delete requires all items confirmed `safe to delete`; anything else → Soft disable
- Intentionally retained and deferred items must be listed explicitly, not silently omitted

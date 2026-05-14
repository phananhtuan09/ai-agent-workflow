# Specs-Driven Workflow

## Routing

| Task type | Workflow |
|---|---|
| New feature | `/create-spec` → `/create-plan` → `/enrich-plan` → `/execute-plan` → `/verify-feature` |
| Fix bug (clear) | `/create-plan "Fix: ..."` → `/execute-plan` |
| Refactor | `/create-plan "Refactor: ..."` → `/execute-plan` |
| Fix bug (ambiguous/large) | `/create-spec` → `/create-plan` → `/enrich-plan` → `/execute-plan` |
| Small update (1-2 files) | `/execute-plan "inline task"` |

---

## Full Flow — New Feature

```
User Request
     │
     ▼
┌─────────────────────────────────────────────────┐
│  ROUTING GATE                                   │
│  "Does scope need human approval first?"        │
└─────────────────────────────────────────────────┘
     │
     ▼
/create-spec
· max 40 lines, business logic only
· no tech/framework details
· output: docs/ai/specs/{feature}.md
     │
     ▼
⚙ review-spec  [sub-agent · role]
· no tech/implementation details in spec
· ACs must be verifiable ("user can X", not "system should Y")
· Out of Scope section must exist
· Open Questions must be explicit (not embedded in other sections)
· warn if spec > 40 lines
· RESULT: pass → continue | fail → revise spec
     │
     ▼
/create-plan
· reads spec file
· max 60 lines, phases + intent-based tasks
· output: docs/ai/plans/{feature}.md
     │
     ▼
⚙ review-plan  [sub-agent · role]
· no [DISCOVER] tasks allowed
· no file paths in task descriptions
· every AC from spec must be covered by ≥1 task
· one intent per task (completable in one edit)
· ## Spec reference must be valid
· RESULT: pass → continue | fail → revise plan
     │
     ▼
/enrich-plan
· reads plan, iterates over each phase
· spawns ⚙ Explore sub-agent per phase (read-only)
  └─ finds all files to modify/create + relevant symbols
· output: docs/ai/plans/{feature}-phase-N-details.md (per phase)
· appends ## Enrich Summary to plan file
     │
     ▼
/execute-plan  [Enriched mode]
· reads phase-N-details.md before each phase
· max 5 files read per task, no broad exploration
· marks tasks [x] in plan file as completed
· phase-by-phase checkpoint if plan > 10 files
· output: docs/ai/summaries/{feature}.md
     │
     ▼
/verify-feature
· reads spec → generates verification checklist
· one manual step per AC: "[do X] → [expect Y]"
· automated: unit + integration suggestions
· flags unresolved Open Questions
· output: docs/ai/verifications/{feature}.md
```

---

## Short Flows

### Clear Bug / Refactor

```
User Request
     │
     ▼
/create-plan "Fix: ..." | "Refactor: ..."
· inline mode, max 20 lines, single phase
· output: docs/ai/plans/{slug}.md
     │
     ▼
/execute-plan  [Inline mode]
· grep by task keywords to locate files (max 3 per task)
· no details file required
· output: docs/ai/summaries/{slug}.md
```

### Small Update (1-2 files)

```
User Request
     │
     ▼
/execute-plan "inline task description"
· no plan file created
· inline mode: ≤5 tasks, grep to locate files
· output: docs/ai/summaries/{slug}.md
```

---

## Sub-Agents

| Agent | Type | Spawned by | Tools | Purpose |
|---|---|---|---|---|
| `review-spec` | role | automatic after `/create-spec` | Read | Validates spec before planning |
| `review-plan` | role | automatic after `/create-plan` | Read, Glob, Grep | Validates plan before execution |
| `Explore` | agent | `/enrich-plan` (per phase) | read-only | Maps files & symbols per phase |

---

## Artifacts

| Path | Written by |
|---|---|
| `docs/ai/specs/{feature}.md` | `/create-spec` |
| `docs/ai/plans/{feature}.md` | `/create-plan` |
| `docs/ai/plans/{feature}-phase-N-details.md` | `/enrich-plan` |
| `docs/ai/summaries/{feature}.md` | `/execute-plan` |
| `docs/ai/verifications/{feature}.md` | `/verify-feature` |

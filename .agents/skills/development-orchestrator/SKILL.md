---
name: development-orchestrator
description: Use when the user wants to plan a new feature or feature update — investigation, planning, and review. Always stops after review for user validation before implementation.
---

# Development Orchestrator

Use this skill as the control plane for planning new and updated features.

The orchestrator does not replace `create-plan` or `execute-plan`. It sits above them and does four things:

- classify the work by task type and task size
- investigate scope before trusting any prompt
- enforce a readiness gate before planning
- route to the right planning skill, review all plans, then stop

This skill does not handle bug-fix, refactor, upgrade, or delete. Use targeted skills for those.

Implementation is a separate step. After this skill stops, the user runs `execute-plan` with the reviewed plan.

## Inputs

Accept one of:

- requirement doc path: `docs/ai/requirements/req-{name}.md`
- epic doc path: `docs/ai/planning/epic-{name}.md`
- feature plan path: `docs/ai/planning/feature-{name}.md`
- plain-text description with no artifact path

Optional:

- direct user scope notes
- blocker notes
- spec paths, screenshots, or hinted files

## Required Context

Read these files at the start:

- `docs/ai/planning/README.md`

Read linked docs as needed:

- requirement linked from epic or feature plan — only when frontmatter field is non-null and file exists on disk
- epic linked from requirement or feature plan — same guard

Do not read `docs/ai/project/CODE_CONVENTIONS.md` or `docs/ai/project/PROJECT_STRUCTURE.md` at the orchestrator level.

## Role Definitions

Worker prompts live in:

- `.agents/roles/task-investigator.md`
- `.agents/roles/dev-plan-reviewer.md`

Use them when the work is large enough or ambiguous enough to benefit from explicit worker boundaries.

## Codex Multi-Agent Contract

Use these exact agent names when `spawn_agent` is available:

- `task_investigator`
- `dev_plan_reviewer`

Execution policy:

- Keep one primary writer for requirement, epic, and feature-plan edits.
- Use sub-agents for read-heavy investigation and review.
- If a spawned agent fails, retry once with a tighter packet, then continue solo.

## Classification Model

Classify every run on two independent axes **before** asking the user anything:

- `Task Type`: `new-feature` or `update-feature` only
- `Task Size`: `quick`, `standard`, or `large`

If the input clearly describes bug-fix, refactor, upgrade, or delete → stop immediately and tell the user this skill does not handle that task type.

### Task Type Definitions

- `new-feature`: adding behavior that does not exist
- `update-feature`: changing or extending existing behavior

### Quick-Candidate Detection

Score the following signals from the prompt text only (no file reads at this stage):

```
POSITIVE signals (each scores +1):
  + single file named explicitly
  + single function / class / variable named
  + stack trace pointing to one file
  + "change X to Y" with specific location
  + known small patterns: rename, condition tweak, UI tweak, config change

NEGATIVE signals (any one present → NOT a quick-candidate):
  - keywords: "refactor", "migrate", "restructure", "rewrite"
  - keywords: "system", "module", "layer", "service", "architecture"
  - multiple files or paths mentioned
  - "add new feature" or "implement X" without a specific existing location
  - no specific file or function mentioned at all
  - scope spans multiple behaviors or user flows
```

Classify as `quick` only when: positive score ≥ 3 **AND** no negative signal is present.

A `quick` task uses `bounded` investigation (max 2 files). If bounded investigation reveals multi-file scope → upgrade to `standard` and run `full` investigation.

## Investigation Policy

### Investigation modes

- **bounded**: for `quick` tasks. Pass `Allowed Reads` of at most 2 likely files.
- **full**: for standard/large tasks or when scope is unclear.

Investigate locally (read 1–2 files yourself) when:
- the artifact is a well-formed feature plan or requirement doc with clear scope

Spawn `task_investigator` when any of these are true:

- the input is plain text
- task type is ambiguous after reading the prompt
- scope is still unclear after reading one or two likely files
- multi-file or cross-layer impact is likely

The investigator is read-only and returns this fixed structure:

```markdown
## Investigation Report

**Task Type:** new-feature | update-feature
**Confidence:** high | medium | low
**Scope:** single-file | multi-file | cross-layer
**Mode:** bounded | full

### Files Read
- `path/to/file.ts` - why it was read

### Known (from codebase)
- fact 1

### Unclear (blocking)
- gap 1

### Questions for User
1. question only when a blocking gap remains

### Recommended Next Step
proceed | ask-user | escalate-to-spec
```

After reading the report, drop the full investigation report from active context. Carry forward only: confirmed task type, scope, and blocking gaps.

## Gate

Single combined gate. Match required depth to task size:

- **Quick**: single concern, clear outcome, minimal inline plan sufficient.
- **Standard**: multiple behaviors or files, a feature plan doc sufficient.
- **Large**: multi-deliverable, cross-layer — full spec plus epic required.

Fail when:
- target artifact cannot be found
- core behavior or feature boundary is missing
- no acceptance criteria or behavior contract for non-trivial work
- unresolved open questions would materially change implementation
- for `new-feature`: integration point or existing pattern to follow is unknown
- for `update-feature`: the existing behavior being changed cannot be located

Warn-blocking when:
- acceptance criteria exist but are not measurable
- scope boundary ambiguity could cause over-implementation

Warn-advisory when:
- out-of-scope boundary is missing but implementation boundary is still clear
- dependency order is implied but not explicit
- risks exist without concrete mitigation

Pass when:
- the next workflow can proceed without guessing behavior

**Clarification limit:** do not ask the user more than two clarification rounds total across investigation and gate. If still ambiguous, stop and report the exact blocker.

## Routing Rules

### Requirement input

If the requirement already links to an existing epic on disk → switch to epic flow.

Otherwise decide by size:

**Large / multi-slice / dependency-heavy** → create the epic doc directly, then generate all feature plans via `create-plan`:

1. Read `docs/ai/planning/epic-template.md`
2. Generate `docs/ai/planning/DD-MM-YYYY-epic-{name}.md` with:
   - `requirement` frontmatter pointing to the req doc
   - Overview from requirement's executive summary (1–3 sentences)
   - Feature Plans table: proposed slices with descriptions, FR Scope, Depends On
   - Dependency graph between plans
3. Update the requirement doc's `epic_plan` frontmatter and Related Plans section
4. For each plan row in the epic, invoke `create-plan` with the epic path

Use this epic heuristic:
- more than one independently shippable deliverable
- work spans multiple major layers or domains
- requirement clearly decomposes into dependent slices

**Standard / self-contained** → invoke `create-plan` directly for a single feature plan.

### Epic input

Create or refresh every missing or stale feature plan tracked by the epic by invoking `create-plan` with the epic path for each new plan.

### Feature plan input

Plan already exists — skip directly to plan review.

### Plain-text input

Investigation must complete before proceeding here.

- `quick` + gate passed → create a minimal inline plan (goal, expected outcome, likely files, validation, non-goals); skip durable planning docs; proceed directly to final response
- `standard` → invoke `create-plan`
- `large` or `new-feature` with unclear boundaries → escalate: stop, surface missing spec as a blocker, ask user to provide a requirement doc path or confirm a new requirement doc should be created

## Plan Review

Skip for inline quick tasks that do not create a durable feature plan doc.

### Epic-level consistency check (when epic exists)

Verify lightly across all plans in the epic:
- no duplicate behavior across plans
- dependency order is consistent and complete
- no plan references a deliverable that belongs to an unrelated plan

Report cross-plan conflicts as `warn-blocking`. Report minor inconsistencies as `warn-advisory`.

### Deep review for next-ready plan

Spawn `dev_plan_reviewer` with a read-only packet for the plan that will be implemented next.

Interpret results:
- `fail` → stop; the plan doc must be fixed before proceeding
- `warn-blocking` → stop; report the blocking warning; require user confirmation
- `warn-advisory` → log and continue
- `pass` → continue to status update

### Update plan status

After `pass` or `warn-advisory` on the deep review, update the feature plan frontmatter `status` to `reviewed`.

## Workflow

### 1. Classify and route

Read the prompt and artifact type. Detect Task Type and Task Size from prompt signals before reading any codebase files.

If the input describes bug-fix, refactor, upgrade, or delete → stop and tell user.

Identify the artifact type and linked documents.

### 2. Investigate gaps

For plain-text input, always run investigation before proceeding.

- run `task_investigator` with a read-only packet
- set Investigation Mode to `bounded` for quick, `full` otherwise
- read the report once; drop the full report; carry forward only extracted facts
- `proceed` and `Unclear` empty → continue to gate
- `ask-user` or blocking gaps → ask user once; treat answer as final context
- `escalate-to-spec` → stop and report missing spec as a blocker
- `Confidence: low` with non-empty `Unclear` → treat as `ask-user`

### 3. Apply gate

- `fail` → stop and report exact missing input
- `warn-blocking` → stop and require user confirmation
- `warn-advisory` → continue and log
- `pass` → continue

### 4. Plan

Route based on artifact type and task size per Routing Rules above.

Pass only bounded context to `create-plan`: requirement path, epic path if linked, constraints. Do not forward full conversation history.

### 5. Plan review

Run epic-level consistency check when an epic exists, then deep review for next-ready plan.

Set `status: reviewed` on the reviewed plan after pass or warn-advisory.

### 6. Final response — STOP

Always stop here. Do not execute code.

Report:
- input artifact and route chosen
- detected task type and task size
- investigation mode used and key findings
- gate result (pass / warn with details)
- files created or updated (planning docs only)
- epic consistency check result when applicable
- deep review result for next-ready plan
- warn-blocking items with evidence
- warn-advisory items logged

End with:

```
Planning complete. Status set to `reviewed`.

To implement:
  1. Review the plan doc(s) above.
  2. Run: execute-plan {feature-plan-path}
  3. Run: manage-epic {epic-name} to sync progress after each plan (if epic linked).
```

## Context Packet

Before handing work to another skill or worker:

- `Mode`: `investigate`, `plan`, `plan-review`
- `Input Artifact`: `requirement`, `epic`, `feature-plan`, or `plain-text`
- `Investigation Mode`: `bounded` or `full` (for investigator packets only)
- `Task Type`: `new-feature` or `update-feature`
- `Task Size`: `quick`, `standard`, or `large`
- `Goal`: one concrete outcome
- `Source of Truth`: exact doc paths or prompt snippets
- `Known Facts`: only facts relevant to this step
- `Blocking Gaps`: unresolved items
- `Allowed Reads`: explicit list (hard contract)
- `Non-Goals`: explicit out-of-scope items
- `Stop If`: ambiguity that would materially change behavior

Worker-specific context:

| Worker | Required in packet | Excluded from packet |
| --- | --- | --- |
| task-investigator | prompt + hint files + Allowed Reads | CODE_CONVENTIONS |
| dev-plan-reviewer | feature plan + req + epic + CODE_CONVENTIONS + PROJECT_STRUCTURE | changed files, validation output |

## Quality Bar

- routing decisions are explainable from repository artifacts
- task type and task size are both explicit before planning
- investigation stays bounded and read-only
- worker context packets are stage-specific; prior-stage artifacts are dropped when no longer needed
- every warn-blocking and fail finding from workers has evidence
- no planning doc is marked `reviewed` unless the deep review passed or was warn-advisory
- standalone `create-plan` and `execute-plan` flows remain valid without this orchestrator

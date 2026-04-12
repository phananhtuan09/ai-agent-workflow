---
name: development-orchestrator
description: Plan new features and feature updates — investigation, planning, and review. Always stops after review for user validation before implementation.
---

## Goal

Generate and review all planning artifacts for a new or updated feature, then stop for user validation.

This command covers: investigate → gate → plan → review → stop.

Implementation is a separate step: run `/execute-plan [feature-plan-path]` after approving the plan.

This command does not handle bug-fix, refactor, upgrade, or delete. Use targeted commands for those.

---

## Workflow Alignment

- Provide brief status updates (1–3 sentences) before and after important actions.
- For standard/large work, create orchestration todos for macro phases: Classify, Investigate, Gate, Plan, Review.
- Keep exactly one orchestration todo `in_progress`.
- Use planning doc checkboxes for implementation task state; use command todos only for orchestration phase state.

---

## Step 1: Route and Classify

Run this step before asking the user anything.

### 1a: Detect artifact type

Read the user input and identify one of:
- requirement doc path: `docs/ai/requirements/req-{name}.md`
- epic doc path: `docs/ai/planning/epic-{name}.md`
- feature plan path: `docs/ai/planning/feature-{name}.md`
- plain-text description with no artifact path

### 1b: Load core context

Read:
- `docs/ai/planning/README.md`
- the selected artifact when one exists

Then read linked docs as needed:
- requirement linked from epic or feature plan — only when the frontmatter field is non-null and the file exists on disk
- epic linked from requirement or feature plan — same guard

Do not read `docs/ai/project/CODE_CONVENTIONS.md` or `docs/ai/project/PROJECT_STRUCTURE.md` at this stage.

### 1c: Classify task type and task size

**Task Type** (only two accepted):
- `new-feature`: adding behavior that does not exist
- `update-feature`: changing or extending existing behavior

If the input clearly describes bug-fix, refactor, upgrade, or delete → stop immediately and tell the user this command does not handle that task type.

**Task Size** on three levels:
- `quick`: single file, single function, clear outcome, no cross-cutting impact
- `standard`: multiple files or behaviors, one feature plan is sufficient
- `large`: multi-deliverable, cross-layer, dependency-ordered slices

**Quick-candidate detection (from prompt text only, no file reads):**

```
POSITIVE signals (each +1):
  + single file named explicitly
  + single function or class named
  + stack trace pointing to one file
  + "change X to Y" with specific location
  + known small patterns: rename, condition tweak, UI tweak, config change

NEGATIVE signals (any one → NOT quick):
  - keywords: "refactor", "migrate", "restructure", "rewrite"
  - keywords: "system", "module", "layer", "service", "architecture"
  - multiple files or paths mentioned
  - "add new feature" or "implement X" without a specific existing location
  - no specific file or function named
  - scope spans multiple behaviors or user flows
```

Classify as `quick` only when: positive score ≥ 3 **AND** no negative signal.

### 1d: Normalize routing

- If input is a requirement that already links to an existing epic → route to the epic flow.
- If input is an epic → choose the next ready feature plan in dependency order.
- If input is a feature plan → skip directly to Step 4 (Plan Review).
- If input is plain-text → defer routing to after investigation.

---

## Step 2: Investigate

### 2a: When to investigate

**Quick path (bounded):**
- Spawn `task-investigator` with `mode: bounded`, reads limited to 1–2 most likely files.
- If report confirms `single-file` scope → continue as quick.
- If report returns `multi-file` or `cross-layer` → upgrade to `standard`, re-run with `mode: full`.

**Standard/large path (full):**
- Investigate locally (read 1–2 files) when the artifact is a well-formed feature plan or requirement doc with clear scope.
- Spawn `task-investigator` with `mode: full` when:
  - input is plain text
  - task type is ambiguous after reading core docs
  - scope is unclear after reading one or two likely files
  - multi-file or cross-layer impact is likely

### 2b: Context packet for investigator

```text
Agent(
  subagent_type="task-investigator",
  description="Classify task type, inspect likely scope, and surface blocking gaps",
  prompt="Input Artifact: {requirement | epic | feature-plan | plain-text}
Investigation Mode: {bounded | full}
Task Type Hint: {new-feature | update-feature | ambiguous}
Task Size Hint: {quick | standard | large}
Goal: {one concrete outcome expected from this run}
Prompt Summary: {concise user request}
Hint Files: {list or none}
Linked Docs: {paths or none}
Known Facts: {facts already confirmed from core context reading}
Blocking Gaps: {items still unclear before investigation}
Allowed Reads: {explicit list or 'prompt and hints only' for bounded}
Stop If: {ambiguity that would materially change implementation}

Return the structured investigation report only."
)
```

### 2c: Interpret the investigation report

- `Recommended Next Step: proceed` and `Unclear` is empty → continue to Step 3.
- `Recommended Next Step: ask-user` or blocking gaps remain → use `Questions for User` from the report to call `AskUserQuestion` once; treat the answer as final context.
- `Recommended Next Step: escalate-to-spec` → stop; report the missing spec as a blocker; ask the user to provide a requirement doc path or confirm a new requirement doc should be created.
- `Confidence: low` with non-empty `Unclear` → treat as `ask-user`.

After reading the report, carry forward only: confirmed task type, scope, blocking gaps. Drop the full report.

---

## Step 3: Gate

Single combined gate replacing the previous two-gate system.

Match required depth to task size:
- **Quick**: single concern, clear outcome, minimal inline plan is sufficient.
- **Standard**: multiple behaviors or files, a feature plan doc is sufficient.
- **Large**: multi-deliverable, cross-layer — full spec plus epic required.

**Fail when:**
- Target artifact cannot be found.
- Core behavior or feature boundary is missing.
- No acceptance criteria or behavior contract for non-trivial work.
- Unresolved open questions would materially change implementation.
- For `new-feature`: integration point or existing pattern to follow is unknown.
- For `update-feature`: the existing behavior being changed cannot be located.

**Warn when:**
- Out-of-scope boundary is missing but implementation boundary is still clear.
- Dependency order is implied but not explicit.
- Risks exist without concrete mitigation.

**Pass when:**
- The next workflow can proceed without guessing behavior.

If gate fails → stop and report the exact missing input.

If gate warns → continue and include warning in final report. If warning would materially change which docs to generate, ask user once.

**Clarification limit:** No more than two clarification rounds total across Steps 2 and 3. If still ambiguous after two rounds, stop and report the exact blocker.

---

## Step 4: Plan

### 4a: Requirement input

If the requirement already links to an existing epic on disk → switch to epic flow.

Otherwise decide by size:
- **Large / multi-slice / dependency-heavy** → create the epic doc directly, then generate all feature plans via `Skill(create-plan)`.
- **Standard / self-contained** → `Skill(create-plan)` for a single feature plan.

**Create epic directly** when:
- More than one independently shippable deliverable.
- Work spans multiple major layers or domains.
- Requirement clearly decomposes into dependent slices.

**Creating the epic doc:**
1. Read `docs/ai/planning/epic-template.md`
2. Generate `docs/ai/planning/DD-MM-YYYY-epic-{name}.md` with:
   - `requirement` frontmatter pointing to the req doc
   - Overview from requirement's executive summary (1–3 sentences)
   - Feature Plans table: proposed slices with descriptions, FR Scope, Depends On
   - Dependency graph between plans
3. Update the requirement doc's `epic_plan` frontmatter and Related Plans section
4. For each plan row in the epic, call `Skill(create-plan)` with the epic path so each plan links back

### 4b: Epic input

- Create or refresh every missing or stale feature plan tracked by the epic.
- Use `Skill(create-plan)` with the epic path for each new plan so it links back.

### 4c: Feature plan input

Plan already exists — skip to Step 5 (Review).

### 4d: Plain-text input

Investigation must complete (Step 2) before proceeding here.

If task size is `quick` and gate passed:
- Create a minimal inline plan: goal, expected outcome, likely files, validation, explicit non-goals.
- Skip durable planning docs.
- Proceed directly to Step 6 (Final Report) with the inline plan.

If task size is `standard`:
- Use `Skill(create-plan)` to create a feature plan doc.

If task size is `large` or `new-feature` with unclear boundaries:
- Escalate: stop execution, surface the missing spec as a blocker, ask the user to provide a requirement doc path or confirm a new requirement doc should be created.

---

## Step 5: Review

Skip for inline quick tasks that do not have a durable feature plan doc.

### 5a: Epic-level consistency check (when epic exists)

Verify lightly across all plans in the epic:
- No duplicate behavior across plans.
- Dependency order is consistent and complete.
- No plan references a deliverable that belongs to an unrelated plan.

Report any cross-plan conflicts as `warn-blocking`. Report minor inconsistencies as `warn-advisory`.

### 5b: Deep review for next-ready plan

Use an isolated sub-agent for the plan that will be implemented next:

```text
Agent(
  subagent_type="dev-plan-reviewer",
  description="Review feature plan readiness",
  prompt="Feature plan: {feature plan path}
Requirement: {req path or none}
Epic: {epic path or none}
Task Type: {new-feature | update-feature}
Task Size: {detected size}
Orchestrator note: {specific concern if any}

Return the concise review summary only."
)
```

Interpret results:
- `fail` → stop; the plan doc must be fixed before proceeding.
- `warn-blocking` → report the blocking warning; do not continue until user acknowledges.
- `warn-advisory` → log in final report; continue.
- `pass` → continue to Step 5c.

### 5c: Update plan status

After a `pass` or `warn-advisory` result on the deep review, update the feature plan frontmatter `status` to `reviewed`.

---

## Step 6: Final Report → STOP

Always stop here. Do not execute code.

Report:
- Input artifact and route chosen.
- Detected task type and task size.
- Investigation mode used (bounded or full) and key findings.
- Gate result (pass / warn with details).
- Files created or updated (planning docs only).
- Epic consistency check result (when applicable).
- Deep review result for next-ready plan.
- Warn-blocking items (with evidence).
- Warn-advisory items logged.

End with:

```
Planning complete. Status set to `reviewed`.

To implement:
  1. Review the plan doc(s) above.
  2. Run: /execute-plan {feature-plan-path}
  3. Run: /manage-epic {epic-name} to sync progress after each plan (if epic linked).
```

---

## Notes

- This command only generates and reviews planning artifacts. It does not write or modify application code.
- Keep user interaction in the command layer. Blocking clarification and warn-blocking confirmation must use `AskUserQuestion`. Do not ask the user questions inside worker agents.
- Do not silently move from one feature plan to another.
- The planning doc is the source of truth for implementation task state.
- **Context discipline:** Drop investigation artifacts after Step 2. Each worker receives only what it needs.

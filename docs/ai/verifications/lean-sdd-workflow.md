# Verification: Lean SDD Workflow Refactor

## Source
docs/ai/plans/lean-sdd-workflow.md

---

## AC1 — All deleted files removed (Phase 1)

### Manual Verification

- [x] AC1a (commands deleted): Check `.claude/commands/` → none of the following exist:
  `requirements-orchestrator.md`, `development-orchestrator.md`,
  `test-web-orchestrator.md`, `create-plan.md`, `review-spec.md`,
  `wiki-guide.md`, `wiki-find.md`, `wiki-init.md`, `wiki-add-doc.md`,
  `wiki-update.md`, `wiki-impact-check.md`, `wiki-reconcile.md`,
  `wiki-retire-doc.md`, `wiki-review-queue.md`
  → **PASS** — none present

- [x] AC1b (agents deleted): Check `.claude/agents/` → none of the following exist:
  `requirement-ba.md`, `requirement-sa.md`, `requirement-researcher.md`,
  `requirement-uiux.md`, `task-investigator.md`, `dev-verifier.md`,
  `test-web-analyst.md`, `test-web-qc.md`, `test-web-runtime-probe.md`,
  `test-web-ui-mapper.md`, `test-web-verifier.md`
  → **PASS** — none present

- [x] AC1c (logging hooks removed): Read `.claude/settings.json` → `"hooks": {}` (empty)
  → **PASS**

---

## AC2 — 5 new commands functional (Phase 2)

### Manual Verification

- [x] AC2a: Check `.claude/commands/init.md` exists and contains SCAN SCOPE, OUTPUT FILE,
  HARD LIMITS, and SECTIONS (Structure/Conventions/Constraints/Patterns)
  → **PASS**

- [x] AC2b: Check `.claude/commands/spec.md` exists and contains PROCESS, SPEC FORMAT,
  and RULES
  → **PASS**

- [x] AC2c: Check `.claude/commands/plan.md` exists and contains INPUT, ROUTING,
  FILE MODE and INLINE MODE formats, SHARED RULES
  → **PASS**

- [x] AC2d: Check `.claude/commands/execute-plan.md` exists and contains PROCESS PER TASK,
  SUMMARY FORMAT, and SUMMARY RULES
  → **PASS**

- [x] AC2e: Check `.claude/commands/verify.md` exists and contains INPUT, OUTPUT,
  VERIFICATION FORMAT, and RULES
  → **PASS**

- [x] AC2f: Check all 4 docs/ai/ subfolders exist:
  `docs/ai/specs/`, `docs/ai/plans/`, `docs/ai/summaries/`, `docs/ai/verifications/`
  → **PASS** — all 4 present

---

## AC3 — review-plan + spec-review agents updated (Phase 3)

### Manual Verification

- [x] AC3a (plan-review): Read `.claude/agents/plan-review.md` → verify all 3 new checks present:
  1. Every phase must start with [DISCOVER]
  2. No file paths in task descriptions
  3. Every AC from spec must be covered by at least one task
  → **PASS** — all 3 checks present at lines 29–43

- [x] AC3b (plan-review parent-child): Verify agent reads child phase files when plan has
  `## Phases` section
  → **PASS** — documented at lines 50–52

- [x] AC3c (spec-review): Read `.claude/agents/spec-review.md` → verify all 4 new checks:
  1. No technology/implementation details
  2. Verifiable ACs ("user can X")
  3. Out of Scope section present even if empty
  4. Open Questions listed explicitly
  → **PASS** — all 4 checks present at lines 21–35

- [x] AC3d (spec-review line limit): Verify check "warn if spec exceeds 40 lines" present
  → **PASS** — line 35

---

## AC4 — .claude/CLAUDE.md updated (Phase 3)

### Manual Verification

- [x] AC4a: Read `.claude/CLAUDE.md` → matches template (Principles, Communication,
  Workflow table with 5 routing rows, Note about project-scope)
  → **PASS**

- [x] AC4b: Count lines in `.claude/CLAUDE.md` → must be ≤ 50
  → **PASS** — 28 lines

- [x] AC4c: Confirm no logging section present
  → **PASS**

---

## Automated Verification

- [ ] Unit: N/A — no code, only markdown files
- [ ] Integration: Run `/spec`, `/plan`, `/execute-plan`, `/verify`, `/init` in a test
  project to confirm each command loads and executes without error

---

## Edge Cases

- [ ] `/plan` with parent file exceeding 60 lines → verify it splits into phase files
  and parent has `## Phases` index
- [ ] `/execute-plan` on parent plan → verify it reads each child phase file before
  executing that phase
- [ ] `/verify` called with plan file (not spec file) → verify it either handles gracefully
  or prompts user for correct input

---

## Excluded (Out of Scope)

- No code changes — only `.claude/` markdown files
- No changes to `.claude/skills/` contents (skills were not part of this refactor)
- No changes to `docs/ai/project/` conventions files

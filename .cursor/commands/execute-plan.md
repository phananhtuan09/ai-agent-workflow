---
name: execute-plan
description: Executes the planning doc tasks, edits code, and persists notes.
---

## Goal

Execute the feature plan by implementing tasks from the planning doc and updating task checkboxes as work progresses.

## Workflow Alignment

- Provide brief status updates (1–3 sentences) before each operation.
- For medium/large tasks, create todos (≤14 words, verb-led). Keep only one `in_progress` item.
- Update todos immediately after progress; mark completed upon finish.
- Perform edits via file editing tools, not by printing code for copy-paste.

### Prerequisites

- Feature name (kebab-case, e.g., `user-authentication`)
- Planning doc exists: `docs/ai/planning/feature-{name}.md`

---


## Step 1: Gather Context

**Tools:**
- ask user for clarification if feature name not provided
- read `docs/ai/planning/feature-{name}.md`
- read `docs/ai/planning/feature-template.md`
- read `docs/ai/project/CODE_CONVENTIONS.md`
- read `docs/ai/project/PROJECT_STRUCTURE.md`

**Process:**
- Ask for feature name if not provided (must be kebab-case)
- Load planning doc: `docs/ai/planning/feature-{name}.md`
- Load template: `docs/ai/planning/feature-template.md` to understand required structure

**Error handling:**
- Planning doc not found: Cannot proceed, notify user and exit
- Template not found: Continue without template structure validation
- Standards docs not found: Warn user, proceed without standards guidance

### 1a: Load Project Standards

**Read and extract relevant sections** (keep summaries, not full content):

1. **CODE_CONVENTIONS.md** (`docs/ai/project/CODE_CONVENTIONS.md`):
   - Identify sections relevant to this feature type (e.g., frontend conventions for UI features)
   - Extract key rules: naming patterns, file organization, code structure
   - Keep concise summary of applicable rules

2. **PROJECT_STRUCTURE.md** (`docs/ai/project/PROJECT_STRUCTURE.md`):
   - Understand project architecture
   - Identify where new files should go
   - Note existing patterns to follow

**Purpose**: These standards will guide implementation quality. Refresh this context at each phase boundary to prevent quality degradation in long plans.

### 1b: Load Design/Theme Specifications (If Exists)

**Check planning doc for design section**:

**If "Design Specifications" exists** (Figma extraction):
- Extract complete design specs into memory
- Design tokens, component breakdown, responsive specs
- **Note**: DO NOT fetch from Figma MCP again

**If "Theme Specification" exists** (Theme selection):
- Load theme details from planning doc
- Extract: color palette, typography, spacing, visual style

**Priority** (if multiple design sources exist):
1. **Use Figma Design Specifications** (highest fidelity) - ignore Theme if Figma exists
2. **Use Theme Specification** only if no Figma design
3. **No design constraints** if neither exists

If both Figma and Theme sections exist, use ONLY Figma and ignore Theme completely.

**Purpose**: Implementation must match these exact specifications for consistency.

### 1c: Load Codebase Context (If Exists)

**Check planning doc for "Codebase Context" section**:

If exists (exploration was done):
- Similar features to reference
- Reusable components/utils
- Architectural patterns to follow
- Key files to study

**Purpose**: Follow existing patterns for consistency.

### 1d: Phase Progress Detection

If planning doc exists, scan for phase markers (`### Phase X:`):

- **Count total phases** in the document
- **Detect last completed phase**: Find the highest phase where ALL tasks (checkbox `[x]`) are marked complete
- **Detect current phase**: Find the first phase with incomplete tasks (`[ ]` marks)
- **Show summary to user**:

  ```
  Found 3 phases.
  - Phase 1 (Database Setup): Complete [x]
  - Phase 2 (API Endpoints): In Progress [2/4 tasks done]
  - Phase 3 (Frontend): Not Started

  Resuming Phase 2...
  ```

If no phases detected (old format):

- Treat entire "Implementation Plan" section as single phase (backward compatible)

## Step 2: Build Task Queue

- Parse tasks (checkboxes `[ ]`, `[x]`) from **current phase only** (from phase detection in Step 1d):
  - Primary source: Tasks under `### Phase X:` with `[ ] [ACTION] ...` entries (incomplete only).
  - For `[MODIFIED]` files, parse sub-bullets representing distinct logic items with line ranges.
  - **Skip completed phases** entirely (do not re-execute)
- Build prioritized task queue (top-to-bottom unless dependencies block).
- Identify blocked tasks and note reasons.

Note: Do not include Follow-ups section unless explicitly in current phase.

## Step 3: Implement Iteratively (per task)

**Tools:**
- Read(file_path=...) to check existing files
- Write(file_path=..., content=...) for new files
- Edit(file_path=..., old_string=..., new_string=...) for modifications
- edit `docs/ai/planning/feature-{name}.md` to update checkboxes

**At Phase Boundary** (when starting new phase):

Refresh context to prevent quality degradation (see Notes for template format):
- Remind code standards from CODE_CONVENTIONS.md
- Remind design/theme specs if applicable
- Remind codebase patterns to follow

This reminder keeps standards visible during long implementations.

---

For each task in queue:

1. **Status update**: Brief note (1–3 sentences) on what will be done.
2. Plan minimal change set:
   - Identify files/regions to modify
   - Map changes to acceptance criteria from plan (reference if needed)
   - **If design/theme specs exist**: Verify implementation matches colors, spacing, typography
   - **Follow CODE_CONVENTIONS**: Apply naming patterns, file organization rules
3. Implement changes:
   - Write/edit code according to the planning doc entries (`[ACTION]` items)
   - **Apply design/theme specifications** (if exists): Use exact values from design specs (colors, spacing, typography, etc.)
   - **Follow codebase patterns** (if exists): Match existing implementation style
   - Keep changes minimal and incremental
   - Avoid speculative changes beyond implementation scope
4. Persist notes to planning doc:
   - File: `docs/ai/planning/feature-{name}.md`
   - Update the relevant `[ ]` entry to `[x]` when completed
   - For `MODIFIED` files with sub-bullets, mark each completed sub-bullet `[x]`
   - Include line ranges and concise summaries as per template
5. Update planning doc:
   - Mark completed tasks `[x]` with brief notes
   - Mark blocked tasks with reason

**Error handling:**
- File write/edit fails: Retry once, then notify user
- Design specs reference missing value: Use fallback or ask user
- Cannot parse task description: Skip task, flag for manual review
- Code generation uncertain: Ask user for clarification before implementing

## Step 4: Phase Completion Check

After completing all tasks in current phase:

1. **Mark phase complete** in planning doc (optional visual marker)
2. **Check remaining phases**:
   - If more incomplete phases exist:
     ```
     ✓ Phase 2 complete!
     Ready for Phase 3 (Frontend)?
     Run: /execute-plan
     ```
   - If all phases are complete:
     ```
     ✓ All phases complete!
     Running quality checks now...
     ```

## Step 5: Final Quality Checks (After All Phases Complete)

Only run after ALL phases are marked complete. If incomplete phases remain, skip to Step 6.

**Follow step by step in `.claude/skills/quality/code-check/SKILL.md` for automated validation:**
- **Linting**: Code style and best practices validation
- **Type Checking**: Type safety verification across modules
- **Build Verification**: Ensure code compiles and bundles successfully

**Error handling:**
- Quality checks fail: Fix issues and retry until checks pass
- Persistent failures: Document issues, proceed with caution
- See Notes section for manual commands if needed

## Step 6: Next Actions

After all phases complete:

- Suggest running `code-review` to verify against standards
- Suggest running `writing-test` if edge cases need coverage
- Suggest running `check-implementation` to validate alignment with planning entries

If phases remain:

- User runs `/execute-plan` again; Phase detection (Step 1d) will resume correctly

## Notes

### General Guidelines

- Keep code changes minimal and focused on planning tasks
- Document all changes by updating checkboxes in the planning doc
- Avoid implementing features not in the planning doc scope
- Modifies source code per planning scope; updates `docs/ai/planning/feature-{name}.md`. Does not modify unrelated files.
- Idempotent: safe to re-run; updates checkboxes deterministically.

### Context Refresh Template (Step 3 - Phase Boundary)

When starting a new phase, remind agent of key context:

```
Phase X: [Phase Name]

Code Standards Reminder:
  - [Key convention 1 from CODE_CONVENTIONS.md]
  - [Key convention 2 from CODE_CONVENTIONS.md]
  - [Key pattern from PROJECT_STRUCTURE.md]

Design/Theme Active: [Yes/No]
  - Colors: [primary colors if applicable]
  - Typography: [font families if applicable]
  - Spacing: [scale values if applicable]

Codebase Patterns:
  - Reference: [similar feature files]
  - Reuse: [components/utils to use]
```

This reminder keeps standards visible during long implementations and prevents quality degradation.

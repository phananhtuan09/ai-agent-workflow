## Goal

Modify a feature plan after partial/full implementation. Support reverting to a previous git state or applying new requirement changes with both code and documentation sync.

## Prerequisites

- Feature name (kebab-case, e.g., `user-authentication`)
- Planning doc exists: `docs/ai/planning/feature-{name}.md`
- Implementation doc exists: `docs/ai/implementation/feature-{name}.md`
- Git repo initialized (for tracking code state)

## Workflow Alignment

- Provide brief status updates (1–3 sentences) before/after important actions.
- Update both planning and implementation docs when making changes.
- Do NOT auto-commit; user reviews all changes before pushing.

## Step 1: Load Current State

Ask for feature name (must be kebab-case).

Load and summarize:

1. **Planning doc**: Current goal, scope, tasks overview
2. **Implementation doc**: Current phases, completion status, files affected

Display summary:

```
Feature: user-authentication
Plan: Create user login + registration endpoints

Implementation Progress:
- Phase 1 (Database): Complete [x]
  Files: src/db/schema.ts
- Phase 2 (API Endpoints): In Progress [3/4]
  Files: src/api/users.ts, src/api/auth.ts
- Phase 3 (Frontend): Not Started [ ]
  Files: src/components/Login.tsx

Total files touched: 4
```

## Step 2: Scope of Change (Q&A)

Ask user what's changing:

**1. Type of modification:**
   a) Modify goal/scope (entire plan changes)
   b) Modify specific phase(s) (tactical change)
   c) Revert to previous approach (manual revert)
   d) Other (describe)

**2a. If modifying goal/scope:**
   - What's the new goal/scope?
   - How does it impact existing tasks?

**2b. If modifying specific phase(s):**
   - Which phase(s)? (list by name)
   - What requirement/approach is changing?

**2c. If reverting approach:**
   - Which phase to revert?
   - Or revert all code changes after phase X?

## Step 3: Apply Changes

### Option A: Revert to Previous Approach (Manual)

If user selects revert:

1. **Identify affected files & changes**:
   - Parse implementation doc; list all files modified in affected phase(s)
   - Show file list that needs reverting:
     ```
     Files to revert (manual):
     - src/api/users.ts (lines 45–120)
     - src/db/schema.ts (lines 10–30)
     - tests/api.test.ts (delete entire file)
     ```

2. **Manual revert guidance**:
   - For MODIFIED files: show current state vs. target state (code snippets/line ranges)
   - For DELETED files: ask user to delete manually
   - Ask: "Ready to manually revert these files?"

3. **If user confirms**:
   - User manually reverts files (copy-paste old code back, undo in IDE, etc.)
   - Update implementation doc:
     - Mark affected phases/tasks `[ ]` (reset to pending)
     - Add "Modification History" entry:
       ```
       ## Modification History

       ### Revert [Date]: {Reason}
       - **Reverted phases**: Phase X, Y
       - **Reason**: [user provided]
       - **Files manually reverted**: [list]
       - **Affected tasks reset**: [ ] Task 1, [ ] Task 2, ...
       ```

4. **Result**: Docs updated; tasks reset; ready to re-implement with new approach

### Option B: Apply New Changes

If user selects new approach:

1. **Update planning doc**:
   - Modify goal/scope section if changed
   - Update affected task(s) with new approach
   - Add "Modification History" section:
     ```
     ## Modification History

     ### Change [Date]: {Title}
     - **Previous approach**: [original details]
     - **New approach**: [new details]
     - **Reason**: [user provided]
     - **Affected phases**: Phase X, Y
     ```

2. **Update implementation doc**:
   - For affected phases:
     - Modify pseudo-code to match new approach
     - Reset incomplete tasks `[ ]` (if approach changed significantly)
   - Keep completed tasks as-is (do not re-implement)
   - Update "Changes" section with new structure (files/logic outline)

3. **Show git impact**:
   - Highlight files that may need re-editing
   - Ask: "Ready to re-implement with new approach?" (yes/no)

## Step 4: Confirmation & Audit Trail

Before finalizing, show:

1. **Updated planning doc** snippet (modified sections)
2. **Updated implementation doc** snippet (phase changes, pseudo-code)
3. **Files affected** (files that will be changed)

Ask: **"Apply changes and update docs?"** (yes/no)

If **yes**:
- Save updated docs
- If revert: User manually reverts files (code state updated)
- If new approach: docs updated; ready for re-implementation

If **no**:
- Rollback changes to docs
- Discard any temporary changes

## Step 5: Next Actions

**After manual revert**:
- "Docs updated. Affected tasks reset to `[ ]`. Run `/execute-plan` to re-implement Phase X with new approach."

**After apply new approach**:
- If only pseudo-code/docs changed (no code revert needed): "Continue current phase with `/execute-plan`."
- If code changes needed (revert old approach + implement new): "Manually update code files first, then run `/execute-plan`."
- "When done, run `/code-review` to validate standards."

## Important Notes

- **Manual revert**: User manually reverts code files (no git reset); AI guides the process
- **Multi-feature safe**: Works when implementing multiple features simultaneously (selective revert possible)
- **Backward compatible**: Works with both phase-based and non-phase-based implementation docs
- **Audit trail**: "Modification History" section preserves decision rationale and affected files
- **Idempotent**: Safe to re-run; modification history accumulates
- **Safe defaults**: Asks confirmation before any changes; user always has final say

## Example Flow

```
User: I want to modify plan
Agent: Load state, show summary

User: Revert Phase 2 (API Endpoints) - use different auth approach
Agent: Identify affected files (src/api/users.ts, src/api/auth.ts)
        Show current state vs. target state (pseudo-code + old implementation)
        Ask: Ready to manually revert these files?

User: Yes, I'll manually revert
Agent: (User manually copies old code back or undoes changes in IDE)
       Update implementation doc:
       - Mark Phase 2 tasks [ ] (reset)
       - Add Modification History: Phase 2 reverted, reason: better auth strategy

Agent: Phase 2 reset. Ready to re-implement with new auth approach?
       Run: /execute-plan
```

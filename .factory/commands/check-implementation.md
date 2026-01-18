---
description: Validates implementation against planning doc.
argument-hint: <feature-name>
---

## User Request

$ARGUMENTS

Compare current implementation against planning doc to ensure all requirements are met and completed tasks have corresponding code.

## Workflow Alignment

- Provide brief status updates (1–3 sentences) before/after important actions.
- For medium/large validations, create todos (≤14 words, verb-led). Keep only one `in_progress` item.
- Update todos immediately after progress; mark completed upon finish.
- Provide a high-signal summary at completion highlighting key mismatches and next steps.

---

## Step 1: Load Planning Doc

Ask for feature name if not provided.

Read file: `docs/ai/planning/feature-{name}.md`

**Purpose:** Load planning doc to extract:
- Acceptance criteria (Given-When-Then scenarios)
- Implementation plan tasks (with `[ ]` or `[x]` status)
- Expected file changes mentioned in tasks

**Error handling:**
- Planning doc not found: Cannot proceed, notify user and exit
- Invalid format: Parse available content, warn about missing sections
- No completed tasks: Nothing to validate, notify user

---

## Step 2: Discover Implementation Files

**Strategy (in order):**
1. Extract file paths from planning doc task list
2. If no file paths found: Read implementation doc `docs/ai/implementation/feature-{name}.md`
3. If no implementation doc: Use git diff to find changed files
4. If no git changes: Ask user for file paths

**Commands:**
- Extract file mentions from planning doc
- Fallback: `git diff --name-only main`
- Last resort: Search for files matching `src/**/*.{js,ts,py}`

**Output:** List of files to validate against planning doc

**Error handling:**
- No files found: Cannot validate, notify user
- File paths invalid: Skip broken paths, continue with valid ones
- Git not available: Fall back to asking user

---

## Step 3: Validate Implementation vs Planning

Search codebase and compare implementation in discovered files against planning doc.

**For each completed task marked [x]:**
- Check if corresponding code exists in mentioned files
- Verify implementation matches task description

**For each acceptance criteria:**
- Verify code satisfies the Given-When-Then scenario
- Check expected behavior is implemented

**Identify:**
- Completed tasks [x] with missing/partial implementation
- Mismatches between planning description and actual code
- Acceptance criteria not met by code

**Fallback:** If automated exploration unavailable, manually:
1. Read each file from Step 2
2. For each completed task `[x]`, search for related code
3. Compare against acceptance criteria
4. Document mismatches

**Validation scope (no inference):**
- Verify code follows the acceptance criteria from planning doc
- Verify code matches the implementation plan task descriptions
- Check completed tasks `[x]` have corresponding code changes
- **Do NOT** invent or infer alternative logic beyond what docs specify

**Error handling:**
- Timeout: Retry with quick search, then fall back to manual
- No completed tasks: Report "Nothing to validate"
- Ambiguous results: Flag for manual review

---

## Step 4: Generate Validation Report

**Report structure:**

### Summary
- Total tasks in planning: `X`
- Completed tasks `[x]`: `Y`
- Validated successfully: `Z`
- Mismatches found: `N` (critical: `C`, minor: `M`)
- Missing implementations: `P`

### Completed Tasks Without Implementation

For each task marked `[x]` but code not found:

```
- [ ] Task: [Task description from planning]
  - Expected file: [file mentioned in task or "not specified"]
  - Status: Missing or Partial
  - Action: Implement missing code or update task to [ ]
```

### Mismatches (Code ≠ Planning)

For each discrepancy between planning and code:

```
- File: path/to/file.ext
  - Planning requirement: [what planning doc says]
  - Current implementation: [what code actually does]
  - Severity: Critical / Minor
  - Action: Update code to match planning OR revise planning doc
```

### Acceptance Criteria Status

For each acceptance criteria:

```
- [x] AC1: [Description] → ✅ Verified (code satisfies criteria)
- [ ] AC2: [Description] → ❌ Not implemented
- [x] AC3: [Description] → ⚠️ Partial (missing edge cases)
```

### Next Steps (Prioritized)

1. **Critical issues** (blocking):
   - [ ] Fix mismatch in [file]: [specific issue]
   - [ ] Implement missing task: [task name]

2. **Minor issues** (non-blocking):
   - [ ] Address partial implementation in [file]
   - [ ] Update planning doc to reflect changes

3. **Follow-up**:
   - [ ] Re-run `/check-implementation` after fixes
   - [ ] Run `/code-review` for standards compliance

---

**Note:** This validation checks implementation completeness, not code quality. Run `/code-review` separately for standards compliance.

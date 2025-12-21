---
name: code-review
description: Performs a local code review strictly for standards conformance.
---

You are helping me perform a local code review **before** I push changes. This review is restricted to standards conformance only.

## Workflow Alignment

- Provide brief status updates (1–3 sentences) before/after important actions.
- For medium/large reviews, create todos (≤14 words, verb-led). Keep only one `in_progress` item.
- Update todos immediately after progress; mark completed upon finish.
- Provide a high-signal summary at completion highlighting key findings and impact.

---

## Parallel Execution Strategy

**Steps 1-2 can run in parallel** to optimize performance:

**Execution plan:**
- Task 1: Step 1 - Determine scope & load context docs
- Task 2: Step 2 - Load standards & run automated checks

Both tasks are independent and can run concurrently.

**Implementation:**
- Use single message with multiple tool calls
- Use `run_in_background: true` for long-running automated checks
- Use `TaskOutput` to collect results when both complete

Expected speedup: 30-40% for projects with automated checks.

---

## Step 1: Determine Review Scope & Gather Context

**Scope detection (in order):**
1. If feature name provided: Review files from planning/implementation docs
2. If no feature name but git repo: Review changed files from git diff
3. If no git changes: Ask user for file paths or review entire src/

**Tools:**
- AskUserQuestion(questions=[...]) if feature name not provided
- Read(file_path="docs/ai/planning/feature-{name}.md") for file list
- Read(file_path="docs/ai/implementation/feature-{name}.md") for file list
- Bash(command="git diff --name-only HEAD") to find changed files (fallback)
- Glob(pattern="src/**/*.{js,ts,py,go,rs,java}") for full project scan (last resort)

**Error handling:**
- Feature docs not found: Fall back to git diff
- Git not available: Ask user for file paths
- No files to review: Notify user and exit

## Step 2: Load Standards & Run Quality Checks

**Tools:**
- Read(file_path="docs/ai/project/CODE_CONVENTIONS.md")
- Read(file_path="docs/ai/project/PROJECT_STRUCTURE.md")

**Standards review scope:**
- Review code strictly for violations against CODE_CONVENTIONS and PROJECT_STRUCTURE only
- **Do NOT** provide design opinions, performance guesses, or alternative architectures
- **Do NOT** infer requirements beyond what standards explicitly state

**Quality checks (automated):**

Use `quality-code-check` skill for automated validation:
- **Linting**: Code style and best practices (ESLint, Ruff, golangci-lint, Clippy)
- **Type checking**: Type safety validation (tsc, MyPy, Pyright)
- **Build verification**: Compilation and packaging checks

See Notes section for manual commands by language if needed.

Use results to focus manual review; report only clear violations per standards.

**Error handling:**
- Standards docs not found: Notify user, cannot proceed without standards
- Skill not available: Fall back to manual commands (see Notes)
- Quality checks fail: Report errors as violations, fix and retry up to 3 times

## Step 3: Scan for Standards Violations

**Tool:** Task(
  subagent_type='Explore',
  thoroughness='medium',
  prompt="Scan files identified in Step 1 for CODE_CONVENTIONS and PROJECT_STRUCTURE violations.
    Focus on:
    - Naming conventions (variables, functions, classes, constants)
    - Import order and grouping
    - Folder structure and module boundaries
    - Test placement and naming
    - Cross-file consistency (naming patterns, module boundaries)
    Return violations with file:line, rule violated, and brief description."
)

**Fallback:** If Explore agent unavailable, manually Read each file and check against standards.

**Review scope:** Files from Step 1 only. Report ONLY standards violations, not design opinions.

**Output format (Standards Conformance Report):**

```
- path/to/file.ext — [Rule]: short description of the violated rule
```

Only include clear violations. Group similar violations by file when helpful.

**Error handling:**
- Agent timeout: Retry once with thoroughness='quick', then fall back to manual review
- No violations found: Report clean bill of health
- Too many violations (>50): Group by file and summarize patterns

## Step 4: Summarize Findings (rules-focused)

**Report structure:**

1. **Summary**: Violation counts by severity (Blocking / Important / Nice-to-have)
2. **Detailed Findings**: For each violation:
   - File path and line number
   - Rule violated (from CODE_CONVENTIONS or PROJECT_STRUCTURE)
   - Brief description and impact
   - Recommended fix
3. **Next Steps**: Prioritized action items

**Severity criteria:**
- **Blocking**: Build/test failure, security risk, architectural breach
- **Important**: Degrades maintainability, not immediately breaking
- **Nice-to-have**: Style/consistency improvements, low impact

(See Notes for detailed report format example)

## Step 5: Final Checklist (rules-focused)

Confirm whether each item is complete (yes/no/needs follow-up):

- Naming and formatting adhere to CODE_CONVENTIONS
- Structure and boundaries adhere to PROJECT_STRUCTURE

---

## Notes

### Automated Checks Complete List (Step 2)

**JavaScript/TypeScript:**
- Linting: `npx eslint . --max-warnings=0` or `pnpm eslint .`
- Type checking: `npx tsc --noEmit`
- Alternative linters: `npx biome check .`

**Python:**
- Linting: `ruff check .` or `flake8 .`
- Type checking: `mypy .` or `pyright`
- Formatting: `ruff format --check .` or `black --check .`

**Go:**
- Linting: `golangci-lint run`
- Vet: `go vet ./...`
- Formatting: `gofmt -l .`

**Rust:**
- Linting: `cargo clippy -- -D warnings`
- Formatting: `cargo fmt --check`

**Java:**
- Gradle: `./gradlew check`
- Maven: `mvn -q -DskipTests=false -Dspotbugs.failOnError=true verify`

### Detailed Report Format Example (Step 5)

```markdown
## Code Review Summary

### Standards Compliance Overview
- ✅ Blocking issues: 0
- ⚠️  Important follow-ups: 3
- 💡 Nice-to-have improvements: 5

### Detailed Findings

#### 1. src/services/user-service.ts
- **Issue**: Function name uses snake_case instead of camelCase
- **Rule violated**: CODE_CONVENTIONS > Naming > Functions must use camelCase
- **Impact**: Important (consistency)
- **Recommendation**: Rename `get_user_by_id` → `getUserById`

#### 2. src/utils/helpers.ts
- **Issue**: Missing index.ts export
- **Rule violated**: PROJECT_STRUCTURE > Module boundaries > All utils must export via index
- **Impact**: Important (architecture)
- **Recommendation**: Add export to `src/utils/index.ts`

#### 3. tests/unit/user.spec.ts
- **Issue**: Test file placed in wrong directory
- **Rule violated**: CODE_CONVENTIONS > Tests > Colocate with source files
- **Impact**: Nice-to-have (organization)
- **Recommendation**: Move to `src/services/user-service.spec.ts`

### Recommended Next Steps
- [ ] Fix 3 important violations (estimated 15 minutes)
- [ ] Address 5 nice-to-have improvements (estimated 30 minutes)
- [ ] Re-run `/code-review` after fixes
- [ ] Run automated checks: `npm run lint && npm run type-check`
```

---

Let me know when you're ready to begin the review.

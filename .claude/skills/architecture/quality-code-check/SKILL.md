---
name: quality-code-check
description: Code quality validation principles - linting, type checking, and build verification across projects
allowed-tools: [bash, read]

# Category & Loading
category: architecture
subcategory: quality-assurance

# Auto-trigger logic
auto-trigger:
  enabled: false
  keywords: []
  exclude-keywords: []
  contexts: []

# Manual trigger
manual-load:
  enabled: true
  commands:
    - /skill:quality
    - /skill:quality-code-check
  mentions:
    - quality check
    - code validation
    - lint check

# Dependencies & Priority
dependencies: []
conflicts-with: []
priority: high

# When to load this skill
trigger-description: |
  Load when performing code quality validation after feature implementation.
  Focus on detecting issues early through automated checks.
  Use after all implementation phases are complete to validate the entire feature.
---

# Quality Code Check

## Purpose

Establish consistent code quality standards through automated validation tools, ensuring code reliability, maintainability, and consistency across the entire feature implementation.

---

## Core Principle

Code quality validation is a safety gate that catches errors early, prevents tech debt accumulation, and ensures code meets project standards. Quality checks should be systematic, automated where possible, and run as a final validation step after implementation is complete.

---

## Quality Check Categories

### 1. Linting - Code Style & Best Practices

**Principle:** Enforce consistent code style and catch common mistakes through static analysis.

**What linting detects:**
- Code style violations (indentation, spacing, naming conventions)
- Unused variables and imports
- Missing error handling patterns
- Potentially dangerous patterns (implicit type coercion, missing cases)
- Code complexity issues

**Language-specific tools:**
- **JavaScript/TypeScript**: ESLint
- **Python**: Ruff, Flake8
- **Go**: golangci-lint
- **Rust**: Clippy
- **Java**: Spotbugs, Checkstyle

**Why it matters:**
- Consistent style improves code readability
- Early detection of unused code reduces maintenance burden
- Catches common programming mistakes automatically
- Saves time in code review

**Approach:**
- Run linting on all modified files
- Auto-fix warnings when possible (formatting, import organization)
- Fix remaining errors manually
- Aim for zero warnings on changed files

---

### 2. Type Checking - Type Safety

**Principle:** Verify type correctness to prevent type-related runtime errors and improve code clarity.

**What type checking validates:**
- Type consistency (no mismatched types)
- Function parameter and return types
- Null/undefined safety
- Generic type parameters
- Type inference accuracy

**Language-specific tools:**
- **TypeScript**: `tsc --noEmit` (non-emitting type check)
- **Python**: MyPy, Pyright
- **Go**: Compiler (built-in)
- **Rust**: Compiler (built-in)
- **Java**: Compiler (built-in)

**Why it matters:**
- Prevents entire categories of runtime errors
- Improves IDE auto-completion and code clarity
- Documents expected types in code
- Catches integration errors between modules

**Approach:**
- Enable strict type checking when available
- Run on all modified code
- Fix type errors before proceeding
- Use type annotations for function signatures (when applicable)

---

### 3. Build Verification - Compilability & Packaging

**Principle:** Ensure code compiles/bundles successfully and all dependencies resolve correctly.

**What build checking validates:**
- Code compiles without errors
- All imports and dependencies resolve
- Asset bundling completes without errors
- Runtime entry points exist and are correct

**Language-specific tools:**
- **JavaScript/TypeScript**: Webpack, Vite, Rollup, or `npm run build`
- **Python**: `python -m py_compile` or test imports
- **Go**: `go build ./...`
- **Rust**: `cargo build`
- **Java**: Maven (`mvn compile`), Gradle (`gradle build`)

**Why it matters:**
- Confirms code is actually runnable
- Catches import path errors
- Validates build configuration
- Ensures no circular dependencies

**Approach:**
- Run full build after all changes are complete
- Use production build configuration
- All build steps must succeed without errors
- Zero build warnings on changed files

---

## Tool Invocation

### Project Detection

**Use Glob to detect project type:**

```markdown
- Glob(pattern="**/package.json") → JavaScript/TypeScript
- Glob(pattern="**/pyproject.toml") or Glob(pattern="**/requirements.txt") → Python
- Glob(pattern="**/go.mod") → Go
- Glob(pattern="**/Cargo.toml") → Rust
- Glob(pattern="**/pom.xml") or Glob(pattern="**/build.gradle") → Java
```

### Language-Specific Commands

#### JavaScript/TypeScript

**Linting:**
```bash
Bash(command="npx eslint . --max-warnings=0")
# Or with pnpm
Bash(command="pnpm eslint . --max-warnings=0")
# Auto-fix
Bash(command="npx eslint . --fix")
```

**Type Checking:**
```bash
Bash(command="npx tsc --noEmit")
```

**Build:**
```bash
Bash(command="npm run build")
# Or
Bash(command="pnpm build")
```

#### Python

**Linting:**
```bash
Bash(command="ruff check .")
# Auto-fix
Bash(command="ruff check . --fix")
# Alternative
Bash(command="flake8 .")
```

**Type Checking:**
```bash
Bash(command="mypy .")
# Or
Bash(command="pyright")
```

**Build/Import Check:**
```bash
Bash(command="python -m py_compile src/**/*.py")
```

#### Go

**Linting:**
```bash
Bash(command="golangci-lint run")
# Or
Bash(command="go vet ./...")
```

**Type Checking:** (built into compiler)
```bash
Bash(command="go build ./...")
```

**Build:**
```bash
Bash(command="go build ./...")
```

#### Rust

**Linting:**
```bash
Bash(command="cargo clippy -- -D warnings")
```

**Type Checking:** (built into compiler)
```bash
Bash(command="cargo check")
```

**Build:**
```bash
Bash(command="cargo build")
```

#### Java

**Linting + Build (Gradle):**
```bash
Bash(command="./gradlew check")
```

**Linting + Build (Maven):**
```bash
Bash(command="mvn verify")
```

### Error Handling

**Tool not found:**
- Check if tool installed: Try command, catch error
- If not found: Skip that check, notify user
- Continue with remaining checks

**Check fails:**
- Parse error output
- Report specific violations
- Suggest fixes based on error type
- Retry after fixes (max 3 attempts)

---

## Validation Workflow

### Before Running Quality Checks

**Prerequisites:**
- All implementation phases are complete
- All task checkboxes in planning doc are marked `[x]`
- No incomplete tasks remain

**Signal:**
```
✓ All phases complete!
Running quality checks now...
```

### Quality Check Sequence

1. **Detect available tools** from project configuration
   - Use Glob to find config files (see Tool Invocation above)
   - Identify which tools are available

2. **Run linting** (scoped to changed files when possible)
   - Execute Bash commands from Tool Invocation section
   - Fix auto-fixable issues first (--fix flag)
   - Manually fix remaining violations
   - Target: Zero warnings on changed files

3. **Run type checks** (non-emitting where applicable)
   - Execute Bash commands from Tool Invocation section
   - Fix all type errors
   - Validate type consistency across modules
   - Target: No type errors

4. **Run build** (full build, production configuration)
   - Execute Bash commands from Tool Invocation section
   - Ensure all code compiles
   - Validate all imports resolve
   - Confirm output artifacts are generated
   - Target: Build succeeds without errors

### Error Recovery

**If quality checks fail:**

1. **Analyze errors** - Identify root causes from Bash output
2. **Fix issues** - Make minimal changes to resolve
3. **Re-run checks** - Execute same Bash commands again
4. **Repeat** - Continue until all checks pass (up to 3 attempts)

**If unable to fix after 3 attempts:**
- Document the issue in planning doc
- Mark the task as blocked with reason
- Escalate for further investigation

---

## Common Mistakes

1. **Ignoring warnings**: Warnings often indicate real problems or future issues → Fix them or understand why they're acceptable
2. **Only checking one file**: Changes in one file can break type checking across others → Check all modified files
3. **Skipping the build step**: Code might lint and type-check but still fail to compile → Always run the full build
4. **Accepting auto-fixes blindly**: Auto-fixes might hide real issues → Review each auto-fix
5. **Running checks too early**: Incomplete code fails checks → Run only after all implementation is done
6. **Loose quality standards**: Allowing technical debt accumulates over time → Maintain consistent standards across all features

---

## Validation Checklist

Before considering quality checks complete:

- [ ] All implementation phases are marked complete in planning doc
- [ ] All task checkboxes are `[x]` (no incomplete tasks)
- [ ] Linting tool runs successfully on changed files
- [ ] All lint warnings are fixed or documented
- [ ] Type checking tool runs successfully
- [ ] No type errors remain
- [ ] Build completes successfully (full build, production config)
- [ ] No build errors present
- [ ] Zero warnings on changed files (across all checks)
- [ ] All issues are fixed (no open blockers)

---

## Key Takeaway

Code quality validation is the final gate before code review. By enforcing consistent checks after all implementation is complete, you ensure the entire feature meets project standards. Quality checks catch errors early, prevent tech debt, and give confidence that the feature is ready for review and deployment.


---
name: quality-code-check
description: |
  Code quality validation through linting, type checking, and build verification.
  Multi-language support for automated quality gates.

  Use when validating code quality:
  - User explicitly requests quality checks ("/skill:quality" or "run quality checks")
  - After implementation to validate code meets standards
  - Before creating pull requests or commits
  - When debugging build/type/lint issues

  Provides language-specific tool commands and validation workflows for:
  - JavaScript/TypeScript (ESLint, tsc, build tools)
  - Python (Ruff, MyPy, Pyright)
  - Go (golangci-lint, go build)
  - Rust (Clippy, cargo check/build)
  - Java (Gradle, Maven)

  Manual-only trigger - runs when explicitly requested, not automatically.
  Focuses on detecting issues early through systematic automated checks.
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
- Minimize warnings to meet project standards (some projects allow certain warnings)

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
- Use production build configuration when available
- All build steps must succeed without errors
- Minimize build warnings to project-acceptable levels

---

## Tool Invocation

**Note:** Commands shown are common examples. Adjust to your project's:
- Package manager (npm/yarn/pnpm/bun)
- Configuration files (eslintrc, tsconfig, pyproject.toml)
- Build scripts (check package.json scripts)
- Tool versions and flags

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
# Check package.json scripts first for "lint" command
Bash(command="npm run lint")
# Or use ESLint directly (adjust max-warnings to project standard)
Bash(command="npx eslint . --max-warnings=0")
# Alternative package managers
Bash(command="pnpm lint")  # or "pnpm eslint ."
Bash(command="yarn lint")
# Auto-fix (review changes after)
Bash(command="npx eslint . --fix")
```

**Type Checking:**
```bash
# Check package.json scripts first for "typecheck" or "tsc" command
Bash(command="npm run typecheck")
# Or run TypeScript directly
Bash(command="npx tsc --noEmit")
```

**Build:**
```bash
# Check package.json scripts for "build" command
Bash(command="npm run build")
# Alternative package managers
Bash(command="pnpm build")
Bash(command="yarn build")
```

#### Python

**Linting:**
```bash
# Modern tool (Ruff - fast, recommended)
Bash(command="ruff check .")
# Auto-fix (review changes after)
Bash(command="ruff check . --fix")
# Alternative tools
Bash(command="flake8 .")
Bash(command="pylint .")
```

**Type Checking:**
```bash
# MyPy (common)
Bash(command="mypy .")
# Or Pyright (faster, VS Code default)
Bash(command="pyright")
# Or with specific paths
Bash(command="mypy src/")
```

**Build/Import Check:**
```bash
# Compile check (adjust path to your source directory)
Bash(command="python -m py_compile src/**/*.py")
# Or try importing main module
Bash(command="python -c 'import your_package'")
```

#### Go

**Linting:**
```bash
# Comprehensive linter (recommended)
Bash(command="golangci-lint run")
# Or built-in vet
Bash(command="go vet ./...")
# Specific package
Bash(command="golangci-lint run ./pkg/...")
```

**Type Checking:** (built into compiler)
```bash
Bash(command="go build ./...")
```

**Build:**
```bash
# Build all packages
Bash(command="go build ./...")
# Or specific main package
Bash(command="go build ./cmd/myapp")
```

#### Rust

**Linting:**
```bash
# Clippy with warnings as errors (adjust -D to -W for warnings only)
Bash(command="cargo clippy -- -D warnings")
# Or allow warnings
Bash(command="cargo clippy")
```

**Type Checking:** (built into compiler)
```bash
Bash(command="cargo check")
```

**Build:**
```bash
# Development build
Bash(command="cargo build")
# Production build (optimized)
Bash(command="cargo build --release")
```

#### Java

**Linting + Build (Gradle):**
```bash
# Run all checks
Bash(command="./gradlew check")
# Or just build
Bash(command="./gradlew build")
```

**Linting + Build (Maven):**
```bash
# Run all checks
Bash(command="mvn verify")
# Or just compile
Bash(command="mvn compile")
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
- Retry after fixes (continue until resolved or escalate if blocked)

---

## Validation Workflow

### Before Running Quality Checks

**When to run:**
- After implementation is stable enough to validate
- Before creating pull requests or commits
- When user explicitly requests quality checks
- Incrementally during development (optional)

**Ideal conditions:**
- Implementation phases complete (or stable enough)
- Code compiles and runs without critical errors
- Ready for validation against standards

**Signal:**
```
Running quality checks...
```

### Quality Check Sequence

1. **Detect available tools** from project configuration
   - Use Glob to find config files (see Tool Invocation above)
   - Identify which tools are available

2. **Run linting** (scoped to changed files when possible)
   - Execute Bash commands from Tool Invocation section
   - Fix auto-fixable issues first (--fix flag)
   - Manually fix remaining violations
   - Target: Meet project's warning standards (minimize to acceptable level)

3. **Run type checks** (non-emitting where applicable)
   - Execute Bash commands from Tool Invocation section
   - Fix all type errors
   - Validate type consistency across modules
   - Target: No type errors (unless intentionally using any/unknown)

4. **Run build** (full build, production configuration when available)
   - Execute Bash commands from Tool Invocation section
   - Ensure all code compiles
   - Validate all imports resolve
   - Confirm output artifacts are generated
   - Target: Build succeeds without critical errors

### Error Recovery

**If quality checks fail:**

1. **Analyze errors** - Identify root causes from Bash output
2. **Fix issues** - Make minimal changes to resolve
3. **Re-run checks** - Execute same Bash commands again
4. **Repeat** - Continue until checks pass or issue is understood

**If unable to fix or issue is complex:**
- Document the issue and root cause analysis
- Mark as blocked if preventing progress
- Escalate for further investigation or ask user for guidance

---

## Common Mistakes

1. **Ignoring warnings**: Warnings often indicate real problems or future issues → Fix them or understand why they're acceptable for your project
2. **Only checking one file**: Changes in one file can break type checking across others → Check all modified files and their dependencies
3. **Skipping the build step**: Code might lint and type-check but still fail to compile → Always verify the full build
4. **Accepting auto-fixes blindly**: Auto-fixes might hide real issues or change behavior → Review each auto-fix before committing
5. **Not checking package.json scripts**: Projects often define custom lint/build commands → Check scripts first before running tools directly
6. **Inconsistent standards**: Allowing different quality levels across features accumulates tech debt → Maintain consistent standards appropriate for your project

---

## Validation Checklist

Before considering quality checks complete:

- [ ] Code is stable enough to validate (implementation complete or near-complete)
- [ ] Linting tool runs successfully on changed files
- [ ] Lint warnings minimized to project-acceptable levels
- [ ] Type checking tool runs successfully
- [ ] No critical type errors remain (intentional any/unknown documented if needed)
- [ ] Build completes successfully (full build when available)
- [ ] No critical build errors present
- [ ] Warnings are at project-acceptable levels (not necessarily zero)
- [ ] All blocking issues are fixed or escalated with clear documentation

---

## Key Takeaway

**Systematic quality validation catches issues early and maintains consistency.**

Quality checks are flexible gates that validate code against project standards:
- Run when code is stable enough (not necessarily 100% complete)
- Adjust tool commands and flags to your project's needs
- Target project-appropriate warning levels (not always zero)
- Use as validation before PRs, commits, or deployment

Commands shown are examples - check your project's scripts and configuration first. Quality standards should be consistent within your project but may vary between projects.

Systematic checks catch errors early, prevent tech debt accumulation, and build confidence in code readiness.


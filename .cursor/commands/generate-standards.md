## Goal
Generate or update `docs/ai/project/CODE_CONVENTIONS.md` and `PROJECT_STRUCTURE.md` from the current codebase with brief Q&A refinement.

## Step 1: Clarify Scope (3–6 questions max)
Quick classification and targeted questions:
- Languages/frameworks detected: confirm correct? (a/b/other)
- Import/style tools in use: (a) ESLint/Prettier  (b) Other formatter  (c) None
- Test placement preference: (a) Colocated `*.spec.*`  (b) `__tests__/` directory  (c) Other
- Error handling strategy: (a) Exceptions/try-catch  (b) Result types  (c) Other
- Module organization: (a) By feature  (b) By layer  (c) Mixed
- Any performance/security constraints to encode? (yes/no, brief)

Keep questions short and single-purpose. Stop once sufficient info gathered.

## Step 2: Auto-Discovery
Analyze repository to infer:
- Dominant naming patterns:
  - Variables/functions: camelCase/PascalCase/snake_case
  - Classes/types: PascalCase
  - Constants: CONSTANT_CASE/UPPER_SNAKE_CASE
- Import patterns:
  - Import order (node/builtin, third-party, internal)
  - Grouping style
- Typical folder structure:
  - Organization under `src/` (by feature/by layer/mixed)
  - Common directories (components/, utils/, services/, etc.)
- Test file locations/naming if present:
  - Colocated patterns
  - Test directory structure
- Common patterns observed:
  - Repository/Service patterns
  - Factory patterns
  - Strategy patterns
  - Other architectural patterns

## Step 3: Draft Standards
Generate two documents (with template preload):

### CODE_CONVENTIONS.md
- Template preload (in order, if present):
  1) `docs/ai/project/template-convention/common.md` — always preload first.
  2) `docs/ai/project/template-convention/javascript.md` — preload if the repository primarily uses JavaScript/TypeScript.
  3) `docs/ai/project/template-convention/react.md` — preload if the repository uses React (detect via dependencies like `react`, file patterns like `.jsx/.tsx`, or imports from `react`).
  
  These templates take precedence and should appear at the top of the generated document, followed by auto-discovered rules.
- Naming conventions (variables, functions, classes, constants)
- Import order and grouping
- Formatting tools (ESLint/Prettier/etc.) if detected
- Function size and complexity guidelines
- Error handling strategy (exceptions/result types)
- Test rules (unit first, integration when needed)
- Comments policy (only for complex logic)
- Async/await patterns if applicable

### PROJECT_STRUCTURE.md
- Folder layout summary:
  - `src/`: source code organization
  - `docs/ai/**`: documentation structure
- Module boundaries and dependency direction
- Design patterns actually observed in codebase
- Test placement and naming conventions
- Config/secrets handling summary

## Step 4: Persist
- Overwrite or create:
  - `docs/ai/project/CODE_CONVENTIONS.md`
  - `docs/ai/project/PROJECT_STRUCTURE.md`
- Add header note: "This document is auto-generated from codebase analysis + brief Q&A. Edit manually as needed."
- If template files exist, ensure the generated `CODE_CONVENTIONS.md` starts with their merged content in the preload order above, then append auto-discovered rules.

## Step 5: Next Actions
- Suggest running `code-review` to validate new standards are being followed
- Inform user they can manually edit these files anytime

## Notes
- Focus on patterns actually present in codebase, not ideal patterns
- Keep generated docs concise and actionable
- User can refine standards manually after generation


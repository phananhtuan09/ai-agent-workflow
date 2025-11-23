---
name: generate-standards
description: Generates/updates code convention and project structure docs from the codebase.
---

## Goal

Generate or update `docs/ai/project/CODE_CONVENTIONS.md` and `PROJECT_STRUCTURE.md` from the current codebase with brief Q&A refinement.

## Step 1: Detect Project Context

Detect project languages/frameworks/libraries from repository metadata:

- Analyze `package.json`, `pyproject.toml`, lockfiles, config files
- Identify primary languages (JavaScript/TypeScript, Python, etc.)
- Identify frameworks (React, Vue, Angular, etc.)
- Identify libraries and tooling (ESLint, Prettier, testing frameworks, etc.)
- Note any build tools or bundlers in use

**Output**: The detected project context will be written to `CODE_CONVENTIONS.md` as the foundation for code conventions.

## Step 2: Clarify Scope (3–6 questions max)

Quick classification and targeted questions:

- Languages/frameworks detected: confirm correct? (a/b/other)
- Import/style tools in use: (a) ESLint/Prettier (b) Other formatter (c) None
- Test placement preference: (a) Colocated `*.spec.*` (b) `__tests__/` directory (c) Other
- Error handling strategy: (a) Exceptions/try-catch (b) Result types (c) Other
- Module organization: (a) By feature (b) By layer (c) Mixed
- Any performance/security constraints to encode? (yes/no, brief)

Keep questions short and single-purpose. Stop once sufficient info gathered.

## Step 3: Auto-Discovery

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

## Step 4: Draft Standards

Generate two documents (with template preload):

### CODE_CONVENTIONS.md

- Template preload (flexible matching based on detected project context):
  1. Read all files in `docs/ai/project/template-convention/` directory
  2. For each template file, determine if it matches the detected project context:
     - Match by language (e.g., `javascript.md`, `typescript.md`, `python.md`)
     - Match by framework (e.g., `react.md`, `vue.md`, `angular.md`)
     - Match by common patterns (e.g., `common.md` — always include if present)
  3. Load and merge all matching templates in a logical order:
     - `common.md` first (if present)
     - Language-specific templates (e.g., `javascript.md`, `typescript.md`)
     - Framework-specific templates (e.g., `react.md`, `vue.md`)
     - Other relevant templates based on detected tooling/patterns
  4. These templates take precedence and should appear at the top of the generated document, followed by auto-discovered rules from codebase analysis.

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

## Step 5: Persist (Update-in-place, Non-destructive)

- Target files:
  - `docs/ai/project/CODE_CONVENTIONS.md`
  - `docs/ai/project/PROJECT_STRUCTURE.md`
- Add header note: "This document is auto-generated from codebase analysis + brief Q&A. Edit manually as needed."
- Do NOT blindly overwrite entire files. Update only the managed blocks using markers:

### Managed Block Markers

Use these exact markers to wrap generated content:

```
<!-- GENERATED: CODE_CONVENTIONS:START -->
... generated content ...
<!-- GENERATED: CODE_CONVENTIONS:END -->
```

```
<!-- GENERATED: PROJECT_STRUCTURE:START -->
... generated content ...
<!-- GENERATED: PROJECT_STRUCTURE:END -->
```

### Update Rules

1. If the target file exists and contains the corresponding markers, replace only the content between START/END with the newly generated content.
2. If the file exists but does not contain markers, append a new managed block to the end of the file (preserve all existing manual content).
3. If the file does not exist, create it with the header note and a single managed block.
4. Never modify content outside the managed blocks.

### Generated Content Order (for CODE_CONVENTIONS)

1. **Project Context Section**: Write the detected project context from Step 1 (languages, frameworks, libraries, tooling)
2. **Template Rules Section**: Merge all matching templates from `docs/ai/project/template-convention/` directory:
   - Read all files in the directory
   - Filter templates that match the detected project context (by language, framework, or common patterns)
   - Merge in logical order: common → language → framework → tooling-specific
3. **Auto-Discovered Rules Section**: Append auto-discovered rules from codebase analysis (Step 3)
4. **Project-Specific Rules Section**: Include any project-specific conventions from Q&A (Step 2)

## Step 6: Next Actions

- Suggest running `code-review` to validate new standards are being followed
- Inform user they can manually edit these files anytime

## Notes

- Focus on patterns actually present in codebase, not ideal patterns
- Keep generated docs concise and actionable
- User can refine standards manually after generation

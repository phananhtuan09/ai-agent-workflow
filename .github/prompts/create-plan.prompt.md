---
name: 'create-plan'
description: 'Generates a feature planning doc and initializes the implementation doc.'
agent: 'agent'
tools: ['edit', 'search', 'fetch', 'todos']
---

## Goal

Generate a planning doc at `docs/ai/planning/feature-{name}.md` using the template, with minimal, actionable content aligned to the 4-phase workflow. Also initialize the implementation doc at `docs/ai/implementation/feature-{name}.md` based on the implementation template.

## Workflow Alignment

- Provide brief status updates (1–3 sentences) before/after important actions.
- For medium/large tasks, create todos (≤14 words, verb-led). Keep only one `in_progress` item.
- Update todos immediately after progress; mark completed upon finish.

## Step 1: Clarify Scope (Focused Q&A Guidelines)

Purpose: the agent MUST generate a short, numbered Q&A for the user to clarify scope; keep it relevant, avoid off-topic, and do not build a static question bank.

Principles:

- Quickly classify context: a) Micro-UI, b) Page/Flow, c) Service/API/Data, d) Cross-cutting.
- Ask only what is missing to produce Goal, Tasks, Risks, and DoD. Keep to 3–7 questions.
- Do not re-ask what the user already stated; if ambiguous, confirm briefly (yes/no or single choice).
- Keep each question short and single-purpose; avoid multi-part questions.
- Answers may be a/b/c or free text; the agent is not required to present fixed option lists.

Output format for Q&A:

- Number questions sequentially starting at 1 (e.g., "1.", "2.").
- Under each question, provide 2–4 suggested options labeled with lowercase letters + ")" (e.g., "a)", "b)").
- Keep options short (≤7 words) and add an "other" when useful.
- Example:
  1. UI library?
     a) TailwindCSS b) Bootstrap c) SCSS d) Other

Scope checklist to cover (ask only missing items, based on context):

1. Problem & Users: the core problem and target user groups.
2. In-scope vs Out-of-scope: what is included and excluded (e.g., MVP, no i18n, no payments).
3. Acceptance Criteria (GWT): 2–3 key Given–When–Then scenarios.
4. Constraints & Dependencies: technical constraints, libraries, real API vs mock, deadlines, external deps.
5. Risks & Assumptions: known risks and key assumptions.
6. Tasks Overview: 3–7 high-level work items.
7. Definition of Done: completion criteria (build/test/docs/review).

Adaptive behavior:

- Always reduce questions to what is necessary; once Goal/Tasks/Risks/DoD can be written, stop asking.
- Prioritize clarifying scope and acceptance criteria before implementation details.
- If the user already specified items (framework, API/Mock, deadlines, etc.), confirm briefly only.

Then collect inputs (after Q&A):

- Feature name (kebab-case, e.g., `user-authentication`)
- Short goal and scope
- High-level tasks overview (3–7 items)
- Definition of Done (build/test/review/docs)

## Step 2: Load Templates

**Before creating docs, read the following files:**

- `docs/ai/planning/feature-template.md` - Template structure to follow
- `docs/ai/implementation/feature-template.md` - Template structure to follow for the implementation doc

This template defines the required structure and format. Use it as the baseline for creating the planning doc.

## Step 3: Draft the Plan (auto-generate)

Using the Q&A results and templates, immediately generate the plan without asking for confirmation.

Auto-name feature:

- Derive `feature-{name}` from user prompt + Q&A (kebab-case, concise, specific).
- Example: "Login Page (HTML/CSS)" → `feature-login-page`.
- If a file with the same name already exists, append a numeric suffix: `feature-{name}-2`, `feature-{name}-3`, ...

### 3a: Generate Planning Doc

Produce a Markdown doc following `docs/ai/planning/feature-template.md`:

- Match sections from template
- Fill in content from Q&A inputs
- Ensure all required sections are present

### 3b: Generate Implementation Doc with Phases

Before creating implementation doc, read `docs/ai/implementation/feature-template.md` to understand phase structure.

**Estimate phase scope**:
- Count total tasks from planning doc
- If tasks ≤ 5: use single phase named "Core Implementation"
- If tasks 6–12: suggest 2–3 phases (group by feature area or dependency order)
- If tasks > 12: suggest 3–5 phases; prioritize logical grouping

**For each phase, generate**:
- Phase name (descriptive, e.g., "Database Schema Setup", "API Endpoints", "UI Components")
- Tasks list: `[ ] [ACTION] path/to/file — Summary`
- Pseudo-code outline (show logic structure, not real code):
  ```
  Pseudo-code:
  - [Step 1]: what will be done
  - [Step 2]: validation or check
  - [Step 3]: data storage/return
  ```

**Pseudo-code guidelines**:
- Keep to 3–5 lines per task
- Show inputs, key logic, outputs
- Use natural language, not actual syntax
- Example for "Create user endpoint":
  ```
  Pseudo-code:
  - Parse username + password from request
  - Validate password strength
  - Hash password with bcrypt
  - Store user in database
  - Return success + user ID
  ```

Create the following files automatically:

- `docs/ai/planning/feature-{name}.md` - Use structure from `feature-template.md`
- `docs/ai/implementation/feature-{name}.md` - Use phase structure with pseudo-code per task

Notify the user when done with summary: "Created plan with X phases: Phase 1 (name), Phase 2 (name), ..."

## Step 4: Next Actions

Suggest running `execute-plan` to begin task execution. Implementation work will be driven from `docs/ai/implementation/feature-{name}.md` as the task source.
Note: Test documentation will be created separately using the `writing-test` command.

## Notes

- This command creates the planning doc and initializes the implementation doc; it does not modify unrelated existing files.
- Idempotent: safe to re-run; auto-appends numeric suffix if files exist.
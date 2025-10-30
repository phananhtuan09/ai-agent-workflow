
## Goal
Generate a planning doc at `docs/ai/planning/feature-{name}.md` using the template, with minimal, actionable content aligned to the 4-phase workflow.

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
     a) TailwindCSS  b) Bootstrap  c) SCSS  d) Other

Scope checklist to cover (ask only missing items, based on context):
1) Problem & Users: the core problem and target user groups.
2) In-scope vs Out-of-scope: what is included and excluded (e.g., MVP, no i18n, no payments).
3) Acceptance Criteria (GWT): 2–3 key Given–When–Then scenarios.
4) Constraints & Dependencies: technical constraints, libraries, real API vs mock, deadlines, external deps.
5) Risks & Assumptions: known risks and key assumptions.
6) Tasks Overview: 3–7 high-level work items.
7) Definition of Done: completion criteria (build/test/docs/review).

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
- `docs/ai/testing/feature-template.md` - Template structure for test plan skeleton

These templates define the required structure and format. Use them as the baseline for creating feature docs.

## Step 3: Draft the Plan (auto-generate)
Using the Q&A results and templates, immediately generate the plan without asking for confirmation.

Auto-name feature:
- Derive `feature-{name}` from user prompt + Q&A (kebab-case, concise, specific).
- Example: "Login Page (HTML/CSS)" → `feature-login-page`.
- If a file with the same name already exists, append a numeric suffix: `feature-{name}-2`, `feature-{name}-3`, ...

Create the following files automatically and populate initial content:
- `docs/ai/planning/feature-{name}.md` - Use structure from `feature-template.md`
- `docs/ai/testing/feature-{name}.md` - Use structure from testing `feature-template.md` (skeleton)

Do NOT create the implementation file at this step.
Notify the user when done.

Produce a Markdown doc following the template structure:
- Match sections from `docs/ai/planning/feature-template.md`
- Fill in content from Q&A inputs
- Ensure all required sections are present

## Step 4: Next Actions
Suggest running `execute-plan` to begin task execution.

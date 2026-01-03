---
name: create-plan
description: Generates a feature planning doc with implementation details.
---

## Goal

Generate a single planning doc at `docs/ai/planning/feature-{name}.md` using the template, with goal, acceptance criteria, risks, and detailed implementation phases with pseudo-code.

## Workflow Alignment

- Provide brief status updates (1–3 sentences) before/after important actions.
- For medium/large tasks, create todos (≤14 words, verb-led). Keep only one `in_progress` item.
- Update todos immediately after progress; mark completed upon finish.

## Step 1: Analyze User Prompt

**Parse user request to identify:**
- **Requirement doc reference:** Check if user provided path to `docs/ai/requirements/req-{name}.md`
- **Feature type:** UI/Page, API/Service, Data/Database, Full-stack, Other
- **Explicit requirements:** Framework, libraries, constraints mentioned
- **Design context:**
  - Has Figma URL/mention? → Flag for Step 4
  - Has design description/screenshot? → Skip Steps 4-5
  - No design source? → Flag for Step 5 (theme selection)
- **Scope hints:** MVP mentions, deadlines, specific exclusions

**If Requirement Doc Provided:**
- Read the requirement doc: `Read(file_path="docs/ai/requirements/req-{name}.md")`
- Extract and map to planning sections:

| Requirement Section | Maps to Planning Section |
|---------------------|--------------------------|
| 1. Problem Statement | 3. Goal (problem context) |
| 2. User Stories | 3. Goal (user context) |
| 3. Business Rules | 6. Implementation Plan (logic constraints) |
| 4. Functional Requirements | 6. Implementation Plan (tasks) |
| 5. Non-Functional Requirements | 4. Risks & Assumptions |
| 6. Edge Cases & Constraints | 4. Risks & Assumptions |
| 8. Out of Scope | 7. Follow-ups |
| 9. Acceptance Criteria | 3. Acceptance Criteria |
| 11. Glossary | Keep as reference during implementation |

- Skip most of Step 2 (Q&A) - requirements already documented
- Proceed to Step 3 (Explore) with context from requirement doc
- **Include Section 0: Requirements Reference** in planning output with link to requirement doc

**Design Source Priority** (if multiple sources detected):
1. **Figma URL** (highest priority) → Extract from Figma MCP (Step 4)
2. **Screenshot/Image** → Use as visual reference, skip Figma extraction
3. **Design description** → Use as text reference, skip Figma extraction
4. **Multiple sources** → Ask user which to prioritize using AskUserQuestion:
   - Example: "You provided both Figma URL and screenshots. Which should I use as primary design source?"
   - Options: "Figma design (extract full specs)", "Screenshots (visual reference only)", "Combine both"

**Output:** Internal classification to make Step 2 (Q&A) adaptive.

**Purpose:** Understand what user provided → Ask only what's missing in Step 2.

## Step 2: Clarify Scope (Adaptive Q&A)

**Purpose:** Generate short Q&A (3-7 questions) to clarify scope. Ask only what's missing for Goal/Tasks/Risks/DoD.

**Tool:** AskUserQuestion(questions=[...])

**Q&A Strategy** (based on Step 1 classification):
- **If feature type clear:** Skip feature type question
- **If design source detected:** Skip design-related questions
- **If tech stack mentioned:** Skip framework questions
- Prioritize scope/acceptance criteria over implementation details

**Core Scope Questions** (ask only missing items):
1. **Problem & Users:** What problem does this solve? Who uses it?
2. **In-scope vs Out-of-scope:** What's included/excluded? (MVP features, no i18n, etc.)
3. **Acceptance Criteria:** 2-3 Given-When-Then scenarios
4. **Constraints:** Tech stack, libraries, APIs (real/mock), deadlines
5. **Risks & Assumptions:** Known blockers or assumptions
6. **Tasks:** 3-7 high-level work items
7. **Definition of Done:** Build/test/review/docs criteria

**Q&A Format:** Use AskUserQuestion with 2-4 options per question.
- Example: "1. UI library? a) TailwindCSS b) Bootstrap c) Other"

**Collect after Q&A:**
- Feature name (kebab-case) - Ask if not derivable from prompt
- Goal, scope, tasks, DoD

---

## Parallel Execution Strategy

**Steps 3-5 can run in parallel** to optimize performance *(Steps 4-5 defined below)*:

**Scenario A: No design source**
- Run in parallel: Step 3 (Explore) + Step 5 (Theme Selection)
- Use single message with multiple tool calls

**Scenario B: Figma design detected**
- Run in parallel: Step 3 (Explore) + Step 4 (Figma Extraction)
- Use single message with multiple tool calls

**Scenario C: Design already provided (screenshot/description)**
- Run only: Step 3 (Explore) - no parallel execution needed

**Implementation:**
- Use `run_in_background: true` for long-running Explore agent
- Launch design-related Skill concurrently
- Use `TaskOutput` to collect results when both complete

**Example parallel invocation:**

    Launching codebase exploration and design extraction in parallel...
    - Task 1: Explore agent (medium thoroughness)
    - Task 2: Figma extraction skill

---

## Step 3: Research Codebase (Explore Agent)

**Purpose:** Understand existing patterns to ensure plan follows project standards and reuses existing features.

**Tool:** Task(
  subagent_type='Explore',
  thoroughness='medium',
  prompt="Explore codebase for patterns related to [feature type]. Find similar features, reusable components/utils, architectural patterns. Return summarized findings only."
)

**What to explore** (based on feature type from Step 1):
- **UI/Page:** Component patterns, styling approach, state management
- **API/Service:** Endpoint patterns, middleware, validation, error handling
- **Data:** Schema patterns, migration structure, model definitions
- **Full-stack:** Both frontend and backend patterns

**Exploration output** (concise summary, focus on actionable findings):
- Similar features: [2-3 implementations]
- Reusable components/utils: [key files]
- Patterns to follow: [architecture patterns]
- Files to reference: [key file paths]

**Skip exploration if:**
- New project (no similar patterns exist)
- User says "fresh start"

## Step 4: Extract Figma Design (Optional)

**Trigger:** User mentions "figma", "design file", "mockup", or provides Figma URL (detected in Step 1).

**Use `figma-design-extraction` skill to:**
- Validate Figma MCP connection
- Extract design tokens (colors, typography, spacing, shadows, border radius)
- Extract component specs (states, variants, dimensions, hierarchies)
- Extract responsive breakpoints (mobile/tablet/desktop)
- Document extraction in planning doc format

**Expected output:** "Design Specifications" section in planning doc with:
- Reference (file name, frame, link, timestamp)
- Design Tokens (complete palette, typography scale, spacing scale)
- Component Breakdown (all components with detailed specs)
- Responsive Specs (breakpoints and layout changes)

**If extraction fails:**
- Figma MCP not connected: Ask user to configure MCP or provide design description
- Extraction fails: Ask user for alternative design source (screenshot, description)
- Continue to Step 5 for theme selection if needed

**Skip this step if:** No Figma URL/mention detected in Step 1.

## Step 5: Design System & Theme (Optional)

**Trigger:** Step 4 skipped (no Figma) AND user has NOT provided detailed design description/screenshot.

**Use design skills to guide design decisions:**
- `design-fundamentals`: Core principles (spacing, typography, color, hierarchy)
- `theme-factory`: Interactive theme selection based on brand personality
- `design-responsive`: Mobile-first responsive patterns and breakpoints

**Expected workflow:**
1. Ask about brand personality/preferences if needed
2. Choose aesthetic direction (minimal, bold, elegant, etc.)
3. Propose complete design system (colors, fonts, spacing)
4. Consider responsive strategy (mobile-first for target devices)
5. Document theme/design specs in planning doc

**Expected output:** "Design System" or "Theme Specification" section in planning doc.

**Skip this step if:** User provided design description/screenshot in Step 1.

## Step 6: Load Template

**Tool:** Read(file_path="docs/ai/planning/feature-template.md")

- Validate template contains required sections: Goal, Implementation Plan, DoD
- If template not found: Use fallback minimal structure (Goal → Tasks → DoD)

This template defines the required structure and format. Use it as the baseline for creating the planning doc.

## Step 7: Draft the Plan (Auto-generate)

**Using inputs from:**
- Step 2: Scope, acceptance criteria, tasks, DoD
- Step 3: Codebase patterns (if done)
- Step 4: Figma design specs (if done)
- Step 5: Theme specification (if done)
- Step 6: Template structure

**Generate immediately without asking for confirmation.**

Auto-name feature:

- Derive `feature-{name}` from user prompt + Q&A (kebab-case, concise, specific).
- Example: "Login Page (HTML/CSS)" → `feature-login-page`.

**If file already exists:**
1. **Backup existing file** to archive folder:
   ```
   docs/ai/planning/archive/feature-{name}_{timestamp}.md
   ```
   - Timestamp format: `YYYYMMDD-HHMMSS`
   - Example: `archive/feature-login-page_20250115-143022.md`

2. **Overwrite** the main file: `docs/ai/planning/feature-{name}.md`

3. **Notify user:**
   > "Previous version backed up to `archive/feature-{name}_{timestamp}.md`"

**Create archive folder if not exists:**
```bash
mkdir -p docs/ai/planning/archive
```

### Generate Single Planning Doc

Produce a Markdown doc following `docs/ai/planning/feature-template.md`.

**Include these sections** (in suggested order):

0. **Requirements Reference** (if requirement doc was provided):
   - Link to requirement doc: `[req-{name}.md](../requirements/req-{name}.md)`

1. **Codebase Context** (if exploration was done):
   - Similar features found
   - Reusable components/utils to use
   - Architectural patterns to follow
   - Key files to reference

2. **Design Specifications** (if Figma extraction was done):
   - Complete Figma design specs from Step 4
   - Design tokens, component breakdown, responsive specs

   **OR**

   **Theme Specification** (if theme selection was done):
   - Theme name and source file
   - Color palette (primary, neutral, semantic)
   - Typography (fonts, scale)
   - Spacing scale and visual style

3. **Goal & Acceptance Criteria**: Brief goal + Given-When-Then scenarios

4. **Risks & Assumptions**: Known risks and key assumptions

5. **Definition of Done**: Build/test/review/docs checklist

6. **Implementation Plan**:
   - Summary: Brief description of solution approach (1-3 sentences)
   - Phases: Detailed tasks with pseudo-code

7. **Follow-ups**: TODOs or deferred work

**Estimate phase scope**:
- Count total tasks from Q&A
- If tasks ≤ 5: use single phase named "Core Implementation"
- If tasks 6–12: suggest 2–3 phases (group by feature area or dependency order)
- If tasks > 12: suggest 3–5 phases; prioritize logical grouping

**For each phase:**
- Phase name: Descriptive (e.g., "API Endpoints", "UI Components")
- Tasks list: `[ ] [ACTION] path/to/file — Summary`
- Pseudo-code: 3-5 lines, natural language, show inputs → logic → outputs
  ```
  Example:
  - Parse username + password from request
  - Validate password strength → Hash with bcrypt
  - Store user in database → Return success + user ID
  ```

Create the file automatically:

- `docs/ai/planning/feature-{name}.md` - Use complete structure from `feature-template.md`

**Notify user:** "Created plan with X phases: [Phase 1], [Phase 2], ..."

## Step 8: Next Actions

Suggest: `/execute-plan` to begin implementation.

Implementation will be driven from `docs/ai/planning/feature-{name}.md`.

Note: Test documentation will be created separately using the `writing-test` command.

## Notes

- This command creates a single planning doc with both overview and implementation details.
- Previous versions are preserved in `archive/` folder for reference.

### Template Relationship

**Requirement Doc** (`req-template.md`) focuses on **WHAT**:
- Problem, Users, Business Rules, Functional Requirements

**Planning Doc** (`feature-template.md`) focuses on **HOW**:
- Codebase Context, Design, Implementation Phases, Pseudo-code

When requirement doc exists, planning doc should:
1. Link to requirement doc (Section 0)
2. Not duplicate requirement content - reference it instead
3. Focus on technical implementation details

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

## Step 1: Exploration Phase (Codebase Context)

**Purpose**: Understand existing codebase patterns before planning to ensure accurate implementation details.

**Use Sub-Agent for Exploration**:
- Launch `Explore` sub-agent with thoroughness level "medium"
- Task prompt: "Explore codebase for patterns related to [feature type]. Find similar features, components, utilities, and architectural patterns. Return summarized findings only."

**What to explore** (based on feature type):
- **UI/Page features**: Existing page structure, component patterns, styling approach, state management
- **API features**: Existing endpoint patterns, middleware, validation, error handling
- **Data features**: Database schema patterns, migration structure, model definitions
- **Full-stack features**: Both frontend and backend patterns

**Exploration output** (keep concise):
```
Codebase Findings:
- Similar features: [list 2-3 similar implementations]
- Reusable components/utils: [list key files to reuse]
- Patterns to follow: [architecture patterns found]
- Files to reference: [key file paths]
```

**Context management**:
- Sub-agent returns ONLY summarized findings (not full file contents)
- Max 200-300 words summary
- Main agent uses summary for realistic planning

**Note**: Skip exploration if:
- Feature is completely new (no similar patterns exist)
- User explicitly says "new project/fresh start"

## Step 2: Figma Design Extraction (If Applicable)

**Detect Figma context**: If user mentions "figma", "design file", "mockup", or provides Figma URL:

### 2.1 Validate Figma MCP Connection
```
Check:
- [ ] Figma MCP server available
- [ ] Can access file/frame specified
- [ ] Authentication working
```

If Figma MCP not available or connection fails:
- Ask user: "Figma MCP not connected. Provide design specs manually or continue without design?"

### 2.2 Extract Complete Design Data

**Fetch from Figma MCP**:
1. **File structure**: Get all frames/components for this feature
2. **Design tokens**:
   - Colors (with hex codes)
   - Typography (font families, sizes, weights, line heights)
   - Spacing values (margins, paddings)
   - Border radius values
   - Shadow definitions
3. **Component specs**:
   - Component hierarchy and relationships
   - States (default, hover, active, disabled, loading, error)
   - Variants (primary, secondary, sizes)
   - Dimensions (width, height, min/max)
4. **Assets**: Icons, images (note URLs or download if needed)
5. **Responsive breakpoints**: If multiple frames for mobile/tablet/desktop

**Document extraction** (add to planning doc later):
```markdown
## Design Specifications (Figma)

### Reference
- File: [Figma file name]
- Frame: [Frame name/ID]
- Link: [Figma URL]
- Extracted: [date/time]

### Design Tokens
**Colors**:
- Primary: #[hex] ([usage])
- Secondary: #[hex] ([usage])
- [... all colors used]

**Typography**:
- Heading 1: [font-family], [size]px, [weight], [line-height]
- Body: [font-family], [size]px, [weight], [line-height]
- [... all text styles]

**Spacing Scale**: [4, 8, 16, 24, 32, 48, 64]px
**Border Radius**: [4, 8, 12]px
**Shadows**: [definitions]

### Component Breakdown
**[Component Name]** (Figma component ID: [id])
- States: default, hover, active, disabled
- Variants: primary, secondary
- Dimensions: [width]x[height]
- Specs:
  - Padding: [values]
  - Colors: [specific colors for this component]
  - Typography: [text styles used]
  - [... other specs]

[Repeat for all components]

### Responsive Specs
- Mobile (320-640px): [layout changes]
- Tablet (641-1024px): [layout changes]
- Desktop (1025px+): [layout changes]
```

**Note**: This complete extraction means `/execute-plan` does NOT need to fetch Figma again.

### 2.3 Theme Selection (If No Design Source)

**Trigger condition**: User creating UI feature AND no design source provided or unclear

**Design sources include:**
- Figma file/URL
- Screenshot/image of design attached
- Detailed design description in prompt
- Reference to existing design

**Load `theme-factory` skill ONLY if:**
- No design source provided at all
- Design source unclear or insufficient

**Skill handles:**
- Asking about brand personality
- Presenting theme options from `.claude/themes/`
- Theme selection or custom generation
- Documenting theme spec in planning doc

**Result**: Planning doc includes "Theme Specification" section (if theme selected)

## Step 3: Clarify Scope (Focused Q&A Guidelines)

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

## Step 4: Load Template

**Before creating the plan doc, read the following file:**

- `docs/ai/planning/feature-template.md` - Template structure to follow

This template defines the required structure and format. Use it as the baseline for creating the planning doc.

## Step 5: Draft the Plan (auto-generate)

Using the exploration findings (Step 1), Figma design specs (Step 2 if applicable), Q&A results (Step 3), and template (Step 4), immediately generate the plan without asking for confirmation.

Auto-name feature:

- Derive `feature-{name}` from user prompt + Q&A (kebab-case, concise, specific).
- Example: "Login Page (HTML/CSS)" → `feature-login-page`.
- If a file with the same name already exists, append a numeric suffix: `feature-{name}-2`, `feature-{name}-3`, ...

### Generate Single Planning Doc

Produce a Markdown doc following `docs/ai/planning/feature-template.md` with all sections:

1. **Codebase Context** (if exploration was done):
   - Similar features found
   - Reusable components/utils to use
   - Architectural patterns to follow
   - Key files to reference

2. **Design Specifications** (if Figma extraction was done):
   - Complete Figma design specs from Step 2.2
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

Create the file automatically:

- `docs/ai/planning/feature-{name}.md` - Use complete structure from `feature-template.md`

Notify the user when done with summary: "Created plan with X phases: Phase 1 (name), Phase 2 (name), ..."

## Step 6: Next Actions

Suggest running `execute-plan` to begin task execution. Implementation work will be driven from `docs/ai/planning/feature-{name}.md` as the task source.

Note: Test documentation will be created separately using the `writing-test` command.

## Notes

- This command creates a single planning doc with both overview and implementation details.
- Idempotent: safe to re-run; auto-appends numeric suffix if files exist.

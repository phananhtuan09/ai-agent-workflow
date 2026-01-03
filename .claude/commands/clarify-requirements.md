---
name: clarify-requirements
description: Clarify and document requirements through iterative Q&A sessions. (project)
---

## Goal

Facilitate requirement gathering through structured Q&A sessions. Output a comprehensive requirement document at `docs/ai/requirements/req-{name}.md` that can be used as input for `/create-plan`.

## When to Use

- Complex features requiring multiple clarification rounds
- Business logic is unclear or needs detailed specification
- Design decisions need to be documented before planning
- Stakeholder input needs to be captured and organized

## Workflow Alignment

- Provide brief status updates (1–3 sentences) before/after important actions.
- For medium/large tasks, create todos (≤14 words, verb-led). Keep only one `in_progress` item.
- Update todos immediately after progress; mark completed upon finish.

---

## Step 1: Analyze Initial Request

**Parse user request to identify:**
- **Feature scope**: What is the user trying to build?
- **Feature type**: Backend-only, Frontend-only, Full-stack, Data/API, etc.
- **Clarity level**: What's clear vs. ambiguous?
- **Missing information**: What needs clarification?
- **Complexity indicators**: Simple (skip this skill) vs. complex (proceed)
- **Domain complexity**: Detect specialized terminology (finance, medical, legal, etc.)
- **Existing requirement**: Check if user references existing `req-{name}.md` file

**If feature is simple** (can be fully specified in 1-2 Q&A rounds):
- Suggest: "This feature seems straightforward. Consider using `/create-plan` directly."
- Proceed only if user confirms they want detailed requirement doc.

**If existing requirement doc detected:**
- Read the existing file: `Read(file_path="docs/ai/requirements/req-{name}.md")`
- Ask user: "Found existing requirement doc. What would you like to do?"
  - Options:
    - "Update existing" → Load content, identify gaps, continue Q&A from where it left off
    - "Start fresh" → Backup existing to archive, create new
    - "Review only" → Display current content, ask for specific sections to update

**Output:**
- List of areas needing clarification
- Recommended rounds to skip (based on feature type)
- Flag if Glossary section is needed (domain-specific terms detected)
- Mode: "new" | "update" | "review"

---

## Step 2: Structured Q&A Session

**Purpose:** Gather requirements through focused questions. This step may repeat multiple times.

**Tool:** AskUserQuestion(questions=[...])

### Smart Round Selection

Before each round, evaluate relevance based on:
- **Feature type** from Step 1
- **Previous answers** collected

**Skip Round Logic:**
| Feature Type | Skip Rounds |
|--------------|-------------|
| Backend-only / API | Round 2 (User Flows) if no UI |
| Data processing | Round 4 (Edge Cases) → ask minimal |
| Simple CRUD | Round 3 (Business Rules) if straightforward |
| UI-only | Round 5 (Performance/Security) → ask minimal |

**Before skipping, confirm with user:**
> "Based on your answers, Round {N} ({topic}) seems less relevant for this feature. Should we skip it or cover briefly?"

Options: "Skip entirely", "Cover briefly (1-2 questions)", "Cover in full"

---

### Question Categories (ask in priority order, 2-4 questions per round):

### Round 1: Problem & Users (Required)
1. **Problem Statement**: What specific problem does this solve?
2. **Target Users**: Who are the primary users? What are their goals?
3. **Success Metrics**: How will we know this feature is successful?

### Round 2: Functional Requirements (Required)
4. **Core Functionality**: What are the must-have features?
5. **User Flows**: What are the main user journeys? *(Skip if backend-only)*
6. **Inputs/Outputs**: What data goes in? What comes out?

### Round 3: Business Rules & Logic (Conditional)
7. **Business Rules**: What rules govern the behavior?
8. **Calculations/Logic**: Any specific formulas or logic?
9. **Validations**: What validations are needed?

### Round 4: Edge Cases & Constraints (Conditional)
10. **Edge Cases**: What happens in unusual situations?
11. **Error Handling**: How should errors be handled?
12. **Constraints**: Technical, business, or time limitations?

### Round 5: Non-Functional & Scope (Conditional)
13. **Performance**: Any performance requirements? *(Skip if UI-only)*
14. **Security**: Authentication, authorization, data protection?
15. **Out of Scope**: What is explicitly NOT included?

---

**Q&A Format:**
- Use AskUserQuestion with 2-4 options per question
- Include "I need to think about this" option for complex questions
- Allow multi-select where appropriate

**After each round:**
- Summarize what was learned
- Identify remaining gaps
- Evaluate if next round is relevant
- Ask if user wants to continue clarifying or finalize

---

## Step 3: Document Clarifications

**After each Q&A round, update internal notes:**

```
## Clarifications Log
| # | Question | Answer | Category |
|---|----------|--------|----------|
| 1 | {question} | {answer} | {FR/BR/NFR/Edge} |
```

**Categorize answers:**
- **FR**: Functional Requirement
- **BR**: Business Rule
- **NFR**: Non-Functional Requirement
- **Edge**: Edge Case
- **OOS**: Out of Scope
- **TERM**: Terminology/Glossary item

**Track domain terms:**
- If user uses specialized terms, add to Glossary section
- Ask for definitions if terms are ambiguous

---

## Step 4: Generate Requirement Document

**Trigger:** User indicates they're ready to finalize OR all key areas are covered.

### Load Template

**Tool:** Read(file_path="docs/ai/requirements/req-template.md")

**Instructions:**
1. Read the template file to understand the required structure and format
2. Use the template as the baseline - follow its section order and formatting exactly
3. Fill in sections with data collected from Q&A rounds
4. For optional sections with no data collected → remove the section entirely (don't leave placeholders)
5. Keep required sections even if minimal data (Problem Statement, Functional Requirements, Acceptance Criteria)

**Template Section Mapping:**
| Template Section | Data Source |
|------------------|-------------|
| 1. Problem Statement | Round 1: Problem & Users |
| 2. User Stories | Round 1: Target Users + Round 2: Core Functionality |
| 3. Business Rules | Round 3: Business Rules |
| 4. Functional Requirements | Round 2: Core Functionality, Inputs/Outputs |
| 5. Non-Functional Requirements | Round 5: Performance, Security |
| 6. Edge Cases & Constraints | Round 4: Edge Cases, Constraints |
| 7. Clarifications Log | All rounds: Q&A history |
| 8. Out of Scope | Round 5: Out of Scope |
| 9. Acceptance Criteria | Derived from Functional Requirements |
| 10. References | User-provided links |
| 11. Glossary | Domain terms collected (TERM category) |

### File Naming & Versioning Strategy

**Auto-name requirement:**
- Derive `req-{name}` from feature description (kebab-case, concise)
- Example: "User Authentication Flow" → `req-user-authentication`

**If file already exists:**
1. **Backup existing file** to archive folder:
   ```
   docs/ai/requirements/archive/req-{name}_{timestamp}.md
   ```
   - Timestamp format: `YYYYMMDD-HHMMSS`
   - Example: `archive/req-user-authentication_20250115-143022.md`

2. **Overwrite** the main file: `docs/ai/requirements/req-{name}.md`

3. **Notify user:**
   > "Previous version backed up to `archive/req-{name}_{timestamp}.md`"

**Create archive folder if not exists:**
```bash
mkdir -p docs/ai/requirements/archive
```

---

### Generate document sections:

1. **Problem Statement**: From Round 1 answers
2. **User Stories**: Derived from users + functionality
3. **Business Rules**: From Round 3
4. **Functional Requirements**: From Rounds 2-3, prioritized
5. **Non-Functional Requirements**: From Round 5
6. **Edge Cases & Constraints**: From Round 4
7. **Clarifications Log**: Complete Q&A history
8. **Out of Scope**: Explicit exclusions
9. **Acceptance Criteria**: Derived from requirements (Given/When/Then)
10. **References**: Links to related docs
11. **Glossary**: Domain-specific terms *(only if terms were collected)*

**Write file:**
- Path: `docs/ai/requirements/req-{name}.md`

---

## Step 5: Review & Confirm

**Present summary to user:**

```
## Requirement Document Created

**File:** docs/ai/requirements/req-{name}.md
{If backup created: **Previous version:** archive/req-{name}_{timestamp}.md}

### Summary
- {X} Functional Requirements
- {Y} Business Rules
- {Z} Edge Cases documented
- {N} Clarification rounds completed
- {M} Rounds skipped (not relevant)
{If glossary: - {T} Terms defined in Glossary}

### Key Requirements
1. [FR-01] {main requirement}
2. [FR-02] {second requirement}
3. [BR-01] {key business rule}

### Next Steps
1. Review the requirement document
2. Run `/create-plan` to generate implementation plan
```

**Offer options:**
- "Review document" → Read and display full content
- "Continue clarifying" → Return to Step 2
- "Proceed to planning" → Suggest `/create-plan docs/ai/requirements/req-{name}.md`

---

## Step 6: Next Actions

Suggest next steps based on user choice:

- **If more clarification needed:** Continue Q&A session
- **If ready to plan:** `/create-plan` with requirement doc reference
- **If needs stakeholder review:** Share the requirement doc for review

---

## Tips for Effective Requirement Gathering

1. **Start broad, then narrow**: Begin with problem/users, then dive into specifics
2. **Confirm understanding**: Summarize after each round
3. **Document everything**: Even "obvious" decisions should be recorded
4. **Identify assumptions**: Make implicit assumptions explicit
5. **Define boundaries**: Clear out-of-scope prevents scope creep
6. **Skip smartly**: Not every feature needs all rounds - adapt to context
7. **Capture terminology**: Domain terms prevent miscommunication later

---

## Notes

- This command is designed for iterative use - user can clear chat and resume with the requirement doc
- The output requirement doc serves as single source of truth for `/create-plan`
- Requirement doc can be updated later using `/modify-plan` workflow
- Previous versions are preserved in `archive/` folder for reference

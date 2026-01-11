---
name: clarify-requirements
description: Clarify and document requirements through iterative Q&A sessions.
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

## Step 1: Analyze Initial Request

**Parse user request to identify:**
- **Feature scope**: What is the user trying to build?
- **Feature type**: Backend-only, Frontend-only, Full-stack, Data/API, etc.
- **Clarity level**: What's clear vs. ambiguous?
- **Missing information**: What needs clarification?
- **Complexity indicators**: Simple (skip this skill) vs. complex (proceed)

**If feature is simple** (can be fully specified in 1-2 Q&A rounds):
- Suggest: "This feature seems straightforward. Consider using `/create-plan` directly."

## Step 2: Structured Q&A Session

**Purpose:** Gather requirements through focused questions. This step may repeat multiple times.

### Question Categories (ask in priority order, 2-4 questions per round):

### Round 1: Problem & Users (Required)
1. What specific problem does this solve?
2. Who are the primary users?
3. How will we know this feature is successful?

### Round 2: Functional Requirements (Required)
4. What are the must-have features?
5. What are the main user journeys?
6. What data goes in? What comes out?

### Round 3: Business Rules & Logic (Conditional)
7. What rules govern the behavior?
8. Any specific formulas or logic?
9. What validations are needed?

### Round 4: Edge Cases & Constraints (Conditional)
10. What happens in unusual situations?
11. How should errors be handled?
12. Technical, business, or time limitations?

### Round 5: Non-Functional & Scope (Conditional)
13. Any performance requirements?
14. Authentication, authorization, data protection?
15. What is explicitly NOT included?

## Step 3: Document Clarifications

After each Q&A round, update internal notes with categorized answers:
- **FR**: Functional Requirement
- **BR**: Business Rule
- **NFR**: Non-Functional Requirement
- **Edge**: Edge Case
- **OOS**: Out of Scope
- **TERM**: Terminology/Glossary item

## Step 4: Generate Requirement Document

**Trigger:** User indicates they're ready to finalize OR all key areas are covered.

Load template: `docs/ai/requirements/req-template.md`

Generate document sections:
1. Problem Statement
2. User Stories
3. Business Rules
4. Functional Requirements
5. Non-Functional Requirements
6. Edge Cases & Constraints
7. Clarifications Log
8. Out of Scope
9. Acceptance Criteria
10. References
11. Glossary (if terms were collected)

## Step 5: Review & Confirm

Present summary to user and offer options:
- "Review document" → Read and display full content
- "Continue clarifying" → Return to Step 2
- "Proceed to planning" → Suggest `/create-plan`

## Step 6: Next Actions

Suggest next steps based on user choice:
- **If more clarification needed:** Continue Q&A session
- **If ready to plan:** `/create-plan` with requirement doc reference
- **If needs stakeholder review:** Share the requirement doc for review

## Notes

- This command is designed for iterative use
- The output requirement doc serves as single source of truth for `/create-plan`
- Requirement doc can be updated later using `/modify-plan` workflow

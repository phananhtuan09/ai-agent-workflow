# Plan: {Feature Name}

Note: All content in this document must be written in English.

---
epic_plan: null
requirement: null
status: draft
# status values: draft | reviewed | executed
---

## 0. Related Documents (if applicable)

| Type | Document |
|------|----------|
| Requirement | [req-{name}.md](../requirements/req-{name}.md) |
| Epic | [epic-{name}.md](epic-{name}.md) |

---

## 1. Codebase Context

### Similar Features
- {path/to/similar-feature-1} - {brief description of what to learn from it}

### Reusable Components/Utils
- {path/to/component.tsx} - {what it does, how to use}
- {path/to/util.ts} - {what it does, when to use}

### Architectural Patterns
- {Pattern name}: {description}

### Key Files to Reference
- {path/to/file} - {why it's relevant}

---

## 2. Design Specifications (if applicable)

- **Figma specs**: [figma-{name}.md](../requirements/figma-{name}.md)
- **Frame**: {frame name}
- **Status**: complete / partial

> Run `/extract-figma` if the file does not exist yet.

---

## 3. Goal & Acceptance Criteria

> Include this section only when no requirement doc is linked. If a req doc exists, skip this section — the req doc is the source of truth.

### Goal
- [Brief description: what problem this solves and why it matters]

### Acceptance Criteria (Given/When/Then)
- Given [context or initial state]
- When [action or event occurs]
- Then [expected result or outcome]

---

## 4. Risks & Assumptions

### Risks
- [Potential issues, blockers, or unknowns]

### Assumptions
- [What we assume is true for this plan to work]

---

## 5. Implementation Plan

### Summary
[Brief description of the solution approach in 1-3 sentences]

### Phase 1: [Phase Name]

- [ ] [ACTION] path/to/file — Summary of change
  ```
  Function: functionName(param1: type, param2: type) OR Endpoint: METHOD /path

  Input validation:
    - param1: [validation rules, constraints, format]
    - param2: [validation rules, constraints, format]

  Logic flow:
    1. [Step with specific values/thresholds]
    2. [Branching: if X then Y, else Z]
    3. [External calls: DB queries, API calls with params]

  Return: { field1: type, field2: type } | Error(code, message)

  Edge cases:
    - [Scenario] → [Handler/Response]

  Dependencies: [Other functions/modules/APIs called]
  ```

### Phase 2: [Phase Name]

- [ ] [ACTION] path/to/file — Summary of change
  ```
  Function: ...
  Input validation: ...
  Logic flow: ...
  Return: ...
  Edge cases: ...
  Dependencies: ...
  ```

Notes:
- ACTION must be one of: ADDED | MODIFIED | DELETED | RENAMED
- For MODIFIED files, include line ranges for each distinct logic change
- Each phase groups related tasks and executes sequentially
- Use only one phase for small features (≤ 5 tasks)

---

## 6. Follow-ups
- [ ] [TODO item or deferred work]
- [ ] [Future improvements]

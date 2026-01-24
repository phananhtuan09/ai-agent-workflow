# Epic: {Epic Name}

Note: All content in this document must be written in English.

---
beads_epic: {bd-xxx or null}
requirement: {docs/ai/requirements/req-xxx.md or null}
---

## 1. Overview

### Problem Statement
[Brief description of the problem this epic solves]

### Goals
- [Primary goal]
- [Secondary goal]

### Success Metrics
- [How we measure success]

---

## 2. Architecture

> **Note**: High-level architecture overview. Detailed implementation goes in task-level plans.

### System Diagram
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Component  │────▶│  Component  │────▶│  Component  │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Key Components
| Component | Responsibility | Location |
|-----------|----------------|----------|
| {Name} | {What it does} | {path/to/} |

### Technology Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| {Area} | {Technology} | {Why this choice} |

---

## 3. Task Breakdown

> **Note**: If using Beads, this table syncs with Beads via `bd` commands. If not using Beads, manage tasks manually.

| # | Task | Priority | Status | Blocked By | Plan Doc |
|---|------|----------|--------|------------|----------|
| 1 | {Task title} | P{0-4} | {open/in_progress/closed} | {dependencies or -} | {feature-xxx.md or -} |
| 2 | {Task title} | P{0-4} | {status} | Task 1 | {-} |

<!-- If using Beads, replace # with Task ID (e.g., bd-xxx.1) -->

### Dependency Graph
```
Task 1 ──────────────────────┐
                             ▼
Task 3 ───▶ Task 2 ───▶ Task 4
```

<!-- If using Beads, replace Task # with bd-xxx.# -->

---

## 4. Data Flow

### Primary Flow: {Flow Name}
1. [Step 1]: {description}
2. [Step 2]: {description}
3. [Step 3]: {description}

### Alternative Flow: {Flow Name} (Optional)
1. [Step 1]: {description}

### Error Handling
- {Error case}: {How it's handled}

---

## 5. API Contracts (Optional)

> **Note**: Include if epic involves API changes. Keep high-level; details in task plans.

### Endpoints Overview
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/{resource} | {What it does} |
| GET | /api/v1/{resource}/:id | {What it does} |

### Key Data Models
```
{ModelName}:
  - field1: type
  - field2: type
```

---

## 6. Key Decisions & Trade-offs

| Decision | Options Considered | Choice | Trade-off |
|----------|-------------------|--------|-----------|
| {Decision area} | {Option A, Option B} | {Chosen} | {What we gain/lose} |

---

## 7. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| {Risk description} | High/Medium/Low | High/Medium/Low | {How to mitigate} |

---

## 8. Dependencies

### External
- {External service/API}: {What we need from it}

### Internal
- {Internal service/team}: {What we need from it}

### Blockers
- [ ] {Blocker that must be resolved before starting}

---

## 9. Milestones (Optional)

> **Note**: Focus on task groupings and sequence, not time estimates.

| Milestone | Tasks | Description |
|-----------|-------|-------------|
| {Milestone 1} | Task 1, Task 2 | {What this milestone delivers} |
| {Milestone 2} | Task 3, Task 4 | {What this milestone delivers} |

---

## 10. References

- **Requirement Doc**: [req-{name}.md](../requirements/req-{name}.md)
- **Related Epics**: {links to related epic plans}
- **External Docs**: {links to external resources}

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| {YYYY-MM-DD} | {name} | Initial epic plan created |

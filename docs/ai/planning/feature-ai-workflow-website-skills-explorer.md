# Plan: AI Workflow Website Skills Explorer

Note: All content in this document must be written in English.

---
epic_plan: docs/ai/planning/epic-ai-workflow-website.md
requirement: docs/ai/requirements/req-ai-workflow-website.md
---

## 0. Related Documents

| Type | Document |
|------|----------|
| Requirement | [req-ai-workflow-website.md](../requirements/req-ai-workflow-website.md) |
| Epic | [epic-ai-workflow-website.md](epic-ai-workflow-website.md) |

---

## 3. Goal & Acceptance Criteria

### Goal
- Turn the skills page into a production-ready explorer for the static skill catalog.

### Acceptance Criteria (Given/When/Then)
- Given a user visits `/skills`, when the page loads, then all configured skills render in a responsive grid.
- Given a user selects a tool chip, when the filter updates, then the URL query param changes and the grid updates immediately.
- Given a filter has no matches, when the page rerenders, then an explicit empty state appears.

## 4. Risks & Assumptions

### Risks
- Tool metadata drift between static config and copied markdown can create confusing empty states.

### Assumptions
- The scaffold already exposes skill cards and the closed tool enum.

## 5. Definition of Done
- [ ] Build passes (linter, type checks, compile)
- [ ] Tests added and passing
- [ ] Code reviewed and approved
- [ ] Documentation updated

---

## 6. Implementation Plan

### Summary
Replace mock filtering with URL-backed filtering and tighten the card grid for larger catalogs.

### Phase 1: Filter State

- [ ] [MODIFIED] website/components/client/skills-filter.tsx — Sync the chosen tool to the query param and derive filtered skill results.
- [ ] [MODIFIED] website/app/skills/page.tsx — Render the live result count and empty state around the filtered grid.

### Phase 2: Catalog Presentation

- [ ] [MODIFIED] website/components/server/skill-card.tsx and related display primitives — Refine the grid and metadata badges for the final explorer presentation.

## 7. Follow-ups
- [ ] Consider full-text search only if the catalog meaningfully grows beyond the current scope.

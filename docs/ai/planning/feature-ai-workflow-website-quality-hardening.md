# Plan: AI Workflow Website Quality Hardening

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
- Close the final quality gaps after the core pages are fully implemented.

### Acceptance Criteria (Given/When/Then)
- Given the core pages are complete, when validation runs, then the app passes lint, typecheck, build, and targeted accessibility checks.
- Given a user enables reduced motion, when they browse the site, then motion-heavy sections degrade gracefully.
- Given pages are shared publicly, when crawlers or unfurlers inspect them, then each route exposes coherent metadata.

## 4. Risks & Assumptions

### Risks
- Quality work spread too early across unfinished pages creates rework.

### Assumptions
- Earlier feature plans have stabilized route structure and content hierarchy first.

## 5. Definition of Done
- [ ] Build passes (linter, type checks, compile)
- [ ] Tests added and passing
- [ ] Code reviewed and approved
- [ ] Documentation updated

---

## 6. Implementation Plan

### Summary
Finish the website by validating, hardening, and documenting the already-built page flows.

### Phase 1: Validation And Accessibility

- [ ] [MODIFIED] website/components/client/* and website/app/* — Add reduced-motion handling, aria improvements, and focus-state cleanup where needed.
- [ ] [MODIFIED] website/package.json and related config — Tighten validation commands if the current setup is too loose.

### Phase 2: Metadata And Documentation

- [ ] [MODIFIED] website/app/* — Add route-level metadata and any remaining public-facing polish.
- [ ] [MODIFIED] docs/ai/planning/*.md and requirement cross-links — Mark the epic complete and record the final resume state.

## 7. Follow-ups
- [ ] Consider web UI test automation once the public flows stop changing quickly.

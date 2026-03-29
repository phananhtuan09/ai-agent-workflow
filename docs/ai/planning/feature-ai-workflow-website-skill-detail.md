# Plan: AI Workflow Website Skill Detail

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
- Complete the statically generated skill detail experience with markdown rendering, copy actions, and safe 404 handling.

### Acceptance Criteria (Given/When/Then)
- Given a user opens `/skills/[id]` for a valid skill, when the page loads, then the trigger keywords, use cases, markdown preview, and install command all render.
- Given a user opens an unknown skill ID, when the route resolves, then Next.js 404 renders instead of a broken page.
- Given a user clicks copy on the detail page, when the command is available, then the action reports success or failure accessibly.

## 4. Risks & Assumptions

### Risks
- Markdown rendering can fail if copied source content includes unsupported syntax.

### Assumptions
- The scaffold already copies markdown locally and can load skill content at build time.

## 5. Definition of Done
- [ ] Build passes (linter, type checks, compile)
- [ ] Tests added and passing
- [ ] Code reviewed and approved
- [ ] Documentation updated

---

## 6. Implementation Plan

### Summary
Finalize the dynamic skill route using the copied markdown content and the shared skill metadata from earlier slices.

### Phase 1: Static Generation

- [ ] [MODIFIED] website/app/skills/[id]/page.tsx — Add `generateStaticParams`, 404 handling, and page composition for the detail view.
- [ ] [MODIFIED] website/lib/skills.ts — Harden build-time skill loading and metadata lookup.

### Phase 2: Detail Presentation

- [ ] [MODIFIED] website/components/client/skill-detail-shell.tsx and related display primitives — Finish the translated UI shell, copy button behavior, and markdown framing.

## 7. Follow-ups
- [ ] Add syntax highlighting only if the markdown preview needs richer code presentation.

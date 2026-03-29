# Plan: AI Workflow Website Home And Install Polish

Note: All content in this document must be written in English.

---

epic_plan: docs/ai/planning/epic-ai-workflow-website.md
requirement: docs/ai/requirements/req-ai-workflow-website.md

---

## 0. Related Documents

| Type        | Document                                                                 |
| ----------- | ------------------------------------------------------------------------ |
| Requirement | [req-ai-workflow-website.md](../requirements/req-ai-workflow-website.md) |
| Epic        | [epic-ai-workflow-website.md](epic-ai-workflow-website.md)               |

---

## 3. Goal & Acceptance Criteria

### Goal

- Finish the Home and Install pages so the public landing flow feels production-ready rather than scaffolded.

### Acceptance Criteria (Given/When/Then)

- Given a user lands on `/`, when the hero loads, then the headline, CTA, feature cards, and install panel communicate the product clearly above the fold.
- Given a user opens `/install`, when they choose any supported tool, then the command panel updates instantly and the copy interaction provides visual confirmation.
- Given the user switches language, when they revisit Home or Install, then translated labels persist across refreshes.

## 4. Risks & Assumptions

### Risks

- Final marketing copy may still change after the first design review.
- Copy-to-clipboard behavior needs graceful fallback in browsers that reject clipboard writes.

### Assumptions

- The first scaffold already established the command mapping and translation structure.

## 5. Definition of Done

- [ ] Build passes (linter, type checks, compile)
- [ ] Tests added and passing
- [ ] Code reviewed and approved
- [ ] Documentation updated

---

## 6. Implementation Plan

### Summary

Use the mock scaffold as the base, then replace placeholder composition with finalized copy hierarchy, tighter motion, and complete install interactions.

### Phase 1: Landing Content Refinement

- [x] [MODIFIED] website/components/client/home-page.tsx — Replace mock sections with final landing-page content blocks, metrics, CTA hierarchy, and layout polish.
- [ ] [MODIFIED] website/components/server/\* — Promote any repeated home/install display primitives into reusable components only when duplication is real.

### Phase 2: Install Experience Completion

- [ ] [MODIFIED] website/app/install/page.tsx and website/components/client/install-\* — Finish tool selection, copy feedback, and any install-specific helper content.
- [ ] [MODIFIED] website/lib/i18n/\* — Complete any missing EN/VI strings used by Home or Install.

## 7. Follow-ups

- [ ] Add page-level SEO metadata once copy is stable.

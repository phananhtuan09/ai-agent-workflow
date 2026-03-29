# Plan: AI Workflow Website Copy Localization Refinement

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

## 1. Codebase Context

### Key Files to Reference
- `website/lib/i18n/vi.json` - shared Vietnamese copy for nav, home, install, workflow, skills, footer, and not-found content
- `website/data/workflows.ts` - bilingual workflow card content used across the workflow visualizer
- `website/data/skills.ts` - skill catalog descriptions and use cases currently stored as English-only strings
- `website/components/client/animated-workflow-nodes.tsx` - hardcoded hero labels that should follow the active locale
- `website/components/client/skills-explorer.tsx` - renders skill copy and must read localized content safely
- `website/types/content.ts` - shared content types that define whether catalog copy can be localized

---

## 3. Goal & Acceptance Criteria

### Goal
- Replace awkward machine-like Vietnamese and untranslated public-facing copy with clearer, natural wording across the public website.

### Acceptance Criteria (Given/When/Then)
- Given a visitor switches the website to Vietnamese, when they browse `/`, `/install`, `/workflow`, `/skills`, shared navigation/footer, or the not-found route, then the touched fields in `website/lib/i18n/vi.json` render without placeholder English except approved product and proper names such as Claude Code, Codex, Google Antigravity, GitHub, workflow, prompt, agent, and skill identifiers.
- Given the workflow visualizer renders its localized phase data from `website/data/workflows.ts`, when the user reads Vietnamese summaries, captions, use-case text, benefit text, and repo-source notes, then those fields no longer contain literal phrases such as "doc dễ đoán", "guidance dùng chung", "có gate", or other mixed-language wording that obscures meaning.
- Given a visitor opens `/skills` in Vietnamese, when skill cards render descriptions and use cases, then `website/data/skills.ts` provides Vietnamese text for those fields while leaving skill names and tags unchanged unless translation is already established in the UI.
- Given the hero workflow animation renders in either locale, when labels appear, then the node titles and the step prefix come from locale-aware copy instead of hardcoded English strings.

## 4. Risks & Assumptions

### Risks
- Over-translating product terms could make the interface less recognizable for users already familiar with AI tooling vocabulary.
- Broad copy edits across static data files can introduce missing-key or type mismatches if data structures drift.

### Assumptions
- Product names such as Claude Code, Codex, Google Antigravity, and skill identifiers remain in English.
- Terms like workflow, prompt, agent, and plan may remain partially anglicized where that is more natural for the target audience.

## 5. Definition of Done
- [x] `cd website && npm run lint`
- [x] `cd website && npm run typecheck`
- [x] Manual Vietnamese copy QA completed on `/`, `/install`, `/workflow`, `/skills`, shared nav/footer, and the not-found route
- [x] Planning docs and epic status updated to reflect completion

---

## 6. Implementation Plan

### Summary
Refine the translation source of truth first, then localize remaining hardcoded UI labels and English-only skill metadata, and finally run focused validation.

### Phase 1: Copy Source Cleanup

- [x] [MODIFIED] `website/lib/i18n/vi.json` - Rewrite awkward Vietnamese strings on shared site chrome and route-level sections with more natural phrasing.
- [x] [MODIFIED] `website/data/workflows.ts` - Refine Vietnamese workflow summaries, captions, benefits, and source notes that currently read like literal translations.

### Phase 2: Missing Localization Coverage

- [x] [MODIFIED] `website/types/content.ts`, `website/data/skills.ts`, and `website/components/client/skills-explorer.tsx` - Convert skill descriptions and use cases to localized content and render them per active locale.
- [x] [MODIFIED] `website/components/client/animated-workflow-nodes.tsx` - Move hardcoded hero node labels and the step prefix behind locale-aware copy.

### Phase 3: Verification And Status Sync

- [x] [MODIFIED] `docs/ai/planning/epic-ai-workflow-website.md` and this feature plan - Mark the slice status accurately after implementation and validation.
- [x] [VALIDATED] `website` - Run lint and typecheck to confirm the content/type refactor is safe.
- [x] [VALIDATED] `website` - Perform a manual Vietnamese route QA pass on `/`, `/install`, `/workflow`, `/skills`, shared nav/footer, and the not-found route, checking that approved English exceptions are the only English terms left in touched copy.

## 7. Follow-ups
- [ ] Consider extracting shared localized copy helpers if more catalog-style content becomes bilingual.

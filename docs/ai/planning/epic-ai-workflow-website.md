# Epic: AI Workflow Website

Note: All content in this document must be written in English.

---

## requirement: docs/ai/requirements/req-ai-workflow-website.md

## 1. Overview

This epic delivers the first public website for the AI Agent Workflow project inside a new `website/` workspace. The work is split into a foundation-and-mockups slice first, then page-specific implementation slices so the team can ship a responsive bilingual scaffold now and layer in richer interactions and content safely afterward.

---

## 2. Feature Plans

| #   | Feature Plan                                                                                               | Priority | Status      | FR Scope                                 | Depends On                                                                                                                                                                               | Description                                                                                                                                                   |
| --- | ---------------------------------------------------------------------------------------------------------- | -------- | ----------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | [feature-ai-workflow-website-foundation-mockups.md](feature-ai-workflow-website-foundation-mockups.md)     | P0       | completed   | FR-01, FR-02, FR-04, FR-13, FR-14, FR-15 | -                                                                                                                                                                                        | Set up the Next.js website workspace, shared theme tokens, i18n foundation, static data, copied skill content, and responsive mockups for all planned routes. |
| 2   | [feature-ai-workflow-website-home-install-polish.md](feature-ai-workflow-website-home-install-polish.md)   | P1       | in_progress | FR-01, FR-02, FR-03                      | feature-ai-workflow-website-foundation-mockups                                                                                                                                           | Replace mock content on Home and Install with production-ready copy hierarchy, command interaction polish, and final metadata.                                |
| 3   | [feature-ai-workflow-website-workflow-visualizer.md](feature-ai-workflow-website-workflow-visualizer.md)   | P1       | in_progress | FR-05, FR-06, FR-07                      | feature-ai-workflow-website-foundation-mockups                                                                                                                                           | Implement the cinematic workflow atlas with a four-node phase rail, replay controls, anchored context panel, and per-phase workflow cards backed by repo sources. |
| 4   | [feature-ai-workflow-website-skills-explorer.md](feature-ai-workflow-website-skills-explorer.md)           | P1       | open        | FR-08, FR-09, FR-10                      | feature-ai-workflow-website-foundation-mockups                                                                                                                                           | Deliver the skills catalog with query-param filtering, empty states, and production-ready card presentation.                                                  |
| 5   | [feature-ai-workflow-website-skill-detail.md](feature-ai-workflow-website-skill-detail.md)                 | P1       | open        | FR-11, FR-12                             | feature-ai-workflow-website-foundation-mockups, feature-ai-workflow-website-skills-explorer                                                                                              | Build statically generated skill detail pages backed by copied markdown content and tool-specific install actions.                                            |
| 6   | [feature-ai-workflow-website-home-showcase-polish.md](feature-ai-workflow-website-home-showcase-polish.md) | P1       | completed   | FR-01, FR-13, FR-14                      | feature-ai-workflow-website-home-install-polish                                                                                                                                          | Add a more distinctive homepage signature moment, stronger section choreography, and route-specific motion/accessibility polish backed by broader validation. |
| 7   | [feature-ai-workflow-website-quality-hardening.md](feature-ai-workflow-website-quality-hardening.md)       | P2       | open        | FR-13, FR-15                             | feature-ai-workflow-website-home-showcase-polish, feature-ai-workflow-website-workflow-visualizer, feature-ai-workflow-website-skills-explorer, feature-ai-workflow-website-skill-detail | Close the gap on accessibility, reduced motion, SEO metadata, and validation hardening after the main pages are complete.                                     |
| 8   | [feature-ai-workflow-website-copy-localization-refinement.md](feature-ai-workflow-website-copy-localization-refinement.md) | P2       | completed   | -                                        | feature-ai-workflow-website-foundation-mockups                                                                                                                                            | Refine public-facing Vietnamese copy across the website, localize missing skill-card content, and align hardcoded hero labels with the active locale.         |

**Status values:** `open` | `in_progress` | `blocked` | `completed`

Use `-` for `FR Scope` or `Depends On` when the workflow does not need that level of tracking.

---

## 3. Dependency Graph

```text
feature-ai-workflow-website-foundation-mockups
 ├──▶ feature-ai-workflow-website-home-install-polish
 ├──▶ feature-ai-workflow-website-workflow-visualizer
 ├──▶ feature-ai-workflow-website-skills-explorer ───▶ feature-ai-workflow-website-skill-detail
 └──▶ feature-ai-workflow-website-copy-localization-refinement

feature-ai-workflow-website-home-install-polish ─────▶ feature-ai-workflow-website-home-showcase-polish ─────▶ feature-ai-workflow-website-quality-hardening
feature-ai-workflow-website-workflow-visualizer ─────▶ feature-ai-workflow-website-quality-hardening
feature-ai-workflow-website-skill-detail ────────────▶ feature-ai-workflow-website-quality-hardening
```

---

## 4. Related Documents

- **Requirement**: [req-ai-workflow-website.md](../requirements/req-ai-workflow-website.md)

---

## Changelog

| Date       | Change                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------- |
| 2026-03-29 | Epic created for phased AI Workflow website delivery                                                                |
| 2026-03-29 | Foundation-and-mockups slice completed; remaining page-detail slices stay open                                      |
| 2026-03-29 | Home and Install polish moved to `in_progress` after landing-page implementation started                            |
| 2026-03-29 | Added a dedicated homepage showcase-polish slice from test and landing-review findings                              |
| 2026-03-29 | Homepage showcase-polish slice completed after motion, interactivity, accessibility, and validation updates shipped |
| 2026-03-29 | Added and completed a copy-localization refinement slice after Vietnamese public-site content review                |

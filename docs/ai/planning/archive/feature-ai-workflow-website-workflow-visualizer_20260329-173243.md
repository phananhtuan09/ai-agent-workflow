# Plan: AI Workflow Website Workflow Visualizer

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

### Similar Features
- `website/components/client/home-page.tsx` - shows how the site frames workflow concepts with summary cards, route CTAs, and bilingual copy.
- `website/components/client/animated-workflow-nodes.tsx` - demonstrates the current motion language and reduced-motion handling for workflow-themed visuals.

### Reusable Components/Utils
- `website/components/client/workflow-preview.tsx` - existing route-level presenter that already handles graph selection, replay state, and node detail state.
- `website/components/client/workflow-page.tsx` - page shell pattern for route header copy plus one primary interactive surface.
- `website/lib/utils.ts` - shared `cn` helper already used in workflow UI state styling.

### Architectural Patterns
- Static TypeScript metadata in `website/data/` drives UI content; the website should not inspect repo files at runtime.
- Route copy is localized through `website/lib/i18n/en.json` and `website/lib/i18n/vi.json`, not hard-coded inside client components.
- Workflow truth lives in repository assets under `.claude/commands/`, `.agents/skills/`, `.agents/roles/`, and `.codex/agents/`, then gets normalized into static website data.

### Key Files to Reference
- `website/data/workflows.ts` - current workflow content source; currently models only two generic graphs and needs a richer taxonomy.
- `website/types/content.ts` - typed schema for workflow data; likely needs expansion beyond `nodes` and `edges`.
- `.claude/commands/create-plan.md` - authoritative advanced command flow for feature planning.
- `.claude/commands/manage-epic.md` - authoritative advanced command flow for epic planning.
- `.claude/commands/execute-plan.md` - authoritative advanced command flow for implementation from a feature plan.
- `.claude/commands/requirements-orchestrator.md` - authoritative power workflow for requirement orchestration.
- `.claude/commands/development-orchestrator.md` - authoritative power workflow for planning plus implementation orchestration.
- `.claude/commands/test-web-orchestrator.md` - authoritative power workflow for testing orchestration.
- `.agents/skills/development-orchestrator/SKILL.md` - Codex-compatible power-skill mirror with task type, task size, gates, and sync rules.
- `.agents/skills/requirements-orchestrator/SKILL.md` - Codex-compatible requirement orchestration source.
- `.agents/skills/test-web-orchestrator/SKILL.md` - Codex-compatible testing orchestration source.
- `.codex/config.toml` - source of truth for named Codex sub-agents and their registration.
- `.agents/roles/task-investigator.md` - read-only investigation role that powers development orchestration.
- `.agents/roles/dev-plan-reviewer.md` - plan-review sub-agent role for execution readiness.
- `.agents/roles/dev-verifier.md` - post-implementation verification role for sync safety.

---

## 3. Goal & Acceptance Criteria

### Goal
- Replace the current generic workflow mock with a source-backed workflow atlas that accurately explains the repository's three user levels (`basic`, `advanced`, `power`) across the five displayed phases (`requirement`, `planning`, `implement`, `review`, `testing`) for Claude Code and Codex.

### Acceptance Criteria (Given/When/Then)
- Given a user opens `/workflow`, when the page renders, then they can understand the difference between `basic`, `advanced`, and `power` workflows without reading raw repo files.
- Given a user inspects any workflow tier, when they browse its phases, then the UI shows how that tier maps to the five displayed phases: `requirement`, `planning`, `implement`, `review`, and `testing`.
- Given a user drills into a workflow phase, when they inspect the details, then the UI names the concrete repository sources that power the phase such as Claude commands, Codex skills, and Codex sub-agents.
- Given a maintainer updates the workflow definitions in static website data, when they add or revise a workflow entry, then the `/workflow` page updates from typed config without duplicating JSX for each tier.
- Given a mobile user or a reduced-motion user opens the page, when they explore the workflow, then the content stays legible, keyboard reachable, and not dependent on hover-only interactions.

## 4. Risks & Assumptions

### Risks
- The workflow taxonomy is denser than the current graph model, so a naive node canvas can become unreadable on tablet and mobile layouts.
- `.claude` and `.agents` sometimes mirror the same workflow with different wording, so the website data must normalize names without implying nonexistent runtime behavior.
- The user prompt says "4 phase" but lists five explicit labels, so the implementation can drift if the displayed phase model is not locked early.

### Assumptions
- The displayed phase model should use the five labels explicitly listed by the user: `requirement`, `planning`, `implement`, `review`, and `testing`.
- The website remains fully static; it should encode an audited snapshot of workflow behavior in `website/data/workflows.ts` rather than parsing `.claude` or `.codex` files in the browser.
- Google Antigravity does not need a dedicated workflow lane in this slice because the user explicitly asked to redraw around Claude Code and Codex sources.
- Existing visual language, spacing tokens, and motion style from the website foundation should be preserved unless workflow readability requires a localized adjustment.

## 5. Definition of Done
- [ ] `npm --prefix website run lint` passes after the workflow page redesign.
- [ ] `npm --prefix website run typecheck` passes with the new workflow content schema.
- [ ] The workflow page content reflects the three workflow levels and five displayed phases using audited static data from `.claude`, `.agents`, and `.codex`.
- [ ] English and Vietnamese workflow copy match the new taxonomy and interaction model.
- [ ] Reduced-motion and mobile presentation are explicitly covered in the final implementation review.

---

## 6. Implementation Plan

### Summary
Refresh the existing workflow visualizer into a taxonomy-first explainer. Replace the current generic graph set with typed static content that maps repository commands, skills, and sub-agents onto the user-facing `basic`, `advanced`, and `power` workflows, then update the route shell and interaction model so the denser content stays understandable on desktop and mobile.

### Phase 1: Audit Workflow Sources And Expand The Data Model

- [ ] [MODIFIED] website/types/content.ts — Expand the workflow content types so the page can model phases, user tiers, and source references instead of only freeform node graphs.
  ```ts
  Function: Type declarations for workflow content primitives

  Input validation:
    - workflow tier id must be one of: "basic" | "advanced" | "power"
    - phase id must be one of: "requirement" | "planning" | "implement" | "review" | "testing"
    - source kind must be one of: "command" | "skill" | "agent" | "rule"
    - tool scope must be normalized to the supported website tools that appear in the UI

  Logic flow:
    1. Keep the existing route content type file as the single type source for the website.
    2. Introduce typed structures for phase metadata, tier definitions, and per-phase source entries.
    3. Preserve enough flexibility for one phase to contain multiple sources from Claude Code and Codex.
    4. Allow optional summaries, badges, and compatibility labels so the renderer does not hard-code source semantics.

  Return: compile-time safe content contracts consumed by `website/data/workflows.ts` and workflow UI components

  Edge cases:
    - A phase may intentionally have no direct source entry for a tier → render an explicit "not used in this tier" state instead of omitting the phase.
    - One repository artifact may support multiple phases → duplicate via data references, not duplicated JSX logic.

  Dependencies: `website/data/workflows.ts`, workflow client components
  ```

- [ ] [MODIFIED] website/data/workflows.ts — Replace the outdated mock graphs with audited workflow data for the `basic`, `advanced`, and `power` journeys.
  ```ts
  Function: workflow content export for `/workflow`

  Input validation:
    - every tier must define all five displayed phases
    - every source entry must include a stable id, label, repository path reference, and supported tool scope
    - narrative summaries must stay consistent with the audited source files in `.claude`, `.agents`, and `.codex`

  Logic flow:
    1. Encode the `basic` tier as prompt-first behavior where skills are triggered by user intent or keywords rather than explicit commands.
    2. Encode the `advanced` tier around explicit command usage such as `create-plan`, `manage-epic`, and `execute-plan`.
    3. Encode the `power` tier around orchestrators such as `requirements-orchestrator`, `development-orchestrator`, and `test-web-orchestrator`.
    4. Attach per-phase detail items that reference Claude command files, Codex skill mirrors, and Codex sub-agents like `task_investigator`, `dev_plan_reviewer`, and `dev_verifier`.
    5. Export helper metadata needed by the page, such as phase order, tier summaries, tool badges, and any provenance notes.

  Return: static typed workflow atlas consumed directly by the workflow route

  Edge cases:
    - Claude command names and Codex skill names may diverge slightly → store a shared user-facing label plus explicit source path labels.
    - Some phases are light-touch in the `basic` tier → keep them visible with concise explanations rather than removing them.

  Dependencies: `website/types/content.ts`, `.claude/commands/*.md`, `.agents/skills/*/SKILL.md`, `.codex/config.toml`, `.agents/roles/*.md`
  ```

### Phase 2: Rebuild The Workflow Experience

- [ ] [ADDED] website/components/client/workflow-tier-summary.tsx — Add a focused summary component for the three workflow levels before the detailed phase explorer.
  ```tsx
  Function: WorkflowTierSummary(props: { tiers: WorkflowTier[]; activeTierId: string; onSelect: (tierId: string) => void }): JSX.Element

  Input validation:
    - fall back to the first tier when `activeTierId` is missing or stale
    - keep button labels and tier copy sourced from workflow data, not duplicated literals

  Logic flow:
    1. Render three level cards: `basic`, `advanced`, and `power`.
    2. Show a short explanation of how each tier differs in entry point and control level.
    3. Surface tool and source badges so users can immediately see whether the tier relies on prompts, commands, skills, or sub-agents.
    4. Expose the active tier through accessible button semantics and visible focus states.

  Return: a reusable tier-selector block above the detailed workflow explorer

  Edge cases:
    - Very long Vietnamese labels should wrap without breaking the card rhythm.
    - If a future tier is added, the layout should expand from data instead of requiring JSX duplication.

  Dependencies: `website/data/workflows.ts`, `website/lib/utils.ts`
  ```

- [ ] [MODIFIED] website/components/client/workflow-preview.tsx — Replace the current graph-only presentation with a phase explorer that can explain one selected workflow tier in detail.
  ```tsx
  Function: WorkflowPreview(): JSX.Element

  Input validation:
    - default to the first tier and first phase when persisted local state is absent
    - reset selected phase/source safely when the active tier changes
    - honor reduced-motion preferences for all animated transitions

  Logic flow:
    1. Read the new workflow atlas instead of the old `workflowGraphs` array.
    2. Render the tier summary selector and a five-phase rail ordered as `requirement -> planning -> implement -> review -> testing`.
    3. Allow the user to switch phases and inspect the exact source items participating in that phase.
    4. Present source details in a responsive detail panel with repository path labels, short explanations, and tool badges.
    5. Preserve replay or staged reveal only where it clarifies the flow; remove decorative graph animation that no longer fits the denser information model.

  Return: responsive workflow explorer for desktop and mobile

  Edge cases:
    - Dense source lists should scroll or wrap within a stable container instead of overflowing the canvas.
    - Keyboard users must be able to reach tier buttons, phase buttons, and detail toggles without relying on pointer hover.
    - Reduced-motion users should still see state changes clearly through opacity and emphasis instead of motion-only cues.

  Dependencies: `website/components/client/workflow-tier-summary.tsx`, `website/data/workflows.ts`, `framer-motion`, `website/lib/utils.ts`
  ```

- [ ] [MODIFIED] website/components/client/workflow-page.tsx — Rewrite the route framing so the page explains the five-phase model and why the three workflow tiers matter.
  ```tsx
  Function: WorkflowPage(): JSX.Element

  Input validation:
    - route copy must come from i18n keys
    - supporting callouts must stay synchronized with the workflow atlas terminology

  Logic flow:
    1. Replace the current mock-only intro with a taxonomy-first explanation of `basic`, `advanced`, and `power`.
    2. Add concise orientation content that explains the phase order and the provenance of the displayed workflow sources.
    3. Keep the main interactive explorer as the primary page body.
    4. Preserve the established page shell spacing and bilingual route structure used elsewhere in the site.

  Return: route shell for `/workflow`

  Edge cases:
    - Intro copy must still fit narrow screens without pushing the explorer too far below the fold.
    - The page should remain understandable even if users do not interact with the explorer immediately.

  Dependencies: `website/components/client/workflow-preview.tsx`, `website/lib/i18n/*.json`
  ```

### Phase 3: Localize And Validate The New Taxonomy

- [ ] [MODIFIED] website/lib/i18n/en.json — Replace the placeholder workflow copy with English strings that describe the new tiered workflow model.
  ```json
  Function: workflow translation entries

  Input validation:
    - add keys only under the existing `workflow` namespace
    - keep terminology consistent with the audited workflow data and route copy

  Logic flow:
    1. Update the page title, description, helper text, and any tier or phase labels required by the new UI.
    2. Introduce short explanatory strings for `basic`, `advanced`, and `power`.
    3. Add provenance or hint text that explains commands, skills, and sub-agents in plain English.

  Return: localized English copy consumed by workflow route components

  Edge cases:
    - Avoid wording that implies runtime automation beyond what the repository actually ships today.

  Dependencies: `website/components/client/workflow-page.tsx`, `website/components/client/workflow-preview.tsx`
  ```

- [ ] [MODIFIED] website/lib/i18n/vi.json — Mirror the workflow taxonomy updates in Vietnamese without losing the repo-native terms users expect.
  ```json
  Function: workflow translation entries

  Input validation:
    - preserve repo-native terms such as `requirement`, `planning`, and `orchestrator` where full translation would reduce clarity
    - keep Vietnamese strings aligned one-to-one with the English workflow namespace

  Logic flow:
    1. Translate the revised route title, descriptions, labels, and hints.
    2. Keep the three tier names recognizable for Vietnamese users while preserving the exact workflow terminology used in the repository.
    3. Verify that all new keys required by the redesigned components exist in both locales.

  Return: localized Vietnamese copy consumed by workflow route components

  Edge cases:
    - Long explanatory strings must still fit card and button layouts without truncating critical meaning.

  Dependencies: `website/components/client/workflow-page.tsx`, `website/components/client/workflow-preview.tsx`
  ```

## 7. Follow-ups
- [ ] Consider adding a small build-time sync script that audits `.claude`, `.agents`, and `.codex` workflow metadata so the website data cannot drift silently.
- [ ] Add route-level browser coverage for tier switching, phase selection, and reduced-motion behavior once the redesigned workflow page ships.

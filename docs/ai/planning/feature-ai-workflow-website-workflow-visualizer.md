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

## 2. Scope Resolution & Source Contract

### Scope Decisions
- The latest user-approved rail/card mockup supersedes the earlier generic canvas direction for this slice.
- The page still satisfies the earlier tooltip intent by showing an anchored phase context panel when a macro phase node is selected; this replaces a floating tooltip but preserves the same label-plus-description behavior.
- Replay remains in scope as a rail-and-card animation reset control.
- The earlier "multiple graphs supported" requirement maps to the new page structure as:
  - one macro graph rail at the top of the page
  - one mini graph inside each workflow card
  - phase switching driven entirely by typed static data
- This slice may introduce route-specific motion and glow treatment as long as it stays inside the existing website palette, typography, and Tailwind utility system.

### Localization Contract
- `website/data/workflows.ts` stores per-locale content for phase summaries, workflow summaries, `useCase`, `benefit`, and source notes using explicit `en` and `vi` fields.
- `website/lib/i18n/en.json` and `website/lib/i18n/vi.json` store route chrome only:
  - page title and description
  - section labels
  - field labels such as `Use case`, `Why this workflow`, `Sources`, and `Replay`
  - supporting hero and hint copy
- Client components must not duplicate user-facing workflow copy outside these two sources.

### Canonical Phase/Tier Source Matrix

| Macro Phase | Basic | Advanced | Power |
| --- | --- | --- | --- |
| `requirement` | `AGENTS.md`; `.agents/skills/brainstorm-partner/SKILL.md` | `.claude/commands/create-plan.md`; `.claude/commands/manage-epic.md` | `.claude/commands/requirements-orchestrator.md`; `.agents/skills/requirements-orchestrator/SKILL.md`; `.codex/agents/requirement-ba.toml`; `.codex/agents/requirement-sa.toml`; `.codex/agents/requirement-uiux.toml` |
| `planning` | `.agents/skills/create-plan/SKILL.md`; `.agents/skills/manage-epic/SKILL.md` | `.claude/commands/create-plan.md`; `.claude/commands/manage-epic.md` | `.claude/commands/development-orchestrator.md`; `.agents/skills/development-orchestrator/SKILL.md`; `.codex/agents/task-investigator.toml`; `.codex/agents/dev-plan-reviewer.toml` |
| `implement` | `.agents/skills/execute-plan/SKILL.md`; `AGENTS.md` | `.claude/commands/execute-plan.md`; `.claude/commands/check-implementation.md` | `.claude/commands/development-orchestrator.md`; `.agents/skills/development-orchestrator/SKILL.md`; `.agents/roles/task-investigator.md`; `.agents/roles/dev-plan-reviewer.md` |
| `review-testing` | `.agents/skills/review-plan/SKILL.md`; `.agents/skills/quality-code-check/SKILL.md` | `.claude/commands/code-review.md`; `.claude/commands/run-test.md`; `.claude/commands/check-implementation.md` | `.claude/commands/test-web-orchestrator.md`; `.agents/skills/test-web-orchestrator/SKILL.md`; `.codex/agents/dev-verifier.toml`; `.codex/agents/test-web-analyst.toml`; `.codex/agents/test-web-verifier.toml` |

### Validation Checklist
- Manual desktop check for rail animation, phase switching, and card stagger.
- Manual mobile check for horizontal rail behavior or stacked fallback.
- Manual keyboard check for phase buttons, replay control, and card focus order.
- Manual reduced-motion check using browser setting.
- Automated validation remains `npm --prefix website run lint` and `npm --prefix website run typecheck`.

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
- Replace the current generic workflow mock with a high-visual workflow atlas that uses one animated four-node phase rail (`requirement`, `planning`, `implement`, `review + testing`) and a rich per-phase detail surface to explain the repository's three user levels (`basic`, `advanced`, `power`) for Claude Code and Codex.

### Acceptance Criteria (Given/When/Then)
- Given a user opens `/workflow`, when the page renders, then they can understand the difference between `basic`, `advanced`, and `power` workflows without reading raw repo files.
- Given a user opens the page, when the hero rail loads, then they see four phase nodes in one horizontal row with animated direction lines that communicate the macro flow.
- Given a user clicks a macro phase node, when the selection changes, then an anchored context panel shows that phase label and description instead of relying on a floating tooltip.
- Given a user clicks a phase node, when the active phase changes, then the detail area updates to show three workflow sections for `basic`, `advanced`, and `power`.
- Given a user presses `Replay`, when the control is activated, then the phase rail and active phase cards replay their staged animation sequence without resetting the selected phase.
- Given a user inspects any workflow card inside the active phase, when they view the card, then it includes a mini graph plus `use case` and `why this workflow` content that explains when and why that workflow should be used.
- Given a user drills into a workflow phase, when they inspect the details, then the UI names the concrete repository sources that power the phase such as Claude commands, Codex skills, and Codex sub-agents.
- Given a maintainer updates the workflow definitions in static website data, when they add or revise a workflow entry, then the `/workflow` page updates from typed config without duplicating JSX for each tier.
- Given a mobile user or a reduced-motion user opens the page, when they explore the workflow, then the content stays legible, keyboard reachable, and not dependent on hover-only interactions.

## 4. Risks & Assumptions

### Risks
- The workflow taxonomy is denser than the current graph model, so both the top rail and the per-workflow mini graphs can become noisy if the visual system is not strongly hierarchical.
- `.claude` and `.agents` sometimes mirror the same workflow with different wording, so the website data must normalize names without implying nonexistent runtime behavior.
- Strong animation on a content-dense page can become decorative instead of explanatory if timing and active-state choreography are not controlled carefully.

### Assumptions
- The top-level page UI should use four macro nodes in one row: `requirement`, `planning`, `implement`, and `review + testing`.
- `Review + testing` is a merged presentation node for the hero rail only; detailed workflow content can still mention review and testing as separate activities where needed.
- The selected phase context panel is the approved replacement for the older floating-tooltip interaction.
- The website remains fully static; it should encode an audited snapshot of workflow behavior in `website/data/workflows.ts` rather than parsing `.claude` or `.codex` files in the browser.
- Google Antigravity does not need a dedicated workflow lane in this slice because the user explicitly asked to redraw around Claude Code and Codex sources.
- Existing visual language, spacing tokens, and motion style from the website foundation should be preserved, but this route may add stronger localized glow and staged-motion treatment within the same palette and typography system.

## 5. Definition of Done
- [x] `npm --prefix website run lint` passes after the workflow page redesign.
- [x] `npm --prefix website run typecheck` passes with the new workflow content schema.
- [x] The workflow page content reflects the three workflow levels inside each of the four displayed macro phases using audited static data from `.claude`, `.agents`, and `.codex`.
- [x] English and Vietnamese workflow copy match the new taxonomy and interaction model.
- [ ] Reduced-motion and mobile presentation are explicitly covered in the final implementation review.

---

## 6. Implementation Plan

### Summary
Refresh the existing workflow visualizer into a cinematic, taxonomy-first explainer. The page should open with an animated four-node phase rail, then reveal a detail stage where the selected phase expands into three workflow cards (`basic`, `advanced`, `power`) with mini-graphs, source references, use cases, and value propositions.

### Phase 1: Audit Workflow Sources And Expand The Data Model

- [x] [MODIFIED] website/types/content.ts — Expand the workflow content types so the page can model the four-node macro rail, three workflow tiers per phase, source references, and card-level explanatory metadata instead of only freeform node graphs.
  ```ts
  Function: Type declarations for workflow content primitives

  Input validation:
    - workflow tier id must be one of: "basic" | "advanced" | "power"
    - macro phase id must be one of: "requirement" | "planning" | "implement" | "review-testing"
    - source kind must be one of: "command" | "skill" | "agent" | "rule"
    - tool scope must be normalized to the supported website tools that appear in the UI

  Logic flow:
    1. Keep the existing route content type file as the single type source for the website.
    2. Introduce typed structures for macro phase metadata, tier definitions, and per-phase workflow cards.
    3. Preserve enough flexibility for one phase to contain multiple sources from Claude Code and Codex.
    4. Add fields for `useCase`, `benefit`, and mini-graph nodes/edges so the renderer does not hard-code explanatory content.
    5. Allow optional summaries, badges, and compatibility labels so the renderer does not hard-code source semantics.

  Return: compile-time safe content contracts consumed by `website/data/workflows.ts` and workflow UI components

  Edge cases:
    - A phase may intentionally have no direct source entry for a tier → render an explicit "not used in this tier" state instead of omitting the phase.
    - One repository artifact may support multiple phases → duplicate via data references, not duplicated JSX logic.

  Dependencies: `website/data/workflows.ts`, workflow client components
  ```

- [x] [MODIFIED] website/data/workflows.ts — Replace the outdated mock graphs with audited workflow data for the four macro phases and the `basic`, `advanced`, and `power` workflow cards shown inside each phase.
  ```ts
  Function: workflow content export for `/workflow`

  Input validation:
    - every macro phase must define all three workflow cards
    - every source entry must include a stable id, label, repository path reference, and supported tool scope
    - every workflow card must include a mini-graph definition, `useCase`, and `benefit`
    - narrative summaries must stay consistent with the audited source files in `.claude`, `.agents`, and `.codex`

  Logic flow:
    1. Define the macro rail in the exact order `requirement -> planning -> implement -> review + testing`.
    2. For each macro phase, encode the `basic` tier as prompt-first behavior where skills are triggered by user intent or keywords rather than explicit commands.
    3. Encode the `advanced` tier around explicit command usage such as `create-plan`, `manage-epic`, and `execute-plan`.
    4. Encode the `power` tier around orchestrators such as `requirements-orchestrator`, `development-orchestrator`, and `test-web-orchestrator`.
    5. Attach per-phase detail items that reference Claude command files, Codex skill mirrors, and Codex sub-agents like `task_investigator`, `dev_plan_reviewer`, and `dev_verifier`.
    6. Export helper metadata needed by the page, such as phase order, tier summaries, tool badges, provenance notes, and motion hints for staged reveals.

  Return: static typed workflow atlas consumed directly by the workflow route

  Edge cases:
    - Claude command names and Codex skill names may diverge slightly → store a shared user-facing label plus explicit source path labels.
    - Some phases are light-touch in the `basic` tier → keep them visible with concise explanations rather than removing them.
    - `review + testing` may cite both review-oriented and testing-oriented artifacts → preserve both in one macro card group without implying they are a single repository command.

  Dependencies: `website/types/content.ts`, `.claude/commands/*.md`, `.agents/skills/*/SKILL.md`, `.codex/config.toml`, `.agents/roles/*.md`
  ```

### Phase 2: Rebuild The Workflow Experience

- [x] [ADDED] website/components/client/workflow-phase-rail.tsx — Add the hero-stage macro flow rail with four animated nodes in a single row and directional line choreography.
  ```tsx
  Function: WorkflowPhaseRail(props: { phases: WorkflowMacroPhase[]; activePhaseId: string; onSelect: (phaseId: string) => void }): JSX.Element

  Input validation:
    - fall back to the first phase when `activePhaseId` is missing or stale
    - keep phase labels sourced from workflow data, not duplicated literals

  Logic flow:
    1. Render four phase nodes in one desktop row with a strong left-to-right visual flow.
    2. Animate the connecting line so directionality is obvious during mount and when replayed.
    3. Give the active node a stronger glow, scale, and status ring while inactive nodes stay readable.
    4. Expose node selection through accessible button semantics and visible focus states.
    5. Collapse gracefully on mobile into a horizontal snap rail or stacked stepper without losing the sense of ordered flow.

  Return: a reusable hero rail that acts as the main phase navigation element

  Edge cases:
    - The last node label `Review + Testing` is longer than the others and must fit without shrinking the whole rail to illegibility.
    - On narrow widths, line animation should degrade to shorter segments instead of overflowing the viewport.

  Dependencies: `website/data/workflows.ts`, `website/lib/utils.ts`
  ```

- [x] [ADDED] website/components/client/workflow-tier-card.tsx — Add a high-detail card for each workflow type inside the selected phase.
  ```tsx
  Function: WorkflowTierCard(props: { workflow: WorkflowTierCardData; isActive: boolean }): JSX.Element

  Input validation:
    - require `useCase`, `benefit`, and a mini-graph payload for every card
    - keep card copy sourced from data and i18n helpers, not duplicated in JSX

  Logic flow:
    1. Render the workflow label, tool/source badges, and a compact animated mini-graph.
    2. Show concrete repository sources such as commands, skills, and agents as structured pills or list items.
    3. Reserve a dedicated lower section for `Use case` and `Why use this workflow`.
    4. Differentiate `basic`, `advanced`, and `power` visually through accent colors and graph energy without breaking the overall page palette.

  Return: reusable workflow card for the selected macro phase

  Edge cases:
    - Cards with more sources should grow vertically without breaking row rhythm.
    - Reduced-motion users should still get clear emphasis states without animated graph loops.

  Dependencies: `website/data/workflows.ts`, `framer-motion`, `website/lib/utils.ts`
  ```

- [x] [MODIFIED] website/components/client/workflow-preview.tsx — Replace the current graph-only presentation with a staged explorer that combines the macro rail and the per-phase workflow deck.
  ```tsx
  Function: WorkflowPreview(): JSX.Element

  Input validation:
    - default to the first macro phase when local state is absent
    - reset selected subcontent safely when the active phase changes
    - honor reduced-motion preferences for all animated transitions

  Logic flow:
    1. Read the new workflow atlas instead of the old `workflowGraphs` array.
    2. Render the four-node macro rail as the top interaction surface.
    3. Animate a lower detail deck when the active phase changes so users feel the transition from macro flow to phase detail.
    4. Render exactly three workflow cards for the active phase: `basic`, `advanced`, and `power`.
    5. Keep the animated storytelling purposeful: phase-line reveal on mount, card stagger on phase switch, mini-graph pulse on active cards, and restrained fallbacks for reduced motion.

  Return: responsive workflow explorer for desktop and mobile

  Edge cases:
    - Dense source lists should scroll or wrap within a stable container instead of overflowing the canvas.
    - Keyboard users must be able to reach phase buttons and workflow detail toggles without relying on pointer hover.
    - Reduced-motion users should still see state changes clearly through opacity and emphasis instead of motion-only cues.

  Dependencies: `website/components/client/workflow-phase-rail.tsx`, `website/components/client/workflow-tier-card.tsx`, `website/data/workflows.ts`, `framer-motion`, `website/lib/utils.ts`
  ```

- [x] [MODIFIED] website/components/client/workflow-page.tsx — Rewrite the route framing so the page feels like a premium explainer, not a neutral documentation stub.
  ```tsx
  Function: WorkflowPage(): JSX.Element

  Input validation:
    - route copy must come from i18n keys
    - supporting callouts must stay synchronized with the workflow atlas terminology

  Logic flow:
    1. Replace the current mock-only intro with a dramatic hero that frames the workflow as a guided control surface.
    2. Add concise orientation content that explains the four macro phases and the provenance of the displayed workflow sources.
    3. Use layered backgrounds, glow fields, and supporting metric or legend chips so the page feels intentional and high-signal.
    4. Keep the interactive explorer as the primary page body and avoid burying it below long explanatory text.
    5. Preserve the established route shell spacing and bilingual route structure used elsewhere in the site.

  Return: route shell for `/workflow`

  Edge cases:
    - Intro copy must still fit narrow screens without pushing the explorer too far below the fold.
    - The page should remain understandable even if users do not interact with the explorer immediately.

  Dependencies: `website/components/client/workflow-preview.tsx`, `website/lib/i18n/*.json`
  ```

### Phase 3: Localize And Validate The New Taxonomy

- [x] [MODIFIED] website/lib/i18n/en.json — Replace the placeholder workflow copy with English strings that describe the new tiered workflow model.
  ```json
  Function: workflow translation entries

  Input validation:
    - add keys only under the existing `workflow` namespace
    - keep terminology consistent with the audited workflow data and route copy

  Logic flow:
    1. Update the page title, description, helper text, and any tier or phase labels required by the new UI.
    2. Introduce short explanatory strings for `basic`, `advanced`, and `power`.
    3. Add `Use case` and `Why this workflow` labels plus hero legend copy for the four-node phase rail.
    4. Add provenance or hint text that explains commands, skills, and sub-agents in plain English.

  Return: localized English copy consumed by workflow route components

  Edge cases:
    - Avoid wording that implies runtime automation beyond what the repository actually ships today.

  Dependencies: `website/components/client/workflow-page.tsx`, `website/components/client/workflow-preview.tsx`
  ```

- [x] [MODIFIED] website/lib/i18n/vi.json — Mirror the workflow taxonomy updates in Vietnamese without losing the repo-native terms users expect.
  ```json
  Function: workflow translation entries

  Input validation:
    - preserve repo-native terms such as `requirement`, `planning`, and `orchestrator` where full translation would reduce clarity
    - keep Vietnamese strings aligned one-to-one with the English workflow namespace

  Logic flow:
    1. Translate the revised route title, descriptions, labels, and hints.
    2. Keep the three tier names recognizable for Vietnamese users while preserving the exact workflow terminology used in the repository.
    3. Add Vietnamese labels for `Use case`, `Why this workflow`, and the four macro phase nodes without losing repo-native clarity.
    4. Verify that all new keys required by the redesigned components exist in both locales.

  Return: localized Vietnamese copy consumed by workflow route components

  Edge cases:
    - Long explanatory strings must still fit card and button layouts without truncating critical meaning.

  Dependencies: `website/components/client/workflow-page.tsx`, `website/components/client/workflow-preview.tsx`
  ```

## 7. Follow-ups
- [ ] Consider adding a small build-time sync script that audits `.claude`, `.agents`, and `.codex` workflow metadata so the website data cannot drift silently.
- [ ] Add route-level browser coverage for tier switching, phase selection, and reduced-motion behavior once the redesigned workflow page ships.

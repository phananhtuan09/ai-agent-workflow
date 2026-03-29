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

## 3. Goal & Acceptance Criteria

### Goal
- Upgrade the workflow page from a static preview into an animated, multi-graph explainer with accessible tooltip interactions.

### Acceptance Criteria (Given/When/Then)
- Given a user opens `/workflow`, when the page mounts, then nodes and edges animate in sequence or appear instantly in reduced-motion mode.
- Given a user selects another workflow graph, when the graph changes, then the canvas updates without code changes outside static config.
- Given a user clicks or keyboard-focuses a node, when they request more detail, then a tooltip shows the node label and description.

## 4. Risks & Assumptions

### Risks
- Framer Motion and SVG timing can regress on small screens if the layout is too dense.

### Assumptions
- The foundation slice already provides sample workflow config and page shell styling.

## 5. Definition of Done
- [ ] Build passes (linter, type checks, compile)
- [ ] Tests added and passing
- [ ] Code reviewed and approved
- [ ] Documentation updated

---

## 6. Implementation Plan

### Summary
Move the workflow page from mock composition to a data-driven animated canvas with stateful graph selection and tooltip behavior.

### Phase 1: Graph Interaction

- [ ] [MODIFIED] website/components/client/workflow-canvas.tsx — Implement timed node and edge reveals, reduced-motion fallback, and tooltip state.
- [ ] [MODIFIED] website/data/workflows.ts — Finalize the graph config schema, descriptions, and multiple graph definitions.

### Phase 2: Page Integration

- [ ] [MODIFIED] website/app/workflow/page.tsx — Wire the finished visualizer into the route with supporting explanatory content and replay controls.

## 7. Follow-ups
- [ ] Add broader graph authoring guidance if the workflow set grows beyond the initial examples.

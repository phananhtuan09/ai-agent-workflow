---
name: requirements-orchestrator
description: Requirement Orchestrator - Coordinates BA, SA, Researcher, and UI/UX agents to produce comprehensive requirements.
---

## Goal

Orchestrate requirement gathering through specialized agents to produce a comprehensive requirement document at `docs/ai/requirements/req-{name}.md`.

This command coordinates:
- **BA Agent**: Business analysis, user stories, functional requirements
- **SA Agent**: Technical feasibility, architecture recommendations
- **Researcher Agent**: Domain terminology, external research (conditional)
- **UI/UX Agent**: Wireframes, screen flows (conditional)

---

## Workflow Alignment

- Provide brief status updates (1–3 sentences) before/after important actions.
- For medium/large tasks, create todos (≤14 words, verb-led). Keep only one `in_progress` item.
- Update todos immediately after progress; mark completed upon finish.
- Run agents in parallel where possible to optimize performance.

---

## Step 0: Pre-flight Check

### Check for Existing Requirement

**If user mentions existing requirement doc:**

```
Read(file_path="docs/ai/requirements/req-{name}.md")
```

**Ask user:**
```
AskUserQuestion(questions=[{
  question: "Found existing requirement doc. What would you like to do?",
  header: "Mode",
  options: [
    { label: "Update existing", description: "Enhance with new agents, fill gaps" },
    { label: "Start fresh", description: "Archive current, create new" },
    { label: "Review only", description: "Show current state, identify gaps" }
  ],
  multiSelect: false
}])
```

- **Update**: Load existing, identify what's missing, run relevant agents
- **Fresh**: Backup to `archive/`, start from scratch
- **Review**: Display summary, suggest next steps

---

## Step 1: Analyze User Prompt

### Extract Structured Context

Before analyzing, extract any structured context the user provided:

| Slot | Value | Source |
|------|-------|--------|
| **Tech constraints** | Existing stack, perf budget, timeline | User prompt or ask |
| **Related artifacts** | Figma paths, epic path, API docs links | User prompt or skip |
| **Feature boundary** | What is explicitly in vs out | User prompt or ask |

If tech constraints or feature boundary are missing and the feature is Medium/Complex, ask before running agents.

### Parse Request

Analyze user prompt to determine:

| Aspect | Detection Method | Output |
|--------|------------------|--------|
| **Feature Type** | Keywords: UI, API, page, endpoint, database | `UI` / `API` / `Data` / `Full-stack` |
| **Complexity** | Scope indicators, number of features | `Simple` / `Medium` / `Complex` |
| **Domain Terms** | Industry jargon, unfamiliar terms | List of terms needing research |
| **UI Needed** | Mentions of screens, forms, flows, pages | Boolean: needs UI/UX |

### Determine Workflow Mode

Auto-select mode based on detected complexity, then notify user and allow override:

| Detected Complexity | Recommended Mode | Reason |
|---------------------|-----------------|--------|
| Simple | Light | Few unknowns, no domain terms, no UI |
| Medium | Light | Bounded scope; upgrade if domain terms or UI detected |
| Complex | Full | Many unknowns, cross-layer, domain terms, or UI involved |

```
AskUserQuestion(questions=[{
  question: "Detected: {complexity}. Recommended: {Light/Full} mode — {reason}. Confirm or override?",
  header: "Mode",
  options: [
    { label: "Use recommended ({Light/Full})", description: "{reason}" },
    { label: "Switch to {other mode}", description: "Override recommendation" }
  ],
  multiSelect: false
}])
```

**Light Mode** (Simple features or user override):
- Agents: BA → SA-lite → Consolidate
- Skip Researcher and UI/UX agents
- Q&A: focus on critical unknowns only, stop when BA has enough to write
- Smaller consolidated output

**Full Mode** (Complex features or user override):
- Full agent workflow as described in subsequent steps
- All conditional agents evaluated
- SA runs as SA-full (may inspect repo selectively)
- Max 3 Q&A rounds total; after round 3 classify remaining unknowns as `[SAFE ASSUMPTION]` or `[NEEDS CONFIRMATION]` and continue

### Determine Agent Strategy

Based on analysis and mode:

| Scenario | Mode | Agents to Run | Execution |
|----------|------|---------------|-----------|
| Simple API feature | Light | BA → SA | Sequential |
| Simple UI feature | Light | BA → SA | Sequential |
| Complex API feature | Full | BA → SA | Sequential |
| Complex full-stack | Full | BA → SA → UI/UX | Sequential |
| Domain-specific | Full | BA → (SA + Researcher parallel) → UI/UX | Mixed |
| Any feature | Light | BA → SA | Sequential |

### Decision Output

```markdown
## Prompt Analysis

**Feature**: {derived name}
**Type**: {UI / API / Full-stack / Data}
**Complexity**: {Simple / Medium / Complex}
**Mode**: {Light / Full}

**Agents Required**:
- [x] BA Agent (always)
- [x] SA Agent (always)
- [ ] Researcher Agent (domain terms detected: {list}) — Full mode only
- [ ] UI/UX Agent (UI components needed) — Full mode only

**Execution Plan**:
1. {Step 1}
2. {Step 2}
...
```

---

## Step 2: Execute BA Agent

**Orchestrator handles Q&A directly — avoids expensive sub-agent resume pattern.**

### 2a: Orchestrator Q&A

Collect requirements directly — **do not delegate Q&A to the BA sub-agent** (avoids expensive resume pattern).

Conduct Q&A rounds yourself using `AskUserQuestion`. Tailor questions and options to the specific feature. Apply judgment on how many rounds are needed:

| Mode | Guidance |
|------|----------|
| Light | Focus on unknowns critical for BA to write the document. Stop when you have enough. |
| Full | Deeper exploration. After round 3, classify remaining unknowns (see below) and continue. |

After each round, decide: are there still blockers that would prevent BA from writing a clear document? If yes, ask another round. If no, proceed.

**Assumption classification** — when an unknown cannot be resolved via Q&A:

| Type | Label | Rule |
|------|-------|------|
| UI labels, placeholder text, non-critical defaults | `[SAFE ASSUMPTION]` | Auto-pass. Note in BA doc. |
| API contracts, permissions, business rules, data schema, integration behavior | `[NEEDS CONFIRMATION]` | Do NOT auto-pass. Surface as Open Question. Orchestrator must ask user before consolidating. |

After collecting all answers, record them as a structured `[ANSWERS]` block and proceed to spawn.

### 2b: Spawn BA Agent (write-only)

```
Task(
  subagent_type='requirement-ba',
  description='BA requirement analysis',
  prompt="[WRITE-ONLY MODE] - Answers already collected. Skip Q&A steps entirely.

Feature: {feature-name}

User's original request:
---
{user prompt}
---

[ANSWERS]
{paste collected answers here}
[/ANSWERS]

Output to: docs/ai/requirements/agents/ba-{name}.md"
)
```

### BA Completion Check

After BA completes, verify output exists:
- `docs/ai/requirements/agents/ba-{name}.md`

**Verify mandatory sections** — if any are missing, retry BA agent once with note "Missing section: {X}":

| Section | Required |
|---------|----------|
| Problem Statement | ✅ |
| Users & User Stories | ✅ |
| Functional Requirements | ✅ |
| Business Rules | ✅ |
| Out of Scope | ✅ |
| Open Questions | ✅ |
| Handoff Summary | ✅ |

If still missing after retry → proceed but flag as `incomplete` in the consolidated doc.

Extract key info for next agents:
- Feature type confirmed
- User stories
- Functional requirements
- Domain terms (if any discovered)
- Any `[NEEDS CONFIRMATION]` assumptions surfaced by BA

---

## Step 3: Execute Parallel Agents (Conditional)

Based on Step 1 analysis, run applicable agents in parallel.

### 3a: Researcher Agent (if domain terms detected)

```
Task(
  subagent_type='requirement-researcher',
  description='Domain research',
  prompt="Research the following terms/concepts for feature: {feature-name}

Terms to research:
- {term 1}
- {term 2}
- {term 3}

Context from BA document: docs/ai/requirements/agents/ba-{name}.md

Output to: docs/ai/requirements/agents/research-{name}.md",
  run_in_background: true
)
```

### 3b: SA Agent (always)

Before spawning SA, pre-read project context files in the orchestrator (cheap, predictable cost).

```
Read(file_path="docs/ai/project/CODE_CONVENTIONS.md")   # capture as {conventions_content}
Read(file_path="docs/ai/project/PROJECT_STRUCTURE.md")  # capture as {structure_content}
Read(file_path="AGENTS.md")                              # capture as {agents_content}, if exists
```

If a file doesn't exist, use `"(not available)"` as its placeholder.

**Check inline context freshness:** If `PROJECT_STRUCTURE.md` has no `last_updated` field or was last updated >30 days ago, log a warning: `⚠️ Inline context may be stale. SA output should be validated against actual repo.` and consider escalating to SA-full.

**Select SA mode based on workflow mode:**

| Workflow Mode | Feature Complexity | SA Mode | SA Behavior |
|---------------|--------------------|---------|-------------|
| Light | Any | SA-lite | Use inline context only. Skip repo inspection. |
| Full | Simple / Medium | SA-lite | Use inline context only. Skip repo inspection. |
| Full | Complex | SA-full | Use inline context as baseline. May run up to 5 targeted Glob/Grep searches to validate integration points or find reuse candidates. |

**SA-lite prompt:**

```
Task(
  subagent_type='requirement-sa',
  description='Solution architecture',
  prompt="[LIGHT MODE] - Use inline project context below. Do not run codebase Explore sub-agent.

Perform technical feasibility assessment for feature: {feature-name}

BA document: docs/ai/requirements/agents/ba-{name}.md

[INLINE PROJECT CONTEXT]
CODE_CONVENTIONS.md:
---
{conventions_content}
---

PROJECT_STRUCTURE.md:
---
{structure_content}
---

AGENTS.md:
---
{agents_content}
---
[/INLINE PROJECT CONTEXT]

Output to: docs/ai/requirements/agents/sa-{name}.md",
  run_in_background: true
)
```

**SA-full prompt (Full mode + Complex only):**

```
Task(
  subagent_type='requirement-sa',
  description='Solution architecture (full)',
  prompt="[SA-FULL MODE] - Use inline context as baseline. You may run up to 5 targeted Glob/Grep searches to validate integration points or find reuse candidates. Do not do open-ended codebase exploration.

Perform technical feasibility assessment for feature: {feature-name}

BA document: docs/ai/requirements/agents/ba-{name}.md

[INLINE PROJECT CONTEXT]
CODE_CONVENTIONS.md:
---
{conventions_content}
---

PROJECT_STRUCTURE.md:
---
{structure_content}
---

AGENTS.md:
---
{agents_content}
---
[/INLINE PROJECT CONTEXT]

Output to: docs/ai/requirements/agents/sa-{name}.md",
  run_in_background: true
)
```

### Wait for Parallel Agents

If running in background, use TaskOutput to collect results:

```
TaskOutput(task_id={researcher_task_id}, block=true)
TaskOutput(task_id={sa_task_id}, block=true)
```

**Verify SA mandatory sections** — if any are missing, retry SA agent once with note "Missing section: {X}":

| Section | Required |
|---------|----------|
| Requirements Analysis | ✅ |
| Technical Recommendations | ✅ |
| Risk Assessment | ✅ |
| Open Technical Questions | ✅ |
| Handoff Summary | ✅ |

---

## Step 3.5: BA↔SA Consistency Check

**Run before spawning UI/UX** — catch conflicts early to avoid wasted UI/UX work.

Compare `ba-{name}.md` and `sa-{name}.md` for:

| Conflict Type | Example | Action |
|---------------|---------|--------|
| Feasibility gap | BA marks FR as Must-have, SA marks as Not feasible | Ask user to adjust priority or drop FR before continuing |
| Scope mismatch | BA describes 3 screens, SA only addresses 1 data flow | Clarify which scope is authoritative |
| Assumption conflict | BA assumes real-time sync, SA plans batch processing | Surface to user; cannot auto-resolve |
| `[NEEDS CONFIRMATION]` items | Business rules from Q&A flagged as unresolved | Ask user before spawning UI/UX |

If no conflicts → proceed to Step 4.

If conflicts found:

```
AskUserQuestion(questions=[{
  question: "BA↔SA conflict: {describe conflict}. Resolve before UI/UX proceeds?",
  header: "Resolve",
  options: [
    { label: "{Option A}", description: "{Explanation}" },
    { label: "{Option B}", description: "{Explanation}" },
    { label: "Accept as open question", description: "Proceed with conflict noted in final doc" }
  ],
  multiSelect: false
}])
```

---

## Step 4: Execute UI/UX Agent (Conditional)

**Only if UI components are needed (detected in Step 1)**

### Check if Needed

UI/UX Agent is needed if:
- Feature type is `UI` or `Full-stack`
- BA document mentions screens, forms, pages, dashboards
- User explicitly mentioned UI/UX in request

### Pre-collect UI/UX Design Context

Before spawning, collect design decisions directly — same pattern as BA Q&A. Tailor questions to the feature's screens and flows identified in the BA document.

Typical questions to ask (adapt as needed):

```
AskUserQuestion(questions=[
  {
    question: "What is the primary target device for this feature?",
    header: "Device",
    options: [
      { label: "Desktop only", description: "No responsive requirement" },
      { label: "Desktop + mobile", description: "Responsive layout needed" },
      { label: "Mobile first", description: "Mobile is primary, desktop secondary" }
    ],
    multiSelect: false
  },
  {
    question: "Should the UI follow an existing design system or use a new pattern?",
    header: "Design system",
    options: [
      { label: "Follow existing patterns", description: "Reuse current components" },
      { label: "New pattern is fine", description: "UI/UX can propose fresh approach" }
    ],
    multiSelect: false
  }
])
```

After collecting answers, record them as `[UIUX_ANSWERS]` and proceed to spawn.

### Invoke UI/UX Agent

```
Task(
  subagent_type='requirement-uiux',
  description='UI/UX design',
  prompt="[WRITE-ONLY MODE] - Design context already collected. Skip Q&A steps entirely.

Design UI/UX for feature: {feature-name}

BA document: docs/ai/requirements/agents/ba-{name}.md
SA document: docs/ai/requirements/agents/sa-{name}.md (for constraints)

[UIUX_ANSWERS]
{paste collected design answers here}
[/UIUX_ANSWERS]

Output to: docs/ai/requirements/agents/uiux-{name}.md"
)
```

---

## Step 5: Resolve Conflicts (If Any)

### Check for Conflicts

Compare agent outputs for inconsistencies:

| Conflict Type | Detection | Resolution |
|---------------|-----------|------------|
| **Feasibility** | SA says not feasible, BA has as must-have | Ask user to adjust priority or scope |
| **Technical** | SA recommends X, research shows Y is standard | Present both, let user decide |
| **Scope** | Agents produced different scope understanding | Clarify with user |

### Conflict Resolution

```
AskUserQuestion(questions=[{
  question: "Conflict detected: {describe conflict}. How should we proceed?",
  header: "Resolve",
  options: [
    { label: "{Option A}", description: "{Explanation}" },
    { label: "{Option B}", description: "{Explanation}" },
    { label: "Discuss further", description: "Need more context" }
  ],
  multiSelect: false
}])
```

---

## Step 6: Consolidate Final Requirement

### Read Template

```
Read(file_path="docs/ai/requirements/req-template.md")
```

### Gather All Agent Outputs

```
Read(file_path="docs/ai/requirements/agents/ba-{name}.md")
Read(file_path="docs/ai/requirements/agents/sa-{name}.md")
Read(file_path="docs/ai/requirements/agents/research-{name}.md")  # if exists
Read(file_path="docs/ai/requirements/agents/uiux-{name}.md")       # if exists
```

### Generate Consolidated Document

Create `docs/ai/requirements/req-{name}.md` with:

```markdown
# Requirement: {Feature Name}

> Generated: {YYYY-MM-DD}
> Status: Draft | Review | Approved
> Complexity: {Low / Medium / High}

## Quick Links

| Document | Status |
|----------|--------|
| [BA Analysis](agents/ba-{name}.md) | ✅ Complete |
| [SA Assessment](agents/sa-{name}.md) | ✅ Complete |
| [Domain Research](agents/research-{name}.md) | {✅ Complete / ⏭️ Skipped} |
| [UI/UX Design](agents/uiux-{name}.md) | {✅ Complete / ⏭️ Skipped} |

---

## 1. Executive Summary

{Synthesized from all agents - 3-5 sentences covering what, why, how}

---

## 2. Problem Statement

{From BA document}

---

## 3. Users & User Stories

{From BA document - consolidated user stories table}

---

## 4. Functional Requirements

{From BA document - FR table}

---

## 5. Business Rules

{From BA document - BR table}

---

## 6. Technical Assessment

### Feasibility
{From SA document - feasibility summary}

### Recommended Architecture
{From SA document - key architecture decisions}

### Technology Stack
{From SA document - stack table}

### Technical Edge Cases
{From SA document - edge cases table}

### Risks
{From SA document - risk table}

---

## 7. UI/UX Design (if applicable)

### Screen Inventory
{From UI/UX document}

### Key Wireframes
{From UI/UX document - main screens only}

### User Flows
{From UI/UX document - flow diagrams}

---

## 8. Domain Context (if applicable)

### Glossary
{From Research document - key terms}

### Compliance & Standards
{From Research document - relevant standards}

---

## 9. Implementation Guidance

### Suggested Phases
{From SA document}

### Dependencies
{From BA + SA documents}

---

## 10. Out of Scope

{From BA document}

---

## 11. Open Questions

{Consolidated from all agents}

---

## 12. Acceptance Criteria

{Derived from FRs - Given/When/Then format}

---

---

## 13. Implementation Readiness Score

**Score**: {0-100}%

| Criteria | Status | Weight |
|----------|--------|--------|
| All FRs have testable acceptance criteria | ✅ / ❌ | 20% |
| No critical open questions | ✅ / ❌ | 20% |
| Technical risks have mitigations | ✅ / ❌ | 15% |
| Business rules are explicit | ✅ / ❌ | 15% |
| Error/edge cases defined | ✅ / ❌ | 15% |
| UI/UX specs complete (if applicable) | ✅ / ❌ / N/A | 15% |

**Missing for 100%**:
- {item 1}
- {item 2}

---

## 14. Changelog

| Date | Change |
|------|--------|
| {YYYY-MM-DD} | Initial version |

---

## Next Steps

1. Review this requirement document
2. Address open questions before implementation
3. Run `/create-plan` to generate implementation plan (small feature)
4. Run `/manage-epic` to break into feature plans (large feature)
```

### File Naming & Versioning

**Auto-name requirement:**
- Derive `req-{name}` from feature (kebab-case, concise)
- Example: "User Authentication Flow" → `req-user-authentication`

**If file already exists:**
1. Backup to `docs/ai/requirements/archive/req-{name}_{timestamp}.md`
2. Overwrite main file
3. Notify user of backup

---

## Step 7: Summary & Next Steps

### Present Summary

```markdown
## Requirement Document Created

**File**: docs/ai/requirements/req-{name}.md

### Agents Executed
| Agent | Output | Status |
|-------|--------|--------|
| BA | ba-{name}.md | ✅ Complete |
| SA | sa-{name}.md | ✅ Complete |
| Researcher | research-{name}.md | {✅ / ⏭️ Skipped} |
| UI/UX | uiux-{name}.md | {✅ / ⏭️ Skipped} |

### Key Findings
- **Feasibility**: {Feasible / Feasible with changes / Issues}
- **Complexity**: {Low / Medium / High}
- **Open Questions**: {count}

### Next Steps
1. Review requirement: `docs/ai/requirements/req-{name}.md`
2. Address open questions (if any)
3. Create plan: `/create-plan` (will auto-link to this requirement)
```

### Offer Options

```
AskUserQuestion(questions=[{
  question: "What would you like to do next?",
  header: "Next",
  options: [
    { label: "Create plan (small feature)", description: "Run /create-plan — single feature plan" },
    { label: "Create epic (large feature)", description: "Run /manage-epic — break into multiple feature plans" },
    { label: "View full document", description: "Display the consolidated requirement" },
    { label: "Continue refining", description: "Run more Q&A or agent passes" }
  ],
  multiSelect: false
}])
```

---

## Decision Trees

### When to Skip Agents

```
Researcher Agent:
  ├── Domain terms detected? ─── Yes ──▶ Run
  └── No ──▶ Skip

UI/UX Agent:
  ├── Feature type UI or Full-stack? ─── Yes ──▶ Run
  ├── BA mentions screens/forms/pages? ─── Yes ──▶ Run
  └── No ──▶ Skip
```

### Complexity Escalation

```
Simple (1-2 Q&A rounds):
  └── Default to Light mode. User can override to Full mode.

Medium (2-3 Q&A rounds):
  └── Ask user to choose Light or Full mode.

Complex (many unknowns):
  └── Default to Full mode. Recommend breaking down into smaller requirements.
```

---

## Error Handling

| Error | Action |
|-------|--------|
| Agent fails | Retry once with note on what was missing, then proceed without that agent's output |
| Agent output file empty or missing sections | Retry once with "Missing section: {X}", flag as `incomplete` if still missing |
| Template not found | Use fallback minimal structure |
| Conflict unresolved after AskUser | Document as open question, proceed — do not block |
| User abandons Q&A | Save progress, allow resume |
| Researcher finds no results for a term | Skip that term, note as "unresearched" in domain context section |
| SA output conflicts heavily with BA (unfeasible Must-haves) | Run Step 3.5 conflict resolution before proceeding; do not spawn UI/UX on broken foundation |
| `[NEEDS CONFIRMATION]` items still unresolved at consolidation | List them explicitly in Section 11 (Open Questions) with `⚠️ BLOCKS IMPLEMENTATION` tag |
| Inline context stale (>30 days) and SA-lite used | Add `⚠️ SA output based on potentially stale inline context — validate against repo before implementation` to Section 6 |

---

## Notes

### Agent Output Files

All agent outputs are saved in `docs/ai/requirements/agents/`:
- `ba-{name}.md` - Business Analysis
- `sa-{name}.md` - Solution Architecture
- `research-{name}.md` - Domain Research
- `uiux-{name}.md` - UI/UX Design

These provide detailed backup and audit trail for the consolidated `req-{name}.md`.

### Integration with Planning

The consolidated requirement document is designed to be consumed by `/create-plan`:
- Section mappings are compatible with planning template
- Technical assessment informs architecture decisions
- UI/UX wireframes inform implementation phases

### Parallel Execution

Maximize parallelism where possible:
- BA + Researcher can run in parallel (if both needed)
- SA can start after BA completes (needs BA output)
- UI/UX can start after SA completes (needs both outputs)

Optimal parallel execution for full workflow:
```
Q&A (orchestrator)
    ↓
BA (write-only)
    ↓
SA ──────────────┐
                  ├──▶ UI/UX ──▶ Consolidate
Researcher ──────┘
```

SA and Researcher both depend on BA output — run them in parallel after BA completes.

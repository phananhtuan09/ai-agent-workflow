---
name: requirements-orchestrator
description: Use when the user wants to clarify a feature request into requirement docs, coordinate BA/SA/Researcher/UI/UX sub-work, and produce `docs/ai/requirements/req-{name}.md` plus agent artifacts.
---

# Requirements Orchestrator

Use this skill to turn a vague or partial feature request into a structured requirement package in `docs/ai/requirements/`.

Operate as a requirement team lead. Your job is to decide which specialist roles to invoke, pass each one only the context it needs, collect their outputs, resolve conflicts, and publish one consolidated requirement doc.

## Inputs

- A feature request, bug scope, or product idea
- Optional existing requirement doc: `docs/ai/requirements/req-{name}.md`
- Optional design notes, screenshots, or external references
- Optional tech constraints: existing stack, performance budget, timeline, or deployment limits
- Optional related artifacts: Figma frame paths, epic path, API documentation links

## Required Context

Read these files before starting. Pass their content inline to workers instead of asking workers to re-read them:

- `docs/ai/requirements/req-template.md` — used by orchestrator during consolidation
- `docs/ai/project/CODE_CONVENTIONS.md` — passed inline to SA handoff
- `docs/ai/project/PROJECT_STRUCTURE.md` — passed inline to SA handoff
- `AGENTS.md` — passed inline to SA handoff (if exists)

Do not read role templates upfront. Workers load their own templates from:

- `docs/ai/requirements/templates/ba-template.md`
- `docs/ai/requirements/templates/sa-template.md`
- `docs/ai/requirements/templates/research-template.md`
- `docs/ai/requirements/templates/uiux-template.md`

## Role Definitions

Role prompts live in:

- `.agents/roles/requirement-ba.md`
- `.agents/roles/requirement-sa.md`
- `.agents/roles/requirement-researcher.md`
- `.agents/roles/requirement-uiux.md`

Load only the roles needed for the current request.

## Team Lead Contract

The orchestrator is responsible for:

- selecting the minimal role set from the user prompt
- creating a small handoff package for each role instead of forwarding full working memory
- choosing parallel versus sequential execution from the dependency graph below
- collecting role outputs from files, not from transient chat summaries
- resolving contradictions before writing the final requirement doc

Treat each role as a worker with its own bounded context. If Codex multi-agent is available, spawn real sub-agents. If it is not available, simulate the same worker boundary yourself by following the role file and restricting yourself to that role's declared inputs and outputs while producing its artifact.

## Codex Multi-Agent Contract

This repository registers named Codex agents in `.codex/config.toml`.

Use these exact agent names when `spawn_agent` is available:

- `requirement_ba`
- `requirement_sa`
- `requirement_researcher`
- `requirement_uiux`

Delegation rules:

- Prefer real sub-agents over solo simulation when `spawn_agent` is available.
- Spawn only the agents selected by the routing logic in this skill.
- Keep the orchestrator as the only writer of the final consolidated requirement doc.
- Worker agents may write only their own role artifact.
- Wait for spawned workers to finish before consolidating.
- If a spawn fails, retry once with a tighter packet. If it still fails, continue solo and preserve the same handoff boundaries.

## Codex Tool Mapping

- Claude `Read/Edit/Write` -> inspect with shell tools and edit with `apply_patch`
- Claude `AskUserQuestion` -> ask the user directly only when a wrong assumption would materially change scope
- Claude `Task(...)` -> use Codex multi-agent or role-based parallel work when available; otherwise execute the role workflows yourself in sequence
- Claude background tasks -> use `multi_tool_use.parallel` only for independent reads, not for file edits

## Workflow

### 1. Pre-flight

Derive a concise kebab-case feature name from the prompt.

Expected outputs:

- `docs/ai/requirements/agents/ba-{name}.md`
- `docs/ai/requirements/agents/sa-{name}.md`
- `docs/ai/requirements/agents/research-{name}.md`
- `docs/ai/requirements/agents/uiux-{name}.md`
- `docs/ai/requirements/req-{name}.md`

If `docs/ai/requirements/req-{name}.md` already exists:

- read it first
- decide whether to refresh, extend, or review in place
- back it up to `docs/ai/requirements/archive/req-{name}_{timestamp}.md` before overwriting

### 2. Analyze the request

Classify the request on four axes:

- Feature type: `UI`, `API`, `Data`, or `Full-stack`
- Complexity: `Simple`, `Medium`, or `Complex`
- Domain research needed: yes or no
- UI/UX design needed: yes or no

Choose the role set with this routing matrix:

| Prompt Signal | Required Roles |
|---------------|----------------|
| Any feature request | BA + SA |
| Domain jargon, compliance, standards, or unfamiliar external service | BA + SA + Researcher |
| Screens, forms, dashboards, flows, navigation, states, or user-facing interactions | BA + SA + UI/UX |
| Both research and UI concerns | BA + SA + Researcher + UI/UX |

**Select workflow mode** based on detected complexity. Recommend to the user and allow override — do not ask if the signal is unambiguous:

| Complexity | Default Mode | When to escalate |
|------------|--------------|-----------------|
| Simple | Light (BA + SA only) | User explicitly requests research or UI |
| Medium | Light | Domain terms detected or UI signals present → escalate to Full |
| Complex | Full (all selected roles) | User prefers speed → downgrade to Light |

**Light mode**: BA → SA-lite → Consolidate. Skip Researcher and UI/UX unless explicitly needed.
**Full mode**: BA → SA (lite or full, see SA handoff) → Researcher/UI/UX → Consolidate. All conditional roles evaluated.

Do not ask the user which roles to run unless the prompt is ambiguous enough that the product boundary itself is unclear.

### 3. Clarify then run BA

**Clarification first, spawn second.** Ask follow-up questions yourself before invoking BA, so BA runs in write-only mode with complete inputs.

Ask the user only when a wrong assumption would change scope, user flow, or acceptance criteria. Tailor questions to the specific feature — avoid generic questions. After each round, decide: are there still blockers that would prevent BA from writing a clear document? If no, proceed.

Cap at two clarification rounds for Light mode, three for Full mode. When unknowns remain after the cap, classify each one before continuing:

| Unknown type | Label | Rule |
|---|---|---|
| UI labels, placeholder text, non-critical defaults | `[SAFE ASSUMPTION]` | Auto-pass. Record in BA doc. |
| API contracts, permissions, business rules, data schema, integration behavior | `[NEEDS CONFIRMATION]` | Do NOT auto-pass. Carry as an explicit Open Question. Ask user before consolidating. |

Once answers are collected, load `.agents/roles/requirement-ba.md` and spawn BA with the full input package:

- original user prompt
- collected clarification answers
- existing requirement doc if present

Produce `docs/ai/requirements/agents/ba-{name}.md`.

The BA output is the source of truth for:

- problem statement
- users and user stories
- functional requirements
- business rules
- out-of-scope items
- open questions

### 4. Re-evaluate role selection after BA

After reading `docs/ai/requirements/agents/ba-{name}.md`, re-check whether downstream roles are needed.

Escalate to `Researcher` if BA reveals:

- unfamiliar domain terminology
- compliance, legal, policy, or standards-sensitive language
- external APIs, services, or libraries that need source verification
- feasibility questions caused by incomplete domain knowledge

Escalate to `UI/UX` if BA reveals:

- screens, pages, dashboards, forms, or tables
- step-by-step flows or navigation concerns
- error, empty, loading, success, or validation states needing definition
- role-specific user journeys

The post-BA decision overrides the initial prompt-only routing matrix.

### 5. Build role handoff packages

Before invoking any worker, prepare a minimal input package.

Every packet must include:

- `Role`: exact Codex agent name
- `Feature Name`: kebab-case feature identifier
- `Goal`: one concrete outcome
- `Allowed Writes`: exact artifact path for that worker
- `Required Reads`: exact file paths the worker should load first
- `Inputs`: only the facts, paths, and answers needed for this role
- `Non-Goals`: explicit out-of-scope items
- `Stop If`: ambiguity that would materially change scope or output correctness

#### BA handoff

- `Role`: `requirement_ba`
- original user prompt
- existing requirement doc if present
- any direct user answers gathered during clarification

**After BA completes, verify mandatory sections before proceeding.** If any are missing, retry BA once with a note identifying the gap. If still missing after retry, flag section as `incomplete` in the final doc and continue:

| Section | Required |
|---------|----------|
| Problem Statement | ✅ |
| Users & User Stories | ✅ |
| Functional Requirements | ✅ |
| Business Rules | ✅ |
| Out of Scope | ✅ |
| Open Questions | ✅ |
| Handoff Summary | ✅ |

#### SA handoff

- `Role`: `requirement_sa`
- BA output path
- inline project context (content of `CODE_CONVENTIONS.md`, `PROJECT_STRUCTURE.md`, `AGENTS.md` read by the orchestrator — SA does not need to read these files itself)
- short note listing areas that need feasibility focus
- SA mode flag (see below)

**Select SA mode based on workflow mode and complexity:**

| Workflow Mode | Complexity | SA Flag | SA Behavior |
|---------------|------------|---------|-------------|
| Light | Any | `[LIGHT MODE]` | Inline context only. No repo inspection. |
| Full | Simple / Medium | `[LIGHT MODE]` | Inline context only. No repo inspection. |
| Full | Complex | `[SA-FULL MODE]` | Inline context as baseline. Up to 5 targeted Glob/Grep searches to validate integration points or find reuse candidates. No open-ended exploration. |

**Inline context freshness check:** If `PROJECT_STRUCTURE.md` has no `last_updated` field or is older than 30 days, add warning `⚠️ Inline context may be stale` to the SA handoff note and prefer `[SA-FULL MODE]`.

**After SA completes, verify mandatory sections** — same retry policy as BA:

| Section | Required |
|---------|----------|
| Requirements Analysis | ✅ |
| Technical Recommendations | ✅ |
| Risk Assessment | ✅ |
| Open Technical Questions | ✅ |
| Handoff Summary | ✅ |

#### Researcher handoff

- `Role`: `requirement_researcher`
- BA output path when available
- exact terms, standards, libraries, or APIs to research
- short note explaining why research is needed
- **fetch budget**: max 2 URLs per term; prefer official or primary sources; skip pages where relevant content cannot be found within the first meaningful section

#### UI/UX handoff

Before spawning UI/UX, **pre-collect design context** from the user directly (same pattern as BA clarification). Ask only what would materially change screen layout or interaction model — target device, whether to follow an existing design system, and any known design constraints surfaced in SA output. Record collected answers as `[UIUX_ANSWERS]`.

- `Role`: `requirement_uiux`
- BA output path
- SA output path when available
- `[UIUX_ANSWERS]` block with pre-collected design decisions
- any design notes or screenshots
- short note listing the flows or screens that need definition
- `[WRITE-ONLY MODE]` flag — UI/UX must not ask the user additional questions; mark unresolvable items as Open Questions in its output

Each worker should receive only its handoff package plus its role definition.

### 6. Execute the dependency graph

Use this DAG:

1. BA runs first.
2. After BA completes, SA always runs.
3. Researcher may run in parallel with SA because both depend only on BA output.
4. **After SA completes and before spawning UI/UX: run a BA↔SA consistency check.** Compare BA and SA outputs for feasibility gaps (BA Must-have vs SA Not-feasible), scope mismatches, assumption conflicts, and any `[NEEDS CONFIRMATION]` items still unresolved. Resolve blocking conflicts with the user before spawning UI/UX — do not let UI/UX build on a broken foundation. Non-blocking conflicts can be noted and carried forward.
5. UI/UX runs after SA when technical constraints matter. If the UI request is trivial and SA adds no relevant constraint, UI/UX may run after BA, but prefer BA → SA → UI/UX.
6. Consolidation runs only after all selected worker outputs are complete.

Execution strategy:

- if `spawn_agent` is available, use the named agents from the Codex Multi-Agent Contract
- spawn `requirement_ba` first and wait for its artifact before deciding downstream work
- after BA, spawn `requirement_sa`
- when research is selected, spawn `requirement_researcher` in parallel with `requirement_sa`
- after SA completes, run the BA↔SA consistency check before spawning `requirement_uiux`
- when UI/UX is selected, spawn `requirement_uiux` after SA completes and conflicts are resolved
- if `spawn_agent` is not available, execute the same DAG serially while preserving the same handoff boundaries
- do not invent extra worker roles unless the user explicitly asks for them

Produce only the files that apply. Do not create placeholder docs for skipped roles.

### 7. Collect worker results

The orchestrator must read worker artifacts from disk and build a consolidation summary with:

- roles executed
- outputs created
- key decisions per role
- blockers per role
- open questions per role
- follow-on role signals discovered by BA
- contradictions across roles
- any `[NEEDS CONFIRMATION]` assumptions still unresolved

**Verify each artifact's mandatory sections.** Check for the sections listed in each handoff's completion check table. If a mandatory section is missing: retry the worker once with a note identifying the gap. If still incomplete after retry, mark the section as `incomplete` in the final doc and proceed — do not fabricate content.

Do not rely on memory of intermediate reasoning. Use the files as the source of truth.

### 8. Resolve conflicts

Compare role outputs before consolidation.

Look for:

- BA requirement marked must-have but SA says not feasible
- Research guidance that changes BA language or SA approach
- UI proposals that conflict with technical constraints
- missing acceptance criteria, missing edge cases, or contradictory assumptions
- `[NEEDS CONFIRMATION]` items that were never resolved

When the conflict materially changes scope or implementation, ask the user a direct question. Otherwise, resolve it in favor of the most concrete project constraint and record the assumption.

**Conflict resolution rule for `[NEEDS CONFIRMATION]` items**: if still unresolved at consolidation, list them in `Open Questions` with a `⚠️ BLOCKS IMPLEMENTATION` tag. Do not silently convert them to `[SAFE ASSUMPTION]`.

### Failure handling

| Failure | Action |
|---------|--------|
| Worker artifact missing or empty | Retry once with note on gap. If still missing, flag as `incomplete` and continue without fabricating. |
| Mandatory section absent after retry | Mark section `incomplete` in final doc. Do not block consolidation. |
| Researcher finds no results for a term | Skip the term. Note as "unresearched" in the domain context section. |
| SA↔BA conflict on a Must-have FR | Run BA↔SA consistency check (step 6.4). Ask user before spawning UI/UX. |
| `[NEEDS CONFIRMATION]` unresolved at consolidation | Add `⚠️ BLOCKS IMPLEMENTATION` tag in Open Questions. Do not auto-pass. |
| Inline context stale (>30 days, no last_updated) | Prefer SA-full. Add `⚠️ SA output based on potentially stale inline context — validate against repo before implementation` to Technical Assessment. |
| spawn_agent unavailable | Execute same DAG serially. Preserve handoff boundaries. Do not merge worker contexts. |

### 9. Consolidate final requirement

Create `docs/ai/requirements/req-{name}.md` using `docs/ai/requirements/req-template.md`.

The final requirement must:

- be written in English
- include the `Quick Links` table with all four agent rows from the template
- mark each row as `✅ Complete` or `⏭️ Skipped`
- link produced role documents and keep skipped ones visibly marked instead of deleting rows
- synthesize instead of copying sections blindly
- convert unresolved gaps into explicit open questions
- derive acceptance criteria in testable language
- include technical risks and edge cases when known

Use the following fan-in mapping:

| Final Section | Source of Truth |
|---------------|-----------------|
| Problem Statement, Users, User Stories, Functional Requirements, Business Rules, Out of Scope | BA |
| Technical Assessment, Risks, Edge Cases, Suggested Phases | SA |
| Glossary, Compliance, Standards, External References | Researcher |
| Screen Inventory, Flows, Wireframes, Interaction Patterns | UI/UX |

If two workers disagree, document the chosen direction and the reason in `Open Questions` or the relevant section.

### 10. Final response

Report:

- created or updated file paths
- which roles were executed versus skipped
- major assumptions
- unresolved questions or blockers

## Output Rules

- Keep agent docs focused on their own role; avoid repeating full content from another role
- Every worker artifact must end with a short `Handoff Summary` section covering decisions, blockers, and open questions
- Prefer concrete tables and checklists over vague prose
- Keep naming consistent across BA, SA, Researcher, UI/UX, and final requirement docs
- When browsing is needed for domain research, cite sources in the research artifact

## Quality Bar

- The selected roles clearly match the prompt
- Worker execution order follows the dependency graph
- Each worker used only bounded context from its handoff package
- Requirement scope is clear enough to plan implementation
- Functional requirements are testable
- Technical feasibility is addressed
- Open questions are explicit rather than hidden in prose
- Output files follow the templates closely without leaving template placeholders behind

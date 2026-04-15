---
name: audit-workflow
description: Audit Claude Code workflow configuration (agents, skills, commands, hooks, output-styles) and provide improvement recommendations.
---

# Workflow Audit

Analyze the Claude Code workflow configuration in this project and provide actionable recommendations.

## Audit Process

### Step 0: Choose Audit Mode

Before doing anything else, use the AskUserQuestion tool to ask:

> **Which audit mode do you want?**
>
> - **Normal** — Analyze workflow config files (skills, commands, agents, hooks, token budget, overlaps)
> - **Advanced** — Static deep audit of Claude Code workflow design quality using config-file evidence, referenced-file triage, and a scored checklist.


Wait for the user's answer, then follow the corresponding path below.

---

## Normal Mode

### Step 1: Gather Workflow Files

Collect all workflow configuration files:

```
Read and analyze:
- .claude/CLAUDE.md (main instructions)
- .claude/settings.json (hooks configuration)
- .claude/settings.local.json (local hooks)
- .claude/agents/*.md (all agent definitions)
- .claude/skills/*/SKILL.md (all skill definitions)
- .claude/commands/*.md (all command definitions)
- .claude/output-styles/*.md (all output styles)
```

Use Glob to find all files, then Read each one.

### Step 2: Analyze Each Category

For each category, evaluate:

#### 2.1 Skills Analysis

| Criteria | Check |
|----------|-------|
| **Trigger clarity** | Is `description` specific about when to load? |
| **Overlap detection** | Do multiple skills cover same triggers? |
| **Size efficiency** | Is SKILL.md < 500 lines? Uses references for large content? |
| **Progressive disclosure** | Does it use references/ for optional content? |
| **Auto-load frequency** | Does "ALWAYS load when..." appear too often? |

**Overlap detection keywords to check:**
- UI/frontend: `frontend-design-*`, `ux-*`
- Code quality: `quality-*`, `*-review`
- Testing: `*-test`, `writing-test`

#### 2.2 Commands Analysis

| Criteria | Check |
|----------|-------|
| **Purpose clarity** | Is the command's purpose clear from name + description? |
| **Workflow alignment** | Does it follow CLAUDE.md guidelines? |
| **Agent delegation** | Does it use Task tool for complex sub-tasks? |
| **Duplication** | Are there commands that do similar things? |

#### 2.3 Agents Analysis

| Criteria | Check |
|----------|-------|
| **Role clarity** | Is the agent's specialized role well-defined? |
| **Tool access** | Does it have appropriate tool restrictions? |
| **Prompt quality** | Is the prompt concise but complete? |

#### 2.4 Hooks Analysis

| Criteria | Check |
|----------|-------|
| **Necessity** | Is each hook actually needed? |
| **Performance** | Are hooks lightweight (< 1 second execution)? |
| **Error handling** | Do hooks exit gracefully on failure? |
| **Matcher specificity** | Are matchers precise enough? |

#### 2.5 Output Styles Analysis

| Criteria | Check |
|----------|-------|
| **Use case clarity** | When should this style be applied? |
| **Conflict potential** | Does it conflict with other styles? |

#### 2.6 CLAUDE.md Analysis

| Criteria | Check |
|----------|-------|
| **Conciseness** | Is it under 300 lines? No redundant info? |
| **Actionability** | Are instructions clear and actionable? |
| **Conflicts** | Does it conflict with skill instructions? |

### Step 3: Context Usage Estimation

Estimate token usage for each component:

```
Token estimation formula:
- ~4 characters = 1 token (rough estimate)
- Metadata always loaded: name + description (~100-200 tokens each)
- Body loaded on trigger: full content
```

Calculate:
1. **Always-loaded tokens**: Sum of all metadata
2. **Frequently-loaded tokens**: Skills with "ALWAYS load" triggers
3. **On-demand tokens**: Skills with specific triggers

### Step 4: Generate Report

Output format:

```markdown
# Workflow Audit Report

## Summary

| Category | Count | Issues | Recommendations |
|----------|-------|--------|-----------------|
| Skills | X | Y | Z |
| Commands | X | Y | Z |
| Agents | X | Y | Z |
| Hooks | X | Y | Z |
| Output Styles | X | Y | Z |

## Context Budget Analysis

### Always-Loaded (~X tokens)
- CLAUDE.md: ~X tokens
- Skill metadata: ~X tokens (Y skills × ~100 tokens)
- Total baseline: ~X tokens

### Frequently-Loaded (~X tokens per session)
- skill-name-1 (ALWAYS load for frontend): ~X tokens
- skill-name-2 (ALWAYS load for React): ~X tokens

### On-Demand
- skill-name-3: ~X tokens (loads for specific trigger)

## Detailed Findings

### 🔴 Critical Issues
Issues that significantly impact performance or cause errors.

### 🟡 Improvements
Optimizations that would improve efficiency.

### 🟢 Best Practices Followed
Positive patterns worth maintaining.

## Recommendations

### High Priority
1. [Specific actionable recommendation]
   - **Impact**: [What improves]
   - **Effort**: [Low/Medium/High]

### Medium Priority
...

### Low Priority (Nice to Have)
...

## Overlap Analysis

### Potential Skill Overlaps
| Skills | Overlap Area | Recommendation |
|--------|--------------|----------------|
| A, B | frontend triggers | Consider merging or clarifying triggers |

### Command Redundancies
...

## Suggested Consolidations

If skills/commands can be merged:
- Merge `skill-a` + `skill-b` → `combined-skill` (saves ~X tokens)
```

---

## Advanced Mode

### Step 1: Gather Workflow Files

Same as Normal Mode Step 1 — read all workflow files.

### Step 1b: Triage Referenced Files Outside `.claude`

After reading the core `.claude` workflow files, collect file paths referenced from them and decide which ones to read based on audit value — not filename conventions.

**Step 1b-1: Extract referenced paths**

From all files read in Step 1, collect every local file path that appears as:
- `Read(file_path="...")`
- A markdown link `[label](path)`
- A plain path string pointing to a local `.md`, `.json`, `.yaml`, or config file

Normalize and deduplicate all paths. Only consider paths outside `.claude/` — files inside `.claude/` are already covered by Step 1.

**Step 1b-2: Classify by audit value, not by filename**

Assign each path to one of four groups:

| Group | Meaning | Action |
|-------|---------|--------|
| **Workflow Support** | Shared guidance used by the workflow to operate: templates, checklists, role definitions, reviewer/verifier instructions, shared standards, playbooks | Read |
| **Project-wide Standards** | Cross-cutting constraints that shape how agents work: architecture overview, coding conventions, testing strategy, repo rules, API standards | Read selectively |
| **Task / Content Doc** | Task-specific artifacts: feature specs, req outputs, dated notes, implementation plans, generated analysis, archive, sprint docs | Skip |
| **Unknown** | Cannot determine purpose confidently | Shallow peek, then decide |

**Decision rules**

Prefer **reading** when any of these are true:
- The file is referenced by `CLAUDE.md`
- The file is referenced by 2 or more workflow artifacts (commands/skills/agents)
- The file is used as a template, checklist, shared standard, or role definition
- The file appears cross-cutting — relevant to many tasks, not tied to one

Prefer **skipping** when any of these are true:
- The file is tied to a specific feature, requirement, sprint, or dated deliverable
- The file is generated output, historical archive, or implementation result
- The file remains unclear even after shallow inspection

**Handling Unknown files (shallow peek)**

If a referenced file cannot be confidently classified:

- Perform a shallow peek:
  - Read the title
  - Read headings
  - Read the first 20–40 lines
- Then re-classify the file into:
  - Workflow Support
  - Project-wide Standards
  - Task / Content Doc

Only skip if, after shallow inspection, the file still appears task-specific or irrelevant.

Do not skip Unknown files purely based on path or filename.

**Step 1b-3: Token and scope guard**

- Only follow references **one hop** from `.claude` files — do not recurse into external files' own references
- Read at most **6 external files** total in this phase
- For files longer than 300 lines, read only the first 80–120 lines plus any checklist/template/standards sections — full content is rarely needed
- Stop early if sufficient evidence for the checklist dimensions has already been gathered

**In the final report**, note which external files were included and which were skipped, with reason. This keeps the audit transparent.

### Step 2: Checklist Audit

Use the files gathered in Step 1 as evidence. For each dimension below, go through every checklist item and mark it **Pass**, **Partial**, **Fail**, or **N/A** based on what the files actually contain. Do not ask the user — derive findings from the config files.

**Scoring guidance**

- Pass: clearly satisfied with strong evidence from files
- Partial: partially implemented, implicit, or inconsistent across workflow artifacts
- Fail: missing or contradicted by workflow design
- N/A: not applicable for this workflow

---

#### 2.1 Requirement Understanding

> Goal: Does the workflow ensure the agent clarifies requirements before acting?

- [ ] The main instruction file (CLAUDE.md) explicitly instructs the agent to ask clarifying questions before coding
- [ ] There is at least one command, skill, or agent whose dedicated role is requirement clarification or analysis
- [ ] At least one command explicitly loads or references specs, tickets, requirement docs, or epics as input before acting
- [ ] The workflow distinguishes between confirmed facts and assumptions — either in CLAUDE.md or in a requirement-handling command

---

#### 2.2 Planning Quality

> Goal: Do plans cover scope, impacted surfaces, risks, and constraints?

- [ ] There is at least one command or skill whose purpose is generating a plan before implementation starts
- [ ] Planning output includes a list of files or modules expected to be impacted
- [ ] Planning output includes a risk, assumption, or rollback section
- [ ] Planning output specifies what is explicitly out of scope
- [ ] The plan is written to a persistent file before implementation begins, not kept only in context

---

#### 2.3 Context Handling

> Goal: Does the workflow ground decisions in real sources rather than hallucination?

- [ ] Large skill content is split into linked sub-documents rather than kept fully inline (progressive disclosure)
- [ ] Commands explicitly load external context — standards docs, wiki, specs, or codebase — before generating output
- [ ] There is a knowledge-base or wiki command/skill that agents can query for project context
- [ ] Skill trigger descriptions are specific enough to prevent loading the wrong skill for a given task

---

#### 2.4 Implementation Quality

> Goal: Is generated code minimal, targeted, and convention-compliant?

- [ ] There is a command or skill for automated code quality validation (linting, type checking, build verification)
- [ ] There is a command or skill for simplifying or refactoring code after implementation
- [ ] The main instruction file (CLAUDE.md) prohibits over-engineering and premature abstraction
- [ ] There is a bug-fixing command that enforces root-cause analysis rather than symptom patching

---

#### 2.5 Verification

> Goal: Is there a structured verify step before output is considered done?

- [ ] There is a command or skill for generating tests (unit, integration, or E2E)
- [ ] There is a command for executing tests and reporting results
- [ ] At least one command includes an explicit step to check against acceptance criteria before marking work done
- [ ] There is a hook or workflow gate that enforces verification before committing or creating a PR

---

#### 2.6 Review

> Goal: Can a reviewer understand the change without asking questions?

- [ ] There is a command or skill dedicated to code review
- [ ] The review command checks implementation against original requirements or acceptance criteria (not just code style)
- [ ] Review output explicitly covers root cause, fix approach, and blast radius / impact area
- [ ] There is a dedicated agent or command that verifies execution results against the plan before merging

---

#### 2.7 Cost Efficiency

> Goal: Is token usage proportional to value — no unnecessary always-loaded content?

- [ ] The always-loaded baseline (CLAUDE.md + all skill metadata) is under 5000 tokens
- [ ] Auto-loaded skill triggers are justified — each one loads only when genuinely needed, with no redundant overlaps
- [ ] Skill bodies that are large use linked sub-documents or references rather than keeping all content inline
- [ ] Skill descriptions are concise — short enough that metadata stays lightweight across many skills

---

#### 2.8 Team Fit

> Goal: Is the workflow learnable and reusable without relying on one person's prompt skills?

- [ ] Command and skill names clearly communicate their purpose without needing to read the full prompt
- [ ] The main instruction file (CLAUDE.md) is under 300 lines and written in plain language
- [ ] Every skill has a `description` field that explains when and when not to use it
- [ ] No command or skill silently depends on hidden context that only the original author knows

---

### Step 3: Generate Checklist Report

Output format:

```markdown
# Workflow Deep Audit Report

## Checklist Summary

| Dimension | Pass | Fail | N/A | Score |
|-----------|------|------|-----|-------|
| Requirement Understanding | X | X | X | X/4 |
| Planning Quality | X | X | X | X/5 |
| Context Handling | X | X | X | X/4 |
| Implementation Quality | X | X | X | X/4 |
| Verification | X | X | X | X/4 |
| Review | X | X | X | X/4 |
| Cost Efficiency | X | X | X | X/4 |
| Team Fit | X | X | X | X/4 |
| **Total** | | | | **X / 33** |

## Verdict

| Score | Assessment |
|-------|-----------|
| < 17 | Experimental only — high risk for real tasks |
| 17–23 | Usable for simple tasks, gaps in key areas |
| 24–29 | Strong — suitable for regular use |
| 30–33 | Excellent — ready to standardize for the team |

## Detailed Findings Per Dimension

For each dimension: list Pass items briefly, then explain each Fail with evidence from the files.

### Requirement Understanding
...

### Planning Quality
...

[repeat for all 8]

## Red Flags

List concrete evidence found in files:
- [file]: [specific issue]
- ...

## Priority Improvements

### High Impact
1. [Specific recommendation tied to a failed checklist item]
   - **Addresses**: [Dimension]
   - **Effort**: Low / Medium / High
   - **Evidence**: [File and line that shows the gap]

### Medium Impact
...

### Low Impact (Nice to Have)
...
```

---

## Shared Guidelines

### What Makes a Good Workflow

1. **Minimal always-loaded content**: Only essential instructions in CLAUDE.md
2. **Specific triggers**: Skills load only when truly needed
3. **No overlaps**: Each skill/command has unique purpose
4. **Progressive disclosure**: Large content split into references
5. **Lightweight hooks**: Fast execution, graceful failures
6. **Fact/assumption separation**: Agent always distinguishes known vs. inferred
7. **Verification gate**: Clear checklist before output is considered done
8. **Stable output**: Consistent quality across similar tasks

### Token Budget Guidelines (Normal Mode)

| Budget Level | Always-Loaded | Recommendation |
|--------------|---------------|----------------|
| Lean | < 2000 tokens | Excellent |
| Normal | 2000-5000 | Good |
| Heavy | 5000-10000 | Consider optimization |
| Bloated | > 10000 | Needs consolidation |

## Execution

1. Ask user to choose mode (Step 0)
2. Run corresponding analysis path
3. Generate report with findings
4. Offer to implement quick wins if user approves

# Step 1 Mockup: Claude Code Foundation

This file isolates Step 1 of the landing page guide so it can be expanded independently.

## Purpose

- Explain why the workflow starts from Claude Code
- Show the workflow primitives Claude Code already provides
- Frame Claude Code as the best starting point for designing a workflow that can later migrate to other tools

## Core Message

If the goal is to build a serious AI workflow, start from a tool that already exposes workflow concepts clearly.
Claude Code is a strong foundation because it has primitives like:

- commands
- skills
- sub agents
- hooks
- output styles

These concepts make it easier to design repeatable behavior.
Later, the same workflow ideas can be migrated into other tools.
The point is not that Claude Code is the only usable tool.
The point is that it is a very strong place to design the workflow shape first.

## Desktop Wireframe

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Step 1 of 4                                                [01][02][03][04]
│ Start with Claude Code if you want to build a serious workflow              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────┐    ┌────────────────────────────────┐ │
│  │ Short explanation                │    │ Graph: Claude Code primitives  │ │
│  │ - commands                       │    │                                │ │
│  │ - skills                         │    │ Claude Code                    │ │
│  │ - sub agents / hooks / styles    │    │  ├─ Commands                   │ │
│  │                                  │    │  ├─ Skills                     │ │
│  │ Why this matters                 │    │  ├─ Hooks                      │ │
│  │ Strong primitives make workflow  │    │  ├─ Output styles              │ │
│  │ design easier and more portable. │    │  └─ Sub agents                 │ │
│  │ Key takeaway                     │    │                                │ │
│  │ Start with the strongest base.   │    │ Highlight: "build here first"  │ │
│  └──────────────────────────────────┘    └────────────────────────────────┘ │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Real Example From This Workflow                                       │ │
│  │ Source: .claude/commands + .claude/skills + .claude/agents           │ │
│  │ [commands/] [skills/] [agents/]                                       │ │
│  │                                                                        │ │
│  │ Summary view: this workflow is composed from Claude Code concepts      │ │
│  │ that can later be adapted into other tools.                            │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  [ Prev disabled ]                                         [ Next ]        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Content Draft

### Step Label

`Step 1 of 4`

### Title

`Start with Claude Code if you want to build a serious workflow`

### Explanation

`If the goal is to design your own AI workflow, the first decision is the base agent. I recommend starting with Claude Code because it already exposes the right workflow concepts: sub agents, commands, skills, hooks, and output styles. Those primitives make it much easier to shape repeatable behavior instead of relying on giant prompts.`

### Why This Matters

`When a tool already has workflow building blocks, you can focus on designing the system instead of fighting the interface. Claude Code is a good starting point because the concepts are explicit and transferable.`

### Key Takeaway

`Claude Code is not the final destination. It is the strongest place to design the workflow first, then migrate it to other tools later.`

### Graph Idea

```text
Claude Code primitives
  -> Commands
  -> Skills
  -> Hooks
  -> Output styles
  -> Sub agents

These become the building blocks of the workflow.
```

## Landing Page Render Copy

### Main Copy

#### Title

`Start with a tool that already has workflow building blocks`

#### Body

`If you want to build your own AI workflow, the first decision is not the prompt. It is the base tool. Claude Code is a strong starting point because it already exposes concepts like commands, skills, hooks, output styles, and sub agents. Those concepts make workflow design much more concrete.`

#### Why It Matters

`When the tool already has clear workflow primitives, you spend less time fighting the interface and more time designing the system.`

#### Key Takeaway

`Claude Code is a strong place to design the workflow first, then migrate the same ideas elsewhere later.`

### Primitive-By-Primitive Copy

#### Commands

`A clear user entry point for repeatable workflows.`

#### Skills

`Reusable logic for tasks that appear again and again.`

#### Hooks

`A way to attach workflow behavior around events or execution boundaries.`

#### Output Styles

`A way to shape how Claude behaves in different working modes, like brainstorming before implementation.`

#### Sub Agents

`A way to split complex work into specialized roles instead of forcing everything through one generic response path.`

### Comparison Framing

#### Generic Chat Tool

`Good for quick help, but weak as a workflow foundation because the structure mostly lives in prompts and memory.`

#### Editor Extension

`Useful for convenience, but much of the workflow stays hidden inside editor UX instead of becoming explicit assets you can inspect and evolve.`

#### Claude Code

`Better for workflow design because commands, skills, output styles, and agent concepts are visible and file-based. That makes them easier to reason about, refine, and later migrate.`

## Example Source Candidates

- `.claude/commands/`
- `.claude/skills/`
- `.claude/output-styles/`
- `.claude/agents/`

## Example Panel Direction

### Rendering Rule

`Example` should load the exact file content from the real workflow, not a shortened excerpt.

### What To Show

- full file content for the selected example
- original file path
- syntax-highlighted view when possible

### Why It Matters

`This step should let the user inspect the real workflow surfaces directly. The point is not only to explain the concept. It is to prove that the workflow is grounded in actual files they can study and reuse.`

### UX Notes

- if multiple files are relevant, let the user switch between them with tabs
- keep the explanation panel separate from the raw file viewer
- large files should use a scrollable code panel instead of truncation

## Detailed Guidance

### Why Tool Choice Comes First

Before you define commands, write skills, or build review flows, you need a tool that can actually carry workflow structure.

That is why this step comes first.
If the base tool does not expose enough useful workflow concepts, the workflow becomes fragile very quickly.

In practice, that usually means:
- too much behavior stays inside long prompts
- too much context stays in one conversation
- too many working rules stay implicit instead of reusable

Claude Code is a strong starting point because many workflow ideas can be represented as explicit assets instead of being hidden in prompt improvisation.

### Why Claude Code Is A Strong Foundation

Claude Code gives you workflow primitives that map well to real process design:

- `commands`
  - explicit user entry points
- `skills`
  - reusable behavior modules
- `hooks`
  - automation around execution moments
- `output styles`
  - different working modes
- `sub agents`
  - role-based decomposition for more complex flows

This matters because a workflow becomes easier to design when the tool already has a language for structure.

### Why This Is Better Than Starting From Giant Prompts

When people try to build a workflow only with prompts, the system often becomes hard to maintain.

Problems:
- prompts become too large
- behavior becomes inconsistent across sessions
- reuse becomes weak
- debugging becomes difficult because the workflow is not represented as separate assets

Claude Code reduces this problem because the workflow can be split into named, inspectable pieces.

### Why Starting Here Makes Migration Easier Later

One of the strongest reasons to start from Claude Code is that the workflow concepts are transferable.

The exact syntax may differ by tool, but the underlying structure often survives:

- command-like entry points
- reusable instruction modules
- role-based decomposition
- different response or execution modes
- explicit operating rules

That means you can treat Claude Code as the design environment where the workflow becomes clear first.
After the workflow logic is proven, you can adapt it to other tools.

This is usually easier than starting from a weaker workflow surface and trying to invent structure later.

### Practical Comparison

#### Generic Chat Tool

Strength:
- fast to start
- low setup cost

Weakness:
- workflow usually lives in memory and prompt wording
- poor reuse
- weak inspectability
- hard to scale into a real system

#### Editor Extension

Strength:
- convenient for small coding interactions
- close to the editing surface

Weakness:
- workflow often gets mixed with editor UX
- harder to treat commands, rules, and behavior as explicit repo assets
- more hidden behavior, less system visibility

#### Claude Code

Strength:
- file-based assets
- explicit workflow primitives
- easier to reason about as a system
- easier to inspect, document, and evolve

Weakness:
- requires more intentional setup
- stronger structure means more design effort upfront

That trade-off is usually worth it if the goal is to build a serious reusable workflow rather than just get ad-hoc assistance.

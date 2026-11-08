---
name: brainstorm-partner
description: Use when the user wants a read-only thinking partner to break down a vague idea, hard bug, unclear feature logic, or difficult technical decision before implementation, or asks to be grilled ("grill me", "keep asking until it's clear") to settle feature logic or a design. Focus on dialogue, codebase inspection, grounded hypotheses, web research when needed, and concrete next steps without editing files.
---

# Brainstorm Partner

Use this skill as a discovery-first mode for messy or under-defined problems.

This skill is a good fit when the user wants to:
- brainstorm across multiple turns
- debug a hard issue before changing code
- shape a feature idea before implementation
- break a difficult task into smaller decisions
- compare realistic options with trade-offs
- settle every open decision in a feature or design before implementation (Grill mode)

## Modes

- **Explore** (default): the Core Workflow below, for vague ideas, hard bugs, and trade-off comparisons.
- **Grill** (opt-in): an exhaustive interview that settles feature logic or a design; see Grill Mode.

Start in Explore unless the user asks for Grill.

## Session Bootstrap

If the user is explicitly activating this as a mode, treat it as a thread-level contract until the user exits the mode or asks for implementation.

In the first response:
- state that you are in `Brainstorm Partner` mode and which mode is active (Explore or Grill)
- state that the mode is read-only
- state that you will inspect, analyze, ask clarifying questions, and use web research when needed
- state that you will not edit files or run workspace-modifying commands in this mode

Put this announcement at the top of the reply that carries your answer or first round, not only in text before tool calls; some callers see only the final reply.

This bootstrap matters because not all agent runtimes support persistent output-style or mode semantics natively. The conversation history becomes the mode anchor for later turns.

## Hard Boundary

Allowed:
- read files
- search the codebase
- inspect docs, configs, tests, logs, and existing behavior
- run commands that do not modify workspace state
- use web research when current external facts matter
- explain trade-offs and recommend next steps

Not allowed:
- edit files
- create files
- refactor or implement
- run commands with side effects such as builds, test runs, dev servers, installs, or generators unless the user explicitly changes scope

Both modes follow this boundary.

If the user asks for implementation:

> We are currently in Brainstorm Partner mode, which is read-only. I can keep investigating and help finalize the plan, or switch back to normal coding mode if you want changes made.

In Grill mode with decisions still open, follow Implementation requested while decisions remain open instead.

## Core Workflow

### 1. Clarify the real problem

Start by identifying:
- what the user is actually trying to solve
- what is already known
- what is verified vs assumed
- what is still unclear

In Explore mode, if missing context is critical, ask 1-3 concise questions before going deeper.

Good question types:
- expected behavior vs actual behavior
- reproduction conditions
- constraints and non-goals
- what changed
- what has already been tried

### 2. Investigate without changing anything

Inspect only the context needed to reduce ambiguity:
- relevant files
- adjacent modules
- configs
- tests
- logs or error output
- documentation

Prefer grounded observations over generic advice.

### 3. Break the problem down explicitly

When the situation is messy, structure the discussion around:
- problem statement
- known facts
- unknowns
- assumptions
- hypotheses
- options
- next step

For options, prefer 2-3 realistic directions with clear trade-offs.

### 4. Keep the conversation moving

Act like a thinking partner, not a static answer engine.

This means:
- restate the problem in sharper terms
- separate symptom from cause
- challenge weak assumptions politely
- narrow the search space
- recommend the most useful next question or read-only check

### 5. Use web research when it materially improves accuracy

Browse when:
- framework or library behavior may have changed
- the question depends on current best practices
- external APIs, versions, docs, or platform behavior matter

When browsing:
- prefer primary or official sources
- include links when they materially support the conclusion
- mention concrete versions or dates when recency matters
- clearly separate sourced facts from your own inference

## Grill Mode

### Entry

Enter Grill only when the user explicitly asks, such as "grill me" or "keep asking until it's clear", or accepts your offer to switch.
Never enter it on your own: outside Grill, the minimal-questions default still applies.

### Before round 1

Read the repository's recorded intent when it exists, and drop branches it already answers:
- `docs/DECISIONS.md`, `docs/PRODUCT.md`, and `docs/DESIGN.md`
- in older installations, `docs/decisions/` and `docs/product/`

When none exist, use the code and README instead; this skill must also work in repositories without that layout.

### Facts, decisions, and assumptions

- Facts the repository or environment can answer: look them up yourself and never ask the user.
- Decisions that change externally observable behavior, such as product rules, permissions, limits, or user-facing states: ask the user.
  Where a rule is enforced, such as client or server, and which data reaches which role also count as externally observable.
  So does anything a user sees in produced output, such as file names, columns, value formats, or escaping.
- Technical choices that do not change externally observable behavior: pick one yourself and state it as an assumption.

When no recorded decision covers access to sensitive data, such as personal or financial data, do not recommend widening it: mark the most restrictive option ★ or list the options without one.

A fact still being looked up blocks only the questions that depend on it; ask the rest meanwhile.

### Rounds

Model the open decisions as a tree in which a decision unlocks the decisions that depend on it.
Each round asks the whole frontier, meaning every open decision whose prerequisites are settled, numbered.
Defer questions that depend on an unanswered one, and name them as coming in a later round.

Ask one decision per question, and make each option a single outcome; never put "X or Y" inside one option.
Word each question in one of two ways:
- When one answer is clearly sensible, word it so a plain "yes" accepts that recommendation; never use this form for widening access to sensitive data.
- When there are real alternatives, even only two, list them as `a`, `b`, `c` with exactly one marked ★ as the recommendation; never invent custom answer tokens.

Before the questions, list the facts you checked and the assumptions you made.
Tell the user they can answer compactly, such as `1a 2b 3 yes`, or `ok` to accept every recommendation.
An `ok` or `yes` is the user's decision, not a default.
It answers the open questions only: it never leaves read-only mode, and the round after an `ok` continues Grill or reaches Exit.

### Implementation requested while decisions remain open

Do not settle a question that was never asked.
List the open questions, then offer separate numbered choices:
1. Answer them and continue Grill.
2. Accept every ★ and continue Grill, still read-only; later rounds ask any questions those answers unlock.
3. Leave read-only mode now, with every remaining question listed as your assumption.

Never offer a choice that combines accepting recommendations with leaving read-only mode.

### Exit

Grill ends when no open decision remains.
Then:
1. Summarize every settled decision, separating those the user decided from those you assumed.
2. State that nothing has been written to the repository.
3. Offer numbered next steps with one ★, such as leaving read-only mode to record lasting decisions through `manage-project-knowledge` or a proposal, leaving it to implement, or continuing to grill an area still worth probing.

Leaving read-only mode needs its own explicit choice: the number of that step, or words such as "implement" or "record".
A bare `ok` or `yes` after Exit does not pick a step; ask which one.
Do not record or implement anything until the user makes that choice.
The user can leave Grill at any time; then return to Explore.

## Guidance by Use Case

### Vague idea

Help turn it into something actionable:
- define the user problem
- identify assumptions
- sketch the smallest viable version
- surface open questions and complexity traps

### Hard bug

Treat it like guided root-cause analysis:
- restate the symptom precisely
- identify likely layers involved
- rank likely causes instead of listing many guesses
- ask for evidence that rules hypotheses in or out

### Unclear feature logic

Focus on behavior before implementation:
- user flow
- decision points
- inputs and outputs
- business rules
- edge cases
- failure states
- MVP boundary

When several of these remain open decisions, offer Grill mode as a choice; do not switch on your own.

### Difficult technical decision

Offer a small set of realistic options:
- explain trade-offs plainly
- tie recommendations to actual constraints
- avoid idealized architecture detached from context

## Response Style

Do not force a rigid template. Keep the response conversational, but make the reasoning easy to inspect.

Use some of these sections when helpful:
- `What I think you're solving`
- `What I can verify now`
- `What's still unclear`
- `Possible directions`
- `Recommended next step`
- `Confidence`

Short replies are fine when the issue is simple. Use a more explicit breakdown when ambiguity is high.

## Default Response Shape

Use this pattern when it helps, not as a hard requirement:

```md
What I think you're solving:
- [short restatement]

What I know so far:
- [verified fact]
- [verified fact]

What's still unclear:
- [missing context or open question]

Possible directions:
1. [Option A] - Pros: [...] Cons: [...]
2. [Option B] - Pros: [...] Cons: [...]

Recommended next step:
- [best read-only next move]
```

If the missing context is critical, stop after the clarification step and ask the user before going further.

## Quality Bar

A good response with this skill should:
- make the problem clearer than before
- reduce ambiguity instead of hiding it
- stay read-only
- avoid premature implementation
- give the user a concrete next thinking step
- in Grill, leave no open decision silently assumed

If the user wants this mode to persist across the thread, honor that until they explicitly switch modes.

## Credits

Grill mode is adapted from the `grilling` skill in [mattpocock/skills](https://github.com/mattpocock/skills) (MIT).

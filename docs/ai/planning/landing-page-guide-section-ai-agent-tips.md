# Section Mockup: Tips When Working With AI Agents

This file isolates the post-guide tips section so it can be expanded independently.

## Purpose

- teach practical operating habits that improve real AI-agent usage
- help users avoid common failure modes after they copy the workflow structure

## Core Message

A workflow alone is not enough.
Users also need operating habits that keep the AI useful in practice.

The two most important habits in this section are:

- avoid hallucination by improving evidence quality
- manage context window intentionally instead of letting one chat grow forever

## UI Direction

Use 2 large cards:

- `Avoid Hallucination`
- `Manage Context Window`

Each card should include:

- problem
- why it happens
- practical fix

## Landing Page Render Copy

### Section Title

`Tips When Working With AI Agents`

### Section Intro

`Even a good workflow breaks down if the operator habits are weak. These two patterns matter more than most people expect: avoiding hallucination and managing context window intentionally.`

## Topic A: Avoiding AI Agent Hallucination

### Main Point

Hallucination often appears in two common cases:

- the user does not provide enough information
- the agent starts making assumptions instead of asking back

### Why It Happens

- underspecified prompts create gaps
- AI agents sometimes fill those gaps with confident assumptions
- the answer can look polished even when the reasoning is weak

### Practical Fixes

- provide enough context up front
- define requirements, constraints, and expected behavior clearly
- if an answer sounds too confident, ask the agent for:
  - source
  - evidence
  - relevant code snippet
  - exact file path
- ask another agent or review flow to verify the claim again

### Suggested Render Copy

`AI agents often hallucinate when the prompt is underspecified. If the user does not provide enough information, the agent may fill the gaps with assumptions instead of asking back. A practical defense is to ask for evidence: source, file path, relevant code, or another review pass from a second agent.`

## Topic B: Managing Context Window

### Main Point

Context quality is one of the most important factors when working with AI agents.

### Why It Matters

- when context fills up, the agent may compact memory
- compacted memory can cause it to forget earlier details
- output quality often drops after long sessions

### Recommended Habit

- open a new chat session for each major phase
- do not force the entire workflow into one endless session

### Why This Helps

- reduces context drift
- makes the active task clearer
- can be cheaper than keeping one long session alive, because long sessions resend large history repeatedly

### Suggested Render Copy

`Context management matters more than most users expect. As a session gets longer, the agent may compact context and lose important details. A practical habit is to open a fresh session for each major phase. That usually keeps quality higher and can even save quota compared with dragging one huge chat across the whole workflow.`

## Expansion Notes

- This section may later add a third card for `verification habits`
- If needed, add one concrete example showing how a weak prompt caused a bad assumption

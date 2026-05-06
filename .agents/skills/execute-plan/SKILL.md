---
name: execute-plan
description: Use when the user asks to execute, run, or implement a plan. Executes tasks from a plan file and updates checkboxes.
---

# Execute Plan

Execute the plan file provided.

## Input

Path to plan file (e.g. docs/ai/plans/{feature-name}.md)

## Parent Plan Handling

If parent plan (has ## Phases section): read phase index, then read each child file before executing that phase.

## Process Per Task

1. [DISCOVER] tasks: list files to be touched, output list before coding
2. Find similar existing files in codebase to use as pattern reference
3. If pattern not found in CLAUDE.md or codebase -> ask, do not assume
4. Implement using apply_patch for edits
5. Mark task done: [ ] -> [x] in plan file

## After All Phases

Write summary to docs/ai/summaries/{feature-name}.md

## Rules

- Execute all phases from start to finish
- Do not touch files outside scope of current task
- If blocked (open question, missing context) -> stop and report, do not guess

## Summary Format

```markdown
## Done
- [what was implemented, mapped to AC numbers]

## Not Done / Blocked
- [what was skipped and why]

## Verified
- AC1 [symbol] / AC2 [symbol] ...

## Not Verified
- AC3 [symbol] [reason]
```

## Summary Rules

- AC pass only if: test passed (show output) OR human explicitly confirmed
- AC fail if: not tested yet, test skipped, or test failed
- Claude never self-judges AC as passed - evidence required
- If no test exists for an AC -> "No test coverage"
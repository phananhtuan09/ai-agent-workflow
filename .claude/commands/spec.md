Create a spec file for the described feature.

PROCESS:
1. Evaluate if the description already covers: problem, solution,
   edge cases, out of scope
2. If sufficient → write spec directly, note "No questions needed —
   proceeding with provided context"
3. If gaps exist → ask only missing questions (max 5),
   batch into one block, wait for answers
4. Write spec file to docs/ai/specs/{feature-name}.md

SPEC FORMAT (≤ 40 lines, business logic only — no tech details):

## Problem
[1-2 sentences: what is broken or missing]

## Solution
[2-3 sentences: what the feature does, not how to build it]

## Acceptance Criteria
- [ ] AC1: ...
- [ ] AC2: ...
- [ ] AC3: ...

## Out of Scope
- ...

## Open Questions
- ...

RULES:
- All output files must be written in English
- No technology, framework, or implementation details
- No project context (already in CLAUDE.md)
- AC must be verifiable — "user can X" not "system should Y"
- If something is unclear after answers → list in Open Questions,
  do not assume
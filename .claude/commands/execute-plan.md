Execute the plan file provided.

INPUT: path to plan file (e.g. docs/ai/plans/{feature-name}.md)

If parent plan (has ## Phases section): read phase index, then read each
child file before executing that phase.

PROCESS PER TASK:
1. [DISCOVER] tasks: list files to be touched, output list before coding
2. Find similar existing files in codebase to use as pattern reference
3. If pattern not found in CLAUDE.md or codebase → ask, do not assume
4. Implement
5. Use Edit tool to mark task done: [ ] → [x] in plan file

After all phases complete → write summary to
docs/ai/summaries/{feature-name}.md

RULES:
- Execute all phases from start to finish
- Do not touch files outside scope of current task
- If blocked (open question, missing context) → stop and report, do not guess

SUMMARY FORMAT:

## Done
- [what was implemented, mapped to AC numbers]

## Not Done / Blocked
- [what was skipped and why]

## Verified
- AC1 ✅ / AC2 ✅ ...

## Not Verified
- AC3 ⚠️ [reason]

SUMMARY RULES:
- AC ✅ only if: test passed (show output) OR human explicitly confirmed
- AC ⚠️ if: not tested yet, test skipped, or test failed
- Claude never self-judges AC as passed — evidence required
- If no test exists for an AC → ⚠️ "No test coverage"
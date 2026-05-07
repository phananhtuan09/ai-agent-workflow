Execute the plan file provided.

INPUT: path to plan file (e.g. docs/ai/plans/{feature-name}.md)

---

HARD CONSTRAINTS — non-negotiable:
- Do NOT explore the codebase broadly before starting
- Do NOT spawn parallel agents or run parallel discovery
- Do NOT read files not listed in the details file for the current phase
- Read file content only when executing the specific task that needs it
- Max 5 files read per task

---

STARTUP:
1. Read plan file
2. Check for ## Enrich Summary section:
   - If MISSING → Inline mode (see INLINE MODE below)
   - If PRESENT → Enriched mode (continue steps 3–5)
3. Read total file count from ## Enrich Summary
4. If plan has 2+ phases AND total files > 10 → ask human:
   "This plan touches {N} files across {X} phases.
    Run all phases in one session, or one phase at a time? (all / phase-by-phase)"
   Store the answer as {run_mode}.
5. If plan has 1 phase OR total files ≤ 10 → set {run_mode} = all, begin immediately

---

ENRICHED MODE — PROCESS PER PHASE:
1. Read docs/ai/plans/{name}-phase-{N}-details.md
2. For each task:
   a. Identify files listed in details file for this task
   b. Open only those files
   c. Find 1 similar existing file as pattern reference if needed
   d. If pattern not found in CLAUDE.md or codebase → ask, do not assume
   e. Implement
   f. Mark task done in plan file: [ ] → [x]

PHASE TRANSITION:
- If {run_mode} = all → proceed to next phase immediately, no checkpoint
- If {run_mode} = phase-by-phase → after each phase print:
  "Phase {N} complete.
   Done: [list what was implemented]
   Files changed: [list files]
   Reply 'continue' to proceed to Phase {N+1}, or give feedback."
  Then wait for explicit 'continue' before proceeding.
  If feedback given → address it, then re-output the checkpoint message.

---

INLINE MODE (no Enrich Summary):
- Plan has 1 phase and ≤ 5 tasks — execute immediately, no questions
- Allowed to grep by task keywords to locate relevant files (max 3 files read per task)
- No details file required — use task descriptions as sole guide
- No phase checkpoint

---

AFTER ALL PHASES COMPLETE:
Write summary to docs/ai/summaries/{feature-name}.md

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
- Never self-judge AC as passed — evidence required
- If no test exists for an AC → ⚠️ "No test coverage"

---

BLOCKED RULE:
If blocked (open question, ambiguous pattern, missing context):
- Stop immediately
- Report: what the blocker is, which task it affects, what info is needed
- Do not guess or assume — wait for human input

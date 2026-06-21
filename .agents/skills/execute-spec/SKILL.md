---
name: execute-spec
description: Use when the user asks to implement a feature or user-visible bug fix from a spec file. Executes directly from the spec and writes an implementation summary.
---

# Execute Spec

Execute the spec file provided.

## Input

Path to spec file (e.g. `docs/ai/specs/{feature-name}.md`)

## Hard Constraints — non-negotiable

- Read the spec before making code changes
- Treat the spec as the source of truth for behavior
- Do NOT create durable plan artifacts by default
- Do NOT invent new product behavior during execution
- If the spec is missing a required product decision, stop and ask
- If the spec turns out to be too broad for one safe implementation pass, stop and send the work back to `Decide`
- Use only lightweight local exploration needed to implement the current change safely

## Startup

1. Read the spec file completely
2. Identify the acceptance criteria, behavioral rules, technical approach, and open questions
3. If critical product behavior is unresolved:
   - Stop and ask instead of guessing
4. If the spec is executable:
   - Implement directly from the spec
5. If the spec is executable in principle but too broad, too mixed, or not sliceable in one pass:
   - Stop
   - Report that execution should return to `Decide`
   - Point to the relevant ACs or sections causing the problem

## Execution Process

1. Use the spec as the only durable execution contract
2. Break the work into temporary internal steps only as needed
3. Explore the nearby codebase just enough to implement safely
4. Reuse existing repository patterns when possible
5. Validate changed behavior where practical
6. Record important implementation decisions for later spec sync
7. Do not invent thresholds, scoring weights, ranking formulas, fairness rules, or tie-breakers in code unless they already exist in the spec or are explicitly recorded under `## Agent Constraints Chosen For This Slice`
8. If execution requires choosing one of those rules to complete the slice safely, record it explicitly for later sync instead of leaving it implicit in code
9. If the spec says the logic should be transparent, visible, simple, or non-hidden, do not implement it as an opaque weighted score or hidden heuristic
10. In those cases, prefer readable rule chains, named tie-breakers, or UI-visible reasons that can be traced back to the spec

## Iterative Feedback

- Human feedback may trigger additional edit turns after the initial implementation
- Continue refining the code until the requested behavior settles
- Do not rewrite the spec automatically during these turns unless the user explicitly asks
- Do not silently absorb extra scope discovered during execution; send it back to `Decide`
- When the code has stabilized, run `/sync-spec`

## After Execution

Write summary to `docs/ai/summaries/{feature-name}.md`

## Summary Format

```markdown
## Done
- [implemented behavior or technical change]

## Not Done / Blocked
- [what remains and why]

## Decisions
- [important implementation or architecture decision]

## Verified
- AC1 ✅ / AC2 ✅ ...

## Not Verified
- AC3 ⚠️ [reason]
```

## Summary Rules

- `## Verified` may include only checks actually executed during implementation
- `## Not Verified` must list pending checks, manual-only checks, blocked checks, or checks intentionally deferred to verification
- Never list the same AC or claim in both `## Verified` and `## Not Verified`
- Never mark an AC as verified based only on intent
- If implementation confidence comes from code inspection, say so explicitly instead of implying runtime proof
- If no automated test exists, say `No automated coverage`
- The summary is an execution handoff artifact, not the final verification artifact
- If later `/verify-feature` or `/verify-runtime` findings differ, the verification artifact is the source of truth

## Blocked Rule

If blocked by ambiguity, missing context, or unresolved spec behavior:
- Stop immediately
- Report what is blocked
- Point to the affected acceptance criterion or section
- Ask only for the missing decision

If blocked because the spec is too broad or mixes multiple slices:
- Stop immediately
- Report that the spec should be split
- Point to the affected sections or AC groups
- Recommend returning to `Decide`

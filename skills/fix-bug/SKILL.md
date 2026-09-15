---
name: fix-bug
description: Use when the user asks to fix a bug, investigate a broken behavior, or trace an error. Follows reproduce → isolate root cause → minimal fix → regression prevention discipline. Do not use for feature changes or refactoring.
---

# Fix Bug

Fix the reported bug with strict scope control and repository-appropriate proof.
For diagnosis-only requests, investigate and report without implementing a fix.
An explicit fix request authorizes necessary scoped implementation; do not ask for the same permission again.
Follow repository authority and reuse existing implementation and verification patterns.
Do not require a workflow artifact or durable plan for bounded work.

## Inputs

- Bug description: expected behavior, actual behavior, trigger condition
- Optional: error logs, stack trace, failing test, or reproduction steps
- Optional: specific file or module suspected to contain the issue

## Tool Mapping

- File inspection/edit tools -> inspect files with the runtime's read/edit/write tools and prefer precise targeted edits over broad rewrites
- Search tools -> use repository search to trace symbols, callers, and related paths
- User clarification -> ask the user directly when the reproduction path is missing or assumptions would change the fix
- Shell/validation tools -> run tests or build commands when shell execution is available and appropriate

## Workflow

### 1. Clarify bug shape

Use the request, code, tests, configuration, and available logs to establish:

- **Expected behavior**: what should happen?
- **Actual behavior**: what happens instead?
- **Trigger condition**: under what inputs / state / sequence?
- **Reproduction path**: can it be reproduced reliably?
- **Environment**: which OS, runtime version, config, or deployment environment? Does it occur in all environments or only specific ones?

Inspect available evidence before asking for facts the repository can provide.
Ask only when missing information materially changes the intended correction or prevents further useful investigation.

### 2. Reproduce

Attempt to reproduce using the provided trigger condition.
Prefer an existing E2E path when it exercises the failure and its environment is available.
If E2E is unavailable, state the constraint and choose focused integration, unit, or runtime evidence.

- **Reproduced**: document exact steps and continue.
- **Not reproduced**:
  1. State what was attempted and that the original failure remains unverified.
  2. Continue safe investigation using available code, logs, tests, and configuration.
  3. Distinguish hypotheses from established facts.
  4. Implement only when evidence supports a concrete defect and intended correction within the authorized scope.
  5. Otherwise request the smallest missing evidence or decision; do not ask for blanket permission to speculate.

### 3. Isolate root cause

Trace the issue from its first divergence.
Use the following distinctions when they clarify the cause; a simple defect does not require three separate labels:

| Layer | Description |
|-------|-------------|
| **Symptom** | Visible wrong behavior |
| **Immediate cause** | Direct code failure |
| **Underlying cause** | Why the immediate cause exists |

**Start from the trigger condition and trace backward**: identify where the actual state first diverges from expected, then follow the call chain upstream to the root.

Use `rg` to trace call sites, event handlers, config references, and related symbols.

### 4. Choose fix strategy

Select the most minimal strategy that addresses the underlying cause:

1. **Minimal safe fix** — targeted change, no behavior change outside bug scope *(prefer)*
2. **Slightly broader fix** — only if minimal fix treats a symptom rather than the cause
3. **Structural fix** — include necessary local restructuring when it remains within the authorized bug scope; ask only if material behavior or scope decisions remain unresolved

Do not change behavior outside bug scope unless explicitly justified.

### 5. Implement

Apply only the changes necessary. Use the runtime's precise file editing tools for targeted edits.

Rules:
- Do not reformat or reorganize code unrelated to the fix.
- If other bugs are noticed inline, note them — do not fix them here.

### 6. Regression prevention

Before closing, verify:

- [ ] Is there an existing test that should have caught this? Why didn't it?
- [ ] Should a new test be added? **If yes, add it now** unless the user explicitly asks to defer.
- [ ] Can this bug recur via a similar path elsewhere?
- [ ] Should logging be added at the failure point?

### 7. Output summary

For small fixes, report the cause, correction, observed before/after evidence, and material limitations briefly.
Use the template below only when the change's complexity warrants it.
Repeat the original failing scenario after the fix when feasible, and check adjacent paths when the cause or correction is shared.
Passing general checks alone does not prove an unreproduced bug is resolved.

```
## Bug Fix Summary

**Bug**: [one-line description]
**Reproduction**: [steps or "could not reproduce — confidence low"]
**Environment**: [OS, runtime version, config — or "all environments"]
**Root cause**:
  - Symptom: [...]
  - Immediate cause: [...]
  - Underlying cause: [...]
**Fix applied**: [what changed and why this strategy was chosen]

**Impact**:
  - Files changed: [list with brief reason each was touched]
  - Behavior changed: [exactly what changed from the user's perspective]
  - Blast radius:
    - L1 direct: [modules that call the changed code]
    - L2 transitive: [callers of L1 if impact propagates]
    - L3 shared infra: [config / DB / event bus — only if touched]

**How to verify**:
  1. Reproduce the original trigger → expect bug gone
  2. Run: [specific test file or command]
  3. Check manually: [specific screen / endpoint / state]
  4. Check adjacent paths: [similar code that may carry the same bug]

**Residual risks**: [known limitations or similar paths not yet addressed]
**Follow-ups**: [deferred issues noted during fix]
```

## When To Ask The User

Ask only when:
- Reproduction path is missing and speculation would change the fix
- Necessary restructuring would materially expand the authorized behavior or scope
- Multiple conflicting hypotheses exist and evidence cannot distinguish them

## Quality Bar

- Do not turn a bugfix into a refactor
- Do not change behavior outside the confirmed bug scope
- If not reproduced, state confidence explicitly — never present speculative analysis as fact
- Report material residual risks and follow-ups without adding empty report sections

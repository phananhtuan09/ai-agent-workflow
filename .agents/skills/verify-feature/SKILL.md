---
name: verify-feature
description: Use when the user asks to verify, check, or validate a feature against its latest synced spec. Generates a verification checklist, then continues with implementation verification instead of stopping at file creation.
---

# Verify Feature

Read the latest synced spec file and generate a verification checklist.

## Input

- Required: path to spec file (e.g. `docs/ai/specs/{feature-name}.md`)
- Optional: summary path (e.g. `docs/ai/summaries/{feature-name}.md`)
- Optional: focused file or module scope when the feature touches a narrow area

## Output

Write to: `docs/ai/verifications/{feature-name}.md`

After creating the verification artifact, continue immediately with implementation verification for the relevant code paths and checks. Do not stop at scaffold creation.

## Verification Format

```markdown
## Source
docs/ai/specs/{feature-name}.md

## Manual Verification
[One test scenario per AC - written as step-by-step human action]
- [ ] AC1: [action] -> [expected result]
- [ ] AC2: [action] -> [expected result]

## Automated Verification
- [ ] Unit: [what to test]
- [ ] Integration: [what to test]

## Edge Cases
[Only from explicit AC conditions + Open Questions already answered]
- [ ] ...

## Excluded (Out of Scope)
[Items from spec's Out of Scope - listed so reviewer knows they are
intentionally not tested]
- ...
```

## Rules

- All output files must be written in English
- Treat the provided spec file as the latest durable source of truth
- Every AC must have at least one manual verification step
- Steps written as: "[do X] -> [expect Y]" - unambiguous, no interpretation
- Do not invent test cases beyond what ACs specify
- Out of Scope in spec -> excluded from verification, not edge case source
- Open Questions not yet answered -> flag as:
  "Unresolved - cannot verify until clarified"
- Do not create test scenarios for unresolved Open Questions
- After the file is created, continue with implementation verification and record actual findings or explicit `Blocked` reasons

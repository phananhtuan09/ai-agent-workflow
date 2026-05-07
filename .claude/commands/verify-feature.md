Read the spec file, generate a verification checklist.

INPUT: path to spec file (e.g. docs/ai/specs/{feature-name}.md)

OUTPUT: docs/ai/verifications/{feature-name}.md

VERIFICATION FORMAT:

## Source
docs/ai/specs/{feature-name}.md

## Manual Verification
[One test scenario per AC — written as step-by-step human action]
- [ ] AC1: [action] → [expected result]
- [ ] AC2: [action] → [expected result]

## Automated Verification
- [ ] Unit: [what to test]
- [ ] Integration: [what to test]

## Edge Cases
[Only from explicit AC conditions + Open Questions already answered]
- [ ] ...

## Excluded (Out of Scope)
[Items from spec's Out of Scope — listed so reviewer knows they are
intentionally not tested]
- ...

RULES:
- All output files must be written in English
- Every AC must have at least one manual verification step
- Steps written as: "[do X] → [expect Y]" — unambiguous, no interpretation
- Do not invent test cases beyond what ACs specify
- Out of Scope in spec → excluded from verification, not edge case source
- Open Questions not yet answered → flag as:
  ⚠️ "Unresolved — cannot verify until clarified"
- Do not create test scenarios for unresolved Open Questions

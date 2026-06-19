Verify runtime behavior against the latest synced spec after implementation verification is available.

INPUT:
- Required: spec path (e.g. docs/ai/specs/{feature-name}.md)
- Required: runtime target (for example `--url http://localhost:3000`)
- Optional: existing verification file (e.g. docs/ai/verifications/{feature-name}.md)
- Optional: auth or setup notes needed to reach the feature

OUTPUT: docs/ai/verifications/{feature-name}.md

RUNTIME WORKFLOW:
1. Read the synced spec.
2. Read the existing verification artifact if present.
3. Classify each acceptance criterion as:
   - Automatically verifiable
   - Manual-only
   - Blocked
4. Run bounded runtime checks only for observable behavior.
5. Record evidence, failures, and remaining manual follow-ups in the verification file.

RUNTIME OUTPUT FORMAT:

## Runtime Target
- URL / environment / setup notes actually used

## Runtime Coverage Matrix
| AC | Verification Type | Evidence | Result | Notes |
|---|---|---|---|---|
| AC1 | Browser flow | [what was observed] | Pass | [optional note] |

## Automated Runtime Checks
- [check actually executed] → [result]

## Manual Follow-ups
- [remaining manual-only or partially covered checks]

## Evidence Summary
- [logs, screenshots, responses, or observed UI states]

## Runtime Status
Pass | Fail | Partial | Blocked

RULES:
- All output files must be written in English
- Do not modify code, specs, or test files during runtime verification
- Do not claim verification for behavior that was not observed
- Use only these per-AC runtime results: `Pass`, `Fail`, `Partial`, `Blocked`, `Not automatically verifiable`
- Use `Not automatically verifiable` only for individual acceptance criteria, never for the final `## Runtime Status`
- If setup, auth, data, or environment prevents execution, mark the affected ACs as `Blocked`
- If an AC depends on behavior that cannot be observed directly at runtime, mark it as `Not automatically verifiable`
- Keep automation bounded; do not turn this command into a generic autonomous test orchestrator

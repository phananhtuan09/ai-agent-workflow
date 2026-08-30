# Evidence Rules

Consolidated rules for evidence classification, checklist status, and verification boundaries.
All verification skills read this file instead of defining rules locally.

## Evidence Status Icons

Icons are evidence classifications, not self-reported confidence.

- `🟢`: The exact testcase was executed and passed with direct evidence covering its stated action, expected result, preconditions, and required environment.
- `🟡`: Some evidence exists, but it is indirect, incomplete, narrower than the testcase, environment-limited, or still requires human judgment.
- `🔴`: The testcase was not run, failed, was blocked, has contradictory evidence, or cannot be evaluated because the spec is unclear.

## Rules That NEVER Produce Green

- Code inspection or an implementation that appears correct
- Lint, typecheck, build, or compilation success
- The agent's intention, reasoning, confidence, or expected implementation behavior
- A test that does not execute the exact testcase behavior
- One happy-path test used to claim negative, boundary, persistence, responsive, or fallback cases
- A mocked or narrower environment when the testcase requires a different real environment
- CSS declarations, design tokens, or component render output alone

## Test-Type-Specific Green Requirements

Each `test_type` defines what evidence is sufficient for green:

| test_type | Green requires | Yellow when |
|---|---|---|
| `code_test` | Test file exists, test passes, covers stated scenario with matching inputs/state/output | Test exists but covers narrower scenario, or uses mocks that don't match required environment |
| `build_check` | Tool output shows success with no errors | Tool output shows warnings but no errors |
| `runtime_e2e` | Browser screenshot, user action performed, expected state observed through configured driver | E2E covers only part of the testcase, or uses narrower dataset/viewport than required |
| `api_check` | Real API request sent, response matches expected schema and values | Response matches schema but values are partial |

## Downgrade Rules

- Later contradictory evidence must downgrade an existing `🟢` to `🟡` or `🔴`.
- One passing happy-path check must not change negative, boundary, persistence, responsive, fallback, or error-path testcases to green.
- Do not use one viewport, user role, dataset, happy path, or mocked dependency to mark broader testcase variants green.

## Percentage Rules

- Percentages use testcase count as denominator, not acceptance-criterion count.
- Green percentage = `green testcases / total testcases`.
- Yellow percentage = `yellow testcases / total testcases`.
- Red percentage = `red testcases / total testcases`.
- Round to nearest whole percent and always show exact fraction.
- An acceptance criterion is fully covered only when every testcase mapped to it is green.

## Checklist Mutation Rules

- Verification skills may update: icon, short AI verification note, summary counts, percentages, evidence path.
- Verification skills may remove an unchecked `[ ]` only when the testcase becomes green.
- Verification skills must never change `[ ]` to `[x]` or erase an existing `[x]`.
- Yellow and red testcases must retain their human task checkbox.
- Keep AI verification note to one short method-and-result phrase.
- Preserve testcase IDs, wording, expected results, order, and spec mappings.
- Preserve checklist Vietnamese section headings.

## Language Rules

- Write checklist content in Vietnamese.
- Write human-facing response in Vietnamese.
- Preserve testcase IDs, acceptance-criterion IDs, file paths, commands, code symbols, product names, and technical identifiers in original form.

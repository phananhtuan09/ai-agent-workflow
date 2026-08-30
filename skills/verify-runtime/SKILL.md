---
name: verify-runtime
description: Use when the user asks to run real browser-driven end-to-end verification against an approved spec and its structured testcase definitions. Loads the project E2E tool and environment definitions, exercises observable user flows through the configured browser tool, appends detailed evidence to the verification record without touching the checklist.
---

# Verify Runtime

Run browser-driven end-to-end verification for testcase types that require a real browser.

## Bundled Project Configuration

Read these files from this skill directory before planning or executing any testcase:

- `tools.yaml` defines the available E2E drivers and the default driver.
- `project.env` defines project runtime targets, startup settings, viewports, artifact location, and credential environment-variable names.

Treat these files as the project defaults.
Explicit orchestrator or command inputs may override matching non-secret values for the current run.
Do not silently choose an undeclared tool or invent missing project settings.
Each project may update both files to match its own stack and environment.

Parse `project.env` as dotenv-style data.
Do not execute or shell-source it.
Resolve secrets only from the process environment variables named by `E2E_ACCOUNT_PASSWORD_ENV` and `E2E_API_KEY_ENV`.
Never print, persist, screenshot, or return secret values.

## Input

- Required: testcase definitions path, for example `docs/ai/features/checklists/{feature-name}-testcases.json`.
- Required: approved spec path, for example `docs/ai/features/specs/{feature-name}.md`.
- Required: existing verification record path, for example `docs/ai/features/verifications/{feature-name}.md`.
- Required: readable `tools.yaml` and `project.env` files in this skill directory.
- Optional: explicit runtime target, tool, auth, fixture, or setup overrides for the current run.

## Output

Append detailed E2E evidence to `docs/ai/features/verifications/{feature-name}.md`.

**This skill does NOT modify the checklist.** The checklist is updated only by `verify-workflow` after all evidence is collected.

## Scope

This skill handles only `test_type: runtime_e2e` testcases.

Testcases with `test_type: code_test`, `build_check`, or `api_check` belong to `verify-feature`. Skip them entirely and record `skipped: {test_type} testcase, belongs to verify-feature` in the verification record.

## Source Of Truth And Ownership

- Treat the approved spec as the only source of truth for expected behavior.
- Treat testcase definitions as a projection of that spec.
- Use browser observations only as runtime evidence.
- Do not add, delete, split, merge, or rewrite testcase definitions from observed implementation behavior.
- Do not change expected results to match what the application currently does.
- If runtime behavior conflicts with the spec, record drift and mark the affected testcase red.
- If a required expected result is unclear, record a spec gap instead of guessing.

## End-To-End Definition

- Execute the tested behavior through the configured browser driver from the user-visible entry point.
- Verify the integrated application, including relevant UI state, navigation, browser-visible API traffic, persistence, and refresh behavior required by the testcase.
- Use real application routes and services from `project.env` unless the approved spec explicitly requires a mock or stub.
- Use direct API calls only for declared fixture setup or cleanup when that API interaction is not the behavior under test.
- Never use DOM injection, direct database mutation, internal state mutation, or route shortcuts to simulate the user action being verified.
- Do not substitute code inspection, unit tests, builds, lint output, or component rendering for E2E execution.
- Keep execution bounded to approved testcase definitions and the minimum setup, diagnostics, and cleanup needed to verify them.

## E2E Workflow

1. Read the testcase definitions JSON completely.
2. Read the approved spec completely.
3. Read the existing verification record if it exists.
4. Read `tools.yaml` and `project.env`.
5. Stop as blocked if a required artifact or configuration file is missing or unreadable.
6. Resolve the configured default tool and confirm that its declared MCP server or driver is available.
7. Resolve the base URL and other non-secret settings from explicit inputs first, then `project.env`.
8. Resolve required credentials from their named process environment variables without exposing their values.
9. Check the configured healthcheck or base URL.
10. If the target is unavailable and `E2E_START_COMMAND` is configured, run only that command and wait up to `E2E_START_TIMEOUT_SECONDS` for readiness.
11. Stop as blocked if the application, required account, test data, or selected browser driver is unavailable.
12. Filter testcases to `runtime_e2e` only.
13. For each testcase, read its `done_criteria` from the JSON.
14. Convert each testcase into a browser scenario without changing its action, expected result, preconditions, role, viewport, or data variants.
15. Use the configured browser driver to establish preconditions, perform user actions, and assert the exact expected result.
16. Inspect browser console errors and relevant network requests for each scenario.
17. Verify required persistence by revisiting, refreshing, or opening a clean browser context when the testcase requires it.
18. Capture the actual URL, viewport, role, test data identity, actions, assertions, visible result, network result, console result, and screenshot or artifact pointer.
19. Compare evidence against `done_criteria.required` — all items must be satisfied for green.
20. Check evidence against `done_criteria.not_sufficient` — if any item matches, evidence is insufficient.
21. Run declared cleanup when needed without deleting unrelated project or user data.
22. Append detailed evidence to the verification record.
23. Record `skipped: {test_type} testcase, belongs to verify-feature` for any skipped testcase.

## Browser Execution Rules

- Start from a clean browser context unless the testcase explicitly depends on an existing session.
- Authenticate through the UI when authentication is part of the testcase.
- Pre-authenticated state may be reused only when login is setup rather than the behavior under test, and the evidence must state that choice.
- Exercise every role, viewport, dataset, and branch explicitly required by the testcase.
- Use `E2E_DESKTOP_VIEWPORT` and `E2E_MOBILE_VIEWPORT` only as project test defaults when the spec does not mandate exact dimensions.
- Wait on observable readiness conditions instead of fixed sleeps whenever the driver supports it.
- Treat unexpected severe console errors, failed required requests, uncaught exceptions, or broken navigation as failures when they affect the tested flow.
- Do not mark a scenario passed if only the final UI state was observed without performing its required user actions.
- Do not continue destructive or state-changing scenarios when their exact target is ambiguous.

## Evidence Classification

Read `skills/verify-workflow/references/evidence-rules.md` for the complete evidence rules.

Key rule: evidence must match the testcase's `done_criteria.required` items. If the done_criteria requires "browser screenshot" and "user action performed" and you only captured a screenshot without performing the action, the evidence is insufficient — do not mark green.

## Verification Record Format

Append or update these sections in the verification record:

```markdown
## Runtime Verification — {timestamp}

### Sources
- Testcase definitions: docs/ai/features/checklists/{feature-name}-testcases.json
- Approved spec: docs/ai/features/specs/{feature-name}.md

### Runtime Target
- Tool / driver
- Base URL / API URL / healthcheck
- Browser, viewport, role, and setup actually used

### Runtime Testcase Evidence
| Testcase | Test type | Done criteria satisfied | E2E actions and assertions | Browser diagnostics | Artifact | Result |
|---|---|---|---|---|---|---|
| TC-001 | runtime_e2e | [list of satisfied criteria] | [user steps and observed result] | [network and console result] | [screenshot pointer] | Pass |

### Skipped (implementation-level)
- TC-002: code_test testcase, belongs to verify-feature

### Failed
- [testcase with concrete reason]

### Spec Gaps / Drift
- [runtime behavior that contradicts or is not defined by the spec]

### Coverage Summary
- Verified: {n}/{total}
- Skipped (implementation-level): {n}
- Failed: {n}
```

## Final Status Rules

- `Pass`: every `runtime_e2e` testcase passed with adequate direct browser evidence matching its done_criteria.
- `Partial`: meaningful browser evidence was collected but one or more testcases remain incomplete.
- `Fail`: at least one `runtime_e2e` testcase failed.
- `Blocked`: tool, application, auth, data, environment, or verification artifacts prevented meaningful E2E execution.

## Artifact Boundaries

- Do not modify code, tests, specs, or testcase definitions during E2E verification.
- Do not repair failures in this phase.
- Do not recreate the verification record from scratch.
- Do not write secrets into artifacts, logs, screenshots, commands, or final output.
- Do not touch the checklist file.
- Keep automation bounded to the approved testcase definitions.

## Orchestrator Contract

When this skill is run under `/orchestrator`, append exactly one HTML comment as the final output line:

- Final status `Pass` or `Partial`:
  `<!-- orchestrator: outcome=continue provides=verification_path verification_path=docs/ai/features/verifications/{feature-name}.md -->`
- Final status `Fail`:
  `<!-- orchestrator: outcome=stop-fail -->`
- Final status `Blocked`:
  `<!-- orchestrator: outcome=stop-blocked -->`

Rules:

- Emit the comment only after the verification record has been updated.
- `verification_path` must match the file actually written or updated.
- If this skill runs standalone, the comment is optional.

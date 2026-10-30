# Project Runtime E2E Reference

This file is a project-local operational reference. Complete it after installing the
skill, keep commands and paths current, and never store secret values here.

- Status: UNCONFIGURED
- Maintainer: —
- Last verified: —
- Applies to: —

Use `Status: READY` only after the preflight commands and environment assumptions
below have been verified in this project.

## Runtime topology

List only services required for runtime E2E verification. Prefer links to an
existing runbook over duplicated instructions.

| Service | Working directory | Start command | Ready signal | Stop/reset command | Log location |
| --- | --- | --- | --- | --- | --- |
| `<web>` | `<path>` | `<command>` | `<URL, port, or log pattern>` | `<command>` | `<path or command>` |
| `<api>` | `<path>` | `<command>` | `<URL, port, or log pattern>` | `<command>` | `<path or command>` |

## Environment

- Runtime profile: `<local, staging, isolated test environment, etc.>`
- Environment file or setup command: `<path or command>`
- Required variable names: `<names only; never values>`
- Secret acquisition method: `<approved secret manager or human-provided session>`
- Allowed external dependencies: `<services that may be contacted>`
- Prohibited targets: `<production or shared environments that must not be used>`
- Configuration identity to record in plans: `<version, profile, image tag, etc.>`

## Existing E2E entrypoints

- Full-suite command: `<command or NOT_AVAILABLE>`
- Focused-case command/filter: `<command syntax or NOT_AVAILABLE>`
- Browser harness: `<existing Playwright Test configuration and version>`
- Runtime artifacts produced by the harness: `<paths>`

Existing automated E2E commands may execute cases, but the plan ledger remains the
source for declared paths, observed outcomes, and evidence.

## UI and authentication

- Application URL: `<URL>`
- Supported browser/device and viewport: `<value>`
- Authentication setup: `<fixture account, login flow, or approved session method>`
- Roles/accounts available: `<non-secret identifiers or fixture creation method>`
- Important user entrypoints: `<routes or navigation landmarks>`

## API and state observation

- API base URL: `<URL>`
- Health/readiness endpoint: `<method and route>`
- Request observation method: `<browser network, proxy, logs, tracing, etc.>`
- Correlation/trace lookup: `<method>`
- Persisted-state observation: `<supported API, UI reload, read-only query, etc.>`
- Forbidden shortcuts: `<direct writes, internal endpoints, or unsupported probes>`

## Fixtures and cleanup

- Seed/setup command: `<command or procedure>`
- Fixture namespace or identifier convention: `<value>`
- Required baseline data: `<description>`
- Cleanup command or procedure: `<value>`
- Isolation/concurrency constraints: `<value>`
- Recovery procedure after interruption: `<value>`

## Evidence conventions

- Artifact root: `<repository-relative or approved external path>`
- Screenshot/recording naming: `<pattern>`
- Runtime log references: `<path plus timestamp/correlation convention>`
- Request evidence: `<method, route, status, and identifier convention>`
- Retention or redaction rules: `<rules>`

## Safety constraints

- `<Data mutation boundaries>`
- `<Rate, cost, or external side-effect limits>`
- `<Required cleanup or rollback>`
- `<Actions requiring explicit human approval>`

## Preflight

Before setting `Status: READY`, verify:

- every required service can start and exposes the documented ready signal;
- the selected environment is permitted and distinguishable from production;
- required variable names are documented and their values are available securely;
- authentication and fixture setup work;
- evidence can be captured at the documented locations;
- cleanup restores the environment to its baseline;
- commands use repository-relative paths where practical.

## Known limitations

- `<Missing tooling, unsupported platform, flaky dependency, or NONE>`

## Playwright execution and audit

- Project root: `<directory containing the Playwright config>`
- Test/config/helper locations: `<existing project conventions>`
- Dependency/browser installation: `<approved command; never install implicitly>`
- Native execution command: `<argument array ending in Playwright test; no shell operators>`
- Evidence attachment policy: `<redaction and retention, including traces and screenshots>`
- Persistence proof: `<fresh API read, read-only DB query, or verified server-backed UI load>`

Use the skill's suite contract and evidence tool described in `playwright-contract.md`.
Launch a separate browser per invocation rather than attaching to a shared CDP session.
Tests must emit structured checkpoint observations, not screenshot-only proof.

## Base instance

Used when a suite declares `base` to prove that new-behavior tests can fail.

- Base environment: `<variable names and values that give the base instance its own ports and data, e.g. WEB_PORT, DATA_DIR>`
- Base setup: `<argument arrays run in the base worktree, e.g. dependency install, or NONE>`
- Base start limitations: `<revisions that cannot start, missing migrations, or NONE>`

## Existing test suites

Copied into a suite's `existing`; each suite runs on base and head so new failures are told apart from earlier ones.

| ID | Command (argument array) | Env | JUnit report |
| --- | --- | --- | --- |
| `<unit>` | `<e.g. ["npx", "vitest", "run", "--reporter=junit", "--outputFile={report}"]>` | `<names and values, or NONE>` | `<how {report} is passed, or NOT_SUPPORTED>` |
| `<e2e>` | `<e.g. ["npx", "playwright", "test", "--reporter=junit"]>` | `<e.g. PLAYWRIGHT_JUNIT_OUTPUT_NAME={report}>` | `<how {report} is passed, or NOT_SUPPORTED>` |

- No suites: `<why the project has none, or NOT_APPLICABLE>`
- Smoke suite: `<ID of the existing suite that is the smoke suite, or NONE>`; existing suites run on every base comparison, so the smoke suite always runs.

## Regression

Copied into a suite's `regression`; `scripts/impact.py` walks the import graph from changed files back to these routes.

- Sources: `<directories with application code, e.g. ["src"]>`
- Import aliases: `<e.g. {"@/": "src/"}, or NONE>`
- Shared surfaces: `<globs for global CSS, i18n, store, API client, config, e.g. ["src/styles/**", "src/i18n/**"]>`
- Fan-in threshold: `<a changed file reaching more key routes than this is shared code, e.g. 3>`
- Regression budget: `<maximum shared-tier routes tested per run, e.g. 5>`

| Key route | Page file | URL to open in the sweep |
| --- | --- | --- |
| `<e.g. /invoices>` | `<e.g. src/pages/InvoicesPage.tsx>` | `<e.g. /invoices>` |
| `<e.g. /invoices/:id>` | `<e.g. src/pages/InvoicePage.tsx>` | `<e.g. /invoices/1 with seed data>` |

## Determinism

Copied into a suite's `determinism` so base and head differ only in behavior.

- Time freeze: `<variable and value, e.g. FIXED_NOW=2026-01-01T00:00:00Z, or browser-only via page.clock, or NOT_SUPPORTED>`
- Seed data: `<variable or setup step that loads identical data in every instance, or NOT_SUPPORTED>`
- Randomness: `<variable that seeds or stubs random values, or NOT_SUPPORTED>`
- Normalization rules: `<regular expressions for IDs, timestamps, and other per-instance values, with their replacements>`
- Determinism limits: `<anything above that is NOT_SUPPORTED, stated as a limit>`

## Parallel execution

- Isolation: `<isolated fixtures/accounts/databases OR serialized>`
- Run marker: `<use RUNTIME_E2E_RUN_ID in fixture identifiers>`
- Shared mutation lock: `<project-provided lock procedure or NOT_REQUIRED with reason>`
- Ports/service ownership: `<assigned ports and which process owns shutdown>`
- Interrupted-run recovery: `<scoped cleanup for a specific run marker>`

Unknown isolation means serialize mutation runs.
Browser contexts do not isolate database state or external side effects.
Never reset a shared database or stop services owned by another run.

## Security and performance probes

Used by `security-performance-check` for local/dev runtime probes.
Never put secret values here; name accounts and commands only.

- Allowed hosts: `<localhost / 127.0.0.1 / declared dev hostnames only; probes stop on any other host>`
- Test accounts per role: `<two same-role accounts that each own distinct data, plus one higher-privilege account; non-secret identifiers or fixture creation method>`
- Access-denied fingerprint: `<HTTP status and/or redirect location and/or response text that means "denied" in this app>`
- Data reset command: `<argument array or procedure that restores baseline data after probes that write>`
- Probe budget: `<maximum probe requests or flows per run, e.g. 30; stop and report probes not run: N when exhausted>`

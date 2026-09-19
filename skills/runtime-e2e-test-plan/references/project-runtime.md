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
- Browser/device harness: `<Playwright, app driver, manual browser, etc.>`
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

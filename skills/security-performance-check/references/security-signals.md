# Security signals

This file is project-customizable: add, remove, or reword rows, change a risk level, or tune paths.
An edited copy is kept by `update --apply`.
`scripts/check_findings.py signals` reads the table below; editing a row changes `signals_loaded[]` on the next run without touching `SKILL.md`.

Columns:

- `trigger`: `always` loads whenever the security track runs; `tag:<name>` loads only when a changed path matches that row's `paths/patterns` (there is no separate agent-tag pass).
- `paths/patterns`: comma-separated globs; `*` does not cross `/`, `**` does. A pattern without `/` matches the file name. For `always` rows these patterns do not gate loading; `matched_paths` still lists which changed paths hit them (and may be empty).
- `risk`: `high`, `med`, or `low`.
- `validator`: `deterministic` (script or unique marker), `agent` (reasoned judgment), or `none` (static note only).
- `do not flag`: exclusions the static and runtime passes must honor.

Keep `always` rows to two or three so the loaded context stays small.

Default matching also skips tests, fixtures, Cypress/Playwright e2e dirs, `*.cy.*`, `test-utils` / `test-helpers`, `__mocks__`, i18n/locale/translation files, `messages/*.json` locale catalogs, and similar non-executable assets (see `DEFAULT_PATH_EXCLUDES` in `check_findings.py`).

Pattern notes:

- `client-secrets` is limited to client-shipped surfaces (`src/`, `web/`, `client/`, `frontend/`, `public/`, client-like `app/` UI files, `*.html`, browser env/bundler config). Server-only trees are out of scope for this row.
- `open-redirect` targets redirect/navigation/auth entrypoints (`*redirect*`, `*navigate*`, `*router*`, `auth` / `login` / `oauth`) rather than every source file. The checker has no content-trigger mechanism yet; path globs are the gate.
- Path globs match case-insensitively (`**/*redirect*` matches `safeRedirect.ts`). Test helpers such as `test-utils.*` / `test_helpers.*` are excluded by default along with tests, fixtures, and i18n catalogs.

## Signals

| id | trigger | paths/patterns | risk | static check | runtime probe | validator | do not flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `authz-route` | always | `**/routes/**`, `**/api/**`, `**/controllers/**`, `**/handlers/**`, `**/server/**`, `**/backend/**`, `**/app/**`, `**/*route*.*`, `**/*handler*.*`, `**/*controller*.*` | high | Changed route or endpoint enforces server-side authorization for the required role; UI hiding alone is not enough. | Replay each changed request as higher-privilege, same-role other user, and unauthenticated; record `expected_access` / `observed_access` / `access_verdict` (required) per the evidence contract. Owner or higher-privilege reading allowed data is `allowed`, not `bypassed`. | agent | Tests, storybook, dead code, framework middleware that already rejects before the handler. |
| `object-id-access` | always | `**/api/**`, `**/routes/**`, `**/controllers/**`, `**/handlers/**`, `**/server/**`, `**/backend/**`, `**/serializers/**`, `**/dto/**`, `**/*route*.*`, `**/*handler*.*`, `**/*controller*.*`, `**/*.{ts,tsx,js,jsx,py,go}` | high | Object loaded by an ID from path, query, body, header, or cookie is scoped to the caller (owner or permitted role). | Account B requests account A's object by every ID location the change accepts; expect deny fingerprint. Record `expected_access` / `observed_access` / `access_verdict` (required); authorized callers are `allowed`. | agent | Public resources, admin-only list endpoints that intentionally return all rows, fixtures. |
| `markup-render` | tag:xss | `**/*.{tsx,jsx,vue,html,hbs,ejs}`, `**/templates/**`, `**/views/**` | high | User-controlled strings rendered as markup are escaped or sanitized by the framework or an approved library. | Submit a unique marker string into each changed input; count only if a dialog or script sink with that marker fires. | deterministic | Framework-escaped output (`textContent`, default JSX text), markdown pipelines with a known safe config, admin-only CMS with a documented HTML allowlist. |
| `open-redirect` | tag:redirect | `**/*redirect*`, `**/*navigate*`, `**/*router*`, `**/*routing*`, `**/auth/**`, `**/login/**`, `**/oauth/**` | med | Redirect targets from query, body, or header are constrained to an allowlist or same-origin relative paths. | Pass a local canary URL in each changed redirect parameter; count only if the browser lands on that canary. | deterministic | Internal post-login defaults with no user-controlled target, static asset redirects. |
| `upload-validation` | tag:upload | `**/*upload*`, `**/*multipart*`, `**/storage/**`, `**/files/**`, `**/media/**` | high | Upload handlers check content type and size on the server before storage. | Upload an oversize and a mismatched-type file through the changed path; expect rejection. | agent | Client-only size hints when the server enforces the same limits, virus-scan hooks already required by policy. |
| `client-secrets` | tag:secrets | `**/src/**/*.{ts,tsx,js,jsx,vue}`, `**/web/**/*.{ts,tsx,js,jsx,vue}`, `**/client/**/*.{ts,tsx,js,jsx,vue}`, `**/frontend/**/*.{ts,tsx,js,jsx,vue}`, `**/public/**/*`, `**/app/**/*.{tsx,jsx,vue,html}`, `**/*.html`, `**/.env*`, `**/webpack*.*`, `**/vite*.*`, `**/next.config.*` | high | Secrets, private keys, and server-only tokens do not appear in client bundles or public config shipped to the browser. | Build or inspect the client bundle for high-entropy values matching changed secret names; never exfiltrate them. | agent | Public publishable keys documented as client-safe, non-secret feature flags. |
| `sensitive-response` | tag:sensitive | `**/api/**`, `**/routes/**`, `**/controllers/**`, `**/handlers/**`, `**/server/**`, `**/backend/**`, `**/app/**`, `**/serializers/**`, `**/dto/**`, `**/graphql/**`, `**/*response*`, `**/*serializer*` | med | Responses omit password hashes, raw tokens, full payment PANs, and other sensitive fields the caller must not see. | Compare response bodies for changed endpoints across roles; flag fields present for a lower-privilege caller. Always run `scan-bodies` on every saved HAR even when this row is not loaded; record the scan in `summary.body_scan` or `body-scan.json`. | agent | Fields the role is authorized to read (document with `_spc_scan_allow` / `--allow`), intentionally public profiles, redacted previews. Password hashes and private keys are never exemptable. |
| `cookie-flags` | tag:session | `**/auth/**`, `**/session/**`, `**/cookies/**`, `**/middleware/**`, `**/*session*` | med | Session cookies set Secure, HttpOnly, and an explicit SameSite appropriate to the app. | Inspect Set-Cookie on the changed login or session path for the required flags. | deterministic | Non-session cookies documented as client-readable, CSRF double-submit cookies that must be JS-readable. |

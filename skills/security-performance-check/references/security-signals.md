# Security signals

This file is project-customizable: add, remove, or reword rows, change a risk level, or tune paths.
An edited copy is kept by `update --apply`.
`scripts/check_findings.py signals` reads the table below; editing a row changes `signals_loaded[]` on the next run without touching `SKILL.md`.

Columns:

- `trigger`: `always` loads whenever the security track runs; `tag:<name>` loads when a changed path matches `paths/patterns` (or when the agent tags the area).
- `paths/patterns`: comma-separated globs; `*` does not cross `/`, `**` does. A pattern without `/` matches the file name.
- `risk`: `high`, `med`, or `low`.
- `validator`: `deterministic` (script or unique marker), `agent` (reasoned judgment), or `none` (static note only).
- `do not flag`: exclusions the static and runtime passes must honor.

Keep `always` rows to two or three so the loaded context stays small.

## Signals

| id | trigger | paths/patterns | risk | static check | runtime probe | validator | do not flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `authz-route` | always | `**/routes/**`, `**/api/**`, `**/controllers/**`, `**/handlers/**`, `**/*route*.*`, `**/*handler*.*` | high | Changed route or endpoint enforces server-side authorization for the required role; UI hiding alone is not enough. | Replay each changed request as higher-privilege, same-role other user, and unauthenticated; classify with the access-denied fingerprint. | agent | Tests, storybook, dead code, framework middleware that already rejects before the handler. |
| `object-id-access` | always | `**/api/**`, `**/routes/**`, `**/controllers/**`, `**/handlers/**`, `**/*.{ts,tsx,js,jsx,py,go}` | high | Object loaded by an ID from path, query, body, header, or cookie is scoped to the caller (owner or permitted role). | Account B requests account A's object by every ID location the change accepts; expect deny fingerprint. | agent | Public resources, admin-only list endpoints that intentionally return all rows, fixtures. |
| `markup-render` | tag:xss | `**/*.{tsx,jsx,vue,html,hbs,ejs}`, `**/templates/**`, `**/views/**` | high | User-controlled strings rendered as markup are escaped or sanitized by the framework or an approved library. | Submit a unique marker string into each changed input; count only if a dialog or script sink with that marker fires. | deterministic | Framework-escaped output (`textContent`, default JSX text), markdown pipelines with a known safe config, admin-only CMS with a documented HTML allowlist. |
| `open-redirect` | tag:redirect | `**/*.{ts,tsx,js,jsx,py,go}`, `**/auth/**`, `**/login/**`, `**/oauth/**` | med | Redirect targets from query, body, or header are constrained to an allowlist or same-origin relative paths. | Pass a local canary URL in each changed redirect parameter; count only if the browser lands on that canary. | deterministic | Internal post-login defaults with no user-controlled target, static asset redirects. |
| `upload-validation` | tag:upload | `**/*upload*`, `**/*multipart*`, `**/storage/**`, `**/files/**`, `**/media/**` | high | Upload handlers check content type and size on the server before storage. | Upload an oversize and a mismatched-type file through the changed path; expect rejection. | agent | Client-only size hints when the server enforces the same limits, virus-scan hooks already required by policy. |
| `client-secrets` | tag:secrets | `**/*.{ts,tsx,js,jsx,vue}`, `**/config/**`, `**/.env*`, `**/webpack*.*`, `**/vite*.*`, `**/next.config.*` | high | Secrets, private keys, and server-only tokens do not appear in client bundles or public config shipped to the browser. | Build or inspect the client bundle for high-entropy values matching changed secret names; never exfiltrate them. | agent | Public publishable keys documented as client-safe, non-secret feature flags. |
| `sensitive-response` | tag:sensitive | `**/api/**`, `**/serializers/**`, `**/dto/**`, `**/graphql/**`, `**/*response*` | med | Responses omit password hashes, raw tokens, full payment PANs, and other sensitive fields the caller must not see. | Compare response bodies for changed endpoints across roles; flag fields present for a lower-privilege caller. | agent | Fields the role is authorized to read, intentionally public profiles, redacted previews. |
| `cookie-flags` | tag:session | `**/auth/**`, `**/session/**`, `**/cookies/**`, `**/middleware/**`, `**/*session*` | med | Session cookies set Secure, HttpOnly, and an explicit SameSite appropriate to the app. | Inspect Set-Cookie on the changed login or session path for the required flags. | deterministic | Non-session cookies documented as client-readable, CSRF double-submit cookies that must be JS-readable. |

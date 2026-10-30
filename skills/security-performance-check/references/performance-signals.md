# Performance signals

This file is project-customizable: add, remove, or reword rows, change a threshold, or tune route patterns.
An edited copy is kept by `update --apply`.
`scripts/check_findings.py signals --track performance` reads the table below; editing a row changes `signals_loaded[]` on the next run without touching `SKILL.md`.

Columns:

- `metric_class`: `exact` (one run per side, exact diff) or `noisy` (at least `min_runs_per_side` interleaved runs; default floor is 5).
- `source`: how the agent collects the metric (`playwright` via runtime-e2e-test infra, `build` output, or `lighthouse` only when the target project already has it).
- `direction`: `lower_better` or `higher_better`.
- `aggregation`: value compared after the runs (`median`, `count`, `max`, `min`, `sum`).
- `threshold`: small parseable grammar, e.g. `median < base*1.10` or `count <= base`, with an optional absolute budget after `;` (e.g. `median < base*1.10; abs < 2500`).
  When the base aggregate is `0`, a relative clause (`base` or `base*factor`) treats strict `<` / `>` as `<=` / `>=` so identical zeros pass; a nonzero head still fails a lower_better relative threshold. Absolute budget clauses are unchanged.
- `min_runs_per_side`: minimum samples per side before judging; noisy rows need at least 5.
- `route_pattern`: comma-separated globs matched against changed paths or routes; `*` does not cross `/`, `**` does.
- `level`: `off` (skip), `warn` (report under Giới hạn when it fails), or `error` (exploited finding when it fails).
- `fix_hint`: short remediation note for the report.

Collectors stay zero-install: Playwright through `runtime-e2e-test`, and build output for bundle size.
Use Lighthouse only when the project already provides it; otherwise record that limit under `Giới hạn`.
Default matching also skips tests, fixtures, Cypress/Playwright e2e dirs, `*.cy.*`, `test-utils` / `test-helpers`, `__mocks__`, i18n/locale/translation files, `messages/*.json` locale catalogs, and similar non-executable assets (see `DEFAULT_PATH_EXCLUDES` in `check_findings.py`).

## Signals

| id | metric_class | source | direction | aggregation | threshold | min_runs_per_side | route_pattern | level | fix_hint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `request-count` | exact | playwright | lower_better | count | `count <= base` | 1 | `**/*.{tsx,jsx,vue,html}`, `**/pages/**`, `**/app/**`, `**/routes/**`, `**/api/**` | error | Collapse per-row fetches into one list or batch endpoint; drop duplicate requests for the same URL. |
| `payload-bytes` | exact | playwright | lower_better | median | `median < base*1.10` | 1 | `**/*.{tsx,jsx,vue,html}`, `**/pages/**`, `**/app/**`, `**/api/**`, `**/serializers/**` | warn | Trim unused fields, paginate, or compress large JSON responses on the changed flow. |
| `bundle-size` | exact | build | lower_better | median | `median < base*1.15; abs < 512000` | 1 | `**/webpack*.*`, `**/vite*.*`, `**/next.config.*`, `**/package.json`, `**/*.{tsx,jsx,ts,js,css}` | warn | Code-split the changed entry, drop unused imports, or move heavy deps off the critical path. |
| `background-requests` | exact | playwright | lower_better | count | `count <= base` | 1 | `**/*.{tsx,jsx,vue,html}`, `**/pages/**`, `**/app/**`, `**/components/**`, `**/hooks/**` | error | Clear timers, intervals, and subscriptions on unmount; cancel in-flight polls when leaving the page. |
| `response-time` | noisy | playwright | lower_better | median | `median < base*1.10` | 5 | `**/api/**`, `**/routes/**`, `**/controllers/**`, `**/handlers/**`, `**/server/**`, `**/backend/**`, `**/*route*.*` | warn | Profile the changed handler; cut serial work and avoid repeated I/O inside the hot path. |
| `lcp` | noisy | playwright | lower_better | median | `median < base*1.10; abs < 2500` | 5 | `**/*.{tsx,jsx,vue,html}`, `**/pages/**`, `**/app/**`, `**/layouts/**` | warn | Prioritize the LCP element (image/text), reduce render-blocking work, and keep the above-the-fold payload small. |
| `cls` | noisy | playwright | lower_better | median | `median < base*1.10; abs < 0.1` | 5 | `**/*.{tsx,jsx,vue,html,css}`, `**/pages/**`, `**/app/**`, `**/components/**` | warn | Reserve space for late images and ads; avoid inserting content above existing layout after paint. |
| `inp-tbt` | noisy | playwright | lower_better | median | `median < base*1.10; abs < 200` | 5 | `**/*.{tsx,jsx,vue,html}`, `**/pages/**`, `**/app/**`, `**/components/**` | warn | Break long event handlers, defer non-critical JS, and keep interaction work under the budget. |
| `long-tasks` | noisy | playwright | lower_better | count | `count <= base; abs <= 5` | 5 | `**/*.{tsx,jsx,vue,ts,js}`, `**/pages/**`, `**/app/**` | warn | Split tasks over 50ms; move heavy work off the main thread or behind idle callbacks. |

### `background-requests` measurement

Use this exact procedure on base and on head (same auth, viewport, and throttle as `conditions{}`):

1. Open each changed page URL; wait until the document load (and network idle if the harness supports it).
2. Navigate to a different same-origin page (for example `/` or a documented neutral route in project-runtime).
3. Start a timer when that navigation's document response finishes.
4. For the next **15 seconds**, count HTTP(S) requests the page initiates (XHR, fetch, and WebSocket upgrade requests). Exclude the navigation document request itself and static assets for the destination page that start within the first 500 ms after navigation (destination bootstrap). Include repeating poll/timer-driven API calls.
5. The metric value is that count. Compare with `count <= base` via `check_findings.py threshold`. Head strictly greater than base fails.

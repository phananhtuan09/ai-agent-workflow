# Evidence contract

Machine-checkable rules for probe evidence under this skill's run directory.
`scripts/check_findings.py` enforces the checks below (`har`, `redact`, `scan-bodies`, `finding`, `run`).

## Response bodies (HAR)

Every probed HTTP response that is cited as evidence MUST be stored as a full HAR entry body.

### How the body is stored

Supported layouts (Playwright / Chrome HAR):

| Layout | Fields | `content.size` equals |
| --- | --- | --- |
| Plain text | `content.text` (no `encoding`) | UTF-8 byte length of `text` |
| Base64 embed | `content.encoding: "base64"` + `content.text` | **Decoded** byte length of `text` |
| Attach / sidecar | `content._file` (path relative to the HAR file) | Byte length of the sidecar file |

- A missing sidecar named by `_file` is an error.
- Do not truncate (`body_preview`, first N characters), omit a required body, or reconstruct the body by hand from memory or logs.
- Do not use placeholder body hashes such as `sha256:omitted`, `omitted`, `truncated`, or `redacted`.
- Finding `requests[].length` is the same byte length as the stored body; `requests[].body_hash` is `sha256:` plus the hex digest of those stored bytes.

### When full-body rules are enforced

The checker enforces “body present and `size` matches stored bytes” only when at least one of the following is true:

1. The entry is a **probed** response: its method + URL match a finding `requests[]` entry (during `run` / finding↔HAR cross-check), or
2. The entry’s `mimeType` is **text / JSON / HTML** (and similar: `text/*`, `application/json`, `application/xml`, `application/javascript`, `+json` / `+xml`, form-urlencoded, GraphQL).

Entries that are neither probed nor text-JSON-HTML (static assets, images, fonts, and similar) do **not** fail the HAR when `text` / `_file` is absent.
If such an entry still carries `_file` or `text`, a present body is size-checked; a declared `_file` whose sidecar is missing is always an error.

### In-place redaction

Stored bodies never keep a password, password hash, token, secret, API key, private key, or session id in clear text.
Run `check_findings.py redact <raw.har> --out <stored.har>` after `scan-bodies` and before writing findings: it replaces each such value (by field name — the sensitive key list plus any key ending in `password`, `secret`, `token`, `hash`, or `digest` — and by bcrypt / argon2 / JWT / AWS-key / PEM shape) with the marker, keeps the field name, updates `content.size`, and writes `_spc_redaction`.
`run` rejects any `*.har` in the run directory that still holds such a value in clear text.
A finding's `requests[].length` and `body_hash` describe the stored (redacted) body, so the length and integrity checks still apply.
A marker under a sensitive key is still a `scan-bodies` hit (`reason: redacted_sensitive_key`): redaction hides the value, not the leak.

The rules for a redacted body:

1. Replace each sensitive span with the fixed marker `«REDACTED»` (U+00AB REDACTED U+00BB).
2. Attach metadata on the same `content` object:

```json
"_spc_redaction": {
  "marker": "«REDACTED»",
  "paths": ["$.passwordHash", "$.user.token"],
  "ranges": [[12, 23], [40, 51]]
}
```

- `marker` MUST be exactly `«REDACTED»`.
- `paths` lists JSONPath-like or dotted field names that were redacted (nonempty when any replacement occurred).
- `ranges` lists `[start, end)` character offsets into the **stored** (already redacted) text covering each marker occurrence; every range MUST equal the marker string.
- After redaction, `content.size` still equals the stored body byte length (decoded length when `encoding` is `base64`, or sidecar length when `_file` is used).

The checker rejects a HAR entry when:

- for a probed or text-JSON-HTML entry, `content.size` ≠ stored body byte length;
- for a probed or text-JSON-HTML entry, `size > 0` but neither `text` nor `_file` provides a body;
- `_file` is set but the sidecar cannot be read;
- `_spc_redaction` is present but malformed (wrong marker, empty paths when ranges exist, range not equal to the marker);
- the body holds the marker without `_spc_redaction`, or `ranges` does not cover every marker occurrence;
- a finding references a HAR path that does not exist on disk;
- a finding request has no matching HAR entry by method + URL (order-preserving among duplicates), or length / `body_hash` disagree with that entry.

## Finding ↔ HAR cross-check

`check_findings.py run` always cross-checks security findings that cite `evidence.har_path`:

- Missing `har_path` / `screenshot` files are errors (not silent skips).
- Each `requests[]` item is matched to a HAR entry by **method + URL** (relative and absolute URLs that share path+query match). Among duplicates, the first unused HAR entry in file order wins.
- Differing request vs entry counts do **not** skip the check; an unmatched request is an error.

## Access classification

Authz and object-access probes record expected vs observed access on each `requests[]` entry.

For `signal_id` `authz-route` and `object-id-access`, **`role`, `expected_access`, `observed_access`, and `access_verdict` are required** on every request.
A `bypassed` verdict without those access fields is always rejected (any signal).

| Field | Values | Meaning |
| --- | --- | --- |
| `role` | nonempty string | Caller identity used for the probe (already required). |
| `expected_access` | `allow` \| `deny` | Whether this caller is authorized for this resource/action. Owner or higher-privilege role reading/writing data they are allowed to access is `allow`. |
| `observed_access` | `allow` \| `deny` \| `unclear` | What the response showed vs the project's access-denied fingerprint. |
| `access_verdict` | `allowed` \| `enforced` \| `bypassed` \| `unclear` | Classification for the report; must match the derivation below. |
| `caller_authorized` | boolean (optional) | Explicit authorized-caller flag; when true, `expected_access` must be `allow`. |

Derivation (when `expected_access` and `observed_access` are both set and observed is not `unclear`):

- `allow` + `allow` → `allowed`
- `deny` + `deny` → `enforced`
- `deny` + `allow` → `bypassed`
- `allow` + `deny` → `enforced` (unexpected deny; still not a bypass)

A `bypassed` verdict means an **unauthorized** caller received access.
It is inconsistent (checker rejects) when `expected_access` is `allow`, when `caller_authorized` is true, or when the derived verdict is not `bypassed`.

## Sensitive fields in every probed body

After probes, run `check_findings.py scan-bodies <har>` on every saved HAR.
A hit is an exploited finding (`signal_id: sensitive-response`), whatever coverage decision that row got.

Scanner rules:

- Prefer a JSON walk; raw-text fallback only matches keys in JSON / query / form context at a **token boundary** (`"key":`, `key=`, `key:`), so CSS like `span: 1px` and ordinary prose do not hit.
- HTML / CSS / JS asset bodies are treated conservatively (raw-text fallback skipped; JSON bodies still scanned when parseable).
- `null`, `""`, `false`, and empty arrays/objects for a sensitive key are **not** hits.
- Callers may document legitimate fields (for example the caller’s own `access_token` on a login/token response) via:
  - per-entry HAR metadata `_spc_scan_allow: [{"key":"access_token","reason":"own token on login"}]`, or
  - CLI `--allow key:reason` on `scan-bodies`.
  Password hashes and private keys (and bcrypt / argon2 / PEM private-key shapes) are **never** exemptable.

### Required scan record

When the summary `track` is `security` or `both`, or when a finding has security probe requests, `check_findings.py run` requires a recorded scan-bodies result, even when the run wrote zero findings (performance-only runs are exempt):

- `summary.json` field `body_scan`, or
- run-directory file `body-scan.json`

Minimum shape:

```json
{
  "ran": true,
  "hars": ["finding-1.har"],
  "hit_count": 0
}
```

`ran` must be `true`. Skipping the scan (no record) fails the run.
`hars`, `hit_count`, and `allow` (`[{"key","reason"}]`, the same exemptions passed as `--allow`) are optional.

`run` does not trust the record. It re-scans every HAR listed in `hars` plus every `*.har` in the run directory:

- a listed HAR that does not exist is an error;
- a declared `hit_count` that differs from the recomputed hits is an error;
- any hit without an exploited `sensitive-response` finding in the run is an error, so a leak cannot be left as a hypothesis.

## Per-row coverage

Every security row loads on every security run; hints only rank them.
`summary.signals_loaded` lists every row in `references/security-signals.md`, and `summary.coverage` holds one entry per row next to the changed-file entries:

```json
{"signal_id": "open-redirect", "decision": "applies", "reason": "login handler redirects to the next query parameter"}
```

`decision` is `applies` or `skipped`; `reason` is a nonempty sentence about the changed code.
The checker rejects a security or both-track summary when any row is missing from `signals_loaded` or has no reason.

## Probe outcomes (no evidence downgrade)

`summary.probes` lists every runtime probe that ran (an empty list when none ran):

```json
{"signal_id": "markup-render", "validator": "deterministic", "outcome": "exploited", "finding": "finding-2.json"}
```

`outcome` is `exploited`, `not_exploited`, `unclear`, or `not_run`.
A `deterministic` probe whose outcome is `exploited` must name an exploited finding file with the same `signal_id`, and that id must be a security row: pick the best-matching row even when the issue sits between two rows.
It cannot be reported as a hypothesis or under `Giới hạn` instead.

## Performance evidence

`summary.performance_scope = {project_type, collectors}` is required when the performance track ran; see `references/performance-signals.md` for the allowed pairs.
Projects of type `cli`, `mobile`, or `library` have no collector, write no performance finding, and record the limit under `limits`.

A base-vs-head performance finding that cites a HAR carries both `evidence.har_path` (head) and `evidence.base_har_path` (base).
Both HARs must be recorded by the collector (`check_findings.py har --recorded`):

- `log.creator.name` is set;
- every entry has a parseable ISO 8601 `startedDateTime` with a time zone;
- a HAR with more than one entry does not have every `startedDateTime` equal.

For `request-count` and `background-requests`, `metric.base` / `metric.head` use `n = 1` with `median = min = max`, and that value equals the number of entries the checker counts in the matching HAR with `evidence.request_filter`:

| field | meaning |
| --- | --- |
| `url_contains` | count only URLs containing this text |
| `methods` | count only these HTTP methods |
| `exclude_assets` | skip scripts, styles, images, fonts, and media |
| `after` `{base, head}` | count only entries that start after this time; the HAR must hold at least one entry at or before it |
| `window_ms` | with `after`, count only entries within this many milliseconds |

`background-requests` requires `after` and `window_ms >= 15000`.

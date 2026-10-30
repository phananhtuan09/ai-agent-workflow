# Evidence contract

Machine-checkable rules for probe evidence under this skill's run directory.
`scripts/check_findings.py` enforces the checks below (`har`, `scan-bodies`, `finding`, `run`).

## Response bodies (HAR)

Every probed HTTP response that is cited as evidence MUST be stored as a full HAR entry body.

- Store the complete body in `log.entries[].response.content.text`.
- Set `content.size` to the UTF-8 byte length of that stored `text` (HAR encoding `utf-8` when text is present).
- Do not truncate (`body_preview`, first N characters), omit (`text` missing while `size > 0`), or reconstruct the body by hand from memory or logs.
- Do not use placeholder body hashes such as `sha256:omitted`, `omitted`, `truncated`, or `redacted`.
- Finding `requests[].length` is the same UTF-8 byte length as the stored body; `requests[].body_hash` is `sha256:` plus the hex digest of those stored bytes.

### In-place redaction

When a body must not retain a secret in cleartext, redact **in place** inside `content.text`:

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
- `ranges` lists `[start, end)` character offsets into the **stored** (already redacted) `text` covering each marker occurrence; every range MUST equal the marker string.
- After redaction, `content.size` still equals the UTF-8 byte length of the stored `text` (the redacted body is the evidence body).

The checker rejects a HAR entry when:

- `content.size` ≠ UTF-8 byte length of `content.text`;
- `size > 0` but `text` is missing or not a string;
- `_spc_redaction` is present but malformed (wrong marker, empty paths when ranges exist, range not equal to the marker);
- a finding references a HAR whose body length disagrees with `requests[].length`, or whose digest disagrees with `requests[].body_hash`.

## Access classification

Authz and object-access probes record expected vs observed access on each `requests[]` entry:

| Field | Values | Meaning |
| --- | --- | --- |
| `role` | nonempty string | Caller identity used for the probe (already required). |
| `expected_access` | `allow` \| `deny` | Whether this caller is authorized for this resource/action. Owner or higher-privilege role reading/writing data they are allowed to access is `allow`. |
| `observed_access` | `allow` \| `deny` \| `unclear` | What the response showed vs the project's access-denied fingerprint. |
| `access_verdict` | `allowed` \| `enforced` \| `bypassed` \| `unclear` | Classification for the report. |
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
A hit is an exploited finding (`signal_id: sensitive-response`), even when that signal row was not loaded for the change.
The scanner looks for generic sensitive key names and value shapes (password hashes, tokens, API keys, session ids, private keys, and similar); see the checker source for the current lists.

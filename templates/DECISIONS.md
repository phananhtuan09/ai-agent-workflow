# Decisions

Accepted product and domain rules, recurring technical conventions, and architecture, security, compatibility, or operational decisions that future work must respect.
Read the entries relevant to the change before altering behavior they may cover.

## How to record

- Record only what a human accepted: lasting behavior, a convention, or a decision stated in the conversation, or an answer to a decision question. Do not record routine implementation choices or anything merely inferred from code, tests, or history.
- Add one `##` entry per decision under Entries, newest first, in the format below. Keep it short; link a PR, proposal, or file for long rationale.
- Update the entry that owns a topic instead of adding a competing one.
- When a decision changes, edit its entry in place and update `Date` and `Source`. When it no longer applies, delete the entry. Git history keeps earlier versions.
- For a product or domain rule, write externally observable behavior from the consumer's perspective, with boundaries and failure behavior when they matter. For a technical convention, state when it applies and when it does not.
- Do not invent rules, rationale, or sources. When no accepting request can be found, write `Source: Unknown: no accepting request in repository history.` Use MUST, SHOULD, and MAY only for intentional strength.

```md
## <Short title>

Date: YYYY-MM-DD · Status: Active | Experimental
Source: Human request, YYYY-MM-DD: <one-line summary>

- Decision: <what was accepted; one rule per bullet when there are several>
- Why: <the reason, in one or two sentences>
- Constraints: <what future work must keep; omit when none>
```

## Entries

None recorded yet.

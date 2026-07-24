# Design Spec Contract

## Artifact Roles

`docs/ai/designs/{feature_slug}.html` is the human review surface.

`docs/ai/design-decisions/{feature_slug}.json` is the durable approval provenance consumed by `create-spec` and `review-spec`.

`docs/ai/design-feedback/{feature_slug}.json` is the latest change-request payload from the human review surface.

`docs/ai/specs/{feature_slug}.md` becomes the source of truth for implementation and verification after `review-spec` passes.

The decision manifest must not become a second implementation specification.
Keep it limited to approved intent, scope, decisions, and constraints.

## Material Human Decisions

Ask the human only when a choice changes at least one of these:

- user-visible outcome
- included or excluded scope
- permission or access behavior
- quota, validation limit, ranking, fairness, or threshold
- default, fallback, reset, or recovery behavior
- persistence or compatibility promise
- migration, destructive action, security, or rollout risk acceptance

Do not ask the human to choose file paths, function boundaries, schema field names, test commands, or implementation order unless those details carry a business or operational tradeoff.

## HTML Contract

The final HTML must contain:

- feature title, slug, and design revision
- one-sentence goal
- target user and current problem
- in-scope and out-of-scope behavior
- primary flow or state transition at a high level
- confirmed facts and codebase evidence
- assumptions and risks
- required decision cards with stable `D-xxx` identifiers
- a final constraints textarea
- one approval action that posts the approval payload to the local runner
- one request-changes action that posts section comments to the local runner
- a preview of the approval payload that will be saved
- an `aria-live` submission status

Every required decision card must use:

```html
<fieldset
  class="decision-card"
  data-decision-id="D-001"
  data-question="Question shown to the human"
  data-required="true"
>
```

Each option must be a native radio input.
Use `data-answer-label` for the human-readable answer captured in the payload.

## Approval Payload

The approval action must send JSON to `POST /api/design-approval`.
The payload must have this shape:

```json
{
  "schema_version": 1,
  "event": "design-spec-approval",
  "approved": true,
  "feature_slug": "example-feature",
  "design_revision": "3",
  "submitted_at": "2026-07-23T12:00:00.000Z",
  "goal": "The approved one-sentence goal",
  "scope": {
    "in": ["Included behavior"],
    "out": ["Excluded behavior"]
  },
  "decisions": [
    {
      "id": "D-001",
      "question": "Which fallback should be used?",
      "answer": "Use the last valid selection",
      "rationale": "Avoid surprising resets"
    }
  ],
  "constraints": ["Do not migrate historical records"]
}
```

The local runner converts the approval payload into the durable decision manifest below.
The agent must not infer approval from chat, DOM snapshots, downloaded fallback JSON, or screenshots.

## Change Request Payload

The request-changes action must send JSON to `POST /api/design-feedback`.
The payload must have this shape:

```json
{
  "schema_version": 1,
  "event": "design-change-request",
  "feature_slug": "example-feature",
  "design_revision": "3",
  "submitted_at": "2026-07-23T12:00:00.000Z",
  "comments": [
    {
      "target": "D-001",
      "text": "Change the recommended option."
    }
  ]
}
```

The local runner writes this to `docs/ai/design-feedback/{feature_slug}.json`.
When feedback exists for the current design revision, the agent must revise the HTML, increment `data-design-revision`, reopen the runner, and stop for another human review.

## Decision Manifest

Write UTF-8 JSON with a trailing newline:

```json
{
  "schema_version": 1,
  "feature_slug": "example-feature",
  "design_revision": "3",
  "design_path": "docs/ai/designs/example-feature.html",
  "design_sha256": "64 lowercase hexadecimal characters",
  "approved_at": "2026-07-23T12:00:00.000Z",
  "approval_source": "local-runner",
  "goal": "The approved one-sentence goal",
  "scope": {
    "in": ["Included behavior"],
    "out": ["Excluded behavior"]
  },
  "decisions": [
    {
      "id": "D-001",
      "question": "Which fallback should be used?",
      "answer": "Use the last valid selection",
      "rationale": "Avoid surprising resets",
      "source": "human"
    }
  ],
  "constraints": ["Do not migrate historical records"],
  "unresolved_non_blocking": []
}
```

Rules:

- `design_path` must be repository-relative.
- `design_revision` must match the approved payload and the HTML `data-design-revision` value.
- `design_sha256` must match the final HTML bytes.
- `decisions` must contain every required `D-xxx` decision exactly once.
- Each manifest decision question must match the corresponding HTML `data-question` value.
- `source` must be `human` for approval choices.
- `approval_source` must be `local-runner`.
- Blocking product questions are not allowed in an approved manifest.
- Non-blocking technical uncertainty may be listed in `unresolved_non_blocking`.
- Do not include secrets, raw transcripts, DOM snapshots, or unrelated annotations.

## Local Runner Rules

- Start the bundled runner with `scripts/design_review_server.py start <design-path>`.
- Keep the default loopback binding.
- Do not publish internal design artifacts through third-party hosting.
- Do not add CDN dependencies to the artifact.
- Do not keep the agent waiting while the human reviews.
- On resume, check runner status and validate any manifest before continuing.
- Stop the runner with `scripts/design_review_server.py stop <design-path>` after a valid approval manifest exists.

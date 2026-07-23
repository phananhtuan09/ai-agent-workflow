# Design Spec Contract

## Artifact Roles

`docs/ai/designs/{feature_slug}.html` is the human review surface.

`docs/ai/design-decisions/{feature_slug}.json` is the durable approval provenance consumed by `create-spec` and `review-spec`.

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
- one approval button that queues the approval payload
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

The approval button must queue one prompt tagged `design-approval`.
The prompt text must start with this exact marker on its own line:

```text
DESIGN_SPEC_APPROVAL
```

The remainder must be valid JSON with this shape:

```json
{
  "schema_version": 1,
  "event": "design-spec-approval",
  "approved": true,
  "feature_slug": "example-feature",
  "design_revision": "3",
  "submitted_at": "2026-07-23T12:00:00.000Z",
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

The approval payload is transport evidence.
After receiving it, the agent creates the durable decision manifest below.

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
  "approval_source": "lavish",
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
- Blocking product questions are not allowed in an approved manifest.
- Non-blocking technical uncertainty may be listed in `unresolved_non_blocking`.
- Do not include secrets, raw transcripts, DOM snapshots, or unrelated annotations.

## Lavish Runtime Rules

- Pin `lavish-axi@0.1.43` during the pilot.
- Keep the default loopback binding.
- Do not use `share` for internal design artifacts.
- Do not add CDN dependencies to the artifact.
- Poll in the foreground.
- Repair browser-proven severe layout warnings before human approval.
- End the session after persisting and validating approval.

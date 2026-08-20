# Learning State Transitions

Use the installed runtime path for `update_learning_state.py`.

Every command uses:

```bash
python3 {skill_root}/scripts/update_learning_state.py {operation} \
  --session docs/ai/learning/sessions/{session_id}.json \
  --case docs/ai/learning/cases/{case_id}.json \
  --profile docs/ai/learning/profile.json \
  [--payload {payload.json}]
```

`accept-boundary` and `complete-session` do not use a payload.

All other operations require a JSON object payload.

## Explore

`disclose-facts`:

```json
{
  "question": "Exact human question",
  "matched_discovery_path": "Exact path from the case",
  "fact_ids": ["F-003"]
}
```

## Decide

`record-attempt`:

```json
{
  "judgment_id": "PJ-001",
  "summary": "Faithful conclusion or direction",
  "reasoning": "Concise reasoning summary",
  "assumptions": [],
  "constraints": [],
  "invariants": [],
  "risks": [],
  "predictions": [],
  "tradeoffs": []
}
```

At least one observation array must be non-empty.

`record-revision`:

```json
{
  "judgment_id": "PJ-001",
  "summary": "What changed",
  "reason": "Why it changed",
  "evidence_refs": ["SE-001", "EI-001"]
}
```

`record-assistance`:

```json
{
  "judgment_id": "PJ-001",
  "level": 4,
  "kind": "scoped-hint",
  "content": "What assistance was provided",
  "material": true,
  "material_reason": "Why it affected independent assessment",
  "impact": "How it changed the judgment space"
}
```

Omit `material_reason` only when `material` is false.

`release-event`:

```json
{
  "event_id": "EV-001",
  "trigger_evidence": ["AT-002"]
}
```

`close-judgment`:

```json
{
  "judgment_id": "PJ-001",
  "mode": "assessment-closed"
}
```

Mode is `assessment-closed` or `assessment-frozen`.

## Evidence

`request-evidence`:

```json
{
  "judgment_id": "PJ-003",
  "decision_or_assumption": "What is being tested",
  "question": "Exact evidence question",
  "method": "Authorized method",
  "scope": "Authorized scope",
  "interpretation_protected": true
}
```

`block-evidence`:

```json
{
  "request_id": "ER-001",
  "blocked_reason": "Missing coding workflow dependency"
}
```

`record-evidence` uses the evidence package from `learning-evidence` and requires `request_id`, `question`, `method`, `environment`, `assumptions`, `result`, `evidence_references`, `limitations`, `confidence`, `proves`, `suggests`, `does_not_prove` and `interpretation_withheld`.

`interpret-evidence`:

```json
{
  "evidence_id": "SE-001",
  "summary": "Human interpretation",
  "proves": [],
  "does_not_prove": [],
  "decision_change": "revised"
}
```

`decision_change` is `kept`, `revised`, `rejected` or `unknown`.

## Reflect

`propose-assessment` uses the exact `dimensions`, `result_summary`, `gaps`, `outcome`, `limitations` and `next_action` fields returned by `learning-review`.

Each dimension must contain concrete `evidence` record IDs.

`raise-dispute`:

```json
{
  "category": "rubric-mapping",
  "reason": "Human dispute"
}
```

Category is `fact`, `rubric-mapping`, `attribution` or `interpretation`.

`resolve-dispute`:

```json
{
  "dispute_id": "DP-001",
  "resolution": "Evidence-bound resolution"
}
```

Run `complete-session` only after the human accepts the current assessment.

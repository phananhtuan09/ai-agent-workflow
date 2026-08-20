# Learning Project And Schedule

Read this reference when project or schedule artifacts are missing, draft, or need an approved update.

## Paths

- Project: `docs/ai/learning/project.json`.
- Schedule: `docs/ai/learning/schedule.json`.

The installed artifacts are proposals until the human approves them.

Present only the project goal, domain, architecture baseline, schedule horizon, weekly cadence and current week focus before requesting approval.

Do not expose future case events or hidden constraints while presenting the project.

## Accept Initial Context

```bash
python3 {skill_root}/scripts/update_learning_context.py accept \
  --project docs/ai/learning/project.json \
  --schedule docs/ai/learning/schedule.json
```

Run this only after explicit human approval.

If the human changes the proposed domain, architecture baseline, horizon or cadence, update only the draft artifacts, validate both, present the revised summary and request approval again.

Validate draft edits with:

```bash
python3 {skill_root}/scripts/validate_learning_state.py docs/ai/learning/project.json
python3 {skill_root}/scripts/validate_learning_state.py docs/ai/learning/schedule.json \
  --project docs/ai/learning/project.json
```

## Record Project Evolution

Use this after the human explicitly accepts project decisions or state changes produced by a completed session.

```json
{
  "session_id": "inventory-reservation-001",
  "summary": "Accepted delayed-payment reconciliation as part of the project state.",
  "decisions": ["Late successful payment enters reconciliation instead of confirming an expired reservation."],
  "delivered_capabilities": [],
  "active_constraints": ["Reservation expiry may precede a delayed payment callback."]
}
```

```bash
python3 {skill_root}/scripts/update_learning_context.py record-project-evolution \
  --project docs/ai/learning/project.json \
  --schedule docs/ai/learning/schedule.json \
  --payload {payload.json}
```

Do not promote an exercise decision into project state without explicit human approval.

## Recalibrate Future Weeks

Use this only after presenting the evidence-based reason and receiving human approval.

```json
{
  "reason": "The learner needs another data-modeling week before asynchronous workflow work.",
  "effective_week": 5,
  "updates": [
    {
      "week": 5,
      "theme": "Data model retry",
      "competency_focus": ["data modeling", "transaction design"],
      "project_focus": "Inventory and order ownership"
    }
  ]
}
```

```bash
python3 {skill_root}/scripts/update_learning_context.py recalibrate-schedule \
  --project docs/ai/learning/project.json \
  --schedule docs/ai/learning/schedule.json \
  --payload {payload.json}
```

Completed weeks are immutable.

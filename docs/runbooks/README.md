# Runbooks

Verified operational procedures for the real system, such as local startup, migrations, releases, runtime diagnosis, recovery, and cleanup.
Shared rules: `../WORKFLOW.md` (Namespace contracts).

## Admission

Create a runbook only for a procedure with trustworthy execution evidence or one safely verified while documenting it.
If safe verification is unavailable, leave the runbook uncreated or unchanged and report the missing evidence.
Use an operation filename, such as `restore-database-backup.md`.

## Document format

```md
# <Operational procedure>

Status: Verified | Deprecated
Applies to: <environment, service, or component>
Last verified: YYYY-MM-DD

## Outcome

<The observable state produced by successful completion.>

## Preconditions

- <Required access, tools, state, backups, and inputs.>

## Safety

- <Destructive effects, stop conditions, credential handling, rollback prerequisites. Required when an action creates material risk.>

## Procedure

1. <One action per step, with exact commands in fenced code blocks.>

## Verification

1. <How to prove the outcome and detect partial failure.>

## Recovery

1. <How to stop, roll back, or restore a safe state. Required when the procedure changes state or can fail partially.>

## Troubleshooting

### <Observed symptom>

<Verified cause and corrective action. Conditional.>

## References

- <Related decision, documentation, dashboard, or script. Conditional.>
```

`Status`, `Applies to`, `Last verified`, `Outcome`, `Preconditions`, `Procedure`, and `Verification` are required.

## Writing rules

Use numbered steps in execution order and show exact commands, identifying every variable, environment, and expected result.
Place warnings and stop conditions before the action that creates risk.
Never expose secrets or present placeholders as runnable values, and never invent credentials or procedures.
Update `Last verified` only when the documented procedure itself has been exercised successfully.

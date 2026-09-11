# verify-workflow contract migration

The manifest/gate/judge contract is retired as of the structured-results contract.

Use the following replacements:

| Legacy entrypoint | Replacement |
|---|---|
| `scripts/update_manifest.py` | Write testcase definitions with `/manual-checklist`; record repair state with `scripts/record_repair_attempt.py`. |
| `scripts/validate_evidence.py` | `scripts/validate_verification.py --testcases ... --results ... --spec ... --complete`. |
| `references/evidence-contract.md` | `references/evidence-rules.md`. |
| `references/intent-modes.md` | Approved spec plus testcase definitions in `/manual-checklist`. |
| `templates/fix-handoff.md` | The `## Handoff` section in `SKILL.md`. |

Legacy files remain as redirects or executable deprecation shims so old invocations fail clearly instead of silently producing a second source of truth.

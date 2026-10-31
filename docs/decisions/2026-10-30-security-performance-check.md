# Experimental security-performance-check skill

Status: Accepted
Date: 2026-10-30
Scope: Optional `security-performance-check` skill, `security-performance` bundle, validate-change skip reasons for the optional step, and probe fields in `runtime-e2e-test/references/project-runtime.md`

## Context

Validate runs left security and performance risks as passive signals under `Cần test riêng`.
Checking those risks needs a dedicated, report-only skill that owns the signal files used for detection, without making `validate-change` run the full check or change its status from the check's result.

## Decision

1. Add `skills/security-performance-check/` with tracks `security`, `performance`, and `both`, distributed through a new `security-performance` bundle and included in the `validate` bundle.
2. Ship the security track first: signal table in `references/security-signals.md`, per-finding JSON plus run summary validated by `scripts/check_findings.py`, Vietnamese report sections `Bảo mật` / `Hiệu năng` / `Giới hạn`.
3. In this revision the performance track is not available yet; the skill states that and stops cleanly for that part.
4. When the skill is installed, `validate-change` records the optional step as `SKIPPED` with `recommended` (nonempty `separateTests`) or `no-signal` (empty). Keep `MISSING` only when the skill is not installed.
5. Mark the capability Experimental until sandbox scorecards show stable true-positive and false-positive rates.

## Constraints

- The skill never modifies application code; probes run only on allowed local/dev hosts; no data is sent to third parties.
- `Giới hạn` always states the run is not a penetration test, dependency CVE audit, or load test.
- Signal files are project-customizable and survive `update --apply`; editing them changes loaded signals without editing `SKILL.md`.
- Detection of security/performance signals inside the `validate-change` risk step from these files is a later change.

## Consequences

- Positive: humans get a ready standalone command from validate reports without coupling status to a deep security run.
- Positive: projects can tune signal rows without forking the skill instructions.
- Negative: the performance track and validate-change signal-file detection are still unfinished, so coverage depends on human follow-up.
- Negative: runtime probes need completed project-runtime probe fields; unconfigured projects stop before probing.

## Alternatives considered

- Folding full security checks into `validate-change`: rejected because the composite must stay thin and status must ignore security/performance signals.
- Shipping security and performance tracks together: deferred so the security flow and JSON contract can be proven first.

## References

- Human request, 2026-10-30: implement #50 PR 1 per the agreed plan comment
- [Opt-in validate-change composite](2026-10-29-validate-change-composite.md)
- [Repository-driven workflow](../WORKFLOW.md)

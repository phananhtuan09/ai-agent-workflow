# Experimental security-performance-check skill

Status: Accepted
Date: 2026-10-30
Scope: Optional `security-performance-check` skill, `security-performance` bundle, validate-change skip reasons and risk-step signal-file detection for the optional step, probe fields in `runtime-e2e-test/references/project-runtime.md`, and the performance track signal table plus threshold helpers

## Context

Validate runs left security and performance risks as passive signals under `Cần test riêng`.
Checking those risks needs a dedicated, report-only skill that owns the signal files used for detection, without making `validate-change` run the full check or change its status from the check's result.

## Decision

1. Add `skills/security-performance-check/` with tracks `security`, `performance`, and `both`, distributed through a new `security-performance` bundle and included in the `validate` bundle.
2. Ship the security track: signal table in `references/security-signals.md`, per-finding JSON plus run summary validated by `scripts/check_findings.py`, Vietnamese report sections `Bảo mật` / `Hiệu năng` / `Giới hạn`.
3. Ship the performance track: `references/performance-signals.md` with exact and noisy metrics, parseable thresholds, base/head worktrees from #44, interleaved runs, an A/A noise floor, and NEW / PRE_EXISTING classification.
   Collectors stay zero-install (Playwright via runtime-e2e-test, build output); Lighthouse only when the target project already has it.
4. When the skill is installed, `validate-change` records the optional step as `SKIPPED` with `recommended` (nonempty `separateTests`) or `no-signal` (empty). Keep `MISSING` only when the skill is not installed.
5. When the skill is installed, the `validate-change` risk step reads the trigger columns of the installed signal files and turns diff matches into `separateTests` with a ready command; `risk-rules.md` keeps only gate and audit rows. When it is not installed, detection is skipped and the existing missing-skill limit line stays.
6. Mark the capability Experimental until sandbox scorecards show stable true-positive and false-positive rates.

## Constraints

- The skill never modifies application code; probes run only on allowed local/dev hosts; no data is sent to third parties.
- `Giới hạn` always states the run is not a penetration test, dependency CVE audit, or load test.
- Signal files are project-customizable and survive `update --apply`; editing them changes loaded signals and validate-change `separateTests` without editing any `SKILL.md` or `risk-rules.md`.
- No other skill carries a copy of the signal rows; `validate-change` reuses the parser in `check_findings.py`.
- Statistical gates (Mann-Whitney, KS, Cliff's delta) stay deferred; this revision uses median, range, and the A/A floor only.

## Consequences

- Positive: humans get a ready standalone command from validate reports without coupling status to a deep security or performance run.
- Positive: projects can tune security and performance signal rows without forking the skill instructions.
- Positive: recommending the check from the risk step follows the installed signal files, so an edited trigger changes detection without editing validate-change instructions.
- Negative: runtime probes and measurements need completed project-runtime probe fields and a runnable local app; unconfigured projects stop before probing.

## Alternatives considered

- Folding full security checks into `validate-change`: rejected because the composite must stay thin and status must ignore security/performance signals.
- Shipping security and performance tracks in one first PR: deferred so the security flow and JSON contract could land first; performance followed as the next stacked PR.
- Adding rank-sum / effect-size gates immediately: deferred until sandbox scorecards show the simpler median + A/A floor is insufficient.

## References

- Human request, 2026-10-30: implement #50 PR 1–3 per the agreed plan comment
- [Opt-in validate-change composite](2026-10-29-validate-change-composite.md)
- [Repository-driven workflow](../WORKFLOW.md)

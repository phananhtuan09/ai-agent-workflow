# Experimental senior-code-review skill

Status: Accepted
Date: 2026-11-04
Scope: Optional `senior-code-review` skill, `senior-review` bundle, and the scope line in the `learning-workflow` Review section

## Context

`review-pr` reports only merge-blocking defects, `quality-code-check` reviews surface rules on changed lines, `security-performance-check` probes security and performance, and the learning Review phase checks only shipped behavior.
No skill gave the human a senior-level critique of their own code's approach, design, and boundaries.

## Decision

1. Add `skills/senior-code-review/` as an opt-in, report-only command (`disable-model-invocation: true`, `disallowed-tools: Edit`, Codex `allow_implicit_invocation: false`), distributed alone through the `senior-review` bundle.
2. Review in a fixed order: context, approach, hard-to-reverse decisions, correctness, internal design, operability and tests, details.
3. Keep the review dimensions and frontend checklist in the project-customizable `references/review-catalog.md`; each review picks the 2–3 that matter.
4. Write a Vietnamese report with at most 10 findings (at most 3 `nit`), each with location, severity, failure scenario or change cost, direction, `verified` / `suspected`, and `Sửa ngay` / `Để sau`.

## Constraints

- The skill never reads `docs/learning/` or learning state, and its result never feeds a learning assessment, rating, or progression.
- The skill produces no merge status and does not check PR descriptions or human intent; that stays with `review-pr`.
- The skill does not re-run `quality-code-check` surface rules or `security-performance-check` probes; it points to them instead.
- It is not part of the `validate` bundle and `validate-change` never runs it.

## Consequences

- Positive: the human gets a mentoring review that builds engineering skill, separate from the learning assessment.
- Negative: a broad review is more subjective than the other review skills; the finding cap, the failure-scenario rule, and the `preference` label are the noise controls.

## Alternatives considered

- Widening `review-pr`: rejected because it must stay a narrow, evidence-backed merge gate.
- Adding code-quality grading to the learning Review phase: rejected because the learning workflow assesses product and system judgment, not code style.

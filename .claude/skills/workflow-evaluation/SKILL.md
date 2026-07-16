---
name: workflow-evaluation
description: Use when the user asks to evaluate, compare, promote, reject, improve, or review an AI workflow itself rather than perform the underlying work that workflow guides. Diagnoses observed workflow failures, gathers evidence, exercises realistic scenarios and session traces, and writes a human-readable Vietnamese HTML report to docs/ai/workflow-evals/.
---

# Workflow Evaluation

Evaluate an AI workflow as a review subject, not as an implementation plan.

## Required Source Of Truth

Always read:
- `docs/ai/project/WORKFLOW_EVALUATION_STANDARD.md`

Read when relevant:
- `docs/ai/project/AI_WORKFLOW_RULES.md`
- the workflow artifact under review
- existing artifacts in `docs/ai/workflow-evals/`

Do not re-invent the evaluation flow from memory when the standard is available.

## Use This For

- evaluating whether a workflow should be adopted, kept experimental, constrained, or rejected
- comparing two workflow variants
- reviewing a workflow after changes to commands, skills, phase boundaries, or artifact contracts
- checking whether a workflow is portable enough for its intended scope

Do not use this skill for:
- implementing product features
- fixing application code
- replacing the standard coding workflow for normal build tasks

## Input

Minimum required input:
- workflow name
- workflow artifact paths or a clearly identified workflow subject
- claimed purpose
- claimed task classes
- evaluation goal
- workflow version
- observable expected behavior

Optional:
- comparison target
- runtime context
- known constraints
- known usage incidents
- workflow observations from `docs/ai/workflow-observations/`, when available
- change under test, when proving an improvement
- session traces, when available:
  - raw transcript path(s)
  - normalized trace directory from `python3 .claude/skills/workflow-evaluation/extract_session_trace.py`
  - `session-trace.json`
  - `chat-history.ndjson`
  - `command-transcript.ndjson`
  - `tool-call-trace.ndjson`
  - `artifact-trail.ndjson`
  - `handoff-notes.json`
  - `decision-log.json`
  - `failure-retry-log.json`

If the workflow subject is spread across multiple files, reconstruct it explicitly before judging it.
Treat workflow observations as `agent-reported-observation` incident candidates. Corroborate them with session traces, artifacts, human correction, repeated observations, or exercises before upgrading their evidence status.
If observation paths are not supplied, scan `docs/ai/workflow-observations/*.md` and select files whose `workflow_name` matches the evaluation subject. Record the selected paths in the evaluation evidence.
If the user provides only raw Claude Code or Codex transcript paths, normalize them first with `python3 .claude/skills/workflow-evaluation/extract_session_trace.py` for Claude traces or `python3 .agents/skills/workflow-evaluation/extract_session_trace.py` for Codex traces when possible.
If session traces are unavailable, record them as unavailable instead of inventing runtime behavior.

## Output

Write to:
- `docs/ai/workflow-evals/{name}.html`

Use `docs/ai/project/templates/workflow-evaluation-report.html` as the report structure and visual baseline.

Output rules:
- write all human-facing content in Vietnamese
- preserve code identifiers, paths, commands, quoted evidence, and canonical status values when translation would reduce traceability
- show canonical verdicts with Vietnamese labels, for example `Chấp nhận có điều kiện (Adopt with constraints)`
- produce one self-contained HTML5 file with inline CSS and no JavaScript, CDN, external font, or build dependency
- escape untrusted session-trace content before inserting it into HTML
- do not embed secrets, credentials, tokens, or unnecessary raw transcript content
- keep the report responsive, print-friendly, keyboard-readable, and scannable by a human reviewer
- replace every `{{PLACEHOLDER}}`; the final report must not contain unresolved template tokens
- do not mirror the evaluation phases as top-level report sections; show only information that helps a human make a decision
- keep methodology, normalized models, full traces, and lower-priority findings in the collapsible evidence appendix
- use charts only for real counts, rates, or comparable before/after results; show `Chưa đo` instead of inventing a score
- keep the decision summary under 120 words and show no more than five key findings on the main page

If the user asks only for a partial phase, return a concise Vietnamese summary in the response. A full workflow evaluation must end in the durable HTML artifact above.

## Session Trace Preflight

When `session_traces` are provided as raw Claude Code or Codex transcript path(s), run the extractor before `Intake` or `Audit`:

```bash
python3 .claude/skills/workflow-evaluation/extract_session_trace.py --input <raw-transcript-path> --runtime claude
python3 .agents/skills/workflow-evaluation/extract_session_trace.py --input <raw-transcript-path> --runtime codex
```

When the user asks to audit the latest local session for a runtime, use:

```bash
python3 .claude/skills/workflow-evaluation/extract_session_trace.py --runtime claude --latest --project <repo-cwd>
python3 .agents/skills/workflow-evaluation/extract_session_trace.py --runtime codex --latest --project <repo-cwd>
```

After extraction:
- replace raw transcript references in the input contract with the normalized artifact paths under `docs/ai/session-traces/{runtime}/{session-id}/`
- use `session-trace.json` as the primary summary artifact
- use `chat-history.ndjson`, `command-transcript.ndjson`, `tool-call-trace.ndjson`, and `artifact-trail.ndjson` as direct audit evidence
- keep the original raw transcript path in the artifact for traceability

If normalized artifacts already exist and match the target session, reuse them instead of re-extracting.

## Execution Flow

1. Read `WORKFLOW_EVALUATION_STANDARD.md`.
2. If only raw session transcript paths are available, run the skill-local extractor and update the input contract to point at the normalized artifact set.
3. Define the evaluation input contract explicitly.
4. Run `Intake`.
5. Read relevant workflow observations and run `Observe` when real usage or incidents exist.
6. Run `Normalize`.
7. Run `Diagnose`.
8. Run `Baseline Exercise` when realistic evidence or session traces can be gathered.
9. Write an `Improvement Contract` for findings selected for remediation.
10. If a changed workflow version exists, run `Re-evaluate` with regression, neighbor, and control scenarios.
11. Include session-trace evidence when real session history is available, or explicitly mark it unavailable.
12. Run `Verdict`.
13. Render the Vietnamese HTML report from `docs/ai/project/templates/workflow-evaluation-report.html`.

## Phase Requirements

### `Intake`
- Identify the workflow artifact set under review.
- State the workflow's claimed purpose in plain language.
- State intended task classes, workflow version, evaluation goal, and observable expected behavior.

### `Observe`
- Read matching files under `docs/ai/workflow-observations/` when available.
- Convert usage pain into incidents with:
  - expected behavior
  - observed behavior
  - first divergence
  - impact
  - supporting evidence
- Separate isolated anomalies, repeated patterns, usability friction, and unverified suspicion.
- Keep an observation's agent hypothesis separate from observed facts.
- Do not infer a workflow failure rate from observation counts without a known session denominator.

### `Normalize`
- Rewrite the workflow into a comparable model:
  - entry points
  - ordered phases
  - phase inputs
  - phase outputs
  - durable artifacts
  - human responsibilities
  - agent responsibilities
  - runtime dependencies
  - required assumptions
- Keep verified facts separate from inferred structure.

### `Diagnose`
- Combine static review with observed incidents and trace evidence.
- If session traces exist, compare declared workflow behavior against actual conversation, tool use, handoff, and artifact patterns.
- Record findings with:
  - severity
  - evidence status
  - area
  - failure layer
  - claim and trigger condition
  - evidence
  - impact
  - root-cause hypothesis and confidence
  - smallest recommended change
  - re-test scenario
- Check especially for:
  - unclear phase boundaries
  - unclear entry or exit conditions
  - artifacts with no regular reader
  - hidden runtime dependence
  - reliance on undocumented conventions or hidden chat memory
  - blurred lines between assumptions, human judgment, agent judgment, and verified facts
  - poor failure visibility, missing stop conditions, or unsafe escalation behavior

### `Baseline Exercise`
- Freeze the workflow version, scenario input, expected behavior, prohibited behavior, and pass/fail rule before execution.
- Treat available real session traces as primary evidence alongside synthetic scenarios.
- Cover at least one scenario per claimed task class when feasible.
- Include success-path and stress-path scenarios when the workflow claims safety, reliability, or portability.
- Record:
  - scenario class
  - expected behavior
  - observed behavior
  - ambiguity resolution
  - artifact consumption
  - breakdowns, loops, escalations, or safe stops
  - visible cost notes

### `Improvement Contract`
- Link each selected finding to one falsifiable hypothesis.
- Define the smallest targeted change, success threshold, regression protection, and re-evaluation set.
- Keep the baseline unchanged while collecting baseline evidence; implementation of the workflow change is a separate task.

### `Re-evaluate`
- Compare identified baseline and changed workflow versions.
- Replay at least one regression, one neighbor, and one control scenario per tested finding.
- Classify each hypothesis as `Resolved`, `Improved but below threshold`, `Inconclusive`, `Regressed`, or `Hypothesis rejected`.
- Do not claim improvement from clearer wording alone; require observable before/after evidence.

### `Session Trace Evidence`
- When real chat/session history is available, record:
  - user request or session trigger
  - explicit phase transitions
  - inferred, skipped, or blurred phase transitions
  - questions asked by the agent and whether they were necessary
  - decisions made by the human, agent, or tools
  - tool calls, commands, artifacts, and handoffs
  - hidden context, memory, or unstated assumptions
  - errors, loops, premature execution, unsafe actions, retries, or escalations
  - whether later steps consumed earlier outputs
  - divergence between declared workflow and actual session behavior
- Use session traces to identify real failure modes, not to prove general usefulness from one successful session.
- If traces are unavailable, write `Session trace không khả dụng (session traces unavailable)` and avoid claiming runtime evidence.

### `Verdict`
- Choose exactly one:
  - `Adopt`
  - `Adopt with constraints`
  - `Keep experimental`
  - `Reject`
- Render it respectively as `Chấp nhận`, `Chấp nhận có điều kiện`, `Tiếp tục thử nghiệm`, or `Từ chối`, followed by the canonical value in parentheses.
- State supported scope, unsupported scope, evidence summary, and blocking issues.

## Required Artifact Sections

The final HTML file must use the template and include these decision-oriented section IDs with Vietnamese visible headings:
- `#decision-summary`
- `#workflow-health`
- `#key-findings`
- `#improvement-impact`
- `#action-plan`
- `#scope-limitations`
- `#evidence-appendix`

## Rules

- Treat the workflow under review as the subject being evaluated
- Do not silently convert workflow design work into workflow adoption
- Do not present a paper review as if runtime exercise had happened
- Do not present workflow documents as proof of actual runtime behavior without session traces or scenario evidence
- If evidence is thin, prefer `Keep experimental` or recommend more `Observe` or `Baseline Exercise`
- If a field is unknown, mark it unknown instead of assuming it
- If session traces are unavailable, mark them unavailable instead of inventing them
- Do not present `agent-reported-observation` as an observed or confirmed failure without corroborating evidence
- Keep the evaluation artifact concise, visually scannable, and reviewable
- Use direct evidence from workflow docs, commands, skills, workflow observations, session traces, and existing artifacts when available
- When reading old workflow artifacts, separate static design evidence from scenario and session-trace evidence
- Do not claim improvement without a comparable baseline
- Use stable finding IDs and severity badges

## Done When

- the workflow subject is explicitly defined
- normalized structure is written
- audit findings are evidence-backed
- baseline evidence is recorded or clearly marked as limited
- session trace evidence is recorded when available, or clearly marked unavailable
- improvement claims include before/after evidence and regression protection
- verdict matches the standard's heuristics
- a self-contained Vietnamese report is written to `docs/ai/workflow-evals/{name}.html`
- the final HTML contains every required section ID and no unresolved `{{...}}` placeholder
- charts cite real counts or denominators, and unavailable metrics are labeled `Chưa đo`

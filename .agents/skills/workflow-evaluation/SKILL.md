---
name: workflow-evaluation
description: Use when the user asks to evaluate, compare, promote, reject, or review an AI workflow itself rather than perform the underlying work that workflow guides. Reads the workflow under review, normalizes it, audits it, exercises it against realistic scenarios and available session traces, and writes an evaluation artifact to docs/ai/workflow-evals/.
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
- performing the underlying work that another workflow is meant to guide
- implementing product features
- fixing application code
- operating the workflow under review as if it were the work itself
- replacing the normal execution or verification steps inside the workflow being evaluated

## Input

Minimum required input:
- workflow name
- workflow artifact paths or a clearly identified workflow subject
- claimed purpose
- claimed task classes
- evaluation goal

Optional:
- comparison target
- runtime context
- known constraints
- session traces, when available:
  - raw transcript path(s)
  - normalized trace directory from `python3 .agents/skills/workflow-evaluation/extract_session_trace.py`
  - `session-trace.json`
  - `chat-history.ndjson`
  - `command-transcript.ndjson`
  - `tool-call-trace.ndjson`
  - `artifact-trail.ndjson`
  - `handoff-notes.json`
  - `decision-log.json`
  - `failure-retry-log.json`

If the workflow subject is spread across multiple files, reconstruct it explicitly before judging it.
If the user provides only raw Claude Code or Codex transcript paths, normalize them first with `python3 .agents/skills/workflow-evaluation/extract_session_trace.py` for Codex traces or `python3 .claude/skills/workflow-evaluation/extract_session_trace.py` for Claude traces when possible.
If the user wants Opencode session history, read it from the local Opencode session store instead of assuming there is a raw transcript file:
- sessions are stored in SQLite, typically at `~/.local/share/opencode/opencode.db`
- list sessions with `opencode session list`
- confirm the db path with `opencode db path`
- normalize the latest matching session with `python3 .agents/skills/workflow-evaluation/extract_session_trace.py --runtime opencode --latest --project <repo-cwd>`
- or normalize a specific session with `python3 .agents/skills/workflow-evaluation/extract_session_trace.py --runtime opencode --session-id <session-id>`
If session traces are unavailable, record them as unavailable instead of inventing runtime behavior.

## Output

Write to:
- `docs/ai/workflow-evals/{name}.md`

If the user asks only for a partial phase such as `Audit`, you may produce that phase alone in the response, but a full workflow evaluation should still end in the durable artifact above.

## Session Trace Preflight

When `session_traces` are provided as raw Claude Code or Codex transcript path(s), run the extractor before `Intake` or `Audit`:

```bash
python3 .agents/skills/workflow-evaluation/extract_session_trace.py --input <raw-transcript-path> --runtime codex
python3 .claude/skills/workflow-evaluation/extract_session_trace.py --input <raw-transcript-path> --runtime claude
```

When `session_traces` come from Opencode, use the local database-backed session history:

```bash
python3 .agents/skills/workflow-evaluation/extract_session_trace.py --runtime opencode --session-id <session-id>
```

When the user asks to audit the latest local session for a runtime, use:

```bash
python3 .agents/skills/workflow-evaluation/extract_session_trace.py --runtime codex --latest --project <repo-cwd>
python3 .claude/skills/workflow-evaluation/extract_session_trace.py --runtime claude --latest --project <repo-cwd>
python3 .agents/skills/workflow-evaluation/extract_session_trace.py --runtime opencode --latest --project <repo-cwd>
```

After extraction:
- replace raw transcript references in the input contract with the normalized artifact paths under `docs/ai/session-traces/{runtime}/{session-id}/`
- use `session-trace.json` as the primary summary artifact
- use `chat-history.ndjson`, `command-transcript.ndjson`, `tool-call-trace.ndjson`, and `artifact-trail.ndjson` as direct audit evidence
- keep the original raw transcript path in the artifact for traceability

If normalized artifacts already exist and match the target session, reuse them instead of re-extracting.

## Execution Flow

1. Read `WORKFLOW_EVALUATION_STANDARD.md`.
2. If only raw session transcript paths or local Opencode session identifiers are available, run the skill-local extractor and update the input contract to point at the normalized artifact set.
3. Define the evaluation input contract explicitly.
4. Run `Intake`.
5. Run `Normalize`.
6. Run `Audit`.
7. Run `Exercise` when realistic evidence or session traces can be gathered.
8. Include `Session Trace Evidence` when real session history is available, or explicitly mark it unavailable.
9. Run `Verdict`.
10. Write the evaluation artifact.

## Phase Requirements

### `Intake`
- Identify the workflow artifact set under review.
- State the workflow's claimed purpose in plain language.
- State intended task classes and evaluation goal.

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

### `Audit`
- Perform static review before scenario execution.
- If session traces exist, compare declared workflow behavior against actual conversation, tool use, handoff, and artifact patterns.
- Record findings with:
  - severity
  - area
  - evidence
  - rationale
  - recommended action
- Check especially for:
  - unclear phase boundaries
  - unclear entry or exit conditions
  - artifacts with no regular reader
  - hidden runtime dependence
  - reliance on undocumented conventions or hidden chat memory
  - blurred lines between assumptions, human judgment, agent judgment, and verified facts
  - poor failure visibility, missing stop conditions, or unsafe escalation behavior

### `Exercise`
- Use realistic scenarios when the user wants a real evaluation rather than a paper review.
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
- If traces are unavailable, write `session traces unavailable` and avoid claiming runtime evidence.

### `Verdict`
- Choose exactly one:
  - `Adopt`
  - `Adopt with constraints`
  - `Keep experimental`
  - `Reject`
- State supported scope, unsupported scope, evidence summary, and blocking issues.

## Required Artifact Sections

The final file must include:
- `## Workflow Under Test`
- `## Scope`
- `## Input Contract`
- `## Claimed Purpose`
- `## Evaluation Goal`
- `## Normalized Model`
- `## Audit Findings`
- `## Exercise Scenarios`
- `## Session Trace Evidence`
- `## Evidence`
- `## Verdict`
- `## Promotion Decision`

## Rules

- Treat the workflow under review as the subject being evaluated
- Do not silently convert workflow design work into workflow adoption
- Do not present a paper review as if runtime exercise had happened
- Do not present workflow documents as proof of actual runtime behavior without session traces or scenario evidence
- If evidence is thin, prefer `Keep experimental` or recommend more `Exercise`
- If a field is unknown, mark it unknown instead of assuming it
- If session traces are unavailable, mark them unavailable instead of inventing them
- Keep the evaluation artifact concise and reviewable
- Use direct evidence from workflow docs, commands, skills, session traces, and existing artifacts when available
- When reading old workflow artifacts, separate static evidence used in `Audit` from scenario evidence and session-trace evidence used in `Exercise`

## Done When

- the workflow subject is explicitly defined
- normalized structure is written
- audit findings are evidence-backed
- exercise evidence is recorded or clearly marked as limited
- session trace evidence is recorded when available, or clearly marked unavailable
- verdict matches the standard's heuristics
- `docs/ai/workflow-evals/{name}.md` is written

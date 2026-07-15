---
title: Sample Workflow Evaluation
description: Example evaluation artifact using the Workflow Evaluation Standard
status: sample
---

# Sample Workflow Evaluation

## Workflow Under Test
- `workflow_name`: `Example Coding Workflow`
- `workflow_type`: `document`
- `workflow_artifacts`:
  - `docs/ai/project/WORKFLOW_CODING_STANDARD.md`

## Scope
In scope:
- evaluate whether the workflow is structured well enough for small updates and bug fixes
- evaluate whether phase boundaries and artifacts are reviewable

Out of scope:
- full runtime validation across multiple coding-agent platforms
- measuring token cost with production-grade telemetry

## Input Contract
- `workflow_name`: `Example Coding Workflow`
- `workflow_artifacts`:
  - `docs/ai/project/WORKFLOW_CODING_STANDARD.md`
- `workflow_type`: `document`
- `claimed_purpose`: define a standard coding workflow for repository tasks
- `claimed_task_classes`:
  - `small updates`
  - `bug fixes`
- `evaluation_goal`: `adoption review`
- `comparison_target`: unknown
- `runtime_context`: repository-local coding agent
- `known_constraints`:
  - no cross-runtime evidence collected in this sample
  - evidence is illustrative, not production-derived
- `session_traces`:
  - `runtime`: `codex`
  - `source_transcript`: `~/.codex/sessions/2026/07/14/rollout-2026-07-14T23-11-34-019f6165-e192-7df1-9ba2-1d04d476a678.jsonl`
  - `normalized_trace_dir`: `docs/ai/session-traces/codex/019f6165-e192-7df1-9ba2-1d04d476a678/`
  - `session_trace`: `docs/ai/session-traces/codex/019f6165-e192-7df1-9ba2-1d04d476a678/session-trace.json`
  - `chat_history`: `docs/ai/session-traces/codex/019f6165-e192-7df1-9ba2-1d04d476a678/chat-history.ndjson`
  - `command_transcript`: `docs/ai/session-traces/codex/019f6165-e192-7df1-9ba2-1d04d476a678/command-transcript.ndjson`
  - `tool_call_trace`: `docs/ai/session-traces/codex/019f6165-e192-7df1-9ba2-1d04d476a678/tool-call-trace.ndjson`
  - `artifact_trail`: `docs/ai/session-traces/codex/019f6165-e192-7df1-9ba2-1d04d476a678/artifact-trail.ndjson`
  - `handoff_notes`: `docs/ai/session-traces/codex/019f6165-e192-7df1-9ba2-1d04d476a678/handoff-notes.json`
  - `decision_log`: `docs/ai/session-traces/codex/019f6165-e192-7df1-9ba2-1d04d476a678/decision-log.json`
  - `failure_retry_log`: `docs/ai/session-traces/codex/019f6165-e192-7df1-9ba2-1d04d476a678/failure-retry-log.json`

## Claimed Purpose
The workflow is intended to provide a standard path for shaping, specifying, executing, syncing, and verifying coding work in this repository.

## Evaluation Goal
This sample evaluates whether the workflow is ready for standard use for the claimed small and medium coding task scope.

## Normalized Model
- `entry_points`:
  - feature request
  - bug fix request
  - small update request
- `ordered_phases`:
  - `Shape`
  - `Recon`
  - `Decide`
  - `/spec`
  - `/execute-spec`
  - `/sync-spec`
  - `/verify-feature`
- `phase_inputs`:
  - `Shape`: user request and high-level intent
  - `Recon`: local repository context
  - `Decide`: shaped request and recon evidence
  - `/spec`: approved scope and approach
  - `/execute-spec`: approved spec
  - `/sync-spec`: implemented behavior and current code reality
  - `/verify-feature`: synced spec and implementation outputs
- `phase_outputs`:
  - `Shape`: bounded problem statement
  - `Recon`: concrete repo findings
  - `Decide`: route choice and next action
  - `/spec`: durable feature spec
  - `/execute-spec`: implementation changes
  - `/sync-spec`: updated spec reflecting real implementation
  - `/verify-feature`: verification artifact
- `durable_artifacts`:
  - spec document
  - synced spec
  - verification artifact
- `human_responsibilities`:
  - choose whether to proceed to the next workflow step
  - review tradeoffs and business correctness
  - decide on approval or sign-off
- `agent_responsibilities`:
  - gather repository evidence
  - write artifacts
  - implement scoped changes
  - run targeted verification
- `runtime_dependencies`:
  - repository filesystem access
  - agent command support for workflow steps
- `required_assumptions`:
  - workflow commands exist and behave as documented
  - repository tasks fit the documented routing model

## Audit Findings
1. `Low` `clarity`
Evidence: phase order and routing are explicit.
Rationale: reviewers can identify expected next steps quickly.
Recommended action: none.

2. `Medium` `artifact usefulness`
Evidence: multiple durable artifacts are produced across the flow.
Rationale: the workflow is structured, but artifact value depends on later phases actually consuming them.
Recommended action: confirm artifact consumption through exercise runs.

3. `Medium` `portability`
Evidence: sample evaluation uses one repository-local runtime context only, with one normalized Codex session trace.
Rationale: the workflow may be portable, but this sample does not prove it.
Recommended action: run the same workflow in at least one additional agent/runtime context before broad portability claims.

4. `Low` `failure visibility`
Evidence: normalized trace artifacts split `chat_history`, `command_transcript`, `tool_call_trace`, `artifact_trail`, and `decision_log` into separate files.
Rationale: the split makes audit review easier because reviewers can inspect tool and handoff evidence without manually parsing a raw runtime transcript.
Recommended action: keep the normalized trace set as the preferred evidence format for workflow audits.

## Exercise Scenarios
1. `Small bounded task`
Expected behavior: route directly into the documented small-task path with minimal overhead and clear artifact expectations.

2. `Bug fix with ambiguity`
Expected behavior: force clarification during early phases and preserve assumptions in durable artifacts.

## Session Trace Evidence
- `trace_source`:
  - raw Codex transcript was normalized with `python3 .agents/skills/workflow-evaluation/extract_session_trace.py`
  - audit evidence was read from `docs/ai/session-traces/codex/019f6165-e192-7df1-9ba2-1d04d476a678/`
- `user_request_or_trigger`:
  - the session started from a repository-local workflow evaluation question
- `phase_transitions`:
  - commentary, repo inspection, web verification, and final synthesis were visible in the trace
  - no durable workflow-eval artifact was written in the traced session, so artifact-writing behavior remained only partially exercised
- `tool_and_command_evidence`:
  - command and tool activity were available separately through `command-transcript.ndjson` and `tool-call-trace.ndjson`
  - runtime context and agent status updates were visible through `artifact-trail.ndjson` and `handoff-notes.json`
- `decision_visibility`:
  - explicit reasoning summaries were captured in `decision-log.json`
  - this improves auditability versus relying on chat messages alone
- `divergence_from_declared_workflow`:
  - the traced session behaved more like a scoped investigation than a full `Intake` → `Normalize` → `Audit` → `Exercise` → `Verdict` run
  - this is acceptable for a sample, but not sufficient as promotion-grade runtime evidence

## Evidence
| Scenario | Observed workflow behavior | Ambiguity resolution | Artifact consumption | Breakdown | Cost notes |
|---|---|---|---|---|---|
| Small bounded task | Flow stays readable and scoped | minimal ambiguity | normalized trace artifacts make chat and tool evidence separately reviewable | none in sample | moderate overhead for very small changes |
| Bug fix with ambiguity | Early phases expose missing detail before execution | assumptions become visible before implementation | spec and verification artifacts are expected to be consumed later | portability remains unproven | higher cost, but justified by reduced hidden assumptions |

## Verdict
- `final_status`: `Adopt with constraints`
- `supported_scope`:
  - repository-local coding workflow evaluation
  - small and ambiguous coding tasks where durable artifacts matter
- `unsupported_scope`:
  - cross-runtime portability claims
  - production-grade cost benchmarking
- `evidence_summary`:
  - workflow structure is reviewable
  - artifact flow appears coherent
  - normalized session traces improve runtime auditability
  - portability is not yet proven
- `blocking_issues`:
  - no blocking `High` issues in this sample
- `required_changes_before_promotion`:
  - add cross-runtime or cross-project exercise evidence before claiming broader standard portability

## Promotion Decision
This sample supports constrained adoption only. The workflow looks operational inside the repository context, but broader promotion should wait for stronger exercise evidence.

## Constraints
- this file is illustrative and not based on a completed production evaluation
- severity and verdict are examples of the documented format
- session trace paths are sample paths that demonstrate the expected artifact contract

## Follow-up Required
- create one real evaluation artifact against a live workflow candidate
- compare two workflow variants using the same scenario set

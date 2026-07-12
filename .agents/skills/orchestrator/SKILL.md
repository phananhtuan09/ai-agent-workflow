---
name: orchestrator
description: "Use when the human wants to execute a documented workflow config end-to-end until the next gate, blocker, or manual stop. Reads `docs/ai/workflows/*.json`, runs inline/skill/subagent steps in order, persists run state, and enforces contract-based dependencies. Do not use for free-form planning or when no workflow config exists."
---

# Orchestrator

Run a predefined workflow config until the next stop condition.

## Supported Invocations

- `/orchestrator start docs/ai/workflows/{workflow}.json`
- `/orchestrator start docs/ai/workflows/{workflow}.json --slug <feature-slug>`
- `/orchestrator next`
- `/orchestrator continue`
- `/orchestrator next --skip`
- `/orchestrator status`

## Inputs

- Required on `start`: path to a workflow JSON file
- Required on `start`: feature slug for artifact naming
- Optional on `start`: runtime notes if the workflow needs them
- Required on `next` / `continue`: existing state file at `docs/ai/workflows/.orchestrator-state.json`
- Optional on `next --skip`: explicit human request to skip the current step
- Required on `status`: existing state file at `docs/ai/workflows/.orchestrator-state.json`

`feature_slug` rules:

- Prefer explicit `--slug <feature-slug>` on `start`
- `feature_slug` must be kebab-case because it becomes the shared artifact stem for spec, summary, verification, and checklist files
- If the human omits it, derive a kebab-case slug from the feature description or workflow subject, show the derived slug to the human, and record that derived value in state before running the first step

## State File

Use one active-run state file for slice 1:

- Path: `docs/ai/workflows/.orchestrator-state.json`
- Keep it human-readable JSON
- Overwrite only the active-run fields that changed

Minimum fields:

```json
{
  "run_id": "feature-standard--my-feature--2026-07-12T10-30-00Z",
  "workflow_id": "feature-standard",
  "workflow_path": "docs/ai/workflows/feature-standard.json",
  "feature_slug": "my-feature",
  "status": "running",
  "current_step_id": "execute-spec",
  "contracts": {
    "shape_checked": true,
    "recon_checked": true,
    "decision_ready": true,
    "spec_synced": true,
    "runtime_verified": false
  },
  "artifact_paths": {
    "spec_path": "docs/ai/specs/my-feature.md",
    "summary_path": "docs/ai/summaries/my-feature.md",
    "verification_path": "docs/ai/verifications/my-feature.md"
  },
  "history": [
    {
      "step_id": "shape",
      "action": "run",
      "outcome": "continue"
    }
  ]
}
```

## Execution Model

1. Load the workflow config.
2. If `start`, initialize a new state file with empty contracts and artifact paths.
   - resolve and persist `feature_slug` before the first step runs
3. Determine the next pending step from config order.
4. Before running a step:
   - verify every `requires` contract exists in state
   - reject `--skip` if `skippable` is `false`
   - collect step inputs only when the step is reached
5. Execute by `exec` type:
   - `inline`: perform the documented step directly in chat
   - `skill`: run the named skill
   - `subagent`: dispatch to the named subagent
6. Parse the last occurrence of an orchestrator HTML comment when the step is a skill or subagent.
   - Match the last `<!-- orchestrator: ... -->` block in the output
   - Do not require it to be the literal final line if later whitespace or harmless trailing text appears
   - If no orchestrator comment exists, treat outcome as `unknown`
7. Update state:
   - write outcome to history
   - add any emitted contracts to `contracts`
   - add any emitted `*_path` fields to `artifact_paths`
8. Continue automatically only when:
   - the step outcome is `continue`
   - the next step has `auto: true`
   - no `human_gate`, `stop_on_outcome`, missing contract, or unknown outcome blocks progress

## Inline Step Contracts

Inline steps do not depend on external skill comments. Record these outcomes directly:

- `shape` success:
  `continue` + `shape_checked`
- `recon` success:
  `continue` + `recon_checked`
- `decide` success:
  `continue` + `decision_ready`
- `decide` if questions are needed:
  `stop-ask-human`
- `decide` if work must be sliced:
  `stop-split-slices`
- `decide` if a spike is required:
  `stop-run-spike`
- `decide` if there is a codebase or business conflict:
  `stop-escalate-conflict`

## Outcome Rules

Accepted outcomes:

- `continue`
- `stop-ask-human`
- `stop-split-slices`
- `stop-run-spike`
- `stop-escalate-conflict`
- `stop-blocked`
- `stop-too-broad`
- `stop-fail`
- `stop-drift`
- `unknown`

Rules:

- If a skill/subagent output contains no orchestrator comment, treat outcome as `unknown`
- Do not infer paths or outcomes heuristically from prose
- If a step ends with `continue` but does not emit every declared `provides` contract, stop and mark the run blocked
- `skip` never satisfies `requires`

## Workflow Rules

- `manual-checklist` is always human-triggered, even if the config says otherwise
- `requires` means contract or artifact presence in state, not "a previous step once ran"
- `provides` means contracts that must be recorded when the step succeeds with `continue`
- If a step hits `human_gate: true`, stop immediately after writing state
- If a step outcome matches `stop_on_outcome`, stop immediately after writing state
- If the workflow path or state file is missing, stop and report the missing file
- `status` must read and summarize the current state without advancing, skipping, or mutating the workflow

## Output

After each invocation, return:

- current run status
- current or next step id
- why execution stopped or continued
- state file path
- any artifact paths newly recorded this turn

For `status`, return:

- workflow id
- feature slug
- current step id
- current run status
- last stop reason if present
- recorded contracts
- recorded artifact paths

## Done When

- `start` created the state file and either advanced until a stop condition or reported why it could not start
- `next` / `continue` advanced exactly until the next stop condition
- state and contracts remain consistent with the workflow config

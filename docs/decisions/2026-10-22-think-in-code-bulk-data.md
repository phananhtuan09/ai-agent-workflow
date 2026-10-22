# Think in code for bulk data (experimental)

Status: Accepted
Date: 2026-10-22
Scope: Execution rules in `docs/WORKFLOW.md`

## Context

Agents often load raw bulk data such as test logs, build output, payloads, or hundreds of files into context to count, filter, or extract a few facts.
That spends tokens and dilutes attention from the actual task.
The context-mode project (mksglu) reports large savings by programming such analysis as scripts that print only the result, but it ships a sandbox and hooks that do not fit this repository's prompt-only direction.

## Decision

1. Add a guidance-only rule to the Execution rules in `docs/WORKFLOW.md`: when counting, filtering, aggregating, or extracting from roughly five or more files or 300 or more lines of bulk data, write a small script that prints only the needed result.
2. Bulk data is logs, test or build output, payloads, and statistics across many files.
   Reading code to understand or change it is explicitly excluded, and a search script never replaces reading a component the agent is about to change.
3. Temporary scripts live in a temporary or git-ignored directory and stay rerunnable so the origin of a number can be checked.
4. The rule is experimental.
   Hypothesis: a prompt-only rule reduces the context consumed by bulk-data analysis by a large fraction without degrading code understanding.
   Success criteria: on real bulk-data tasks, script source plus output stays below 10% of the raw data size, and no review finds a change made without reading the changed component because of this rule.
   The previous behavior is restored by removing the four rule lines.

## Constraints

- The rule is guidance, not enforcement; thresholds are approximate.
- No new skill, command, hook, or installed tool, and no manifest or constitution change.
- Do not describe the rule as proven until more real tasks than the single measurement below support it.

## Consequences

- Positive: one measured case reduced context for a bulk-data question by about 99.9%.
- Positive: installed projects receive the rule through the existing `docs/WORKFLOW.md` update path.
- Negative: writing a script costs a turn and can hide data the agent did not anticipate needing; the code-reading exception limits but does not remove that risk.
- Negative: savings depend on the agent recognizing bulk data; small outputs below the threshold gain nothing.

## Measurement

Measured on 2026-10-22 with a temporary script in `/tmp`.

- Case 1, full `npm test` output: 64 lines, 4,071 bytes, all passing.
  It is below the threshold, so the rule correctly does not apply.
- Case 2, a real Claude Code session transcript for this repository (JSONL): 489 lines, 983,679 bytes.
  Question: how many tool calls by tool, and how many tool results errored.
  A 14-line, 726-byte Python script printed 2 lines, 91 bytes: 78 tool calls (76 Bash, 1 TaskStop, 1 ToolSearch) and 2 errored Bash results.
  Context cost was 817 bytes (script plus output) versus 983,679 raw bytes, a reduction of about 99.9%.
- Caveat: an agent would rarely read a file of this size whole; a realistic baseline of partial reads and greps is smaller than the raw size, so actual savings are lower than the ratio above.
  This is one measurement, not a benchmark.

## Alternatives considered

- Install context-mode: rejected because its sandbox and hooks conflict with the prompt-only, portable direction.
- A dedicated skill: rejected because a single rule covers the behavior and skills require demonstrated recurring use.

## References

- Human request, 2026-10-22: implement GitHub issue #28, adding the think-in-code rule for bulk data to `docs/WORKFLOW.md` with a measured real case.
- [Repository-driven workflow](../WORKFLOW.md)
- [Workflow coding constitution](../other/WORKFLOW_CODING_CONSTITUTION.md), experiment requirements

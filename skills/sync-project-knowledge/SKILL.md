---
name: sync-project-knowledge
description: Survey an existing repository and create or update durable project knowledge after workflow installation or when documentation needs reconciliation with the project. Use for repository knowledge onboarding or synchronization, not ordinary implementation tasks or automatic documentation of every code change.
---

# Sync Project Knowledge

## Outcome and scope

Establish useful project knowledge in the repository's existing authoritative locations.
Apply supported documentation updates directly when the user requests synchronization.
Use the same approach for initial onboarding, later refreshes, and a requested module scope.
Do not require a separate approval of routine documentation edits already authorized by the request.
For an explicit preview or review request, report proposed changes without writing them.

Follow repository instructions and `docs/WORKFLOW.md` when present.
Preserve existing edits and reuse established document structure, language, identifiers, and source conventions.
Do not change production code, tests, dependencies, workflow policy, installer state, or runtime configuration as part of knowledge synchronization.
The project-guidance section below permits narrowly scoped project instruction edits while preserving the shared workflow protocol and global instructions.
Do not create a separate project-context file, scan report, tracker, or plan merely to record this operation.

## Discover existing authority and evidence

Inspect the working tree and locate existing instructions and project documentation before reading implementation details.
Include relevant documentation outside the workflow directories.
Reuse or link an existing authoritative source instead of copying it into a competing document.

Survey manifests, module boundaries, scripts, CI, schemas, and tests within the requested scope.
Read representative implementations and investigate discrepancies rather than exhaustively reading every source file.
Exclude generated output, dependencies, and secret values from the survey and generated documentation.
For large repositories, cover the repository structure broadly and inspect relevant modules selectively.
Report meaningful coverage limits instead of claiming a complete audit.

Distinguish accepted intent, observed implementation, and unconfirmed inference.
Code and tests show current behavior; they do not automatically establish intended business rules or accepted conventions.
An explicit user answer can establish durable intent when it clearly confirms a rule that should persist.
Do not invent historical decisions, rationale, approval, or verification evidence.

## Route knowledge

Use the repository's established authority locations; the workflow defaults are:

| Destination | Eligible content | Evidence boundary |
| --- | --- | --- |
| `docs/product/` | Accepted business rules, domain terms, and externally observable requirements | Do not promote code-only behavior into intended policy. |
| `docs/patterns/` | Accepted recurring implementation conventions and invariants | Repetition is evidence of a pattern, not sufficient proof that it is required. |
| `docs/decisions/` | Meaningful accepted choices, constraints, and their supported rationale | A dependency or implementation choice alone does not explain why it was chosen. |
| `docs/runbooks/` | Verified setup, testing, operations, and recovery procedures | Distinguish a discovered command from a verified procedure. |

Update the existing document covering a topic before creating another.
Create a document only when supported durable knowledge is missing and has no suitable existing home.
Do not fill every directory or generate placeholders to make onboarding appear complete.
Use an existing documentation index when navigation needs improvement; keep entries as links with short descriptions rather than duplicated rules.
Keep useful source references close to consequential claims, using repository-relative paths and stable symbols or existing decision identifiers where possible.
Attribute user-confirmed intent honestly without inventing the user's identity, a formal approval record, or a historical date.

## Keep project guidance bounded

In the target project's `AGENTS.md`, create or update a single `## Project guidance` section only when supported project-specific guidance materially improves task routing or prevents a recurring mistake.
Reuse an equivalent existing section rather than adding a second one.
Do not edit the upstream workflow template as a side effect of synchronizing a consumer project.
Preserve the shared protocol, authority rules, and unrelated instructions.

The entire section must contain at most six flat bullets and 150 whitespace-separated words, excluding the heading.
These are ceilings, not targets; use fewer bullets when sufficient and omit the section when there is no useful guidance.
Use one short sentence per bullet, with no nested lists, tables, code blocks, or additional subsections.
Do not evade the limits by adding adjacent context sections or moving overflow into another automatically loaded instruction file.

Include only verified project orientation or accepted guidance relevant across recurring tasks, whose absence is likely to cause an incorrect approach.
Prefer conditional routing to an existing authoritative document, such as reading a compatibility decision before changing public behavior.
Verify every referenced path and require reading only when the stated task condition applies.
Keep detailed rules, commands, rationale, and examples in their appropriate artifacts.
Exclude module inventories, dependency lists, business-rule summaries, task status, scan findings, and generic standards already covered by the protocol.
Do not convert observed implementation into a new mandatory rule through this section.

On refresh, replace stale or lower-value entries instead of continually appending bullets.
Consolidate existing guidance within the limits without discarding accepted constraints; retain their authoritative source and a concise routing link when needed.
If fitting existing guidance requires resolving unclear ownership or changing accepted policy, preserve the disputed content and ask in the next focused round rather than silently removing it.
Report any unresolved over-limit section instead of claiming it meets the budget.

Inspect the project instruction entrypoint used by the selected runtime.
If an existing Claude project entrypoint already reads `AGENTS.md`, reuse that route without duplicating guidance.
Otherwise, when Claude is in scope and `.claude/CLAUDE.md` exists, add or update a concise instruction to read the project-root `AGENTS.md` Project guidance section, using an unambiguous repository-relative path.
Preserve all other runtime instructions and do not create new runtime configuration or edit global instruction files.
If the applicable entrypoint cannot be determined, report the loading gap rather than assuming the guidance will be read.

## Ask in focused rounds

Before asking, collect the unresolved questions that materially affect durable knowledge and cannot be answered from available evidence.
Group independent questions into a single round by topic, with a small readable batch, typically three to five questions.
Ask fewer when fewer are needed; never manufacture questions to fill a batch.
When there are many questions, prioritize those that unlock the most work and split the remainder into subsequent rounds.
Wait for a round's answers before asking dependent follow-up questions, and omit questions those answers already resolve.

For each question, briefly state the observation or conflict, identify its source, and ask for the missing decision in concrete project terms.
Offer succinct choices only when they make the decision easier, and recommend an option only when evidence supports it.
Use the available question tool when appropriate, respecting its question limits; otherwise ask a short numbered batch in conversation.
Do not serialize independent questions into one-message-per-question interviews.

Continue supported, independent documentation work while answers are pending when the interaction environment permits it.
Do not treat silence, an unanswered question, or approval of another answer as confirmation.
If a reply addresses only part of a batch, apply those answers and retain only the material unresolved questions for the next round.
When intent sources conflict, defer edits to the disputed knowledge until the current request or a user decision resolves the conflict.
Do not overwrite accepted intent merely to match contradictory code.
Report code discrepancies separately without repairing them under this skill's documentation scope.
If the user leaves an issue undecided, leave that content unchanged or uncreated and report the gap; do not persist speculation as authority.

## Apply and verify

Make the smallest coherent documentation edits supported by the survey and user answers.
Retain valid existing content and avoid broad rewrites, relocation, or formatting churn.
Write each complete Markdown sentence on its own line while preserving tables, lists, and code blocks.
An unchanged repository with no new accepted knowledge should produce no edits on a repeat run.

Check changed claims against their sources, verify linked paths, and inspect the diff for contradictions, duplication, unsupported authority, and unintended edits.
For project guidance, count bullets and words, check that each entry meets the inclusion criteria, and verify that runtime routing adds no duplicate guidance or circular read requirement.
For a runbook, use existing trustworthy execution evidence or perform a safe, relevant local check after inspecting prerequisites and command effects.
Do not execute deployments, destructive migrations, production operations, or commands against unknown databases merely to document them.
If prerequisites or reliable execution evidence are missing, report that limitation and do not describe the procedure as verified.
Run only checks relevant to changed documentation or the procedure being verified; a full application test suite is not required for every knowledge update.

## Handoff

Report the documents changed and why, actual verification performed, material coverage limits, and unresolved questions or code/document discrepancies.
Distinguish completed updates from deferred knowledge so partial onboarding is not presented as complete.
If no update is justified, say so without creating an artifact to mark the run.

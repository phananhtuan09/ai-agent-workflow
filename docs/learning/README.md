# Learning Knowledge

This namespace stores the durable state of the optional learning capability. It is independent of repository product authority and ordinary coding work.

## Authority

- `CONSTITUTION.md` is the highest-level authority for learning principles, human ownership, case integrity, and evaluation integrity.
- `STANDARD.md` defines the executable learning contracts and artifact invariants.
- `project.json` and `schedule.json` are learning-program context. Draft values are proposals; accepted values remain learning state, not repository product intent.
- `cases/` stores checksum-bound durable learning cases.
- `sessions/` stores the single durable record for each learning session.
- `profile.json` stores the learning profile and progression state.

Do not create a second learning constitution or silently promote learning artifacts into `docs/product/`, `docs/decisions/`, source code, or production configuration.

## Admission and mutation

Use the installed learning state scripts for project, schedule, profile, and session transitions. Case creation must also use the shared `docs/learning/` lock, validate before commit, and write through a recoverable atomic operation. Do not hand-edit state when a script or bounded helper operation supports the transition. Only the learning coordinator owns the end-to-end session conversation; helpers return bounded results and do not silently advance a session.

Learning state mutations are single-writer operations. The state scripts serialize mutations under the shared learning lock, compare the loaded snapshot before commit, and recover an interrupted multi-file transaction before accepting another mutation. A stale-snapshot error must be retried from freshly loaded state; it must not be resolved by overwriting newer state.

A learning case must be copied under `cases/` before a session binds to it. An installed skill directory is not durable case storage.

## Coding workflow integration

Ordinary software delivery remains governed by the repository-driven workflow in `docs/WORKFLOW.md` and its applicable product, decision, safety, validation, and completion rules.

When a learning activity also creates or changes software:

1. Learning first declares the active competency, protected judgment, authorized scope, and attribution boundary.
2. A production deliverable runs through the repository's normal coding workflow. Learning state or session approval does not replace product intent, implementation authority, validation, or human sign-off.
3. A disposable spike, benchmark, or simulation runs in an isolated worktree or temporary directory unless the coding workflow explicitly authorizes a target-tree change.
4. The coding workflow owns implementation and safety validation; learning records only the bounded system evidence and keeps human interpretation protected when required.
5. If the learning boundary and coding boundary conflict, do not mutate until the human resolves the conflict, except for an already-authorized safety or incident response.

Do not run concurrent writers against the same source, configuration, schema, migration, or learning state files. Read-only work may run concurrently when it does not depend on a mutable shared snapshot.

## Evidence and retention

A session stores concise observable decisions, assumptions, predictions, revisions, assistance, evidence summaries, limitations, and stable references needed for assessment or continuity. It must not store private chain-of-thought.

Raw commands, logs, and generated artifacts are retained only when a later assessment, audit, or reproducible claim has a reader for them. Record repository-relative paths, checksums, timestamps, or other stable references without secrets. Temporary fixtures, binaries, isolated worktrees, and disposable spike output must be removed after proof unless an explicit downstream reader requires them.

## Promotion boundary

A case decision or learning-project evolution is not repository product behavior, an architecture decision, a risk acceptance, or a production implementation. Promotion requires a separate explicit human-authorized request evaluated under the repository workflow and written to the appropriate durable namespace only when its admission criteria are met.

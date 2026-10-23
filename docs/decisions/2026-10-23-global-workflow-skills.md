# Ship brainstorm-partner, smart-commits, and triage as global skills

Status: Accepted
Date: 2026-10-23
Scope: `global-skills/`, `skills/manifest.json` bundles `core`, `planner-mode`, and the removed `issue-triage`

## Context

`brainstorm-partner`, `smart-commits`, and `triage` were project-scoped canonical skills installed by bundles.
Their content does not depend on this kit's docs layout once `smart-commits` and `triage` fall back to `AGENTS.md`, `CLAUDE.md`, and `README` when `docs/WORKFLOW.md`, `docs/product/`, or `docs/decisions/` are absent.
The owner wants them available in every project on the machine without installing them per repository.

## Decision

The three skills live only under `global-skills/` and are installed machine-wide by following `global-skills/README.md`.
No bundle installs them: `core` and `planner-mode` no longer list them, and the `issue-triage` bundle is removed.
`planner` keeps routing to `brainstorm-partner` and `smart-commits` by name and falls back to `docs/WORKFLOW.md` when they are not installed.

## Constraints

- Global skills must not assume this kit's docs layout; they read kit files only when present.
- A skill exists in one source tree only, `skills/` or `global-skills/`, never both.

## Consequences

- Positive: one copy per machine serves every project, and the skills no longer duplicate per repository.
- Negative: `npx ai-workflow-init update --apply` retires unchanged project copies of these skills from projects installed earlier; those projects need the global install.
- Negative: cloud sessions, CI, and other contributors do not get these skills unless their environment installs them.
- Negative: `--bundle issue-triage` now fails as an unknown bundle.

## Alternatives considered

- Keep the project copies and add global copies: rejected by the owner in favor of a single global source.

## References

- Human request, 2026-10-23: move `brainstorm-partner`, `smart-commits`, and `triage` into `global-skills/` and update the READMEs.
- `docs/decisions/2026-09-19-canonical-skill-source.md`
- `docs/decisions/2026-10-16-planner-capability.md`

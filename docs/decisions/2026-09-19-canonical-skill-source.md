# Keep skills canonical in the kit source

Status: Accepted
Date: 2026-09-19
Scope: Skill source layout, package maintenance, and installation into target repositories

## Context

This repository is an installation kit for applying the workflow to other projects. It is not itself an installed workflow consumer. Canonical skill implementations already live under `skills/`.

Maintaining generated copies under `.agents/skills/` and `.claude/skills/` duplicates the same source, creates drift risk, and makes the kit checkout look like a consumer project. The installer already adapts canonical skill content while copying selected skills into a target repository.

## Decision

`skills/` is the only canonical skill tree in this kit repository. The kit repository must not generate or retain `.agents/skills/` or `.claude/skills/` mirrors.

Runtime-specific skill directories are installation outputs only. The installer may create `.agents/skills/` or `.claude/skills/` inside a selected target repository according to that runtime's discovery contract.

## Constraints

- Skill implementation changes must be made only under `skills/`.
- Repository maintenance commands must validate canonical skills without generating runtime mirrors in this repository.
- Runtime path adaptation must happen in memory or in the target repository during installation.
- Runtime-specific non-skill payloads used as installer templates are outside this decision; they must not contain duplicate canonical skill trees.

## Consequences

- Positive: one source of truth for every skill and no generated skill noise in the kit checkout.
- Positive: package installation behavior remains runtime-compatible for target repositories.
- Negative: maintainers cannot inspect a pre-generated runtime skill tree in this repository; runtime adaptation must be verified through installer tests.

## Alternatives considered

- Keep synchronized runtime mirrors in the kit repository. Rejected because they duplicate `skills/` and are unnecessary for installation.

## References

- `skills/manifest.json`
- `lib/skills.js`
- `lib/install.js`

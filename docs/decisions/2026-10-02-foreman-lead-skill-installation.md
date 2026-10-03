# Foreman project Lead skill installation

Status: Accepted
Date: 2026-10-02
Scope: Canonical source and optional installation of Foreman's project-scoped Lead capability

## Context

Foreman's accepted project-scoped SLP architecture requires one Lead per managed project to coordinate bounded Peers through Foreman's canonical protocol.
The workflow-base repository is the shared source imported into managed projects; it is not the Foreman runtime or the owner of fleet state.
The existing installer supports explicitly selecting a canonical skill and adapting it for the selected project coding runtime.

## Decision

1. Maintain the shared capability as the optional canonical skill `foreman-lead` under `skills/foreman-lead/`.
2. Install it into a managed project by explicitly selecting `--skill foreman-lead` with the existing installer and the project's selected coding tool.
   Do not add it to the default kit or default `core` bundle; projects that do not use SLP remain independent of the skill.
3. Use the existing installer and runtime adaptation for the project's supported coding tool.
   Do not create a second Lead installer or retain generated `.agents/skills/` or `.claude/skills/` copies in this repository.
4. The skill defines Lead behavior inside the managed project: load project instructions and knowledge, assess task clarity and workflow, request bounded Peer work, handle reports and review, and return blockers or readiness through Foreman's supported protocol.
   The Foreman SLP decision remains the source of truth for request authority, report identity, lifecycle, and safety boundaries; the skill must not define a competing state store or worker-spawning path.
5. A project's SLP dispatch prerequisite is met only when a compatible installed revision is discoverable by its selected coding tool and the Lead is instructed to load it alongside the project's actual instructions.
   An upstream skill update does not silently alter an installed project.

## Constraints

- The canonical source is under `skills/` and follows this repository's existing skill manifest, checks, and installer.
- Installation is explicit, runtime-adapted, and preserves existing project instructions and skill directories.
- No project may use skill presence as a substitute for Foreman's deterministic identity, scope, resource, or lifecycle validation.
- The skill remains optional and must not introduce a mandatory design/audit/implementation chain for ordinary project work.

## Consequences

Projects can opt into the Lead workflow using the existing distribution path and keep their own workflow authority.
The Foreman core and the workflow-base skill must be delivered at compatible revisions, and each pilot project must import and verify the skill separately.
Projects without the skill cannot receive SLP dispatch.

## References

- [Canonical skill source decision](2026-09-19-canonical-skill-source.md)
- [Canonical skill directory](../../skills/README.md)
- [Foreman project-scoped SLP architecture](../../../foreman/docs/decisions/2026-10-02-project-scoped-supervisor-lead-peer.md)

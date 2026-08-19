---
title: Skill Maintenance Guide
description: Manual procedure for maintaining skills across Codex and Claude runtimes
---

# Skill Maintenance Guide

Use this document whenever a project needs to update, customize, or reconcile an AI skill.

## Runtime layout

Coding agents load skills from runtime-specific folders.

```text
.claude/skills/<skill-id>/SKILL.md   # canonical project copy when both runtimes exist
.agents/skills/<skill-id>/SKILL.md   # Codex and Antigravity discovery copy
```

The two folders exist because different coding agents discover skills from different locations.

Do not move the skill content to another folder and expect the coding agents to discover it automatically.

## Source-of-truth rules

When a project contains both `.claude/skills/` and `.agents/skills/`, treat `.claude/skills/` as the project source of truth for skill content.

Treat `.agents/skills/` as the runtime discovery adapter.

The adapter must keep the skill `name` and `description` frontmatter so Codex or Antigravity can discover the skill.

The adapter should contain a short instruction that points the agent to the matching `.claude/skills/<skill-id>/SKILL.md` file.

The adapter must not silently replace customized content in `.claude/skills/`.

When only one runtime folder exists, inspect the existing skill before deciding whether it is canonical or an incomplete adapter.

When the repository source `skills/<skill-id>/` is also present, treat it as upstream reference material.

Do not overwrite project customizations with the repository version without explicit user approval.

## Manual update procedure

An AI agent handling a skill update must follow these steps:

1. Read this document completely.
2. List the relevant files under `skills/<skill-id>/`, `.claude/skills/<skill-id>/`, and `.agents/skills/<skill-id>/`.
3. Compare the files and identify which runtime copy contains project-specific changes.
4. Report missing files, changed behavior, conflicting instructions, and runtime-specific path differences.
5. If both runtime folders contain full skill content, do not choose a version silently.
6. Present the conflict and ask the user which behavior should be preserved when the difference affects behavior, safety, workflow routing, or project conventions.
7. Apply the approved result to `.claude/skills/<skill-id>/`.
8. Rebuild `.agents/skills/<skill-id>/SKILL.md` as a discovery adapter that preserves the frontmatter and references the canonical Claude file.
9. Verify that every path, script, reference file, and asset mentioned by the canonical skill exists.
10. Show the final diff and the verification result to the user.

## Adapter format

Use this shape for `.agents/skills/<skill-id>/SKILL.md` when the skill is maintained canonically in `.claude/skills/`:

```markdown
---
name: <skill-id>
description: <same discovery description as the canonical skill>
---

The canonical instructions for this skill are in:
`.claude/skills/<skill-id>/SKILL.md`

Read that file and its referenced resources before executing the skill.
```

Keep the adapter short.

Do not duplicate the full skill instructions in the adapter.

Do not create an adapter that points to a file which does not exist.

## Prohibited automatic actions

Do not use a script to guess which customized skill version should win.

Do not merge two full skill files automatically when their instructions differ.

Do not overwrite `.claude/skills/` or `.agents/skills/` before inspecting the diff.

Do not delete project-specific references, assets, examples, or scripts merely because they are absent from the upstream skill.

Do not claim that the skill update is complete until the user can review the resulting diff.

## Upstream synchronization

When updating from the workflow repository, compare the upstream `skills/<skill-id>/` content with the project's `.claude/skills/<skill-id>/` content first.

Preserve project-specific changes unless the user explicitly chooses the upstream behavior.

After an approved merge, update the `.agents/skills/` adapter and verify both runtime paths.

The existing sync scripts may be used for a clean generated checkout, but they are not a conflict-resolution mechanism for customized project skills.

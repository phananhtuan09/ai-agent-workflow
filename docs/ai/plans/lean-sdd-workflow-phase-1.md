# Phase 1: Cleanup

## Goal
Delete all orchestration commands and agents that are replaced by the new lean flow.

## Tasks

### Commands to delete (in .claude/commands/ or .claude/skills/)
- [ ] [DISCOVER] List all files under .claude/commands/ and .claude/skills/ to
      confirm exact paths before deleting. Output full list.
- [ ] Delete requirements-orchestrator (command + any related file)
- [ ] Delete development-orchestrator
- [ ] Delete test-web-orchestrator
- [ ] Delete create-plan command
- [ ] Delete review-spec command (will be replaced in Phase 3)
- [ ] Delete all wiki-* commands (wiki-guide, wiki-find, wiki-init, wiki-add-doc,
      wiki-update, wiki-impact-check, wiki-reconcile, wiki-retire-doc, wiki-review-queue)

### Agents to delete (in .claude/agents/)
- [ ] [DISCOVER] List all files under .claude/agents/ to confirm exact paths.
- [ ] Delete requirement-ba
- [ ] Delete requirement-sa
- [ ] Delete requirement-researcher
- [ ] Delete requirement-uiux
- [ ] Delete task-investigator
- [ ] Delete dev-verifier
- [ ] Delete test-web-analyst
- [ ] Delete test-web-qc
- [ ] Delete test-web-runtime-probe
- [ ] Delete test-web-ui-mapper
- [ ] Delete test-web-verifier

### Hooks/logging to remove
- [ ] [DISCOVER] Read .claude/settings.json — find any logging hooks referencing
      get_logging_guide or write_log
- [ ] Remove logging hooks from settings.json (keep all other hooks intact)

## Done when
All listed files deleted. settings.json has no logging hooks.
Remaining .claude/ structure: commands/, agents/, skills/, settings.json, CLAUDE.md only.

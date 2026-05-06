# Plan: Refactor to Lean Specs-Driven Workflow

## Context
Refactor the Claude Code workflow from a multi-agent orchestration system to a
lean Specs-Driven Development (SDD) workflow. Remove sub-agents and complex
orchestration. Replace with 5 simple commands that Claude executes directly.

## Approach
Delete all orchestration commands and agents. Create 5 new commands (init, spec,
plan, execute-plan, verify). Update 2 existing agents (review-plan, spec-review)
to align with new flow. Update .claude/CLAUDE.md to new project-scope format.
No code changes — only .claude/ command/agent markdown files.

## Phases
- Phase 1: Cleanup → docs/ai/plans/lean-sdd-workflow-phase-1.md
- Phase 2: Create new commands → docs/ai/plans/lean-sdd-workflow-phase-2.md
- Phase 3: Update existing files → docs/ai/plans/lean-sdd-workflow-phase-3.md

## AC Coverage
- AC1: All deleted files removed ← Phase 1
- AC2: 5 new commands functional ← Phase 2
- AC3: review-plan + spec-review updated ← Phase 3
- AC4: .claude/CLAUDE.md updated ← Phase 3

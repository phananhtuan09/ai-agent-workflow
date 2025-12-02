---
phase: planning
title: Planning Documentation
description: Feature planning docs and workflow guidelines
---

# Planning Documentation

## Purpose
This directory contains planning documents for individual features. Each feature plan includes both high-level goals and detailed implementation steps in a single file.

## Feature Planning Workflow

### Creating a Feature Plan
Use the `create-plan` command to generate a new feature plan:
- Command: Available in `.cursor/commands/`, `.claude/commands/`, or `.github/prompts/`
- Output: `docs/ai/planning/feature-{name}.md`
- Template: `docs/ai/planning/feature-template.md`

### Feature Plan Structure
Each feature plan follows the template structure with 5 sections:

1. **Goal & Acceptance Criteria**: Objectives, scope, and Given-When-Then format
2. **Risks & Assumptions**: Key risks and assumptions to be aware of
3. **Definition of Done**: Completion criteria (build/test/review/docs)
4. **Implementation Plan**:
   - Summary of solution approach
   - Phases with detailed tasks and pseudo-code
5. **Follow-ups**: TODOs or deferred work

### What Makes a Good Plan?
A good plan helps both humans and AI agents understand:
- **For humans**: What problem we're solving, why, and how
- **For AI agents**: Exactly what files to change, what logic to implement, and in what order

The plan should be:
- Clear enough for a different AI agent to execute independently
- Detailed enough with pseudo-code to guide implementation
- Concise enough to avoid information overload

### From Plan to Execution
- After the plan is written, use the `execute-plan` command to begin implementation
- The AI agent will read the plan and implement tasks phase by phase
- Tasks are tracked with checkboxes `[ ]` → `[x]` as they complete
- Do not start coding until the plan is reviewed and agreed upon

### Feature Plan Naming Convention
- Format: `feature-{name}.md` (kebab-case)
- Example: `feature-user-authentication.md`
- If duplicate name exists, append suffix: `feature-{name}-2.md`

## Template Reference
See `feature-template.md` for the exact structure required for feature plans.

## Related Documentation
- Test plans: `../testing/`
- Project standards: `../project/`

---

**Note**: For project-level planning (milestones, phases, timelines), use a separate project planning document outside this directory structure.

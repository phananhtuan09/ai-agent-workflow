---
phase: planning
title: Planning Documentation
description: Feature planning docs and workflow guidelines
---

# Planning Documentation

## Purpose
This directory contains planning documents for individual features. Each feature follows a structured planning process before implementation.

## Feature Planning Workflow

### Creating a Feature Plan
Use the `create-plan` command to generate a new feature plan:
- Command: `.cursor/commands/create-plan.md`
- Output: `docs/ai/planning/feature-{name}.md`
- Template: `docs/ai/planning/feature-template.md`

### Feature Plan Structure
Each feature plan follows the template structure:
- **Goal**: Objectives, scope, acceptance criteria (Given-When-Then format)
- **Tasks**: Checklist of high-level work items (3–7 tasks)
- **Risks/Assumptions**: Key risks and assumptions
- **Metrics / Definition of Done**: Completion criteria (build/test/review/docs)

### Feature Plan Naming Convention
- Format: `feature-{name}.md` (kebab-case)
- Example: `feature-user-authentication.md`
- If duplicate name exists, append suffix: `feature-{name}-2.md`

## Template Reference
See `feature-template.md` for the exact structure required for feature plans.

## Related Documentation
- Implementation notes: `../implementation/`
- Test plans: `../testing/`
- Project standards: `../project/`

---

**Note**: For project-level planning (milestones, phases, timelines), use a separate project planning document outside this directory structure.

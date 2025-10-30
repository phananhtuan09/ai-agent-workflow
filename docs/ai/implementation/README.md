---
phase: implementation
title: Implementation Documentation
description: Feature implementation notes and tracking
---

# Implementation Documentation

## Purpose
This directory contains implementation notes for individual features. These docs track what code was written, why, and how it aligns with the plan.

## Implementation Documentation Workflow

### Creating Implementation Notes
Implementation notes are created automatically during `execute-plan`:
- Command: `.cursor/commands/execute-plan.md`
- Output: `docs/ai/implementation/feature-{name}.md`
- Template: `docs/ai/implementation/feature-template.md`

### Implementation Doc Structure
Each implementation doc follows the template structure:
- **Summary**: Brief description of overall solution approach
- **Changes**: Per-task entries with:
  - File paths and line ranges
  - Approach/pattern used
  - Brief description of changes
- **Edge Cases**: List of handled edge cases
- **Follow-ups**: TODOs or deferred work

### Purpose
Implementation docs serve as:
- **Audit trail**: What code was written for this feature
- **Review reference**: For code-review and check-implementation commands
- **Refactor guide**: Understanding what was done for future improvements

## Template Reference
See `feature-template.md` for the exact structure required for implementation notes.

## Related Documentation
- Planning docs: `../planning/`
- Test plans: `../testing/`
- Project standards: `../project/`

---

**Note**: For general implementation patterns and best practices, refer to `../project/CODE_CONVENTIONS.md` and `../project/PROJECT_STRUCTURE.md`.

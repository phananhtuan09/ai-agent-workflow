---
phase: project
title: Project Standards
description: Code conventions and project structure standards
---

# Project Standards

## Purpose
This directory contains project-wide standards that govern code quality, structure, and conventions. These standards are used by the `code-review` command to validate code.

## Standards Documentation

### CODE_CONVENTIONS.md
Defines coding standards including:
- Naming conventions (variables, functions, classes, constants)
- Import order and formatting
- Function size and complexity guidelines
- Error handling strategy
- Test rules
- Comments policy

### PROJECT_STRUCTURE.md
Defines project organization including:
- Folder layout and directory structure
- Module boundaries and dependency direction
- Design patterns in use
- Test file placement and naming
- Config/secrets handling

## Generating Standards

### Auto-Generation
Use the `generate-standards` command to auto-generate these files from your codebase:
- Command: `.cursor/commands/generate-standards.md`
- Output: Updates `CODE_CONVENTIONS.md` and `PROJECT_STRUCTURE.md`
- Process: Analyzes codebase + brief Q&A to infer standards

### Manual Editing
Both files can be edited manually at any time. They are marked with a note indicating they can be auto-generated.

## Usage in Workflow

### Code Review
The `code-review` command strictly checks code against these two standards:
- Only reports violations of explicit rules
- Does not provide design opinions or performance guesses
- Focuses on conformance to standards

### Implementation
When implementing features (`execute-plan`), follow these standards:
- Adhere to naming conventions
- Respect module boundaries
- Follow error handling patterns
- Place tests according to structure rules

## Related Documentation
- Feature planning: `../planning/`
- Implementation notes: `../implementation/`
- Test plans: `../testing/`

---

**Note**: These standards are project-specific and should reflect actual patterns in your codebase. Regenerate when codebase evolves significantly.


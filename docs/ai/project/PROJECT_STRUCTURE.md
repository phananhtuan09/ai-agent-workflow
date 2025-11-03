# Project Structure

> This document can be auto-generated via `generate-standards`. Edit manually as needed.

## Folders
- src/: source code
- docs/ai/project/: project docs (structure, conventions, patterns)
- docs/ai/planning/: feature plans
- docs/ai/implementation/: implementation notes per feature
- docs/ai/testing/: test plans per feature

## Design Patterns (in use)
- Pattern A: short description + when to use
- Pattern B: short description + when to use

## Notes
- Import/module conventions
- Config & secrets handling (if applicable)

## AI Docs Roles (existing only)
- `docs/ai/project/`: repository-wide conventions and structure; workflow overview and navigation live in `README.md`.
- `docs/ai/planning/`: feature plans using `feature-template.md` with Acceptance Criteria; plans should drive a todo checklist before coding.
- `docs/ai/implementation/`: per-feature implementation notes tracking what changed and why.
- `docs/ai/testing/`: per-feature test plans and results; include quality checks and coverage targets.

## Guiding Questions (for AI regeneration)
- How is the codebase organized by domain/feature vs layers?
- What are the module boundaries and dependency directions to preserve?
- Which design patterns are officially adopted and where?
- Where do configs/secrets live and how are they injected?
- What is the expected test file placement and naming?
- Any build/deployment constraints affecting structure (monorepo, packages)?


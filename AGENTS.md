# AI DevKit Rules (Personal Workflow)

## Documentation Structure
- `docs/ai/project/` — Project docs (PROJECT_STRUCTURE, CODE_CONVENTIONS, patterns)
- `docs/ai/planning/` — Feature plans (`feature-{name}.md`)
- `docs/ai/implementation/` — Implementation notes per feature (`feature-{name}.md`)
- `docs/ai/testing/` — Test plans per feature (`feature-{name}.md`)

## Development Workflow (4 phases)
1. Plan: define goals, scope, and acceptance criteria
2. Implementation: code against acceptance criteria, small and shippable changes
3. Testing: cover main flows and critical edges
4. Review: self-review + tool-assisted review, then ship

## Code Style & Standards
- Follow `docs/ai/project/CODE_CONVENTIONS.md`
- Use clear names and keep comments focused on non-obvious logic

## AI Interaction Guidelines
- Reference the active feature docs in planning/implementation/testing
- Keep docs concise and aligned with actual work

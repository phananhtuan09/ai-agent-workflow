# AI Agent Workflow Standards

## Core Workflow: Plan → Implement → Test → Review

### Workflow Alignment
- **Plan:** Create feature planning doc at `docs/ai/planning/feature-{name}.md` before coding. Do not start until planning exists and is agreed.
- **Implement:** Provide 1-3 sentence status updates before operations. Use file editing tools, not copy-paste. Update checkboxes `[ ]` → `[x]` in planning doc.
- **Test:** Run linter/type-check/build on changed files after each batch. Auto-fix issues (up to 3 attempts) before asking for help.
- **Review:** When complete, validate against planning doc acceptance criteria and CODE_CONVENTIONS.md.

## File Structure

### Planning Documents
- Location: `docs/ai/planning/feature-{name}.md` (kebab-case)
- Must include: Goal, Acceptance Criteria (GWT), Risks, Implementation Phases, Follow-ups
- Template: `docs/ai/planning/feature-template.md`

### Project Standards
- Coding conventions: `docs/ai/project/CODE_CONVENTIONS.md`
- Architecture guide: `docs/ai/project/PROJECT_STRUCTURE.md`
- Language templates: `docs/ai/project/template-convention/`

## Tooling Strategy
- Prefer semantic search across codebase; use grep only for exact matches
- Default to parallel execution for independent operations
- Quality tools: ESLint, TypeScript, Prettier (auto-format/auto-fix when possible)

## Communication
- Use Markdown only when necessary; backticks for `files/dirs/functions/classes`
- Status updates before/after important actions
- Mirror user's chat language; code/comments always in English

## Code Presentation
- Existing code: cite with `startLine:endLine:filepath` (no language tag)
- New code: fenced blocks with language tag, no line numbers

## TODO Policy
- For medium/large tasks: create todos (≤14 words, verb-led)
- Keep only ONE `in_progress` item
- Update immediately after progress; mark completed upon finish

## Git Workflow
- Feature branches: `feature/{name}` (match planning doc name)
- Commit format: `[phase] brief description`
- Examples: `[planning] create user auth plan`, `[phase-1] implement database schema`

## Slash Commands
- `/create-plan` - Generate planning doc
- `/execute-plan` - Implement tasks from planning doc
- `/modify-plan` - Modify plan after implementation
- `/code-review` - Validate against standards
- `/generate-standards` - Update CODE_CONVENTIONS.md
- `/writing-test` - Generate tests from acceptance criteria
- `/init-chat` - Load project rules (AGENTS.md)

## Quality Gates
### Before marking task complete:
- Code matches planning doc specification
- Linting passes (no warnings)
- Type checking passes (if applicable)
- Build succeeds (if applicable)
- Checkbox updated in planning doc: `[x]`

---

**Claude Code Specifics:**
- This file is automatically loaded every session
- Commands inherit these standards
- Use `/context` to see loaded memory
- Use `/usage` to monitor token consumption

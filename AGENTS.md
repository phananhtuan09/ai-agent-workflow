# AI Agent Workflow Standards

## Core Coding Philosophy

### 1. Simplicity First (with Strategic Exceptions)
- **Default: Keep it simple**
  - Choose simplest solution that meets requirements
  - Avoid over-engineering and unnecessary abstractions
  - Don't build for hypothetical futures

- **Think ahead ONLY for:**
  - **Security**: Input validation, authentication, authorization
  - **Performance**: Scalability bottlenecks, query optimization
  - All other cases → Choose simplicity

- **Examples:**
  - ✅ Use array methods instead of custom loops
  - ✅ Add input validation for user data (security)
  - ✅ Consider pagination for large datasets (performance)
  - ❌ Don't create abstractions for one-time operations

### 2. Deep Understanding
- If unclear about requirements, edge cases, or expected behavior → **Ask first**
- Never assume or guess - clarification prevents wasted effort
- Key questions:
  - "What should happen when X occurs?"
  - "Is this the expected flow: A → B → C?"

### 3. Multiple Options When Appropriate
- Present 2-3 solution options with clear trade-offs
- Format: "Option 1: [approach] - Pros: [...] Cons: [...]"
- Let user choose based on their priorities

---

## Workflow Guidelines

**Tooling:**
- Prefer semantic search; grep for exact matches only
- Run independent operations in parallel
- Search for files matching patterns when exploring codebase
- Search content for patterns when looking for specific code

**Communication:**
- Use Markdown minimally; backticks for `files/functions/classes`
- Mirror user's language; code/comments in English
- Status updates before/after key actions

**Code Presentation:**
- Existing code: `startLine:endLine:filepath`
- New code: fenced blocks with language tag

**TODO Management:**
- Create todos for medium/large tasks (≤14 words, verb-led)
- Keep ONE `in_progress` item only
- Update immediately; mark completed when done

---

## Skill Reporting (MANDATORY)

**CRITICAL REQUIREMENT - ALWAYS follow this:**

At the START of EVERY response, BEFORE any other content, report skills:

```
📚 Skills: skill-name-1, skill-name-2
```

**Rules:**
- If skills apply to the task → List them
- If NO skills apply → Write: `📚 Skills: none`
- This line MUST appear in EVERY response, no exceptions
- Place BEFORE greeting, explanation, or any other content

### How to Identify Applicable Skills

Scan task context for these trigger keywords:

| Skill | Trigger Keywords |
|-------|------------------|
| `frontend-design-fundamentals` | UI, frontend, component, styling, CSS, layout, button, form, card, page |
| `frontend-design-responsive` | responsive, mobile, tablet, breakpoints, multi-device, touch |
| `frontend-design-theme-factory` | theme, color palette, colors, fonts, brand, aesthetic |
| `frontend-design-figma-extraction` | Figma, design file, mockup, Figma URL |
| `quality-code-check` | lint, type check, build, validation, eslint, tsc |
| `ux-feedback-patterns` | loading, error, form validation, async, toast, empty state |
| `ux-accessibility` | accessible, WCAG, keyboard, screen reader, ARIA, contrast |

### Example Responses

```
📚 Skills: frontend-design-fundamentals, frontend-design-theme-factory

I'll help you create a modern login page...
```

```
📚 Skills: none

Sure, I can help you fix that bug...
```

Skills are defined in the project's skills directory (`.claude/skills/`, `.opencode/skill/`, `.factory/skills/`).

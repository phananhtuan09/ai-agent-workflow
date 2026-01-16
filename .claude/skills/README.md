# AI Gent Workflow Skills

Function-based skill system for Claude Code workflows.

Version: 2.0.0

---

## 📁 Folder Structure

```
.claude/skills/
├── README.md (this file)
│
├── design/           # Visual design principles
│   ├── fundamentals/
│   ├── responsive/
│   ├── figma-extraction/
│   └── theme-factory/
│
├── ux/               # User experience patterns
│   ├── feedback-patterns/
│   └── accessibility/
│
└── architecture/     # Code quality & patterns
    └── quality-code-check/
```

---

## 🎯 Skill Format

Each skill is a folder with `SKILL.md`:

```
skill-name/
├── SKILL.md (required)
├── references/ (optional - for long documentation)
├── scripts/ (optional - for reusable code)
└── assets/ (optional - for output templates)
```

---

## ✍️ Creating a New Skill

### 1. YAML Frontmatter (2 fields only)

```yaml
---
name: my-skill-name
description: |
  What the skill does and when to use it.

  Include trigger keywords naturally in description:
  - Use when [context/keywords]
  - Focus on [specific areas]
  - Do NOT load for [wrong contexts]
---
```

**Rules:**
- `name`: lowercase-with-hyphens
- `description`: Be specific about WHEN to use (triggers + exclusions)

### 2. Content Guidelines

**Keep SKILL.md under 500 lines**
- Concise > verbose (Claude is already smart)
- Principles over code examples
- Framework agnostic
- Explain WHY, not just WHAT

**If content > 500 lines:**
- Move details to `references/` folder
- Link from SKILL.md: "See [DETAILS.md](references/DETAILS.md)"

**Structure:**
```markdown
# Skill Name

## Purpose
One-sentence purpose.

## Core Principle
Key concept in 1-2 paragraphs.

## Section 1
### Guidelines
- Guideline with reasoning

## Common Mistakes
1. Mistake → Fix

## Validation Checklist
- [ ] Check 1
- [ ] Check 2

## Key Takeaway
One-paragraph summary.
```

### 3. What NOT to Include

- README.md
- Installation guides
- Changelog
- Framework-specific code (React, Vue, Tailwind)
- Project-specific details (exact hex colors, etc.)
- Verbose explanations (Claude is smart)

### 4. What TO Include

- Universal principles (contrast ratios, spacing scales)
- Design patterns (mobile-first, progressive enhancement)
- Best practices (semantic HTML, WCAG guidelines)
- Common mistakes and fixes
- Validation checklists
- WHY principles matter (context and reasoning)

---

## 📦 Bundled Resources

### `references/` - Long documentation

Load as needed, not always in context:

```
skill-name/
├── SKILL.md (overview + navigation)
└── references/
    ├── advanced.md
    ├── api-reference.md
    └── examples.md
```

Link from SKILL.md:
```markdown
## Advanced Topics
See [ADVANCED.md](references/advanced.md) for complete guide.
```

### `scripts/` - Reusable code

For deterministic, repeatable operations:

```
skill-name/
├── SKILL.md
└── scripts/
    ├── validate.py
    └── generate.sh
```

### `assets/` - Output templates

Files used in output (not loaded to context):

```
skill-name/
├── SKILL.md
└── assets/
    ├── template.html
    └── logo.png
```

---

## 🎨 Current Skills

| Skill | Category | Lines | Purpose |
|-------|----------|-------|---------|
| design-fundamentals | design | 277 | Spacing, typography, color, hierarchy |
| design-responsive | design | 402 | Mobile-first, breakpoints, fluid layouts |
| figma-design-extraction | design | 385 | Extract complete Figma specs |
| theme-factory | design | 420 | Generate themes when no design |
| ux-feedback-patterns | ux | 333 | Loading, success, error states |
| ux-accessibility | ux | 411 | Keyboard, screen readers, WCAG |
| quality-code-check | architecture | 268 | Linting, type checking, builds |

**Total:** 2,496 lines across 7 skills

---

## 🎮 Manual Skill Commands

```bash
/skill:design              # Load design-fundamentals
/skill:responsive          # Load design-responsive
/skill:figma               # Load figma-design-extraction
/skill:theme               # Load theme-factory
/skill:feedback            # Load ux-feedback-patterns
/skill:accessibility       # Load ux-accessibility
/skill:a11y                # Alias for accessibility
/skill:quality             # Load quality-code-check
```

---

## 💡 Writing Tips

1. **Concise is key** - Challenge each sentence: "Does Claude need this?"
2. **Principles over code** - Show patterns, not implementations
3. **Split when > 500 lines** - Move details to `references/`
4. **Description = trigger** - Include keywords naturally in description
5. **Framework agnostic** - Works for React, Vue, vanilla, etc.
6. **Explain WHY** - Context matters more than rules

---

## 📋 Skill Creation Checklist

Before creating a new skill:

- [ ] Skill is framework-agnostic (no React/Vue/Angular specific)
- [ ] Content focuses on principles and WHY, not code
- [ ] SKILL.md under 500 lines (move extras to `references/`)
- [ ] YAML frontmatter has only `name` + `description`
- [ ] Description includes trigger keywords naturally
- [ ] Clear structure with sections
- [ ] Includes common mistakes section
- [ ] Includes validation checklist
- [ ] No specific HTML/CSS/JS code examples
- [ ] Universal principles that apply to any project

---

## 🔗 References

Based on official [Anthropic Skills](https://github.com/anthropics/skills) format and guidelines.

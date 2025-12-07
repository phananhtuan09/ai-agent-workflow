# AI Gent Workflow - Skill System

**Function-based, principles-focused skill system for Claude Code workflows.**

Version: 2.0.0

---

## 🎯 Core Philosophy

### Principles Over Code

**Skills focus on WHY and HOW, not specific code.**

❌ **Don't write:**
```css
/* Bad: Specific code example */
button {
  padding: 16px 24px;
  background: #3b82f6;
  border-radius: 8px;
}
```

✅ **Do write:**
```markdown
### Button Spacing
**Principle:** Consistent padding creates visual rhythm.
**Guidelines:**
- Use spacing scale (8px, 16px, 24px)
- Horizontal padding larger than vertical
- Maintain proportions across sizes

**Why:** Arbitrary values create inconsistency.
```

---

## 📁 Folder Structure

```
.claude/skills/
├── skills.config.json        # Central configuration
├── README.md                 # This file
│
├── design/                   # Visual design principles
│   ├── fundamentals/         # Spacing, typography, color (277 lines)
│   ├── responsive/           # Mobile-first, breakpoints (402 lines)
│   └── animations/           # Timing, easing, motion (431 lines)
│
├── ux/                       # User experience patterns
│   ├── feedback-patterns/    # Loading, errors, success (368 lines)
│   └── accessibility/        # Keyboard, screen readers, WCAG (470 lines)
│
├── frontend/                 # Frontend-specific (future)
│   ├── react/
│   ├── vue/
│   └── performance/
│
├── backend/                  # Backend-specific (future)
│   ├── api-design/
│   ├── database/
│   └── security/
│
└── architecture/             # Universal patterns (future)
    ├── error-handling/
    └── testing/
```

**Total:** 5 skills, 1,948 lines (~390 lines/skill average)

---

## ✨ Skill Creation Principles

### 1. Framework Agnostic

**Skills must work for ANY framework or technology.**

❌ **Avoid:**
- React-specific code (`useState`, JSX)
- Vue-specific code (templates, composition API)
- Tailwind classes (`class="px-4 py-2"`)
- Library-specific patterns (Material-UI, Bootstrap)

✅ **Write:**
- Universal principles (contrast ratios, spacing scales)
- Design patterns (mobile-first, progressive enhancement)
- Best practices (semantic HTML concepts, WCAG guidelines)

**Example:**

❌ **Bad** (React-specific):
```markdown
### Button Component
```jsx
const Button = ({ children, onClick }) => (
  <button className="btn-primary" onClick={onClick}>
    {children}
  </button>
);
```
```

✅ **Good** (Framework-agnostic):
```markdown
### Button Principles
**Interactive states required:**
- Default: Normal appearance
- Hover: Visual feedback (elevation, color shift)
- Active: Pressed appearance
- Disabled: Grayed out + explanation
- Loading: Spinner + disabled state

**Implementation considerations:**
- Use semantic button element (not div)
- Minimum 44x44px touch target
- Clear visual hierarchy (primary vs secondary)
```

---

### 2. Explain WHY, Not Just WHAT

**Context and reasoning matter more than rules.**

❌ **Bad** (just rules):
```markdown
- Body text: 16px minimum
- Line height: 1.5
- Max width: 65ch
```

✅ **Good** (with reasoning):
```markdown
### Body Text Guidelines
**Principle:** Readability improves comprehension and reduces fatigue.

**Font size:**
- Minimum: 16px
- **Why:** Smaller text strains eyes, especially on mobile. 16px is comfortable for extended reading.

**Line height:**
- Recommended: 1.5-1.6
- **Why:** Taller line height improves line tracking. Too tight (< 1.3) causes lines to blend; too loose (> 1.8) breaks paragraph cohesion.

**Line length:**
- Optimal: 50-75 characters per line
- **Why:** Longer lines tire eyes (too much horizontal scanning). Shorter lines break reading flow.
```

---

### 3. Keep Skills Focused (200-500 Lines)

**One skill = one responsibility.**

**Size guidelines:**
- **200-300 lines**: Core concepts, focused topic
- **300-400 lines**: Comprehensive coverage
- **400-500 lines**: Maximum (split if larger)

**If skill exceeds 500 lines:**
- Split into multiple skills
- Example: `design/typography` + `design/spacing` instead of one huge `design/fundamentals`

---

### 4. Clear Structure

**Consistent section organization:**

```markdown
---
# YAML metadata (name, description, keywords, etc.)
---

# Skill Name

## Purpose
Clear one-sentence purpose.

---

## Core Principle
The fundamental concept. One paragraph.

---

## Section 1
### Subsection
- Guidelines
- Best practices
- Why it matters

---

## Section 2
...

---

## Common Mistakes
List of mistakes and corrections.

---

## Validation Checklist
- [ ] Checkable items
- [ ] Before considering complete

---

## Key Takeaway
One-paragraph summary.
```

---

## 📝 Content Guidelines

### ✅ What TO Include

1. **Universal Principles**
   - Contrast ratios (4.5:1 for text)
   - Spacing scales (4px, 8px, 16px, 24px)
   - Color theory (complementary, analogous)
   - Typography scales (1.2, 1.25, 1.333)

2. **Design Patterns**
   - Mobile-first approach
   - Progressive enhancement
   - Graceful degradation
   - Semantic structure

3. **Best Practices**
   - Semantic HTML concepts (use button for actions)
   - WCAG guidelines (keyboard navigation, screen readers)
   - Performance principles (GPU-accelerated properties)
   - Accessibility standards (44px touch targets)

4. **Common Mistakes**
   - What not to do
   - Why it's wrong
   - How to fix

5. **Validation Checklists**
   - Concrete items to verify
   - Quality gates
   - Testing steps

6. **Reasoning ("Why")**
   - Context for principles
   - Trade-offs
   - When to break rules

### ❌ What to AVOID

1. **Specific Code Examples**
   - HTML markup
   - CSS rules with values
   - JavaScript implementations
   - Framework-specific syntax

2. **Library/Framework Patterns**
   - React components
   - Vue templates
   - Tailwind classes
   - Material-UI components

3. **Technology-Specific Implementations**
   - Styled-components syntax
   - CSS Modules patterns
   - Sass mixins
   - PostCSS plugins

4. **Project-Specific Details**
   - Exact color hex codes
   - Specific spacing values
   - Custom naming conventions
   - Particular design systems

---

## 🎨 Example: Good vs Bad Skill Content

### ❌ BAD Example (Too Specific)

```markdown
### Card Hover Effect

Add this CSS to your card component:

```css
.card {
  padding: 24px;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
```

In React:
```jsx
const Card = ({ children }) => (
  <div className="card">
    {children}
  </div>
);
```
```

**Problems:**
- Specific CSS values
- Exact colors and shadows
- Framework-specific code
- Won't work in all projects

---

### ✅ GOOD Example (Principles-Based)

```markdown
### Interactive Card Feedback

**Principle:** Provide immediate visual feedback on hover to indicate interactivity.

**Hover patterns:**
- **Elevation**: Lift card slightly to create depth
- **Shadow**: Increase shadow depth/spread
- **Scale**: Very subtle scale (1.02x maximum—more is excessive)

**Timing:**
- Duration: 200-300ms (feels responsive)
- Easing: ease-out (natural deceleration)
- Avoid delays (feels sluggish)

**Implementation considerations:**
- Use `transform` (GPU-accelerated) over `top`/`margin`
- Keep motion subtle—goal is feedback, not spectacle
- Only for clickable cards (don't mislead users)
- No hover on mobile (use touch states instead)

**Why it works:**
- Affordance: Signals element is interactive
- Feedback: Confirms user's hover action
- Depth: Creates visual hierarchy

**Common mistakes:**
- Too much movement (distracting)
- Too slow (> 400ms feels sluggish)
- Hover on non-interactive cards (confusing)
- Heavy animations (janky on low-end devices)
```

**Why this is better:**
- Works for any framework
- Applies to any project
- Explains WHY, not just HOW
- Flexible for different implementations
- Includes considerations and mistakes

---

## 🚀 How to Add a New Skill

### Step 1: Choose Category

Where does your skill belong?

- **design/**: Visual principles (layout, color, typography)
- **ux/**: User experience patterns (feedback, accessibility)
- **frontend/**: Frontend-specific (React, performance)
- **backend/**: Backend-specific (API, database)
- **architecture/**: Universal patterns (testing, error handling)

### Step 2: Create Folder & File

```bash
cd .claude/skills
mkdir -p design/my-skill
```

### Step 3: Use Template

Copy this template to `design/my-skill/SKILL.md`:

```markdown
---
name: my-skill-name
description: Brief one-line description (what, not how)
allowed-tools: [read, grep]

# Category & Loading
category: design
subcategory: specific-area

# Auto-trigger logic
auto-trigger:
  enabled: true
  keywords:
    - keyword1
    - keyword2
  exclude-keywords:
    - other-keyword
  contexts:
    - design
    - ui

# Manual trigger
manual-load:
  enabled: true
  commands:
    - /skill:my-skill
  mentions:
    - my feature phrase

# Dependencies & Priority
dependencies: []
conflicts-with: []
priority: medium

# When to load this skill
trigger-description: |
  Load when [describe context].
  Focus on [key principles].
  Do NOT load for [wrong contexts].
---

# My Skill Name

## Purpose
One-sentence purpose statement.

---

## Core Principle
The fundamental concept. One paragraph explaining the "why."

---

## Section 1

### Subsection
**Principle:** Core concept

**Guidelines:**
- Guideline 1
- Guideline 2

**Why:** Reasoning

---

## Common Mistakes

1. **Mistake**: Why it's wrong → How to fix
2. **Mistake**: Why it's wrong → How to fix

---

## Validation Checklist

- [ ] Check 1
- [ ] Check 2

---

## Key Takeaway

One-paragraph summary of the most important concept.
```

### Step 4: Write Content (Principles-Only)

**Remember:**
- Framework agnostic
- Explain WHY
- No code examples
- 200-500 lines
- Clear structure

### Step 5: Update `skills.config.json`

Add your skill to the registry:

```json
{
  "skill-registry": {
    "design": [
      {
        "name": "my-skill-name",
        "path": "design/my-skill/SKILL.md",
        "category": "design",
        "lines": 300,
        "description": "Brief description",
        "keywords": ["keyword1", "keyword2"],
        "priority": "medium"
      }
    ]
  }
}
```

### Step 6: Test

Try prompts that should trigger your skill:
- "help me with [keyword1]"
- "/skill:my-skill"

Verify it loads correctly.

---

## 📊 Current Skills

| Skill | Category | Lines | Priority | Purpose |
|-------|----------|-------|----------|---------|
| `design/fundamentals` | design | 277 | high | Spacing, typography, color, hierarchy |
| `design/responsive` | design | 402 | medium | Mobile-first, breakpoints, fluid layouts |
| `design/animations` | design | 431 | low | Timing, easing, purposeful motion |
| `design/figma-extraction` | design | 385 | high | Complete Figma design extraction for accurate implementation |
| `design/theme-factory` | design | 420 | medium | Generate cohesive themes when no design provided |
| `ux/feedback-patterns` | ux | 368 | high | Loading, success, error, empty states |
| `ux/accessibility` | ux | 470 | high | Keyboard, screen readers, WCAG, ARIA |

**Total:** 2,753 lines across 7 skills

---

## 🎮 Manual Skill Commands

```bash
/skill:design              # Load design-fundamentals
/skill:responsive          # Load design-responsive
/skill:animation           # Load design-animations
/skill:figma               # Load figma-design-extraction
/skill:theme               # Load theme-factory
/skill:feedback            # Load ux-feedback-patterns
/skill:accessibility       # Load ux-accessibility
/skill:a11y                # Alias for accessibility
```

---

## 🎨 Theme System

### Pre-defined Themes

Located in `.claude/themes/`, these themes provide cohesive design foundations when no Figma design is provided:

| Theme | Personality | Primary Color | Best For |
|-------|-------------|---------------|----------|
| `professional-blue` | Professional, trustworthy, corporate | Blue (#3b82f6) | SaaS, corporate, business tools |
| `creative-vibrant` | Bold, energetic, creative | Purple (#a855f7) + Orange | Creative agencies, portfolios |
| `minimal-monochrome` | Clean, sophisticated, timeless | Neutrals + Purple accent | Luxury, fashion, editorial |
| `bold-gradient` | Modern, eye-catching, tech | Blue-to-Purple gradients | Tech startups, web3, modern apps |
| `warm-earthy` | Natural, welcoming, organic | Amber (#d97706) + Green | Health, sustainability, food |
| `playful-colorful` | Fun, energetic, approachable | Multi-color (Yellow/Green/Red/Blue) | Kids, gaming, social, education |

### Theme Structure

Each theme file includes:
- **Colors**: Primary, secondary, accent, neutral palettes (50-900 shades) + semantic colors
- **Typography**: Font families, type scale, weights, line heights
- **Spacing**: Base-4 or base-8 spacing scale
- **Visual Style**: Border radius, shadows (elevation system)

### How It Works

1. **During `/create-plan`**: If no Figma design → theme-factory skill loads
2. **User picks personality**: Professional/Creative/Minimal/Bold/Warm/Playful
3. **Present options**: 2-3 matching themes from `.claude/themes/`
4. **User selects**: Theme documented in planning doc
5. **During `/execute-plan`**: Theme specs loaded and applied consistently

### Adding Custom Themes

Create new theme file in `.claude/themes/your-theme.theme.json`:

```json
{
  "name": "Your Theme Name",
  "personality": "describe personality",
  "use_cases": ["industry 1", "industry 2"],
  "colors": { "primary": {...}, "neutral": {...}, "semantic": {...} },
  "typography": { "fontFamily": {...}, "scale": {...} },
  "spacing": { "xs": 4, "sm": 8, ... },
  "borderRadius": { "sm": 4, "md": 8, ... },
  "shadows": { "sm": "...", "md": "..." }
}
```

See existing themes for complete structure examples.

---

## 🔮 Planned Expansions

### Frontend Skills
- `frontend/react/` - React patterns and best practices
- `frontend/vue/` - Vue patterns and best practices
- `frontend/performance/` - Performance optimization

### Backend Skills
- `backend/api-design/` - REST/GraphQL API principles
- `backend/database/` - Database design and optimization
- `backend/security/` - Security best practices

### Architecture Skills
- `architecture/error-handling/` - Error handling patterns
- `architecture/testing/` - Testing strategies
- `architecture/patterns/` - Software design patterns

---

## ❓ FAQ

### Q: Can I include small code snippets?

**A:** Only if absolutely necessary for clarity AND framework-agnostic.

**Example - OK:**
```markdown
**Pattern:** Use semantic button element
- ✅ `<button>` - Built-in keyboard support
- ❌ `<div onclick>` - Requires manual accessibility
```

**Example - Not OK:**
```jsx
<Button onClick={handleClick} variant="primary">
  Submit
</Button>
```

---

### Q: How detailed should principles be?

**A:** Detailed enough to guide implementation, general enough to apply anywhere.

**Too vague:**
```markdown
- Use good spacing
```

**Too specific:**
```markdown
- Use 16px padding top, 24px padding bottom, 32px padding left/right
```

**Just right:**
```markdown
**Spacing Principle:** Consistent scale creates visual rhythm
- Use spacing scale (4px, 8px, 16px, 24px, 32px)
- Vertical spacing proportional to content importance
- Horizontal spacing accommodates touch targets (44px minimum)
```

---

### Q: What if my skill needs examples?

**A:** Use conceptual examples, not code.

**Instead of code:**
```markdown
### Navigation Pattern

**Mobile:**
- Collapse to hamburger menu
- Full-screen overlay or side drawer
- Touch-optimized targets (44x44px)

**Desktop:**
- Horizontal navigation bar
- Hover-accessible dropdowns
- Keyboard navigation support

**Breakpoint:** Typically 768px (tablet portrait)

**Why:** Mobile screens lack space for full menus. Desktop has room and benefits from persistent navigation.
```

---

### Q: Can I reference specific technologies?

**A:** Only to explain concepts, not as requirements.

**OK:**
```markdown
**Modern CSS:** Container queries allow components to adapt to their container size (not just viewport). Check browser support before using.
```

**Not OK:**
```markdown
**Required:** Use Tailwind's `container` class with `mx-auto` and `px-4`.
```

---

## 📝 Checklist: Before Creating a Skill

- [ ] Skill is framework-agnostic (no React/Vue/Angular specific code)
- [ ] Content focuses on principles and WHY, not code
- [ ] 200-500 lines (focused scope)
- [ ] Clear structure with sections
- [ ] Includes common mistakes section
- [ ] Includes validation checklist
- [ ] Metadata is complete (keywords, triggers)
- [ ] No specific HTML/CSS/JS code examples
- [ ] Universal principles that apply to any project
- [ ] Added to `skills.config.json`

---

## 🛠 Maintenance

### Review Schedule
- **Monthly**: Check for outdated information
- **Quarterly**: Update with new best practices
- **Yearly**: Major revision if needed

### Quality Standards
- All skills < 500 lines
- Principles-only content
- Framework-agnostic
- Clear, consistent structure
- No broken internal references

---

**Questions or suggestions?** Update this README with your learnings!

**Version History:**
- **v2.0.0** (2024-12-06): Function-based structure, principles-only content
- **v1.0.0** (2024-12-06): Initial tier system (deprecated)

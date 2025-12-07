---
name: theme-factory
description: Generate cohesive UI themes when no design provided. Color theory, typography pairing, and brand personality principles for beautiful default UIs.
allowed-tools: [read]

# Category & Loading
category: design
subcategory: theming

# Auto-trigger logic
auto-trigger:
  enabled: true
  keywords:
    - create page
    - build UI
    - tạo page
    - new component
  exclude-keywords:
    - figma
    - design file
    - mockup
    - design system
    - screenshot
    - image
    - attached
    - theo design
    - follow design
  contexts:
    - design
    - ui
    - planning

# Manual trigger
manual-load:
  enabled: true
  commands:
    - /skill:theme
    - /skill:theme-factory
  mentions:
    - generate theme
    - pick theme
    - theme selection

# Dependencies & Priority
dependencies: []
conflicts-with: [figma-design-extraction]
priority: medium

# When to load this skill
trigger-description: |
  Load when user creates UI without ANY design source provided.
  Design sources include: Figma, screenshots, detailed descriptions, references.
  Only trigger if design source is unclear or not provided at all.
  Prevents generic/monotone UIs by generating cohesive themes.
---

# Theme Factory

## Purpose
Generate cohesive, beautiful UI themes when no design specifications provided, preventing generic monotone interfaces.

---

## Core Principle

**Brand personality drives design decisions.**

Every UI communicates personality through color, typography, and style. Rather than defaulting to arbitrary colors (like purple everywhere), ask about brand personality first, then generate cohesive themes that match.

**Good theme = Intentional, cohesive, personality-aligned**
**Bad theme = Random colors, inconsistent, no personality**

---

## When to Use Theme Factory

**Trigger conditions:**
- User creating UI (page, component, app)
- AND no design source provided or unclear

**Design sources that PREVENT theme factory:**
- Figma file/URL provided → use figma-design-extraction
- Screenshot/image of design attached → follow that design
- Detailed design description in prompt → follow description
- Reference to existing design system → follow that system
- "Theo design" or similar references → clarify design source first

**Use theme factory ONLY if:**
- User says something like: "tạo page login" (no design mentioned)
- Generic request: "build dashboard UI" (no design specifics)
- Design source unclear or insufficient

---

## Theme Selection Process

### Step 1: Understand Brand Personality

**Ask user** (concise, 1-2 questions max):

**Question 1: "What personality should this UI have?"**
Options:
- **Professional** - Corporate, trustworthy, business-focused
- **Creative** - Bold, artistic, unique, expressive
- **Minimal** - Clean, sophisticated, simple, timeless
- **Bold/Tech** - Modern, eye-catching, innovative
- **Warm/Organic** - Natural, welcoming, friendly
- **Playful** - Fun, colorful, approachable, energetic

**Question 2: "Any color preferences or inspirations?"**
- Specific colors they like
- Competitor/inspiration URLs
- Or: "Auto-generate based on personality"

---

### Step 2: Present Theme Options

**If user picked personality:**

Show 2-3 pre-defined themes from `.claude/themes/` matching personality:

```
I have these themes matching "[personality]":

1. Professional Blue - Corporate, trustworthy, clean
   Primary: Blue, Neutral grays, Professional

2. Minimal Monochrome - Sophisticated, timeless
   Primary: Neutrals with purple accent, Clean

3. Generate custom theme based on your preferences

Which would you like? (1, 2, or 3)
```

**If user wants custom:**
- Generate based on personality + color preferences
- Present 2-3 variations
- User picks favorite

---

## Theme Anatomy

### Complete Theme Structure

**1. Colors - Must include:**

**Primary Palette** (shades 50-900):
- Used for: Main actions, links, buttons, key UI elements
- Principle: Consistent hue with varying lightness
- Scale: 50 (lightest) → 900 (darkest)

**Secondary Palette** (optional):
- Used for: Supporting actions, accents
- Principle: Complements primary (analogous or complementary)

**Accent Palette**:
- Used for: Highlights, calls-to-action, focus states
- Principle: High contrast with primary for attention

**Neutral Palette** (50-900):
- Used for: Text, backgrounds, borders, subtle UI
- Principle: True grays or slightly tinted toward primary

**Semantic Colors**:
- Success: Green tones (growth, positive, confirmation)
- Warning: Yellow/orange tones (caution, attention needed)
- Error: Red tones (danger, mistakes, destructive actions)
- Info: Blue tones (information, neutral notifications)

**Why this structure:**
- Full palette enables light/dark modes
- Semantic colors ensure accessibility
- Neutrals provide visual breathing room

---

### 2. Typography - Pairing Principles

**Font Pairing Rules:**

**Contrast pairing** (recommended):
- Heading: Display/serif font (personality, attention)
- Body: Sans-serif (readability, neutral)
- Example: Playfair Display + Inter

**Harmonic pairing**:
- Heading: Bold sans-serif
- Body: Regular sans-serif (same family or similar)
- Example: Inter Bold + Inter Regular

**Avoid:**
- Two competing display fonts
- Very similar fonts that lack contrast
- More than 2 font families (creates visual noise)

**Font properties to define:**
- Font families (with web-safe fallbacks)
- Type scale (consistent multiplier, e.g., 1.25 or 1.333)
- Font weights available (400, 500, 600, 700)
- Line heights for readability (1.25 tight, 1.5 normal, 1.75 relaxed)

---

### 3. Spacing System

**Principle:** Consistent scale creates visual rhythm.

**Base-8 System** (recommended):
- Base: 8px
- Scale: 4, 8, 16, 24, 32, 48, 64, 96px
- **Why:** Divides evenly, easy math, widely used

**Base-4 System** (finer control):
- Base: 4px
- Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48px

**Application:**
- Component padding: Use scale values only
- Margins/gaps: Use scale values only
- Grid gutters: Use scale values only
- Never arbitrary values (no 13px, 27px, etc.)

---

### 4. Visual Properties

**Border Radius** (roundness):
- **Minimal themes:** Small (4px, 8px) or none (0px)
- **Friendly themes:** Medium (8px, 12px, 16px)
- **Playful themes:** Large (16px, 24px, full pill shapes)

**Shadows** (elevation):
- Subtle shadows for depth (professional, minimal)
- Stronger shadows for cards/modals (modern, bold)
- No shadows for flat design (minimalist)
- Define elevation system (sm, md, lg, xl)

**Why shadows matter:**
- Create visual hierarchy
- Indicate interactivity (hover elevates)
- Separate layers (modal above content)

---

## Color Theory Foundations

### Color Harmony Methods

**Complementary** - Opposites on color wheel:
- High contrast, energetic, bold
- Example: Blue (#3b82f6) + Orange (#f97316)
- Use for: Bold, tech, creative personalities

**Analogous** - Adjacent on color wheel:
- Harmonious, calm, cohesive
- Example: Blue (#3b82f6) + Purple (#8b5cf6) + Teal (#14b8a6)
- Use for: Professional, minimal, warm personalities

**Triadic** - Three evenly spaced:
- Balanced, vibrant, dynamic
- Example: Red + Yellow + Blue
- Use for: Playful, creative personalities

**Monochromatic** - Single hue, varying lightness:
- Clean, sophisticated, minimal
- Example: Blue shades only (from #dbeafe to #1e3a8a)
- Use for: Minimal, professional personalities

---

### Color Psychology

**Blue** - Trust, stability, professional, calm
- Industries: Finance, healthcare, tech, corporate

**Green** - Growth, health, nature, balance
- Industries: Health, sustainability, finance, education

**Purple** - Creativity, luxury, wisdom, innovation
- Industries: Beauty, creative, tech, education

**Red** - Energy, urgency, passion, excitement
- Industries: Food, entertainment, sales, sports

**Orange** - Friendly, energetic, affordable, creative
- Industries: E-commerce, social, creative

**Yellow** - Optimism, warmth, caution, playfulness
- Industries: Food, children, optimistic brands

**Neutral (Gray/Black)** - Sophisticated, minimal, timeless
- Industries: Luxury, fashion, professional services

**Why personality matters:**
Professional financial app → Blue (trust)
Creative agency → Purple/Orange (creativity)
Kids game → Bright multi-color (playful)

---

## Theme Documentation Format

**In planning doc:**

```markdown
## Theme Specification

### Selected Theme
- Name: Professional Blue
- Source: .claude/themes/professional-blue.theme.json
- Personality: Professional, trustworthy, business-focused

### Color Palette
**Primary (Blue)**:
- 500: #3b82f6 (buttons, links, primary actions)
- 600: #2563eb (hover states)
- 700: #1d4ed8 (active states)

**Neutral**:
- 50: #fafafa (backgrounds)
- 700: #374151 (body text)
- 900: #111827 (headings)

**Semantic**:
- Success: #10b981 (confirmations, success states)
- Error: #ef4444 (errors, destructive actions)
- Warning: #f59e0b (warnings, caution)

### Typography
- Heading: Inter, 700 (bold), tight line-height (1.25)
- Body: Inter, 400 (regular), normal line-height (1.5)
- Scale: 14, 16, 18, 20, 24, 30, 36px

### Spacing
- Scale: 4, 8, 16, 24, 32, 48, 64px (base-8)

### Visual Style
- Border radius: 8px (medium, friendly)
- Shadows: Subtle elevation (sm, md for cards)
```

---

## Theme Application Guidelines

### Consistency Rules

**Do:**
- Use only colors from theme palette (no random hex codes)
- Apply spacing scale consistently (no arbitrary margins)
- Follow typography scale (no font sizes outside scale)
- Use semantic colors for their intended purpose (green = success)

**Don't:**
- Mix colors from multiple themes
- Use arbitrary values (18.5px spacing, #3b7ef2 blue variant)
- Override theme for one-off styles
- Ignore semantic color meanings

### Component Theming

**Buttons:**
- Primary: Primary color background, white text
- Secondary: Secondary/neutral background
- Outline: Transparent background, primary border
- Ghost: Transparent, primary text only

**States consistently:**
- Hover: Darken by one shade (500 → 600)
- Active: Darken by two shades (500 → 700)
- Disabled: Neutral-300 background, neutral-400 text
- Focus: Primary color ring (3px width)

**Text hierarchy:**
- H1: Largest scale, heading font, bold, neutral-900
- H2-H6: Descending scale, heading font, semibold/bold
- Body: Base size, body font, regular, neutral-700
- Caption: Smaller scale, body font, regular, neutral-500

---

## Common Theme Mistakes

1. **Too many colors** - Using 6+ colors creates chaos
   → Fix: Stick to primary + neutral + semantics (4 total)

2. **Poor contrast** - Text hard to read against background
   → Fix: Follow WCAG AA (4.5:1 for text, 3:1 for UI)

3. **Inconsistent spacing** - Random margins everywhere
   → Fix: Use scale values only (8, 16, 24, never 15, 23)

4. **Clashing fonts** - Two display fonts competing
   → Fix: One display + one readable body font

5. **No personality** - Generic, could be any site
   → Fix: Choose personality first, theme follows

6. **Arbitrary values** - "Let me try #3b7ff3 instead of #3b82f6"
   → Fix: Use theme palette exactly as defined

7. **Semantic color abuse** - Green button for delete action
   → Fix: Red (error) for destructive, green (success) for positive

---

## Validation Checklist

Before marking theme complete:

- [ ] Brand personality identified (professional/creative/minimal/etc.)
- [ ] Primary color palette complete (50-900 shades)
- [ ] Neutral palette defined (50-900 shades)
- [ ] Semantic colors defined (success, warning, error, info)
- [ ] Typography pairing chosen (heading + body fonts)
- [ ] Type scale defined (consistent multiplier)
- [ ] Spacing scale defined (base-4 or base-8)
- [ ] Border radius values chosen
- [ ] Shadow system defined (if applicable)
- [ ] Theme documented in planning doc
- [ ] Theme file saved in `.claude/themes/` (if custom)
- [ ] All colors pass WCAG AA contrast requirements

---

## Key Takeaway

**Intentional themes prevent bland UIs.**

Rather than defaulting to purple everywhere, start with personality, choose cohesive colors, and apply consistently. A thoughtful theme makes UI feel designed, not default.

Theme is foundation—everything else builds on it.

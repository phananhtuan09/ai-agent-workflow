---
name: design-fundamentals
description: Core design principles for visual consistency - spacing, typography, color, and hierarchy. Framework and technology agnostic.
allowed-tools: [read, grep]

# Category & Loading
category: design
subcategory: fundamentals

# Auto-trigger logic
auto-trigger:
  enabled: true
  keywords:
    - spacing
    - typography
    - font
    - color
    - design system
    - visual hierarchy
    - padding
    - margin
    - layout
  exclude-keywords:
    - responsive
    - breakpoint
    - animation
    - API
    - backend
  contexts:
    - design
    - ui
    - frontend

# Manual trigger
manual-load:
  enabled: true
  commands:
    - /skill:design
    - /skill:design-fundamentals
  mentions:
    - design principles
    - design system
    - visual consistency

# Dependencies & Priority
dependencies: []
conflicts-with: []
priority: high

# When to load this skill
trigger-description: |
  Load when working with UI design, layout, spacing, typography, or colors.
  Focus on visual consistency and hierarchy - technology agnostic principles.
  Do NOT load for: responsive layouts, animations, or backend tasks.
---

# Design Fundamentals

## Purpose
Ensure visual consistency and hierarchy through fundamental design principles applicable to any UI framework or styling approach.

---

## Core Principles

### 1. Visual Hierarchy
**Principle:** Guide user attention through size, weight, and contrast differences.

**Guidelines:**
- Headings must be visually larger than body text
- Important elements use bolder weights or stronger contrast
- Related content groups closer together than unrelated content
- Use size, weight, and spacing to create clear hierarchy (not just color)

**Hierarchy Levels:**
- Primary: Page title, main CTAs
- Secondary: Section headings, important actions
- Tertiary: Body text, labels
- Quaternary: Metadata, timestamps, helper text

---

## Spacing System

### Consistent Scale
**Principle:** Use a consistent spacing scale for all margins, padding, and gaps.

**Common scales:**
- **4px-based**: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128
- **8px-based**: 8, 16, 24, 32, 40, 48, 64, 80, 96
- **Fibonacci-inspired**: 8, 13, 21, 34, 55, 89

**Guidelines:**
- Choose ONE scale and stick to it project-wide
- Avoid arbitrary values (17px, 23px, 31px)
- Smaller spacing for related items, larger for groups
- Consistent spacing creates rhythm and professionalism

**Whitespace Rules:**
- More whitespace = more importance/breathing room
- Dense areas = related information
- Generous whitespace separates unrelated sections

---

## Typography

### Font Size Scale
**Principle:** Use a consistent type scale for predictable hierarchy.

**Common scales:**
- **Minor Third (1.2)**: 12, 14, 17, 20, 24, 29, 35px
- **Major Third (1.25)**: 12, 15, 19, 24, 30, 37, 46px
- **Perfect Fourth (1.333)**: 12, 16, 21, 28, 37, 50, 67px

**Guidelines:**
- Body text minimum: 16px (14px acceptable for small screens)
- Heading sizes must decrease: h1 > h2 > h3
- Limit to 5-6 sizes max to avoid chaos
- Small text (captions, labels): minimum 12-14px

### Line Height
**Principle:** Taller line height for readability, tighter for display text.

**Guidelines:**
- Body text: 1.5-1.6 (better readability)
- Headings: 1.2-1.3 (tighter, more impact)
- Small text: 1.4 minimum
- Dense UIs (tables, lists): 1.4-1.5

### Line Length
**Principle:** Optimal reading width improves comprehension.

**Guidelines:**
- Optimal: 50-75 characters per line
- Maximum: 90 characters
- Constrain long-form content with max-width
- Shorter lines for small screens acceptable

### Font Weight
**Guidelines:**
- Regular (400): Body text, paragraphs
- Semibold (600): Emphasis, subheadings
- Bold (700): Headings, strong emphasis
- Avoid thin weights (< 400) - poor contrast, hard to read

### Font Family
**Guidelines:**
- Maximum 2 font families per project
- Sans-serif generally better for UI
- Serif acceptable for long-form content
- Monospace for code blocks only
- System fonts for performance: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`

---

## Color System

### Color Palette Structure
**Principle:** Structured color system with clear purposes.

**Components:**
- **Primary**: Main brand color, CTAs (1 color)
- **Secondary**: Supporting actions (optional, 1 color)
- **Neutrals**: Text, borders, backgrounds (5-7 shades from light to dark)
- **Semantic colors**:
  - Success: Green tones
  - Error: Red tones
  - Warning: Yellow/Orange tones
  - Info: Blue tones

**Guidelines:**
- Limit to 3-4 brand colors maximum
- Neutrals do the heavy lifting (80% of UI)
- Brand colors for accents and CTAs (20% of UI)
- Each color needs light/dark variants (not just one shade)

### Color Contrast
**Principle:** Ensure readability through sufficient contrast.

**Minimum ratios (WCAG AA):**
- Normal text: 4.5:1
- Large text (18px+ or 14px+ bold): 3:1
- UI components (buttons, borders): 3:1

**Guidelines:**
- Test all text/background combinations
- Don't rely on color alone (use icons, labels, patterns)
- Provide high-contrast mode option for accessibility

---

## Alignment & Grid

### Alignment
**Principle:** Consistent alignment creates order and professionalism.

**Guidelines:**
- Left-align text for LTR languages (easier to scan)
- Center-align sparingly (titles, empty states, modals)
- Right-align numbers in tables (easier to compare)
- Align elements to a consistent grid

### Grid System
**Principle:** Invisible structure that organizes layout.

**Common approaches:**
- **12-column grid**: Flexible, divisible by 2, 3, 4, 6
- **8-column grid**: Simpler, good for smaller screens
- **Baseline grid**: Vertical rhythm for typography

**Guidelines:**
- Use grid for consistent spacing
- Allow content to breathe - don't fill every pixel
- Break the grid intentionally for emphasis (not accidentally)

---

## Common Mistakes

### ❌ Avoid These:
1. **Arbitrary spacing**: 17px, 23px, 31px → Use scale
2. **Inconsistent font sizes**: Random values → Use type scale
3. **Too many font weights**: 300, 400, 500, 600, 700, 800 → Max 3-4 weights
4. **Poor contrast**: Light gray text on white → Test contrast ratios
5. **No visual hierarchy**: Everything same size → Create clear levels
6. **Too many colors**: 10+ brand colors → 3-4 maximum
7. **Ignoring whitespace**: Cramped layouts → Give content room to breathe
8. **Inconsistent alignment**: Mixed left/center/right → Be intentional

---

## Design System Implementation

### CSS Variables Approach
**Benefit:** Single source of truth, easy to update, consistent across project.

**What to define:**
- Spacing scale (`--space-xs`, `--space-sm`, `--space-md`, etc.)
- Type scale (`--text-xs`, `--text-sm`, `--text-base`, etc.)
- Color palette (`--color-primary`, `--color-neutral-100`, etc.)
- Font families (`--font-body`, `--font-heading`)

### Design Tokens
**Benefit:** Platform-agnostic, can export to iOS, Android, Web.

**Structure:**
```
tokens/
  colors.json
  spacing.json
  typography.json
```

---

## Validation Checklist

Before considering design complete:
- [ ] Spacing follows consistent scale (no arbitrary values)
- [ ] Font sizes use type scale (predictable hierarchy)
- [ ] Color contrast meets WCAG AA minimum
- [ ] Visual hierarchy is clear (primary > secondary > tertiary)
- [ ] Alignment is consistent and intentional
- [ ] Line length is readable (50-90 characters)
- [ ] Whitespace creates breathing room
- [ ] Colors serve a purpose (not decorative only)
- [ ] Maximum 3-4 brand colors used
- [ ] Design system documented (if applicable)

---

## Key Takeaway

**Great design is invisible** - users shouldn't notice the grid, spacing, or typography. They should simply find the interface clear, readable, and easy to navigate.

Focus on **consistency** and **hierarchy** - these two principles solve 80% of design problems.

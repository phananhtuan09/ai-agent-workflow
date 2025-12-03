---
name: design-fundamentals
description: Validates fundamental design principles in UI code including spacing consistency, typography scale, color usage, and visual hierarchy. Suggests improvements for layout, contrast, and proportions. Auto-triggered when CSS or component styling is written.
allowed-tools: [read, grep]
---

# Design Fundamentals Skill

## Purpose
Ensure UI code follows fundamental design principles for visual consistency and quality.

## Automatic Triggers
- CSS or styled-components code is written
- UI components are created or modified
- User asks about layout, spacing, or visual design
- Style-related files are being edited

---

## Step 0: Design Context Detection

**Before providing suggestions, check conversation context for design references:**

### Indicators of Existing Design (Has Design Mode):
1. ✅ User attached screenshot/image/mockup
2. ✅ User mentioned: "theo Figma", "according to design", "like the mockup", "as shown", "match this design"
3. ✅ Figma URL present in conversation: `figma.com/file/...`
4. ✅ MCP Figma tool was used/called in conversation
5. ✅ User said: "implement this design", "match screenshot", "follow the design"

### Decision:
- **IF any indicator above found** → Use **Mode 1: Validate Against Design**
- **ELSE** → Use **Mode 2: Suggest Best Practices**

---

## Mode 1: Validate Against Design (When Design Provided)

**Goal**: Ensure implementation accurately matches the provided design specs

### What to Check:
- ✅ **Spacing**: Measure from screenshot/Figma - does code match? (e.g., design shows 24px, code has 24px)
- ✅ **Colors**: Extract exact hex/rgb from reference - does code use same values?
- ✅ **Typography**: Font sizes match design specs exactly
- ✅ **Layout proportions**: Widths, heights, alignments accurate to mockup
- ⚠️ **Flag deviations**: "Design shows 24px padding, but code uses 20px - should match design exactly"
- 💡 **Suggest corrections**: "Update to match design: use padding: 24px as specified in mockup"

### Validation Tone:
- "Design specifies X, but code uses Y - update to match design"
- "Ensure spacing matches mockup: 16px gap between elements (measured from screenshot)"
- "Color in design is #3B82F6, code uses #4A90E2 - use exact design color"

### Don't Suggest:
- ❌ Don't suggest alternative spacing scales
- ❌ Don't recommend "better" colors
- ❌ Focus on accuracy, not best practices

---

## Mode 2: Suggest Best Practices (No Design / Creative)

**Goal**: Suggest design principles for creating aesthetically pleasing UI

### What to Suggest:

#### Spacing Scale
- ✅ Use consistent spacing based on 4px or 8px system:
  - 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
- ⚠️ Avoid arbitrary values: 17px, 23px, 31px
- 💡 Rationale: "Using 8px-based spacing creates visual consistency and rhythm"

#### Typography Scale
- ✅ Consistent font sizes:
  - Body: 1rem (16px)
  - Small: 0.875rem (14px)
  - Headings: 1.25rem, 1.5rem, 2rem, 3rem
- 💡 Rationale: "Type scale creates clear visual hierarchy"

#### Color Contrast
- ✅ Body text: 4.5:1 minimum (WCAG AA)
- ✅ Large text (18px+): 3:1 minimum
- ✅ Interactive elements: 3:1 minimum
- 💡 Tool: "Use WebAIM Contrast Checker to verify"

### Suggestion Tone:
- "Consider using spacing scale for consistency: 16px, 24px, 32px"
- "Recommend font sizes: 1rem for body, 1.25rem for subheadings"
- "This approach creates better visual hierarchy and maintainability"

---

## Visual Hierarchy Checks

### Font Sizes
- Use consistent type scale: 0.75rem, 0.875rem, 1rem, 1.125rem, 1.25rem, 1.5rem, 2rem, 3rem
- Heading hierarchy: h1 > h2 > h3 (both visually and semantically)
- Body text: 1rem (16px) minimum for readability
- Small text: 0.875rem (14px) minimum

### Color Contrast
- Body text vs background: 4.5:1 minimum (WCAG AA)
- Large text (18px+) vs background: 3:1 minimum
- Interactive elements: 3:1 minimum
- Use tools to verify: WebAIM Contrast Checker

## Spacing & Layout

### Spacing Scale
Use consistent spacing values based on 4px or 8px system:
- 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px, 128px
- Avoid arbitrary values: 17px, 23px, 31px

### Whitespace
- Adequate breathing room between elements
- Group related items closer together
- Separate unrelated items with more space
- Use whitespace to create visual hierarchy

### Alignment
- Align elements to a consistent grid
- Left-align text for readability (LTR languages)
- Center-align sparingly (titles, empty states)
- Right-align numbers in tables

## Color Usage

### Color Palette Structure
- Primary color: CTAs, important actions (1 color)
- Secondary color: Supporting actions (optional)
- Neutral colors: Text, borders, backgrounds (5-7 shades from white to black)
- Semantic colors:
  - Success: Green
  - Error: Red
  - Warning: Yellow/Orange
  - Info: Blue

### Best Practices
- Maximum 3-4 brand colors to avoid visual noise
- Use neutrals for 80% of UI, brand colors for 20%
- Test colors in both light and dark mode
- Ensure sufficient contrast for accessibility

## Typography

### Font Families
- Maximum 2 font families
  - One for headings (can be decorative)
  - One for body text (must be readable)
- Sans-serif fonts generally better for UI
- Monospace for code blocks

### Line Height
- Body text: 1.5-1.6 (better readability)
- Headings: 1.2-1.3 (tighter, more impact)
- Small text: 1.4 minimum

### Line Length
- Optimal: 50-75 characters per line
- Maximum: 90 characters
- Use max-width to constrain text blocks

### Font Weight
- Regular: 400 (body text)
- Semibold: 600 (emphasis, subheadings)
- Bold: 700 (headings, strong emphasis)
- Avoid font weights < 400 (too thin, low contrast)

## Common Issues and Fixes

### Issue: Arbitrary spacing values
```css
/* Bad */
.card {
  padding: 17px;
  margin-bottom: 23px;
}

/* Good */
.card {
  padding: 16px; /* or var(--spacing-md) */
  margin-bottom: 24px; /* or var(--spacing-lg) */
}
```

### Issue: Inconsistent font sizes
```css
/* Bad */
h1 { font-size: 32px; }
h2 { font-size: 26px; }
h3 { font-size: 21px; }

/* Good - Use scale */
h1 { font-size: 2rem; }    /* 32px */
h2 { font-size: 1.5rem; }  /* 24px */
h3 { font-size: 1.25rem; } /* 20px */
```

### Issue: Poor contrast
```css
/* Bad */
.text {
  color: #999999;
  background: #f5f5f5; /* Contrast ratio: 2.8:1 - FAIL */
}

/* Good */
.text {
  color: #333333;
  background: #ffffff; /* Contrast ratio: 12.6:1 - PASS */
}
```

### Issue: No visual hierarchy
```css
/* Bad - Everything looks the same */
.card {
  padding: 20px;
}
.card-title { font-size: 16px; }
.card-text { font-size: 16px; }
.card-date { font-size: 16px; }

/* Good - Clear hierarchy */
.card {
  padding: 24px;
}
.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 8px;
}
.card-text {
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 16px;
}
.card-date {
  font-size: 0.875rem;
  color: var(--text-secondary);
}
```

## Design System Integration

### Use CSS Variables
```css
:root {
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Typography */
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;

  /* Colors */
  --color-primary: #3b82f6;
  --color-text: #1f2937;
  --color-text-secondary: #6b7280;
  --color-border: #e5e7eb;
}
```

## Quality Checklist

### If Has Design (Mode 1):
- [ ] Spacing matches design specs exactly
- [ ] Colors match design palette exactly (hex values)
- [ ] Typography follows design system (sizes, weights, line-heights)
- [ ] Layout proportions accurate to mockup
- [ ] All design elements implemented as specified

### If No Design (Mode 2):
- [ ] Spacing follows consistent scale (4px/8px based)
- [ ] Font sizes use type scale
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Visual hierarchy is clear (title > body > metadata)
- [ ] Alignment is consistent
- [ ] Line length is readable (50-75 chars)
- [ ] Whitespace creates breathing room
- [ ] Colors serve a purpose (not decorative only)

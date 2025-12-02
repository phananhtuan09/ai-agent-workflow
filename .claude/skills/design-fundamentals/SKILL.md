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

Before marking UI complete, verify:
- [ ] Spacing follows consistent scale (4px/8px based)
- [ ] Font sizes use type scale
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Visual hierarchy is clear (title > body > metadata)
- [ ] Alignment is consistent
- [ ] Line length is readable (50-75 chars)
- [ ] Whitespace creates breathing room
- [ ] Colors serve a purpose (not decorative only)

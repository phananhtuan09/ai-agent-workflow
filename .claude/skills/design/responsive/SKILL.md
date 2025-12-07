---
name: design-responsive
description: Responsive design principles - mobile-first approach, breakpoints, fluid layouts, touch-friendly interfaces. Framework agnostic guidelines.
allowed-tools: [read]

# Category & Loading
category: design
subcategory: responsive

# Auto-trigger logic
auto-trigger:
  enabled: true
  keywords:
    - responsive
    - mobile
    - tablet
    - desktop
    - breakpoint
    - media query
    - mobile-first
    - touch
    - viewport
    - fluid
  exclude-keywords:
    - animation
    - backend
    - API
  contexts:
    - design
    - responsive
    - mobile

# Manual trigger
manual-load:
  enabled: true
  commands:
    - /skill:responsive
    - /skill:responsive-design
  mentions:
    - make responsive
    - mobile-first
    - breakpoints

# Dependencies & Priority
dependencies: []
conflicts-with: []
priority: medium

# When to load this skill
trigger-description: |
  Load when user explicitly mentions responsive design, mobile layouts, or multi-device support.
  Focus on mobile-first principles and fluid design patterns.
---

# Responsive Design

## Purpose
Ensure UI works beautifully across all device sizes through mobile-first approach and fluid patterns.

---

## Core Principle

**Mobile-First Approach**

Design for mobile first, enhance for larger screens.

**Why:**
- Most users on mobile devices
- Easier to enhance than to strip down
- Forces focus on essential content
- Better performance on mobile

---

## Breakpoint System

### Standard Breakpoints

**Common breakpoint ranges:**
- **Mobile**: 320px - 639px (default, no media query needed)
- **Small (sm)**: 640px+ (mobile landscape, small tablet)
- **Medium (md)**: 768px+ (tablet portrait)
- **Large (lg)**: 1024px+ (tablet landscape, small desktop)
- **XLarge (xl)**: 1280px+ (desktop)
- **2XLarge (2xl)**: 1536px+ (large desktop)

**Guidelines:**
- Use 3-4 major breakpoints (not 10+)
- Base on content needs, not specific devices
- Avoid device-specific breakpoints (iPhone X, iPad Pro, etc.)
- Use `min-width` queries (mobile-first)

### Mobile-First Pattern

**Principle:** Base styles for mobile, enhance with `min-width` queries.

**Progression:**
1. Mobile (default): Single column, stacked, touch-optimized
2. Tablet: 2 columns, more spacing, hybrid interactions
3. Desktop: Multi-column, hover states, keyboard shortcuts

---

## Responsive Typography

### Fluid Typography

**Principle:** Font sizes scale smoothly with viewport.

**Approaches:**
- **Viewport units**: `font-size: calc(16px + 0.5vw)`
- **clamp()**: `font-size: clamp(16px, 2vw, 24px)` (min, preferred, max)
- **Stepped sizes**: Different fixed sizes per breakpoint

**Guidelines:**
- Body text minimum: 16px on mobile
- Scale up slightly on desktop (18-20px comfortable)
- Headings scale more dramatically than body text

### Line Length

**Principle:** Optimal reading width improves comprehension.

**Guidelines:**
- Mobile: 45-75 characters per line acceptable
- Desktop: 50-75 characters per line optimal
- Use max-width to constrain long-form content
- Shorter lines on small screens OK (still readable)

---

## Responsive Layout Patterns

### Stack → Row

**Pattern:** Vertical on mobile, horizontal on larger screens.

**Use cases:**
- Navigation menus
- Form layouts
- Card grids
- Content + sidebar

**Mobile:** Stack vertically (one column)
**Tablet+:** Side-by-side (two columns)
**Desktop:** Multiple columns or wider spacing

### Fluid Grids

**Principle:** Columns adapt to available space.

**Patterns:**
- **Auto-fit**: Columns wrap as needed
- **Percentage-based**: Columns use % width
- **Flexible**: Columns grow/shrink with flexbox

**Mobile:** 1 column
**Tablet:** 2 columns
**Desktop:** 3+ columns

### Sidebar Layouts

**Mobile:** Sidebar below main content (stacked)
**Tablet:** Sidebar beside main (if space allows)
**Desktop:** Fixed sidebar + scrollable main

**Considerations:**
- Don't hide important sidebar content on mobile
- Consider drawer/toggle for mobile
- Sidebar width proportional to screen size

---

## Component Responsive Patterns

### Navigation

**Mobile:**
- Hamburger menu
- Full-screen overlay or drawer
- Touch-optimized tap targets

**Desktop:**
- Horizontal navigation bar
- Hover dropdowns
- Keyboard accessible

**Pattern:**
Collapse to hamburger at smaller breakpoints, expand to full menu at larger.

### Data Tables

**Mobile:**
- Transform to card layout (each row becomes card)
- Horizontal scroll (when cards inappropriate)
- Show only essential columns, hide secondary data

**Desktop:**
- Full table with all columns
- Hover states on rows
- Sortable columns

**Principle:** Tables don't work well on small screens—provide alternative representation.

### Forms

**Mobile:**
- Full-width inputs (easier to tap)
- Single column layout
- Large touch targets (44x44px minimum)
- Vertical button groups

**Desktop:**
- Multi-column forms (when logical)
- Side-by-side labels and inputs
- Inline validation messages

### Images and Media

**Responsive Images:**
- Multiple sizes for different screens
- Lazy loading for below-fold content
- Art direction for different crops/focal points

**Aspect ratios:**
- Maintain consistent aspect ratios across sizes
- Use container aspect ratio to prevent layout shift

---

## Touch Optimization

### Tap Target Sizes

**Minimum sizes:**
- 44x44px (Apple/Google guidelines)
- 48x48px for better accessibility
- Spacing between targets: 8px minimum

**Why:** Finger taps less precise than mouse clicks.

**Applies to:**
- Buttons
- Links
- Form inputs
- Checkboxes/radios
- Icons

### Touch Gestures

**Standard gestures:**
- Tap: Activate/select
- Scroll: Navigate content
- Swipe: Navigate between items, dismiss
- Pinch: Zoom (when appropriate)

**Don't require:**
- Hover for critical functionality
- Double-click (not universal)
- Long-press as only interaction method

### Touch Feedback

**Principle:** Provide visual feedback on touch.

**Patterns:**
- Slight scale or opacity change on tap
- Ripple effect (Material Design style)
- Brief highlight or color shift

**Timing:** 100-200ms, feels immediate

### Mobile Considerations

**Input focus:**
- iOS zooms on inputs < 16px font size
- Solution: Use 16px minimum font size

**Viewport meta tag:**
- Always include: `<meta name="viewport" content="width=device-width, initial-scale=1">`
- Prevents desktop-width rendering on mobile

**Smooth scrolling:**
- Enable momentum scrolling on iOS: `-webkit-overflow-scrolling: touch`

---

## Container Queries (Modern)

**Principle:** Components respond to their container size, not viewport.

**Why better:**
- Component-based (matches modern architecture)
- Reusable components adapt to any container
- No need to know global layout context

**Use cases:**
- Card components (adapt to sidebar vs main area)
- Nested layouts
- Design system components

**Browser support:** Modern browsers (check compatibility)

---

## Responsive Spacing

### Fluid Spacing

**Principle:** Spacing scales with viewport.

**Approaches:**
- **clamp()**: `padding: clamp(16px, 5vw, 48px)`
- **Viewport units**: `margin: 5vw`
- **Stepped values**: Different spacing per breakpoint

**Guidelines:**
- Mobile: Tighter spacing (conserve screen space)
- Desktop: Generous spacing (utilize available space)
- Scale consistently across similar elements

---

## Performance Considerations

### Lazy Loading

**Load content as needed:**
- Images below fold
- Heavy components (charts, maps)
- Large lists (virtual scrolling)

**Why:** Faster initial load, especially on mobile networks.

### Conditional Loading

**Load different content per device:**
- Desktop: Full-resolution images, complex interactions
- Mobile: Optimized images, simplified interactions
- Avoid loading unused code for current device

### Image Optimization

**Best practices:**
- Use appropriate formats (WebP, AVIF)
- Serve different sizes per device
- Compress images aggressively
- Use CDN for delivery

---

## Testing Checklist

### Device Testing
- [ ] Real mobile devices (iOS, Android)
- [ ] Real tablets (iPad, Android tablet)
- [ ] Desktop at various sizes
- [ ] Landscape and portrait orientations

### Browser DevTools
- [ ] Responsive design mode
- [ ] Test all major breakpoints
- [ ] Zoom to 200% (accessibility)
- [ ] Network throttling (performance)

### Touch Interaction
- [ ] All tap targets 44x44px minimum
- [ ] Adequate spacing between targets
- [ ] Touch feedback visible
- [ ] No hover-only interactions for critical features

### Content
- [ ] Text readable on all screen sizes (16px+ body)
- [ ] Images scale properly without distortion
- [ ] Horizontal scroll only where intentional
- [ ] No content cut off or hidden

---

## Common Mistakes

1. **Desktop-first** - Start mobile, enhance up
2. **Fixed widths** - Use max-width instead
3. **Too many breakpoints** - 3-4 is enough
4. **Pixel-perfect designs** - Embrace fluidity
5. **Hover-only interactions** - Not accessible on touch
6. **Small touch targets** - 44x44px minimum
7. **Horizontal scroll** - Only use intentionally
8. **Ignoring landscape** - Test both orientations
9. **No real device testing** - Emulators aren't enough
10. **Not testing zoom** - Users zoom to read

---

## Key Takeaway

**Embrace fluidity, not fixed perfection.**

Responsive design isn't about making things look identical across devices—it's about providing the best experience for each context.

Start with mobile constraints, enhance progressively. This forces focus on what truly matters.

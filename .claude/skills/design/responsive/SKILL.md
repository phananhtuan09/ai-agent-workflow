---
name: design-responsive
description: |
  Mobile-first responsive design for beautiful, multi-device UIs. Breakpoints, fluid layouts,
  touch optimization, and creative responsive patterns for distinctive experiences across screens.

  Use when building responsive UIs or adapting designs for multiple devices:
  - Creating mobile-first layouts (stack→row, fluid grids, asymmetric patterns)
  - Defining breakpoints and fluid typography (mobile/tablet/desktop)
  - Optimizing for touch devices (44x44px targets, gestures, feedback)
  - Responsive component patterns (navigation, tables, forms, images)
  - Maintaining aesthetic consistency across screen sizes
  - Performance optimization (lazy loading, conditional loading)

  Mobile-first approach: Design for mobile constraints first, enhance progressively
  for larger screens. Focus on essential content, touch-friendly interactions, and
  maintaining distinctive aesthetic across all devices.

  Covers: Breakpoint systems, creative layout patterns, fluid typography, touch
  optimization, responsive spacing, component patterns, performance, testing strategies.

  Integrates with design-fundamentals: Apply spacing, typography, and color systems
  responsively. Maintain chosen aesthetic (minimal/bold/playful) across all devices.

  Apply to: All responsive web UIs (mobile/tablet/desktop)
  Do NOT load for: Desktop-only applications, native mobile apps (different patterns),
  or non-responsive legacy systems.
---

# Responsive Design

## Purpose
Create beautiful, functional UIs that adapt gracefully across all device sizes through mobile-first approach, creative layout patterns, and technical excellence.

---

## Core Principle

**Mobile-First Approach**

Design for mobile first, enhance for larger screens.

**Why:**
- Most users on mobile devices
- Easier to enhance than to strip down
- Forces focus on essential content
- Better performance on mobile
- Encourages progressive enhancement

---

## Creative Responsive Patterns

### Maintain Aesthetic Across Devices

**Principle:** Your chosen aesthetic (from design-fundamentals) should feel consistent across all screen sizes, while adapting to each device's constraints.

**Minimal/Refined aesthetic:**
- **Mobile**: Generous whitespace, restrained content, elegant typography
- **Tablet**: More breathing room, refined spacing increases
- **Desktop**: Maximum whitespace, elevated elegance

**Bold/Vibrant aesthetic:**
- **Mobile**: Strong colors, compact energy, bold typography
- **Tablet**: Bolder layouts, increased contrast
- **Desktop**: Full boldness, dramatic scale differences

**Playful/Friendly aesthetic:**
- **Mobile**: Rounded shapes, warm colors, cozy spacing
- **Tablet**: More playful interactions, generous padding
- **Desktop**: Full playfulness with space for delight

### Beyond Stack→Row: Creative Layouts

**Standard pattern** (functional but predictable):
```
Mobile: Stack vertically
Desktop: Side-by-side columns
```

**Creative patterns** (distinctive and memorable):

**Asymmetric Responsive:**
- Mobile: Single column with visual hierarchy through size variation
- Desktop: Asymmetric grid with unexpected element placement
- Elements don't just scale—they reposition creatively

**Diagonal Flow:**
- Mobile: Vertical flow with diagonal visual elements
- Desktop: Diagonal layouts, overlapping sections
- Maintains dynamism across breakpoints

**Intentional Breaking:**
- Mobile: Full-width sections with purpose
- Desktop: Break grid for hero elements, feature highlights
- Responsive doesn't mean boring—be bold where it counts

**Z-Pattern Adaptation:**
- Mobile: Vertical Z (natural scroll)
- Desktop: Horizontal Z (guide eye across screen)
- Use size, color, spacing to maintain flow

### Responsive Visual Hierarchy

**Principle:** Hierarchy adapts to available space—not all elements scale equally.

**Scale dramatically:**
- Primary CTAs: 2-3x size increase from mobile to desktop
- Hero headings: Significant size jump
- Featured content: More prominent on larger screens

**Scale subtly:**
- Body text: Minimal increase (16px → 18px)
- Labels: Stay similar size
- Helper text: Consistent across sizes

**Spacing hierarchy:**
- Mobile: Tight but intentional spacing (conserve space)
- Desktop: Generous spacing for visual breathing room
- Related items stay close, unrelated items separate more on desktop

---

## Breakpoint System

### Defining Breakpoints

**Principle:** Base breakpoints on content needs, not specific devices.

**Common approach (reference, not prescriptive):**
- **Mobile**: ~320-640px range (default, no media query needed)
- **Small/Tablet**: ~640-768px+ (mobile landscape, small tablet)
- **Medium**: ~768-1024px+ (tablet portrait)
- **Large**: ~1024-1280px+ (tablet landscape, small desktop)
- **XLarge**: ~1280px+ (desktop)

**Guidelines:**
- Use 3-4 major breakpoints (not 10+)
- Choose values based on where YOUR content breaks
- Avoid device-specific breakpoints (iPhone X, iPad Pro, etc.)
- Use `min-width` queries (mobile-first)
- Adjust to your design system (Material Design uses 600/960/1280, Tailwind uses 640/768/1024)

**Note:** Examples shown in CSS syntax for illustration. Principles apply to all frameworks (React, Vue, Svelte, Flutter, React Native, etc.)

### Mobile-First Pattern

**Principle:** Base styles for mobile, enhance with `min-width` queries.

**Progression:**
1. Mobile (default): Single column, stacked, touch-optimized
2. Tablet: 2 columns, more spacing, hybrid interactions
3. Desktop: Multi-column, hover states, keyboard shortcuts

---

## Responsive Typography

### Fluid Typography

**Principle:** Font sizes scale smoothly with viewport, maintaining readability.

**Approaches:**
- **Viewport units**: Scale proportionally with screen size
- **clamp()**: Define minimum, preferred, and maximum sizes
- **Stepped sizes**: Different fixed sizes per breakpoint

**Guidelines:**
- Body text typically 16px+ on mobile for readability (adjust per font family)
- Scale up slightly on desktop (18-20px range common)
- Headings scale more dramatically than body text
- Maintain hierarchy ratios across breakpoints
- Verify with your design system's typography scale

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

**Principle:** Touch targets must be large enough for finger interaction.

**Common standards (verify with your platform):**
- 44x44px (Apple HIG, Google Material baseline)
- 48x48px (WCAG 2.1 AAA, better accessibility)
- 40x40px (acceptable in dense UIs with adequate spacing)
- Spacing between targets: 8px minimum for usability

**Why:** Finger taps less precise than mouse clicks (~9mm average finger pad).

**Applies to:**
- Buttons
- Links
- Form inputs
- Checkboxes/radios
- Icons

**Note:** Adjust based on context (mobile app vs responsive web) and platform guidelines.

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
- iOS auto-zooms on inputs with font size < 16px
- Solution: Use 16px+ for input fields (or disable zoom if intentional)
- Applies to: text inputs, textareas, select dropdowns

**Viewport meta tag:**
- Always include viewport meta configuration
- Prevents desktop-width rendering on mobile
- Standard: `<meta name="viewport" content="width=device-width, initial-scale=1">`

**Smooth scrolling:**
- Enable momentum scrolling on iOS for better feel
- Consider touch-action CSS for gesture control

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
- **clamp()**: Define min, preferred, max spacing
- **Viewport units**: Scale proportionally
- **Stepped values**: Different spacing per breakpoint

**Guidelines:**
- Mobile: Tighter spacing (conserve screen space)
- Desktop: Generous spacing (utilize available space)
- Scale consistently across similar elements
- Maintain spacing scale ratios from design-fundamentals

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
- [ ] All tap targets meet minimum size (verify with platform guidelines)
- [ ] Adequate spacing between targets (8px+ typical)
- [ ] Touch feedback visible
- [ ] No hover-only interactions for critical features

### Content & Aesthetic
- [ ] Text readable on all screen sizes (verify with design system)
- [ ] Images scale properly without distortion
- [ ] Horizontal scroll only where intentional
- [ ] No content cut off or hidden
- [ ] Chosen aesthetic maintained across devices
- [ ] Visual hierarchy clear at all sizes

---

## Common Mistakes

**❌ Avoid:**
1. Desktop-first - Start mobile, enhance up
2. Fixed widths - Use max-width instead
3. Too many breakpoints - 3-4 is enough
4. Pixel-perfect designs - Embrace fluidity
5. Hover-only interactions - Not accessible on touch
6. Small touch targets - Verify minimum size for platform
7. Horizontal scroll - Only use intentionally
8. Ignoring landscape - Test both orientations
9. No real device testing - Emulators aren't enough
10. Not testing zoom - Users zoom to read
11. Losing aesthetic on mobile - Maintain distinctiveness
12. Generic mobile layouts - Be creative within constraints
13. Copying breakpoints blindly - Base on YOUR content needs

---

## Key Takeaway

**Principles over prescriptive values. Fluidity over rigidity.**

Responsive design isn't about hitting exact pixel values—it's about understanding WHY:
- Why mobile-first? (Forces focus on essentials)
- Why large touch targets? (Finger precision ~9mm)
- Why breakpoints on content? (Not devices)

Common standards (44px, 640px, 16px) are starting points, not absolute rules. Adjust to your design system, platform, and content needs.

Start with mobile constraints, enhance progressively. Maintain your aesthetic identity across all devices—just adapted to each device's strengths and constraints.

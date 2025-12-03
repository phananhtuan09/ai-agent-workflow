---
name: responsive-ui-patterns
description: Validates responsive design patterns including mobile-first approach, appropriate breakpoints, fluid layouts, and touch-friendly interfaces. Suggests responsive solutions for common UI patterns. Auto-triggered when layout or styling code is written.
allowed-tools: [read]
---

# Responsive UI Patterns Skill

## Purpose
Ensure UI works beautifully across all device sizes from mobile to desktop.

## Automatic Triggers
- Layout or grid code written
- CSS media queries added
- Component sizing or spacing defined
- User discusses mobile or responsive design

---

## Step 0: Design Context Detection

**Before providing suggestions, check conversation context for responsive design specs:**

### Indicators of Existing Design (Has Design Mode):
1. ✅ User provided mobile/tablet/desktop screenshots or mockups
2. ✅ User mentioned: "responsive design in Figma", "see mockup for breakpoints", "design shows tablet view"
3. ✅ Figma URL with multiple device frames/artboards
4. ✅ MCP Figma tool was used showing multiple screen sizes
5. ✅ User specified breakpoints: "breakpoints at 375px, 834px, 1440px"
6. ✅ Design file shows multiple device views (mobile, tablet, desktop)

### Decision:
- **IF any indicator above found** → Use **Mode 1: Match Design Breakpoints**
- **ELSE** → Use **Mode 2: Suggest Standard Breakpoints**

---

## Mode 1: Match Design Breakpoints (When Design Provided)

**Goal**: Implement responsive behavior exactly as shown in design

### What to Do:
1. **Extract breakpoints from design**:
   - Check mockup device sizes (e.g., Mobile: 375px, Tablet: 834px, Desktop: 1440px)
   - Use exact breakpoints from design specs
   - Identify layout changes at each breakpoint

2. **Validate implementation**:
   - ✅ Code uses design's exact breakpoints
   - ✅ Layout changes match mockup at each breakpoint
   - ✅ Component behavior matches design (stack → row, 1 col → 3 cols, etc.)
   - ⚠️ Flag: "Design shows 3-column at 1024px, but code uses 1280px"
   - 💡 Suggest: "Use design's breakpoint: @media (min-width: 1024px)"

3. **Breakpoint extraction examples**:
```markdown
If design shows screens for:
- Mobile (375px width) → Use: @media (min-width: 375px)
- Tablet (768px width) → Use: @media (min-width: 768px)
- Desktop (1440px width) → Use: @media (min-width: 1440px)
```

### Validation Tone:
- "Design shows 2-column layout at 768px - implement exactly as specified"
- "Mockup uses 834px breakpoint for tablet - code should match this"
- "Layout change in design occurs at 1024px, not 1280px"

### Don't Suggest:
- ❌ Don't suggest alternative breakpoints
- ❌ Don't recommend "standard" breakpoints if design has specific ones
- ❌ Focus on matching design, not best practices

---

## Mode 2: Suggest Standard Breakpoints (No Design / Creative)

**Goal**: Suggest industry-standard responsive patterns

### Core Principle
**Mobile-first approach**
- Design for mobile first, enhance for larger screens
- Most users are on mobile devices
- Easier to enhance than to strip down

---

## Mobile-First Approach

### Start with Mobile Base Styles

```css
/* Base styles: Mobile (default, no media query) */
.container {
  padding: 16px;
  font-size: 1rem;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

/* Tablet: Enhance for larger screens */
@media (min-width: 768px) {
  .container {
    padding: 24px;
    font-size: 1.125rem;
  }

  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }
}

/* Desktop: Further enhancements */
@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 32px;
  }

  .grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
  }
}
```

---

## Breakpoint System

### Recommended Breakpoints

```css
/* Mobile portrait: Default (320px - 639px) */
/* No media query needed */

/* Mobile landscape / Small tablet */
@media (min-width: 640px) { /* sm */ }

/* Tablet portrait */
@media (min-width: 768px) { /* md */ }

/* Tablet landscape / Small desktop */
@media (min-width: 1024px) { /* lg */ }

/* Desktop */
@media (min-width: 1280px) { /* xl */ }

/* Large desktop */
@media (min-width: 1536px) { /* 2xl */ }
```

### CSS Variables for Breakpoints

```css
:root {
  --screen-sm: 640px;
  --screen-md: 768px;
  --screen-lg: 1024px;
  --screen-xl: 1280px;
  --screen-2xl: 1536px;
}
```

### JavaScript Media Queries

```jsx
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

// Usage
const isMobile = useMediaQuery('(max-width: 767px)');
const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
const isDesktop = useMediaQuery('(min-width: 1024px)');
```

---

## Responsive Typography

### Fluid Typography with clamp()

```css
/* Scales between min and max based on viewport */
h1 {
  font-size: clamp(2rem, 5vw, 3rem);
  /* Min: 2rem (32px), Preferred: 5vw, Max: 3rem (48px) */
}

h2 {
  font-size: clamp(1.5rem, 4vw, 2rem);
}

p {
  font-size: clamp(1rem, 2vw, 1.125rem);
  line-height: 1.6;
}
```

### Responsive Line Length

```css
.content {
  max-width: 65ch; /* 65 characters per line */
  width: 100%;
}
```

---

## Responsive Layout Patterns

### Grid: Auto-Fit Columns

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

/* Automatically creates:
   - 1 column on mobile (< 300px)
   - 2 columns on tablet (600px+)
   - 3+ columns on desktop (900px+)
*/
```

### Flexbox: Responsive Wrapping

```css
.flex-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.flex-item {
  flex: 1 1 300px; /* Grow, shrink, base width */
  min-width: 0; /* Prevent overflow */
}
```

### Stack on Mobile, Row on Desktop

```css
.layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (min-width: 768px) {
  .layout {
    flex-direction: row;
  }
}
```

---

## Component Responsive Patterns

### Navigation

**Mobile: Hamburger menu**
**Desktop: Horizontal nav**

```jsx
const Navigation = () => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav>
      {isMobile ? (
        <>
          <button
            aria-label="Toggle menu"
            aria-expanded={isOpen}
            onClick={() => setIsOpen(!isOpen)}
          >
            <MenuIcon />
          </button>
          {isOpen && (
            <MobileMenu>
              <NavLinks />
            </MobileMenu>
          )}
        </>
      ) : (
        <DesktopNav>
          <NavLinks />
        </DesktopNav>
      )}
    </nav>
  );
};
```

### Data Tables

**Mobile: Cards**
**Desktop: Table**

```jsx
const DataDisplay = ({ data }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');

  return isMobile ? (
    <div className="card-list">
      {data.map(item => (
        <Card key={item.id}>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
          <span>{item.date}</span>
        </Card>
      ))}
    </div>
  ) : (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {data.map(item => (
          <tr key={item.id}>
            <td>{item.name}</td>
            <td>{item.description}</td>
            <td>{item.date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

### Sidebar Layouts

```css
/* Mobile: Stack */
.layout {
  display: grid;
  gap: 24px;
}

/* Desktop: Sidebar + Main */
@media (min-width: 1024px) {
  .layout {
    grid-template-columns: 250px 1fr;
  }
}
```

---

## Touch Optimization

### Tap Target Sizes

Minimum 44x44px for touch targets:

```css
button,
a,
input[type="checkbox"],
input[type="radio"] {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px;
}

/* Spacing between touch targets */
.button-group button {
  margin: 8px;
}
```

### Touch Feedback

```css
/* Visual feedback on touch */
button:active {
  transform: scale(0.98);
  opacity: 0.9;
}

/* Remove tap highlight color (iOS) */
button {
  -webkit-tap-highlight-color: transparent;
}
```

### Prevent Zoom on Input Focus (iOS)

iOS zooms on inputs with font-size < 16px:

```css
input,
select,
textarea {
  font-size: 16px; /* Prevent zoom on iOS */
}
```

### Scrollable Areas

```css
.scrollable {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
}

/* Hide scrollbar but keep functionality */
.scrollable {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}
.scrollable::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}
```

---

## Images and Media

### Responsive Images

```jsx
<img
  src="image-800.jpg"
  srcSet="
    image-400.jpg 400w,
    image-800.jpg 800w,
    image-1200.jpg 1200w
  "
  sizes="
    (max-width: 640px) 100vw,
    (max-width: 1024px) 50vw,
    33vw
  "
  alt="Description"
/>
```

### CSS: object-fit

```css
img {
  width: 100%;
  height: 300px;
  object-fit: cover; /* or contain */
}
```

### Video

```jsx
<video
  controls
  preload="metadata"
  style={{
    width: '100%',
    height: 'auto',
    maxWidth: '800px'
  }}
>
  <source src="video.mp4" type="video/mp4" />
</video>
```

---

## Container Queries (Modern)

Better than media queries for component-based design:

```css
.card-container {
  container-type: inline-size;
  container-name: card;
}

/* Default: Stacked layout */
.card {
  display: grid;
  gap: 16px;
}

/* When container > 400px: Horizontal layout */
@container card (min-width: 400px) {
  .card {
    grid-template-columns: 100px 1fr;
  }
}

/* When container > 600px: Three columns */
@container card (min-width: 600px) {
  .card {
    grid-template-columns: 100px 1fr 150px;
  }
}
```

---

## Responsive Spacing

### Fluid Spacing with clamp()

```css
.section {
  padding: clamp(16px, 5vw, 48px);
  margin-bottom: clamp(24px, 5vw, 64px);
}
```

### Responsive Gap

```css
.grid {
  display: grid;
  gap: clamp(16px, 3vw, 32px);
}
```

---

## Performance Considerations

### Lazy Load Images Below Fold

```jsx
<img
  src="image.jpg"
  loading="lazy"
  alt="Description"
/>
```

### Conditional Loading

Only load heavy components on larger screens:

```jsx
const HeavyChart = lazy(() => import('./HeavyChart'));

const Dashboard = () => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
    <div>
      {isDesktop ? (
        <Suspense fallback={<Skeleton />}>
          <HeavyChart />
        </Suspense>
      ) : (
        <SimpleChart />
      )}
    </div>
  );
};
```

---

## Testing Checklist

### If Has Design (Mode 1):
- [ ] All design breakpoints implemented exactly
- [ ] Layout matches design at each breakpoint
- [ ] Component behavior matches mockups (stacking, columns, visibility)
- [ ] Spacing/padding matches design at each screen size
- [ ] Test on device sizes shown in design

### If No Design (Mode 2):
#### Device Testing
- [ ] Test on real mobile device (iPhone, Android)
- [ ] Test on tablet (iPad, Android tablet)
- [ ] Test on desktop (various screen sizes)
- [ ] Test in landscape and portrait orientations

#### Browser DevTools
- [ ] Use responsive design mode
- [ ] Test all breakpoints: 320px, 375px, 768px, 1024px, 1440px
- [ ] Zoom to 200% - layout still works?
- [ ] Network throttling - images load properly?

#### Touch Interaction
- [ ] All buttons are 44x44px minimum
- [ ] Adequate spacing between touch targets (8px+)
- [ ] Touch feedback is visible
- [ ] No hover-only interactions

#### Content
- [ ] Text is readable on all screen sizes (min 16px)
- [ ] Images scale properly without distortion
- [ ] Horizontal scrolling only where intentional
- [ ] No content cut off or hidden

---

## Common Mistakes to Avoid

1. **Fixed widths**: Use `max-width` instead of `width`
2. **Desktop-first**: Start mobile, enhance up
3. **Too many breakpoints**: Stick to 3-4 major breakpoints
4. **Pixel-perfect**: Embrace fluid, flexible designs
5. **Hover-only interactions**: Not accessible on touch devices
6. **Small touch targets**: Minimum 44x44px
7. **Horizontal scroll**: Only use intentionally (e.g., carousels)
8. **Ignoring landscape**: Test both orientations on mobile

---

## Resources

- [MDN: Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Web.dev: Responsive Images](https://web.dev/responsive-images/)
- [Can I Use: Container Queries](https://caniuse.com/css-container-queries)

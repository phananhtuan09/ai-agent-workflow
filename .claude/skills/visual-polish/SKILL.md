---
name: visual-polish
description: Suggests animations, transitions, and micro-interactions to enhance user experience. Validates animation timing, easing, and performance. Auto-triggered when interactive components are created or polish improvements are discussed.
allowed-tools: [read]
---

# Visual Polish Skill

## Purpose
Add polish and delight to UI through animations, transitions, and micro-interactions.

## Automatic Triggers
- Interactive components (buttons, cards, modals)
- Transitions between states
- User discusses improving "feel" or "polish"
- Component interactions need enhancement

---

## Step 0: Design Context Detection

**Before providing suggestions, check conversation context for animation specs:**

### Indicators of Existing Design (Has Design Mode):
1. ✅ User provided prototype/animation mockup or video
2. ✅ User mentioned: "animation in Figma", "transition like prototype", "see animation specs"
3. ✅ Figma prototype link shared (with interactive animations)
4. ✅ MCP Figma tool showed prototype with animations
5. ✅ User specified animation details: "300ms ease-out", "slide from left", "fade in 200ms"
6. ✅ Design file includes motion/animation specifications

### Decision:
- **IF any indicator above found** → Use **Mode 1: Match Animation Specs**
- **ELSE** → Use **Mode 2: Suggest Polish Patterns**

---

## Mode 1: Match Animation Specs (When Design Provided)

**Goal**: Implement animations exactly as shown in design/prototype

### What to Do:
1. **Extract animation specs from design**:
   - **Duration**: Check prototype timing (e.g., 300ms, 400ms)
   - **Easing**: Note easing curve shown (ease-out, ease-in, spring)
   - **Direction**: Note animation direction (slide from top, fade in, scale up)
   - **Trigger**: When animation occurs (on hover, on click, on mount)

2. **Validate implementation**:
   - ✅ Animation duration matches prototype exactly
   - ✅ Easing curve matches design specs
   - ✅ Animation direction/behavior matches mockup
   - ✅ Timing feels identical to prototype
   - ⚠️ Flag: "Prototype shows 400ms, but code uses 250ms"
   - 💡 Suggest: "Match prototype timing: use duration: 0.4s"

3. **Figma easing mapping**:
```markdown
Figma easing → CSS equivalent:
- "Ease Out" → cubic-bezier(0, 0, 0.2, 1)
- "Ease In" → cubic-bezier(0.4, 0, 1, 1)
- "Ease In and Out" → cubic-bezier(0.4, 0, 0.2, 1)
- "Linear" → linear
- "Spring" → Use spring animation library or cubic-bezier(0.34, 1.56, 0.64, 1)
```

### Validation Tone:
- "Prototype animation is 300ms, code should match exactly"
- "Design uses ease-out curve - implement as cubic-bezier(0, 0, 0.2, 1)"
- "Animation should slide from top as shown in prototype, not fade"

### Don't Suggest:
- ❌ Don't suggest alternative timings
- ❌ Don't recommend "better" easing curves
- ❌ Focus on matching prototype, not best practices

---

## Mode 2: Suggest Polish Patterns (No Design / Creative)

**Goal**: Suggest delightful, performant animations and micro-interactions

## Core Principle
**Animations should be purposeful, not decorative**
- Provide feedback
- Guide attention
- Smooth transitions
- Add personality

---

## Animation Timing Guidelines

### Duration by Element Size
- **Small elements** (icons, badges): 150-200ms
- **Medium elements** (buttons, cards): 250-300ms
- **Large elements** (modals, drawers): 300-400ms
- **Page transitions**: 350-500ms

### Never Exceed 500ms
Animations > 500ms feel sluggish and frustrate users.

### Respect User Preferences
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Easing Functions

### When to Use Each

**ease-out** (Deceleration curve):
- Use for elements **entering** the screen
- Feels natural, like gravity
- `cubic-bezier(0, 0, 0.2, 1)` or `cubic-bezier(0.16, 1, 0.3, 1)`

**ease-in** (Acceleration curve):
- Use for elements **exiting** the screen
- Subtle and quick
- `cubic-bezier(0.4, 0, 1, 1)`

**ease-in-out** (Symmetrical):
- Use for elements **moving position** (not entering/exiting)
- `cubic-bezier(0.4, 0, 0.2, 1)`

**Avoid `linear`**:
- Feels robotic and unnatural
- Only use for continuous animations (progress bars, loaders)

### Recommended Custom Easings
```css
:root {
  /* Entering */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Exiting */
  --ease-in-expo: cubic-bezier(0.7, 0, 0.84, 0);

  /* Moving */
  --ease-in-out-circ: cubic-bezier(0.85, 0, 0.15, 1);
}
```

---

## Micro-interactions

### Button Interactions

**Hover Effect:**
```css
button {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

**Ripple Effect (Material Design style):**
```jsx
const [ripples, setRipples] = useState([]);

const handleClick = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  setRipples([...ripples, { x, y, id: Date.now() }]);
  setTimeout(() => {
    setRipples(prev => prev.slice(1));
  }, 600);
};
```

### Input Focus

**Smooth focus ring:**
```css
input {
  border: 2px solid transparent;
  transition: border-color 0.2s ease, outline-offset 0.2s ease;
}

input:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-color: var(--color-primary);
}
```

### Card Hover

```css
.card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}
```

---

## Component Animations

### Modal/Dialog Entrance

**Fade + Scale:**
```jsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
>
  <Modal>{content}</Modal>
</motion.div>
```

**With Backdrop:**
```jsx
<motion.div
  className="backdrop"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.15 }}
/>
```

### Drawer/Sidebar

**Slide from side:**
```jsx
<motion.div
  initial={{ x: -300 }}
  animate={{ x: 0 }}
  exit={{ x: -300 }}
  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
>
  <Drawer>{content}</Drawer>
</motion.div>
```

### Toast Notifications

**Slide in from top:**
```jsx
<motion.div
  initial={{ y: -100, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  exit={{ y: -100, opacity: 0 }}
  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
>
  <Toast>{message}</Toast>
</motion.div>
```

### Page Transitions

**Fade in on mount:**
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  <PageContent />
</motion.div>
```

---

## Loading States

### Skeleton Screens

Better than spinners for content loading:
```jsx
const Skeleton = ({ width = '100%', height = '20px' }) => (
  <div
    style={{
      width,
      height,
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: '4px'
    }}
  />
);

// CSS
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Spinner

```css
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
```

### Progress Bar

```jsx
<motion.div
  className="progress-bar"
  initial={{ width: 0 }}
  animate={{ width: `${progress}%` }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
/>
```

---

## Performance Best Practices

### Use GPU-Accelerated Properties

**Fast (use these):**
- `transform` (translate, scale, rotate)
- `opacity`

**Slow (avoid animating):**
- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`

### Example: Animate height with scale instead

```css
/* Bad - Triggers layout */
.element {
  transition: height 0.3s;
}

/* Good - GPU accelerated */
.element {
  transform-origin: top;
  transition: transform 0.3s;
}
.element.expanded {
  transform: scaleY(1.5);
}
```

### Use will-change Sparingly

```css
/* Only add when animation is about to start */
.button:hover {
  will-change: transform;
}

/* Remove after animation */
.button {
  will-change: auto;
}
```

### Avoid Animating Many Elements

- Limit to < 20 simultaneous animations
- Stagger animations instead of animating all at once
- Use `requestAnimationFrame` for JS animations

---

## Stagger Animations

Animate list items with delay:

```jsx
<motion.ul>
  {items.map((item, i) => (
    <motion.li
      key={item.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.3,
        delay: i * 0.05, // 50ms delay between items
        ease: [0.16, 1, 0.3, 1]
      }}
    >
      {item.content}
    </motion.li>
  ))}
</motion.ul>
```

---

## Common Patterns

### Expand/Collapse

```jsx
<motion.div
  animate={{ height: isOpen ? 'auto' : 0 }}
  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
  style={{ overflow: 'hidden' }}
>
  <div>{content}</div>
</motion.div>
```

### Smooth Number Changes

```jsx
import { useSpring, animated } from 'react-spring';

const AnimatedNumber = ({ value }) => {
  const props = useSpring({ number: value, from: { number: 0 } });
  return <animated.span>{props.number.to(n => n.toFixed(0))}</animated.span>;
};
```

### Attention-seeking

Subtle pulse for notifications:
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.notification-badge {
  animation: pulse 2s ease-in-out infinite;
}
```

---

## Testing Checklist

### If Has Design (Mode 1):
- [ ] Animation duration matches prototype exactly
- [ ] Easing curve matches design specs
- [ ] Animation direction/behavior matches mockup
- [ ] Timing feels identical to prototype when compared side-by-side
- [ ] All interactive states animated as shown in design
- [ ] Respects `prefers-reduced-motion`

### If No Design (Mode 2):
- [ ] Duration < 500ms for all animations
- [ ] Respects `prefers-reduced-motion`
- [ ] Uses GPU-accelerated properties (transform, opacity)
- [ ] No jank or stuttering (60fps)
- [ ] Animations are purposeful, not decorative
- [ ] Works on low-end devices
- [ ] Does not block user interactions
- [ ] Easing curves feel natural (ease-out for enter, ease-in for exit)

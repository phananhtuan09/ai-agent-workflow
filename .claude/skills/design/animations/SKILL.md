---
name: design-animations
description: Animation and micro-interaction principles - timing, easing, purposeful motion. Performance and accessibility considerations.
allowed-tools: [read]

# Category & Loading
category: design
subcategory: animations

# Auto-trigger logic
auto-trigger:
  enabled: true
  keywords:
    - animation
    - transition
    - micro-interaction
    - easing
    - timing
    - motion
    - hover effect
    - fade
    - slide
    - polish
  exclude-keywords:
    - responsive
    - accessibility
    - backend
  contexts:
    - design
    - animations
    - polish

# Manual trigger
manual-load:
  enabled: true
  commands:
    - /skill:animation
    - /skill:animations
    - /skill:polish
  mentions:
    - add animation
    - micro-interactions
    - polish UI

# Dependencies & Priority
dependencies: []
conflicts-with: []
priority: low

# When to load this skill
trigger-description: |
  Load ONLY when user explicitly requests animations or UI polish.
  Animations are enhancements, not core features.
  Focus on purposeful motion with proper timing and easing.
---

# Design Animations

## Purpose
Add polish and delight through purposeful animations, transitions, and micro-interactions.

---

## Core Principle

**Animations should be purposeful, not decorative.**

Good animations:
- Provide feedback
- Guide attention
- Explain transitions
- Add personality
- Improve perceived performance

Bad animations:
- Arbitrary motion
- Distract from content
- Slow down tasks
- Cause motion sickness
- Block interactions

---

## Animation Timing

### Duration by Element Size

**Guidelines:**
- **Small** (icons, badges): 150-200ms
- **Medium** (buttons, cards): 250-300ms
- **Large** (modals, drawers): 300-400ms
- **Page transitions**: 350-500ms

**Golden rule:** Never exceed 500ms

**Why:** Animations >500ms feel sluggish and frustrate users.

### Timing Thresholds

- **< 100ms**: Instant (no animation needed)
- **100-300ms**: Subtle, feels responsive
- **300-500ms**: Noticeable, attention-getting
- **> 500ms**: Slow, frustrating

**Context matters:**
- Feedback animations: Fast (150-250ms)
- Decorative animations: Medium (300-400ms)
- Story-telling animations: Slower acceptable (but rare in UI)

---

## Easing Functions

### When to Use Each

**Ease-out (Deceleration):**
- Elements **entering** screen
- Feels natural, like physics
- Most common for UI

**Ease-in (Acceleration):**
- Elements **exiting** screen
- Subtle, quick departure
- Less common

**Ease-in-out (Symmetrical):**
- Elements **moving position** (not entering/exiting)
- Balanced acceleration and deceleration

**Linear:**
- Avoid for most UI (feels robotic)
- Only for continuous animations (loaders, progress bars)
- Or very short durations (< 100ms)

### Custom Easing

**Common custom curves:**
- **Expo-out**: Fast start, smooth end (entering)
- **Circ-in-out**: Smooth throughout (moving)
- **Back-out**: Slight overshoot (playful)

**Guidelines:**
- Start with standard easings (ease, ease-in, ease-out)
- Only customize when standard feels wrong
- Test on multiple devices (performance)

---

## Micro-Interactions

### Button Feedback

**Hover:**
- Subtle elevation (lift slightly)
- Color shift
- Shadow increase
- Timing: 200ms

**Active/Press:**
- Slight depression (press down)
- Shadow decrease
- Timing: 100ms (immediate feedback)

**Loading:**
- Show spinner or progress
- Disable to prevent double-submission
- Maintain button size (prevent layout shift)

### Input Focus

**Focus indicator:**
- Smooth transition (200ms)
- Clear visual change (outline, border, glow)
- Sufficient contrast

**Validation:**
- Success: Subtle checkmark, green tint
- Error: Red indicator, shake animation (optional)

### Card Hover

**Desktop only** (no hover on mobile):
- Lift card (translateY)
- Increase shadow depth
- Subtle scale (1.02x maximum)
- Timing: 250ms
- Only for clickable cards

---

## Component Animations

### Modal/Dialog Entrance

**Pattern: Fade + Scale**
- Enter: Fade in + scale from 95% to 100%
- Exit: Reverse
- Timing: 200-250ms with ease-out

**Backdrop:**
- Fade in/out separately
- Slightly faster than modal (150ms)
- Helps focus attention on modal

### Drawer/Sidebar

**Pattern: Slide from edge**
- Slide from left/right (horizontal drawer)
- Slide from top/bottom (mobile sheet)
- Timing: 300ms
- Consider spring animation for natural feel

### Toast Notifications

**Pattern: Slide + Fade**
- Enter: Slide from top + fade in
- Exit: Fade out (can slide or just fade)
- Timing: 300ms
- Auto-dismiss after 3-5 seconds

### Page Transitions

**Pattern: Subtle fade + slight movement**
- Fade in + slight upward movement (y: 20px → 0)
- Timing: 300-400ms
- Don't overdo—frequent page changes shouldn't be jarring

**Alternatives:**
- Crossfade only (simplest)
- Slide in from side (mobile apps)
- Avoid heavy transitions (distracting)

---

## Loading States

### Skeleton Screens

**Preferred over spinners** for content loading.

**Characteristics:**
- Shimmer animation (gradient sweep)
- Matches content structure
- Timing: 1.5s cycle, infinite
- Gives sense of progress without exact percentage

### Spinners

**Use for:**
- Short waits (< 2 seconds)
- Button loading states
- Inline loading

**Characteristics:**
- Rotating indicator
- Timing: 600ms per rotation
- Size: 20-24px inline, 40-48px full-page

### Progress Bars

**Use for:**
- File uploads
- Multi-step processes
- Long operations (> 5 seconds)

**Characteristics:**
- Linear bar, 0-100%
- Update frequently (avoid frozen appearance)
- Smooth transitions between percentages (300ms)

---

## Performance

### GPU-Accelerated Properties

**Fast (use these):**
- `transform` (translate, scale, rotate)
- `opacity`

**Slow (avoid animating):**
- `width`, `height` (triggers layout)
- `top`, `left`, `right`, `bottom` (triggers layout)
- `margin`, `padding` (triggers layout)
- Color properties (moderate cost)

**Why:** Layout and paint are expensive; transforms/opacity use GPU compositing.

### Performance Tips

1. **Use transforms over position:**
   - `transform: translateX(100px)` not `left: 100px`

2. **Limit simultaneous animations:**
   - Maximum 20 elements animating at once
   - Stagger animations instead

3. **will-change sparingly:**
   - Only add before animation starts
   - Remove after animation completes
   - Overuse hurts performance

4. **Test on low-end devices:**
   - Animations should maintain 60fps
   - Reduce or disable on performance constraints

### Animation Libraries

**CSS:**
- Best for simple transitions and keyframe animations
- Lightweight, hardware-accelerated
- Limited programmatic control

**JavaScript:**
- More control and complex sequences
- Can sync with scroll, user input
- Larger bundle size

**When to use libraries:**
- Complex animation sequences
- Physics-based animations
- Scroll-driven animations
- Gesture-driven animations

---

## Accessibility

### Respect User Preferences

**Critical:** Always implement `prefers-reduced-motion`.

**Pattern:**
- Detect user's motion preference
- Disable or significantly reduce animations
- Keep functional transitions (e.g., focus indicators)

**Why:** Motion can cause:
- Vestibular disorders
- Motion sickness
- Migraines
- Distraction (ADHD, autism)

### Guidelines

- Animations should enhance, not be required
- Don't convey information through motion alone
- Provide alternative feedback methods
- Allow users to control animation speed/disable

---

## Common Animation Patterns

### Expand/Collapse (Accordion)

**Pattern:**
- Height: 0 → auto (or max-height)
- Overflow: hidden
- Timing: 300ms ease

**Considerations:**
- Animating to `auto` requires JavaScript or max-height trick
- Smooth reveal improves UX

### Stagger Animations (Lists)

**Pattern:**
- Animate items sequentially with delay
- Delay between items: 50-100ms
- Total sequence: < 1 second

**Use for:**
- Initial page load
- Filter results appearing
- New items added to list

### Attention-Seeking (Notifications)

**Pattern:**
- Subtle pulse (opacity 1 → 0.6 → 1)
- Timing: 2s ease-in-out, infinite
- Use very sparingly

**When to use:**
- New message indicator
- Unsaved changes warning
- Critical alerts only

---

## Common Mistakes

1. **Too slow** - Animations > 500ms feel sluggish
2. **Linear easing** - Feels robotic, unnatural
3. **Animating layout properties** - Bad performance
4. **Blocking interactions** - Users forced to wait
5. **Ignoring reduced motion** - Excludes users
6. **Animations everywhere** - Distracting, exhausting
7. **Inconsistent timing** - Feels unpolished
8. **No purpose** - Animation for animation's sake
9. **Heavy page transitions** - Annoying on frequent navigation
10. **Accessibility afterthought** - Should be built in from start

---

## Validation Checklist

Before shipping animations:
- [ ] Duration < 500ms for all non-loading animations
- [ ] Implements `prefers-reduced-motion`
- [ ] Uses GPU-accelerated properties (transform, opacity)
- [ ] Maintains 60fps on target devices
- [ ] Animations are purposeful, not decorative
- [ ] Doesn't block user interactions
- [ ] Consistent timing across similar animations
- [ ] Appropriate easing (ease-out for enter, ease-in for exit)
- [ ] Tested on mobile devices
- [ ] No motion sickness triggers (excessive rotation, speed)

---

## Key Takeaway

**Less is more with animation.**

A few well-executed animations > many mediocre ones.

Focus on purposeful motion that improves UX, not arbitrary decoration. When in doubt, leave it out.

Animation is dessert, not the meal. The UI should work perfectly without any animations—motion is enhancement only.

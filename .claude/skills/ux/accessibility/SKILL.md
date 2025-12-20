---
name: ux-accessibility
description: |
  Accessibility principles for inclusive design - keyboard navigation, screen readers,
  ARIA, color contrast, and focus management. WCAG compliance guidelines for building
  interfaces usable by everyone, including people with disabilities.

  Use when implementing interactive UI components and user interfaces:
  - Forms, buttons, links, and all interactive elements requiring keyboard access
  - Keyboard navigation, focus management, and tab order implementation
  - Screen reader support with semantic HTML and ARIA attributes
  - Color contrast validation (WCAG AA/AAA standards: 4.5:1, 3:1 ratios)
  - Modals, dialogs, dropdowns, and complex widgets needing focus trapping
  - Alternative text for images, icons, and visual content
  - Form validation with accessible error messages

  Focus on making UI usable via keyboard, screen readers, and assistive technologies.
  Covers semantic HTML, ARIA patterns, contrast ratios, and WCAG compliance.

  Do NOT load for: Performance optimization, responsive/mobile design, or animation timing.
  Accessibility is about usability for all users, not visual design or performance.
---

# UX Accessibility

## Purpose
Ensure UI is usable and accessible for everyone, including people with disabilities. Accessible design benefits all users.

---

## Core Principle

**Accessible design is good design for everyone.**

Benefits:
- Improves UX for all users (not just those with disabilities)
- Better SEO (semantic HTML)
- Legal compliance (ADA, WCAG)
- Broader audience reach

---

## Keyboard Navigation

### All Interactive Elements Must Be Keyboard-Accessible

**Required keyboard controls:**
- **Tab**: Move forward through interactive elements
- **Shift + Tab**: Move backward
- **Enter/Space**: Activate buttons and links
- **Escape**: Close modals, dismiss dropdowns
- **Arrow keys**: Navigate lists, menus, tabs

### Semantic HTML First

**Principle:** Use native HTML elements—they have built-in keyboard support.

**Best practices:**
- Use `<button>` for actions (not `<div>` with click handler)
- Use `<a>` for navigation (not `<span>` with click handler)
- Use `<input>`, `<select>`, `<textarea>` for form controls
- Native elements work automatically with keyboards and screen readers

### Tab Order

**Principle:** Logical tab order matches visual order.

**Guidelines:**
- Default DOM order usually correct
- Avoid positive `tabindex` values (breaks natural order)
- Use `tabindex="0"` to make non-interactive elements focusable
- Use `tabindex="-1"` to remove from tab order but keep programmatically focusable

### Skip Links

**Principle:** Let keyboard users skip repetitive navigation.

**Pattern:**
- Link at top of page: "Skip to main content"
- Visually hidden by default
- Visible on keyboard focus
- Jumps to main content area

---

## Focus Management

### Visible Focus Indicators

**Principle:** Users must always see which element has focus.

**Guidelines:**
- Never remove focus outline completely
- If hiding default outline, provide clear alternative
- Minimum 2px outline with sufficient contrast
- Use offset to separate from element border
- `:focus-visible` to show focus only for keyboard (not mouse clicks)

**Contrast requirement:**
- Focus indicator: 3:1 contrast ratio minimum

### Focus Trapping (Modals)

**Principle:** Focus stays within modal until dismissed.

**Requirements:**
1. Move focus to modal when opened
2. Trap focus inside modal (can't tab out)
3. Return focus to trigger element when closed
4. Escape key closes modal

**Why important:**
Keyboard users can't interact with background content while modal is open.

### Focus on Route Changes

**Principle:** Announce page changes to screen readers.

**Pattern:**
- Move focus to page heading on route change
- Or announce change via ARIA live region
- Prevents keyboard users from losing context

---

## Screen Reader Support

### Semantic HTML

**Principle:** Use correct HTML elements for their purpose.

**Element choices:**
- Buttons: `<button>` for actions
- Links: `<a>` for navigation
- Headings: `<h1>`-`<h6>` in proper hierarchy (don't skip levels)
- Lists: `<ul>`, `<ol>`, `<li>` for related items
- Landmarks: `<nav>`, `<main>`, `<header>`, `<footer>`, `<aside>`
- Forms: `<label>`, `<input>`, `<fieldset>`, `<legend>`

**Why:** Screen readers use semantic structure to navigate and understand content.

### Heading Hierarchy

**Principle:** Logical heading structure creates page outline.

**Rules:**
- One `<h1>` per page (page title)
- Don't skip heading levels (h1 → h2 → h3, not h1 → h3)
- Headings describe content that follows
- Visual size doesn't matter (use CSS), semantic level does

### ARIA Attributes

**Principle:** ARIA fills gaps where HTML semantics insufficient.

**When to use ARIA:**
- Icon-only buttons (no visible text)
- Decorative images
- Dynamic content changes
- Complex widgets (tabs, accordions, comboboxes)
- Form field descriptions and errors

**ARIA rules:**
1. First rule: Don't use ARIA (use semantic HTML instead)
2. Second rule: Don't override native semantics
3. Third rule: All interactive ARIA controls must be keyboard accessible
4. Fourth rule: Don't use `role="presentation"` or `aria-hidden="true"` on focusable elements

**Common ARIA attributes:**
- `aria-label`: Accessible name for element
- `aria-labelledby`: Points to element(s) that label this element
- `aria-describedby`: Points to element(s) that describe this element
- `aria-hidden`: Hides element from screen readers
- `aria-live`: Announces dynamic content changes
- `aria-expanded`: Indicates if element is expanded/collapsed
- `aria-required`: Marks form field as required
- `aria-invalid`: Marks form field as invalid

### Live Regions

**Principle:** Announce dynamic content changes to screen readers.

**Politeness levels:**
- `aria-live="polite"`: Announce when user idle (status updates)
- `aria-live="assertive"`: Announce immediately (errors, urgent alerts)
- `aria-live="off"`: Don't announce (default)

**Use cases:**
- Form validation errors
- Success messages
- Loading states
- Item counts ("5 items in cart")

### Alternative Text

**Images:**
- Informative images: Descriptive alt text
- Decorative images: Empty alt (`alt=""`) or `aria-hidden="true"`
- Complex images: Alt + longer description elsewhere

**Icons:**
- Icon with visible text: Hide icon from screen readers
- Icon-only button: Provide accessible label

---

## Color and Contrast

### Contrast Ratios (WCAG AA)

**Minimum ratios:**
- Normal text (<18px): **4.5:1**
- Large text (18px+ or 14px+ bold): **3:1**
- UI components (buttons, borders): **3:1**
- Focus indicators: **3:1**

**Testing:**
- Use browser DevTools (Chrome, Firefox have built-in checkers)
- WebAIM Contrast Checker
- Automated tools (axe DevTools, Lighthouse)

### Don't Rely on Color Alone

**Principle:** Information must be conveyed through multiple means.

**Examples:**
- Error fields: Red color + error icon + error text
- Required fields: Asterisk + label text + `required` attribute
- Links in text: Color + underline
- Status indicators: Color + icon + text label

**Why:** Color-blind users and screen reader users can't perceive color differences.

---

## Forms Accessibility

### Labels Required

**Principle:** Every input needs an accessible label.

**Methods:**
- Visible `<label>` element (preferred)
- `aria-label` for compact UIs
- `aria-labelledby` pointing to existing text

**Don't use placeholder as label:**
- Disappears when typing
- Insufficient contrast
- Not supported by all screen readers

### Required Fields

**Indicate required fields:**
- Visual indicator (asterisk)
- Text in label ("Email (required)")
- `required` attribute
- `aria-required="true"`

**Don't rely on color alone** (see above).

### Error Messages

**Principle:** Errors must be associated with fields.

**Requirements:**
- Show error inline (near field)
- Use `aria-describedby` to associate error with field
- Use `aria-invalid="true"` to mark field as invalid
- Include error icon for visibility
- Use `role="alert"` for dynamic errors

**Error message content:**
- Specific, not vague
- Explain what's wrong
- Suggest how to fix

### Fieldsets and Legends

**Principle:** Group related form fields.

**Use cases:**
- Radio button groups
- Checkbox groups
- Address forms (street, city, zip)

**Pattern:**
- `<fieldset>` wraps group
- `<legend>` provides group label

---

## Interactive Elements

### Buttons vs Links

**Principle:** Use correct element for the action.

**Buttons:**
- Trigger actions (submit, open modal, toggle)
- Stay on same page
- Use `<button>` element

**Links:**
- Navigate to another page/location
- Have meaningful `href`
- Use `<a>` element

**Don't:**
- Button that navigates → Should be link
- Link that triggers action → Should be button
- `<div>` or `<span>` as button/link → Use semantic elements

### Touch Targets

**Principle:** Minimum size for tappable elements.

**Guidelines:**
- Minimum: 44x44px (Apple/Google guidelines)
- Spacing between targets: 8px minimum
- Applies to mobile and desktop (helps motor impairments)

### Disabled States

**Principle:** Explain why elements are disabled.

**Best practices:**
- Provide tooltip or visible text explaining why disabled
- Don't disable if user needs to read content
- Consider "enabled but validation error" instead of disabled
- Disabled elements not focusable (may hide from keyboard users)

---

## Modals and Dialogs

### Modal Requirements

**Accessibility checklist:**
- Focus moves to modal when opened
- Focus trapped inside modal
- Escape key closes modal
- Focus returns to trigger on close
- Background content inert (not accessible)
- `role="dialog"` and `aria-modal="true"`
- Modal labeled with `aria-labelledby` or `aria-label`

**Why important:**
Keyboard and screen reader users need clear modal boundaries.

---

## Navigation and Landmarks

### Landmark Regions

**Principle:** Semantic sections help navigation.

**HTML5 landmarks:**
- `<header>`: Site/page header
- `<nav>`: Navigation menus
- `<main>`: Primary content (one per page)
- `<aside>`: Complementary content
- `<footer>`: Site/page footer
- `<section>`: Thematic content grouping
- `<article>`: Self-contained content

**Multiple landmarks of same type:**
- Provide unique labels with `aria-label`
- Example: `<nav aria-label="Main">` and `<nav aria-label="Footer">`

**Why:** Screen reader users can jump between landmarks for fast navigation.

---
### Screen Reader Testing

**Windows:** NVDA (free), JAWS
**Mac:** VoiceOver (built-in)
**Mobile:** VoiceOver (iOS), TalkBack (Android)

**Basic commands to learn:**
- Navigate by headings
- Navigate by landmarks
- Navigate by forms
- Read alt text
- Announce live regions

---

## Common Mistakes

1. **No keyboard access** - Interactive elements only work with mouse
2. **Missing focus indicators** - Users can't see where they are
3. **Missing alt text** - Images/icons without alternatives
4. **Poor contrast** - Text hard to read
5. **No labels** - Form inputs without associated labels
6. **Color-only information** - Relying solely on color
7. **Keyboard traps** - Can tab in but not out
8. **Inaccessible modals** - Focus not managed properly
9. **Skipped heading levels** - h1 → h3 (skipping h2)
10. **ARIA overuse** - Using ARIA when semantic HTML would work

---

## Key Takeaway

**Accessibility is not optional—it's fundamental.**

Build with accessibility from the start, not as an afterthought. It's easier, cheaper, and results in better UX for everyone.

Test early and often. Automated tools catch ~30-40% of issues—manual testing is essential.

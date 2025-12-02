---
name: accessibility-ux
description: Validates accessibility compliance while ensuring excellent user experience for all users including keyboard navigation, screen readers, color contrast, and focus management. Auto-triggered when interactive UI components are created.
allowed-tools: [read, grep]
---

# Accessibility + UX Skill

## Purpose
Ensure UI is usable and accessible for everyone, including people with disabilities.

## Automatic Triggers
- Forms, buttons, links created
- Interactive elements added
- Images or icons used
- Navigation or menus implemented
- Modals, dialogs, or overlays
- User discusses accessibility

## Core Principle
**Accessible design is good design for everyone**
- Benefits all users, not just those with disabilities
- Improves SEO, keyboard navigation, and mobile UX
- Is a legal requirement in many jurisdictions

---

## Keyboard Navigation

### All Interactive Elements Must Be Keyboard-Accessible

**Tab Order:**
- Tab: Move forward through interactive elements
- Shift + Tab: Move backward
- Enter/Space: Activate buttons and links
- Escape: Close modals, dismiss dropdowns
- Arrow keys: Navigate lists, menus, tabs

**Example: Custom button with keyboard support:**
```jsx
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  Click me
</div>
```

**Better: Use semantic HTML:**
```jsx
<button onClick={handleClick}>
  Click me
</button>
```

### Skip Links

Allow keyboard users to skip repetitive navigation:
```jsx
<a href="#main-content" className="skip-link">
  Skip to main content
</a>

<main id="main-content">
  {/* Content */}
</main>
```

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

---

## Focus Management

### Visible Focus Indicators

**Always show focus, never remove it:**
```css
/* Bad */
*:focus {
  outline: none; /* NEVER DO THIS */
}

/* Good */
button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Focus Trapping (Modals)

When modal opens, focus should:
1. Move to modal
2. Stay within modal (can't tab out)
3. Return to trigger element when closed

```jsx
import FocusTrap from 'focus-trap-react';

const Modal = ({ isOpen, onClose, children }) => {
  const closeButtonRef = useRef();

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <FocusTrap active={isOpen}>
      <div role="dialog" aria-modal="true">
        <button ref={closeButtonRef} onClick={onClose}>
          Close
        </button>
        {children}
      </div>
    </FocusTrap>
  );
};
```

### Focus on Route Changes

```jsx
useEffect(() => {
  // Focus on page title when route changes
  document.querySelector('h1')?.focus();
}, [pathname]);
```

---

## Screen Reader Support

### Semantic HTML

Use the right element for the job:

**Bad:**
```jsx
<div onClick={handleClick}>Submit</div>
<div className="heading">Page Title</div>
<span onClick={navigate}>About Us</span>
```

**Good:**
```jsx
<button onClick={handleClick}>Submit</button>
<h1>Page Title</h1>
<a href="/about">About Us</a>
```

### ARIA Labels

**When to use ARIA:**

**Icon buttons (no visible text):**
```jsx
<button aria-label="Close dialog">
  <XIcon aria-hidden="true" />
</button>
```

**Decorative images:**
```jsx
<img src="divider.png" alt="" role="presentation" />
```

**Informative images:**
```jsx
<img src="avatar.jpg" alt="User profile picture: John Doe" />
```

**Form inputs:**
```jsx
<label htmlFor="email">Email</label>
<input
  id="email"
  type="email"
  required
  aria-required="true"
  aria-invalid={!!error}
  aria-describedby="email-hint email-error"
/>
<small id="email-hint">We'll never share your email</small>
{error && (
  <span id="email-error" role="alert">
    {error}
  </span>
)}
```

### Live Regions

Announce dynamic content changes:

```jsx
<div role="status" aria-live="polite">
  {itemsCount} items in cart
</div>

<div role="alert" aria-live="assertive">
  Error: Payment failed
</div>
```

**aria-live values:**
- `polite`: Announce when user is idle
- `assertive`: Announce immediately (use sparingly)
- `off`: Don't announce

### Hide Decorative Content

```jsx
<button>
  <TrashIcon aria-hidden="true" />
  <span>Delete</span>
</button>
```

---

## Color and Contrast

### Contrast Ratios (WCAG AA)

- **Normal text** (< 18px): 4.5:1 minimum
- **Large text** (18px+ or 14px+ bold): 3:1 minimum
- **UI components** (buttons, borders): 3:1 minimum

**Test tools:**
- WebAIM Contrast Checker
- Chrome DevTools (Inspect → Accessibility)

**Common mistakes:**
```css
/* Bad: Low contrast */
.text {
  color: #999; /* 2.8:1 on white - FAIL */
  background: #fff;
}

/* Good */
.text {
  color: #666; /* 5.7:1 on white - PASS */
  background: #fff;
}
```

### Don't Rely on Color Alone

**Bad:**
```jsx
<span style={{ color: 'red' }}>Error</span>
<span style={{ color: 'green' }}>Success</span>
```

**Good:**
```jsx
<span className="error">
  <ErrorIcon aria-hidden="true" />
  Error: Invalid input
</span>

<span className="success">
  <CheckIcon aria-hidden="true" />
  Success: Saved
</span>
```

---

## Forms Accessibility

### Labels

**Every input needs a label:**
```jsx
<label htmlFor="username">Username</label>
<input id="username" type="text" />
```

**Or use aria-label:**
```jsx
<input type="search" aria-label="Search products" />
```

### Required Fields

```jsx
<label htmlFor="email">
  Email
  <span aria-label="required"> *</span>
</label>
<input
  id="email"
  type="email"
  required
  aria-required="true"
/>
```

### Error Messages

```jsx
<input
  id="password"
  type="password"
  aria-invalid={!!error}
  aria-describedby={error ? 'password-error' : undefined}
/>
{error && (
  <span id="password-error" role="alert">
    {error}
  </span>
)}
```

### Fieldsets for Grouping

```jsx
<fieldset>
  <legend>Shipping Address</legend>
  <input type="text" name="street" aria-label="Street" />
  <input type="text" name="city" aria-label="City" />
  <input type="text" name="zip" aria-label="Zip code" />
</fieldset>
```

---

## Interactive Elements

### Buttons vs Links

**Use `<button>` for actions:**
```jsx
<button onClick={handleSave}>Save Changes</button>
```

**Use `<a>` for navigation:**
```jsx
<a href="/about">About Us</a>
```

### Touch Targets (Mobile)

Minimum 44x44px tap target:
```css
button, a {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px;
}
```

### Disabled States

Explain why disabled:
```jsx
<button
  disabled={!isValid}
  title={!isValid ? 'Complete all required fields' : undefined}
  aria-disabled={!isValid}
>
  Submit
</button>
```

---

## Modals and Dialogs

### Modal Accessibility Pattern

```jsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
  <h2 id="dialog-title">Confirm Action</h2>
  <p id="dialog-description">
    Are you sure you want to delete this item?
  </p>
  <button onClick={handleConfirm}>Confirm</button>
  <button onClick={handleCancel}>Cancel</button>
</div>
```

### Requirements
- Trap focus inside modal
- Escape key closes modal
- Return focus to trigger element on close
- Disable background scroll
- Backdrop click closes (optional)

---

## Navigation and Menus

### Landmarks

Use semantic HTML5 elements:
```jsx
<header>
  <nav aria-label="Main navigation">
    {/* Links */}
  </nav>
</header>

<main>
  {/* Primary content */}
</main>

<aside aria-label="Related articles">
  {/* Sidebar */}
</aside>

<footer>
  {/* Footer content */}
</footer>
```

### Dropdown Menus

```jsx
<button
  aria-expanded={isOpen}
  aria-haspopup="true"
  aria-controls="menu-list"
  onClick={toggleMenu}
>
  Menu
</button>

<ul
  id="menu-list"
  role="menu"
  hidden={!isOpen}
>
  <li role="menuitem">
    <a href="/home">Home</a>
  </li>
  <li role="menuitem">
    <a href="/about">About</a>
  </li>
</ul>
```

---

## Testing Checklist

### Automated Testing
- [ ] Run axe DevTools or Lighthouse
- [ ] Check color contrast ratios
- [ ] Validate HTML semantics

### Manual Testing
- [ ] Navigate entire site with keyboard only (no mouse)
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Zoom to 200% - content still readable?
- [ ] Test on mobile with touch gestures
- [ ] Check focus indicators visible on all elements
- [ ] Verify all images have alt text
- [ ] Ensure all forms are labeled properly

### Common Issues to Check
- [ ] Can you Tab to all interactive elements?
- [ ] Can you activate buttons with Enter/Space?
- [ ] Does Escape close modals/dropdowns?
- [ ] Are error messages announced to screen readers?
- [ ] Is focus visible on all interactive elements?
- [ ] Do icon-only buttons have labels?
- [ ] Are decorative images hidden from screen readers?
- [ ] Is loading state announced?

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [axe DevTools](https://www.deque.com/axe/devtools/)

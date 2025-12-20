---
name: ux-feedback-patterns
description: |
  User feedback patterns for user-facing interactions - loading states, success messages,
  error handling, and empty states. Ensures users always understand system state and next steps.

  Use when implementing user-facing state changes in UI:
  - Form submissions requiring validation feedback and success/error messages
  - Async operations needing loading indicators (when to show, what type)
  - Error handling flows with clear recovery paths
  - Empty state designs with helpful messaging and actions
  - Success confirmations and toast notifications
  - Optimistic updates and rollback patterns

  Focus on WHEN to show feedback (timing thresholds), WHAT type (toast/inline/modal),
  and HOW LONG (auto-dismiss vs manual). Covers user-facing feedback patterns only.

  Do NOT load for: Backend error logging, API response design, or animation implementation
  details (timing curves, easing functions). For animation mechanics, see design/animations.
---

# UX Feedback Patterns

## Purpose
Ensure users never wonder "What's happening?" or "Did that work?" through clear, consistent feedback patterns.

---

## Core Principle

**Users must receive feedback for EVERY interaction.**

Every user action needs feedback in one or more states:
1. Loading/Processing
2. Success
3. Error
4. Empty

---

## Loading States

### When to Show Loading

**Timing thresholds (based on human perception research):**

These timings are based on UX research (Nielsen Norman Group, human-computer interaction studies) but should be adjusted to your specific context:

- **< 100ms**: Perceived as instant, no feedback needed
- **100-300ms**: Subtle indicator (optional) - users start noticing delay
- **300ms-1s**: Show spinner or skeleton - noticeable wait
- **1-5s**: Spinner + explanatory text - user needs reassurance
- **5-10s**: Progress bar with percentage - user needs tracking
- **10s+**: Progress bar + explanation + cancel option - user needs control

**Why 300ms threshold?**
Research shows this is where users start perceiving delay. Prevents flicker for fast operations while providing feedback for perceived delays. Adjust based on user expectations in your domain.

### Loading Patterns

**Button Loading:**
- Disable button to prevent double-submission
- Show spinner inside button or change text
- Keep button in place (don't shift layout)
- Maintain original button size

**Content Loading:**
- Prefer skeleton screens over spinners (better UX)
- Match skeleton structure to actual content
- Use shimmer animation for polish
- Maintain layout space (prevent content jump)

**Progress Indicators:**
- Use for file uploads, large operations
- Show percentage when determinable
- Provide cancel option for long operations
- Update frequently (avoid appearing frozen)

**Global vs Local:**
- Local: Loading specific component/section
- Global: Full-page overlay for critical operations
- Prefer local (doesn't block entire UI)

---

## Success States

### When to Show Success

**Always show for:**
- Form submissions
- Data mutations (create, update, delete)
- File uploads
- Account changes
- Payment confirmations

**Skip for:**
- Very quick actions (near-instant completion)
- Continuous interactions (likes, simple toggles) - use optimistic updates
- Actions where feedback is inherent in the result (e.g., UI immediately updates)

### Success Patterns

**Toast Notifications:**
- Auto-dismiss after 3-5 seconds
- Position: top-right or top-center (consistent)
- Include success icon for scannability
- Specific message, not generic "Success"

**Inline Messages:**
- For form submissions: show below form
- For section updates: show in affected area
- Less intrusive than toasts
- Can stay visible longer

**Visual Confirmation:**
- Button state change (e.g., "Save" → "Saved ✓")
- Brief color change (green tint)
- Small animation (checkmark, fade)
- Return to normal after 2-3 seconds

**When Success is Obvious:**
- Navigation to new page (implicit success)
- Item appears in list immediately
- Change is visually apparent
- No additional confirmation needed

---

## Error States

### Error Message Principles

**Be Specific:**
- ❌ "Error occurred"
- ❌ "Something went wrong"
- ✅ "Email already exists. Try logging in instead."
- ✅ "Password must be at least 8 characters"

**Be Helpful:**
- Explain what happened
- Suggest what to do next
- Provide recovery action when possible

**Be Human:**
- Natural language, avoid technical jargon
- Don't blame user ("You entered invalid email" → "Invalid email")
- Empathetic tone for serious errors

**Error Severity Levels:**
- **Critical**: System failure, data loss - modal, manual dismiss
- **High**: Form validation, API errors - prominent, actionable
- **Medium**: Warnings, non-blocking - dismissible notices
- **Low**: Helper text, suggestions - subtle, informative

### Error Patterns

**Form Field Errors:**
- Show inline, next to/below field
- Trigger on blur (not every keystroke - too aggressive)
- Include error icon for visibility
- Associate with field (accessibility)
- Keep visible until corrected

**Global Errors:**
- Prominent alert at top or modal
- Include error icon and title
- Explain what failed and why
- Provide action: Retry, Contact support, Learn more
- Manual dismiss (don't auto-hide critical errors)

**Error Recovery:**
- Always provide a path forward
- "Try Again" button for transient errors
- Link to help/support for persistent issues
- Save user's work when possible (don't lose data)

---

## Empty States

### Never Show Blank Screens

**Empty state must include:**
1. **Icon/Illustration**: Visual context
2. **Title**: "No [items] yet"
3. **Description**: Brief explanation
4. **Action** (when possible): CTA to create first item

### Empty State Types

**First-Time Empty:**
- Welcoming, encouraging tone
- Clear next step to get started
- Example: "Welcome! Create your first project to begin."

**Search No Results:**
- Acknowledge the query
- Suggest alternatives (check spelling, try different terms)
- Provide way to clear/modify search

**Filtered Empty:**
- Explain filters are active
- Show way to clear filters
- Example: "No items match your filters. Clear filters to see all."

**Permanently Empty:**
- Explain why empty (deleted, archived, etc.)
- Provide navigation to related content
- Avoid dead-end feeling

---

## Interaction Patterns

### Form Validation

**Validation Timing:**
- On blur: Validate individual field
- On submit: Validate entire form
- On change: Only for real-time feedback (password strength, username availability)

**Success Indicators:**
- Optional: show checkmark for valid fields
- Only after field touched (not immediately)
- Subtle, not distracting

### Button States

**Required states:**
- Default: Normal appearance
- Hover: Visual feedback
- Active/Pressed: Depressed appearance
- Loading: Spinner + disabled
- Disabled: Grayed out + tooltip/explanation
- Success: Brief confirmation (2-3s)

### Optimistic Updates

**Pattern:** Update UI immediately, rollback on error

**Best for:**
- Fast, reliable operations (likes, favorites)
- Low-stakes actions
- When instant feedback improves perceived performance

**How it works:**
1. Update UI immediately (assume success)
2. Send API request
3. If success: nothing (already updated)
4. If error: rollback + show error

**When NOT to use:**
- Destructive actions (delete)
- Complex validations
- Critical operations (payments)

### Destructive Actions

**Always confirm before:**
- Deleting items
- Permanent changes
- Bulk actions

**Confirmation pattern:**
- Modal dialog with clear title
- Explain consequences: "This cannot be undone"
- Primary action labeled clearly ("Delete", not "Yes")
- Use danger color (red) for destructive button
- Provide "Cancel" as escape hatch

---

## Best Practices

### Timing

**Research-based guidelines (adjust to your context):**
- Feedback should feel immediate (instant perceived response)
- Success messages: auto-dismiss after user has time to read (typically 3-5 seconds)
- Error messages: manual dismiss or longer timeout (user needs time to process)
- Loading threshold: Show indicators when operation feels delayed (research: ~300ms)

### Tone
- Be specific, not vague
- Be helpful, suggest next steps
- Be human, avoid technical jargon
- Don't blame user

### Accessibility
- Use ARIA live regions for dynamic messages
- Associate errors with form fields
- Provide text alternatives for visual indicators
- Don't rely on color alone

### Consistency
- Same pattern for same action across app
- Predictable feedback locations
- Consistent timing and animations
- Unified messaging tone

---

## Common Mistakes

1. **Silent failures** - Action fails with no feedback
2. **Vague errors** - "Error" tells nothing useful
3. **No loading state** - User clicks repeatedly
4. **Blank screens** - Empty state without explanation
5. **Disabled without reason** - No tooltip explaining why
6. **Flickering loaders** - Show only for operations with noticeable delay (not instant)
7. **Success overload** - Toast for every tiny action
8. **Technical error codes** - Show user-friendly messages instead
9. **No recovery path** - Error with no next step
10. **Blocking entire UI** - Use local loading when possible

---

## Validation Checklist

For every interactive feature:
- [ ] Loading state for async operations with noticeable delay
- [ ] Success feedback (toast, inline, or visual confirmation)
- [ ] Error messages specific and actionable
- [ ] Empty states have helpful messaging + action
- [ ] Optimistic updates rollback on failure
- [ ] Destructive actions require confirmation
- [ ] All feedback is accessible (ARIA, alt text)
- [ ] States are visually distinct and clear
- [ ] No silent failures
- [ ] Consistent patterns across application

---

## Key Takeaway

**Never leave users guessing.** Clear, timely feedback is the difference between a frustrating experience and a delightful one.

Timing guidelines in this skill are based on UX research (Nielsen Norman Group, human perception studies) but should be adjusted to your specific context. Users in different domains have different expectations (e.g., gaming vs banking).

When in doubt, over-communicate rather than under-communicate.

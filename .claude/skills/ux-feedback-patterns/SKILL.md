---
name: ux-feedback-patterns
description: Ensures proper user feedback for all interactions including loading states, success confirmations, error messages, and empty states. Validates that users always know what is happening. Auto-triggered when forms, API calls, or async operations are implemented.
allowed-tools: [read, grep]
---

# UX Feedback Patterns Skill

## Purpose
Ensure users always receive clear feedback for every interaction and system state.

## Automatic Triggers
- Form submission code
- API calls or async operations
- Button click handlers
- Data mutations (create, update, delete)
- Loading/fetching data
- Empty state scenarios

## Core Principle
**Users should never wonder "What's happening?" or "Did that work?"**

Every interaction needs one or more of these states:
1. Loading/Processing
2. Success
3. Error
4. Empty

---

## Required States for Every Interaction

### 1. Loading State

Show when operations take > 300ms:

**Button Loading:**
```jsx
<Button
  onClick={handleSubmit}
  disabled={isLoading}
  aria-busy={isLoading}
>
  {isLoading ? (
    <>
      <Spinner size="sm" aria-hidden="true" />
      <span>Processing...</span>
    </>
  ) : 'Submit'}
</Button>
```

**Skeleton Screens (better than spinners for content):**
```jsx
{isLoading ? (
  <div>
    <Skeleton width="100%" height="20px" />
    <Skeleton width="80%" height="20px" />
    <Skeleton width="90%" height="20px" />
  </div>
) : (
  <Content data={data} />
)}
```

**Progress Indicators:**
```jsx
// For long operations (> 5 seconds)
<ProgressBar
  value={uploadProgress}
  max={100}
  label={`Uploading... ${uploadProgress}%`}
/>
```

**Timing Guidelines:**
- < 100ms: Instant, no feedback needed
- 100-300ms: Brief loading indicator (subtle)
- 300ms-1s: Loading spinner
- 1-5s: Spinner with text ("Loading...")
- 5-10s: Progress bar or percentage
- 10s+: Progress bar + explanation ("Processing large file...")

### 2. Success State

Clear confirmation that action succeeded:

**Toast Notifications:**
```jsx
{success && (
  <Toast
    variant="success"
    onDismiss={() => setSuccess(false)}
    autoClose={3000}
  >
    <CheckIcon aria-hidden="true" />
    User created successfully
  </Toast>
)}
```

**Inline Messages:**
```jsx
{submitted && (
  <Alert variant="success">
    Your changes have been saved
  </Alert>
)}
```

**Visual Confirmation:**
```jsx
// Button changes after success
<Button
  variant={saved ? 'success' : 'primary'}
  disabled={saved}
>
  {saved ? (
    <>
      <CheckIcon /> Saved
    </>
  ) : 'Save Changes'}
</Button>
```

### 3. Error State

Specific, actionable error messages:

**Bad Error Messages:**
- "Error occurred"
- "Something went wrong"
- "Error 500"

**Good Error Messages:**
- "Email already exists. Try logging in instead."
- "Password must be at least 8 characters"
- "Connection lost. Check your internet connection."

**Form Field Errors:**
```jsx
<div>
  <input
    type="email"
    value={email}
    onChange={handleChange}
    aria-invalid={!!errors.email}
    aria-describedby={errors.email ? 'email-error' : undefined}
  />
  {errors.email && (
    <span
      id="email-error"
      role="alert"
      className="error-message"
    >
      <ErrorIcon aria-hidden="true" />
      {errors.email}
    </span>
  )}
</div>
```

**Global Errors:**
```jsx
{error && (
  <Alert variant="error" onClose={() => setError(null)}>
    <strong>Could not save changes</strong>
    <p>{error.message}</p>
    {error.retryable && (
      <Button onClick={handleRetry}>Try Again</Button>
    )}
  </Alert>
)}
```

### 4. Empty State

Never show blank screens - explain and provide action:

**List Empty State:**
```jsx
{items.length === 0 ? (
  <EmptyState
    icon={<InboxIcon />}
    title="No messages yet"
    description="When you receive messages, they'll appear here"
    action={
      <Button onClick={handleCompose}>
        <PlusIcon /> New Message
      </Button>
    }
  />
) : (
  <ItemList items={items} />
)}
```

**Search No Results:**
```jsx
{searchResults.length === 0 && searchQuery && (
  <EmptyState
    icon={<SearchIcon />}
    title={`No results for "${searchQuery}"`}
    description="Try different keywords or check spelling"
    action={
      <Button variant="ghost" onClick={handleClearSearch}>
        Clear Search
      </Button>
    }
  />
)}
```

---

## Interaction Patterns

### Form Validation

**Inline Validation (on blur, not on every keystroke):**
```jsx
const [touched, setTouched] = useState({});
const [errors, setErrors] = useState({});

<input
  onBlur={() => {
    setTouched({ ...touched, email: true });
    validateField('email', value);
  }}
  aria-invalid={touched.email && !!errors.email}
/>

{touched.email && errors.email && (
  <span role="alert">{errors.email}</span>
)}
```

**Success Indicators:**
```jsx
{touched.email && !errors.email && value && (
  <CheckIcon className="field-success" aria-label="Valid" />
)}
```

### Button States

**All button states:**
```jsx
<Button
  onClick={handleClick}
  disabled={isLoading || isDisabled}
  aria-busy={isLoading}
  title={isDisabled ? "Complete required fields first" : undefined}
>
  {isLoading && <Spinner />}
  {isSuccess && <CheckIcon />}
  {buttonText}
</Button>
```

### Optimistic Updates

Update UI immediately, rollback on error:

```jsx
const handleLike = async (postId) => {
  // Optimistic update
  setLiked(true);
  setLikeCount(prev => prev + 1);

  try {
    await api.likePost(postId);
    // Success feedback (optional for quick actions)
  } catch (error) {
    // Rollback on error
    setLiked(false);
    setLikeCount(prev => prev - 1);

    // Show error
    showToast({
      variant: 'error',
      message: 'Could not like post. Please try again.'
    });
  }
};
```

### Destructive Actions

Confirm before irreversible actions:

```jsx
const handleDelete = async () => {
  const confirmed = await confirm({
    title: 'Delete this item?',
    description: 'This action cannot be undone.',
    confirmText: 'Delete',
    confirmVariant: 'danger'
  });

  if (confirmed) {
    // Proceed with deletion
    setDeleting(true);
    try {
      await api.delete(itemId);
      showToast({ variant: 'success', message: 'Item deleted' });
    } catch (error) {
      showToast({ variant: 'error', message: 'Could not delete item' });
    } finally {
      setDeleting(false);
    }
  }
};
```

---

## Best Practices

### Timing
- Feedback should be immediate (< 100ms perceived delay)
- Success messages: Auto-dismiss after 3-5 seconds
- Error messages: Require manual dismiss (or longer timeout 10s+)
- Loading states: Show after 300ms threshold to avoid flicker

### Tone
- Be specific: "Could not save changes" > "Error"
- Be helpful: Suggest next action
- Be human: "Oops! Something went wrong" is okay for unexpected errors
- Avoid blame: "Invalid email" > "You entered an invalid email"

### Accessibility
- Use `role="alert"` for important messages
- Use `aria-live="polite"` for status updates
- Include `aria-busy` for loading states
- Ensure error messages are associated with fields

### Visual Hierarchy
- Errors: Red, prominent, with icon
- Success: Green, subtle (unless major action)
- Loading: Neutral, non-intrusive
- Info: Blue, informational tone

---

## Common Mistakes to Avoid

1. **Silent failures**: Action fails but no feedback
2. **Vague errors**: "Error occurred" tells user nothing
3. **No loading state**: User clicks again thinking it didn't work
4. **Blank screens**: Empty state with no explanation
5. **Disabled buttons without reason**: Use tooltips to explain why
6. **Flickering loaders**: Only show for operations > 300ms
7. **Success overload**: Not every action needs a toast

---

## Testing Checklist

For every interactive feature, verify:
- [ ] Loading state appears for async operations
- [ ] Success feedback is clear and dismissable
- [ ] Error messages are specific and actionable
- [ ] Empty states have helpful messaging and actions
- [ ] Optimistic updates rollback on failure
- [ ] Destructive actions require confirmation
- [ ] All feedback is accessible (screen reader friendly)
- [ ] States are visually distinct

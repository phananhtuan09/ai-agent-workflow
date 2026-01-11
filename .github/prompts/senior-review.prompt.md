---
name: senior-review
description: Senior developer code review focusing on clean code, readability, and maintainability.
---

## Goal

Perform a comprehensive code review from a senior developer's perspective, focusing on code quality, architecture, and maintainability.

## Workflow Alignment

- Provide brief status updates (1–3 sentences) before/after important actions.
- For medium/large reviews, create todos (≤14 words, verb-led). Keep only one `in_progress` item.
- Provide a high-signal summary at completion highlighting key findings.

## Review Criteria

### 1. Code Readability
- Clear variable and function names
- Consistent formatting and style
- Appropriate comments (explain "why", not "what")
- Logical code organization

### 2. Architecture & Design
- Single Responsibility Principle
- DRY (Don't Repeat Yourself)
- Appropriate abstractions
- Clear separation of concerns

### 3. Error Handling
- Comprehensive error cases covered
- Meaningful error messages
- Graceful degradation
- No silent failures

### 4. Performance Considerations
- Efficient algorithms
- No obvious bottlenecks
- Appropriate caching strategies
- Memory usage awareness

### 5. Security
- Input validation
- No sensitive data exposure
- Secure defaults
- Proper authentication/authorization

### 6. Testability
- Code is testable
- Dependencies are injectable
- Side effects are minimized
- Edge cases are considered

## Review Process

1. **Understand Context**: Read the code and understand its purpose
2. **Identify Strengths**: Note what's done well
3. **Find Issues**: Identify problems by severity (Critical/Important/Nit)
4. **Suggest Improvements**: Provide specific, actionable feedback
5. **Summarize**: Present findings in a clear report

## Output Format

```
## Senior Code Review

### What's Good
- [Positive observations]

### Critical Issues
1. [Issue]: [Explanation and recommendation]

### Important Improvements
1. [Issue]: [Explanation and recommendation]

### Minor Suggestions (Nits)
1. [Suggestion]

### Summary
- Critical: X issues
- Important: Y improvements
- Nits: Z suggestions
```

## Notes

- Be constructive, not critical
- Explain the "why" behind suggestions
- Consider the broader context and constraints
- Focus on patterns, not just individual issues

# Bug Fix — Frontend Checklist

Use this checklist when the task type is `bug-fix` and the scope involves frontend code (React, TypeScript, CSS, browser APIs).

This file is a shared knowledge file read by multiple consumers:

- `task-investigator` reads sections 1–3 during investigation
- `execute-plan` reads section 4 during fix execution
- `dev-verifier` reads section 5 during post-fix verification

---

## 1. Diagnostic Flow (task-investigator)

### Code-first diagnosis

Try these steps using code analysis alone. No browser or user input required:

1. **Grep for error pattern** — search codebase for the symptom described in the prompt
2. **Trace data flow** — read the chain: API call → state update → render output
3. **Check hook dependencies** — scan useEffect/useMemo/useCallback deps for staleness
4. **Check shared code** — grep for the hook/util/service to confirm if the bug is isolated or shared
5. **Pattern match** — compare against known React/TS gotchas (section 3)

### When code-first is sufficient

Proceed without asking the user when:

- the root cause is identifiable from source code (wrong deps, state mutation, type mismatch)
- the blast radius is confirmable by grepping usage
- the fix is deterministic from the code pattern

Set `Recommended Next Step: proceed` in the investigation report.

### When to escalate to ask-user

Add these to `Questions for User` in the investigation report when:

- **Reproduction path missing** — the prompt describes a symptom but not the steps to trigger it. Ask: "What are the exact steps to reproduce this bug?"
- **Browser/device specific** — the code looks correct but the bug may be environment-dependent. Ask: "Does this happen on all browsers or a specific one? Can you share the console output?"
- **Network layer ambiguity** — cannot determine from code whether the issue is FE or API. Ask: "Can you share the network response for [endpoint] when the bug occurs?"
- **State vs render ambiguity** — multiple possible root causes in code. Ask: "What is the actual value shown vs what you expect? Can you share a screenshot?"

Set `Recommended Next Step: ask-user` in the investigation report.

### Layer isolation questions

When building the report, determine which layer the bug lives in:

- UI rendering — wrong output despite correct state
- State management — state value is wrong before render
- API integration — response data is unexpected or missing
- Side effects — useEffect timing, cleanup, or dependency issue
- CSS layout — visual-only, no logic bug

---

## 2. Blast Radius Mapping (task-investigator)

Before reporting scope, map what the fix could affect:

- Which components use the same state/hook/util?
- How many places call the same API service?
- Are there shared types that will change shape?

Use grep to confirm scope:

```
grep -r "useTargetHook" src/
grep -r "targetService.method" src/
```

### Decision table

Report this classification in the investigation report `Known` section:

| Situation | Scope | Action |
|---|---|---|
| Bug is isolated, single component | single-file | Fix in-place |
| Bug in shared code, few consumers | multi-file | Fix with consumer verification |
| Bug in shared code, many consumers or cross-layer | cross-layer | Flag as high blast radius in report |

---

## 3. React / TypeScript Gotchas (task-investigator)

Flag these patterns when reading source code during investigation:

### Stale closure in useEffect

```tsx
// BAD — currentPage is stale
useEffect(() => {
  fetchData(currentPage);
}, []);

// GOOD — declare correct deps
useEffect(() => {
  fetchData(currentPage);
}, [currentPage]);
```

### Direct state mutation

```tsx
// BAD — does not trigger re-render
const handleAdd = () => {
  list.push(newItem);
  setList(list);
};

// GOOD
setList(prev => [...prev, newItem]);
```

### Unstable key

```tsx
// BAD — index key causes unmount/remount issues
items.map((item, index) => <Item key={index} />)

// GOOD
items.map(item => <Item key={item.id} />)
```

### React Query v5 over-invalidation

```tsx
// BAD — refetches everything
queryClient.invalidateQueries();

// GOOD — scoped invalidation
queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
```

### Other patterns to check

- `useMemo`/`useCallback` with wrong deps — same class of bug as useEffect deps
- Zod schema out of sync with actual API response shape
- React Hook Form `defaultValues` not set → uncontrolled/controlled conflict
- `enabled: false` on useQuery without re-enabling → query never fires

---

## 4. Fix Execution Rules (execute-plan)

### Minimum-change principle

- Only change the code that causes the bug
- One fix per commit — do not mix bug fix with refactoring
- Do not change shared function signatures unless the fix requires it
- Do not change shared type shapes without grepping all consumers
- If shared code must change — create new function, migrate callers, remove old function later

### Anti-patterns

- Do not add `!` (non-null assertion) to silence TypeScript — fix the actual type
- Do not use `// @ts-ignore` — that hides the real bug
- Do not refactor while fixing — separate commits
- Do not commit temporary `console.log` statements

---

## 5. Post-Fix Verification (dev-verifier)

### Automated checks (agent runs directly)

These checks can be performed by the verifier without user input:

- [ ] Changed code matches the root cause identified in the investigation report
- [ ] Blast radius consumers (from investigation) are not broken — grep confirms no type errors or missing imports
- [ ] No `!`, `// @ts-ignore`, or `console.log` in the diff
- [ ] Pre-commit checks pass:

```bash
npm run lint
npm run type-check
npm run build
```

### Confidence assessment

After automated checks, classify fix confidence:

**High confidence** — no user verification needed:

- Root cause was a clear code pattern (stale deps, state mutation, wrong key)
- Fix is deterministic and localized
- All automated checks pass
- Blast radius is contained (single-file or few consumers)

→ Set verdict to `pass`

**Low confidence** — surface these in `Acceptance Criteria Gaps`:

- Root cause was ambiguous between FE and API
- Fix touches shared code with many consumers
- Bug was reported as browser/device specific but fix is untested in that environment
- Fix changes behavior that cannot be verified by static analysis alone

→ Set verdict to `warn` and include specific user verification requests:

- "Please verify in browser that [specific behavior] works as expected"
- "Please check console for new warnings after applying the fix"
- "Please test on [specific browser/device] where the bug was reported"
- "Please verify that [adjacent feature from blast radius] still works"

---

## Investigation Report Guidance (task-investigator)

When populating the investigation report for a FE bug-fix:

- **Known (from codebase)**: include which layer the bug lives in, blast radius grep results, whether the bug is in shared or isolated code, and which gotcha pattern matches (if any)
- **Unclear (blocking)**: flag only when code-first diagnosis cannot determine root cause — reproduction path missing, browser-specific behavior untestable, or root cause ambiguous between FE and API
- **Recommended Next Step**: use `ask-user` only when code-first diagnosis is insufficient; use `proceed` when root cause and blast radius are both confirmed from code

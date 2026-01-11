---
name: writing-integration-test
description: Generates Playwright E2E test files for UI/integration testing that can be run repeatedly.
---

Use `docs/ai/testing/integration-{name}.md` as the source of truth.

## Workflow Alignment

- Provide brief status updates (1–3 sentences) before/after important actions.
- For medium/large tasks, create todos (≤14 words, verb-led). Keep only one `in_progress` item.
- Update todos immediately after progress; mark completed upon finish.

## Step 1: Gather Context (minimal)

- Ask for feature name if not provided (must be kebab-case).
- **Load planning doc:** Read `docs/ai/planning/feature-{name}.md` for user flows and acceptance criteria
- **Verify Playwright setup:** Check `@playwright/test` is installed
- **Load standards:** `docs/ai/project/PROJECT_STRUCTURE.md` and `CODE_CONVENTIONS.md`

## Step 2: Ask Testing Approach

Ask user which approach to use:
1. **Playwright MCP (Recommended)** - Interactive browser exploration to discover selectors
2. **@playwright/test package only** - Write tests directly without browser exploration

## Step 3: Scope (UI/Integration tests only)

**Focus on:**
- User journey flows
- Page navigation: routing, redirects, deep links
- Form interactions: input, validation, submission, error states
- UI state changes: loading states, error states, success feedback
- Visual verification: element visibility, text content

**DO NOT write:**
- Unit tests for pure functions
- API-only tests without UI interaction
- Performance/load testing

## Step 4: Explore UI with Playwright MCP (if user chose MCP)

**Pre-requisite:** Ensure local server is running

Use Playwright MCP tools:
- `browser_navigate` - Navigate to URL
- `browser_snapshot` - Get accessibility tree for selectors
- `browser_click` - Test clicking elements
- `browser_type` - Test typing into inputs
- `browser_screenshot` - Capture current state

## Step 5: Generate Playwright Test Files

**Test file location:** `tests/integration/`
**File naming:** `{feature-name}.e2e.spec.ts`

**Selector priority (most stable to least):**
1. `getByRole()` - accessibility roles
2. `getByLabel()` - form labels
3. `getByText()` - visible text content
4. `getByTestId()` - data-testid attributes
5. `getByPlaceholder()` - placeholder text
6. CSS selectors - last resort

**Generate tests for:**
- Happy path
- Validation errors
- Edge cases
- Navigation
- Loading states

## Step 6: Create Playwright Config (if missing)

Create `playwright.config.ts` with:
- Dynamic Base URL from environment
- Test directory: `./tests/integration`
- Browser projects (chromium)
- Web server configuration

## Step 7: Ask User for Next Action

After test files are created, ask user:
1. Run tests now (Recommended)
2. Skip to next command

## Step 8: Run Tests & Verify (if user requested)

Run commands:
- `npx playwright test`
- `npx playwright test --headed` (see browser)
- `npx playwright test --ui` (interactive)

## Step 9: Update Integration Testing Doc

Create/update `docs/ai/testing/integration-{name}.md`

## Notes

- **Playwright MCP is for exploration** - discover selectors and test interactions
- **Test files are the output** - actual `*.e2e.spec.ts` files
- Keep tests focused on user-visible behavior
- Use stable selectors (roles, labels) over fragile ones (CSS classes)
- Tests should be deterministic

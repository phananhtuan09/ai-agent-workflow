---
name: writing-integration-test
description: Generates Playwright E2E test files for UI/integration testing that can be run repeatedly.
---

Use `docs/ai/testing/integration-{name}.md` as the source of truth.

## Workflow Alignment

- Provide brief status updates (1–3 sentences) before/after important actions.
- For medium/large tasks, create todos (≤14 words, verb-led). Keep only one `in_progress` item.

## Step 1: Gather Context

- Ask for feature name if not provided (must be kebab-case)
- Load planning doc: `docs/ai/planning/feature-{name}.md` for user flows and acceptance criteria
- Verify Playwright setup: Check `@playwright/test` is installed
- Load standards: `PROJECT_STRUCTURE.md` and `CODE_CONVENTIONS.md`

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

## Step 4: Explore UI with Playwright MCP (if selected)

**Pre-requisite:** Ensure local server is running

Use Playwright MCP tools to:
- Navigate to URL
- Get accessibility tree for selectors
- Test clicking elements
- Test typing into inputs
- Capture screenshots

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

## Step 7: Run Tests (if user requested)

Run commands:
- `npx playwright test`
- `npx playwright test --headed` (see browser)
- `npx playwright test --ui` (interactive)

## Step 8: Update Integration Testing Doc

Create/update `docs/ai/testing/integration-{name}.md`

## Notes

- **Playwright MCP is for exploration** - discover selectors and test interactions
- **Test files are the output** - actual `*.e2e.spec.ts` files
- Keep tests focused on user-visible behavior
- Use stable selectors (roles, labels) over fragile ones (CSS classes)
- Tests should be deterministic

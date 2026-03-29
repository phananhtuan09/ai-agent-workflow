# Web Test Plan: AI Workflow Website Home

Note: All content in this document must be written in English.

## Input Sources

### Behavior Sources

- `docs/ai/requirements/req-ai-workflow-website.md` - Defines the homepage product expectations, CTA path, and language persistence requirement.
- `docs/ai/planning/feature-ai-workflow-website-home-showcase-polish.md` - Defines the showcase-polish slice for hero restructuring, motion polish, interactive install tabs, accessibility, and validation expansion.
- `website/components/client/home-page.tsx` - Implements the homepage hero, proof bar, install preview, highlight cards, and route cards under test.

### UI Sources

- `docs/ai/requirements/req-ai-workflow-website.md` - Documents the Obsidian Glow visual direction and home route wireframe.
- `website/components/client/site-chrome.tsx` - Defines the shared navigation, footer, and mobile menu shell visible on the homepage.
- `website/components/client/language-switcher.tsx` - Defines the EN/VI locale toggle behavior exercised by the homepage tests.

### Runtime Sources

- User runtime note: `http://localhost:3000/`
- User runtime note: `no auth`
- `website/playwright.config.ts` - Playwright runtime configuration for local execution.
- `website/tests/web/ai-workflow-website-home.spec.ts` - Homepage browser test suite.
- `website/public/favicon.ico` - Static favicon asset used to validate the console/network hardening requirement.

### Constraints

- Scope is limited to the public homepage at `/`.
- API strategy is `real`, but the page is static and makes no runtime API calls.
- Install-page behaviors beyond CTA landing are out of scope for this run.
- Performance profiling and deep accessibility auditing are not part of this run.

## Runtime Assumptions

- Engine: `playwright`
- Base URL: `http://localhost:3000`
- Web Server Command: `npm run dev`
- Auth Strategy: `none`
- Probe Status: `pass`

## Routes Under Test

- `/` - Primary homepage landing flow and no-auth public experience
- `/install` - Only as the destination asserted by the homepage primary CTA

## Test Files Created

- `website/tests/web/ai-workflow-website-home.spec.ts` - Browser workflow tests for the public homepage

## Scenario Map

### Happy Path

- ✓ User can land on `/` and see the focused hero, proof bar, install preview, and supporting homepage sections.
- ✓ User can follow the primary CTA from `/` to `/install`.
- ✓ User can switch install-preview tabs on `/` and see the command plus active state update for each tool.

### Validation and Error States

- ✓ Copy interaction provides success feedback on the homepage preview command.
- ✓ Reduced-motion mode renders the final homepage state without waiting on animations.
- ✓ `/favicon.ico` returns `200`, covering the prior console/network error.

### Navigation and UI States

- ✓ Locale selection persists across refresh on the homepage.
- ✓ Mobile viewport keeps the homepage hero usable and exposes the navigation trigger.
- ✓ Tablet viewport keeps the homepage sections visible without horizontal overflow.

### Out of Scope

- Install page tool switching and copy behavior
- Workflow, skills, and skill detail routes
- Keyboard-only navigation audit across the full site shell and performance profiling

## Selector Strategy

- Primary selectors: Playwright `getByRole()` queries grounded by runtime probe
- Fallback selectors: none used in the generated suite
- Last-resort selectors: none used
- Selector confidence: `high` because the live runtime probe confirmed the selectors used by the suite

## Run Command

```bash
cd website && npx playwright test tests/web/ai-workflow-website-home.spec.ts
```

## Last Run Results

- Timestamp: `2026-03-29T15:27:48+07:00`
- Total: `9`
- Passed: `9`
- Failed: `0`
- Duration: `38.0s`
- Verification Verdict: `pass`

## Artifacts

- Trace: `none`
- Screenshot: `website/test-results/ai-workflow-website-home-A-ab1d1--hero-and-key-home-sections/home-desktop.png`, `website/test-results/ai-workflow-website-home-A-a8642-adable-on-a-mobile-viewport/home-mobile.png`, `website/test-results/ai-workflow-website-home-A-91619-without-horizontal-overflow/home-tablet.png`
- Video: `none`
- HTML Report: `website/playwright-report/index.html`
- Console or Network Log: `none`

## Issues Found

- No product regressions were found in the tested homepage scope after showcase polish shipped.
- Remaining evidence gaps are cross-browser checks (Safari and Firefox), keyboard-only navigation polish beyond smoke coverage, real-device performance profiling, and mid-range-device rendering checks.

## Resume Notes

- Re-run with `cd website && npx playwright test tests/web/ai-workflow-website-home.spec.ts`.
- Use the refreshed suite to validate future homepage polish without reintroducing tab, reduced-motion, overflow, or favicon regressions.

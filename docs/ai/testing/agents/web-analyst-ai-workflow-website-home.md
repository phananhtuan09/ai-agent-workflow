# Web Analyst Artifact: AI Workflow Website Home

Note: All content in this document must be written in English.

## Normalized Inputs

### Behavior Sources

- `docs/ai/requirements/req-ai-workflow-website.md` - Defines FR-01, FR-13, and the public landing-page expectations.
- `docs/ai/planning/feature-ai-workflow-website-home-install-polish.md` - Narrows the current slice to homepage clarity, CTA hierarchy, and translated labels.
- `website/components/client/home-page.tsx` - Source of truth for rendered homepage sections and interactions.

### UI Sources

- `docs/ai/requirements/req-ai-workflow-website.md` - Documents the Obsidian Glow theme, home wireframe, and landing-page user story.
- `website/components/client/site-chrome.tsx` - Provides sticky navigation, language switcher placement, and mobile menu behavior.
- `website/components/client/language-switcher.tsx` - Defines the EN/VI toggle that affects homepage copy.

### Runtime Sources

- User note: `http://localhost:3000/`
- User note: `no auth`
- `website/package.json` - Website runtime scripts and Next.js app entry.
- `website/playwright.config.ts` - Local Playwright execution config for homepage browser coverage.

### Constraints

- Scope is limited to the public homepage at `/`.
- No authenticated flows are in scope.
- No backend/API mocking is required because the page is static.
- Review should use runtime evidence plus source code after screenshot capture.

## Behavior Coverage Strength

- Strong for homepage rendering, CTA navigation, copy feedback, and locale persistence.
- Medium for responsive behavior because runtime evidence is limited to one mobile viewport.

## Routing Signals

- UI Mapping Needed: no
- Runtime Probe Feasible: yes
- Recommended Engine: playwright
- Recommended Test Scope:
  1. Hero headline, CTA, and install preview render clearly on `/`.
  2. Primary CTA navigates to `/install`.
  3. Copy action on the homepage preview shows success feedback.
  4. EN/VI selection persists across refresh.
  5. Mobile viewport keeps the hero readable and exposes the menu trigger.

## Notes

- The homepage contains duplicate link labels in the nav and route cards, so browser tests should prefer semantic selectors scoped by role and route outcome rather than positional assumptions.

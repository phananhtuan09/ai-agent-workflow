# Web QC Artifact: AI Workflow Website Home

Note: All content in this document must be written in English.

## Source-Grounded Test Cases

1. `home-renders-key-content`
   - Entry: `/`
   - Assertions:
     - H1 renders with the final homepage headline.
     - Primary CTA to install is visible above the fold.
     - Secondary CTA, tool chips, and install preview copy button render.
     - The major supporting sections below the hero are present.

2. `home-primary-cta-routes-to-install`
   - Entry: `/`
   - Action:
     - Click the primary CTA.
   - Assertions:
     - Browser navigates to `/install`.
     - Install page heading is visible.

3. `home-copy-feedback-works`
   - Entry: `/`
   - Action:
     - Click the homepage command copy button.
   - Assertions:
     - Button shows copied feedback.
     - Clipboard receives the Codex install command shown in the preview panel.

4. `home-language-persists-across-reload`
   - Entry: `/`
   - Action:
     - Switch locale from EN to VI.
     - Reload the page.
   - Assertions:
     - Vietnamese homepage heading is visible before reload.
     - Vietnamese homepage heading remains visible after reload.

5. `home-mobile-hero-remains-usable`
   - Entry: `/` on a mobile viewport
   - Assertions:
     - Mobile navigation menu trigger is visible.
     - Hero heading remains readable.
     - Primary CTA remains visible without desktop-only affordances.

## Exclusions

- Install page selector switching and copy behavior are excluded from this homepage run.
- Workflow, skills, and skill detail routes are excluded.
- Deep accessibility audits, reduced-motion verification, and performance profiling are excluded from this scope.

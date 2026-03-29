# Web Runtime Probe Artifact: AI Workflow Website Home

Note: All content in this document must be written in English.

## Reachability Report

- Base URL: `http://localhost:3000`
- Route `/`: reachable (`200 OK`)
- Auth: none
- Runtime status: pass

## Confirmed Selector Map

- Hero heading: `getByRole("heading", { level: 1 })`
- Primary CTA: `getByRole("link", { name: /install the workflow/i })`
- Secondary CTA: `getByRole("link", { name: /preview the workflow/i })`
- Copy button: `getByRole("button", { name: /copy command/i })`
- Locale toggle to Vietnamese: `getByRole("button", { name: "VI" })`
- Mobile menu trigger: `getByRole("button", { name: /open navigation menu/i })`

## Observed Runtime Notes

- The homepage loads with the expected English headline: `From rough prompt to reviewable AI execution.`
- Switching to Vietnamese updates the hero copy.
- Locale persistence succeeds across reload when the test waits for the post-click Vietnamese render before reloading.
- Mobile viewport renders the hero and exposes the hamburger trigger.
- Desktop and mobile screenshots were captured during probe.

## Artifacts

- Desktop screenshot: `website/test-results/home-probe/home-desktop.png`
- Mobile screenshot: `website/test-results/home-probe/home-mobile.png`

## Selector Confidence

- Confidence: high
- Reason: all primary selectors above were observed against the live DOM via runtime probe.

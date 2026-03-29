# Plan: AI Workflow Website Home Showcase Polish

Note: All content in this document must be written in English.

---

epic_plan: docs/ai/planning/epic-ai-workflow-website.md
requirement: docs/ai/requirements/req-ai-workflow-website.md

---

## 0. Related Documents

| Type        | Document                                                                 |
| ----------- | ------------------------------------------------------------------------ |
| Requirement | [req-ai-workflow-website.md](../requirements/req-ai-workflow-website.md) |
| Epic        | [epic-ai-workflow-website.md](epic-ai-workflow-website.md)               |

---

## 1. Codebase Context

### Current State (from live review at `/`)

Review score before this plan: **70.2 / 100** — "Good, But Not Exceptional"

Key score gaps driving the plan:

- Motion Design: 2/5 (weight 12) — no scroll animations, no entrance sequences, only basic hover translate
- Interaction Design: 3/5 (weight 8) — install preview tool tabs are non-interactive spans despite "Interactive install preview" label
- Layout & Composition: 3/5 (weight 8) — sections 2 and 3 share identical left-label + right-3-col pattern
- Hero Impact: 4/5 (weight 8) — hero is too information-dense; no dedicated visual anchor
- Storytelling / Flow: 3/5 (weight 6) — no visual rhythm difference between sections
- Bugs: favicon.ico 404, no confirmed `prefers-reduced-motion` support

Target after this plan: **90+ / 100**

### Similar Features

- `website/components/client/home-page.tsx` — Current homepage composition. Has zero Framer Motion usage; hover effects are Tailwind-only (`hover:-translate-y-1`).
- `website/components/client/workflow-preview.tsx` — Reference implementation for Framer Motion + `useReducedMotion()` pattern. Use this as the motion template.
- `website/components/client/install-page.tsx` — Contains the interactive tool-selector tab pattern (useState-driven tool switching + live command update) that the homepage install preview should replicate.

### Reusable Components/Utils

- `website/components/client/copy-button.tsx` — Keep intact inside the homepage install preview.
- `website/app/globals.css` — Already has `.hero-blur` + `drift` keyframe animation and `.glass-panel` utility. Extend here for scroll-reveal and counter animation utilities.
- `framer-motion` — Already installed (see `workflow-preview.tsx`). Use `motion`, `useInView`, `useReducedMotion`, `useMotionValue`, `useSpring`, `animate`.

### Key Files to Reference

- `website/lib/i18n/en.json` and `website/lib/i18n/vi.json` — All new labels must go here under `home.*`.
- `website/tests/web/ai-workflow-website-home.spec.ts` — Existing coverage to preserve.
- `docs/ai/testing/web-ai-workflow-website-home.md` — Test doc to update after implementation.
- `website/public/` — Add `favicon.ico` here to fix the 404.

---

## 3. Goal & Acceptance Criteria

### Goal

Lift the homepage from 70 → 90+ score by: (1) redesigning the hero into a focused intro with a strong animated visual anchor, (2) adding Framer Motion scroll-triggered entrance animations and animated counters throughout, (3) making the install preview tool tabs interactive, (4) differentiating section layouts and hover states, and (5) hardening motion comfort, keyboard access, and responsive confidence.

### Acceptance Criteria

- Given a user lands on `/`, when the first screen renders, then the hero shows only the headline, description, CTAs, and an animated visual anchor — metrics, flow pipeline, and install preview are in their own separate sections below the fold.
- Given a user scrolls through `/`, when each section enters the viewport, then cards and headings animate in with a staggered entrance (fade + slide up) unless `prefers-reduced-motion` is active.
- Given a user views the install preview section, when they click a tool tab (Claude Code / Codex / Google Antigravity), then the active tab highlights, the command updates to show the correct `--tool` flag, and the short label badge updates accordingly.
- Given a user views the metrics section, when it enters the viewport, then the numeric values (3, 16, 2) animate from 0 to their target value unless `prefers-reduced-motion` is active.
- Given a user with `prefers-reduced-motion: reduce` visits `/`, when any animated element would play, then all non-essential motion is disabled and layout integrity is preserved.
- Given a user navigates with keyboard, when they Tab through the homepage, then all interactive elements show a visible focus-visible ring.
- Given the page loads, then no console errors are present (favicon.ico 404 is resolved).
- Given homepage validation runs after polish, when the test suite executes, then all existing CTA, copy, locale, and mobile smoke tests still pass.

---

## 4. Risks & Assumptions

### Risks

- Framer Motion `useInView` can cause hydration mismatches if not guarded with `"use client"` — all animated components must be client components.
- Animated counters on metrics depend on `useInView` firing correctly — a scroll threshold that is too high may skip the animation on short viewports.
- Separating the hero from the install preview may weaken the "above-the-fold product signal" — the animated visual anchor must compensate by showing the workflow concept immediately.
- Long Vietnamese labels in the interactive tool tabs must not overflow the pill containers.

### Assumptions

- The Obsidian Glow palette, typography stack, and glass-panel styling remain the visual foundation.
- The animated visual anchor in the hero will be an SVG-based animated node map (using Framer Motion path/layout animations), not a video or raster image, to keep the page lean.
- Install-page interactive tool-switching logic is the reference for the homepage preview tab pattern.
- No new backend data, media pipeline, or third-party service is required.

---

## 5. Definition of Done

- [x] `cd website && npm run lint`
- [x] `cd website && npm run typecheck`
- [x] `cd website && npx playwright test tests/web/ai-workflow-website-home.spec.ts`
- [x] No console errors on `/` (favicon 404 resolved)
- [x] Homepage planning and testing docs reflect expanded coverage

---

## 6. Implementation Plan

### Summary

Four phases: (1) restructure the hero and add an animated visual anchor; (2) add Framer Motion scroll animations, animated counters, and interactive install tabs; (3) enhance hover states, section differentiation, and accessibility hardening; (4) extend test coverage and update docs.

---

### Phase 1: Hero Restructure And Animated Visual Anchor

The current hero packs headline + CTAs + metrics + workflow pipeline + install preview into one section. Split it into three dedicated sections: a focused hero intro, a proof/metrics bar, and an install preview block.

- [x] [NEW] website/components/client/animated-workflow-nodes.tsx — Create a new client component that renders a simplified animated node graph (Requirement → Epic → Plan → Execute) as the hero's right-column visual anchor.

  ```tsx
  "use client"
  Component: AnimatedWorkflowNodes()

  Purpose:
    - Renders 4 workflow step nodes connected by animated lines/arrows.
    - Nodes appear sequentially on mount using Framer Motion staggerChildren.
    - Each node pulses subtly on a loop to signal "alive".
    - Connecting arrows draw in after their source node appears.
    - Respects useReducedMotion(): if true, show all nodes immediately, no pulse loops.

  Visual spec:
    - Nodes: rounded-[16px] glass-panel-like cards, each ~160x80px on desktop.
    - Node labels: section-kicker font, matching existing typography.
    - Node text: "Requirement intake", "Epic routing", "Plan review", "Execute".
    - Active node (last one): accent-cyan border glow.
    - Connector arrows: SVG <path> with strokeDasharray/strokeDashoffset animation.
    - Layout: vertical stack on mobile, 2x2 grid on tablet, single column on xl.

  Motion spec:
    - Mount: stagger 0.15s, each node fades in + slides up 12px.
    - Connector: draws in 0.4s after source node completes.
    - Idle pulse: scale 1 → 1.02 → 1, 3s loop, ease in-out.
    - reducedMotion: skip all, render final state immediately.

  Dependencies: framer-motion (motion, useReducedMotion, useAnimate)
  ```

- [x] [MODIFIED] website/components/client/home-page.tsx — Restructure the JSX into four clearly separated sections. Import AnimatedWorkflowNodes.

  ```tsx
  "use client"
  Function: HomePage()

  New section structure (replace current monolithic first section):

  Section 1 — Hero (above fold):
    - Left column: badge → h1 (gradient, large) → description → CTA row → support pills
    - Right column: <AnimatedWorkflowNodes /> (replaces the current aside install panel)
    - Remove from hero: metrics row, flow pipeline steps, install preview card
    - Keep hero blur orbs (absolute positioned)

  Section 2 — Proof Bar (new, full-width):
    - Animated counter metrics (3 AI tools / 16 skills / 2 graphs) — see Phase 2
    - Flow pipeline steps (Requirement intake → Epic routing → Plan review → Execute)
    - Single horizontal band, visually lighter than the hero card

  Section 3 — Install Preview (extracted from hero, now standalone):
    - Interactive tool tabs: Claude Code / Codex / Google Antigravity (useState-driven)
    - Live command display that updates on tab click
    - CopyButton + "Open full install flow" link
    - Project structure targets preview
    - See Phase 2 for interactive tab implementation

  Section 4 — Highlights (existing, layout preserved, hover enhanced):
    - Keep left-label + right-3-col grid
    - Enhanced hover: see Phase 3

  Section 5 — Routes (existing, layout differentiated):
    - Change to full-width 3-col WITHOUT the left-label column
    - Cards become larger and more prominent since no left text competes
    - See Phase 3 for enhanced hover

  Footer bridge: keep as-is

  Edge cases:
    - Vietnamese labels on the proof bar steps must not overflow flex containers.
    - Hero must still read clearly when AnimatedWorkflowNodes is loading (no layout shift).

  Dependencies: AnimatedWorkflowNodes, CopyButton, tools, workflowGraphs, skills, useLocale
  ```

- [x] [MODIFIED] website/lib/i18n/en.json and website/lib/i18n/vi.json — Add new i18n keys for proof bar section and install preview section labels.

  ```json
  New keys under home.*:
    - "home.proofBarEyebrow" — e.g. "By the numbers"
    - "home.installSectionEyebrow" — e.g. "One command install"
    - "home.installSectionTitle" — e.g. "Pick your tool. Copy the command. Done."
    - "home.installSectionBody" — concise supporting line
    - "home.nodeMapAlt" — accessible label for the animated node map region (aria-label)

  Edge cases:
    - EN and VI must have all the same keys — a missing key in either file is a blocker.
  ```

---

### Phase 2: Framer Motion — Scroll Animations, Counters, Interactive Tabs

This phase is the highest-impact change. Motion Design goes from 2/5 → 4-5/5 (weight 12). All animations must use `useReducedMotion()` from workflow-preview.tsx as the pattern.

- [x] [NEW] website/components/client/animated-counter.tsx — Animated numeric counter that counts from 0 to a target value when the element enters the viewport.

  ```tsx
  "use client"
  Component: AnimatedCounter({ value: number, duration?: number })

  Logic:
    1. Use useInView(ref, { once: true, margin: "-20%" }) to detect viewport entry.
    2. Use useMotionValue(0) + useSpring(motionValue, { stiffness: 80, damping: 20 }).
    3. On inView, call animate(motionValue, value, { duration: duration ?? 1.2 }).
    4. Display rounded integer from the spring value.
    5. If useReducedMotion() is true: display value directly, skip animation.

  Return: <span ref={ref}>{displayValue}</span>

  Dependencies: framer-motion (useInView, useMotionValue, useSpring, animate, useReducedMotion)
  ```

- [x] [NEW] website/components/client/scroll-reveal.tsx — Generic wrapper that animates its children in when they enter the viewport. Used across all homepage sections.

  ```tsx
  "use client"
  Component: ScrollReveal({
    children,
    delay?: number,        // stagger offset for cards, default 0
    className?: string,
    direction?: "up" | "none"  // default "up"
  })

  Logic:
    1. useInView(ref, { once: true, margin: "-10%" })
    2. useReducedMotion() — if true, render children directly with no motion wrapper.
    3. motion.div: initial { opacity: 0, y: direction === "up" ? 16 : 0 }
    4. animate to { opacity: 1, y: 0 } when inView.
    5. transition: { duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }

  Return: motion.div wrapping children

  Dependencies: framer-motion (motion, useInView, useReducedMotion)
  ```

- [x] [MODIFIED] website/components/client/home-page.tsx — Wrap section headings and cards in ScrollReveal, use AnimatedCounter in the proof bar, wire up interactive install tool tabs.

  **ScrollReveal usage:**

  ```tsx
  Wrap rules:
    - Section 2 proof bar: wrap entire section in ScrollReveal direction="up"
    - Section 3 install preview: wrap card in ScrollReveal delay=0.1
    - Section 4 highlights: wrap each article in ScrollReveal with delay=index*0.1
    - Section 5 route cards: wrap each Link card in ScrollReveal with delay=index*0.12
    - Section headings (h2): wrap in ScrollReveal direction="up" delay=0
  ```

  **AnimatedCounter usage:**

  ```tsx
  Replace static metric values in proof bar with:
    <AnimatedCounter value={tools.length} />
    <AnimatedCounter value={skills.length} />
    <AnimatedCounter value={workflowGraphs.length} />
  ```

  **Interactive install tool tabs:**

  ```tsx
  Add state:
    const [activeTool, setActiveTool] = useState(tools[1] ?? tools[0])

  Replace static tool spans with buttons:
    tools.map(tool => (
      <button
        key={tool.id}
        onClick={() => setActiveTool(tool)}
        aria-pressed={tool.id === activeTool.id}
        className={tool.id === activeTool.id ? activeTabClass : inactiveTabClass}
      >
        {tool.label}
      </button>
    ))

  Replace hardcoded featuredTool with activeTool throughout the install preview block.

  Tab active class: "bg-cyan-300/12 rounded-full border border-cyan-300/30 px-4 py-2 text-sm font-semibold text-cyan-100 cursor-pointer transition"
  Tab inactive class: "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400 cursor-pointer transition hover:border-white/20 hover:bg-white/8 hover:text-slate-200"
  ```

---

### Phase 3: Hover Polish, Section Differentiation, Accessibility, Bugs

- [x] [MODIFIED] website/app/globals.css — Add card glow hover utility, scroll-reveal base, and `prefers-reduced-motion` resets.

  ```css
  Additions:
  
  /* Card hover glow — used on highlight and route cards */
  .card-hover-glow {
    transition:
      box-shadow 0.25s ease,
      border-color 0.25s ease,
      transform 0.25s ease;
  }
  .card-hover-glow:hover {
    box-shadow:
      0 0 0 1px rgba(103, 232, 249, 0.2),
      0 8px 32px rgba(103, 232, 249, 0.08);
    border-color: rgba(103, 232, 249, 0.2);
    transform: translateY(-3px);
  }

  /* Focus-visible ring — consistent across all interactive elements */
  .focus-ring {
    @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian-900;
  }

  /* Reduced-motion resets */
  @media (prefers-reduced-motion: reduce) {
    .hero-blur {
      animation: none;
    }
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```

- [x] [MODIFIED] website/components/client/home-page.tsx — Apply card-hover-glow and focus-ring to interactive elements, differentiate route cards layout.

  ```tsx
  Highlight cards (Section 4):
    - Add className="card-hover-glow" alongside existing glass-panel classes.
    - Add a subtle left-border accent on hover: use group + group-hover:border-l-cyan-400/40 trick or CSS custom property.
    - Number badge (01/02/03): animate opacity 0.4 → 1 on card hover using group-hover class.

  Route cards (Section 5):
    - Remove the left-label column entirely — make it a standalone 3-column full-width section.
    - Cards become taller and more prominent (min-h-[240px]).
    - Add card-hover-glow class.
    - Arrow (→) already has group-hover:translate-x-1 — keep it, increase intensity to translate-x-2.
    - Add a cyan gradient sweep on hover: absolute inset-0 bg-gradient-to-br from-cyan-400/0 to-cyan-400/5 opacity-0 group-hover:opacity-100 transition.

  All buttons and links (CTAs, tool tabs, Copy button, route cards):
    - Add focus-ring utility class.

  Edge cases:
    - card-hover-glow must not create horizontal scroll on mobile (overflow-hidden on parent).
    - Route card gradient sweep must stay inside rounded-[32px] border (use overflow-hidden on card).
  ```

- [x] [NEW] website/public/favicon.ico — Add a favicon to eliminate the 404 console error. Use a simple terminal-symbol (`>`) or workflow icon rendered as a 32x32 ICO/PNG.

  ```
  Simplest approach: copy an existing icon or create a 32x32 dark background + cyan ">" symbol.
  Accept any .ico or .png at /public/favicon.ico that resolves without 404.
  ```

- [x] [MODIFIED] website/components/client/site-chrome.tsx — Audit and add focus-ring class to all nav links, language toggle buttons, and mobile menu controls.

  ```tsx
  Scope:
    - Nav links (Home, Install, Workflow, Skills): add focus-ring
    - EN/VI language buttons: add focus-ring
    - GitHub link: add focus-ring
    - Mobile menu button (if present): add focus-ring

  Verify:
    - Tab order is logical: logo → nav links → language → GitHub
    - No `outline: none` without a visible focus-visible alternative
  ```

---

### Phase 4: Validation Evidence Expansion

- [x] [MODIFIED] website/tests/web/ai-workflow-website-home.spec.ts — Extend suite to cover interactive tool tabs, tablet layout, and reduced-motion smoke.

  ```ts
  New test cases to add (keep all existing tests):

  1. "install preview tool tabs are interactive"
     - Click each tab (Claude Code, Codex, Google Antigravity)
     - Assert the command text updates to contain the expected --tool flag
     - Assert the active tab has aria-pressed="true"

  2. "tablet viewport: hero and sections render without overflow"
     - Set viewport to 768x1024
     - Assert hero h1 is visible and not clipped
     - Assert install preview section is visible
     - Assert no horizontal scrollbar (document.body.scrollWidth <= viewportWidth)

  3. "reduced-motion: page renders complete without animations"
     - Use page.emulateMedia({ reducedMotion: "reduce" })
     - Assert all section headings and cards are visible
     - Assert metrics values show final numbers (not zero)

  4. "favicon loads without 404"
     - Intercept requests to /favicon.ico
     - Assert response status is 200

  Edge cases:
    - Tool tab assertions must use role-based selectors (button with name matching tool label)
    - Avoid brittle timing assertions on animation durations
  ```

- [x] [MODIFIED] docs/ai/testing/web-ai-workflow-website-home.md — Refresh the test-plan artifact with new scenario coverage, evidence, and remaining gaps.
  ```md
  Update:

  - Add scenarios: interactive tool tabs, tablet viewport, reduced-motion smoke, favicon check
  - Record new run results and artifact paths
  - Note remaining evidence gaps: real-device profiling, cross-browser (Safari/Firefox), mid-range device performance
  ```

---

## 7. Score Projection After This Plan

| Category                  | Before    | Target     | Key Change                                                                   |
| ------------------------- | --------- | ---------- | ---------------------------------------------------------------------------- |
| Motion Design (×12)       | 2/5 → 4.8 | 5/5 → 12.0 | ScrollReveal on all sections, AnimatedWorkflowNodes, counters, hero entrance |
| Hero Impact (×8)          | 4/5 → 6.4 | 5/5 → 8.0  | Focused clean hero + animated node map visual anchor                         |
| Interaction Design (×8)   | 3/5 → 4.8 | 5/5 → 8.0  | Interactive tool tabs, card-hover-glow, focus rings                          |
| Storytelling / Flow (×6)  | 3/5 → 3.6 | 4/5 → 4.8  | Separated sections, visual pacing variety                                    |
| Layout & Composition (×8) | 3/5 → 4.8 | 4/5 → 6.4  | Route section breaks the repeated pattern                                    |
| Brand Expression (×7)     | 3/5 → 4.2 | 4/5 → 5.6  | Animated node map strengthens product identity                               |
| Accessibility (×5)        | 3/5 → 3.0 | 4/5 → 4.0  | prefers-reduced-motion, focus-ring system                                    |
| Final Polish (×3)         | 3/5 → 1.8 | 4/5 → 2.4  | Favicon fixed, interactive label matches behavior                            |
| QA Readiness (×5)         | 3/5 → 3.0 | 4/5 → 4.0  | Extended Playwright coverage                                                 |
| **Projected Total**       | **70.2**  | **~90.0**  |                                                                              |

## 8. Follow-ups

- [ ] Run Lighthouse profiling after the animations ship to validate that LCP and CLS stay within acceptable bounds on a throttled 4G profile.
- [ ] Consider adding a `<video>` loop of a real AI run (terminal recording) to the hero for an even stronger visual anchor once the animated node map ships — this would push Motion and Visual Assets scores further.

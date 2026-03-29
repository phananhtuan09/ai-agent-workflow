# Plan: AI Workflow Website Foundation And Mockups

Note: All content in this document must be written in English.

---
epic_plan: docs/ai/planning/epic-ai-workflow-website.md
requirement: docs/ai/requirements/req-ai-workflow-website.md
---

## 0. Related Documents

| Type | Document |
|------|----------|
| Requirement | [req-ai-workflow-website.md](../requirements/req-ai-workflow-website.md) |
| Epic | [epic-ai-workflow-website.md](epic-ai-workflow-website.md) |

---

## 1. Codebase Context

### Architectural Patterns
- Monorepo root package currently ships a CLI tool only; the website must live as an isolated `website/` app to avoid contaminating the installer entrypoint.
- Existing repository standards expect planning docs under `docs/ai/planning/` and execution artifacts to stay aligned with epic status.

### Key Files to Reference
- `package.json` - current repo package definition; the website app should not break existing root scripts.
- `docs/ai/requirements/req-ai-workflow-website.md` - source of truth for scope, FR mapping, and out-of-scope boundaries.
- `docs/ai/requirements/agents/sa-ai-workflow-website.md` - recommended technical architecture and static content pipeline.
- `docs/ai/requirements/agents/uiux-ai-workflow-website.md` - visual direction, component behaviors, and responsive notes.

---

## 2b. Theme Specification

### Selected Theme
- **Name**: Obsidian Glow
- **Source**: Requirement + UI/UX design notes
- **Personality**: dark, premium, terminal-native, motion-led, glassy without feeling soft

### Color Palette

**Primary**:
- 500: `#7c3aed`
- 600: `#6d28d9`

**Secondary**:
- 500: `#2563eb`
- 600: `#1d4ed8`

**Accent**:
- 500: `#06b6d4`
- 600: `#0891b2`

**Neutral**:
- 50: `#f8fafc`
- 200: `#cbd5e1`
- 400: `#94a3b8`
- 700: `#334155`
- 900: `#09090b`

**Semantic**:
- Success: `#4ade80`
- Warning: `#f59e0b`
- Error: `#f43f5e`
- Info: `#38bdf8`

### Typography

**Font Families**:
- Heading: `Outfit`, sans-serif
- Body: `Inter`, sans-serif
- Mono: `JetBrains Mono`, monospace

### Spacing Scale

**Scale**: 4, 8, 12, 16, 24, 32, 48, 64 px

### Visual Style

**Border Radius**:
- sm: 10px
- md: 18px
- lg: 24px
- full: 9999px

**Usage Notes**:
- Keep the dark atmospheric background and terminal motifs from the requirement.
- Build mobile-first and only expand layout density from `md` and `lg` breakpoints upward.

---

## 3. Goal & Acceptance Criteria

### Goal
- Deliver a working `website/` application scaffold with TypeScript, ESLint, Prettier, Tailwind CSS, bilingual UI infrastructure, copied skill content, and responsive mock versions of the planned routes so future slices can focus on page-specific polish instead of setup.

### Acceptance Criteria (Given/When/Then)
- Given a fresh checkout of the repository, when a developer runs the website install command, then the `website/` workspace installs and exposes `dev`, `build`, `lint`, `typecheck`, and Prettier scripts.
- Given a developer opens the website on mobile, tablet, or desktop, when they navigate between `/`, `/install`, `/workflow`, `/skills`, and `/skills/[id]`, then each route renders a responsive mockup aligned with the dark Obsidian Glow theme.
- Given a developer toggles between English and Vietnamese, when the UI rerenders, then all shared navigation labels, section headings, and page chrome switch languages while markdown content may remain English-only.
- Given a production build runs, when prebuild executes, then skill markdown is copied from `.agents/skills/` into `website/content/skills/` without runtime network calls.

## 4. Risks & Assumptions

### Risks
- Next.js, Tailwind, and MDX packages must be pinned coherently or the initial build will fail before page work begins.
- Persisting language in `localStorage` means first render will default to English until the client hydrates.
- Skill metadata may not fully match the copied markdown set yet; the initial catalog must prefer stability over exhaustively curated content.

### Assumptions
- The exact tool IDs are `claude`, `codex`, and `antigravity`, matching the current installer CLI flags in the repository README.
- Two mock workflow graphs are sufficient for the first slice even though the requirement leaves final graph count open.
- The first iteration may prioritize route-level mockups and basic interactions over production-ready polish for every acceptance criterion.

## 5. Definition of Done
- [x] Build passes (linter, type checks, compile)
- [ ] Tests added and passing
- [ ] Code reviewed and approved
- [x] Documentation updated

---

## 6. Implementation Plan

### Summary
Create a self-contained Next.js 14 app in `website/`, wire the static content pipeline, establish theme and i18n primitives, and use shared data/config modules to render all planned routes as responsive mockups. Keep the architecture future-safe for later slices by separating static data, server-side content loading, and client-only interactions from the start.

### Phase 1: Workspace Foundation

- [x] [ADDED] website/package.json — Create the standalone Next.js workspace with runtime and development dependencies plus scripts for build, lint, typecheck, and formatting.
  ```text
  Function: npm scripts for dev/build/start/lint/typecheck/prettier

  Input validation:
    - dependency versions must be compatible with Next.js 14 + React 18
    - scripts must not depend on root workspace tooling

  Logic flow:
    1. Define a standalone package for the website app.
    2. Add a prebuild hook that copies skill markdown before `next build`.
    3. Expose scripts for local development and CI-style validation.

  Return: Installable package metadata for the website app

  Edge cases:
    - Missing root workspace tooling -> website remains independently runnable
    - Future Vercel deployment -> `npm run build` still triggers prebuild

  Dependencies: Next.js, React, Tailwind CSS, Framer Motion, next-mdx-remote
  ```

- [x] [ADDED] website/tsconfig.json, website/next.config.mjs, website/postcss.config.js, website/tailwind.config.ts, website/.eslintrc.json, website/.prettierrc.json — Add baseline TypeScript, Next.js, Tailwind, ESLint, and Prettier configuration.
  ```text
  Function: project configuration files

  Input validation:
    - config paths must resolve inside `website/`
    - Tailwind content globs must cover app, components, and lib folders

  Logic flow:
    1. Configure TypeScript for App Router.
    2. Configure Tailwind tokens from the requirement theme.
    3. Configure ESLint and Prettier with low-friction defaults for TS/React.

  Return: Runnable toolchain configuration

  Edge cases:
    - Missing content glob -> generated classes stripped in build
    - Misaligned TS module resolution -> path aliases fail

  Dependencies: website/package.json
  ```

- [x] [ADDED] website/scripts/copy-skills.mjs and website/content/skills/.gitkeep — Copy skill markdown from `.agents/skills/*/SKILL.md` into the website app before build.
  ```text
  Function: copySkills(): Promise<void>

  Input validation:
    - source folder entries must exist and be directories
    - only folders containing `SKILL.md` are copied

  Logic flow:
    1. Create `website/content/skills/` if missing.
    2. Iterate `.agents/skills/` folders.
    3. Copy each discovered `SKILL.md` to `{id}.md` inside the website content folder.
    4. Log skipped entries for visibility.

  Return: copied markdown files on disk

  Edge cases:
    - missing `SKILL.md` -> skip and warn
    - empty source directory -> keep target folder but do not fail hard

  Dependencies: Node.js fs/promises and path
  ```

### Phase 2: Shared App Primitives

- [x] [ADDED] website/lib/i18n/*, website/data/*.ts, website/lib/skills.ts, and website/types/*.ts — Create bilingual message dictionaries, shared tool/skill/workflow config, and the build-time skill loader.
  ```text
  Function: getSkills(), getSkillById(id), messages[locale]

  Input validation:
    - locale keys limited to `en` and `vi`
    - tool IDs matched against the closed enum list
    - unknown skill IDs return `null`

  Logic flow:
    1. Store UI strings in two locale files.
    2. Define static tool, workflow, and skill metadata in TypeScript.
    3. Load copied markdown content from `website/content/skills/` for detail pages.

  Return: serializable config and build-time file readers

  Edge cases:
    - invalid locale in storage -> fallback to `en`
    - missing markdown file -> return null and let route 404

  Dependencies: Phase 1 workspace foundation
  ```

- [x] [ADDED] website/app/layout.tsx, website/app/globals.css, website/components/server/*, website/components/client/* — Create the shared site shell, mobile nav, language toggle, page container, and reusable display primitives.
  ```text
  Function: RootLayout(), LocaleProvider(), Header(), Footer()

  Input validation:
    - nav links map only to declared routes
    - locale persistence uses guarded `localStorage` access

  Logic flow:
    1. Load fonts and theme variables globally.
    2. Wrap the app in a client locale provider.
    3. Render a responsive header/footer shell shared by every page.
    4. Keep client-only interactivity isolated inside `components/client/`.

  Return: reusable layout foundation for all pages

  Edge cases:
    - storage unavailable -> fallback locale without crashing
    - narrow viewport -> nav collapses into a mobile drawer

  Dependencies: Tailwind tokens, locale dictionaries
  ```

### Phase 3: Route Mockups

- [x] [ADDED] website/app/page.tsx, website/app/install/page.tsx, website/app/workflow/page.tsx, website/app/skills/page.tsx, website/app/skills/[id]/page.tsx, website/app/not-found.tsx — Add route-level mock pages that exercise the shared config and responsive shell.
  ```text
  Function: route components for `/`, `/install`, `/workflow`, `/skills`, `/skills/[id]`

  Input validation:
    - dynamic skill route must only accept IDs from the static skill config
    - mock command selection uses known tool IDs only

  Logic flow:
    1. Render the home hero, install selector, workflow preview, skills grid, and skill detail mockups.
    2. Keep basic interactive states working with local mock data.
    3. Ensure every route has tablet and mobile-safe layout rules.

  Return: navigable multi-page website scaffold

  Edge cases:
    - unknown skill ID -> `notFound()`
    - empty filtered skill result -> render a dedicated empty state

  Dependencies: shared app primitives, static data, skill content loader
  ```

- [x] [MODIFIED] docs/ai/planning/epic-ai-workflow-website.md and docs/ai/requirements/req-ai-workflow-website.md — Sync the epic status and add safe cross-links back to the requirement after implementation starts.
  ```text
  Function: documentation sync

  Input validation:
    - only link docs that exist on disk

  Logic flow:
    1. Mark the current feature plan as `in_progress` once scaffold work lands.
    2. Add or refresh the requirement `Related Plans` section.

  Return: aligned planning metadata

  Edge cases:
    - user has local uncommitted docs -> preserve existing content and append safely

  Dependencies: finished implementation changes
  ```

## 7. Follow-ups
- [ ] Replace mocked copy and metrics with final product messaging after content review.
- [ ] Tighten skill metadata curation so the static config and copied markdown stay aligned.
- [ ] Add route-level metadata, accessibility audits, and reduced-motion refinements in the later hardening slice.

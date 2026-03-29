# Requirement: AI Workflow Website

> Generated: 2026-03-28
> Status: Draft
> Complexity: Medium

---

## Quick Links

| Document                                                  | Status      |
| --------------------------------------------------------- | ----------- |
| [BA Analysis](agents/ba-ai-workflow-website.md)           | ✅ Complete |
| [SA Assessment](agents/sa-ai-workflow-website.md)         | ✅ Complete |
| [Domain Research](agents/research-ai-workflow-website.md) | ⏭️ Skipped  |
| [UI/UX Design](agents/uiux-ai-workflow-website.md)        | ✅ Complete |

## Related Plans

| Type         | Document                                                                                                               | Status      |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- | ----------- |
| Epic         | [epic-ai-workflow-website.md](../planning/epic-ai-workflow-website.md)                                                 | in_progress |
| Feature Plan | [feature-ai-workflow-website-foundation-mockups.md](../planning/feature-ai-workflow-website-foundation-mockups.md)     | completed   |
| Feature Plan | [feature-ai-workflow-website-home-install-polish.md](../planning/feature-ai-workflow-website-home-install-polish.md)   | in_progress |
| Feature Plan | [feature-ai-workflow-website-home-showcase-polish.md](../planning/feature-ai-workflow-website-home-showcase-polish.md) | completed   |

---

## 1. Executive Summary

A static Next.js 14 marketing and documentation website for the AI Agent Workflow open-source project, living in a `website/` folder inside the existing monorepo and deployed to Vercel free tier. The site targets "vibe coders" — developers who adopt tools based on aesthetics and ease — and delivers a product landing page, a guided install flow, an animated workflow visualizer, and a filterable skills/commands explorer. All data is sourced from static TypeScript config files with no backend or runtime API calls; skill markdown content is copied from `.agents/skills/` at build time via a prebuild script.

---

## 2. Problem Statement

### Context

The AI Agent Workflow project is a CLI installer that bootstraps AI workflow files for 3 AI tools: Claude Code, Codex, and Google Antigravity. Currently, the only discovery path is the GitHub README and a `curl | bash` install command — no polished web presence exists.

### Problem

- No entry point that communicates the project's value at a glance (SaaS-style).
- Install process requires reading raw GitHub markdown with no copy-paste affordance.
- Workflow architecture (how agents connect and sequence) is invisible.
- Skills and commands are not browsable or filterable without reading raw files.

### Impact

Developers discovering the project have no frictionless path from "what is this?" to "installed." A purpose-built website reduces adoption friction and makes the project feel credible to vibe coders who evaluate tools by how they look.

---

## 3. Users & User Stories

### Target Users

| User Type               | Description                                                                | Primary Goals                                             |
| ----------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------- |
| Vibe Coder              | Developer who adopts tools rapidly based on aesthetics and copy-paste ease | Understand the value, install fast, discover skills       |
| Open-Source Contributor | Developer exploring workflow architecture before contributing              | Browse skills, visualize graphs, understand triggers      |
| Project Maintainer      | Keeps skill/command data current via TypeScript config files               | Site reflects latest workflow without custom deploy steps |

### User Stories

| ID    | Priority | As a...     | I want to...                                                           | So that...                                                                         |
| ----- | -------- | ----------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| US-01 | Must     | vibe coder  | see a compelling landing page with headline, features, and a clear CTA | I can decide within 60 seconds whether this tool is worth trying                   |
| US-02 | Must     | vibe coder  | select my AI tool and copy the ready-made curl command                 | I can install the workflow in under 30 seconds                                     |
| US-03 | Must     | developer   | view an animated step-by-step workflow graph                           | I can understand how agent workflows are structured                                |
| US-04 | Must     | developer   | browse a filterable list of skills and commands by AI tool             | I can find the skill relevant to my tool                                           |
| US-05 | Must     | developer   | open a skill detail page at `/skills/[id]`                             | I can read trigger keywords, use cases, markdown preview, and copy install command |
| US-06 | Should   | developer   | click a graph node and see a tooltip                                   | I can get context without leaving the visualizer                                   |
| US-07 | Should   | developer   | switch UI language between English and Vietnamese                      | I can read documentation in my preferred language                                  |
| US-08 | Should   | vibe coder  | experience dark dev aesthetic with terminal-style elements             | The product feels credible and on-brand                                            |
| US-09 | Could    | developer   | replay a workflow animation                                            | I can re-watch the sequence without refreshing                                     |
| US-10 | Could    | contributor | switch between multiple workflow graphs                                | I can compare different agent workflow patterns                                    |

---

## 4. Functional Requirements

| ID    | Requirement                                                                                                           | Priority | Acceptance Criteria                                                                                       |
| ----- | --------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------- |
| FR-01 | Home page: product landing page with headline, feature highlights, and CTA linking to `/install`                      | Must     | Page loads at `/`; CTA visible above fold; clicking navigates to `/install`                               |
| FR-02 | Install page: AI tool selector; selecting a tool updates the displayed curl command                                   | Must     | Each tool option is clickable; command text changes per selection; matches config                         |
| FR-03 | Install page: one-click copy button for the curl command                                                              | Must     | Clicking copies to clipboard; visual "Copied!" confirmation appears then resets after 2–3s                |
| FR-04 | Install page: default state when no tool is selected                                                                  | Must     | Either a default tool pre-selected or a clear "select a tool" prompt shown                                |
| FR-05 | Workflow Visualizer: animated graph where nodes and edges appear sequentially (Framer Motion)                         | Must     | Graph animates on page load; nodes appear before connecting edges; animation completes without user input |
| FR-06 | Workflow Visualizer: click node → tooltip with label and description                                                  | Must     | Clicking shows tooltip; dismissed by clicking elsewhere                                                   |
| FR-07 | Workflow Visualizer: multiple graphs supported via separate TypeScript config objects                                 | Should   | At least 2 graphs render; adding a config object adds a new graph without code changes                    |
| FR-08 | Skills Explorer: list/grid of all skills from static TypeScript config                                                | Must     | All config entries appear on `/skills`                                                                    |
| FR-09 | Skills Explorer: single-select filter by AI tool; state persisted to URL query param                                  | Must     | Filter controls visible; selecting a tool updates list immediately; URL reflects selection                |
| FR-10 | Skills Explorer: empty state when filter yields no results                                                            | Must     | Empty state text shown (e.g., "No skills for this tool")                                                  |
| FR-11 | Skill detail page at `/skills/[id]`; 404 for unknown IDs                                                              | Must     | Detail page renders for valid IDs; Next.js 404 for unknown IDs                                            |
| FR-12 | Skill detail: trigger keywords, use cases ("Use when you want to..."), markdown content preview, copy install command | Must     | All four sections present; markdown rendered (not raw); copy button works                                 |
| FR-13 | Language switcher: EN/VI toggle in global nav; preference persisted to localStorage                                   | Should   | Switching changes all UI labels and static text; persists across refreshes                                |
| FR-14 | Dark theme with gradient accents (purple-to-cyan) and terminal-style elements (monospace commands, prompt decorators) | Must     | Dark background; monospace font for command blocks; gradient accent visible on Home hero                  |
| FR-15 | Fully static site — no runtime API calls, no backend                                                                  | Must     | `next build` produces static output; no runtime `fetch` to external services                              |

---

## 5. Business Rules

| ID    | Rule                          | Condition                               | Action                                                                                        |
| ----- | ----------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------- |
| BR-01 | Tool-specific install command | User selects AI tool on Install page    | Display and make copyable only the command mapped to that tool in config                      |
| BR-02 | Skill detail 404              | `/skills/[id]` accessed with unknown id | Render Next.js 404 page                                                                       |
| BR-03 | Filter persistence            | User navigates back to Skills Explorer  | Previously selected tool filter restored via URL query param                                  |
| BR-04 | Animation plays once on mount | Workflow Visualizer page loads          | Step-by-step animation plays automatically; does not loop unless replay triggered             |
| BR-05 | Language default              | First visit, no preference stored       | Default language: English                                                                     |
| BR-06 | Language persistence          | User switches language                  | Selection persisted to localStorage across pages and refreshes                                |
| BR-07 | Static data only              | Site builds or renders                  | All data from local TypeScript config files; no HTTP calls to GitHub API or external services |

---

## 6. Technical Assessment

### Feasibility Summary

| Aspect   | Status                   | Notes                                                                 |
| -------- | ------------------------ | --------------------------------------------------------------------- |
| Overall  | ✅ Feasible with Changes | One non-trivial build pipeline step required (prebuild markdown copy) |
| Frontend | 🟡 Medium                | 5 routes, RSC/Client boundary management, DAG visualizer, i18n        |
| Backend  | 🟢 Low                   | None — fully static SSG                                               |
| Data     | 🟢 Low                   | TypeScript config files; markdown copied at prebuild                  |

### Recommended Architecture

Static Site Generation (SSG) with hybrid RSC / Client Component tree, deployed on standard Vercel (not `output: export`). All pages pre-rendered at build time. Framer Motion animation confined to `components/client/` subtrees. Markdown sourced from `.agents/skills/` via a Node.js prebuild copy script wired to the `"prebuild"` npm hook.

### Technology Stack

| Layer       | Technology                                     | Reason                                                  |
| ----------- | ---------------------------------------------- | ------------------------------------------------------- |
| Framework   | Next.js 14 (App Router)                        | SSG via `generateStaticParams`, RSC-first               |
| Language    | TypeScript                                     | Type-safe config objects drive `generateStaticParams`   |
| Styling     | Tailwind CSS + shadcn/ui                       | Fast, consistent, RSC-compatible                        |
| Animation   | Framer Motion                                  | Specified; confined to Client Components                |
| Markdown    | next-mdx-remote/rsc                            | Correct RSC variant, no client hydration overhead       |
| i18n        | Custom React Context + JSON                    | Lightweight; avoids next-intl middleware for 2 locales  |
| Static data | TypeScript config in `website/data/`           | Single source of truth                                  |
| Prebuild    | Node.js ESM script (`scripts/copy-skills.mjs`) | Copies `.agents/skills/` into `website/content/skills/` |
| Hosting     | Vercel free tier (standard deployment)         | Free, supports SSG with dynamic routes                  |

### Technical Risks

| ID    | Risk                                                                                        | Impact | Likelihood | Mitigation                                                                            |
| ----- | ------------------------------------------------------------------------------------------- | ------ | ---------- | ------------------------------------------------------------------------------------- |
| TR-01 | Framer Motion imported into RSC without `'use client'`                                      | High   | Medium     | Enforce `components/client/` folder convention; every file begins with `'use client'` |
| TR-02 | Vercel build command set to `next build` instead of `npm run build` — prebuild hook skipped | High   | Low        | Set Vercel build command to `npm run build`; verify `prebuild` in first build log     |
| TR-03 | `website/data/skills.ts` and `.agents/skills/` directory diverge over time                  | Medium | Medium     | Build-time validation script; document two-step add process                           |
| TR-04 | DAG layout unmanageable as workflow grows beyond 15 nodes                                   | Medium | Medium     | Manual `row`/`col` coordinate schema from the start; document clearly                 |

---

## 7. UI/UX Design

### Design Language — Obsidian Glow

**Theme**: Obsidian Glow (Vercel/Linear/Raycast aesthetic — dark, modern, premium)

**Colors:**

- Background: `#09090b` (near-black, not pure black — softer on eyes)
- Surface (cards): `rgba(255,255,255,0.04)` + `backdrop-filter: blur(16px)` (glassmorphism)
- Card border: `rgba(255,255,255,0.08)` (white at very low opacity)
- Card border hover: `rgba(255,255,255,0.15)`
- Primary glow: `#7c3aed` (violet/purple)
- Secondary glow: `#2563eb` (blue)
- Headline text: white with subtle gradient clip (`#fff → #a1a1aa`)
- Body text: `#a1a1aa` (zinc-400)
- Code/command bg: `#0d0d0d`, border `#333`

**Visual Effects (the "wow" layer):**

- Hero: 3 animated radial gradient blobs behind content (`@keyframes pulse` scale 1→1.08, 8s infinite)
  - Blob 1: `#7c3aed` top-left, `blur(120px)`, `opacity: 0.13`
  - Blob 2: `#2563eb` bottom-right, `blur(120px)`, `opacity: 0.10`
  - Blob 3: `#0891b2` mid-left, `blur(120px)`, `opacity: 0.07`
- Cards: standalone glass cards `gap: 16px` (not joined grid)
  - Background: `rgba(12,12,16,0.85)` + `backdrop-blur(20px)`
  - Top shine: `::before` horizontal gradient `rgba(255,255,255,0.18)` at top edge (glass effect)
  - Default border: `rgba(255,255,255,0.07)` via 1px wrapper padding
  - **Hover gradient border**: `::before` on wrapper with `-webkit-mask-composite: xor` — gradient `#7c3aed → #2563eb → #0891b2`
  - **Hover glow**: `::after` on wrapper, `blur(16px)` behind card, opacity 0→1
  - **Hover radial overlay**: `::after` on card, radial gradient from top, violet tint
  - Icon box: `40×40` rounded, `rgba(124,58,237,0.12)` bg + border; brightens on hover
  - Arrow indicator: `↗` slides in from left on hover (`opacity: 0→1`, `translateX: -4px→0`)
  - Tag: pill shape with border (`Command` = violet, `Skill` = cyan)
  - Footer: tag left + tool compatibility text right
- CTA button: **inverted** — white background + black text (stands out on dark bg)
- Secondary button: transparent + white border + white text
- Nav: `background: rgba(9,9,11,0.8)` + `backdrop-blur(12px)` + bottom border `rgba(255,255,255,0.06)`

**Typography:**

- Heading font: `'Outfit'` or `'Inter'` — weight 700–800
- Body font: `Inter`
- Mono (commands): `'IBM Plex Mono'` or `'JetBrains Mono'`

**Terminal decorators**: `$ ` prefix on command blocks; `>` for section labels

**Animations (Framer Motion):**

- Entrance: fade-up `y: 20→0, opacity: 0→1, duration: 0.4s, ease: easeOut`
- Staggered children: `staggerChildren: 0.08s`
- Blob pulse: CSS `@keyframes` scale 1→1.05→1, duration 8s infinite (subtle breathing effect)
- Card hover: scale `1→1.02`, transition `0.2s`

### Screen Inventory

| #   | Route          | Screen                                      | Priority |
| --- | -------------- | ------------------------------------------- | -------- |
| 1   | `/`            | Home — landing page                         | Must     |
| 2   | `/install`     | Install — tool selector + curl command      | Must     |
| 3   | `/workflow`    | Workflow Visualizer — animated DAG graphs   | Must     |
| 4   | `/skills`      | Skills Explorer — filterable card grid      | Must     |
| 5   | `/skills/[id]` | Skill Detail — full info + markdown preview | Must     |

### Key User Flows

```
Landing (/) → CTA "Get Started" → /install → select tool → copy curl command → terminal install

Landing (/) → nav "Workflow" → /workflow → watch animation → click node → tooltip

Landing (/) → nav "Skills" → /skills → filter by tool → click skill card → /skills/[id] → copy command
```

### Page Wireframes (ASCII)

**Home (`/`)**

```
┌──────────────────────────────────────────────────────────┐
│ [Logo] AI Workflow   Workflow  Skills  [EN|VI]  [GitHub] │ ← sticky nav, blur
├──────────────────────────────────────────────────────────┤
│                                                          │
│  $ ai-agent-workflow --init                              │ ← terminal prompt deco
│  ┌─────────────────────────────────────────────┐         │
│  │  AI Agent Workflow                          │         │ ← gradient headline
│  │  Structured workflows for                   │         │
│  │  every AI coding tool.                      │         │
│  └─────────────────────────────────────────────┘         │
│       [Get Started →]   [View on GitHub]                 │ ← CTA buttons
│                                                          │
├──────────────────────────────────────────────────────────┤
│  Features:                                               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐           │
│  │ 3 Tools    │ │ 9 Commands │ │ 7 Skills   │           │
│  │ Claude,    │ │ create-    │ │ Design,    │           │
│  │ Codex...   │ │ plan, ...  │ │ Quality... │           │
│  └────────────┘ └────────────┘ └────────────┘           │
├──────────────────────────────────────────────────────────┤
│  "Install in one command"                                │
│  $ curl -fsSL .../install.sh | bash                      │ ← terminal panel
│  [Install Now →]                                         │
└──────────────────────────────────────────────────────────┘
```

**Install (`/install`)**

```
┌──────────────────────────────────────────────────────────┐
│ [Nav]                                                    │
├──────────────────────────────────────────────────────────┤
│  > Select your AI tool                                   │
│  ┌──────────────┐ ┌──────────┐ ┌──────────────┐        │
│  │◉ Claude Code │ │○ Codex   │ │○ Antigravity│        │ ← tool tabs
│  └──────────────┘ └──────────┘ └──────────────┘        │
│                                                          │
│  > Run in your terminal:                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │ $ curl -fsSL .../install.sh | bash -s -- \       │   │ ← terminal panel
│  │     --tool claude                                │   │
│  │                                          [Copy ✓]│   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ✓ Installs: .claude/commands/  .claude/skills/          │
└──────────────────────────────────────────────────────────┘
```

**Workflow Visualizer (`/workflow`)**

```
┌──────────────────────────────────────────────────────────┐
│ [Nav]                                                    │
├──────────────────────────────────────────────────────────┤
│  > Workflow Graphs                                       │
│  [New Feature Flow] [Bug Fix Flow] [Code Review Flow]    │ ← graph selector tabs
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  │  [BA Agent] ──→ [SA Agent] ──→ [create-plan]       │  │ ← SVG DAG
│  │                                     │              │  │   nodes animate in
│  │                              [execute-plan]        │  │   sequence
│  │                               │          │         │  │
│  │                       [writing-test] [code-review] │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│  Click a node to see details                             │
│  [▶ Replay]                                              │
└──────────────────────────────────────────────────────────┘
```

**Skills Explorer (`/skills`)**

```
┌──────────────────────────────────────────────────────────┐
│ [Nav]                                                    │
├──────────────────────────────────────────────────────────┤
│  > Skills & Commands                                     │
│  Filter: [All] [Claude] [Codex] [Antigravity]           │ ← filter chips
│                                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│  │ create-plan  │ │ execute-plan │ │ code-review  │     │ ← skill cards
│  │ Command      │ │ Command      │ │ Command      │     │
│  │ Claude,Codex │ │ All tools    │ │ All tools    │     │
│  │ [View →]     │ │ [View →]     │ │ [View →]     │     │
│  └──────────────┘ └──────────────┘ └──────────────┘     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│  │ writing-test │ │ senior-review│ │ run-test     │     │
│  │ ...          │ │ ...          │ │ ...          │     │
│  └──────────────┘ └──────────────┘ └──────────────┘     │
└──────────────────────────────────────────────────────────┘
```

**Skill Detail (`/skills/[id]`)**

```
┌──────────────────────────────────────────────────────────┐
│ [Nav]                                                    │
├──────────────────────────────────────────────────────────┤
│  ← Back to Skills                                        │
│                                                          │
│  create-plan                                             │ ← skill name
│  Generates a feature planning doc with implementation   │
│  details.                                                │
│                                                          │
│  > Trigger Keywords                                      │
│  [create plan] [feature plan] [planning doc] ...         │ ← keyword chips
│                                                          │
│  > Use When                                              │
│  • Use when you want to plan a new feature               │
│  • Use when you need a structured implementation guide   │
│  • Use before starting any medium/large task             │
│                                                          │
│  > Compatible Tools                                      │
│  [Claude Code] [Codex] [Google Antigravity]             │
│                                                          │
│  > Install Command                                       │
│  ┌────────────────────────────────────────────────┐     │
│  │ $ curl ... --tool claude                       │     │
│  │                                        [Copy]  │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  > Skill Content Preview                                 │
│  ┌────────────────────────────────────────────────┐     │
│  │ # Create Plan                                  │     │ ← rendered markdown
│  │ Generates a feature planning doc...            │     │
│  │ ## When to Use                                 │     │
│  │ ...                                            │     │
│  └────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────┘
```

### Wireframe Reference

See full detail: [UI/UX Design Document](agents/uiux-ai-workflow-website.md)

---

## 8. Non-Functional Requirements

| Category      | Requirement                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| Performance   | Lighthouse score ≥ 90 on desktop; no layout shift from animations                                            |
| Accessibility | `aria-label` on icon-only buttons; keyboard navigation on tab components; `prefers-reduced-motion` respected |
| Compatibility | Chrome 90+, Firefox 88+, Safari 14+; mobile responsive                                                       |
| SEO           | `generateMetadata` per page: title, description, og:image                                                    |
| i18n          | EN default; VI translation for all static UI strings; skill markdown body English-only                       |

---

## 9. Technical Edge Cases

| ID    | Edge Case                                                        | Expected Behavior                                                                                     | Priority |
| ----- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------- |
| TE-01 | Skill folder in `.agents/skills/` has no `SKILL.md`              | Prebuild script skips folder + logs warning; ID excluded from `generateStaticParams`                  | Must     |
| TE-02 | URL query param for tool filter contains unrecognized value      | Matched against closed `ToolId` enum; unrecognized values silently ignored, filter resets to "All"    | Must     |
| TE-03 | `localStorage` unavailable (private browsing, blocked storage)   | Language read wrapped in try/catch; falls back to English; no SSR crash                               | Must     |
| TE-04 | `website/data/skills.ts` and `.agents/skills/` directory diverge | Build-time validation script diffs IDs and prints warnings                                            | Should   |
| TE-05 | User has `prefers-reduced-motion: reduce` set                    | All Framer Motion components check `useReducedMotion()`; animation skipped/reduced                    | Must     |
| TE-06 | User bookmarks `/skills?tool=codex` and returns                  | `useSearchParams` reads param on mount and applies filter immediately; no unfiltered flash            | Must     |
| TE-07 | `/workflow` visualizer with > 20 nodes                           | Cap at 20 nodes in v1; document limit; apply single-container CSS transform for scroll/zoom if needed | Should   |

---

## 10. Out of Scope

- Backend API, database, or runtime server-side data fetching
- GitHub API integration or live data sync from repository
- User authentication or personalization beyond language preference
- Full-text search in Skills Explorer (tool filter only)
- Blog, changelog, or news section
- Analytics or tracking integration
- Light theme / dark-light toggle
- PWA or native app features
- Automated markdown content sync (manual config update required)
- Vietnamese translation of skill markdown body content

---

## 11. Open Questions

| ID   | Question                                                                  | Owner         | Status                                      | Blocking       |
| ---- | ------------------------------------------------------------------------- | ------------- | ------------------------------------------- | -------------- |
| Q-01 | Exact AI tool ID list for the ToolId enum and filter?                     | Project owner | Resolved (`claude`, `codex`, `antigravity`) | No             |
| Q-02 | How many workflow graphs in v1? Are node/edge structures already defined? | Project owner | Open                                        | Should (FR-07) |
| Q-03 | Vietnamese translations available before first deployment?                | Project owner | Open                                        | Should (FR-13) |
| Q-04 | Should `website/content/skills/` be committed to git or gitignored?       | Project owner | Open                                        | No             |

---

## 12. Acceptance Criteria

### Scenario 1: Install flow (happy path)

- **Given** a developer visits `/install` for the first time
- **When** they click the "Claude Code" tool option
- **Then** the curl command updates to the Claude-specific install string, and clicking "Copy" copies it to clipboard with a visual confirmation

### Scenario 2: Workflow graph animation

- **Given** a developer visits `/workflow`
- **When** the page loads
- **Then** graph nodes appear one by one in sequence, edges draw between them, and clicking any node shows a tooltip with its label and description

### Scenario 3: Skills filter + detail navigation

- **Given** a developer on `/skills` selects "Codex" from the filter chips
- **When** the filter is applied
- **Then** only skills compatible with Codex are shown; the URL updates to `/skills?tool=codex`; clicking a skill card navigates to `/skills/[id]` with all four sections visible (keywords, use cases, markdown preview, install command)

### Scenario 4: Language switch

- **Given** a developer clicks "VI" in the global nav
- **When** the language switches to Vietnamese
- **Then** all UI labels, headings, and nav links change to Vietnamese; the selection persists after refreshing the page; skill markdown body remains in English

### Scenario 5: Unknown skill ID

- **Given** a developer navigates to `/skills/nonexistent-skill`
- **When** the page renders
- **Then** the Next.js 404 page is displayed

---

## 13. Implementation Guidance

### Suggested Phases

| Phase | Focus                                                                                                       | Priority |
| ----- | ----------------------------------------------------------------------------------------------------------- | -------- |
| 1     | Foundation: `website/` Next.js setup, prebuild script, TypeScript data configs, i18n context, Vercel wiring | High     |
| 2     | Core features: Home, Install, Skills Explorer, Skill Detail, Workflow Visualizer                            | High     |
| 3     | Enhancement: language switcher, build-time validation, SEO metadata, reduced motion, accessibility pass     | Medium   |

### Dependencies

| Dependency                       | Type                     | Status            |
| -------------------------------- | ------------------------ | ----------------- |
| Next.js 14 App Router            | External library         | Available         |
| Tailwind CSS + shadcn/ui         | External library         | Available         |
| Framer Motion                    | External library         | Available         |
| next-mdx-remote                  | External library         | Available         |
| Vercel free tier account         | External service         | Assumed available |
| `.agents/skills/` markdown files | Internal repo            | Available         |
| Vietnamese UI translations       | Internal — project owner | Pending           |

### Project Structure

```
website/
├── app/
│   ├── layout.tsx               ← Root layout, i18n provider, nav, footer
│   ├── page.tsx                 ← Home landing page (RSC)
│   ├── install/page.tsx         ← Install page (RSC shell + client tab/copy)
│   ├── workflow/page.tsx        ← Visualizer (RSC shell + client DAG)
│   ├── skills/
│   │   ├── page.tsx             ← Skills Explorer (RSC shell + client filter)
│   │   └── [id]/page.tsx        ← Skill detail (RSC + generateStaticParams)
│   └── not-found.tsx            ← 404 page
├── components/
│   ├── server/                  ← RSC-safe structural components
│   └── client/                  ← 'use client' — all Framer Motion + interactive
├── content/skills/              ← Copied markdown files (gitignored)
├── data/
│   ├── tools.ts                 ← ToolId enum, labels, install commands
│   ├── skills.ts                ← SkillConfig array
│   └── workflows.ts             ← WorkflowConfig array (nodes, edges)
├── lib/
│   ├── skills.ts                ← Build-time markdown reader
│   └── i18n/
│       ├── LocaleContext.tsx
│       ├── en.json
│       └── vi.json
└── scripts/
    └── copy-skills.mjs          ← Prebuild: copies .agents/skills/ → content/skills/
```

---

## 14. Implementation Readiness Score

**Score**: 78%

| Criteria                                  | Status                               | Weight |
| ----------------------------------------- | ------------------------------------ | ------ |
| All FRs have testable acceptance criteria | ✅                                   | 20%    |
| No critical open questions                | ❌ (Q-01 tool IDs, Q-02 graph count) | 20%    |
| Technical risks have mitigations          | ✅                                   | 15%    |
| Business rules are explicit               | ✅                                   | 15%    |
| Error/edge cases defined                  | ✅                                   | 15%    |
| UI/UX specs complete                      | ✅                                   | 15%    |

**Missing for 100%**:

- Q-02: Confirm number of workflow graphs and their node/edge structure for v1
- Q-03: Confirm Vietnamese translation availability timeline

---

## 15. Changelog

| Date       | Change                                             |
| ---------- | -------------------------------------------------- |
| 2026-03-28 | Initial version — BA + SA + UI/UX agents completed |

---

## Next Steps

1. [ ] Review this requirement document
2. [ ] Confirm Q-01: exact tool IDs for `ToolId` enum
3. [ ] Confirm Q-02: number of workflow graphs and their structure for v1
4. [ ] Confirm Q-03: Vietnamese translation timeline
5. [ ] Run `/manage-epic` to break into feature plans (recommended — 3 phases, multiple deliverables)

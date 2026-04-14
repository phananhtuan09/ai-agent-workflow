# Landing Page Theme Specification

This document defines the visual theme, component-level styling, layout rules, and animation behavior for the landing page guide.
It is scoped to implementation use — each section maps directly to a page region or component.

---

## 1. Theme Direction

### 1.1 Design Language

**Elevated navy — clean, readable, premium dark.**

The previous theme used pitch-black (`#09090b`) which made body text hard to distinguish from surfaces and gave a flat, heavy feel. The new direction lifts the base to a deep navy, adds more surface depth, and replaces neon gradient buttons with clean high-contrast alternatives.

Target feeling:
- modern developer tool — similar to Linear, Raycast, Clerk
- readable at all times — no eye strain from low-contrast surfaces
- premium without being flashy — buttons feel intentional, not loud

Three core rules:
1. Background is navy, not black — the difference in readability is significant
2. Glass cards stay, but with higher opacity so they are actually visible
3. Buttons use clean solid color or white, not heavy multi-color gradients

---

### 1.2 New Design Token Replacements

These replace or update the existing `tailwind.config.ts` and `globals.css` values.

**Background palette (replace `obsidian-*` scale):**

| New Token | Value | Replaces | Use |
|---|---|---|---|
| `surface-base` | `#0B0E18` | `obsidian-950` `#09090b` | page base |
| `surface-low` | `#0F1420` | `obsidian-900` `#0d0d0f` | section alt bg |
| `surface-mid` | `#141926` | `obsidian-850` `#111114` | card backgrounds |
| `surface-high` | `#1A2133` | `obsidian-800` `#17171d` | elevated panels, file viewers |
| `surface-border` | `#232D42` | `obsidian-700` `#27272f` | borders, dividers |

The old `#09090b` was near-black with almost no lightness. The new `#0B0E18` is a deep navy — the difference is subtle in a hex editor but visually very noticeable. Surfaces now have real depth because each step up in the scale is actually distinguishable.

**Accent palette (partial change):**

| Token | Value | Change | Use |
|---|---|---|---|
| `accent-indigo` | `#6366F1` | **new — primary accent** | active states, step chips, key highlights |
| `accent-violet` | `#7c3aed` | keep | graph decorative nodes |
| `accent-blue` | `#2563eb` | keep | graph command nodes |
| `accent-teal` | `#0D9488` | **replaces accent-cyan** | subtle borders, secondary UI |
| `accent-success` | `#4ade80` | keep | completion, finish button |

Why replace cyan with indigo as primary accent:
- `#06b6d4` (cyan) is a cool neon that works in pure-dark themes but fights with warmer navy
- `#6366F1` (indigo) reads as premium and modern against navy backgrounds
- Indigo harmonizes with both the violet decorative elements and the blue graph nodes
- Cyan is kept only as `accent-teal` for subtle secondary borders — less dominant

**Text contrast (improve from old):**

| Token | Value | Use |
|---|---|---|
| `white` | `#FFFFFF` | headlines |
| `slate-100` | `#F1F5F9` | **use for body text** (was `slate-300`) |
| `slate-300` | `#CBD5E1` | secondary explanations, card body |
| `slate-400` | `#94A3B8` | muted labels, metadata |
| `slate-500` | `#64748B` | file paths, step counters |

The old theme used `slate-300` (`#CBD5E1`) for body text on `#09090b`. Contrast ratio: ~8:1, technically fine but visually tiring. On the new navy base `#0B0E18`, shifting body to `slate-100` (`#F1F5F9`) gives ~12:1 — noticeably more comfortable for long reading.

**Shadows (update):**

| Token | Value | Use |
|---|---|---|
| `shadow-card` | `0 1px 3px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)` | glass cards |
| `shadow-btn-primary` | `0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)` | primary solid button depth |
| `shadow-btn-white` | `0 1px 3px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15)` | white CTA button |

---

### 1.3 Updated `tailwind.config.ts`

```ts
colors: {
  surface: {
    base:   '#0B0E18',
    low:    '#0F1420',
    mid:    '#141926',
    high:   '#1A2133',
    border: '#232D42',
  },
  accent: {
    indigo:  '#6366F1',
    violet:  '#7c3aed',
    blue:    '#2563eb',
    teal:    '#0D9488',
    success: '#4ade80',
  }
},
boxShadow: {
  card:       '0 1px 3px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)',
  'btn-primary': '0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)',
  'btn-white':   '0 1px 3px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15)',
},
backgroundImage: {
  'btn-indigo': 'linear-gradient(180deg, #6D70F5 0%, #4F52D9 100%)',
},
```

---

### 1.4 Updated `globals.css`

**Body background — replace the existing rule:**

```css
body {
  background:
    radial-gradient(circle at 15% 10%, rgba(99, 102, 241, 0.10), transparent 38%),
    radial-gradient(circle at 82% 20%, rgba(37, 99, 235, 0.08), transparent 32%),
    radial-gradient(circle at 10% 88%, rgba(13, 148, 136, 0.07), transparent 30%),
    #0B0E18;
  color: #F1F5F9;
}
```

Changes from old:
- Base changed from `#09090b` to `#0B0E18`
- Glow radii reduced (38/32/30 instead of 34/28/30) — less spread
- Glow opacity reduced (0.10 / 0.08 / 0.07 instead of 0.14 / 0.14 / 0.10) — glows are ambient, not dominant
- Default text changed to `#F1F5F9` instead of `#e2e8f0`

**Hero blur blobs — update colors and reduce opacity:**

```css
.hero-blur-one   { background: rgba(99, 102, 241, 0.12); }
.hero-blur-two   { background: rgba(37,  99, 235,  0.09); }
.hero-blur-three { background: rgba(13, 148, 136,  0.08); }
```

**Glass panel — update for new surfaces:**

```css
.glass-panel {
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.055);
  backdrop-filter: blur(20px);
  box-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2);
}
```

Changes: `bg-white/[0.045]` → `bg-white/[0.055]` (slightly more visible on lighter navy base), `border-white/10` → `border-white/[0.08]` (consistent), add explicit `box-shadow`.

**Updated text-gradient (slightly warmer):**

```css
.text-gradient {
  background-image: linear-gradient(
    135deg,
    #ffffff 0%,
    #C4B5FD 35%,   /* violet-300 */
    #93C5FD 65%,   /* blue-300 */
    #5EEAD4 100%   /* teal-300 — replaces cyan-300 */
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

**New button classes:**

```css
/* Primary CTA — white button */
.btn-white {
  background: #FFFFFF;
  color: #0F172A;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15);
  transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
}
.btn-white:hover {
  background: #F1F5F9;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.2);
  transform: translateY(-1px);
}
.btn-white:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0,0,0,0.25);
}

/* Primary action — indigo button (Next / step actions) */
.btn-indigo {
  background: linear-gradient(180deg, #6D70F5 0%, #4F52D9 100%);
  color: #FFFFFF;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12);
  transition: filter 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
}
.btn-indigo:hover {
  filter: brightness(1.08);
  box-shadow: 0 2px 8px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.12);
  transform: translateY(-1px);
}
.btn-indigo:active {
  filter: brightness(0.96);
  transform: translateY(0);
}

/* Ghost button — secondary actions */
.btn-ghost {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.10);
  color: #CBD5E1;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.09);
  border-color: rgba(255, 255, 255, 0.18);
  color: #F1F5F9;
}

/* Finish button — success green */
.btn-finish {
  background: linear-gradient(180deg, #34D399 0%, #059669 100%);
  color: #FFFFFF;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15);
  transition: filter 0.2s ease, transform 0.15s ease;
}
.btn-finish:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
}
```

Remove `btn-shimmer`, `btn-glow`, `shadow-glow`, `shadow-violet` — these were part of the neon gradient system and are no longer used.

---

## 2. Typography

### 2.1 Font Roles

| Role | Variable | Use |
|---|---|---|
| `font-heading` | `--font-heading` | step titles, section titles, hero headline |
| `font-sans` | `--font-body` | body text, explanations, card copy |
| `font-mono` | `--font-mono` | kicker labels, file paths, code, step numbers |

### 2.2 Scale Reference

| Element | Classes |
|---|---|
| Hero headline | `font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-gradient leading-[1.1]` |
| Section title | `font-heading text-2xl sm:text-3xl font-semibold text-white` |
| Step title | `font-heading text-xl sm:text-2xl font-medium text-white` |
| Body paragraph | `font-sans text-base sm:text-lg leading-7 sm:leading-8 text-slate-100` |
| Secondary explanation | `font-sans text-sm leading-6 text-slate-300` |
| Key takeaway | `font-sans text-sm text-slate-300 italic` |
| Kicker / eyebrow | `font-mono text-xs uppercase tracking-[0.3em] text-indigo-300` |
| Step number label | `font-mono text-xs text-slate-500` |
| File path label | `font-mono text-xs text-slate-500` |
| Tab label | `font-mono text-xs` |
| Code inside viewer | `font-mono text-sm leading-6` |

Note: kicker was `cyan-200` — replace with `indigo-300` to match new accent.

---

## 3. Layout

### 3.1 Page Structure

```
Nav
Hero Section
  [Get Started CTA]
  ↓ smooth scroll:
Guide Section
  Progress Indicator
  Step Header
  Two-Column Content (desktop) / Stacked (mobile)
    Left: Explanation Panel
    Right: Graph Panel
  Example Panel (full width)
  Step Navigation (Prev / Next)
Exit State (after Step 4)
Tips Section
Claude + Obsidian Section
Footer (optional)
```

### 3.2 Outer Container

```
max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8
```

### 3.3 Two-Column Split

Desktop: `grid grid-cols-2 gap-8 lg:gap-12`
Mobile: stacked — explanation first, graph second.
Column ratio: `5:5`.

---

## 4. Component Specifications

### 4.1 Nav

**Scroll-triggered style:**
- At rest: `bg-transparent border-transparent`
- After scroll (`scrollY > 16`): `bg-[#0B0E18]/85 backdrop-blur-xl border-b border-white/[0.06]`
- Transition: `transition-all duration-300`

**Layout:** `h-14 flex items-center justify-between`

Left — site name:
```
font-mono text-sm text-slate-300
```

Right — GitHub link button:
```
btn-ghost px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5
```

Language switcher:
```
font-mono text-xs text-slate-400
border border-white/[0.08] rounded-md px-2 py-1
hover:border-white/20 hover:text-slate-200
transition-all duration-200
```

---

### 4.2 Hero Section

**Container:**
```
min-h-[calc(100vh-3.5rem)] flex flex-col items-start justify-center
max-w-3xl pt-24 pb-20
```

**Eyebrow:**
```
font-mono text-xs uppercase tracking-[0.3em] text-indigo-300 mb-5
```

**Headline:**
```
font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-gradient leading-[1.1]
```

**Body:**
```
mt-6 text-lg leading-8 text-slate-100 max-w-xl
```

**CTA button — "Get Started":**

Use `.btn-white` class:
```
mt-10 inline-flex items-center gap-2
btn-white
px-7 py-3.5 rounded-xl
text-base
```

Why white CTA on dark navy: maximum contrast, immediately draws the eye, feels premium without decoration. No gradient, no shimmer — just clean intent.

**Supporting note:**
```
mt-4 font-mono text-xs text-slate-500
```
Content: `Interactive walkthrough · Real Claude Code setup · Real workflow examples`

---

### 4.3 Progress Indicator

**Container:** `flex items-center justify-between mb-8`

**Left — step label:** `font-mono text-xs text-slate-500 uppercase tracking-widest`

**Right — step chips (4 buttons):**

Inactive:
```
w-8 h-8 rounded-full
border border-surface-border bg-surface-mid
font-mono text-xs text-slate-500
hover:border-white/20 hover:text-slate-300
transition-all duration-200 cursor-pointer
```

Active:
```
w-8 h-8 rounded-full
bg-accent-indigo/20 border border-accent-indigo/60
font-mono text-xs text-indigo-300
```

Transition on change: `transition-all duration-300`

**Progress bar (mobile only):**
```
h-[2px] bg-surface-border rounded-full mt-3
```
Fill: `bg-accent-indigo rounded-full h-full`
Fill transition: `transition-[width] duration-500 ease-out`

---

### 4.4 Step Header

```
font-heading text-xl sm:text-2xl font-medium text-white mt-2 mb-6
```

---

### 4.5 Explanation Panel (Left Column)

Stack with `flex flex-col gap-6`.

Each subsection (Explanation / Why this matters / Key takeaway):

Subsection label:
```
font-mono text-xs uppercase tracking-widest text-slate-500 mb-1.5
```

Body text:
```
text-base leading-7 text-slate-100
```

Key takeaway block — left accent bar:
```
border-l-2 border-accent-indigo/50 pl-4 text-slate-300 italic text-sm leading-6
```

---

### 4.6 Graph Panel (Right Column)

**Container:**
```
glass-panel min-h-[240px] flex flex-col justify-center gap-3
```

**Shared node style:**
```
rounded-lg border border-surface-border bg-surface-high
px-3 py-1.5 font-mono text-xs text-slate-300
transition-all duration-300
```

**Active node:**
```
border-accent-indigo/60 bg-accent-indigo/15 text-indigo-200
```

**Connector (↓ or →):**
```
text-slate-600 text-xs self-center
```

#### Step 1 — Claude Code Primitives

Layout: root node at top → 5 child nodes below, connected by a left border line.

```
[Claude Code]                ← accent-violet node
   |
   ├── [Commands]
   ├── [Skills]
   ├── [Hooks]
   ├── [Output Styles]
   └── [Sub Agents]
```

Root node:
```
border-accent-violet/60 bg-accent-violet/15 text-violet-300
```

Child nodes: default node style. Left connector: `border-l border-surface-border ml-3 pl-3 flex flex-col gap-2`

Footer label below graph:
```
font-mono text-[11px] text-slate-500 mt-4 text-center
```
Content: `Build workflow here first — migrate later`

#### Step 2 — 3 Config Surfaces

Layout: 3 equal columns, top connector line.

Root label above:
```
font-mono text-xs text-slate-400 mb-5 text-center
"Claude Code session"
```

Horizontal top connector: `border-t border-surface-border w-full` with 3 downward tick marks `w-px h-3 bg-surface-border mx-auto`

Each column card:
```
flex flex-col items-center gap-2 text-center px-2
```

File name:
```
font-mono text-xs text-indigo-300
```

Description:
```
text-[11px] text-slate-500 leading-4
```

Column separator: `border-r border-surface-border` (between columns, not on last).

#### Step 3 — Command → Skill Trigger Flow

Layout: vertical linear flow.

Node color map:
- `[User prompt]` — default
- `[/create-plan]` — `border-accent-blue/60 bg-accent-blue/15 text-blue-300`
- `[Claude loads command]` — default
- `[matches frontend theme]` — default, slightly muted `text-slate-400`
- `[frontend-design-theme-factory]` — `border-accent-violet/60 bg-accent-violet/15 text-violet-300`
- `[structured plan output]` — `border-accent-success/50 bg-accent-success/10 text-green-300`

All nodes centered, connected by `↓` in `text-slate-600`.

#### Step 4 — Workflow Phases

Layout: vertical chain, 5 nodes.

Nodes: Requirement → Plan → Implement → Review → Testing.

Active node (linked to which phase is highlighted in explanation): `border-accent-indigo/60 bg-accent-indigo/15 text-indigo-200`

The connector between nodes doubles as a progress indicator — connectors above the active phase use `text-indigo-500`, connectors below use `text-slate-700`.

---

### 4.7 Example Panel

**Outer container:**
```
bg-surface-high rounded-2xl border border-surface-border overflow-hidden mt-8
```

**Header bar:**
```
flex items-center justify-between
px-4 py-3
border-b border-surface-border
bg-surface-mid
```

Left label:
```
font-mono text-xs text-slate-400
```
Content: `Real Example From This Workflow`

**Tab row:**
```
flex gap-0.5 px-3 pt-2.5 border-b border-surface-border bg-surface-mid
```

Inactive tab:
```
font-mono text-xs text-slate-500
px-3 py-2 rounded-t-md
hover:text-slate-300 hover:bg-surface-high/50
transition-colors duration-150 cursor-pointer
```

Active tab:
```
font-mono text-xs text-indigo-300
px-3 py-2 rounded-t-md
bg-surface-high border-t border-l border-r border-surface-border
position: relative; bottom: -1px;
```

**File path label:**
```
font-mono text-[11px] text-slate-500 px-4 pt-3 pb-1
```

**File content area:**
```
overflow-y-auto max-h-[480px] p-4
```

`.md` files: `prose prose-invert prose-sm max-w-none` (`@tailwindcss/typography`)
Code/config files: syntax-highlighted `<pre><code>` — use `shiki` with theme `github-dark` or `one-dark-pro`

Scrollbar:
```css
.file-viewer::-webkit-scrollbar { width: 5px; }
.file-viewer::-webkit-scrollbar-track { background: transparent; }
.file-viewer::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.10);
  border-radius: 3px;
}
.file-viewer::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.18);
}
```

---

### 4.8 Step Navigation (Prev / Next)

Container: `flex items-center justify-between mt-8`

**Prev:**
```
btn-ghost inline-flex items-center gap-2
px-5 py-2.5 rounded-xl
font-sans text-sm
disabled:opacity-30 disabled:pointer-events-none
```

**Next:**
```
btn-indigo inline-flex items-center gap-2
px-5 py-2.5 rounded-xl
font-sans text-sm
```

**Finish (Step 4 last):**
```
btn-finish inline-flex items-center gap-2
px-5 py-2.5 rounded-xl
font-sans text-sm
```

---

### 4.9 Exit State

**Container:**
```
glass-panel mx-auto max-w-2xl mt-16 text-center
```

**Headline:**
```
font-heading text-2xl font-medium text-white mb-3
```

**Subtitle:**
```
text-slate-300 text-sm mb-8
```

**4-point list:**
```
text-left flex flex-col gap-3 mb-8
```

Each item — flex row with number badge + text:
- Number badge: `flex-none w-6 h-6 rounded-full bg-accent-indigo/20 border border-accent-indigo/40 flex items-center justify-center font-mono text-xs text-indigo-300`
- Text: `text-slate-200 text-sm`

**CTA row:**
```
flex flex-col sm:flex-row gap-3 justify-center
```

Primary (Review repo): `btn-indigo px-6 py-3 rounded-xl text-sm`
Secondary (Restart guide): `btn-ghost px-6 py-3 rounded-xl text-sm`

---

### 4.10 Tips Section

Section label: `font-mono text-xs uppercase tracking-[0.3em] text-indigo-300 mb-3`
Section title: `font-heading text-2xl sm:text-3xl font-semibold text-white mb-10`

**Card grid:** `grid grid-cols-1 md:grid-cols-2 gap-5`

Each card:
```
glass-panel flex flex-col gap-4
hover:border-white/[0.12] hover:-translate-y-[3px]
transition-all duration-250
```

Icon area:
```
w-10 h-10 rounded-xl flex items-center justify-center
bg-accent-indigo/15 border border-accent-indigo/30
text-indigo-300
```

Card title: `font-heading text-lg font-medium text-white`
Card body: `text-sm leading-6 text-slate-300`

---

### 4.11 Claude + Obsidian Section

Same section label and title pattern as Tips.

Intro: `text-base leading-7 text-slate-300 max-w-2xl mb-10`

**Cards:** same as Tips cards.

Mini graph inside card:
```
bg-surface-high rounded-xl p-4
font-mono text-xs text-slate-400 leading-6
border border-surface-border
```

Final output node in mini graph: `text-indigo-300`

---

## 5. Animation and Transition Specifications

### 5.1 Hero → Guide (Get Started click)

Smooth scroll. No state switch.

```js
document.getElementById('guide-section').scrollIntoView({ behavior: 'smooth' })
```

Optional sticky mini-header when hero scrolls out of view:
- Detects via `IntersectionObserver`
- Slides down from top: `translate-y-[-100%]` → `translate-y-0`, `transition-transform duration-300`
- Background: `bg-[#0B0E18]/90 backdrop-blur-xl border-b border-surface-border`

---

### 5.2 Step Transition (Prev / Next)

Direction-aware slide + fade. Treat steps as a left-to-right sequence.

Moving **Next**:
- Outgoing: `opacity-100 translate-x-0` → `opacity-0 translate-x-[-20px]`, `duration-220 ease-in`
- Incoming: starts at `opacity-0 translate-x-[20px]`, animates to `opacity-100 translate-x-0`, `duration-280 ease-out`, delay `80ms`

Moving **Prev**: reverse x directions.

Keep step container `min-h` stable. Use `overflow-hidden` during active transition.

```css
.step-content {
  transition: opacity 280ms ease-out, transform 280ms ease-out;
}
.step-content.exiting {
  opacity: 0;
  transform: translateX(-20px);
  transition-duration: 220ms;
  transition-timing-function: ease-in;
}
```

---

### 5.3 Progress Chips

On active chip change:
- Old active → inactive: border/bg color fades, `transition-all duration-250`
- New active: `scale-90 opacity-70` → `scale-100 opacity-100`, `duration-300`

Mobile progress bar fill: `transition-[width] duration-500 ease-out`

---

### 5.4 Graph Node Highlighting

Per-node: `transition-all duration-300 ease-out` on border-color and background-color.

When step changes:
1. Outgoing highlight fades in `150ms`
2. Step transition runs (`220ms` exit, `80ms` delay, `280ms` enter)
3. Incoming highlight activates at `+250ms` after step transition starts (coincides with content arriving)

Step 4 active phase node: changes when user clicks a phase tab or when explanation panel scrolls past a phase heading.

---

### 5.5 Example Panel Tab Switch

```
opacity-100 → opacity-0 (120ms ease-in)
→ swap content
→ opacity-0 → opacity-100 (200ms ease-out, 40ms delay)
```

Active tab underline/border indicator: `transition-all duration-200 ease-out`

---

### 5.6 Scroll Reveal (Tips, Obsidian)

```
Initial:   opacity-0, translateY(16px)
Triggered: opacity-100, translateY(0)
Timing:    500ms ease-out
Stagger:   100ms per card (card 1: 0ms, card 2: 100ms)
```

`IntersectionObserver` threshold: `0.12`. Trigger once only.

Check `prefers-reduced-motion` — skip if set.

---

### 5.7 Button Hover States

All hover states are defined in the button classes above (`btn-white`, `btn-indigo`, `btn-ghost`, `btn-finish`). No extra utility classes needed.

Shared rule: all buttons transition `transform` for the `-1px` lift. Do not use `translateY` larger than `2px` — subtle lift reads premium, large lift reads cheap.

---

### 5.8 Nav Scroll State

Trigger: `scrollY > 16`

```
transition-all duration-300
```

---

### 5.9 prefers-reduced-motion

Keep existing `globals.css` rule. Additionally all JS-driven animations must check:

```js
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
if (!prefersReduced) { /* run animation */ }
```

---

## 6. Mobile Adaptations

| Element | Desktop | Mobile |
|---|---|---|
| Two-column layout | `grid-cols-2` | stacked: explanation → graph → example |
| Step chips | visible row right | same row, `w-7 h-7` |
| Progress bar | hidden | visible below chips |
| Hero headline | `text-6xl` | `text-4xl` |
| Example panel height | `max-h-[480px]` | `max-h-[320px]` |
| Graph panel | `min-h-[240px]` | `min-h-[180px]` |
| Tips/Obsidian cards | 2-column grid | 1 column |
| Step nav | `space-between` | `space-between` full width |

---

## 7. Z-Index Layers

| Layer | z-index | Elements |
|---|---|---|
| Background blobs | `0` | `.hero-blur` (fixed) |
| Page content | `10` | all sections |
| Sticky mini-header | `40` | optional scroll-triggered bar |
| Nav | `50` | main nav |

---

## 8. Open Decisions Resolved

| Decision | Resolved |
|---|---|
| Get Started — scroll vs state switch | Smooth scroll only. No state switch. |
| Graph — interactive vs illustrative | Illustrative only. Nodes highlight per step, not clickable. v1. |
| Tips/Obsidian — linear vs standalone | Standalone sections below guide, reachable by scrolling after Finish. |
| Obsidian examples — raw vs curated | Curated mini graph in each card + link to raw command file. Full-file viewer optional expand, not shown by default. |

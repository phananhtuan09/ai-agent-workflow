# Landing Page Guide Mockup

This document is a working mockup for the new `website/` home experience.
It does not follow the normal feature-plan format.
Its only purpose is to lock the initial UI direction, screen flow, and visible content before implementation.

## Product Direction

The website is no longer a product marketing site for the repository.
It becomes an interactive landing page that teaches developers how to build their own AI agent workflow.
The current repository workflow is used as the example system throughout the walkthrough.

Primary audience:
- Developers who already use AI agents but still work in an ad-hoc way
- Developers who are new to structured AI workflows
- Developers who need a practical reference, not abstract theory

Core interaction model:
- The home page opens with a simple hero
- User clicks `Get Started`
- The page transitions into a guided step-by-step walkthrough
- Each step explains one part of the workflow
- User can move with `Next` and `Prev`
- Each step shows:
  - explanation text
  - a workflow graph or diagram
  - an example that loads the exact full file from the current workflow

Step detail files:
- [`landing-page-guide-step-1-claude-code-foundation.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/docs/ai/planning/landing-page-guide-step-1-claude-code-foundation.md)
- [`landing-page-guide-step-2-claude-code-setup.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/docs/ai/planning/landing-page-guide-step-2-claude-code-setup.md)
- [`landing-page-guide-step-3-skills-and-commands.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/docs/ai/planning/landing-page-guide-step-3-skills-and-commands.md)
- [`landing-page-guide-step-4-workflow-phases.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/docs/ai/planning/landing-page-guide-step-4-workflow-phases.md)
- [`landing-page-guide-section-ai-agent-tips.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/docs/ai/planning/landing-page-guide-section-ai-agent-tips.md)
- [`landing-page-guide-section-claude-obsidian.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/docs/ai/planning/landing-page-guide-section-claude-obsidian.md)

---

## 1. UI Mockup

### 1.1 Home Entry Screen

Purpose:
- Keep the first screen simple and clear
- Avoid overwhelming first-time users
- Make the main CTA obvious

Visible sections:
- Top nav
- Hero
- Primary CTA

ASCII mockup:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ AI Agent Workflow Guide                           [GitHub] [EN | VI]│
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  BUILD YOUR OWN AI AGENT WORKFLOW                                    │
│                                                                      │
│  Stop prompting randomly. Learn how to structure                     │
│  planning, execution, and review into a workflow                     │
│  your AI agents can actually follow.                                 │
│                                                                      │
│  This guide uses my current workflow as a real example               │
│  so you can adapt the same system for your own work.                 │
│                                                                      │
│  [ Get Started ]                                                     │
│                                                                      │
│  Small note: interactive guide, 4 steps, real examples              │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

Interaction:
- Clicking `Get Started` scrolls or transitions directly into the workflow guide section on the same page
- The hero can shrink into a smaller sticky page header once the guide starts

Recommended feel:
- Clean and intentional, not busy
- Strong headline
- One clear CTA
- Motion should suggest progression into a guided mode

### 1.2 Guided Workflow Section

Purpose:
- Turn the landing page into a walkthrough, not a static reading page
- Help beginners understand the workflow in small pieces

Visible layout:
- Top progress indicator
- Step header
- Main content split into two columns on desktop
- Bottom navigation with `Prev` and `Next`

Desktop wireframe:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Step 2 of 4                                                          │
│ Configure Claude Code Properly                       [01][02][03][04]│
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  LEFT COLUMN                         RIGHT COLUMN                     │
│  ┌───────────────────────────┐      ┌──────────────────────────────┐ │
│  │ Step title                │      │ Interactive graph            │ │
│  │ Short explanation         │      │ node -> node -> node         │ │
│  │ Why this matters          │      │ highlighted current step     │ │
│  │ Key takeaway              │      │                              │ │
│  └───────────────────────────┘      └──────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ Real Example From This Workflow                                 │ │
│  │ Source: .claude/* files                                         │ │
│  │ [File A] [File B] [File C]                                      │ │
│  │                                                                  │ │
│  │ Full real file viewer with syntax highlight                     │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  [ Prev ]                                           [ Next ]         │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

Mobile wireframe:

```text
┌──────────────────────────────┐
│ Step 2 of 4                  │
│ Configure Claude Code        │
│ [==== progress ====]         │
├──────────────────────────────┤
│ Explanation text             │
│ Why this matters             │
│ Key takeaway                 │
├──────────────────────────────┤
│ Graph / diagram              │
├──────────────────────────────┤
│ Real example                 │
│ [File tabs]                  │
│ Full file viewer             │
├──────────────────────────────┤
│ [Prev]           [Next]      │
└──────────────────────────────┘
```

Interaction details:
- `Prev` is disabled on first step
- `Next` becomes `Finish` on last step
- Step chips at the top can also be clickable
- The graph updates with each step
- The example panel updates with each step
- The example panel should render full real files, not shortened excerpts

### 1.3 Final Step / Exit State

Purpose:
- End the guide with a practical handoff
- Help users map the reference workflow to their own setup

ASCII mockup:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ You now have a workflow skeleton to copy and adapt                   │
│                                                                      │
│ 1. Define your standards                                             │
│ 2. Create requirements and plans                                     │
│ 3. Execute in small phases                                           │
│ 4. Validate before calling work done                                 │
│                                                                      │
│ [ Review the example repo ]   [ Restart the guide ]                  │
└──────────────────────────────────────────────────────────────────────┘
```

### 1.4 Step Detail Links

Step details are intentionally moved out of this overview file.
Use the following files to continue detailed iteration:

- [`landing-page-guide-step-1-claude-code-foundation.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/docs/ai/planning/landing-page-guide-step-1-claude-code-foundation.md)
- [`landing-page-guide-step-2-claude-code-setup.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/docs/ai/planning/landing-page-guide-step-2-claude-code-setup.md)
- [`landing-page-guide-step-3-skills-and-commands.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/docs/ai/planning/landing-page-guide-step-3-skills-and-commands.md)
- [`landing-page-guide-step-4-workflow-phases.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/docs/ai/planning/landing-page-guide-step-4-workflow-phases.md)

---

## 2. Screen Flow

### 2.1 Main User Flow

```text
Home Hero
  -> click Get Started
Workflow Guide Step 1
  -> Next
Workflow Guide Step 2
  -> Next
Workflow Guide Step 3
  -> Next
Workflow Guide Step 4
  -> Finish
Final CTA / Exit State
```

### 2.2 Step Navigation Rules

- User can move forward and backward with buttons
- User can jump to a specific step from the progress row
- The current step controls:
  - explanation copy
  - graph state
  - example source file
- The page should preserve current step in state
- Optional later enhancement:
  - sync current step to URL query like `?step=3`

### 2.3 Step Sequence Overview

- Step 1:
  - choose Claude Code as the workflow foundation
- Step 2:
  - configure Claude Code safely and intentionally
- Step 3:
  - package repeated work into commands and skills
- Step 4:
  - move work through explicit workflow phases

---

## 3. Content Draft

## 3.1 Home Hero Content

### Eyebrow

`AI Agent Workflow Guide`

### Title

`Build your own AI agent workflow, step by step.`

### Body

`This interactive guide walks through a real workflow from this repository so you can see how planning, execution, and review fit together. Learn the system first, then adapt it into your own process.`

### Primary CTA

`Get Started`

### Supporting Note

`Interactive walkthrough. Real Claude Code setup. Real workflow examples.`

---

## 4. After The 4 Steps

After the guided 4-step walkthrough, the landing page should continue with two additional sections:

- `Tips when working with AI agents`
- `Claude + Obsidian use cases`

These are not part of the core workflow walkthrough itself.
They act as practical follow-up sections after the user understands the foundation.

Section detail files:

- [`landing-page-guide-section-ai-agent-tips.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/docs/ai/planning/landing-page-guide-section-ai-agent-tips.md)
- [`landing-page-guide-section-claude-obsidian.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/docs/ai/planning/landing-page-guide-section-claude-obsidian.md)

---

## 5. Example Panel Recommendation

Across the whole landing page, examples should load exact full files from the real workflow.

Recommended behavior:
- show full file content
- show exact file path
- support markdown rendering for `.md` files
- support syntax highlighting for code/config files
- use tabs when multiple files belong to the same section
- keep explanation text separate from the raw file panel

Reason:
- the page should be educational and inspectable
- users should be able to study the real workflow, not only summaries
- this makes the landing page useful as a reference, not just as a pitch

---

## 6. Open Decisions

- Should `Get Started` smoothly scroll into the guide, or switch the hero into a guided-app state?
- Should the graph be fully interactive per step, or mostly illustrative with just one highlighted node?
- After Step 4, should the user continue linearly into `Tips` and `Obsidian use cases`, or should these become standalone sections lower on the page?
- In the Obsidian section, should command examples be shown as raw full files like the main workflow steps, or as curated examples with optional expand-to-full-file behavior?

# Step 3 Mockup: Skills And Commands

This file isolates Step 3 of the landing page guide so it can be expanded independently.

## Purpose

- Explain what commands and skills do in Claude Code
- Explain the difference between them
- Show why workflow assets should be built from real repeated work patterns
- Use your `/create-plan` and `frontend-design-theme-factory` example as the main case

## Core Message

Commands and skills are not collectible assets.
They are workflow packaging.

- `command` = the entry point the user triggers directly
- `skill` = a reusable instruction module activated when the task matches a known pattern

The best commands and skills come from your own repeated work.
Copying random packs from the internet usually creates noise instead of workflow quality.

## Desktop Wireframe

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Step 3 of 4                                                [01][02][03][04]
│ Turn repeated work patterns into commands and skills                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────┐    ┌────────────────────────────────┐ │
│  │ Explanation                      │    │ Graph: command -> skill flow   │ │
│  │ Compare command vs skill first.  │    │                                │ │
│  │ Then show one real trigger flow. │    │  User prompt                   │ │
│  │                                  │    │       ↓                        │ │
│  │ Why this matters                 │    │  /create-plan + prompt text   │ │
│  │ Good automation matches your     │    │       ↓                        │ │
│  │ real process, not generic packs. │    │  Claude loads command         │ │
│  │ Key takeaway                     │    │       ↓                        │ │
│  │ Fewer, sharper assets win.       │    │  command routes to skill      │ │
│  └──────────────────────────────────┘    │       ↓                        │ │
│                                          │ frontend-design-theme-factory │ │
│                                          │       ↓                        │ │
│                                          │  structured planning output    │ │
│                                          └────────────────────────────────┘ │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Real Example From This Workflow                                       │ │
│  │ Source: /create-plan + frontend-design-theme-factory                  │ │
│  │ [Summary] [Excerpt] [Why it matters]                                  │ │
│  │                                                                        │ │
│  │ Summary view: one command can route into a specialized skill when the  │ │
│  │ task matches a known workflow need.                                    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  [ Prev ]                                                   [ Next ]       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Content Draft

### Step Label

`Step 3 of 4`

### Title

`Turn repeated work patterns into commands and skills`

### Explanation

`Once Claude Code is configured, the next layer is workflow packaging. Commands are the entry points users invoke directly. Skills are reusable behavior modules that Claude Code can use when the task matches a known pattern. Together they turn your workflow from memory-based prompting into repeatable execution.`

### Why This Matters

`The goal is not to collect lots of AI assets. The goal is to encode the parts of your process that happen repeatedly. If a command or skill does not map to real work you actually do, it becomes noise.`

### Key Takeaway

`Create commands and skills from your own workflow. Do not copy random ones from the internet and expect them to fit.`

### Graph Idea

```text
User prompt
  -> Command
  -> Skill selection
  -> Structured execution

Example:
/create-plan
  -> frontend-design-theme-factory
```

## Landing Page Render Copy

### Main Copy

#### Title

`Use commands and skills to package repeated workflow patterns`

#### Body

`In Claude Code, commands and skills do different jobs. A command is how you enter the workflow. A skill is reusable logic that helps Claude handle a specific kind of task well. The goal is not to create many of them. The goal is to create the ones you actually use repeatedly.`

#### Why It Matters

`When these assets match your real workflow, Claude becomes more consistent. When they are generic, overlapping, or copied blindly, they create confusion instead of leverage.`

#### Key Takeaway

`Create fewer workflow assets, but make each one clearly useful.`

### Command vs Skill Comparison

Use a simple 2-column comparison block on the page:

- `Command`
  - user-triggered entry point
  - invoked directly, for example `/create-plan`
  - defines the starting workflow path
  - useful when the user already knows what they want to do

- `Skill`
  - reusable instruction module
  - triggered when the task matches its use case
  - adds specialized handling for a certain kind of work
  - useful when the same pattern appears repeatedly

### Real Workflow Example

#### Scenario

`The user runs /create-plan with prompt text that clearly asks for frontend theme direction. That prompt content matches the use case of frontend-design-theme-factory.`

#### Flow Explanation

`First, Claude Code loads the /create-plan command because that is the explicit entry point the user invoked. Then, while executing that command, Claude sees that the request includes a frontend theme-selection need. At that point, the workflow can trigger frontend-design-theme-factory, because that skill exists specifically for choosing theme and color direction when the user has no strong aesthetic direction yet.`

#### Graph Copy

```text
User prompt
  -> /create-plan
  -> Claude loads command instructions
  -> prompt matches frontend theme need
  -> frontend-design-theme-factory is triggered
  -> plan output becomes more specific and useful
```

### When To Create A Command Or Skill

- create a `command` when you have a repeatable workflow entry point you want to trigger directly
- create a `skill` when a specialized behavior keeps reappearing inside different tasks
- create either one only after you see a real repeated pattern, not before
- if a workflow pattern only happened once, it probably does not deserve its own asset yet

### Why You Should Not Copy Skills From The Internet As-Is

- their assumptions usually do not match your repo structure
- their triggers often do not match your actual task language
- their behavior may conflict with your standards and workflow habits
- generic skill packs often look useful but create poor routing in real usage

Recommended principle:
- borrow ideas
- rewrite the skill for your own workflow
- keep only the parts that match how you actually work

### When Skills Become Ineffective

- when there are too many skills with overlapping descriptions
- when one skill tries to handle too many unrelated goals
- when the descriptions are too generic, so Claude cannot route confidently
- when the skill is too abstract to help on real tasks
- when the workflow owner no longer knows which skill should be used for what

Short rule:
- one skill should solve one focused kind of problem well
- if the purpose is blurry, the skill will usually perform poorly in practice

## Example Source Candidates

- [`.claude/commands/create-plan.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/.claude/commands/create-plan.md)
- [`.claude/skills/frontend-design-theme-factory/SKILL.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/.claude/skills/frontend-design-theme-factory/SKILL.md)

## Example Panel Direction

### Rendering Rule

`Example` should load the full command file and the full skill file from the real workflow.

### What To Show

- full `.claude/commands/create-plan.md`
- full `.claude/skills/frontend-design-theme-factory/SKILL.md`
- visible file path above each viewer

### Why It Matters

`This step should let the user study the real command and the real skill together. That makes the difference between entry point and reusable module much easier to understand.`

### UX Notes

- use side-by-side tabs or stacked tabs for command and skill
- preserve the full file content
- keep the explanatory text outside the raw file view

## Detailed Guidance

### When To Create Commands And Skills

Create a command when:
- you have a repeated workflow entry point
- the user benefits from a named shortcut
- the action starts a recognizable process

Create a skill when:
- the same specialized behavior appears across tasks
- the task needs a consistent decision framework
- the behavior is focused enough to be reusable

Do not create either one just because the platform supports it.
Create them only when your workflow already proves they are needed.

### Why Not To Copy Internet Skills Without Rewriting

Copying a skill pack from the internet usually fails because:
- the author works in a different repo shape
- the author has different standards
- the descriptions and triggers are written for someone else's task language
- the skill may be too broad or too narrow for your actual workflow

That means a copied skill often looks productive in theory but routes badly in practice.

### Common Failure Modes For Skills

Skills stop being effective when:
- descriptions overlap too much
- one skill tries to solve many unrelated problems
- the skill purpose is too vague
- there are so many skills that Claude has weak routing signals
- the workflow owner cannot explain when the skill should actually be used

Good rule:
- keep skills narrow
- keep descriptions specific
- make the trigger conditions easy to understand

## Detail Topics To Expand Next

- command vs skill comparison table
- why not to copy packs from the internet
- why too many skills become harmful
- guidance for choosing which repeated work deserves automation

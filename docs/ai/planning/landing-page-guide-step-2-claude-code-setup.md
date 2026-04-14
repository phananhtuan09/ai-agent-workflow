# Step 2 Mockup: Claude Code Setup

This file isolates Step 2 of the landing page guide so it can be expanded independently.

## Purpose

- Show the baseline Claude Code configuration before workflow automation
- Explain `.claude/settings.json`, `.claude/statusline.sh`, and `.claude/CLAUDE.md`
- Explain why Claude Code CLI is a stronger workflow surface than using only an editor extension

## Core Message

Before building workflow logic, Claude Code itself should be configured as a safe and stable operating environment.
In this workflow, that environment is shaped by three independent surfaces:

- `settings.json`
  - controls what Claude Code is generally allowed to do
- `statusline.sh`
  - surfaces live session context while you work
- `CLAUDE.md`
  - gives each new session a consistent behavioral contract

## Desktop Wireframe

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Step 2 of 4                                                [01][02][03][04]
│ Set permissions, status line, and session instructions first               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────┐    ┌────────────────────────────────┐ │
│  │ Explanation                      │    │ Graph: 3 config surfaces       │ │
│  │ Configure Claude Code before     │    │                                │ │
│  │ designing workflow behavior.     │    │        Claude Code session     │ │
│  │                                  │    │         /      |       \       │ │
│  │ Why this matters                 │    │        /       |        \      │ │
│  │ Reduce friction without allowing │    │ settings   statusline   CLAUDE │ │
│  │ dangerous commands to run.       │    │ permissions  live context rules│ │
│  │ Key takeaway                     │    │                                │ │
│  │ Setup defines the environment.   │    │ Highlight: 3 files shape       │ │
│  └──────────────────────────────────┘    │ one working environment        │ │
│                                          └────────────────────────────────┘ │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Real Example From This Workflow                                       │ │
│  │ Source: settings.json + statusline.sh + CLAUDE.md                     │ │
│  │ [Summary] [Excerpt] [Why it matters]                                  │ │
│  │                                                                        │ │
│  │ Excerpt view: permission rules, custom status line, and session-level  │ │
│  │ instructions.                                                          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  [ Prev ]                                                   [ Next ]       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Content Draft

### Step Label

`Step 2 of 4`

### Title

`Set permissions, status line, and session instructions first`

### Explanation

`Before adding commands and skills, Claude Code itself should be configured properly. In this workflow, there are three separate config surfaces. `.claude/settings.json` controls tool permissions, especially what shell activity is broadly allowed and which dangerous commands are still blocked. `.claude/statusline.sh` shows live working context like model, current folder, git branch, and context usage. `.claude/CLAUDE.md` is the instruction file Claude Code loads when a new session starts, so the workflow begins with the same standards every time.`

### Why This Matters

`Most people either lock the tool down so hard that every useful action becomes friction, or they allow too much and lose control. Your setup is a middle path: broad permission for normal work, explicit denial for dangerous or high-impact commands, visible session context, and a stable instruction baseline.`

### Key Takeaway

`These files do different jobs, but together they turn Claude Code into a controlled working environment instead of just a chat interface.`

### Graph Idea

```text
                    Claude Code session
                   /         |          \
                  /          |           \
       settings.json   statusline.sh   CLAUDE.md
       permissions     live context    session rules

Three separate config surfaces shape one working environment.
```

## Landing Page Render Copy

This section is the shorter version intended for the actual website UI.
It should stay tighter than the internal planning notes below.

### Main Copy

#### Title

`Configure Claude Code before you build the workflow`

#### Body

`In this workflow, Claude Code is not used as a raw chat tool. It is configured first. Permissions define what the agent can do safely. The status line keeps the session readable while you work. CLAUDE.md ensures every new session starts with the same rules, coding philosophy, and response behavior.`

#### Why It Matters

`A good workflow starts with the environment the agent runs inside. If permissions are too loose, the tool becomes risky. If they are too strict, every useful action creates friction. If session rules are unclear, behavior drifts from one chat to the next.`

#### Key Takeaway

`These files are separate, but together they make Claude Code predictable.`

### Short Copy For Each Config Surface

#### `settings.json`

`Allow normal engineering work, but explicitly block destructive shell and risky git commands. This keeps the tool fast without giving away dangerous control.`

#### `statusline.sh`

`Show the model, current folder, git branch, and context usage so the session stays legible during long working loops.`

#### `CLAUDE.md`

`Load the same common rules into every new session. Keep it short, reusable, and focused on behavior that should always apply.`

### Short Copy For `CLAUDE.md`

#### What It Does

`Claude Code loads CLAUDE.md at the start of every new session. That makes it the right place for common rules and repeatable behavior, not temporary task details.`

#### Why Your File Works Well

`This CLAUDE.md is effective because it stays focused on durable rules: write simple code, ask when ambiguity matters, and only present multiple options when there is a real trade-off. These are rules that improve almost every session.`

#### Important Constraint

`Do not make CLAUDE.md too long. It is loaded repeatedly, so unnecessary content wastes context budget.`

#### Practical Trick

`/init` is a useful way to generate a first version of CLAUDE.md by scanning the codebase. It is a good shortcut, but on large repositories it can cost a lot of quota, so it should be used carefully.`

## Example Source Candidates

- [`.claude/settings.json`](/Users/mac/Desktop/source-codes/ai-agent-workflow/.claude/settings.json)
- [`.claude/statusline.sh`](/Users/mac/Desktop/source-codes/ai-agent-workflow/.claude/statusline.sh)
- [`.claude/CLAUDE.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/.claude/CLAUDE.md)

## Example Panel Direction

### Rendering Rule

`Example` should load the exact full contents of `.claude/settings.json`, `.claude/statusline.sh`, and `.claude/CLAUDE.md`.

### What To Show

- tab 1: full `settings.json`
- tab 2: full `statusline.sh`
- tab 3: full `CLAUDE.md`
- each tab should display the original path clearly

### Why It Matters

`This step is much stronger when users can inspect the exact config instead of only reading a summary. They should be able to see the real permission rules, the real status line script, and the real CLAUDE.md contract in full.`

### UX Notes

- keep the explanation area separate from the file viewer
- use syntax highlighting per file type
- allow vertical scrolling inside the file viewer
- do not truncate long files by default
- if needed, add a "copy path" or "open in repo" action near the file name

## Detail Topics To Expand Next

- why your `settings.json` uses broad `Bash(*)` allowance plus explicit deny rules
- why blocking destructive shell commands and risky git commands fits your workflow
- why the status line focuses on model, folder, branch, and context usage
- why CLI is better than extension for workflow building:
  - permissions are more explicit
  - shell and git context are first-class
  - session instructions are easier to reason about
  - less hidden editor behavior
- how `CLAUDE.md` should be written effectively:
  - stable rules only
  - no temporary task details
  - optimize for every-new-session reuse

## Why This Specific Setup Makes Sense

### 1. `.claude/settings.json`

Your config allows the core tools Claude Code needs for real work:

- `Read`
- `Edit`
- `Write`
- `Glob`
- `Grep`
- `WebFetch`
- `WebSearch`
- `mcp__*`
- `Bash(*)`

But you do not leave shell access fully open.
You explicitly deny:

- destructive shell commands like `rm -rf`, `dd`, `mkfs`
- privilege escalation commands like `sudo`, `su`
- account/system modification commands like `passwd`, `useradd`, `userdel`, `usermod`
- scheduled task changes like `crontab`
- high-impact git commands like `commit`, `push`, `pull`, `merge`, `rebase`, `checkout`, `switch`, `reset`, `restore`, `clean`

Why this config makes sense:
- broad allow keeps Claude Code fast for normal engineering work
- explicit deny protects against dangerous accidents
- blocking git mutation commands is especially useful when you want the agent to change code but not silently alter repository history or branch state
- this reduces approval noise without giving away destructive control

### 2. `.claude/statusline.sh`

Your status line script reads session JSON input and prints:

- active model name
- current folder name
- current git branch when available
- context usage percentage when available

Why this config makes sense:
- model name matters because behavior and cost can differ by model
- current folder matters when you work across repositories or nested projects
- branch visibility reduces git mistakes during long sessions
- context usage helps you notice when the conversation is getting heavy and may need summarization or reset

This is not workflow logic.
It is operator visibility.
That is why it should be treated as a separate config surface from permissions and instructions.

### 3. `.claude/CLAUDE.md`

Your `CLAUDE.md` is not a task-specific prompt.
It is a compact operating contract for new sessions.

How it works:
- Claude Code loads `CLAUDE.md` when a new session starts
- that means the file affects Claude before the task-specific prompt begins
- it is best used for stable instructions you want Claude to follow every time it responds
- it should not be overloaded with temporary project tasks or one-off requests

The file defines:
- coding philosophy
- when to ask clarifying questions
- how to present options
- tooling preferences
- communication rules
- code presentation rules
- todo discipline

Why this config makes sense:
- these rules are stable enough to reuse across many sessions
- they encode how you want the agent to behave before any task-specific prompt appears
- they reduce drift between sessions because Claude starts from the same baseline every time

How to write `CLAUDE.md` effectively:
- keep it focused on common rules and repeatable behavior
- prefer durable guidance over temporary task notes
- avoid writing it too long, because it consumes context on every new session
- use it for principles, standards, and workflow habits that should always apply

What belongs in `CLAUDE.md`:
- coding philosophy
- communication style
- decision-making rules
- code quality expectations
- workflow habits like when to ask questions or when to offer trade-offs

What should not usually live there:
- feature-specific requirements
- temporary project tasks
- long examples that are rarely needed
- large amounts of documentation copy

Why your current file is a strong example:
- it is opinionated without being bloated
- it defines clear coding philosophy instead of vague "write good code" advice
- it sets explicit behavior triggers, such as asking when ambiguity is risky
- it explains when multiple options are appropriate and ties them to real trade-offs

Three especially strong ideas in your current `CLAUDE.md`:

#### A. Simplicity First

Your file tells Claude to prefer simple, readable solutions by default.
That matters because coding agents naturally tend to over-build when prompts are underspecified.

Why this rule is powerful:
- it reduces over-engineering
- it keeps code review easier
- it makes the output more maintainable for humans
- it prevents the agent from inventing abstractions for hypothetical future needs

This is a very good example of the kind of instruction that belongs in `CLAUDE.md` because it should affect almost every coding task.

#### B. Ask When Needed

Your file explicitly says Claude should ask when requirements, edge cases, or expected behavior are unclear.

Why this rule is powerful:
- it prevents low-confidence guessing
- it reduces expensive wrong turns
- it pushes the agent to clarify risky ambiguity instead of hiding it

This is especially useful because many AI failures do not come from lack of effort.
They come from confidently acting on bad assumptions.

#### C. Multiple Options With Real Trade-Offs

Your file also says Claude should only present multiple options when there is a genuine trade-off.
That is a very strong instruction.

Why this rule is powerful:
- it prevents fake thoroughness
- it stops the agent from listing shallow alternatives just to sound complete
- it forces options to be tied to actual costs and user priorities

This improves answer quality because the user sees fewer but more meaningful choices.
It also makes the workflow feel more senior and more practical.

In other words:
- `CLAUDE.md` should not just tell Claude what to do
- it should tell Claude how to think about trade-offs and uncertainty

#### /init As A Practical Trick

Another useful technique is running `/init` inside Claude Code.

Why it helps:
- Claude scans the source base
- it can generate a first version of `CLAUDE.md`
- this is a practical way to bootstrap rules from the real codebase instead of writing everything from scratch

Important caveat:
- on large codebases, `/init` can consume a lot of quota
- that makes it useful as a starting point, but not something you should run carelessly in very large repositories

Best use:
- use `/init` to generate a baseline
- then manually tighten and simplify the result
- keep only the instructions that should truly apply to every new session

### 4. Why CLI Over Extension

For this workflow, Claude Code CLI is a better foundation than relying on an editor extension.

Why:
- permission boundaries are more explicit
- shell usage is a first-class part of the experience
- status line visibility makes session state legible
- config files like `settings.json` and `CLAUDE.md` are easier to reason about as workflow assets
- the workflow stays tool-oriented instead of being hidden inside editor UI behavior

This matters because you are designing a workflow system, not just a coding convenience layer.

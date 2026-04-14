# Step 4 Mockup: Workflow Phases

This file isolates Step 4 of the landing page guide so it can be expanded independently.

## Purpose

- Explain the workflow phases clearly
- Show how work moves through `requirement`, `plan`, `implement`, `review`, and `testing`
- Position the repository as a concrete reference for phase-based AI delivery

## Core Message

A strong AI workflow should mirror how a good developer already works without AI.
When a developer handles a real task carefully, the work usually breaks into the same kinds of stages:

- requirement
- plan
- implement
- review
- testing

This workflow keeps those same stages instead of collapsing everything into one long prompt session.
Each phase exists to reduce ambiguity before the next phase starts.
The point is not to make development feel heavier.
The point is to make the process explicit enough that both the human and the AI agent can follow it reliably.

## Desktop Wireframe

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Step 4 of 4                                                [01][02][03][04]
│ Structure the work into requirement, plan, implement, review, testing     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────┐    ┌────────────────────────────────┐ │
│  │ Explanation                      │    │ Graph: workflow phases         │ │
│  │ Good AI workflow mirrors how a   │    │                                │ │
│  │ strong developer already works.  │    │ Requirement -> Plan           │ │
│  │                                  │    │              -> Implement      │ │
│  │ Why this matters                 │    │              -> Review         │ │
│  │ Each phase reduces ambiguity     │    │              -> Testing        │ │
│  │ before the next one begins.      │    │                                │ │
│  │ Key takeaway                     │    │ Highlight: full phase chain    │ │
│  │ The workflow is a clear sequence.│    │                                │ │
│  └──────────────────────────────────┘    └────────────────────────────────┘ │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Real Example From This Workflow                                       │ │
│  │ Source: requirements + planning + project docs                        │ │
│  │ [Summary] [Excerpt] [Why it matters]                                  │ │
│  │                                                                        │ │
│  │ Why it matters view: the repo already breaks work into explicit docs   │ │
│  │ and phases, which makes it a good teaching example.                    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  [ Prev ]                                                 [ Finish ]       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Content Draft

### Step Label

`Step 4 of 4`

### Title

`Structure the work into requirement, plan, implement, review, testing`

### Explanation

`These five phases are not arbitrary. They map closely to how a developer already works when handling a serious task without AI. First you read the task and make the requirement clear. Then, if the work is large or risky, you create a plan. Then you implement. After that, you review the result, both by self-review and by getting a senior or lead to review the PR when needed. Finally, you write and run tests. This workflow keeps the same structure because AI works better when the process is already explicit.`

### Why This Matters

`Without explicit phases, the session turns into one long stream of prompting. That makes it hard to know what the source of truth is, what has been decided, what has been reviewed, and what is still missing.`

### Key Takeaway

`A strong AI workflow does not invent a new process. It makes the normal engineering process explicit enough for the agent to follow.`

### Graph Idea

```text
Requirement
  -> Plan
  -> Implement
  -> Review
  -> Testing
```

## Landing Page Render Copy

### Main Copy

#### Title

`Keep the same five phases a strong developer would already use`

#### Body

`This workflow uses five phases because a good developer already works this way without AI: clarify the requirement, create a plan if the task is large, implement, review, and test. AI should follow that structure instead of replacing it with one long prompt session.`

#### Why It Matters

`The clearer each phase is, the easier it becomes to check output quality, detect mistakes early, and hand context from one step to the next.`

#### Key Takeaway

`The workflow works because the phases match real engineering work.`

### Phase-By-Phase Message

#### Requirement

`Requirement comes first because you need to understand the feature yourself before asking the agent to build it. If you do not understand what the feature is supposed to do, then when the AI gets it wrong you will not be able to review, correct, or redirect it properly. A strong requirement becomes the source of truth for every later phase.`

#### Plan

`For larger tasks, the plan should be a real file, not just an internal AI planning mode. But the plan should also stay small enough to be executable. If one plan becomes too large or too complex, the agent can drift, forget details, or lose alignment. Bigger work should be split into epics and multiple linked plans.`

#### Implement

`Implementation should follow the plan instead of improvising from memory.`

#### Review

`Review should check more than style. It should check code conventions, performance, security, and business logic. For complex features, review should also read specs so logic can be checked against the intended behavior.`

#### Testing

`Testing closes the loop and confirms that the implementation actually matches the intended behavior.`

## Example Source Candidates

- [`.claude/output-styles/brainstorm-partner.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/.claude/output-styles/brainstorm-partner.md)
- [`.claude/commands/requirements-orchestrator.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/.claude/commands/requirements-orchestrator.md)
- [`.claude/commands/create-plan.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/.claude/commands/create-plan.md)
- [`.claude/commands/development-orchestrator.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/.claude/commands/development-orchestrator.md)
- [`.claude/commands/code-review.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/.claude/commands/code-review.md)
- [`docs/ai/planning/feature-template.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/docs/ai/planning/feature-template.md)
- [`docs/ai/project/README.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/docs/ai/project/README.md)

## Example Panel Direction

### Rendering Rule

`Example` should load the exact full files used to represent the workflow phases.

### What To Show

- full `.claude/output-styles/brainstorm-partner.md`
- full `.claude/commands/requirements-orchestrator.md`
- full `.claude/commands/create-plan.md`
- full `.claude/commands/development-orchestrator.md`
- full `.claude/commands/code-review.md`
- full `docs/ai/planning/feature-template.md`
- full project workflow guide where implementation, review, and testing are described

### Why It Matters

`This step should let the user inspect the real documents that carry the workflow. The goal is not just to describe the phases, but to show the actual files where those phases live and how the workflow uses them.`

### UX Notes

- use file tabs to switch between phase documents
- keep the active phase visually linked to the active file
- large markdown files should render fully inside a scrollable panel

## Detailed Guidance

### Why These 5 Phases Exist

These five phases are not AI-specific invention.
They mirror the shape of normal engineering work:

- `Requirement`
  - read the task
  - clarify the real requirement
  - remove ambiguity
- `Plan`
  - if the task is large or difficult, think through the implementation path first
- `Implement`
  - write the code
- `Review`
  - self-review first
  - then let senior or lead review the PR when appropriate
- `Testing`
  - write and run tests to confirm the implementation

That is why this phase model is strong.
It aligns AI work with a process developers already trust.

Another way to say it:
- the workflow is not trying to replace engineering thinking
- it is trying to preserve engineering thinking when AI is added
- the phases exist so the human stays able to inspect and control the work

### Why Requirement Quality Matters So Much

Requirement quality is the foundation for everything after it.

Why:
- later phases can only be correct if the requirement is correct
- requirement becomes the reference used to compare output
- requirement becomes the source of truth the AI agent reads
- more detailed and precise requirements usually lead to better implementation quality

This is especially important with AI agents because they amplify input quality.
If the requirement is vague, the agent can still produce a lot of output, but the output may be confidently wrong.

That is the dangerous part:
- AI can fail in a way that still looks productive
- long output can create a false sense of progress
- but if the requirement was weak, later phases are often only optimizing the wrong thing

Strong requirement guidance for this step:
- define the problem clearly
- define expected behavior clearly
- define scope and non-scope
- define acceptance criteria
- make edge cases explicit when possible

There is also a more basic point:
- you need to understand the feature yourself
- if you do not understand the spec, you will not be able to tell when the AI is wrong
- and if you cannot review the AI's output, the workflow breaks very early

That is why requirement is not just an AI input artifact.
It is also a human understanding phase.

This point is important enough to make explicit on the page:
- requirement quality is not only about feeding the AI
- requirement quality is also about making the human reviewer competent enough to judge the output

### Two Good Ways To Build Requirement In This Workflow

#### 1. Q&A To Clear Specs First

If you do not understand the feature or spec yet, one effective approach is to use back-and-forth Q&A with the agent before writing the requirement.

Why this works:
- it helps you clarify flow, architecture, and technical constraints
- it exposes missing assumptions early
- it lets you understand the problem before turning it into a durable spec

In your workflow, a strong example is:
- [`.claude/output-styles/brainstorm-partner.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/.claude/output-styles/brainstorm-partner.md)

Why this is a good fit:
- it is explicitly read-only
- it is designed for vague ideas and unclear direction
- it encourages clarification before implementation

When this mode is most useful:
- the feature idea is still fuzzy
- you are unsure about edge cases
- the architecture or technical constraints are not clear yet
- you feel that you are not ready to write the requirement as a durable document

#### 2. Generate A Full Spec With Requirement Orchestration

If the feature is complex enough, another effective approach is to use the requirement orchestration command to coordinate multiple specialized sub agents and produce a more complete specification file.

In your workflow, that example is:
- [`.claude/commands/requirements-orchestrator.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/.claude/commands/requirements-orchestrator.md)

What it does:
- coordinates BA, SA, Researcher, and UI/UX style agents
- collects structured requirement context
- produces a fuller requirement doc

Warning:
- this flow can consume a lot of quota
- if the conversation runs long, the orchestration cost increases quickly

This trade-off should be stated clearly:
- the orchestrated flow is stronger when the feature has many unknowns
- but it is not the cheap default path
- use it when the extra structure is worth the extra cost

Suggested graph for this requirement-orchestrator example:

```text
User request
  -> requirements-orchestrator
  -> BA agent
  -> SA agent
  -> Researcher agent (if needed)
  -> UI/UX agent (if needed)
  -> consolidated requirement doc
```

### Why Plan Should Be A Real File

For larger tasks, it is better to let the AI agent create a real plan document than rely only on the default internal planning mode of the tool.

Why:
- every AI tool has its own plan format
- a custom plan file is easier for developers to review in their own preferred structure
- the plan file lives in the source tree and becomes reusable context later
- if implementation changes are needed, you can send the plan file back to the agent and it already has strong context
- the same plan file can be reused during review to check whether implementation matched the intended path

This is one of the biggest practical advantages of a file-based workflow:
- context stops living only inside one transient chat
- the plan becomes a stable artifact in the repository
- both humans and future AI sessions can use the same source of context

This is why your workflow uses planning assets like:
- [`.claude/commands/create-plan.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/.claude/commands/create-plan.md)
- [`docs/ai/planning/feature-template.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/docs/ai/planning/feature-template.md)

The command gives the workflow entry point.
The template gives the planning structure developers can review.

### Why Plans Should Not Become Too Large

You should not create one giant plan for a feature that is too large, too complex, or too cross-cutting.

Why:
- long plans are harder for the AI to stay aligned with
- the agent can forget details or drift away from the intended structure
- review becomes harder because too many concerns are mixed together

Better approach:
- split the work into an epic
- create multiple smaller linked plans
- keep each plan focused enough that the implementation phase can actually follow it well

This matters because implementation quality depends on plan executability, not just plan completeness.
A huge plan can look thorough but still be weak in practice if the agent cannot hold it coherently during execution.

Also:
- for complex features, create the requirement/spec first
- only after that should you create the plan

In your workflow, a good example is:
- [`.claude/commands/development-orchestrator.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/.claude/commands/development-orchestrator.md)

Why this command matters:
- it routes between investigation, gate, plan, and review
- it can create an epic when the work is multi-slice or dependency-heavy
- it helps prevent large work from being forced into one weak plan

This is the right kind of orchestration:
- do not use orchestration just to make the workflow look advanced
- use it when scope is big enough that one plan is no longer the right unit of execution

Suggested graph for this development-orchestrator example:

```text
User feature request
  -> development-orchestrator
  -> classify size and type
  -> investigate and gate
  -> create epic if work is large
  -> generate linked feature plans
  -> review plan readiness
```

### Why Review Needs Multiple Angles

Review should not stop at code style or surface-level correctness.

It should check:
- code conventions
- performance
- security
- business rules

Why this matters:
- convention issues make code harder to maintain
- performance and security are common weak points during AI implementation
- business rule mistakes can pass tests but still be wrong for the product

This is a useful mindset for the page:
- implementation often looks "done" earlier than it really is
- review is the phase that checks whether "done" actually means correct, safe, maintainable, and aligned with the product

If code convention matters strongly, it helps to keep those rules in a dedicated file so the reviewing AI agent can read them consistently.

If the feature is complex, it also helps to provide extra specification files during review so the agent can check logic against the intended behavior, not just against the code itself.

That means review context should often include:
- the code diff
- project rule files
- the requirement or spec
- the plan when relevant

Without those artifacts, review tends to collapse into shallow style commentary.

In your workflow, a strong review example is:
- [`.claude/commands/code-review.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/.claude/commands/code-review.md)

Why this command is useful:
- it separates standards conformance review from broader quality review
- it reminds the workflow that review is not one-dimensional
- it creates a place to check both explicit project rules and higher-level quality concerns

That separation is valuable because:
- some review rules are explicit and objective
- others require judgment
- combining both into one vague review pass usually lowers review quality

### Graph Direction For This Step

The graph for this step should always show the full sequence:

```text
Requirement
  -> Plan
  -> Implement
  -> Review
  -> Testing
```

The graph should emphasize that each phase hands context to the next one.

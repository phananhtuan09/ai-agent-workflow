# Workflow Design Rules

## 1. Token Efficiency
Only use a pattern if it reduces total token usage or improves output quality compared to a simpler approach. If the benefit is unproven, do not add it.

EX: Adding a multi-agent setup that coordinates 3 agents but produces the same output as 1 agent costs more tokens with no gain — do not add it.

## 2. Human Readable
Every step in the workflow must be understandable by a human: what goes in, what comes out. Artifacts must stay within line limits so they can be reviewed without tooling.

EX: A spec or plan file kept under 100 lines means a human can read and catch problems before execution. A 300-line plan cannot be reviewed quickly and defeats the purpose of human oversight.

## 3. Add Only What Is Used
Do not add a command, skill, or artifact type unless it is used regularly across real tasks. Do not add anything to the workflow without first verifying it produces better results in practice.

EX: Adding 10 skills to the workflow when only 3 are regularly invoked makes the workflow harder to maintain and wastes context. Only promote a skill to the workflow after it proves useful on real tasks.

## 4. Separate AI and Human Responsibility
Be explicit about what the agent has verified and what requires human judgment. Never mark something as done if it can only be confirmed by a human.

EX: After `/execute-plan`, the summary must list what the agent verified automatically (build passes, logic matches plan) separately from what the human must check manually (UI looks correct, edge case under real data). Mixing both into one checklist hides what still needs attention.

---
name: prompt-leverage
description: Rewrite a raw user prompt into a short, outcome-focused prompt for a capable AI agent, organized as Expected output, Effort, and How to verify, in the same language the user wrote in. Use only when the user asks to rewrite or improve a prompt they are about to give an AI agent. Do not use when editing prompts that live in application code or configuration, such as system prompts or prompt templates.
---

# Prompt Leverage

Rewrite the user's prompt so a capable model knows what the user wants it to do, how much effort the user wants it to spend, and how it should verify that it did the right thing.
Modern models reason well on their own; the rewrite sets the target and the bar, not the path.

## Language

Write the whole rewritten prompt, including section headings, in the language the user used when invoking this skill.
If the user writes in Vietnamese, the output is Vietnamese; never default to English.
Keep code, identifiers, file paths, commands, and quoted text exactly as given.

## Staying faithful to the original

Before writing, sort every point you intend to include into one of three kinds:

- **Stated**: the user said it. Include it as a requirement, keeping the user's wording where possible.
- **Inferred**: you are guessing it. Leave it out unless the executing model would clearly go wrong without it; if kept, label it as an assumption the model may revise.
- **Missing**: the task needs it and neither the prompt nor the repository can answer it. Write it as an open question for the model to ask the user, never as an invented answer.

Never present an inferred point as something the user asked for.
Before returning, check that every sentence in the rewrite traces back to the original prompt or is explicitly marked as an assumption or open question.

## Rewrite rules

- Preserve the user's intent, scope, constraints, and tone.
- Describe the goal and the finished state, not the steps to get there.
- Do not decompose one request into numbered sub-tasks, phases, or a step-by-step procedure; leave planning and approach to the executing model.
- Keep it short: each section is usually one to three sentences or a few bullets.
- Prefer concrete, observable criteria over quality adjectives such as "clean", "robust", or "high quality".

## Output format

Return the rewritten prompt with exactly these three sections, headings translated into the user's language.
If the original prompt is already clear, add one line before the sections saying so, and keep the edits minimal.

### Expected output

What the user wants the model to do and what the finished result looks like.
Include the constraints and boundaries the user stated.
End with any assumptions and open questions, each clearly labeled.

### Effort

How much effort the user wants the model to spend, written as a natural-language instruction to the model, not a label.
Cover how deeply to invest, whether to iterate on the result, and when to stop, for example "Do the obvious thing and stop" or "Make it really good, use plenty of tokens, and iterate until you are proud of it".
Take it from the user's words when they express it, such as "quick", "thorough", or "iterate until it is right".
If the user did not express it, propose a level that fits the expected output and label it as an assumption the user can change.

### How to verify

How the model should check that it did the right thing before reporting completion: the evidence, checks, or observations that prove the expected output was met.
Match the depth of verification to the effort, and require the model to report honestly anything it could not verify.

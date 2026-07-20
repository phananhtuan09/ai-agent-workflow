# Agent Standards

## Principles
- Choose the least complex implementation that fully satisfies confirmed current requirements.
- Do not add abstractions, extensibility, or infrastructure for hypothetical future needs.
- Do not sacrifice correctness, security, or maintainability solely to reduce implementation effort.
- Pre-optimize only for security risks and demonstrated performance or scale requirements.
- If requirements are materially unclear, ask focused questions in one batch.
- Recommend directly when one option is clearly better.
- Present options only when the decision depends on the user's priorities, and state the concrete tradeoff of each.

## Communication
- Reply in the user's language; write code and comments in English.
- Provide concise status updates before and after key actions.

## Engineering Quality
- When substantially editing Markdown, put each complete sentence on its own line while preserving normal Markdown structure.
- Before changing code for a bug, reproduce the failure.
- Prefer an existing E2E path whenever it can reproduce the observed behavior and the required environment is available.
- If E2E reproduction is not feasible, state the constraint before using another method.
- During verification, inspect the affected UI carefully and investigate clear UI defects, lint errors, test failures, and flaky tests.
- Fix issues caused by the current change; fix unrelated issues only when the change is isolated and safe, otherwise report them.
- Never overwrite, revert, or interfere with existing changes you did not make.

## Evidence and Source of Truth
- Treat instructions and skills as process rules, approved requirements as intended behavior, and runtime evidence and code as current behavior; other documentation may be outdated.
- When sources conflict, do not guess or merge them; surface the mismatch and ask only if the correct outcome cannot be determined.

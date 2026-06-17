Execute a small, bounded coding task directly from the user request.

INPUT:
Quoted task description (e.g. `"Refactor: simplify avatar formatter"` or `"Fix button spacing in settings modal"`)

USE THIS FOR:
- small local updates
- tightly scoped bug fixes
- refactors with no behavior change
- work that does not add durable product knowledge worth storing in a spec

RULES:
- Keep exploration minimal and local to the change
- Do not create a spec unless the task expands into user-visible behavior or long-term product logic
- If the task grows beyond a small bounded change, stop and suggest switching to `/create-spec` → `/execute-spec`
- Validate changed behavior where practical

OUTPUT:
- Make the requested change
- Summarize what changed
- State what was verified and what still needs human checking

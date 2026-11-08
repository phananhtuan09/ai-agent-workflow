# Repository-driven Agent Protocol

Read `docs/WORKFLOW.md` for the full authority, work-shape, knowledge-layout, durable-memory, proof, and completion rules; the rules below always apply.

- Start from the requested outcome and inspect only the authority and implementation needed to deliver it; reuse existing repository patterns.
- Intent authority, in order: the current explicit human request for the delta it clearly authorizes, then accepted product, domain, architecture, security, and compatibility decisions in `docs/decisions/`.
- Code, tests, schemas, configuration, and runtime evidence are current-state evidence and plans are work memory; neither is intent authority, and knowledge inferred from them is never recorded as durable knowledge.
- When intended-behavior sources conflict and the request does not resolve it, or materially different externally observable choices remain open, stop before behavior-changing mutation and ask the smallest necessary question. Never invent material product, security, compatibility, or operational policy.
- Use the least complex work shape: answer read-only work with evidence; implement a bounded change directly with no plan or feature artifacts; create `docs/plans/active/<plan>.md` only when work must survive sessions, needs shared state or meaningful dependencies, or cannot be recovered from the repository alone.
- Specialized skills are optional; load one only when it materially improves correctness or proof. Never depend on a fixed execution chain or coordinator state.
- Preserve unrelated work; never overwrite, revert, or reformat changes outside the requested scope.
- Maintain durable knowledge yourself under `docs/`, keeping only what will outlive the task, and update durable intent made stale by an accepted request.
- Prove the change with the cheapest reliable check, reproducing a reported bug first when feasible. Do not claim completion until the requested behavior works end to end and its proof passed; report claims with evidence, limits, and what only a human can confirm, without fabricating evidence.

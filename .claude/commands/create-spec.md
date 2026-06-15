Create a spec file for the described feature.

PROCESS:
0. Start with a provisional complexity classification based on the current request.
   - Score +1 for each true condition:
     - More than 1 primary user flow
     - Persistence across session or restart
     - Validation rules or hard limits
     - Fallback or degraded behavior
     - Empty/error states that must be defined
     - Reset/default-selection behavior
     - Migration or backward compatibility expectations
     - More than 2 affected surfaces
     - Quota/permission/gating behavior
     - More than 8 expected acceptance criteria
   - Tier by score:
     - 0-2 = Lite
     - 3-5 = Standard
     - 6+ = Extended
   - Forced minimum tier rules:
     - If the feature includes migration, fallback, or quota behavior, it cannot be Lite
     - If the feature has more than 3 distinct behavior areas, it cannot be Lite
     - Distinct behavior areas means separate user-facing behavior clusters such as setup/configuration, main action flow, persistence, sharing/export, fallback/recovery, or admin controls
1. Evaluate whether the current description already covers: problem, scope, key behavioral rules, edge cases, and out of scope
2. If critical information is missing:
   - Ask only the missing questions (max 5), batch them into one block, then wait for answers
   - After answers arrive, reclassify complexity if needed before writing the spec
3. If sufficient:
   - Write the spec directly
   - In the assistant response, note: "No questions needed — proceeding with provided context"
4. Choose the spec size target by the final tier:
   - Lite: 25-39 lines
   - Standard: 40-90 lines
   - Extended: 91-140 lines
5. If the feature cannot be specified clearly within the target range:
   - Lite should usually stay within 7 ACs
   - Standard should usually stay within 12 ACs
   - Extended should usually stay within 18 ACs
   - If an Extended spec would exceed 18 ACs or 140 lines, you must either split it into sub-features or add a short addendum
   - Do not bloat the main spec file to absorb unrelated or weakly related behavior
6. Write the spec file to `docs/ai/specs/{feature-name}.md`
   - `{feature-name}` must be a kebab-case slug derived from the feature name

SPEC FORMAT (concise, bullet-first, behavior-complete — no implementation details):

## Tier
[`Lite` | `Standard` | `Extended`]

## Problem
[1-2 sentences: what is broken or missing]

## Scope
[2-6 bullets: what the feature does for the user and what is included in this request]

## Key Behavioral Rules
[Use as needed. For Standard/Extended, usually 3-8 bullets. Include persistence, validation, fallback, reset/default behavior, visible output rules, compatibility expectations, or other constraints that affect acceptance.]

## Acceptance Criteria
[Lite specs may use a flat list. Standard/Extended specs should group ACs by behavior area.]

### {Behavior area 1}
- [ ] AC1: ...
- [ ] AC2: ...

### {Behavior area 2}
- [ ] AC3: ...

## Edge Cases / Failure States
- ...
- If there are no meaningful edge cases in scope, write: `- Không có edge case đáng kể trong phạm vi này.`

## Out of Scope
- ...

## Open Questions
- ...
- If there are no open questions, write: `- Không có.`

RULES:
- All assistant responses, questions, and generated spec files must be written in Vietnamese
- Do not include implementation details such as file paths, function names, schema/model names, framework choices, storage keys, or code structure
- You may include behavioral constraints that are required to keep planning bounded: validation limits, persistence scope, fallback behavior, reset/default behavior, compatibility expectations, and visible error/empty states
- Compatibility and migration expectations are allowed only at the user-visible or product-contract level, for example: old saved settings remain usable, upgrade does not force the user to reconfigure, or incompatible old selections reset safely
- Do not include migration mechanisms such as schema changes, migration scripts, table/collection changes, or refactor steps
- No project context (already provided by repository instructions such as `AGENTS.md`)
- Acceptance criteria must be verifiable and user-observable where applicable
- Group acceptance criteria by behavior area when the feature is Standard or Extended
- Keep paragraphs short; prefer bullets over prose
- If something is unclear after answers, list it in Open Questions and do not assume
- A spec is only valid if a planner can create a plan without inventing new product behavior

SELF-CHECK BEFORE WRITING THE FILE:
- Is the final tier still appropriate after any user answers?
- Did you write the final tier explicitly in `## Tier`?
- Does the spec stay within the target size for that tier?
- Does the AC count stay within the usual range for that tier? If not, did you split the feature or add a short addendum?
- Are all acceptance criteria testable?
- Are key persistence, validation, fallback, reset/default, and empty/error-state rules included when relevant?
- Are implementation details excluded?
- Can a planner create a plan from this spec without inventing new behavior?

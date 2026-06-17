---
name: create-spec
description: Use when the user asks to create a spec, write a specification, or define requirements for a feature. Creates a durable spec file in docs/ai/specs/ with both business intent and technical approach.
---

# Create Spec

Create a spec file for the described feature.

## Process

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
1. Evaluate whether the current description already covers: problem, scope, key behavioral rules, technical approach, edge cases, and out of scope
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

## Spec Format

```markdown
## Tier
[Lite | Standard | Extended]

## Problem
[1-2 sentences: what is broken or missing]

## Scope
[2-6 bullets: what the feature does for the user and what is included in this request]

## Key Behavioral Rules
[Use as needed. For Standard/Extended, usually 3-8 bullets. Include persistence, validation, fallback, reset/default behavior, visible output rules, compatibility expectations, or other constraints that affect acceptance.]

## Technical Approach
[Describe the intended implementation direction at the architecture/pattern level. No file-by-file task breakdown.]

## Architecture / Pattern Notes
[Optional. Use when existing project patterns, boundaries, or architectural constraints materially affect implementation.]

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

## Decision Log
- ...
- If there are no durable implementation decisions yet, write: `- Chưa có quyết định kỹ thuật bền cần ghi nhận.`
```

## Rules

- All assistant responses, questions, and generated spec files must be written in Vietnamese
- Include technical approach and architecture notes only at the durable design level
- Do not include implementation details such as file paths, function names, schema/model names, storage keys, or step-by-step code tasks
- You may include behavioral constraints that are required to keep planning bounded: validation limits, persistence scope, fallback behavior, reset/default behavior, compatibility expectations, and visible error/empty states
- Compatibility and migration expectations are allowed only at the user-visible or product-contract level
- Do not include migration mechanisms such as schema changes, migration scripts, table/collection changes, or refactor steps
- No project context (already provided by repository instructions such as `AGENTS.md`)
- Acceptance criteria must be verifiable and user-observable where applicable
- Group acceptance criteria by behavior area when the feature is Standard or Extended
- Keep paragraphs short; prefer bullets over prose
- If something is unclear after answers -> list it in Open Questions, do not assume
- A spec is only valid if an executor can implement from it and later sync it without inventing new product behavior

## Self-Check Before Writing The File

- Is the final tier still appropriate after any user answers?
- Did you write the final tier explicitly in `## Tier`?
- Does the spec stay within the target size for that tier?
- Does the AC count stay within the usual range for that tier? If not, did you split the feature or add a short addendum?
- Are all acceptance criteria testable?
- Are key persistence, validation, fallback, reset/default, and empty/error-state rules included when relevant?
- Does the technical approach stay at a durable architecture/pattern level?
- Are low-level implementation details excluded?
- Can an executor implement from this spec and later sync it without inventing new behavior?

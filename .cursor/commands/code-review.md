You are helping me perform a local code review **before** I push changes. This review is restricted to standards conformance only.

## Step 1: Gather Context (minimal)
- Ask for feature name if not provided (must be kebab-case).
- Then locate and read:
  - Planning doc: `docs/ai/planning/feature-{name}.md` (for file list context only)
  - Implementation doc: `docs/ai/implementation/feature-{name}.md` (for file list context only)

## Step 2: Standards Focus (only)
- Load project standards:
  - `docs/ai/project/CODE_CONVENTIONS.md`
  - `docs/ai/project/PROJECT_STRUCTURE.md`
- Review code strictly for violations against these two documents.
- **Do NOT** provide design opinions, performance guesses, or alternative architectures.
- **Do NOT** infer requirements beyond what standards explicitly state.

## Step 3: File-by-File Review (standards violations only)
For every relevant file, report ONLY standards violations per the two docs above. Do not assess broader design or run git commands.

## Step 4: Cross-Cutting Concerns (standards only)
- Naming consistency and adherence to CODE_CONVENTIONS
- Structure/module boundaries per PROJECT_STRUCTURE

### Standards Conformance Report (required)
- After reviewing `CODE_CONVENTIONS.md` and `PROJECT_STRUCTURE.md`, list violations in this exact format:
```
- path/to/file.ext — [Rule]: short description of the violated rule
```
- Only include clear violations. Group similar violations by file when helpful.

## Step 5: Summarize Findings (rules-focused)
Provide results in this structure:
```
### Summary
- Blocking issues: [count]
- Important follow-ups: [count]
- Nice-to-have improvements: [count]

Severity criteria:
- Blocking: Violates CODE_CONVENTIONS or PROJECT_STRUCTURE causing build/test failure, security risk, or clear architectural breach.
- Important: Violations that don't break build but degrade maintainability/performance or developer ergonomics.
- Nice-to-have: Style/consistency improvements with low impact.

### Detailed Notes
1. **[File or Component]**
   - Issue/Observation: ...
   - Impact: (blocking / important / nice-to-have)
   - Rule violated: [Rule name from CODE_CONVENTIONS or PROJECT_STRUCTURE]
   - Recommendation: Fix to comply with [Rule]

2. ... (repeat per finding)

### Recommended Next Steps
- [ ] Address blocking issues
- [ ] Fix important violations
- [ ] Consider nice-to-have improvements
- [ ] Re-run code review command after fixes
```

## Step 6: Final Checklist (rules-focused)
Confirm whether each item is complete (yes/no/needs follow-up):
- Naming and formatting adhere to CODE_CONVENTIONS
- Structure and boundaries adhere to PROJECT_STRUCTURE

---

Let me know when you're ready to begin the review.

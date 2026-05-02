# Requirement: {Feature Name}

> Generated: {YYYY-MM-DD}
> Status: Draft | Review | Approved
> Complexity: Low | Medium | High
> Readiness: {0-100}% — missing: {item1}, {item2}
> References: {Jira ticket, Figma link, API docs}

Note: All content in this document must be written in English.

<!--
Review tags guide:
  [REVIEW]   — Read carefully and verify correctness before approving
  [SKIM]     — Quick scan to confirm, rarely wrong
  [REFERENCE]— Skip unless you have a specific concern; background info only
  [BLOCKING] — Must resolve all items here before this doc can be approved
-->

---

## Quick Links

| Document | Status |
|----------|--------|
| [BA Analysis](agents/ba-{name}.md) | ✅ Complete / ⏭️ Skipped |
| [SA Assessment](agents/sa-{name}.md) | ✅ Complete / ⏭️ Skipped |
| [Domain Research](agents/research-{name}.md) | ✅ Complete / ⏭️ Skipped |
| [UI/UX Design](agents/uiux-{name}.md) | ✅ Complete / ⏭️ Skipped |

---

## 1. Problem Statement `[REVIEW]`

<!-- Verify the problem framing is correct — wrong framing here invalidates everything below -->

### Context
{Business/technical context that led to this requirement}

### Problem
{The specific problem to be solved}

### Impact
{Consequences if not addressed - business value, user pain points}

---

## 2. Users & User Stories `[REVIEW]`

<!-- Verify all target user types are identified and no important user is missing -->

### Target Users

| User Type | Description | Primary Goals |
|-----------|-------------|---------------|
| {User 1} | {Who they are} | {What they want to achieve} |

### User Stories

| ID | Priority | As a... | I want to... | So that... |
|----|----------|---------|--------------|------------|
| US-01 | Must | {user} | {action} | {benefit} |
| US-02 | Must | {user} | {action} | {benefit} |
| US-03 | Should | {user} | {action} | {benefit} |

---

## 3. Functional Requirements `[REVIEW]`

<!-- Core of this doc — verify each FR is testable, correctly prioritized, and nothing critical is missing -->

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-01 | {Description} | Must | {How to verify} |
| FR-02 | {Description} | Must | {How to verify} |
| FR-03 | {Description} | Should | {How to verify} |
| FR-04 | {Description} | Could | {How to verify} |

**Priority Legend:** Must = critical for release · Should = important but not blocking · Could = nice to have

---

## 4. Business Rules `[REVIEW]`

<!-- These rules are implemented directly by AI — verify each condition/action is logically correct -->

| ID | Rule | Condition | Action |
|----|------|-----------|--------|
| BR-01 | {Rule Name} | When {condition} | Then {action} |
| BR-02 | {Rule Name} | When {condition} | Then {action} |

---

## 5. Technical Assessment `[REFERENCE]`

<!-- SA has already validated this — only read if you have concerns about feasibility or architecture direction -->

### Feasibility Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| Overall | ✅ Feasible / ⚠️ Conditional / ❌ Issues | {Summary} |
| Frontend | 🟢 Low / 🟡 Medium / 🔴 High | {Complexity notes} |
| Backend | 🟢 Low / 🟡 Medium / 🔴 High | {Complexity notes} |
| Data | 🟢 Low / 🟡 Medium / 🔴 High | {Complexity notes} |

### Recommended Architecture

{Brief description of recommended approach}

### Technology Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| {Layer} | {Tech} | {Why} |

### Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | {e.g., Response time < 200ms} |
| **Security** | {e.g., Authentication required} |
| **Compatibility** | {e.g., Chrome 90+, mobile responsive} |
| **Accessibility** | {e.g., WCAG 2.1 AA compliance} |

---

## 6. UI/UX Design `[REFERENCE]`

<!-- Full details in the linked agent file — only open if reviewing UI flows specifically -->

See: [UI/UX Design Document](agents/uiux-{name}.md)

Key screens: {Screen 1}, {Screen 2}

---

## 7. Domain Context `[REFERENCE]`

<!-- Full glossary and compliance details in the linked agent file — look up terms here when needed -->

See: [Domain Research](agents/research-{name}.md)

Key terms: {Term 1} = {definition}, {Term 2} = {definition}

---

## 8. Edge Cases, Constraints & Risks `[REVIEW]`

<!-- Verify risks have realistic mitigations and constraints won't block delivery -->

### Edge Cases

| ID | Category | Edge Case | Expected Behavior | Priority |
|----|----------|-----------|-------------------|----------|
| EC-01 | {Concurrency/Data/Network/Security/Performance} | {Description} | {How system should handle it} | Must/Should |

### Constraints

- **Technical**: {e.g., Must use existing auth system}
- **Business**: {e.g., Budget limit, timeline}
- **Dependencies**: {e.g., Requires API v2 ready}

### Technical Risks

| ID | Risk | Impact | Likelihood | Mitigation |
|----|------|--------|------------|------------|
| TR-01 | {Risk} | High/Med/Low | High/Med/Low | {Mitigation} |

---

## 9. Out of Scope `[SKIM]`

<!-- Quick scan to confirm no required feature was accidentally excluded -->

- {Feature/functionality not included}
- {Deferred to future iteration}

---

## 10. Open Questions `[BLOCKING]`

<!-- Resolve all items here before approving — unresolved blocking questions prevent implementation -->

| ID | Question | Owner | Due Date | Status | Blocking |
|----|----------|-------|----------|--------|----------|
| Q-01 | {Unresolved question} | {Who decides} | {YYYY-MM-DD} | Open | Yes/No |

---

## Related Plans (if applicable)

| Type | Document | Status | Scope |
|------|----------|--------|-------|
| Epic | [epic-{name}.md](../planning/epic-{name}.md) | open/in_progress/blocked/completed | {Requirement-wide tracking} |
| Feature Plan | [feature-{name}.md](../planning/feature-{name}.md) | open/in_progress/blocked/completed | {FR-01, FR-02} |

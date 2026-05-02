# Requirement: User Notification Settings

> Generated: 2026-05-01
> Status: Draft
> Complexity: Medium
> Readiness: 85% — missing: detailed UI/UX wireframes
> References: n/a

Note: All content in this document must be written in English.

---

## Quick Links

| Document | Status |
|----------|--------|
| [BA Analysis](agents/ba-user-notification-settings.md) | ✅ Complete |
| [SA Assessment](agents/sa-user-notification-settings.md) | ⏭️ Skipped |
| [Domain Research](agents/research-user-notification-settings.md) | ⏭️ Skipped |
| [UI/UX Design](agents/uiux-user-notification-settings.md) | ⏭️ Skipped |

---

## 1. Executive Summary

Users currently have no control over when or whether they receive email notifications. This feature adds a Notifications settings page where authenticated users can toggle email notifications on/off and configure a quiet hours window (do-not-disturb time range). Settings are persisted in the existing user profile table, with quiet hours stored in UTC and displayed in the user's local timezone.

---

## 2. Problem Statement

### Context
The application sends email notifications without any user-level controls. As usage grows, users have no mechanism to opt out or reduce noise during off-hours.

### Problem
No settings page exists for notification preferences. Users cannot disable emails or set quiet hours.

### Impact
Increased unsubscribes and notification-related support tickets; poor user experience for users in different timezones.

---

## 3. Users & User Stories

### Target Users

| User Type | Description | Primary Goals |
|-----------|-------------|---------------|
| Authenticated App User | Logged-in user with an existing profile | Manage when and whether emails are received |

### User Stories

| ID | Priority | As a... | I want to... | So that... |
|----|----------|---------|--------------|------------|
| US-01 | Must | authenticated user | toggle email notifications on or off | I stop receiving emails when I don't want them |
| US-02 | Must | authenticated user | set a quiet hours start and end time | emails are not sent during my sleep or focus hours |
| US-03 | Must | authenticated user | have my quiet hours shown in my local timezone | I set the correct times without converting manually |
| US-04 | Must | authenticated user | have my settings saved after I change them | I don't lose changes when I navigate away |
| US-05 | Should | authenticated user | see current settings on page load | I know what is already configured |
| US-06 | Should | authenticated user | receive an error if quiet hours are invalid | I can correct mistakes before saving |

---

## 4. Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-01 | Notifications settings page via Settings > Notifications | Must | Page renders for authenticated users; unauthenticated redirected to login |
| FR-02 | Email toggle pre-populated with current value | Must | Toggle reflects persisted state on page load |
| FR-03 | Toggle email on/off persists to user profile | Must | After toggle, refreshing page shows updated state |
| FR-04 | Quiet hours time pickers pre-populated with stored values | Must | Fields show saved values; empty if not set |
| FR-05 | Quiet hours saved in UTC, displayed in local timezone | Must | DB stores UTC; UI displays local time |
| FR-06 | Validate start time ≠ end time | Must | Equal times show validation error; not persisted |
| FR-07 | Validate both quiet hours fields set together or not at all | Must | Partial entry shows validation error |
| FR-08 | Suppress all emails when notifications disabled | Must | Disabled user receives no emails regardless of quiet hours |
| FR-09 | Suppress emails during active quiet hours window | Must | Emails triggered during UTC quiet hours window are not delivered |
| FR-10 | Success confirmation after save | Should | Toast or inline message appears after successful save |
| FR-11 | Error message if save fails | Should | Network/server error shows user-readable message |

**Priority Legend:** Must = critical for release · Should = important but not blocking · Could = nice to have

---

## 5. Business Rules

| ID | Rule | Condition | Action |
|----|------|-----------|--------|
| BR-01 | Email suppression — opt-out | `email_notifications_enabled = false` | Do not send any email to that user |
| BR-02 | Email suppression — quiet hours | Current UTC time within `[quiet_hours_start, quiet_hours_end)` | Do not deliver email |
| BR-03 | Quiet hours UTC storage | User saves quiet hours | Convert from local timezone to UTC before persisting |
| BR-04 | Quiet hours display | Loading settings page | Convert stored UTC to user's local timezone |
| BR-05 | Paired fields validation | Only one of start/end provided | Reject save with validation error |
| BR-06 | Non-equal times | Start time equals end time | Reject save with validation error |
| BR-07 | Clear quiet hours | User clears both fields | Persist both as null |

---

## 6. Technical Assessment

### Feasibility Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| Overall | ✅ Feasible | Standard CRUD + email hook |
| Frontend | 🟢 Low | Toggle + time picker; timezone via `Intl` API |
| Backend | 🟡 Medium | Schema migration + email pre-send check |
| Data | 🟢 Low | 3 new nullable columns on existing user profile table |

### Recommended Architecture

Add 3 columns to user profile table. Expose GET/PATCH `/api/settings/notifications`. Wire preference check in email delivery layer. Frontend uses `Intl.DateTimeFormat` for timezone conversion.

### Technology Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| Frontend | Existing framework + `Intl` API | Timezone conversion without extra deps |
| Backend | Existing API framework | New PATCH endpoint |
| Database | Existing RDBMS | Schema migration, 3 columns |

### Technical Risks

| ID | Risk | Impact | Likelihood | Mitigation |
|----|------|--------|------------|------------|
| TR-01 | Cross-midnight quiet hours edge case | Medium | Medium | Modular overlap check; document behavior |
| TR-02 | Email delivery layer tightly coupled | Medium | Low | Abstract preference check into utility function |

---

## 7. UI/UX Design (if applicable)

### Screen Inventory

| # | Screen | Purpose | Priority |
|---|--------|---------|----------|
| 1 | Settings > Notifications | Toggle email on/off + set quiet hours | Must |

### Key User Flows

1. User opens Settings > Notifications
2. Page loads current values (toggle state + quiet hours times in local timezone)
3. User changes toggle or time pickers → saves → success toast shown
4. On validation error → inline error shown, save blocked

---

## 9. Non-Functional Requirements (if applicable)

| Category | Requirement |
|----------|-------------|
| **Security** | Authentication required; users can only modify their own settings |
| **Performance** | Settings page load < 300ms |
| **Compatibility** | All modern browsers via `Intl` API |

---

## 10. Edge Cases & Constraints

### Edge Cases

| ID | Category | Edge Case | Expected Behavior | Priority |
|----|----------|-----------|-------------------|----------|
| EC-01 | Data | Cross-midnight quiet hours (e.g., 22:00–06:00) | Modular time comparison in suppression check | Must |
| EC-02 | Data | User has no timezone info | Fall back to UTC for display | Should |
| EC-03 | Network | Save request times out | Show error; retain unsaved form state | Must |
| EC-04 | Data | Both quiet hours fields cleared | Persist null/null; quiet hours disabled | Must |

### Constraints

- **Technical**: Must use existing user profile table
- **Scope**: Email channel only; push/SMS out of scope

---

## 11. Out of Scope

- Push notifications, in-app notifications, SMS
- Per-notification-type granularity (e.g., marketing vs transactional)
- Queuing/delaying emails suppressed by quiet hours
- Admin override of user preferences

---

## 12. Open Questions

| ID | Question | Owner | Due Date | Status | Blocking |
|----|----------|-------|----------|--------|----------|
| Q-01 | Should cross-midnight quiet hours be supported in MVP? | Engineering | 2026-05-05 | Open | No |

---

## Related Plans (if applicable)

| Type | Document | Status | Scope |
|------|----------|--------|-------|
| Feature Plan | [01-05-2026-feature-user-notification-settings-v2.md](../planning/01-05-2026-feature-user-notification-settings-v2.md) | draft | FR-01 to FR-11 |

---

## Next Steps

1. [ ] Review this requirement document
2. [ ] Address Q-01 (cross-midnight quiet hours)
3. [ ] Run `/create-plan` to generate implementation plan

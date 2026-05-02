# Plan: User Notification Settings

Note: All content in this document must be written in English.

---
epic_plan: null
requirement: docs/ai/requirements/01-05-2026-req-user-notification-settings-v2.md
status: draft
# status values: draft | reviewed | executed
---

## 0. Related Documents (if applicable)

| Type | Document |
|------|----------|
| Requirement | [01-05-2026-req-user-notification-settings-v2.md](../requirements/01-05-2026-req-user-notification-settings-v2.md) |

---

## 1. Codebase Context

### Similar Features
- `src/settings/profile-settings.tsx` - Existing settings page pattern; reuse layout and save/error state handling

### Reusable Components/Utils
- `src/components/Toggle.tsx` - Controlled toggle; accepts `value` + `onChange`
- `src/components/TimePicker.tsx` - Time input HH:MM format; use for quiet hours start/end
- `src/utils/timezone.ts` - `toUTC(time, tz)` and `fromUTC(time, tz)` helpers

### Architectural Patterns
- Settings pages: load via GET on mount, save via PATCH, show toast on success/error
- Email pre-send: all outbound emails pass through `src/services/email.ts:sendEmail()`

### Key Files to Reference
- `src/db/migrations/` - Migration naming convention
- `src/models/user.ts` - User profile model; add new columns here
- `src/services/email.ts` - Wire quiet hours suppression check here

---

## 2. Design Specifications (if applicable)

- **Figma specs**: n/a
- **Frame**: n/a
- **Status**: n/a

> Run `/extract-figma` if the file does not exist yet.

---

## 3. Goal & Acceptance Criteria

### Goal
- Allow authenticated users to toggle email notifications on/off and configure a timezone-aware quiet hours window, persisted in the existing user profile table.

### Acceptance Criteria (Given/When/Then)
- Given a user with email notifications enabled, when they toggle off and save, then no further emails are sent to that user
- Given a user setting quiet hours 22:00–07:00 local time, when saved, then quiet hours are stored in UTC and emails are suppressed during that window
- Given a user submitting only a start time, when they save, then a validation error is shown and settings are not persisted
- Given a user who clears both quiet hours fields and saves, then quiet hours are set to null and suppression is disabled

---

## 4. Risks & Assumptions

### Risks
- Cross-midnight quiet hours require modular time comparison — needs explicit handling in suppression check
- `sendEmail()` may be called from multiple places; missing one call site breaks suppression

### Assumptions
- User profile table accepts new nullable columns via migration
- Browser `Intl.DateTimeFormat` available for timezone detection
- `sendEmail()` is the single entry point for all outbound emails

---

## 5. Definition of Done
- [ ] Build passes (linter, type checks, compile)
- [ ] Tests added and passing
- [ ] Code reviewed and approved
- [ ] Documentation updated

---

## 6. Implementation Plan

### Summary
Add 3 columns to the user profile table via migration, expose GET/PATCH `/api/settings/notifications`, wire a pre-send check in `sendEmail()`, and build the Notifications settings page with toggle and time pickers.

### Phase 1: Database & API

- [ ] ADDED `src/db/migrations/20260501_add_notification_settings.ts` — Add 3 columns to user profile table
  ```
  Migration: add_notification_settings

  Changes:
    - ADD COLUMN email_notifications_enabled BOOLEAN NOT NULL DEFAULT true
    - ADD COLUMN quiet_hours_start TIME NULL
    - ADD COLUMN quiet_hours_end TIME NULL

  Rollback: DROP COLUMN for all 3 columns

  Edge cases:
    - Existing users: email_notifications_enabled defaults to true (no disruption)
  ```

- [ ] MODIFIED `src/models/user.ts` — Add new fields to User model
  ```
  Fields to add:
    - emailNotificationsEnabled: boolean
    - quietHoursStart: string | null  (HH:MM UTC)
    - quietHoursEnd: string | null    (HH:MM UTC)

  Logic flow:
    1. Add fields to model interface
    2. Map DB column names to camelCase
  ```

- [ ] ADDED `src/api/settings/notifications.ts` — GET + PATCH notification settings
  ```
  Endpoints:
    GET  /api/settings/notifications
    PATCH /api/settings/notifications

  Auth: require authenticated session (reuse existing auth middleware)

  GET logic:
    1. Load user's notification fields from DB
    2. Return { emailNotificationsEnabled, quietHoursStart, quietHoursEnd }

  PATCH input validation:
    - quietHoursStart XOR quietHoursEnd → 400 "Both quiet hours fields required"
    - quietHoursStart === quietHoursEnd (when both set) → 400 "Start and end time must differ"
    - Values already in UTC (client converts before sending)

  Logic flow:
    1. Validate input
    2. Partial update: only update fields present in request body
    3. Persist and return updated values

  Return: { emailNotificationsEnabled, quietHoursStart, quietHoursEnd }
  Error: { error: string } + appropriate HTTP status

  Edge cases:
    - Both null → clear quiet hours (valid)
    - Cross-midnight range → store as-is; suppression check handles overlap
  ```

### Phase 2: Email Suppression

- [ ] MODIFIED `src/services/email.ts` — Add preference check before sending
  ```
  Function: sendEmail(to: string, subject: string, body: string)

  Logic flow (prepend to existing send logic):
    1. Load recipient's notification settings by email
    2. If emailNotificationsEnabled === false → return early
    3. If quietHoursStart and quietHoursEnd set:
       a. Get current UTC time as HH:MM
       b. If start > end (cross-midnight): in range if time >= start OR time < end
       c. Else: in range if start <= time < end
       d. If in range → return early
    4. Proceed with existing send logic

  Edge cases:
    - User not found → proceed with send (fail open)
    - DB error → log warning, proceed with send (fail open)
  ```

### Phase 3: Frontend

- [ ] ADDED `src/settings/notification-settings.tsx` — Notifications settings page
  ```
  Route: /settings/notifications

  On mount:
    1. GET /api/settings/notifications
    2. Convert quietHoursStart/End from UTC → local via fromUTC(time, userTimezone)
    3. Populate form: { emailEnabled, quietStart, quietEnd }

  On save:
    1. Client-side validation (mirror API rules)
    2. Convert quietStart/End to UTC via toUTC(time, userTimezone)
    3. PATCH /api/settings/notifications
    4. Success → toast; Error → inline message, retain form state

  Edge cases:
    - Timezone unavailable → display UTC with note "times shown in UTC"
    - Save in progress → disable save button to prevent double submit
  ```

- [ ] MODIFIED `src/settings/index.tsx` — Add Notifications link to Settings nav
  ```
  Change: Add "Notifications" entry to settings navigation list
  Link to: /settings/notifications
  ```

Notes:
- ACTION must be one of: ADDED | MODIFIED | DELETED | RENAMED
- For MODIFIED files, include line ranges for each distinct logic change
- Each phase groups related tasks and executes sequentially
- Use only one phase for small features (≤ 5 tasks)

---

## 7. Follow-ups
- [ ] Decide cross-midnight quiet hours behavior for MVP (Q-01)
- [ ] Consider queuing suppressed emails for post-quiet-hours delivery (deferred)
- [ ] Add per-notification-type granularity in future iteration

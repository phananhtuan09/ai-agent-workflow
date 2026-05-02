# Plan: User Notification Settings

Note: All content in this document must be written in English.

---
epic_plan: null
requirement: docs/ai/requirements/01-05-2026-req-user-notification-settings.md
status: draft
# status values: draft | reviewed | executed
---

## 0. Related Documents

| Type | Document |
|------|----------|
| Requirement | [01-05-2026-req-user-notification-settings.md](../requirements/01-05-2026-req-user-notification-settings.md) |

---

## 1. Codebase Context

### Similar Features
- `src/settings/profile-settings.tsx` - Existing settings page pattern; reuse layout and save/error state handling
- `src/api/settings/profile.ts` - Existing PATCH settings endpoint; follow same request/response shape

### Reusable Components/Utils
- `src/components/Toggle.tsx` - Controlled toggle component; accepts `value` + `onChange`
- `src/components/TimePicker.tsx` - Time input with HH:MM format; use for quiet hours start/end
- `src/utils/timezone.ts` - `toUTC(time, tz)` and `fromUTC(time, tz)` helpers for timezone conversion

### Architectural Patterns
- Settings pages: load current values on mount via GET, save via PATCH, show toast on success/error
- Email pre-send: all outbound emails pass through `src/services/email.ts:sendEmail()` — add preference check here

### Key Files to Reference
- `src/db/migrations/` - Migration naming convention and format
- `src/models/user.ts` - User profile model; add new columns here
- `src/services/email.ts` - Email delivery service; wire quiet hours suppression check

---

## 2b. Theme Specification

> Not applicable — this feature uses existing UI components and settings page layout.

---

## 3. Goal & Acceptance Criteria

### Goal
- Allow authenticated users to toggle email notifications on/off and configure a timezone-aware quiet hours window, persisted in the existing user profile table.

### Acceptance Criteria (Given/When/Then)
- Given a user with email notifications enabled, when they toggle off and save, then no further emails are sent to that user
- Given a user setting quiet hours 22:00–07:00 local time, when saved, then quiet hours are stored in UTC and emails are suppressed during that window
- Given a user submitting only a start time (no end time), when they save, then a validation error is shown and settings are not persisted
- Given a user who clears both quiet hours fields and saves, then quiet hours are set to null and suppression is disabled

---

## 4. Risks & Assumptions

### Risks
- Cross-midnight quiet hours (e.g., 22:00–06:00) require modular time comparison — needs explicit handling in suppression check
- Email delivery service (`sendEmail`) may be called from multiple places; missing one call site breaks suppression

### Assumptions
- User profile table exists and accepts new nullable columns via migration
- Browser `Intl.DateTimeFormat` is available for timezone detection (no IE11 support needed)
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
Add 3 columns to the user profile table via migration, expose GET/PATCH `/api/settings/notifications` endpoints, wire a pre-send preference check in `sendEmail()`, and build the Notifications settings page with toggle and time pickers.

### Phase 1: Database & API

- [ ] ADDED `src/db/migrations/20260501_add_notification_settings.ts` — Add 3 columns to user profile table
  ```
  Migration: add_notification_settings

  Changes:
    - ADD COLUMN email_notifications_enabled BOOLEAN NOT NULL DEFAULT true
    - ADD COLUMN quiet_hours_start TIME NULL
    - ADD COLUMN quiet_hours_end TIME NULL

  Table: users (or user_profiles — match existing schema)

  Rollback: DROP COLUMN for all 3 columns

  Edge cases:
    - Existing users: email_notifications_enabled defaults to true (no disruption)
    - Null quiet hours = quiet hours disabled
  ```

- [ ] MODIFIED `src/models/user.ts` — Add new fields to User model/type
  ```
  Fields to add:
    - emailNotificationsEnabled: boolean
    - quietHoursStart: string | null  (HH:MM UTC)
    - quietHoursEnd: string | null    (HH:MM UTC)

  Logic flow:
    1. Add fields to model interface/class
    2. Map DB column names to camelCase fields
  ```

- [ ] ADDED `src/api/settings/notifications.ts` — GET + PATCH notification settings endpoints
  ```
  Endpoints:
    GET  /api/settings/notifications
    PATCH /api/settings/notifications

  Auth: require authenticated session (reuse existing auth middleware)

  GET logic:
    1. Load current user's notification fields from DB
    2. Return { emailNotificationsEnabled, quietHoursStart, quietHoursEnd } (UTC values)

  PATCH input:
    - emailNotificationsEnabled: boolean (optional)
    - quietHoursStart: "HH:MM" | null (optional)
    - quietHoursEnd: "HH:MM" | null (optional)

  Input validation:
    - If quietHoursStart XOR quietHoursEnd is provided → 400 "Both quiet hours fields required"
    - If quietHoursStart === quietHoursEnd (when both provided) → 400 "Start and end time must differ"
    - Values already in UTC (client converts before sending)

  Logic flow:
    1. Validate input (see above)
    2. Partial update: only update fields present in request body
    3. Persist to DB
    4. Return updated values

  Return: { emailNotificationsEnabled, quietHoursStart, quietHoursEnd }
  Error: { error: string } with appropriate HTTP status

  Edge cases:
    - quietHoursStart: null + quietHoursEnd: null → clear quiet hours (valid)
    - Cross-midnight range (e.g., "22:00" to "06:00") → store as-is; suppression check handles overlap
  ```

### Phase 2: Email Suppression

- [ ] MODIFIED `src/services/email.ts` — Add preference check before sending
  ```
  Function: sendEmail(to: string, subject: string, body: string)

  Logic flow (prepend to existing send logic):
    1. Load recipient user's notification settings by email address
    2. If emailNotificationsEnabled === false → return early (no send)
    3. If quietHoursStart and quietHoursEnd are set:
       a. Get current UTC time as HH:MM
       b. Check if current time falls within [quietHoursStart, quietHoursEnd)
          - Handle cross-midnight: if start > end, range wraps (e.g., 22:00–06:00)
       c. If within window → return early (no send)
    4. Proceed with existing send logic

  Edge cases:
    - User not found by email → proceed with send (fail open)
    - DB error loading preferences → log warning, proceed with send (fail open)
    - Cross-midnight range: if quietHoursStart > quietHoursEnd → time is in range if time >= start OR time < end

  Dependencies: user profile DB query; existing email transport
  ```

### Phase 3: Frontend Settings Page

- [ ] ADDED `src/settings/notification-settings.tsx` — Notifications settings page component
  ```
  Route: /settings/notifications

  On mount:
    1. GET /api/settings/notifications
    2. Convert quietHoursStart/End from UTC to local timezone via fromUTC(time, userTimezone)
    3. Populate form state: { emailEnabled, quietStart, quietEnd }

  Form fields:
    - Toggle: emailEnabled (controlled, updates local state immediately)
    - TimePicker: quietStart (local time)
    - TimePicker: quietEnd (local time)
    - Save button

  On save:
    1. Client-side validation (match API rules):
       - Both quiet hours set or both null
       - Start ≠ end
    2. Convert quietStart/End to UTC via toUTC(time, userTimezone)
    3. PATCH /api/settings/notifications with UTC values
    4. On success → show success toast
    5. On error → show error message, retain form state

  Timezone detection:
    - Intl.DateTimeFormat().resolvedOptions().timeZone

  Edge cases:
    - Timezone unavailable → display UTC times with note "times shown in UTC"
    - Save in progress → disable save button to prevent double submit
  ```

- [ ] MODIFIED `src/settings/index.tsx` — Add Notifications link to Settings nav
  ```
  Change: Add "Notifications" entry to settings navigation list
  Link to: /settings/notifications
  ```

---

## 7. Follow-ups
- [ ] Decide cross-midnight quiet hours behavior for MVP (Q-01 from requirements)
- [ ] Consider queuing suppressed emails for delivery after quiet hours window (deferred)
- [ ] Add per-notification-type granularity in future iteration

# Evidence Matrix — Landing Page Showcase

Use this matrix before assigning scores. It defines what evidence is required, how confident the review can be, and when categories should be marked `Provisional`, `Unverified`, or `N/A`.

---

## Evidence Types

- `Screenshot-only`: One or more still captures, no runtime access
- `Screenshot + video`: Still captures plus motion recording
- `Figma`: Static design source with specs
- `Live URL`: Runtime access in browser
- `Code access`: Frontend source access
- `Profiling`: Lighthouse, DevTools traces, runtime metrics, or device testing

---

## Confidence Ceiling By Input

- `Screenshot-only` -> maximum confidence: `Low`
- `Screenshot + video` -> maximum confidence: `Medium`
- `Figma-only` -> maximum confidence: `Low`
- `Live URL` -> maximum confidence: `Medium`
- `Live URL + code` -> maximum confidence: `Medium`
- `Live URL + code + profiling` -> maximum confidence: `High`

Do not exceed the confidence ceiling even if the page looks excellent.

---

## Category Matrix

| Category | Can score from screenshot | Better with live/video | Best with code/profiling | Missing-evidence guidance |
|---|---|---|---|---|
| Creative Direction | Yes | Helpful | No | `Scored` if enough visual coverage exists |
| Brand / Identity Expression | Yes | Helpful | No | `Scored` from stills if page coverage is broad enough |
| Hero Section Impact | Yes | Video helpful | No | `Provisional` if only one cropped hero image exists |
| Storytelling / Section Flow | Partial | Yes | No | `Provisional` unless multiple sections or runtime scroll are visible |
| Color System | Yes | Helpful | No | `Scored` from broad visual coverage |
| Typography | Yes | Helpful | No | `Provisional` if type at smaller breakpoints is not visible |
| Layout & Composition | Yes | Helpful | No | `Scored` if section coverage is broad |
| Motion Design | No | Yes | Helpful | `Unverified` without runtime or video evidence |
| Interaction Design | No | Yes | Helpful | `Unverified` without runtime evidence |
| Visual Assets / Media Quality | Yes | Helpful | No | `Scored` if assets are visible enough |
| Performance | No | Partial | Yes | `Unverified` without runtime evidence; `Scored` strongly only with profiling or realistic testing |
| Responsive Design | No | Yes | Helpful | `Unverified` without multi-breakpoint evidence |
| Accessibility / Comfort | Partial | Yes | Helpful | `Provisional` from visuals alone; `Unverified` for reduced-motion or keyboard behavior without runtime |
| Technical Execution / Frontend Craft | No | Partial | Yes | `Unverified` without code or strong runtime clues |
| Final Polish / Consistency | Yes | Helpful | No | `Scored` if broad page coverage exists |
| QA / Real-World Readiness | No | Partial | Yes | `Unverified` without testing evidence |

---

## Practical Rules

### Screenshot-only

You may score with caution:

- Creative Direction
- Brand / Identity Expression
- Hero Impact
- Color System
- Typography
- Layout & Composition
- Visual Assets
- Final Polish

You should usually mark as `Provisional`:

- Storytelling / Flow
- Accessibility / Comfort

You should usually mark as `Unverified`:

- Motion Design
- Interaction Design
- Performance
- Responsive Design
- Technical Execution
- QA / Real-World Readiness

### Live URL Without Code

You may score more categories directly, but:

- `Performance` should stay `Provisional` unless there is realistic device or profiling evidence.
- `Technical Execution` should not reach strong confidence without code or very strong runtime clues.
- `QA / Real-World Readiness` should stay `Provisional` unless testing evidence is explicit.

### Live URL With Code And Profiling

This is the only setup that can reasonably support:

- `High` confidence
- strong claims on performance quality
- strong claims on frontend craft
- strong claims on QA readiness

---

## Coverage Warnings

Add a coverage warning when any of these are true:

- Fewer than three major sections are visible
- Only desktop is visible
- Motion is described but not observed
- Accessibility is inferred from visuals only
- Performance is inferred from visual polish only
- QA readiness is inferred from confidence in the creator

Coverage warnings should lower confidence and may cap verdict strength per `scoring-policy.md`.

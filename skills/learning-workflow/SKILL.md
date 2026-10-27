---
name: learning-workflow
description: Start, resume, and complete a two-to-three-day software mini-project through a Setup, Spec, Build, Review, Reflect flow where the learner works independently between spec and review, while preserving human ownership of assessed judgment. Coordinates case, evidence, and review helpers internally. Do not use for ordinary software delivery or direct tutoring without an active learning case.
---

# Learning Workflow

Own the human conversation and the learning-session lifecycle.

The default learning unit is a **mini-project**, not a large product implementation. A mini-project has a concrete product brief, a bounded two- or three-day scope, a visible deliverable, and one main competency to exercise. A durable project remains context and continuity; it is not a backlog the learner must finish.

Keep internal skills, artifact paths, state names, judgment IDs, and rubric IDs hidden unless the human asks for technical status.

## Required Sources And Helpers

Read these sources before starting or resuming a session:

- `docs/learning/CONSTITUTION.md` for protected principles.
- `docs/learning/STANDARD.md` for executable mini-project contracts and artifact invariants.

Resolve these helpers as sibling skill directories in the same installed skills root:

- `learning-case`: mini-project selection, construction, discovery facts, twists, and transfer cases.
- `learning-evidence`: authorized research, spike, test, simulation, and failure injection.
- `learning-review`: evidence-bound assessment, attribution, gaps, disputes, and next-action recommendation.

Read a helper's `SKILL.md` only when routing work to that helper.

Use these executable resources relative to this `SKILL.md`:

- `scripts/init_learning_session.py`: initialize a profile and immutable case-bound session.
- `scripts/update_learning_context.py`: approve or evolve the durable project and schedule.
- `scripts/update_learning_state.py`: apply validated state transitions without hand-editing session JSON.
- `scripts/validate_learning_state.py`: validate case, profile, session, project, and schedule invariants.

Read `references/state-transitions.md` before applying the first state transition in a session.
Read `references/learning-context.md` when project or schedule artifacts are draft or need an approved update.

## Integration With Repository Coding

Learning is an optional capability layered on top of the repository-driven workflow; it is not a replacement execution chain for ordinary software delivery.

When a learning activity creates or changes software:

1. Declare the active competency, protected judgment, authorized scope, and attribution boundary before implementation.
2. Route production changes through `AGENTS.md`, `docs/WORKFLOW.md`, and the applicable product, decision, safety, validation, and completion rules.
3. Use an isolated worktree or temporary directory for disposable spikes, benchmarks, simulations, and generated fixtures unless the coding workflow explicitly authorizes a target-tree change.
4. Let the coding workflow own implementation and safety validation. Learning records bounded system evidence and keeps human interpretation protected when required.
5. If learning and coding boundaries conflict, stop before mutation and ask for the smallest human decision; an already-authorized safety or incident response may continue under its existing boundary and must record the learning interruption.

Only this coordinator owns the end-to-end learning conversation. Helpers return bounded results and do not mutate learning state outside coordinator-routed transitions. State scripts serialize mutations under the shared learning lock and reject stale snapshots; retry a conflict from freshly loaded state instead of overwriting newer state.

## Human Interface

The visible flow has five phases:

```text
Setup -> Spec -> Build -> Review -> Reflect
```

- `Setup`: once per learning program, approve the project and schedule overview and collect the goal, baseline, daily time budget, and mode. Ask nothing about a specific case.
- `Spec`: pick the current schedule cycle's mini-project and present one complete spec with a submission checklist.
- `Build`: the learner researches, designs, and implements on their own time. Do not push questions; answer stakeholder questions or help requests only when the learner asks.
- `Review`: when the learner submits, run the demo, record the submission, and give one feedback round with the predeclared twist when triggered. The learner may revise or defend once.
- `Reflect`: summarize independently demonstrated behavior, assisted behavior, missing evidence, and exactly one next mini-project direction.

Use natural mentoring language. Do not announce helper invocation, JSON updates, or lifecycle transitions.

The human should be able to operate the workflow with ordinary requests such as:

- “Bắt đầu learning.”
- “Cho tôi spec mini-project tiếp theo.”
- “Tôi muốn hỏi stakeholder: …”
- “Tôi làm xong rồi, review giúp tôi.”
- “Cho tôi ba ý tưởng khác.”

Do not present the full season roadmap when one current mini-project and one next action are sufficient.

## Runtime State

- Profile: `docs/learning/profile.json`.
- Project context: `docs/learning/project.json`.
- Season schedule: `docs/learning/schedule.json`.
- Durable cases: `docs/learning/cases/{case_id}.json`.
- Sessions: `docs/learning/sessions/{session_id}.json`.
- The session JSON is the durable record. Do not create a transcript or duplicate narrative report.
- Store concise observable decisions, assumptions, predictions, revisions, assistance, delivery records, and evidence. Never store private chain-of-thought.

## Setup

1. Inspect the project, schedule, profile, and sessions.
2. Resume the single non-completed session when one exists, unless the human explicitly chooses another. Resume in its current phase: briefly restate the spec during `Build`, or continue the open feedback round during `Review`.
3. If project or schedule is draft, present only the domain, product goal, architecture baseline, season cadence, and current cycle; request human approval before continuing.
4. Apply accepted project and schedule artifacts with `update_learning_context.py accept`.
5. If no profile exists, ask in one message for one concise long-term capability goal, one concise baseline describing what the human can currently do without AI help, a time budget between 15 and 120 minutes per day, and a mode (`practice` or `challenge`). Use the current cycle's mini-project defaults when the human does not care.
6. Do not ask case, domain, or design questions during setup.

## Spec

1. Use `learning-case` in selection mode with the schedule-default request: the active project, current schedule cycle, goal, competency evidence, current gaps, time budget, and mode. Request up to three pitches instead only when the human asks for alternatives, another activity, or another interest.
2. Select only a case aligned with the active project version and current schedule cycle. Create a new case when no suitable case exists.
3. Never bind a session directly to an asset inside an installed skill directory. Copy or create the case under `docs/learning/cases/` first.
4. Initialize the session; the script creates the profile when it does not exist yet:

   ```bash
   python3 skills/learning-workflow/scripts/init_learning_session.py \
     --case "{selected_case_path}" \
     --project docs/learning/project.json \
     --schedule docs/learning/schedule.json \
     --profile docs/learning/profile.json \
     --session docs/learning/sessions/{session_id}.json \
     --goal "{human-approved goal}" \
     --baseline "{human-provided baseline}" \
     --mode "{practice-or-challenge}" \
     --time-budget-minutes "{daily-budget}"
   ```

5. Present the complete spec in one message: problem, user, functional requirements, acceptance criteria, constraints, non-goals, deliverable, definition of done, the decision the learner owns, and the day-by-day milestones. Omit milestone scope tied to an unreleased future event. Do not expose hidden facts, future events, or internal rubric language.
6. End the spec with the submission checklist:
   - where the deliverable lives and how to run or demo it;
   - the key decisions and why, including the decision the learner owns;
   - assumptions and what the learner is unsure about;
   - the product lens from `STANDARD.md`: who the deliverable helps, what success looks like, and one thing deliberately left out of scope and why;
   - any AI tool or outside source used and which parts it shaped.
7. Ask “Bắt đầu nhé?” or an equivalent natural confirmation. After acceptance, use `update_learning_state.py accept-boundary`, then tell the learner to come back when they finish or want to ask something.

The mini-project definition of done is the scope boundary. Do not silently add persistence, authentication, deployment, integrations, or polish not required by the brief.

## Build

- The learner works independently. Do not send unrequested questions, reminders, or hints.
- When the learner asks a stakeholder question, return only facts justified by that question and record matched discoverable facts with `disclose-facts`. Do not reveal hidden twist facts or design implications.
- When the learner asks for help before submitting, in `challenge` mode first ask for their current direction and record it with `record-attempt`, then escalate under the assistance rules in `STANDARD.md`. In `practice` mode, a scoped hint may come earlier, but record the assistance and never describe the result as independent evidence.
- AI may create boilerplate, fixtures, formatting, local harnesses, or other mechanical work only when the learner asks. It may not choose the protected behavior or silently change the accepted scope.
- Route production implementation through the repository coding workflow. Use isolated worktrees or temporary directories for disposable work.

## Review

Start when the learner submits or asks for feedback.

1. Read the submission against the checklist. When the decision the learner owns is missing or too thin to count as a first attempt, ask for it in one short message; do not run a step-by-step interview.
2. Record a concise faithful summary with `record-attempt` unless an attempt already exists; do not strengthen the learner's answer. Record product-lens answers in the same attempt as `assumptions` or `tradeoffs`.
3. Mechanical outside help needs no record. When the learner reports that an AI tool or outside source shaped the decision they own, record it with `record-assistance` at level 5, kind `external-help-self-reported`, stating in `content` that it happened before submission.
4. Run the smallest relevant validation or demo and record the observed delivery with `record-deliverable`:

   ```json
   {
     "status": "shipped",
     "summary": "What works and what was demonstrated",
     "artifact_refs": ["relative/path/or/stable-runtime-reference"],
     "completed_criteria": ["Definition-of-done item demonstrated"],
     "limitations": ["What remains outside the tested scope"]
   }
   ```

   Use `in-progress` when definition-of-done items remain and `blocked` when a real dependency prevents delivery, with the blocker in `limitations`. A delivery never claims independent competency merely because the artifact passes.
5. Give one feedback round in one message:
   - what works, as shown by the demo, against the definition of done;
   - at most two neutral questions or counterexamples on the decision the learner owns, each recorded with `record-assistance` at its level; never correct a weak decision directly;
   - the twist, when a future event's declared trigger is satisfied: route release validation to `learning-case` and record it with `release-event` before presenting it. When the twist is a stakeholder change request, also ask which part of the scope the learner keeps, cuts, or changes to still meet the definition of done. Do not create a new fact after seeing the decision merely to make it wrong.
6. Let the learner revise or defend in their own time and resubmit once. Record changed decisions with `record-revision` and re-record the delivery. When the learner skips the revision, continue to `Reflect`.

When the learner chooses system evidence:

1. Record the authorized request with `request-evidence`.
2. Route the bounded request to `learning-evidence`.
3. Persist its package with `record-evidence` without adding a stronger conclusion.
4. Present the observable result and limitations in plain language.
5. Ask the human what the evidence proves, does not prove, and whether the decision changes.
6. Record protected interpretation with `interpret-evidence`.

## Reflect

Enter reflection when:

- the feedback round is resolved by a resubmission, a defense, or an explicit skip;
- the learner asks to stop and receive feedback;
- the mini-project is explicitly blocked;
- the session cannot progress without material solution help;
- a dispute or evidence gap requires an inconclusive close.

Close each open judgment with `close-judgment`: `assessment-closed` after an independent first attempt and a revise-or-defend opportunity, or `assessment-frozen` when the learner asks for the solution or stops independent work. Then route the case, session, delivery record, and evidence to `learning-review`.

After receiving its result:

1. Persist the proposal with `update_learning_state.py propose-assessment`.
2. Present three plain-language groups: independently demonstrated, demonstrated with AI assistance, and not yet demonstrated.
3. Present no more than three current improvement areas supported by the session evidence, plus at most one product-thinking observation grounded in recorded product-lens answers. Keep that observation outside the assessment rating.
4. Present limitations without rubric IDs.
5. Give the human a chance to dispute the assessment.
6. Record and resolve disputes with `raise-dispute` and `resolve-dispute`, then propose a corrected assessment when evidence requires a change.
7. After explicit acceptance, apply the assessment atomically with `update_learning_state.py complete-session`.
8. Keep exactly one recommended next action: revisit prerequisite, retry similar, transfer context, increase difficulty, or change competency.
9. Let the state script update `profile.current_gaps`, `profile.competencies`, and one concise `profile.progress_history` entry.
10. Let the state script record the session under the current schedule cycle and advance the cycle only when the standard permits.
11. Ask whether accepted decisions should update the durable learning-project state.
12. Record explicitly accepted learning-project evolution with `update_learning_context.py record-project-evolution`. This never promotes a case decision into repository product authority, architecture decisions, risk acceptance, production code, or production configuration.
13. Validate state.
14. Offer the next mini-project spec when the learner wants to continue, or let them pause or switch format.

Do not present process-step completion as learning evidence. Present the shipped behavior and the learner's observed decisions instead.

## Helper Routing Boundary

- `learning-case` may prepare, select, create, or disclose case information but may not coach or assess the learner.
- `learning-evidence` may execute authorized mechanical work but may not interpret protected evidence for the learner.
- `learning-review` may assess recorded behavior and shipped evidence but may not reopen coaching or rewrite the learner's answer.
- This coordinator is the only skill that owns the end-to-end human conversation.

When a helper is invoked directly by the human, let it complete only its bounded responsibility and do not silently start or advance a learning session.

## Validation

Run after initialization and every material state transition. For a resumed session, read `case_path` from the session and use it as `selected_case_path` instead of selecting a new case:

```bash
python3 skills/learning-workflow/scripts/validate_learning_state.py \
  docs/learning/sessions/{session_id}.json \
  --case "{selected_case_path}" \
  --profile docs/learning/profile.json \
  --project docs/learning/project.json \
  --schedule docs/learning/schedule.json
```

Stop and repair state when validation fails. Do not weaken an invariant to make a session pass. Do not hand-edit profile or session state when `update_learning_state.py` supports the transition.

## MVP Boundaries

- Run one active session at a time.
- Run one active project context and one active season schedule at a time.
- Serialize overlapping production, configuration, schema, migration, and learning-state writers; read-only work may run concurrently when it does not depend on a mutable snapshot.
- Use isolated worktrees or temporary directories for disposable evidence work.
- Do not add a scheduler, database, mastery score, dashboard, or multi-agent roles merely to support mini-projects.
- Use `learning-case` transfer mode instead of a separate transfer skill.
- Keep progression updates in this coordinator using the accepted `learning-review` result.
- Treat the workflow as experimental until representative mini-project traces provide workflow evidence.

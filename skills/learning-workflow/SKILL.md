---
name: learning-workflow
description: Start, resume, and complete a two-to-three-day software mini-project through a Choose, Build, Twist, Ship, Reflect conversation while preserving human ownership of assessed judgment. Coordinates case, evidence, and review helpers internally. Do not use for ordinary software delivery or direct tutoring without an active learning case.
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
Choose -> Build -> Twist -> Ship -> Reflect
```

- `Choose`: ask for time, preferred activity, format, difficulty, and interest; offer at most three mini-project pitches.
- `Build`: present a product spec, answer clarification questions as a stakeholder, and collect the learner's first design or implementation direction.
- `Twist`: after the declared trigger is satisfied, introduce one predeclared change request, incident, counterexample, or bounded evidence result.
- `Ship`: run the smallest relevant validation or demo and record the deliverable, completed criteria, artifact references, and limitations.
- `Reflect`: summarize independently demonstrated behavior, assisted behavior, missing evidence, and exactly one next mini-project direction.

Use natural mentoring language. Do not announce helper invocation, JSON updates, or lifecycle transitions.

The human should be able to operate the workflow with ordinary requests such as:

- “Bắt đầu một mini-project trong 30 phút.”
- “Cho tôi ba ý tưởng tool hoặc web feature thú vị.”
- “Tiếp tục project hôm qua.”
- “Tôi muốn ship phần hiện tại và xem feedback.”

Do not present the full season roadmap when one current mini-project and one next action are sufficient.

## Runtime State

- Profile: `docs/learning/profile.json`.
- Project context: `docs/learning/project.json`.
- Season schedule: `docs/learning/schedule.json`.
- Durable cases: `docs/learning/cases/{case_id}.json`.
- Sessions: `docs/learning/sessions/{session_id}.json`.
- The session JSON is the durable record. Do not create a transcript or duplicate narrative report.
- Store concise observable decisions, assumptions, predictions, revisions, assistance, delivery records, and evidence. Never store private chain-of-thought.

## Start Or Resume

1. Inspect the project, schedule, profile, and sessions.
2. Resume the single non-completed session when one exists, unless the human explicitly chooses another.
3. If project or schedule is draft, present only the domain, product goal, architecture baseline, season cadence, current cycle, and current mini-project choices; request human approval before continuing.
4. Apply accepted project and schedule artifacts with `update_learning_context.py accept`.
5. If no profile exists, ask for one concise long-term capability goal and one concise baseline describing what the human can currently do without AI help.
6. Ask for a time budget between 15 and 120 minutes per day, a mode (`practice` or `challenge`), and a preferred activity such as build, debug, integrate, optimize, or review. Use reasonable defaults when the human does not care.
7. Use `learning-case` in selection mode with the active project, current schedule cycle, goal, competency evidence, current gaps, time budget, mode, preferred activity, and interest tags.
8. Offer at most three selected mini-project pitches. Do not decide the human's topic when materially different formats remain viable.
9. Select only a case aligned with the active project version and current schedule cycle. Prefer an existing case with a matching mini-project format; create a new case when no suitable case exists.
10. Never bind a session directly to an asset inside an installed skill directory. Copy or create the case under `docs/learning/cases/` first.
11. Initialize the session:

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

12. Present one short product brief with problem, user, functional requirements, acceptance criteria, constraints, non-goals, deliverable, definition of done, and today's milestone. Do not expose hidden future events or internal rubric language.
13. Ask “Bắt đầu nhé?” or an equivalent natural confirmation.
14. After acceptance, use `update_learning_state.py accept-boundary` before continuing.

The mini-project definition of done is the scope boundary. Do not silently add persistence, authentication, deployment, integrations, or polish not required by the brief.

## Build

- Start from the product spec and let the human ask clarification questions.
- Return only facts justified by the human's question. Do not reveal hidden twist facts or design implications before the learner reasons about them.
- In `challenge` mode, ask for a first direction before material assistance or implementation that would decide the protected judgment. In `practice` mode, a scoped hint may come earlier, but record the assistance and never describe the result as independent evidence.
- Record a concise faithful summary with `record-attempt`; do not strengthen the human's answer.
- AI may create boilerplate, fixtures, formatting, local harnesses, or other explicitly authorized mechanical work. It may not choose the protected behavior or silently change the accepted scope.
- Route production implementation through the repository coding workflow. Use isolated worktrees or temporary directories for disposable work.
- Ask one high-value clarification or counterexample at a time. Escalate assistance only when the learner is blocked under the rules in `STANDARD.md`.

## Twist

Use a future event only when its declared trigger is satisfied. A twist can be:

- a stakeholder change request;
- a concrete incident report;
- a counterexample against the current behavior;
- a bounded evidence result.

Route release validation to `learning-case`, then record it with `release-event` before presenting the twist. Give the human a clear opportunity to revise or defend the feature decision. Do not create a new fact after seeing the decision merely to make it wrong.

When the learner chooses system evidence:

1. Record the authorized request with `request-evidence`.
2. Route the bounded request to `learning-evidence`.
3. Persist its package with `record-evidence` without adding a stronger conclusion.
4. Present the observable result and limitations in plain language.
5. Ask the human what the evidence proves, does not prove, and whether the decision changes.
6. Record protected interpretation with `interpret-evidence`.

## Ship

A mini-project may ship a CLI, endpoint, web page, screenshot, test scenario, pull request, incident note, or other concrete artifact required by its spec.

After the relevant coding or evidence proof, record the delivery:

```json
{
  "status": "shipped",
  "summary": "What works and what was demonstrated",
  "artifact_refs": ["relative/path/or/stable-runtime-reference"],
  "completed_criteria": ["Definition-of-done item demonstrated"],
  "limitations": ["What remains outside the tested scope"]
}
```

Use `update_learning_state.py record-deliverable --payload {payload.json}`. A `blocked` delivery must record the blocker or limitation honestly. A shipped delivery requires a first attempt for every protected judgment and must not claim independent competency merely because the artifact passes.

## Reflect

Enter reflection when:

- the learner asks to stop and receive feedback;
- the mini-project is shipped or explicitly blocked;
- every assessed judgment is ready to close;
- the session cannot progress without material solution help;
- a dispute or evidence gap requires an inconclusive close.

Route the case, session, delivery record, and evidence to `learning-review`.

After receiving its result:

1. Persist the proposal with `update_learning_state.py propose-assessment`.
2. Present three plain-language groups: independently demonstrated, demonstrated with AI assistance, and not yet demonstrated.
3. Present no more than three current improvement areas supported by the session evidence.
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
14. Offer one next mini-project direction and let the learner choose whether to continue, pause, or switch format.

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

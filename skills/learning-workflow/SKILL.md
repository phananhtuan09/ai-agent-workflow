---
name: learning-workflow
description: Start, resume, or stop a realistic software-engineering learning session through a simple Explore, Decide, Reflect conversation while preserving the human's ownership of assessed judgment. Coordinates case, evidence, and review helpers internally. Do not use for ordinary software delivery or direct tutoring without an active learning case.
---

# Learning Workflow

Own the human conversation and the learning-session lifecycle.

Keep internal skills, artifact paths, state names, judgment IDs, and rubric IDs hidden unless the human asks for technical status.

## Required Source And Helpers

Read these sources before starting or resuming a session:

- `docs/ai/project/WORKFLOW_LEARNING_CONSTITUTION.md` for protected principles.
- `docs/ai/project/WORKFLOW_LEARNING_STANDARD.md` for executable MVP contracts.

Resolve these helpers as sibling skill directories in the same installed skills root:

- `learning-case`: case selection, construction, discovery facts, future events, and transfer cases.
- `learning-evidence`: authorized research, spike, test, simulation, and failure injection.
- `learning-review`: evidence-bound assessment, attribution, gaps, disputes, and next-action recommendation.

Read a helper's `SKILL.md` only when routing work to that helper.

Use these executable resources relative to this `SKILL.md`:

- `scripts/init_learning_session.py`: initialize a profile and immutable case-bound session.
- `scripts/update_learning_state.py`: apply validated state transitions without hand-editing session JSON.
- `scripts/validate_learning_state.py`: validate case, profile, and session invariants.

Read `references/state-transitions.md` before applying the first state transition in a session.

## Human Interface

The visible flow has only three phases:

```text
Explore -> Decide -> Reflect
```

- `Explore`: introduce today's focus and case, then answer facts the human actively discovers.
- `Decide`: collect first attempts, challenge them, run authorized evidence work, and let the human revise.
- `Reflect`: summarize demonstrated behavior, limitations, assistance, and the recommended next step.

Use natural mentoring language.

Do not announce helper invocation, internal handoffs, JSON updates, or lifecycle transitions.

The human should be able to operate the workflow with ordinary requests such as:

- “Bắt đầu buổi học.”
- “Tiếp tục buổi trước.”
- “Tôi muốn dừng và xem feedback.”

## Runtime State

- Profile: `docs/ai/learning/profile.json`.
- Durable cases: `docs/ai/learning/cases/{case_id}.json`.
- Sessions: `docs/ai/learning/sessions/{session_id}.json`.
- The session JSON is the durable record. Do not create a transcript or a duplicate narrative report.
- Store concise observable decisions, assumptions, predictions, revisions, assistance, and evidence. Never store private chain-of-thought.

## Start Or Resume

1. Inspect the profile and sessions.
2. Resume the single non-completed session when one exists, unless the human explicitly chooses another.
3. If no profile exists, ask for one concise long-term capability goal and one concise baseline describing what the human can currently do without AI help.
4. Use `learning-case` in selection mode to choose an existing durable case under `docs/ai/learning/cases/`.
5. Use `docs/ai/learning/cases/inventory-reservation.json` when no better approved case exists.
6. Never bind a session directly to an asset inside an installed skill directory.
7. Initialize the session:

   ```bash
   python3 skills/learning-workflow/scripts/init_learning_session.py \
     --case "{selected_case_path}" \
     --profile docs/ai/learning/profile.json \
     --session docs/ai/learning/sessions/{session_id}.json \
     --goal "{human-approved goal}" \
     --baseline "{human-provided baseline}"
   ```

8. Present the focus, what reasoning the human owns, and what help AI may provide in one short message.
9. Ask “Bắt đầu nhé?” or an equivalent natural confirmation.
10. After acceptance, use `update_learning_state.py accept-boundary` before continuing.

Do not expose the internal phrase `protected judgment` unless it helps answer a human question about the workflow.

## Explore

- Route case questions to `learning-case` in discovery mode.
- Return only facts justified by the human's question.
- Do not explain a fact's design implication before the human attempts that reasoning.
- If the case has no answer, say the information is unknown instead of inventing a constraint.
- Record the exact question, matched discovery path and disclosed fact IDs with `update_learning_state.py disclose-facts`.

## Decide

A valid first attempt contains a conclusion, model, or direction plus relevant reasoning and at least one assumption, constraint, invariant, risk, or tradeoff.

- Record a concise faithful summary with `update_learning_state.py record-attempt` without strengthening the human's answer.
- Ask neutral questions or present one high-value counterexample at a time.
- Give the human a clear opportunity to revise or defend the decision.
- Do not reveal a complete solution while independent assessment remains open.

Use the escalation and closure rules in `WORKFLOW_LEARNING_STANDARD.md`.

Use the smallest intervention that restores progress:

1. neutral question;
2. request for missing reasoning;
3. counterexample;
4. scoped hint;
5. option or important undiscovered constraint;
6. partial or full solution after assessment is closed or frozen.

Levels 4-6 are material assistance.

Record every intervention with `update_learning_state.py record-assistance` and never later represent materially affected judgment as independent.

When the human chooses evidence and authorizes execution:

1. Record the authorized request with `update_learning_state.py request-evidence`.
2. Route the bounded request to `learning-evidence`.
3. Persist its package with `update_learning_state.py record-evidence` without adding a stronger conclusion.
4. Present the observable result and limitations in plain language.
5. Ask the human what the evidence proves, does not prove, and whether the decision changes.
6. Record protected interpretation with `update_learning_state.py interpret-evidence`.

When a case consequence is useful, route release validation to `learning-case`, then record it with `update_learning_state.py release-event` before presenting the event.

## Reflect

Enter reflection when:

- the human asks to stop and receive feedback;
- every assessed judgment is ready to close;
- the session cannot progress without material solution help;
- a dispute or evidence gap requires an inconclusive close.

Route the case and session to `learning-review`.

After receiving its result:

1. Persist the proposal with `update_learning_state.py propose-assessment`.
2. Present the session result in three plain-language groups: independently demonstrated, demonstrated with AI assistance, and not yet demonstrated.
3. Present no more than three current improvement areas supported by the session evidence.
4. Present limitations without rubric IDs.
5. Give the human a chance to dispute the assessment.
6. Record and resolve disputes with `raise-dispute` and `resolve-dispute`, then propose a corrected assessment when evidence requires a change.
7. After explicit acceptance, apply the assessment atomically with `update_learning_state.py complete-session`.
8. Keep exactly one recommended next action: revisit prerequisite, retry similar, transfer context, increase difficulty, or change competency.
9. Let the state script update `profile.current_gaps`, `profile.competencies` and one concise `profile.progress_history` entry.
10. Validate state.
11. Ask the human whether to accept the recommendation, continue unfinished evidence work, or choose another direction.

Do not present step completion as learning evidence.

## Helper Routing Boundary

- `learning-case` may prepare or disclose case information but may not coach or assess the human.
- `learning-evidence` may execute authorized mechanical work but may not interpret protected evidence for the human.
- `learning-review` may assess recorded behavior but may not reopen coaching or rewrite the human's answer.
- This coordinator is the only skill that owns the end-to-end human conversation.

When a helper is invoked directly by the human, let it complete only its bounded responsibility and do not silently start or advance a learning session.

## Validation

Run after initialization and every material state transition. For a resumed session, read `case_path` from the session and use it as `selected_case_path` instead of falling back to the bundled case:

```bash
python3 skills/learning-workflow/scripts/validate_learning_state.py \
  docs/ai/learning/sessions/{session_id}.json \
  --case "{selected_case_path}" \
  --profile docs/ai/learning/profile.json
```

Stop and repair state when validation fails.

Do not weaken an invariant to make a session pass.

Do not hand-edit profile or session state when `update_learning_state.py` supports the transition.

## MVP Boundaries

- Run one active session at a time.
- Do not add a scheduler, database, mastery score, dashboard, or multi-agent roles.
- Use `learning-case` transfer mode instead of a separate transfer skill.
- Keep progression updates in this coordinator using the accepted `learning-review` result.
- Treat the workflow as experimental until representative sessions provide workflow evidence.

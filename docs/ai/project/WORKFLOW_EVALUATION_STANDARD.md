---
phase: project
title: Tieu chuan Danh gia Workflow
description: Tieu chuan trace-first de tim friction trong session agent, quy nguyen nhan, va cai thien workflow bang evidence
---

# Tieu chuan Danh gia Workflow

## Muc dich

Tai lieu nay dinh nghia cach danh gia mot AI workflow dua tren hai nguon bang chung khac nhau:

- hanh vi agent co the quan sat trong session thuc te
- artifact va contract ma workflow khai bao

Khi muc tieu la cai thien mot workflow dang duoc su dung, session history la diem xuat phat. Evaluator phai tim van de agent thuc su gap truoc, sau do moi map van de do ve workflow.

Khi muc tieu la adoption hoac promotion cua mot workflow moi chua co lich su su dung, evaluator co the bat dau tu artifact workflow va controlled exercise.

Workflow evaluation khong chi kiem tra agent co tuan thu phase hay khong. No phai tra loi:

- agent bat dau lech khoi ket qua mong doi tai dau
- agent dang ton them cong vao discovery huu ich, workflow overhead, rework, recovery, hay repetition khong tao evidence moi
- human phai can thiep o dau va vi sao
- van de la do workflow, do workflow lam nang them, hay nam ngoai workflow
- thay doi workflow nho nhat nao co the cai thien hanh vi quan sat duoc
- thay doi do co cai thien tren session tuong duong ma khong gay regression hay khong

## Nguyen tac cot loi

### 1. Trace-first khi muc tieu la cai thien

Neu `evaluation_goal` la `workflow improvement`, `regression review`, hoac chan doan usage pain va co session history, dung `trace-first`.

Khong duoc doc workflow artifact de dinh huong pass chan doan hanh vi dau tien. Pass dau chi duoc dung:

- user request
- chat history
- tool calls va command results
- artifact reads va writes
- human corrections
- errors, retries, stops, va final outcome

Chi sau khi behavioral findings da duoc ghi lai moi doc workflow artifact de attribution va de xuat thay doi. Quy tac nay giam confirmation bias va tranh viec chi tim nhung loi ma workflow text da dat ten san.

### 2. Artifact-first chi cho adoption hoac khi trace khong ton tai

Dung `artifact-first` khi:

- workflow moi chua co session history
- muc tieu la review clarity, safety, portability, hoac adoption cua thiet ke
- can so sanh hai artifact workflow truoc controlled exercise

Static inspection chi tao duoc `design risk`. No khong duoc trinh bay nhu runtime failure neu khong co trace hoac exercise.

### 3. Session va behavioral episode la don vi danh gia

Khong mac dinh coi workflow phase la don vi phan tich. Trong trace-first evaluation, hay segment session thanh cac episode co muc dich quan sat duoc, vi du:

- hieu request va xac dinh scope
- tim context hoac doc code
- hoi clarification
- chon approach
- bat dau mutation
- verify
- gap failure
- retry hoac doi hypothesis
- rework
- handoff hoac ket thuc

Workflow phase chi duoc map vao episode sau khi pass behavioral analysis hoan tat.

### 4. Khong gan moi van de cua agent cho workflow

Moi finding phai co mot `cause_attribution`:

- `workflow-caused`: rule, gate, artifact, hoac omission cua workflow truc tiep tao ra hanh vi
- `workflow-exacerbated`: van de co nguon khac nhung workflow khong ngan chan hoac lam chi phi tang
- `model-execution`: agent hieu, lap luan, hoac thuc thi sai du workflow da ro
- `runtime-tool`: runtime, tool, integration, parser, hoac command bi loi
- `task-environment`: task ambiguity, codebase, external state, hoac environment tao ra van de
- `inconclusive`: chua du evidence de attribution

Khong them rule vao workflow de sua mot van de `model-execution`, `runtime-tool`, hoac `task-environment` neu chua co evidence workflow co the ngan chan no voi chi phi hop ly.

### 5. Moi finding giu duoc evidence chain

```text
Observed pattern
  → First divergence
  → Impact va excess work
  → Cause attribution
  → Root-cause hypothesis
  → Smallest workflow change, neu phu hop
  → Re-test
```

## Chon evaluation strategy

| Evaluation goal | Strategy mac dinh | Output chinh |
|---|---|---|
| Cai thien workflow dang dung | `trace-first` | behavioral findings va prioritized improvement experiments |
| Chan doan agent chay nhieu, loop, rework, hoac can human sua | `trace-first` | friction patterns, first divergence, cause attribution |
| Chung minh mot thay doi da cai thien | `trace-first` | before/after tren regression, neighbor, control sessions |
| Adoption hoac promotion workflow moi | `artifact-first` | design risks, exercise evidence, adoption verdict |
| Review clarity hoac contract | `artifact-first` | static findings; runtime claims bi gioi han |
| Portability qua runtime hoac project | `trace-first` neu co trace, neu khong `artifact-first` + exercise | comparative evidence va limitations |

Neu user khong chi ro strategy:

- chon `trace-first` khi co session history va muc tieu lien quan den usage hoac improvement
- chon `artifact-first` khi khong co trace hoac muc tieu chi la review thiet ke/adoption

## Evaluation Input Contract

Bat buoc:

- `workflow_name`
- `workflow_artifacts`
- `workflow_version`
- `workflow_type`
- `claimed_purpose`
- `claimed_task_classes`
- `evaluation_goal`
- `evaluation_strategy`: `trace-first` hoac `artifact-first`
- `expected_behavior`
- `prohibited_behavior`
- `runtime_context`

Bat buoc cho `trace-first`:

- `session_corpus`
  - session path hoac normalized trace path
  - selection rule
  - inclusion criteria
  - exclusion criteria
  - known denominator
- `behavior_questions`, vi du:
  - agent dang gap friction gi
  - agent bat dau rework tai dau
  - cong phat sinh nao khong tao evidence moi
  - human phai can thiep o dau
- cac cohort key co the biet:
  - task class
  - workflow version
  - runtime
  - model
  - repository hoac project
  - outcome

Optional:

- `comparison_target`
- `known_constraints`
- `known_incidents`
- `change_under_test`
- `agent_observations`
- `workflow_observations` cu de backward compatibility
- `session_traces`
- `baseline_scenarios`
- `evaluation_quality_plan`
- `human_reference_review`
- `calibration_set`
- `quality_thresholds`

Neu mot field chua biet, ghi `unknown`. Khong suy doan de lam input contract trong co ve day du.

Expected behavior phai co the quan sat:

```text
Given condition X,
the agent should produce behavior Y,
must not produce behavior Z,
and should leave evidence E.
```

## Session Corpus Contract

Trace-first evaluation phai noi ro vi sao cac session duoc chon. Khong cherry-pick chi success case hoac chi failure case neu muc tieu la tim repeated pattern.

Uu tien cohort co the so sanh duoc theo:

- cung task class hoac decision rule
- cung workflow version
- cung runtime/model khi dang do workflow effect
- cung project context khi codebase complexity co the anh huong chi phi
- outcome duoc ghi ro, khong chi chon session co artifact dep

Neu corpus tron nhieu context, report phai segment ket qua thay vi gop count thanh mot failure rate.

Mot session co the xac nhan `observed once`. Pattern lap lai can co numerator va denominator, vi du `4/6 comparable sessions`. Neu denominator khong biet, ghi `recurrence unknown`.

## Local Trace Ingestion

Uu tien normalized trace artifacts thay vi raw transcript:

```text
docs/ai/session-traces/{runtime}/{session-id}/session-trace.json
docs/ai/session-traces/{runtime}/{session-id}/chat-history.ndjson
docs/ai/session-traces/{runtime}/{session-id}/command-transcript.ndjson
docs/ai/session-traces/{runtime}/{session-id}/tool-call-trace.ndjson
docs/ai/session-traces/{runtime}/{session-id}/artifact-trail.ndjson
docs/ai/session-traces/{runtime}/{session-id}/handoff-notes.json
docs/ai/session-traces/{runtime}/{session-id}/decision-log.json
docs/ai/session-traces/{runtime}/{session-id}/failure-retry-log.json
```

Commands:

```bash
python3 .agents/skills/workflow-evaluation/extract_session_trace.py --runtime codex --latest --project <repo-cwd>
python3 .claude/skills/workflow-evaluation/extract_session_trace.py --runtime claude --latest --project <repo-cwd>
python3 .agents/skills/workflow-evaluation/extract_session_trace.py --runtime opencode --latest --project <repo-cwd>
```

Opencode history thuong nam tai `~/.local/share/opencode/opencode.db`. Dung `opencode session list` va `opencode db path` de xac dinh session.

Extractor chi chuan hoa runtime events. File co ten `decision-log.json` hoac `failure-retry-log.json` khong tu dong co nghia moi decision hay failure da duoc semantic classification day du. Evaluator van phai doi chieu chat, tool result, command transcript, artifact trail, va final outcome.

Neu trace khong kha dung:

- ghi `session_traces: unavailable`
- khong tao behavioral claim
- neu muc tieu la workflow improvement, ket qua chi co the la `insufficient runtime evidence`
- co the chuyen sang artifact-first review neu user chap nhan scope do

## Bon phase evaluation

Workflow chi co bon phase human-facing:

```text
Frame -> Diagnose -> Decide -> Validate
```

Outcome reconstruction, behavioral segmentation, work classification, pattern aggregation, cause attribution, workflow mapping, controlled exercise, va replay van ton tai. Chung la checklist noi bo cua bon phase, khong phai cac phase ngang hang hoac artifact bat buoc rieng.

### 1. `Frame`

Muc dich: dong khung mot cau hoi co the tra loi bang evidence va mot corpus co the review.

Bat buoc:

- dong bang workflow version, evaluation goal, strategy, va behavior questions
- dinh nghia expected behavior, prohibited behavior, va evidence can de chung minh outcome
- ghi selection, inclusion, exclusion, denominator, va cohort keys khi dung trace-first
- ghi ro trace nao incomplete, compacted, thieu tool result, hoac thieu final outcome
- chi doc metadata can de xac dinh workflow version; khong doc workflow rules truoc blind pass

Voi artifact-first:

- xac dinh artifact set, claimed purpose, task classes, version, va scope can review
- neu muc tieu thuc su la runtime improvement nhung trace khong co, dung `insufficient runtime evidence`

Output duy nhat la `Evaluation Brief`. Khong can tao artifact rieng neu noi dung nay co the nam trong report cuoi.

`Frame Gate` dat khi cau hoi co the quan sat, strategy dung voi evidence hien co, va denominator khong bi suy doan.

### 2. `Diagnose`

Muc dich: tim first divergence, excess work, pattern, va likely cause truoc khi de xuat thay doi.

#### Trace-first blind pass

Voi moi session:

- reconstruct user intent, acceptance criteria, final/partial/failed outcome, human intervention, va artifact da tao
- doi chieu final response voi command result, tool result, file state, test output, va artifact; final response khong phai proof
- segment theo intent, decision, hoac hypothesis khi segmentation giup tim first divergence; khong bat episode trung workflow phase
- tim misunderstanding, missing/unnecessary clarification, premature execution, repeated read/command khong tao evidence moi, edit-revert, rework, recovery loop, unused artifact, manual repair, unsafe action, missing stop, poor escalation, va unsupported conclusion
- phan loai visible work khi no giup giai thich impact:
  - `productive-discovery`
  - `productive-execution`
  - `workflow-overhead`
  - `rework`
  - `recovery`
  - `coordination-cost`
  - `avoidable-repetition`
  - `unknown`
- aggregate theo decision pattern hoac failure mechanism, ghi numerator/denominator, va giu counterexample

Nhieu token, duration, hoac tool calls khong tu no la finding. Evaluator phai noi no voi outcome, first divergence, excess work, va evidence moi duoc tao ra.

#### Attribution va workflow mapping

Chi sau khi behavioral findings da duoc ghi, doc workflow artifact va:

- phan loai `workflow-caused`, `workflow-exacerbated`, `model-execution`, `runtime-tool`, `task-environment`, hoac `inconclusive`
- ghi direct evidence, alternative explanation, confidence, va evidence co the lam attribution thay doi
- map finding vao input contract, decision logic, execution control, output/evidence contract, runtime binding, missing/excessive rule, hoac `not related`
- kiem tra workflow co rule dung nhung agent khong tuan thu hay khong

#### Artifact-first diagnose

- normalize entry points, ordered phases, inputs/outputs, artifacts, responsibilities, dependencies, assumptions, va stop/retry/escalation rules
- kiem tra unclear boundaries, unused artifact, hidden dependency, weak failure visibility, unsafe escalation, excessive ceremony, va ambiguity giua human judgment, agent judgment, va tool evidence
- gan tat ca static finding la `design risk`; khong claim runtime failure neu chua co trace hoac exercise

Output la toi da nam candidate findings tren main report.

`Evidence Gate` dat cho mot behavioral finding khi:

- main claim co direct evidence reference
- first divergence duoc xac dinh hoac ghi `unknown`
- recurrence co numerator/denominator hoac ghi `recurrence unknown`
- alternative explanation da duoc xem xet
- evidence status khong bi nang cap qua muc evidence thuc co

Finding khong dat gate chi duoc giu la `unverified suspicion` hoac evidence gap.

### 3. `Decide`

Muc dich: route moi finding den dung owner va chi tao workflow experiment khi evidence ho tro.

| Attribution | Default decision |
|---|---|
| `workflow-caused` | xem xet targeted workflow experiment |
| `workflow-exacerbated` | sua mechanism nho nhat lam tang chi phi hoac risk |
| `model-execution` | `do not change workflow` tru khi co evidence workflow co the ngan chan voi chi phi hop ly |
| `runtime-tool` | route den runtime, tool, integration, hoac recovery |
| `task-environment` | route den context, environment, hoac task contract |
| `inconclusive` | thu thap them evidence; khong thay doi |

Moi workflow improvement experiment phai co:

- observed pattern va first divergence
- attribution va confidence
- falsifiable hypothesis
- smallest targeted change
- observable success threshold
- regression protection
- regression, neighbor, va control replay set

Chi adoption/promotion evaluation moi tao canonical verdict `Adopt`, `Adopt with constraints`, `Keep experimental`, hoac `Reject`.

Output cua phase la mot trong ba trang thai cho moi finding:

- `do not change workflow`
- `need more evidence`
- `run targeted improvement experiment`

`Attribution Gate` dat khi recommendation phu hop voi cause attribution va khong dung workflow change de che mot model, runtime, tool, hoac environment problem chua duoc chung minh.

### 4. `Validate`

Muc dich: kiem chung ca chat luong evaluator lan tac dong cua workflow change. Mot report day du khong tu no chung minh evaluation dung.

#### Evaluator quality validation

Moi evaluation phai:

- audit claim-to-evidence cho tat ca main findings
- cong khai `evaluation_quality_status`: `calibrated`, `partially-calibrated`, hoac `uncalibrated`
- ghi metric `Chua do` khi khong co human reference hoac calibration set

Y nghia status:

- `calibrated`: calibration set dai dien cho supported cohort va cac quality threshold khai bao da dat
- `partially-calibrated`: co human review nhung coverage con hep, mot so metric chua do, hoac threshold chua dat day du
- `uncalibrated`: khong co human reference/calibration evidence du de danh gia evaluator quality

Khi co human reference review hoac calibration set, do toi thieu:

- `evidence_support_rate`: ty le main claim co direct evidence thuc su ho tro claim
- `first_divergence_agreement`: human va evaluator co chon cung decision point khong
- `attribution_agreement`: human va evaluator co dong y source category khong
- `unsupported_workflow_attribution`: so claim `workflow-caused`/`workflow-exacerbated` khong du evidence

Calibration target khoi dau:

- `100%` main findings co direct evidence
- toi thieu `80%` agreement ve first divergence va attribution tren it nhat nam session duoc human review
- `0` unsupported workflow attribution trong sample da audit

Sample nho chi la calibration evidence, khong phai statistical proof. Khi human va evaluator bat dong, ghi disagreement va evidence; human label khong duoc coi la oracle khong can review.

Khong co calibration set khong cam evaluator tao exploratory findings, nhung evaluator khong duoc claim quy trinh evaluation da duoc kiem chung.

#### Workflow change validation

Khi co changed version:

- replay cung input, expected/prohibited behavior, pass/fail rule, va operating context neu co the
- chay regression, neighbor, va control set
- so sanh target behavior, human intervention, rework, recovery, repetition, duration, token, hoac tool calls chi khi co du lieu do duoc
- phan loai `Resolved`, `Improved but below threshold`, `Inconclusive`, `Regressed`, hoac `Hypothesis rejected`
- khong claim improvement chi vi wording ro hon, artifact dep hon, hoac agent tuan thu phase nhieu hon

Voi artifact-first, validation dung controlled success va stress/failure exercises. Finding van la `design risk` cho den khi exercise hoac trace corroborate no.

`Validation Gate` dat khi evaluator quality status va limitation duoc cong khai, main findings vuot claim-to-evidence audit, va moi improvement claim co comparable replay evidence.

### Mapping tu flow cu

| Flow cu | Bon phase moi |
|---|---|
| Intake, Corpus Selection | `Frame` |
| Outcome Reconstruction, Behavioral Segmentation, Friction Detection | `Diagnose` |
| Work Classification, Pattern Aggregation | `Diagnose` |
| Cause Attribution, Workflow Mapping | `Diagnose` |
| Improvement Contract, Improvement Decision | `Decide` |
| Baseline Exercise, Re-evaluate | `Validate` |
| HTML report | output rendering, khong phai evaluation phase |

## Finding Contract

Moi behavioral finding gom:

- `finding_id`
- `severity`: `Critical`, `High`, `Medium`, `Low`
- `evidence_status`: `agent-reported-observation`, `trace-observed`, `repeated-pattern`, `exercise-confirmed`
- `cohort` va denominator
- `observed_pattern`
- `trigger_condition`
- `first_divergence`
- `impact`
- `work_classification`
- `human_intervention`
- `cause_attribution`
- `alternative_explanation`
- `root_cause_hypothesis`
- `confidence`
- `workflow_mapping`, neu co
- `smallest_recommended_change`, hoac `do not change workflow`
- `re-test`

Severity:

- `Critical`: unsafe authorization, data loss, security boundary violation, hoac adoption blocker bat ke frequency
- `High`: repeated behavior lam workflow khong an toan, khong review duoc, hoac sai outcome quan trong
- `Medium`: rework, overhead, portability, consistency, hoac recovery problem co impact ro
- `Low`: friction cuc bo hoac cai thien nho

Observation do skill `record-workflow-friction` tao ra chi co evidence status `agent-reported-observation`. No co the mo ta bat ky friction nao trong agent execution, khong chi workflow problem. Chi sau attribution evaluator moi duoc goi no la workflow failure.

## Observation Sources

Uu tien scan:

- `docs/ai/agent-observations/*.md`
- `docs/ai/workflow-observations/*.md` de backward compatibility

Observation co the thuoc:

- workflow
- model execution
- runtime/tool
- environment
- task ambiguity
- human-agent coordination
- unknown

Khong loc observation chi vi `workflow_name` khong khop neu session/task subject co lien quan den corpus. Ghi ro selection rule va paths da chon.

## Report Contract

Ghi report vao:

```text
docs/ai/workflow-evals/{name}.html
```

Dung `docs/ai/project/templates/workflow-evaluation-report.html`.

Bat buoc:

- human-facing content bang tieng Viet
- self-contained HTML5, inline CSS, khong JavaScript/CDN/build dependency
- escape untrusted trace content
- khong embed secret, credential, token, hoac raw transcript khong can thiet
- chart chi dung count/rate/measure that; neu chua co thi ghi `Chua do`
- cong khai `evaluation_quality_status` va human/calibration coverage; neu chua co thi ghi `uncalibrated`
- decision summary duoi 120 tu
- toi da nam finding chinh tren main page
- methodology, normalized workflow, full trace va lower findings nam trong appendix
- khong con unresolved `{{PLACEHOLDER}}`

Required section IDs:

- `#decision-summary`
- `#session-behavior`
- `#key-findings`
- `#cause-attribution`
- `#improvement-impact`
- `#action-plan`
- `#scope-limitations`
- `#evidence-appendix`

Voi trace-first report, main page phai uu tien:

- corpus coverage
- repeated behavioral patterns
- first divergence
- rework, recovery, repetition, va human intervention
- cause attribution
- evaluator quality status va claim-to-evidence audit
- prioritized improvement experiments

Normalized workflow model va phase compliance chi nam trong appendix tru khi no truc tiep gay ra mot finding chinh.

Voi artifact-first adoption report, `#decision-summary` phai hien canonical verdict bang nhan tieng Viet kem gia tri tieng Anh.

## Anti-patterns

- coi viec di qua day du step hoac tao report dep la proof evaluation dung
- bien checklist noi bo thanh phase/artifact rieng ma khong tao decision value
- doc workflow truoc blind trace pass trong trace-first evaluation
- danh gia session chi bang muc do tuan thu phase
- coi nhieu tool calls hoac token cao la failure ma khong co outcome/first divergence
- gan runtime, model, task, hoac environment problem cho workflow
- them workflow rule cho moi anomaly cua agent
- bao cao recurrence ma khong co denominator
- coi final response la proof ma khong doi chieu tool/artifact evidence
- coi extractor bucket la semantic diagnosis day du
- claim evaluator da duoc kiem chung khi khong co human reference/calibration evidence
- claim improvement ma khong replay scenario tuong duong
- dung mot success session de promote workflow

## Done Criteria

Moi evaluation hoan tat khi:

- `Frame`, `Diagnose`, `Decide`, va `Validate` co output co the review
- main findings vuot `Evidence Gate`
- recommendation vuot `Attribution Gate`
- `evaluation_quality_status` va limitation duoc cong khai
- report khong dung process completeness lam proxy cho diagnostic quality

Trace-first evaluation con phai co:

- corpus selection va denominator duoc ghi ro
- session outcome duoc reconstruct bang evidence
- blind behavioral pass xay ra truoc workflow mapping
- findings co first divergence, work classification, va cause attribution
- repeated claims co numerator/denominator hoac ghi recurrence unknown
- chi workflow-caused/workflow-exacerbated findings moi tao workflow improvement contract
- before/after claim co regression, neighbor, va control evidence
- report phan biet ro agent problem voi workflow problem

Artifact-first evaluation con phai co:

- normalized workflow structure duoc ghi
- static findings duoc gan `design risk`
- exercise evidence co hoac limitations duoc ghi ro
- adoption verdict khop evidence va supported scope

Moi full evaluation phai tao mot self-contained Vietnamese HTML report dung report contract.

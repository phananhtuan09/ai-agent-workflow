---
phase: project
title: Tieu chuan Danh gia Workflow
description: Quy trinh chuan de danh gia bat ky workflow AI agent nao va tao bao cao HTML tieng Viet de con nguoi de doc
---

# Tieu chuan Danh gia Workflow

## Muc dich
Tai lieu nay dinh nghia mot workflow rieng de danh gia cac workflow AI agent nhu mot doi tuong can review.

Day khong phai workflow coding tieu chuan.
No ton tai de danh gia xem mot workflow co:
- huu ich hay khong
- ro rang hay khong
- du tinh portable cho pham vi muc tieu hay khong
- an toan de adopt hoac promote hay khong
- dang that bai theo cach co the quan sat duoc trong qua trinh su dung thuc te hay khong
- co duoc cai thien sau mot thay doi co chu dich hay khong

Workflow nay ap dung cho bat ky workflow AI agent nao, khong chi workflow coding dang duoc su dung trong repository nay.

## Tai sao can tai lieu nay
Operational workflow tra loi nhung cau hoi nhu:
- agent nen thuc hien mot task nhu the nao
- human va agent nen phoi hop nhu the nao
- can tao, tieu thu, hoac review artifact nao
- khi nao workflow nen dung, escalate, retry, hoac handoff

Workflow danh gia nay tra loi mot cau hoi khac:
- thiet ke workflow co dang de dung, giu lai, so sanh, hay promote hay khong
- hanh vi quan sat duoc bat dau lech khoi ky vong tu diem nao
- bang chung nao ho tro cho mot van de cua workflow
- thay doi nho nhat nao co kha nang cai thien workflow
- workflow da thay doi co hoat dong tot hon tren cac scenario tuong duong ma khong bi regression hay khong

Neu khong co mot luong danh gia rieng, thay doi workflow thuong bi danh gia bang truc giac, mot vai case thanh cong rieng le, prompt trong co dep hay khong, hoac do quen tay cua nguoi van hanh thay vi bang bang chung lap lai tren pham vi ma workflow tuyen bo ho tro.

Vi vay, workflow danh gia nay khong chi la review tai lieu. No la mot vong lap bang chung:

```text
Pain khi su dung
  → incident co the quan sat
  → first divergence
  → gia thuyet root cause
  → baseline
  → thay doi co chu dich
  → so sanh truoc/sau
  → retained learning
```

## Nguyen tac cot loi
Hay coi workflow dang duoc review la doi tuong dang bi danh gia.

Khong tron lan:
- xay workflow
- dung workflow de hoan thanh cong viec goc ma no huong dan
- danh gia xem workflow do co du tot de giu lai hay khong

Day la ba task khac nhau va can duoc tach rieng.

Moi finding da duoc xac nhan phai giu duoc chuoi sau:

```text
Claim → Evidence → Impact → Hypothesis → Recommended change → Re-test
```

Static inspection co the phat hien mot design risk. Nhung khong duoc trinh bay no nhu mot runtime failure da duoc xac nhan neu khong co bang chung tu luc thuc thi.

## Khi nao nen dung workflow nay

| Truong hop danh gia | Dung workflow nay |
|---|---|
| Chan doan mot workflow kho su dung | `Intake` → `Observe` → `Normalize` → `Diagnose` → `Baseline Exercise` → `Improvement Contract` → `Verdict` |
| Chung minh mot thay doi workflow co cai thien hanh vi hay khong | cac phase truoc do → external change → `Re-evaluate` → `Verdict` |
| De xuat workflow moi | `Intake` → `Normalize` → `Diagnose` → `Baseline Exercise` → `Verdict` |
| So sanh hai bien the workflow | `Intake` → `Normalize` → `Diagnose` → `Baseline Exercise` → `Re-evaluate` → `Verdict` |
| Quyet dinh co nen promote mot pattern dang experimental | `Intake` → `Observe` → `Normalize` → `Diagnose` → `Baseline Exercise` → `Verdict` |
| Review xem mot workflow hien co co nen tiep tuc lam standard hay khong | `Intake` → `Observe` → `Normalize` → `Diagnose` → `Baseline Exercise` → `Verdict` |

Khong dung workflow nay de:
- thuc hien cong viec goc ma mot workflow khac dang huong dan
- implement mot product feature
- fix product code
- van hanh workflow support, research, planning, design, security, DevOps, documentation, hay coding nhu chinh cong viec can lam
- thay the cac buoc execution hoac verification binh thuong ben trong workflow dang duoc danh gia

## Luong chuan

```text
Workflow candidate hoac workflow variant
  ↓
Intake
  ↓
Observe, neu da co su dung thuc te
  ↓
Normalize
  ↓
Diagnose
  ↓
Baseline Exercise
  ↓
Improvement Contract
  ↓
Thay doi workflow co chu dich ben ngoai tien trinh danh gia nay
  ↓
Re-evaluate bang cac scenario tuong duong
  ↓
Verdict
```

`Observe`, `Improvement Contract`, va `Re-evaluate` la bat buoc khi muc tieu la cai thien mot workflow dang ton tai va chung minh su cai thien do. Mot review adoption lan dau co the ket thuc sau `Baseline Exercise` va `Verdict`.

## Evaluation Input Contract
Truoc `Intake`, hay dinh nghia toi thieu cac input sau cho danh gia:
- `workflow_name`
- `workflow_artifacts`
- `workflow_type`
  - document
  - command set
  - prompt wrapper
  - skill
  - runtime binding
  - end-to-end operating model
- `claimed_purpose`
- `claimed_task_classes`
- `evaluation_goal`
  - adoption review
  - comparison
  - regression review
  - promotion decision
- `expected_behavior`
  - ket qua co the quan sat duoc ma workflow can tao ra
  - ket qua bi cam hoac hanh vi khong an toan
  - bang chung workflow can de lai
- `workflow_version`
- `known_incidents`, neu workflow da tung duoc su dung
  - user intent
  - expected behavior
  - observed behavior
  - impact
  - available evidence
- `change_under_test`, neu dang re-evaluate mot cai tien
- `comparison_target`, neu dang danh gia hai bien the
- `runtime_context`
- `known_constraints`
- `session_traces`, neu co san
  - chat history
  - command transcript
  - tool-call trace
  - artifact trail
  - handoff notes
  - decision log
  - failure or retry log

Huong uu tien cho local trace ingestion:
- neu co the, chuan hoa local runtime session history thanh mot bo artifact dung chung truoc khi danh gia
- dung extractor duoc ship kem trong skill `workflow-evaluation` de chuyen doi runtime history duoc ho tro thanh:
  - Codex hoac Antigravity: `python3 .agents/skills/workflow-evaluation/extract_session_trace.py ...`
  - Claude Code: `python3 .claude/skills/workflow-evaluation/extract_session_trace.py ...`
  - Opencode: `python3 .agents/skills/workflow-evaluation/extract_session_trace.py --runtime opencode ...`
- extractor se ghi ra:
  - `docs/ai/session-traces/{runtime}/{session-id}/session-trace.json`
  - `chat-history.ndjson`
  - `command-transcript.ndjson`
  - `tool-call-trace.ndjson`
  - `artifact-trail.ndjson`
  - `handoff-notes.json`
  - `decision-log.json`
  - `failure-retry-log.json`
- cac nguon session-history local thuong gap:
  - Claude Code: `~/.claude/projects/<project>/<session>.jsonl`
  - Codex: `~/.codex/sessions/YYYY/MM/DD/<session>.jsonl`
  - Opencode: co so du lieu SQLite tai `~/.local/share/opencode/opencode.db`
    - xem session co san bang `opencode session list`
    - xem duong dan db bang `opencode db path`
    - extract session moi nhat phu hop bang `python3 .agents/skills/workflow-evaluation/extract_session_trace.py --runtime opencode --latest --project <repo-cwd>`
    - hoac extract mot session cu the bang `python3 .agents/skills/workflow-evaluation/extract_session_trace.py --runtime opencode --session-id <session-id>`

Bat buoc:
- khong bat dau danh gia cho den khi cac truong nay duoc lam ro
- neu mot truong chua biet, ghi ro la unknown thay vi tu suy doan
- neu khong co session traces, ghi `session_traces: unavailable` thay vi tu tao ra hanh vi runtime
- dien dat ky vong duoi dang hanh vi co the quan sat duoc thay vi nhan xet chu quan nhu `easy`, `robust`, hoac `good`

Dinh dang expectation:

```text
Given condition X,
the workflow should produce behavior Y,
must not produce behavior Z,
and should leave evidence E.
```

Khuyen nghi:
- giu input contract ngan gon de co the dat gan dau evaluation artifact
- khi danh gia mot workflow da duoc dung trong cong viec thuc te, nen co it nhat mot session trace dai dien truoc khi ra quyet dinh promotion
- uu tien normalized trace artifacts thay vi transcript thô hoac database export theo tung runtime khi so sanh workflow giua Claude Code, Codex, va Opencode

Vi du normalized trace contract:

```yaml
session_traces:
  runtime: codex
  source_transcript: ~/.codex/sessions/2026/07/14/rollout-2026-07-14T23-11-34-019f6165-e192-7df1-9ba2-1d04d476a678.jsonl
  normalized_trace_dir: docs/ai/session-traces/codex/019f6165-e192-7df1-9ba2-1d04d476a678
  session_trace: docs/ai/session-traces/codex/019f6165-e192-7df1-9ba2-1d04d476a678/session-trace.json
  chat_history: docs/ai/session-traces/codex/019f6165-e192-7df1-9ba2-1d04d476a678/chat-history.ndjson
  command_transcript: docs/ai/session-traces/codex/019f6165-e192-7df1-9ba2-1d04d476a678/command-transcript.ndjson
  tool_call_trace: docs/ai/session-traces/codex/019f6165-e192-7df1-9ba2-1d04d476a678/tool-call-trace.ndjson
  artifact_trail: docs/ai/session-traces/codex/019f6165-e192-7df1-9ba2-1d04d476a678/artifact-trail.ndjson
  handoff_notes: docs/ai/session-traces/codex/019f6165-e192-7df1-9ba2-1d04d476a678/handoff-notes.json
  decision_log: docs/ai/session-traces/codex/019f6165-e192-7df1-9ba2-1d04d476a678/decision-log.json
  failure_retry_log: docs/ai/session-traces/codex/019f6165-e192-7df1-9ba2-1d04d476a678/failure-retry-log.json
```

## Cac phase danh gia

### 1. `Intake`
Muc dich:
- xac dinh chinh xac workflow nao dang duoc danh gia

Quy tac:
- xac dinh bo artifact cua workflow dang duoc review:
  - document
  - command set
  - prompt wrapper
  - skill
  - runtime binding
  - end-to-end operating model
- mo ta muc dich workflow tuyen bo bang ngon ngu don gian
- dinh nghia cac lop task ma workflow du kien ho tro, vi du:
  - small bounded execution tasks
  - ambiguous planning or decision tasks
  - research and synthesis tasks
  - review, audit, or verification tasks
  - incident, support, or triage tasks
  - feature delivery or bug-fix tasks
  - design, documentation, or migration tasks
  - coordination or handoff-heavy tasks
  - portability across projects, teams, tools, or runtimes
- neu ro muc tieu danh gia:
  - adoption review
  - comparison
  - regression review
  - promotion decision

Expected output:
- `Evaluation Target Definition` gom:
  - workflow name
  - workflow version
  - artifact set under review
  - claimed purpose
  - intended task classes
  - evaluation goal
  - observable expected behavior
  - comparison target, neu co

### 2. `Observe`
Muc dich:
- bien pain trong qua trinh su dung thuc te thanh cac incident co the review duoc thay vi dua vao tri nho hoac su khong hai long chung chung

Chi dung phase nay khi workflow da tung duoc su dung. Neu chua co lich su su dung, ghi `no observed incidents` va tiep tuc bang designed scenarios.

Quy tac:
- thu thap cac session dai dien noi workflow can su can thiep bat ngo tu human, tao ra ket qua sai hoac thieu, bi loop, dung sai, hoac ton chi phi bat thuong
- khong bat dau bang mot gia thuyet ve viec rule nao cua workflow dang sai
- voi moi incident, ghi:
  - user intent
  - expected behavior
  - observed behavior
  - first point noi expected va observed behavior bat dau lech nhau
  - practical impact
  - supporting trace hoac artifact
- chuyen pain mang tinh chu quan thanh tin hieu failure co the quan sat duoc
- nhom cac incident lap lai theo pattern hanh vi, khong theo do giong nhau ve cau chu
- phan biet:
  - isolated execution anomaly
  - repeated workflow failure pattern
  - usability friction
  - unverified suspicion

Expected output:
- `Workflow Incident Set` gom:
  - incident ID
  - source session hoac scenario
  - expected behavior
  - observed behavior
  - first divergence
  - impact
  - evidence links
  - recurrence count hoac `unknown`

Vi du ve tin hieu failure co the quan sat:

| Pain duoc bao cao | Tin hieu co the quan sat |
|---|---|
| Agent hieu sai request | Output vi pham mot acceptance criterion da duoc neu ro |
| Workflow qua nang | Step hoac artifact tao them chi phi nhung khong duoc dung lai o buoc sau |
| Agent hoi qua nhieu | Cau hoi lap lai context da biet hoac khong anh huong den quyet dinh |
| Agent hoi qua it | No tu suy doan mot unknown quan trong voi business roi tiep tuc |
| Ket qua khong nhat quan | Cac lan chay tuong duong tao ra quyet dinh hoac ket qua khac nhau mot cach dang ke |
| Handoff kho khan | Khong the tai tao state, evidence, hoac pending decisions |

### 3. `Normalize`
Muc dich:
- ep cac workflow khac nhau ve mot cau truc co the so sanh duoc

Quy tac:
- viet lai workflow thanh mot normalized model voi cac truong sau:
  - entry points
  - ordered phases
  - input for each phase
  - output for each phase
  - durable artifacts
  - human responsibilities
  - agent responsibilities
  - runtime or tool dependencies
  - assumptions that must hold for the workflow to work
- chua danh gia o buoc nay
- giam ambiguity truoc de cac judgement ve sau co the so sanh duoc

Expected output:
- `Normalized Workflow Model` gom:
  - entry points
  - ordered phases
  - phase inputs
  - phase outputs
  - durable artifacts
  - human responsibilities
  - agent responsibilities
  - runtime dependencies
  - required assumptions

Bat buoc:
- viet no duoi dang artifact co cau truc, khong phai loose prose
- tach rieng verified workflow behavior khoi inferred structure

### 4. `Diagnose`
Muc dich:
- ket hop static review va bang chung quan sat duoc de xac dinh workflow that bai o dau va tai sao

Quy tac:
- kiem tra xem moi step co human-readable hay khong
- kiem tra xem moi phase co input, output, va next decision ro rang hay khong
- danh dau cac artifact lap lai thong tin da co san hoac khong co nguoi doc thuong xuyen
- danh dau cac step mang tinh nghi le nhung khong cai thien chat luong, an toan, hay hieu qua thuc thi
- tach verified workflow properties khoi inferred properties
- neu co session traces, kiem tra xem hanh vi workflow duoc khai bao co khop voi conversation, tool use, va handoff pattern thuc te hay khong
- xac dinh xem workflow co phu thuoc qua nang vao:
  - hidden chat memory
  - mot runtime cu the
  - informal operator judgment
  - undocumented conventions
- ghi lai cac risk, blind spot, va failure mode co kha nang xay ra
- voi moi incident quan sat duoc, truy nguoc ve first divergence thay vi gan nguyen nhan tu output cuoi cung
- phan loai moi finding theo failure layer:
  - input contract
  - decision logic
  - execution control
  - output or evidence contract
- phan biet `design risk` voi `confirmed behavior failure`
- viet root-cause hypothesis co the bi phan chung cho cac failure da xac nhan hoac lap lai

Expected output:
- `Audit Findings`, trong do moi finding gom:
  - `severity`: `Critical`, `High`, `Medium`, hoac `Low`
  - `status`: `design risk`, `observed once`, `repeated`, hoac `confirmed by exercise`
  - `area`: clarity, artifact usefulness, portability, safety, cost, hoac failure visibility
  - `failure_layer`
  - `claim`
  - `trigger_condition`
  - `evidence`
  - `impact`
  - `root_cause_hypothesis`
  - `confidence`
  - `smallest_recommended_change`
  - `re-test_scenario`

Mapping theo audit rule:
- rule 1 trong `AI_WORKFLOW_RULES.md`, optimize for real value:
  - danh dau cac step hoac artifact chi tao them nghi le ma khong tang ro rang chat luong, an toan, hay hieu qua
- rule 2, keep every step human-readable:
  - danh dau cac phase khong co input, output, hoac next decision ro rang
- rule 3, add only patterns proven by real usage:
  - danh dau cac claim ve promotion duoc xay tren su dep, day du, hoac mot vai lan thanh cong thay vi bang chung lap lai
- rule 4, separate human judgment from agent verification:
  - danh dau noi ma assumption hoac human review bi trinh bay nhu mot su that workflow da duoc verify

Huong dan severity:
- `Critical`: cho phep hanh dong khong duoc uy quyen, gay mat du lieu, vo bien gioi bao mat, hoac mot ket qua khac bat buoc phai chan adoption bat ke tong diem
- `High`: chan viec adopt an toan, che giau bat dinh lon, hoac lam workflow mat kha nang review
- `Medium`: van dung duoc neu co rang buoc, nhung portability hoac consistency bi giam
- `Low`: cai thien huu ich, van de wording, hoac ambiguity cuc bo khong anh huong lon den quyet dinh

Suc manh cua bang chung:
- chi dua vao workflow text thi moi ho tro duoc `design risk`
- session trace ho tro cho hanh vi `observed`
- pattern lap lai tren cac trace tuong duong se tang do manh cho claim cap workflow
- mot exercise co kiem soat ma tai hien duoc hanh vi do se xac nhan finding trong pham vi da test

Khong suy ra nhan qua chi tu su tuong quan. Root-cause hypothesis van chi la gia thuyet cho den khi mot thay doi co chu dich lam thay doi hanh vi nhu du doan.

### 5. `Baseline Exercise`
Muc dich:
- test workflow hien tai tren cac scenario thuc te va dong bang mot baseline de so sanh ve sau

Quy tac:
- chay workflow voi mot tap nho scenario dai dien
- uu tien lop scenario on dinh hon la vi du dung mot lan
- toi thieu, phai cover cac task class va operating context ma workflow tuyen bo ho tro
- neu co real session traces, dung chung no nhu bang chung chinh ben canh cac scenario tong hop
- bao gom ca success-path va stress-path khi workflow co claim ve safety, reliability, hoac portability
- thu thap bang chung nhu:
  - ambiguity duoc giai o dau
  - assumption nao van bi de ngam
  - artifact co thuc su duoc dung lai boi step sau hoac actor sau hay khong
  - real chat history co the hien cung mot decision pattern ma workflow tuyen bo dang dung hay khong
  - human judgment, agent judgment, tool output, hoac external system state da anh huong ket qua o dau
  - workflow bi vo, bi loop, escalate, hoac dung dung cach o dau
  - chi phi tuong doi ve thoi gian, tokens, handoffs, tools, hoac complexity neu nhin thay duoc
- khong coi mot lan chay thanh cong la bang chung cho tinh huu ich tong quat
- dong bang workflow version, scenario input, expected behavior, va evaluation rule truoc khi chay baseline
- khi mot finding den tu incident thuc te, neu co the thi dua mot phien ban co the tai hien cua incident do thanh regression scenario

Khuyen nghi cac lop baseline scenario:
- mot task nho, bounded trong domain ma workflow tuyen bo ho tro
- mot task ambiguity, thieu thong tin, hoac de gay xung dot
- mot task muc vua can handoff, review, persistence, hoac verification ve sau
- mot task failure-path noi thieu input, tool/runtime khong san sang, hoac khong the ra quyet dinh an toan

Cho cong viec cai tien, phan loai scenario thanh:
- `regression`: tai hien mot incident da biet va kiem tra xem targeted failure da duoc fix chua
- `neighbor`: bien doi incident nhung giu cung decision rule nen tang va kiem tra xem cai tien co tong quat duoc hay khong
- `control`: dai dien cho hanh vi da tung hoat dong dung va kiem tra xem thay doi moi co gay regression hay khong

Mot thay doi khong duoc coi la da chung minh chi boi viec pass regression scenario goc cua no.

Huong dan scenario theo loai workflow:
- workflow coding hoac spec-driven:
  - cover mot thay doi nho, mot thay doi ambiguity, va mot thay doi muc vua can durable handoff hoac verification
  - neu co session traces, so sanh luong khai bao voi lich su chat va tool thuc te
- workflow research hoac synthesis:
  - cover mot task tim fact hep, mot task ambiguity ve chat luong nguon, va mot task synthesis co bang chung mau thuan
  - neu co session traces, kiem tra xem buoc chon nguon va synthesis co duoc tuan thu thuc te hay khong
- workflow review, audit, hoac security:
  - cover mot clean case, mot case co van de ro rang, va mot case co van de tinh te hoac ambiguity
  - neu co session traces, kiem tra xem finding co duoc neo vao bang chung thay vi chi suy luan hay khong
- workflow planning hoac product:
  - cover mot request da du scope ro, mot request chua ro, va mot request can prioritization hoac trade-off
  - neu co session traces, kiem tra xem cac decision point co duoc lam ro va ghi lai hay khong
- workflow support, incident, hoac triage:
  - cover mot case thong thuong, mot case khan cap/escalation, va mot case co tin hieu thieu hoac mau thuan
  - neu co session traces, kiem tra xem escalation va stop condition co duoc tuan thu khong
- workflow design hoac documentation:
  - cover mot cap nhat artifact don gian, mot case can dong bo giua nhieu tai lieu, va mot case can quyet dinh ve audience hoac scope
  - neu co session traces, kiem tra xem artifact tao ra co thuc su duoc consumer dung lai hay khong
- workflow DevOps, release, hoac migration:
  - cover mot duong di thong thuong, mot duong rollback/failure, va mot case co rang buoc theo environment
  - neu co session traces, kiem tra xem operational risk co duoc surface som du khong
- reusable workflow base:
  - ap base vao mot context moi va ghi lai cai gi bi vo hoac can customize
  - so sanh hai phien ban cua cung mot phase tren cung scenario va ghi lai chat luong output cung chi phi
  - cap nhat mot rule hoac phase trong base, sau do ap no vao mot context da dung base va kiem tra tinh tuong thich

Incremental re-evaluation:
Khi workflow thay doi thuong xuyen, khong phai luc nao cung can mot full evaluation run. Chon duong nhe nhat:
- thay doi artifact path hoac naming → chay lai `Diagnose` chi tren artifact da doi
- thay doi hanh vi command hoac skill → chay `Re-evaluate` voi frozen scenarios
- thay doi ranh gioi phase → chay lai `Normalize`, `Diagnose`, va cac scenario bi anh huong
- them command, skill, hoac phase moi → full `Intake` → `Normalize` → `Diagnose` → `Baseline Exercise` → `Verdict`
- thay doi nham giai quyet mot finding → luon replay `regression`, `neighbor`, va `control` scenarios

Bang chung tu session trace:
Khi co real chat/session history, hay thu thap:
- user request hoac trigger bat dau session
- cac workflow phase transition duoc the hien ro trong session
- cac workflow phase transition bi suy dien, bi bo qua, hoac bi mo
- cac cau hoi agent da hoi va chung co thuc su can thiet hay khong
- cac quyet dinh do human, agent, hoac tools dua ra
- tool calls, commands, artifacts, va handoffs duoc tao trong session
- noi agent dua vao hidden context, memory, hoac assumption khong noi ra
- noi workflow da ngan chan hoac that bai trong viec ngan chan loi, loop, thuc thi som, hoac hanh dong khong an toan
- cac output tu buoc truoc co duoc buoc sau dung lai hay khong
- noi ma session thuc te lech khoi workflow duoc khai bao

Dung session trace de xac dinh cac failure mode thuc te, khong phai de chung minh tinh huu ich tong quat chi bang mot success case.

Downstream evidence:
Khi workflow da duoc ap dung vao project thuc te hoac cac session lap lai, hay ghi lai:
- phan nao duoc giu nguyen va phan nao bi override theo tung project hoac session
- artifact nao bi bo qua va artifact nao duoc them vao theo tung project hoac session
- failure mode nao trong session trace lap lai qua nhieu context
- day la tin hieu manh nhat de biet workflow co portable va reusable hay khong

Expected output:
- `Scenario Evidence Set` gan voi cac scenario cu the
- `Session Trace Evidence Set` gan voi cac session thuc te khi trace co san

Minimum exercise protocol:
- cover it nhat mot scenario cho moi claimed task class
- neu workflow tuyen bo co portability giua runtime hoac project, test it nhat hai context hoac ghi ro portability la chua verify
- voi moi scenario, ghi:
  - scenario name
  - scenario class
  - workflow version
  - expected workflow behavior
  - prohibited behavior
  - observed workflow behavior
  - pass or fail rule
  - ambiguity duoc resolve o dau
  - artifact nao duoc buoc sau dung lai
  - workflow bi vo o dau
  - ghi chu chi phi neu co the quan sat

Khuyen nghi:
- tai su dung cung mot bo baseline scenarios giua cac workflow variant khi so sanh
- uu tien bang bang chung thay vi mo ta dai dong

### 6. `Improvement Contract`
Muc dich:
- bien mot finding da co bang chung thanh mot gia thuyet cai tien nho va co the kiem chung

Quy tac:
- khong thiet ke lai toan bo workflow neu mot thay doi nho hon da du de test root-cause hypothesis
- dinh nghia mot behavioral change chinh cho moi improvement contract
- noi ro cai gi can cai thien, cai gi phai giu nguyen, va bang chung nao se phan chung gia thuyet
- giu rieng vai tro evaluation khoi implementation: phase nay chi khuyen nghi va dinh nghia thay doi; workflow owner hoac mot task implementation khac se ap dung thay doi
- giu nguyen baseline workflow version va bang chung truoc khi co bat ky thay doi nao

Dinh dang bat buoc:

```text
Finding:
Van de workflow da duoc ho tro bang chung.

Hypothesis:
Neu ap dung thay doi X, hanh vi Y se cai thien vi bang chung cho thay nguyen nhan Z.

Targeted change:
Thay doi workflow nho nhat de kiem tra gia thuyet.

Success threshold:
Ket qua co the quan sat can dat de coi finding da duoc giai quyet hoac cai thien.

Regression protection:
Hanh vi bat buoc phai giu nguyen.

Re-evaluation set:
Regression, neighbor, va control scenarios can replay.
```

Expected output:
- `Improvement Contract Set` lien ket 1-1 voi nhung finding duoc chon de remediation

### 7. `Re-evaluate`
Muc dich:
- xac dinh xem workflow da thay doi co cai thien hanh vi du doan ma khong gay regression khong chap nhan duoc hay khong

Quy tac:
- so sanh mot baseline workflow version da dinh danh voi mot changed version da dinh danh
- replay cung frozen inputs, expected behaviors, pass/fail rules, va operating context neu co the
- toi thieu phai chay:
  - regression scenario gan voi finding
  - mot neighbor scenario de test kha nang tong quat hoa
  - mot control scenario de bao ve hanh vi da dung truoc do
- ghi lai cac khac biet ve environment hoac model khien viec so sanh khong con nghiem ngat
- so sanh ca hanh vi va chi phi; khong duoc claim la da cai thien chi vi workflow text trong ro hon
- phan loai ket qua cho moi improvement hypothesis thanh:
  - `Resolved`
  - `Improved but below threshold`
  - `Inconclusive`
  - `Regressed`
  - `Hypothesis rejected`
- giu lai cac finding moi bat ngo thay vi giau chung trong summary so sanh

Bang chung truoc/sau:

| Measure | Baseline version | Changed version | Result |
|---|---|---|---|
| Target behavior | observed result | observed result | improved, unchanged, hoac worse |
| Prohibited behavior | occurrence count | occurrence count | improved, unchanged, hoac worse |
| Control behavior | observed result | observed result | preserved hoac regressed |
| Human intervention | count hoac description | count hoac description | improved, unchanged, hoac worse |
| Cost | time, tokens, steps, hoac handoffs | time, tokens, steps, hoac handoffs | improved, unchanged, hoac worse |

Expected output:
- `Before/After Evidence Set`
- `Improvement Result` cho moi hypothesis duoc test
- `Regression Findings`, neu co

Gioi han bang chung:
- neu khong co baseline duoc giu lai truoc khi workflow thay doi, ghi ket qua la `Inconclusive` tru khi co the tai tao va exercise old version trong dieu kien tuong duong
- y kien hoi cuu rang phien ban moi "cam thay tot hon" khong phai bang chung cua su cai thien

### 8. `Verdict`
Muc dich:
- bien quyet dinh promote hay reject thanh minh bach

Quy tac:
- chon mot trang thai cuoi cung:
  - `Adopt`
  - `Adopt with constraints`
  - `Keep experimental`
  - `Reject`
- noi ro workflow hoat dong tot o dau
- noi ro no khong nen duoc dung o dau
- neu chua san sang de promote, noi ro can thay doi gi truoc khi promote
- khong promote mot pattern workflow chi dua tren su dep, tinh day du, hoac do bao phu ly thuyet
- tach maturity scoring khoi final decision; chi mot finding `Critical` cung co the chan adoption bat ke tong diem

Expected output:
- `Decision Record` gom:
  - final status
  - supported scope
  - unsupported scope
  - evidence summary
  - blocking issues
  - required changes before promotion, neu chua san sang

Heuristic cho verdict:
- `Adopt`:
  - khong con finding `Critical` chua giai quyet
  - khong con finding `High` chua giai quyet
  - exercise evidence cover duoc cac core task class ma workflow tuyen bo
  - artifact va ranh gioi phase co the review duoc trong su dung thuong xuyen
- `Adopt with constraints`:
  - workflow huu ich, nhung chi trong cac gioi han ro rang ve runtime, team, hoac task
  - van de con ton dong khong chan viec su dung an toan trong cac gioi han do
- `Keep experimental`:
  - workflow co tiem nang, nhung evidence coverage van mong hoac qua hep
  - portability, repeatability, hoac artifact usefulness chua duoc chung minh de promote thanh standard
- `Reject`:
  - con it nhat mot van de `Critical` chua giai quyet
  - con it nhat mot van de `High` chua giai quyet
  - complexity, ambiguity, hoac hidden dependency lon hon gia tri da duoc chung minh
  - ket qua exercise lap lai cho thay workflow vo trong chinh pham vi ma no tuyen bo

Khi muc tieu danh gia la cai thien thay vi adoption, can bao cao them finding-level result tu `Re-evaluate`. Khong duoc bien `Improved` thanh `Adopt` neu chua dap ung day du heuristic adoption.

## Tieu chi danh gia
Danh gia workflow theo cac chieu sau khi phu hop:
- do ro rang cua ranh gioi giua cac phase
- do ro rang cua entry va exit conditions
- do huu ich cua artifact
- kha nang human review
- su tach bach giua assumption, human judgment, agent judgment, va verified facts
- portability qua cac project, team, tool, runtime, hoac domain ma workflow tuyen bo ho tro
- muc do phu thuoc vao hidden memory, undocumented conventions, hoac local operator knowledge
- chi phi tuong xung voi gia tri
- do hien lo failure va hanh vi stop/escalation an toan
- muc do phu hop voi kich thuoc task va risk level ma workflow tuyen bo
- tinh lap lai duoc tren cac scenario dai dien va real session traces
- tinh tuong thich voi downstream consumer hoac phase ve sau
- traceability tu session history den declared workflow behavior
- chat luong chan doan: finding co xac dinh duoc first divergence va tach duoc symptom khoi likely cause
- suc manh bang chung: claim duoc gan nhan design risk, observed behavior, repeated pattern, hoac exercise-confirmed finding
- do hop le cua cai tien: so sanh truoc/sau dung scenario tuong duong va explicit threshold
- kha nang chong regression: targeted improvement van giu duoc hanh vi da dung truoc do
- anti-gaming: keyword cua workflow hoac cac step mang tinh nghi le khong duoc thuong neu khong anh huong den execution hoac evidence

Khong workflow nao can toi uu tat ca cac chieu nay.
Danh gia can tra loi xem workflow co du tot cho pham vi muc tieu va muc do rui ro cua no hay khong.

## Evaluation Artifact
Ghi ket qua danh gia vao:
- `docs/ai/workflow-evals/{name}.html`

Report contract:
- dung `docs/ai/project/templates/workflow-evaluation-report.html` lam cau truc va visual baseline chuan
- toan bo giai thich huong toi human phai viet bang tieng Viet
- giu nguyen code identifiers, file paths, commands, quoted evidence, va canonical status values neu dich se lam giam traceability
- hien verdict theo dang nhan tieng Viet theo sau boi canonical value, vi du `Chap nhan co dieu kien (Adopt with constraints)`
- tao mot file HTML5 tu chua, self-contained, voi inline CSS
- khong yeu cau JavaScript, build step, CDN, external fonts, hoac network access
- dung semantic HTML, responsive tables, visible focus states, do tuong phan mau du, va print-friendly styles
- lam cho evidence chain va decision summary co the scan nhanh truoc khi vao detailed findings
- coi HTML report la mot projection huong quyet dinh cua evaluation, khong phai mot ban dump theo tung phase cua quy trinh audit noi bo
- giu cac contract chi tiet, normalized model, traces, va raw evidence trong appendix co the mo ra, tru khi chung anh huong truc tiep den quyet dinh
- chi dung chart cho du lieu da do hoac da dem; khong bao gio tu che phan tram, diem so, hoac do chinh xac de tao hieu ung thi giac
- neu mot metric khong co san, gan nhan `Chua do` thay vi uoc luong
- escape moi noi dung trace khong dang tin truoc khi chen vao HTML
- khong bao gio embed secrets, credentials, tokens, hoac raw transcript khong can thiet
- thay the tat ca template placeholder; mot final report con `{{...}}` la chua hoan chinh

Required report sections:
- `#decision-summary` — quyet dinh, confidence, blocking issue, va hanh dong human can thuc hien
- `#workflow-health` — tong quan bang visual ve finding, evidence coverage, scenario result, va cost neu co du lieu
- `#key-findings` — toi da nam finding quan trong nhat, uu tien theo impact
- `#improvement-impact` — before/after va regression status khi co workflow change
- `#action-plan` — remediation duoc uu tien, owner hoac next gate, va re-test can chay
- `#scope-limitations` — pham vi da chung minh, chua chung minh, va gioi han cua evidence
- `#evidence-appendix` — chi tiet audit co the mo khi can

Conditional section rules:
- khi khong co workflow change dang duoc test, `#improvement-impact` phai ghi `Chua co thay doi de so sanh`
- khi khong co baseline cho mot claim cai thien, `#improvement-impact` phai gan nhan claim do la `Chua chung minh (Inconclusive)`
- khi khong co session traces, hien gioi han nay trong `#scope-limitations`; khong them mot top-level trace section rong

Recommended sections:
- `## Constraints`
- `## Follow-up Required`

Recommended structure:
- `#decision-summary`
  - mo dau bang mot cau verdict ro rang va mot quyet dinh human can dua ra
  - giu phan giai thich duoi 120 tu
- `#workflow-health`
  - dung metric cards gon va visual bars cho count hoac measured rate
  - hien `Chua do` khi khong co con so nao co the bao ve duoc
- `#key-findings`
  - toi da nam finding; moi card gom van de, evidence, impact, va recommended action
  - chuyen finding uu tien thap hon xuong appendix
- `#improvement-impact`
  - visualize hanh vi baseline va changed behavior, dong thoi hien regression, neighbor, va control results
  - bo qua cac chart chi de trang tri ma khong giup so sanh hanh vi
- `#action-plan`
  - sap xep action theo decision impact, khong theo thu tu tai lieu
  - neu ro smallest change, success threshold, va re-test
- `#scope-limitations`
  - lam ro unsupported claims va evidence gaps truoc khi vao appendix
- `#evidence-appendix`
  - giu input contract, expected behavior, incidents, normalized model, full findings, scenarios, trace references, va evidence excerpts trong `<details>` blocks

Huong dan cho HTML de nguoi doc:
- bat dau bang header gon gom workflow name, evaluated version, report date, evaluation goal, va verdict badge
- uu tien mot visual hierarchy manh thay vi nhieu card co trong so ngang nhau
- dung mot so summary cards nho cho decision status, blocking findings, evidence coverage, va scenario outcome
- dung severity badge va finding ID on dinh de human co the scan va thao luan nhanh
- dung CSS hoac inline SVG charts van de hieu khi khong co mau va in ra dung
- moi chart phai gan nhan source count, denominator, hoac `Chua do`
- dat evidence, impact, va action gan nhau trong tung finding card hien thi
- dung `<details>` cho methodology, normalized models, raw evidence, va trace excerpts
- tranh mot muc luc dai neu report co duoi tam section hien thi
- them footer voi generation timestamp va source artifact paths

## Cach su dung co human kiem soat
Workflow nay cung la human-controlled.

Human se quyet dinh khi nao chay workflow evaluation, vi du:
- truoc khi them mot standard command moi
- truoc khi promote mot pattern dang experimental
- khi so sanh hai thiet ke workflow thay the
- khi workflow co ve hoat dong duoc nhung thieu bang chung co the review
- khi co pain lap lai trong qua trinh su dung nhung chua ro step nao cua workflow dang fail
- sau mot thay doi workflow tuyen bo la fix duoc mot finding da biet

Quy tac hanh vi cho agent:
- khong am tham bien cong viec thiet ke workflow thanh cong viec workflow evaluation
- khong am tham bien workflow evaluation thanh workflow adoption
- khong chinh workflow dang test trong luc dang thu thap baseline
- neu bang chung qua mong, hay de xuat them `Observe` hoac `Baseline Exercise` thay vi noi qua muc do confidence
- khong claim co cai thien neu khong co bang chung before/after co the so sanh

## Huong dan dien giai quyet dinh
Su dung cac cach hieu sau:
- `Adopt`: bang chung du manh cho pham vi muc tieu va viec su dung thuong xuyen
- `Adopt with constraints`: huu ich, nhung chi trong cac gioi han duoc neu ro
- `Keep experimental`: co tiem nang, nhung chua duoc chung minh de promote thanh standard
- `Reject`: complexity, ambiguity, hoac bang chung yeu lon hon gia tri

## Quan he voi cac tai lieu khac
- `docs/ai/project/AI_WORKFLOW_RULES.md` dinh nghia cac quy tac bat buoc ma evaluation can enforce
- `docs/ai/project/WORKFLOW_CODING_STANDARD.md` dinh nghia mot workflow type co the tu no tro thanh doi tuong duoc danh gia boi tai lieu nay
- cac workflow document, command set, skill, prompt wrapper, runtime binding, hoac operating model khac cung co the duoc danh gia boi tai lieu nay khi dap ung input contract
- `docs/ai/workflow-evals/` luu cac bao cao danh gia HTML tieng Viet, self-contained, duoc tao boi workflow nay

## Tieu chuan san sang de implement
Tai lieu nay duoc coi la implementation-ready khi duoc dung nhu evaluation operating spec chi khi:
- evaluation input contract duoc dien ro rang
- moi phase ghi ra output section bat buoc cua no
- expected behavior co the quan sat va co pass/fail rule
- pain trong su dung thuc te duoc bieu dien thanh incidents co first divergence va evidence khi co san
- audit findings dung dung severity, evidence status, failure layer, va root-cause hypothesis da khai bao
- baseline scenarios cover duoc pham vi workflow tuyen bo hoac danh dau ro cho trong
- session traces duoc dua vao khi co san, hoac duoc danh dau unavailable mot cach ro rang
- moi de xuat cai tien duoc gan voi mot finding va mot bo re-test
- claim cai tien so sanh cac workflow version da xac dinh tren regression, neighbor, va control scenarios
- baseline thieu hoac khong the so sanh duoc phai gan nhan `Inconclusive`
- verdict theo dung heuristic da ghi, khong theo so thich ca nhan
- artifact cuoi cung la mot bao cao HTML5 tieng Viet hop le, self-contained, tai `docs/ai/workflow-evals/{name}.html`

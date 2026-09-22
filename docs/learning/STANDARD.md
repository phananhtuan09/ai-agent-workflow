---
phase: project
title: Learning Workflow Standard
description: Hợp đồng MVP cho boundary, assistance, artifact, assessment và progression của learning workflow
---

# Tiêu Chuẩn Learning Workflow

## Mục Đích

Tài liệu này định nghĩa hợp đồng thực thi tối thiểu cho learning workflow MVP dưới `CONSTITUTION.md`.

Workflow MVP dùng một active mini-project, một active competency và một case đã được checksum-bind tại một thời điểm.

Luồng human-facing duy nhất là:

```text
Choose -> Build -> Twist -> Ship -> Reflect
```

## Learning Direction

Profile phải lưu goal đã được human chấp thuận, baseline, current gaps, competency history và đúng một next action gần nhất.

Learning program phải có một durable project context và một schedule đã được human chấp thuận trước session đầu tiên.

Project cung cấp domain, product goal, actor, architecture baseline, business rule, constraint và evolution history; project không đồng nghĩa với việc learner phải implement toàn bộ domain.

Schedule cung cấp season ngắn, cadence, competency focus và danh sách mini-project phù hợp ở độ mịn theo cycle.

Cadence mặc định là chọn mini-project theo goal, current gaps, independence, hứng thú, activity preference và time budget gần nhất.

Case hoặc competency được đề xuất bởi AI nhưng chỉ có hiệu lực sau khi human chấp thuận boundary của session.

Case continuity phải tham chiếu project và tuần schedule đang áp dụng.

Transfer case được phép nằm ngoài project nhưng phải nói rõ principle nào đang được kiểm tra.

Schedule là planning intent và không được dùng như bằng chứng competency.

Cứ mỗi recalibration checkpoint hoặc khi learning evidence cho thấy prerequisite hay difficulty không còn phù hợp, AI phải đề xuất cập nhật các cycle chưa completed và chờ human chấp thuận.

## Mini-Project Contract

Mini-project là đơn vị học mặc định và phải có:

- thời lượng hai hoặc ba ngày;
- daily time budget rõ ràng;
- một problem và một user cụ thể;
- functional requirements và acceptance criteria;
- constraints và non-goals;
- một deliverable có thể chạy hoặc demo;
- definition of done;
- một active competency và thường chỉ một protected judgment;
- tối đa một change request, incident hoặc evidence twist đã được khai báo trước.

Human-facing brief phải bắt đầu bằng product spec hoặc yêu cầu chức năng. Invariant, failure mode và trade-off là điều learner khám phá từ spec, clarification, implementation và consequence; không được dùng chúng như đề bài duy nhất một cách máy móc.

Mỗi mini-project chọn một mode:

- `practice`: ưu tiên momentum; AI được hint sớm hơn và kết quả không được ghi là independent competency evidence;
- `challenge`: learner giữ first attempt và key decisions để tạo learning evidence.

Mini-project hoàn tất khi deliverable đạt definition of done trong scope đã chốt, không phải khi learner hoàn thành toàn bộ project context. Hết time budget hoặc một ngày vẫn có thể kết thúc cycle; phần chưa làm không trở thành backlog debt.


## Boundary

Boundary phải nêu active competency, toàn bộ protected judgment của case và phạm vi work được AI phép thực hiện.

Không được disclose discoverable fact, ghi first attempt, chạy evidence work hoặc release future event trước khi boundary được chấp thuận.

Boundary đã chấp thuận không được đổi trong session MVP.

Nếu cần đổi active competency hoặc protected judgment, session hiện tại phải được đóng `inconclusive` và tạo session mới.

## Discovery Record

Mỗi discoverable fact được tiết lộ phải có record chứa exact human question, fact IDs, discovery path đã match và timestamp.

Public fact không cần discovery record nhưng phải được đánh dấu đã available từ lúc session khởi tạo.

Không được ghi fact là human-discovered nếu câu hỏi không match một discovery path đã khai báo trong case.

## First Attempt Và Revision

First attempt phải có kết luận hoặc hướng tiếp cận, reasoning summary và ít nhất một assumption, constraint, invariant, risk, prediction hoặc trade-off.

First attempt phải được ghi trước mọi material assistance ảnh hưởng tới cùng protected judgment.

Revision phải ghi điều gì thay đổi, vì sao thay đổi và evidence hoặc feedback nào dẫn tới thay đổi.

Agent phải tóm tắt trung thành và không được làm mạnh hơn reasoning human đã thể hiện.

## Assistance

Assistance dùng sáu level:

1. Neutral question.
2. Request for missing reasoning.
3. Counterexample.
4. Scoped hint.
5. Option hoặc important undiscovered constraint.
6. Partial hoặc full solution sau khi assessment đã closed hoặc frozen.

Level 4 đến 6 luôn là material assistance.

Level 1 đến 3 trở thành material assistance khi một intervention hoặc chuỗi intervention làm thu hẹp đáng kể protected judgment.

Mỗi assistance record phải ghi level, content, impact, thời điểm, protected judgment bị ảnh hưởng và liệu nó xảy ra trước first attempt hay không.

Khi material assistance xảy ra, protected judgment chỉ được kết thúc ở trạng thái `assisted` hoặc `assessment-frozen`.

## Escalation Và Assessment Closure

Human được xem là chưa tạo tiến triển hữu ích khi sau hai intervention liên tiếp ở cùng hoặc thấp hơn level hiện tại vẫn không bổ sung reasoning, sửa assumption, tạo option, diễn giải evidence hoặc bảo vệ decision bằng thông tin mới.

Agent chỉ được tăng tối đa một assistance level sau mỗi lần xác nhận tín hiệu trên.

Protected judgment được `assessment-closed` khi đã có independent first attempt và human đã có cơ hội revise hoặc defend sau feedback hay evidence phù hợp.

Protected judgment được `assessment-frozen` khi human yêu cầu solution, human dừng independent assessment, hoặc session không thể tiếp tục nếu không có material assistance.

Protected judgment được `assisted` khi material assistance đã được dùng và assisted work cần được đánh giá.

Không được cung cấp level 6 trước khi judgment ở trạng thái `assessment-closed` hoặc `assessment-frozen`.

## Evidence Record

Evidence work must begin from an evidence request that the human has approved.

The evidence request must record the decision or assumption being tested, the exact question, method, scope, and whether interpretation remains protected.

System evidence must record method, environment, assumptions, observable result, raw references, limitations, confidence, and claim boundaries.

If interpretation is protected, the human interpretation must be recorded separately before evidence is used to confirm competency.

When evidence creates or changes a production software deliverable, the repository-driven coding workflow owns implementation, safety validation, and human sign-off. Learning approval does not replace product intent or production authority.

When evidence creates a disposable spike, benchmark, or simulation, it must run in an isolated worktree or temporary directory unless the coding workflow explicitly authorizes a target-tree change. If the required authority or isolation is unavailable, the evidence request must stop at `blocked` instead of implementing outside the workflow.

Raw commands and logs are retained only when a later assessment, audit, or reproducible claim has a reader. Disposable fixtures, binaries, isolated worktrees, and logs without a downstream reader must be removed after proof.

## Assessment

Completed session phải có assessment cho mọi rubric dimension của case.

Mỗi dimension phải trích record ID cụ thể từ attempt, revision, assistance, evidence, interpretation hoặc event release.

Rating dùng đúng một trong `demonstrated`, `partial`, `not-demonstrated` hoặc `inconclusive`.

Independence dùng đúng một trong `independent`, `assisted` hoặc `not-observed`.

Outcome dùng đúng một trong `independent-success`, `assisted-success`, `needs-revisit` hoặc `inconclusive`.

Mọi completed session phải có đúng một next action và không quá ba current gaps.

Assessment chỉ được áp vào session và profile sau khi human có cơ hội dispute.

Dispute chưa giải quyết bắt buộc outcome là `inconclusive` và không được chọn progression action.

## Progression

Next action dùng đúng một trong `revisit-prerequisite`, `retry-similar`, `transfer-context`, `increase-difficulty` hoặc `change-competency`.

Profile phải lưu một progress history entry cho mỗi completed session và cập nhật competency record tương ứng.

Completed mini-project phải được ghi vào đúng schedule cycle cùng các learning evidence reference đã dùng trong assessment.

Schedule cycle chỉ được advance khi mini-project đã có delivery record, outcome là `independent-success` hoặc `assisted-success`, và next action không yêu cầu prerequisite hay retry cùng competency.

Nếu chưa đủ điều kiện advance, schedule giữ nguyên cycle và ghi adjustment reason; learner không bị tạo backlog debt vì bỏ lỡ cadence.

Session tiếp theo phải được chọn từ goal, current gaps, competency history, next action gần nhất, time budget và activity preference.

`transfer-context` phải dùng domain hoặc constraint context khác và không được copy solution mechanism của case trước.

Project evolution chỉ được ghi sau khi human chấp thuận decision hoặc project-state change tương ứng.

## Durable Artifacts

Case đang dùng phải nằm dưới `docs/learning/cases/` trước khi session được khởi tạo.

Không bind active session trực tiếp vào asset trong thư mục skill vì skill có thể bị reinstall hoặc update.

Profile nằm tại `docs/learning/profile.json`.

Project nằm tại `docs/learning/project.json`.

Schedule nằm tại `docs/learning/schedule.json`.

Session nằm tại `docs/learning/sessions/{session_id}.json`.

Session JSON là durable learning record duy nhất và không được nhân bản thành transcript narrative.

Mọi state transition phải được validate trước khi commit đồng thời session, profile và schedule liên quan.

Project và schedule update phải được validate trước khi commit đồng thời hai artifact.

## MVP Verification

MVP phải có controlled lifecycle test bao phủ project/schedule approval, initialization, boundary acceptance, discovery, first attempt, assistance, evidence, interpretation, revision, assessment, dispute handling, completion, schedule progression, project evolution, profile update và next-session selection input.

MVP vẫn mang trạng thái experimental cho tới khi có representative session traces và workflow evidence thực tế.

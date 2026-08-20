---
phase: project
title: Learning Workflow Standard
description: Hợp đồng MVP cho boundary, assistance, artifact, assessment và progression của learning workflow
---

# Tiêu Chuẩn Learning Workflow

## Mục Đích

Tài liệu này định nghĩa hợp đồng thực thi tối thiểu cho learning workflow MVP dưới `WORKFLOW_LEARNING_CONSTITUTION.md`.

Workflow MVP dùng một active session, một active competency và một case đã được checksum-bind tại một thời điểm.

Luồng human-facing duy nhất là:

```text
Explore -> Decide -> Reflect
```

## Learning Direction

Profile phải lưu goal đã được human chấp thuận, baseline, current gaps, competency history và đúng một next action gần nhất.

Cadence mặc định là chọn lại challenge sau mỗi completed session dựa trên goal, current gaps, independence và next action gần nhất.

Case hoặc competency được đề xuất bởi AI nhưng chỉ có hiệu lực sau khi human chấp thuận boundary của session.

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

Evidence work phải bắt đầu từ một evidence request đã được human chấp thuận.

Evidence request phải ghi decision hoặc assumption đang được kiểm tra, exact question, method, scope và liệu interpretation còn là protected judgment hay không.

System evidence phải ghi method, environment, assumptions, observable result, raw references, limitations, confidence và ranh giới claim.

Nếu interpretation là protected, human interpretation phải được ghi riêng trước khi evidence được dùng để xác nhận competency.

Evidence tạo software deliverable chỉ được thực hiện khi coding workflow tương ứng có sẵn và authority đã rõ.

Nếu dependency đó không có, evidence request phải dừng ở trạng thái `blocked` thay vì tự implement ngoài workflow.

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

Session tiếp theo phải được chọn từ goal, current gaps, competency history và next action gần nhất.

`transfer-context` phải dùng domain hoặc constraint context khác và không được copy solution mechanism của case trước.

## Durable Artifacts

Case đang dùng phải nằm dưới `docs/ai/learning/cases/` trước khi session được khởi tạo.

Không bind active session trực tiếp vào asset trong thư mục skill vì skill có thể bị reinstall hoặc update.

Profile nằm tại `docs/ai/learning/profile.json`.

Session nằm tại `docs/ai/learning/sessions/{session_id}.json`.

Session JSON là durable learning record duy nhất và không được nhân bản thành transcript narrative.

Mọi state transition phải được validate trước khi commit đồng thời session và profile liên quan.

## MVP Verification

MVP phải có controlled lifecycle test bao phủ initialization, boundary acceptance, discovery, first attempt, assistance, evidence, interpretation, revision, assessment, dispute handling, completion, profile update và next-session selection input.

MVP vẫn mang trạng thái experimental cho tới khi có representative session traces và workflow evidence thực tế.

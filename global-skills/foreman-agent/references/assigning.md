# Giao việc

File tham chiếu của `foreman-agent`.
Đọc file này trước khi gửi bất cứ prompt nào cho worker agent.
Luật phụ thuộc và luật ghi friction nằm trong `SKILL.md`, không lặp lại ở đây.

## Trình tự

1. Chọn item, rà dependency và overlap với `[~]` theo `SKILL.md`.
2. Tách nội dung khỏi địa chỉ, append nội dung mới vào backlog rồi lưu.
3. Dùng agent list đã lấy trong supervision cycle; chỉ list nếu lượt hiện tại chưa có snapshot runtime.
4. Chọn agent:
   - Human chỉ định thì dùng agent đó nếu hợp lệ;
   - không chỉ định thì lấy agent cùng repo, `idle` hoặc `done`, chưa giữ task;
   - nhiều agent general-purpose tương đương thì chọn tên tăng dần;
   - capability tạo khác biệt mà không có nguồn xác định thì hỏi Human một câu;
   - không có agent thì để `[ ]` và báo, không tự mở trong V2 core.
5. Agent chưa có tên thì đặt tên trước khi lưu assignment.
6. Dựng prompt từ backlog theo mẫu dưới và chạy `## Kiểm trước khi gửi`.
7. Gửi thẳng qua Herdr; không đi qua file trung gian.
8. Xác nhận agent nhận prompt rồi mới đổi `[~]`, ghi `@agent · YYYY-MM-DD HH:MM`, và tạo snapshot ban đầu; handoff thì đổi `AGENT/UPDATED` nhưng giữ last known progress đến response mới.
9. In nguyên prompt đã gửi.

Agent `working` chỉ nhận task mới khi Human yêu cầu override.
Agent `blocked` chỉ nhận câu hỏi, context hoặc decision cho task nó đang giữ.

Không hỏi xác nhận trước khi gửi khi policy đã chọn được agent.
Câu hỏi ở bước kiểm hoặc capability ambiguity giải quyết thiếu authority; nó không phải câu hỏi xác nhận.

## Nguồn của khối YÊU CẦU

Câu người dùng gõ cho bạn luôn có hai phần, và chỉ một phần được đi tiếp:

| Phần | Người nhận thật | Xử lý |
| --- | --- | --- |
| **nội dung** — công việc worker phải làm | worker | xuống đĩa, rồi vào khối `YÊU CẦU` nguyên văn |
| **địa chỉ** — nói cho bạn biết gửi đi đâu, khi nào, theo thứ tự nào | bạn | không gửi |

Ranh giới giữa hai phần được xác định theo đúng một trong hai dạng dưới đây.
Không có dạng thứ ba, và bạn không được tự chế ra dạng nào khác.

### Dạng tường minh — người dùng bọc nội dung trong ngoặc kép

```text
giao việc này cho worker: "thêm rate limit cho /orders, dùng redis, 100 req/phút theo user"
```

Trong ngoặc là nội dung, gửi **nguyên văn**, không thêm không bớt.
Ngoài ngoặc là địa chỉ, **không gửi**, kể cả khi nó là một câu có nghĩa hoàn chỉnh.

Ranh giới nằm ở cặp ngoặc, không nằm ở phán đoán của bạn.
Người dùng đã tự tay vạch ranh giới rồi, nên ở dạng này bạn không còn gì để quyết.

Cặp ngoặc rỗng, hoặc mở mà không đóng, thì hỏi người dùng một câu, ghi `ambiguous`, và chưa gửi gì cả.
Đừng tự đoán ranh giới thay cho cặp ngoặc bị hỏng.

### Dạng mặc định — không có ngoặc kép

Khối `YÊU CẦU` dựng **hoàn toàn từ dòng backlog của item**: mô tả của nó, cộng mọi dòng con `↳` của nó.
Câu vừa gõ không đóng góp chữ nào vào prompt.

Câu đó có kèm nội dung công việc chưa nằm trên backlog thì append nguyên văn phần nội dung ấy vào item thành dòng con `↳ bạn nói <ngày>: …`, lưu file, rồi mới dựng prompt từ dòng backlog vừa cập nhật.

Phân vân một mệnh đề thuộc phần nào thì coi nó là **nội dung** và append vào `↳`.
Hai lỗi không cân nhau: append thừa một mệnh đề địa chỉ thì nó nằm trên dòng `↳`, người dùng nhìn thấy và xoá được; bỏ nhầm một câu công việc thì yêu cầu biến mất mà không ai biết.

### Mention không phải là tín hiệu

Nhắc tới `worker`, tên agent, hay id item **không** biến câu đó thành nội dung.
Đó là địa chỉ: nó nói cho bạn biết gửi *đi đâu*, không nói cho worker biết *phải làm gì*.

Gửi nguyên văn `giao T-01 cho worker codex` thì worker nhận đúng một câu vô nghĩa với nó: nó không có backlog, không biết `T-01` là gì, và không có thẩm quyền nào với việc giao việc.
Chỉ cặp ngoặc kép mới mở được cửa gửi nguyên văn cả câu.

### Hai dạng đều ghi trước, gửi sau

Nội dung phải nằm trên `backlog.md` **trước khi** đi sang worker, ở cả hai dạng.

Gửi thẳng từ câu vừa gõ thì nội dung ấy chỉ tồn tại trong hội thoại của bạn, và mất sạch ở lần clear session kế tiếp.
Ghi xuống đĩa trước cũng làm luật nguyên văn kiểm chứng được: prompt phải khớp dòng backlog, chứ không phải khớp một thứ chỉ mình bạn còn nhớ.

Người dùng nhờ giao một việc chưa có trên backlog thì tạo dòng `[ ]` cho nó trước theo luật ghi task ở `SKILL.md`, rồi mới giao.
Không giao một việc chưa có id.

Vẫn là **lọc chứ không sửa**:

- Được bỏ nguyên một mệnh đề thuộc phần địa chỉ.
- Không được đổi một chữ nào bên trong phần nội dung, kể cả sửa chính tả hay tách câu cho gọn.
- Không được gộp hai câu làm một, không được đổi thứ tự các câu.

## Kiểm trước khi gửi

Đọc lại prompt vừa dựng và trả lời đúng ba câu.
Ba câu này hỏi về **prompt**, không hỏi về codebase; không mở file nguồn nào để trả lời chúng.

| Câu hỏi | Dấu hiệu | Có thì làm gì |
| --- | --- | --- |
| Có chỗ nào chỉ hiểu được khi ngồi trong hội thoại của bạn với người dùng không? | "cái đó", "như hôm qua", "làm tiếp phần trên", "task trước" | hỏi người dùng một câu, ghi `ambiguous`, chưa gửi |
| Khối `YÊU CẦU` có chữ nào không có trên dòng backlog của item không? | "giao cho codex", "ưu tiên hơn T-11", hoặc bất cứ câu nào bạn chép từ hội thoại | dựng lại khối từ dòng backlog rồi gửi, không cần hỏi |
| Các dòng `↳` có chọi nhau không? | `↳` cũ nói dùng redis, `↳` mới nói dùng in-memory | hỏi người dùng một câu, ghi `ambiguous`, chưa gửi |

Dòng `↳` mới hơn **không** tự động thắng dòng cũ.
Tự chọn cái mới là bạn đang quyết thay người dùng, và worker sẽ không bao giờ biết là vừa có một lựa chọn bị bỏ đi.

Ba câu này là phần **chặn gửi**.
Những thứ soát ra mà không chặn — sai chính tả, trùng item — thuộc `## Soát lời người dùng` ở `SKILL.md`: nêu một dòng rồi vẫn gửi bình thường.

Ba câu này thay cho việc bạn tự đọc hiểu task.
Bạn không có context repo còn worker thì có, nên hiểu task là việc của worker, và mẫu prompt đã mở sẵn cửa cho nó dừng lại báo `blocked` khi yêu cầu không đủ rõ.

## Mẫu prompt

Chép mô tả và mọi dòng `↳` chứa lời Human hoặc decision **nguyên văn**.
Không đưa progress, friction hoặc lời Foreman suy diễn vào `YÊU CẦU`.
Khối `Foreman ghi chú` chỉ chứa con trỏ đã có nguồn trên đĩa.
Thay mọi id, agent name và report path trong mẫu bằng assignment thật.

```text
TASK: T-14 · report file: .foreman/inbox/T-14--codex-1.md

YÊU CẦU (nguyên văn của Human, không diễn giải lại)
> Thêm rate limit cho /orders
> dùng redis, 100 req/phút theo user

Foreman ghi chú (chỉ là con trỏ, không phải yêu cầu)
- middleware hiện có: lib/http/limit.js

TRÁCH NHIỆM
Giữ deep implementation context của task này.
Investigate, implement và chạy proof phù hợp với thay đổi.
Tự giải quyết technical issue nằm trong task scope và không đổi intended behavior.
Nếu có nhiều behavior hợp lệ hoặc thiếu product/business/architecture/security/compatibility authority, báo blocker cho Foreman; không hỏi Human trực tiếp.
Khi Foreman hỏi, trả progress hoặc evidence có cấu trúc và ngắn gọn.

KHÔNG LÀM
Không đọc hay sửa `.foreman/`, ngoài việc ghi đè đúng file `.foreman/inbox/T-14--codex-1.md`.
Không mở rộng ngoài yêu cầu; sửa thứ hỏng do chính thay đổi của bạn vẫn nằm trong scope.
Không tự đổi lifecycle hoặc tự duyệt task.
Không tự ý commit hay push, trừ khi YÊU CẦU nói làm. Khi được phép, chỉ stage đúng file bạn sửa; không dùng `git add -A` hoặc `git add .`.
Không đẩy task sang agent Herdr khác; sub-agent nội bộ trong phiên được phép.
Yêu cầu mơ hồ thì investigate phần có thể xác định, sau đó báo blocker thay vì tự chọn semantics.

BÁO CÁO DURABLE
Khi complete hoặc blocked, ghi đè toàn bộ `.foreman/inbox/T-14--codex-1.md` bằng đúng một package.

Complete:
TASK: T-14
AGENT: @codex-1
TYPE: done
CHANGES: <đã thay đổi gì>
OBSERVABLE RESULT: <behavior đạt được>
VERIFICATION: <lệnh/scenario và kết quả; ghi rõ chưa chạy>
AFFECTED FILES: <paths>
PUBLIC CONTRACT IMPACT: <none or exact API/schema/behavior impact>
KNOWN RISKS: <rủi ro còn lại hoặc none>
COMPLETION STATE: complete

Blocked:
TASK: T-14
AGENT: @codex-1
TYPE: blocked
BLOCKER: <không thể tiếp tục vì gì>
INVESTIGATION: <đã kiểm tra gì>
CAN RESOLVE WITHIN SCOPE: yes | no
WHY HUMAN DECISION IS REQUIRED: <lý do hoặc none>
OPTIONS: <các option nếu có>
IMPACT: <impact từng option nếu có>
EVIDENCE: <code/behavior liên quan>
RECOMMENDATION: <nếu có>
COMPLETION STATE: blocked

Không append vào file dùng chung. Không ghi report thiếu TASK, AGENT hoặc TYPE.
```

Prompt tự chứa; worker không cần đọc backlog hoặc progress.
`YÊU CẦU` thắng nếu chọi với mặc định trong `KHÔNG LÀM`.
Dòng `TASK: <id> ` mở đầu là bắt buộc để ghim transcript.

## Operational requests
Các request dưới đây không đổi requirement. Status, triage, clarification, question, decision và handoff không tăng `↻N` hay ghi `followup`; rejection áp đúng luật `rejected` trong `SKILL.md`.

### Progress

```text
TASK: T-14 · progress request
Reply with exactly:
LAST: <last completed action>
CURRENT: <current action>
NEXT: <next action>
BLOCKER: <none or specific blocker>
PROOF: <performed proof and result; distinguish not run>
COMPLETION STATE: working | blocked | complete
AFFECTED FILES: <known paths or ->
```

### Triage technical blocker

```text
TASK: T-14 · blocker triage
Determine whether the blocker was introduced by this task, already existed, or requires missing authority.
Investigate first. Resolve and continue autonomously if it stays within scope and does not change intended behavior.
Otherwise return a Decision Package: GOAL, FINDING, WHY HUMAN DECISION IS REQUIRED, OPTIONS, IMPACT, EVIDENCE, RECOMMENDATION.
```

### Completion clarification

```text
TASK: T-14 · completion clarification
Provide CHANGES, OBSERVABLE RESULT, VERIFICATION, AFFECTED FILES, PUBLIC CONTRACT IMPACT, KNOWN RISKS, and COMPLETION STATE.
```

### Human question

```text
TASK: T-14 · Human question
<nguyên văn câu hỏi>
Answer from current code/task context with concise evidence. Do not change scope.
```

### Human decision

```text
TASK: T-14 · Human decision
<nguyên văn decision>
Continue within that decision and the original requirement.
```

### Handoff

```text
TASK: T-14 · handoff

ORIGINAL REQUIREMENT
<nguyên văn từ backlog>

HUMAN DECISIONS
<nguyên văn hoặc none>

LAST KNOWN PROGRESS
<snapshot>

Inspect current repository state before continuing.
Do not assume the previous implementation is correct.
Verify existing changes, then continue toward the original goal.
Report overlap or unsafe partial state before editing further.
```

### Rejection

```text
TASK: T-14 · rejection
Human rejected the submitted result:
<nguyên văn lý do>
Address this reason, re-verify the task, and return a new Completion Package.
```

## Requirement follow-up

Chỉ Human bổ sung hoặc đổi nội dung công việc mới là requirement follow-up.
Tách nội dung khỏi địa chỉ, append nguyên văn thành `↳ bạn nói <ngày>: …`, lưu backlog, rồi gửi đúng nội dung đó.

```text
TASK: T-12 · requirement follow-up
Có migrate data cũ. Viết migration script kèm rollback.
```

Requirement follow-up tăng `↻N` và ghi `followup`.
Decision relay, status request, blocker triage, completion clarification, Human question và handoff không tăng `↻N`.

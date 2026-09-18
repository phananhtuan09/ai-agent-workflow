# Báo cáo

Playbook của `foreman-agent`.
Nạp khi Human hỏi về một item cụ thể, xin status đầy đủ, hoặc ngay sau khi bạn xong một thao tác.

Báo cáo mặc định bốn nhóm nằm ở `SKILL.md` và luôn có sẵn; file này sở hữu mọi khối **chi tiết hơn** nó.
Luật `## Độ dài và mức chi tiết` trong `SKILL.md` áp cho tất cả khối dưới đây.

## Status đầy đủ

Human xin status tất cả thì in một khối ngắn mỗi item `[~]`:

```text
T-21 · @codex-1 · đang chạy
  LAST: agent tự báo đã reproduce duplicate callback
  CURRENT/NEXT: implement idempotency → regression tests
  BLOCKER: không
  PROOF: reproduction ✓; regression chưa chạy
```

Luôn kèm thời điểm snapshot; không trình progress cũ như response vừa lấy.
Item `[v]` trong cùng lượt đó in review package bên dưới, không in khối này.

## Một item đang chạy

Human hỏi về đúng một item thì dùng snapshot mới nhất; thiếu field họ cần thì query worker trước theo `worker-io.md`.

```text
STATUS: đang chạy — @codex-1, cập nhật 2026-09-17 14:20
LAST: agent tự báo đã reproduce duplicate callback
CURRENT: agent tự báo đang implement idempotency guard
NEXT: agent tự báo sẽ chạy regression tests
BLOCKER: không
PROOF: agent tự báo reproduction đã quan sát; regression chưa chạy
SUMMARY: task đang tiến triển bình thường, chưa cần Human.
```

- Mỗi field tối đa một câu.
- Không biết thì ghi `-`, không suy đoán.
- Claim từ worker phải có `agent tự báo`.
- `BLOCKER` ghi `không`, một decision cụ thể, hoặc `tự xử lý — …`.
- `PROOF` phân biệt đã chạy, chưa chạy và remaining risk.
- `SUMMARY` tối đa hai câu và nói Human có cần làm gì không.
- Chỉ in khối, không thêm chữ trước hoặc sau.

## Review package

Item `[v]` mặc định chỉ chiếm **một dòng** trong báo cáo.
In khối đầy đủ ở đúng hai lúc: Human hỏi về chính item đó, hoặc Human yêu cầu status đầy đủ.
Item vừa vào `[v]` không phải là một trong hai lúc đó.

```text
CHỜ DUYỆT: T-34 Monitor cron jobs — @koken-1 tự báo, complete 09-18 09:08
THAY ĐỔI: không sửa code; kiểm tra read-only 10 batch job trên 2 server
KẾT QUẢ: 10/10 job của 09-17 và 09-18 đều PASS
VERIFICATION: 5 lane đã chạy (log, DB, mail, FTP, remote check); chưa chạy test tự động
RỦI RO CÒN LẠI: 1 lỗi lịch sử ngoài phạm vi, đã tự phục hồi và không tái diễn
```

Khối này là bản rút gọn, không phải bản chép lại Completion Package.
`CHỜ DUYỆT` dựng từ backlog và header snapshot; các field còn lại rút từ package, mỗi field **một câu, một dòng**.

- Bỏ hẳn field không có gì đáng chú ý: `FILE ẢNH HƯỞNG` khi không sửa file nào, `PUBLIC CONTRACT: none`, `RỦI RO CÒN LẠI: không`.
- `agent tự báo` viết đúng **một lần** ở dòng `CHỜ DUYỆT`; các field dưới thừa hưởng, không lặp lại từng dòng.
- `VERIFICATION` đếm cái đã chạy, kể cái chưa chạy — không liệt kê từng lệnh và từng kết quả xanh.
- `RỦI RO CÒN LẠI` giữ đúng rủi ro còn mở. Nghi vấn đã điều tra và loại trừ thì bỏ; nó không đổi quyết định duyệt.
- Rủi ro chỉ lấy từ lời worker; không tự nghĩ thêm rủi ro worker không khai.
- Không thêm dòng mời duyệt, không thêm đánh giá hay khuyến nghị của Foreman.

Worker khai nhiều nhánh rủi ro thì gộp thành một câu và nói còn bao nhiêu nhánh, đừng bê nguyên danh sách.
Human muốn đủ chi tiết thì họ hỏi tiếp, và lúc đó bạn đọc `progress/<id>.md` ra.

## Xác nhận sau thao tác

Duyệt, từ chối, giao việc, relay decision và requeue đều báo đúng **một dòng**.

```text
Đã duyệt T-34. @koken-1 rảnh, backlog không còn item chờ giao.
```

Thêm câu thứ hai chỉ khi thao tác đó đổi việc Human phải làm: nó mở khoá item khác, bạn vừa tự giao việc tiếp, hoặc có item mới cần duyệt.
Không kể `done.md`, snapshot, đường dẫn trace, hay việc không có dependency nào để gỡ.
Sau dòng đó, in lại báo cáo mặc định **chỉ khi** còn nhóm nào không rỗng.

## Cấm

- Không rút review package của item `[v]` xuống một dòng khi Human hỏi về chính item đó.
- Không lặp `agent tự báo` ở từng dòng trong cùng một khối.
- Không liệt kê từng bước verification đã pass; đếm chúng và chỉ kể phần chưa chạy.
- Không in field rỗng hay field `none` chỉ để cho khối đủ dáng.
- Không thêm đánh giá chất lượng hay khuyến nghị duyệt của Foreman vào bất cứ khối nào.

# Giao việc

File tham chiếu của `foreman-agent`.
Đọc file này trước khi gửi bất cứ prompt nào cho worker agent.
Luật phụ thuộc và luật ghi friction nằm trong `SKILL.md`, không lặp lại ở đây.

## Trình tự

1. Chọn item, rà phụ thuộc và vùng chạm với các item `[~]` theo `SKILL.md`.
2. Lọc lời người dùng theo `## Lọc lời người dùng` dưới đây.
3. Liệt kê agent ngay trước khi gửi để lấy trạng thái mới nhất.
   Người dùng không chỉ định agent thì chỉ tự chọn khi có đúng một agent rảnh trong repo, còn lại hỏi.
   Không có agent phù hợp thì báo người dùng mở, không tự tạo.
   Agent được chọn chưa có tên thì đặt tên cho nó trước, để lần sau còn trỏ tới được.
4. Dựng prompt theo mẫu dưới.
5. Chạy `## Kiểm trước khi gửi`.
   Có câu phải hỏi thì dừng lại ở đây, giữ nguyên trạng thái item, và chưa gửi gì cả.
6. Gửi thẳng vào agent, không đi qua file trung gian và không bảo worker đọc prompt từ một đường dẫn.
7. Xác nhận đã gửi được rồi mới đổi item sang `[~]`, ghi `@agent · YYYY-MM-DD HH:MM`, và lưu file.
   Không xác nhận được thì để nguyên trạng thái cũ.
8. In lại nguyên prompt đã gửi cho người dùng xem.

Agent đang `working` thì chỉ gửi khi người dùng yêu cầu gửi ngay, vì nó đang bận việc khác.
Agent đang `blocked` thì chỉ gửi câu trả lời cho đúng chỗ nó đang chặn, không gửi task mới.

Không hỏi xác nhận trước khi gửi.
In prompt ra là đủ để người dùng chặn ngay bằng follow-up nếu thấy sai.
Câu hỏi ở bước 5 không phải hỏi xác nhận: nó hỏi vì prompt chưa gửi đi được, không phải để xin phép gửi.

## Lọc lời người dùng

Một câu người dùng nói với bạn thường gồm hai phần, và chỉ một phần là để gửi đi:

| Phần | Người nhận thật | Xử lý |
| --- | --- | --- |
| nội dung công việc | worker | chép nguyên văn vào khối `YÊU CẦU` |
| vỏ điều phối | bạn | không gửi |

Vỏ điều phối gồm: chỉ định id hoặc agent ("giao T-14 cho codex"), thứ tự và ưu tiên ("cái này làm trước T-11"), câu hỏi trạng thái, nhận xét về item khác, và lời nói với riêng bạn.
Worker không có backlog, không biết `T-11` là gì, và không có thẩm quyền nào với những thứ đó, nên đọc vào chỉ thấy nhiễu.

Đây là **lọc, không phải sửa**:

- Được bỏ nguyên một mệnh đề thuộc vỏ điều phối.
- Không được đổi một chữ nào bên trong mệnh đề đã giữ, kể cả sửa chính tả hay tách câu cho gọn.
- Không được gộp hai câu làm một, không được đổi thứ tự các câu.
- Phân vân một mệnh đề thuộc phần nào thì **giữ lại**.

Bỏ nhầm một câu công việc thì worker thiếu yêu cầu mà không ai biết; giữ thừa một câu điều phối thì worker chỉ thấy hơi thừa.
Hai lỗi này không cân nhau, nên luôn nghiêng về giữ.

## Kiểm trước khi gửi

Đọc lại prompt vừa dựng và trả lời đúng ba câu.
Ba câu này hỏi về **prompt**, không hỏi về codebase; không mở file nguồn nào để trả lời chúng.

| Câu hỏi | Dấu hiệu | Có thì làm gì |
| --- | --- | --- |
| Có chỗ nào chỉ hiểu được khi ngồi trong hội thoại của bạn với người dùng không? | "cái đó", "như hôm qua", "làm tiếp phần trên", "task trước" | hỏi người dùng một câu, ghi `ambiguous`, chưa gửi |
| Còn sót vỏ điều phối không? | "giao cho codex", "ưu tiên hơn T-11" | bỏ mệnh đề đó rồi gửi, không cần hỏi |
| Các dòng `↳` có chọi nhau không? | `↳` cũ nói dùng redis, `↳` mới nói dùng in-memory | hỏi người dùng một câu, ghi `ambiguous`, chưa gửi |

Dòng `↳` mới hơn **không** tự động thắng dòng cũ.
Tự chọn cái mới là bạn đang quyết thay người dùng, và worker sẽ không bao giờ biết là vừa có một lựa chọn bị bỏ đi.

Ba câu này thay cho việc bạn tự đọc hiểu task.
Bạn không có context repo còn worker thì có, nên hiểu task là việc của worker, và mẫu prompt đã mở sẵn cửa cho nó dừng lại báo `blocked` khi yêu cầu không đủ rõ.

## Mẫu prompt

Chép mô tả và mọi dòng con của người dùng **nguyên văn**, không sửa một chữ.
Phần bạn thêm chỉ được là con trỏ, và phải nằm trong khối dán nhãn riêng.
Bỏ khối nào không có nội dung.

Khối `Foreman ghi chú` chỉ được chứa con trỏ lấy từ lời người dùng hoặc từ một item liên quan đã đóng trong `done.md`.
Không đi tìm con trỏ bằng cách grep code hay mở file nguồn.
Không có con trỏ nào đủ nguồn thì bỏ hẳn khối; đó là trường hợp thường gặp chứ không phải thiếu sót.

```text
TASK: T-14 · báo cáo cho: Foreman qua .foreman/inbox.md

YÊU CẦU (nguyên văn của người dùng, không diễn giải lại)
> Thêm rate limit cho /orders
> dùng redis, 100 req/phút theo user

Foreman ghi chú (chỉ là con trỏ, không phải yêu cầu)
- middleware hiện có: lib/http/limit.js
- endpoint: lib/http/orders.js

KHÔNG LÀM
Không đọc hay sửa bất cứ file nào trong .foreman/, ngoài append inbox.md.
Không mở rộng ngoài yêu cầu trên — thấy việc khác thì báo, đừng tự làm.
Không tự đánh dấu hoàn thành, không commit, không push.
Không giao việc cho agent khác.
Yêu cầu mơ hồ thì dừng và báo blocked, đừng tự suy diễn.

BÁO CÁO
Xong hoặc bị chặn thì append đúng một dòng vào .foreman/inbox.md:
T-14 | done | <tóm tắt 1 câu>
T-14 | blocked | <cần gì để đi tiếp>

Nếu được hỏi trạng thái: đúng 5 dòng STATUS/LAST ACTION/NEXT ACTION/NEEDS HUMAN/SUMMARY, mỗi dòng 1 câu.
```

Prompt tự chứa, nên worker không cần và không được đọc `.foreman/`.

Dòng `TASK: <id> ` mở đầu là bắt buộc và phải giữ nguyên dạng, vì nó là thứ duy nhất cho phép tìm lại transcript của worker về sau.

## Follow-up

Gửi vào đúng agent đang giữ item, giữ nguyên văn lời người dùng.
Lọc vỏ điều phối như lúc giao việc: id đã nằm ở dòng `TASK:` rồi, nên "T-12 thì" ở đầu câu người dùng không cần gửi lại.

```text
TASK: T-12 · trả lời
Có migrate data cũ. Viết migration script kèm rollback.
```

Mỗi lần gửi follow-up: tăng `↻N` trên dòng item, và ghi một dòng `followup` vào `log.md` với chính nội dung vừa gửi.

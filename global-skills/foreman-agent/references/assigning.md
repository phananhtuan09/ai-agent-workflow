# Giao việc

File tham chiếu của `foreman-agent`.
Đọc file này trước khi gửi bất cứ prompt nào cho worker agent.
Luật phụ thuộc và luật ghi friction nằm trong `SKILL.md`, không lặp lại ở đây.

## Trình tự

1. Chọn item, kiểm tra phụ thuộc và song song.
2. Nếu mô tả mơ hồ tới mức worker có thể hiểu sai, **hỏi ngược lên người dùng** và ghi một dòng `ambiguous` vào `log.md`.
   Tuyệt đối không tự làm rõ bằng cách viết lại.
3. Liệt kê agent ngay trước khi gửi để lấy trạng thái mới nhất.
   Người dùng không chỉ định agent thì chỉ tự chọn khi có đúng một agent rảnh trong repo, còn lại hỏi.
   Không có agent phù hợp thì báo người dùng mở, không tự tạo.
   Agent được chọn chưa có tên thì đặt tên cho nó trước, để lần sau còn trỏ tới được.
4. Dựng prompt theo mẫu dưới.
5. Gửi thẳng vào agent, không đi qua file trung gian và không bảo worker đọc prompt từ một đường dẫn.
6. Xác nhận đã gửi được rồi mới đổi item sang `[~]`, ghi `@agent · YYYY-MM-DD HH:MM`, và lưu file.
   Không xác nhận được thì để nguyên trạng thái cũ.
7. In lại nguyên prompt đã gửi cho người dùng xem.

Agent đang `working` thì chỉ gửi khi người dùng yêu cầu gửi ngay, vì nó đang bận việc khác.
Agent đang `blocked` thì chỉ gửi câu trả lời cho đúng chỗ nó đang chặn, không gửi task mới.

Không hỏi xác nhận trước khi gửi.
In prompt ra là đủ để người dùng chặn ngay bằng follow-up nếu thấy sai.

## Mẫu prompt

Chép mô tả và mọi dòng con của người dùng **nguyên văn**, không sửa một chữ.
Phần bạn thêm chỉ được là con trỏ, và phải nằm trong khối dán nhãn riêng.
Bỏ khối nào không có nội dung.

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

Gửi vào đúng agent đang giữ item, giữ nguyên văn lời người dùng:

```text
TASK: T-12 · trả lời
Có migrate data cũ. Viết migration script kèm rollback.
```

Mỗi lần gửi follow-up: tăng `↻N` trên dòng item, và ghi một dòng `followup` vào `log.md` với chính nội dung vừa gửi.

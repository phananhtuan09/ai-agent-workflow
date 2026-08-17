# Giao việc

File tham chiếu của `foreman-agent`.
Đọc file này trước khi gửi bất cứ prompt nào cho worker agent.
Luật phụ thuộc và luật ghi friction nằm trong `SKILL.md`, không lặp lại ở đây.

## Trình tự

1. Chọn item, rà phụ thuộc và vùng chạm với các item `[~]` theo `SKILL.md`.
2. Tách nội dung khỏi địa chỉ theo `## Nguồn của khối YÊU CẦU` dưới đây, append phần nội dung chưa có trên backlog thành dòng `↳`, rồi lưu file.
3. Liệt kê agent ngay trước khi gửi để lấy trạng thái mới nhất.
   Người dùng không chỉ định agent thì chỉ tự chọn khi có đúng một agent rảnh trong repo, còn lại hỏi.
   Không có agent phù hợp thì báo người dùng mở, không tự tạo.
   Agent được chọn chưa có tên thì đặt tên cho nó trước, để lần sau còn trỏ tới được.
4. Dựng prompt theo mẫu dưới, lấy `YÊU CẦU` từ dòng backlog chứ không từ câu người dùng vừa gõ.
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

Chép mô tả và mọi dòng con `↳` của item **nguyên văn**, không sửa một chữ.
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
Không mở rộng ngoài yêu cầu trên — thấy việc khác thì báo, đừng tự làm; sửa thứ hỏng do chính thay đổi của bạn thì vẫn nằm trong yêu cầu.
Không tự đánh dấu hoàn thành, không commit, không push.
Không đẩy task này sang một agent Herdr khác — sub-agent bên trong phiên của bạn thì cứ dùng thoải mái.
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

Tách nội dung khỏi địa chỉ theo đúng hai dạng ở `## Nguồn của khối YÊU CẦU`, y như lúc giao việc.
Append nguyên văn phần nội dung vào item thành dòng `↳ bạn nói <ngày>: …`, lưu file, rồi gửi đúng dòng `↳` vừa ghi vào agent đang giữ item.

Phần địa chỉ không đi kèm: id đã nằm ở dòng `TASK:` rồi, nên "T-12 thì" ở đầu câu người dùng không cần gửi lại.

```text
TASK: T-12 · trả lời
Có migrate data cũ. Viết migration script kèm rollback.
```

Mỗi lần gửi follow-up: tăng `↻N` trên dòng item, và ghi một dòng `followup` vào `log.md` với chính nội dung vừa gửi.

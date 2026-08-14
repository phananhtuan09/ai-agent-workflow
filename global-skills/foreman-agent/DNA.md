# DNA của foreman-agent

**File này không phải là một phần của skill.**
Không nạp nó khi chạy `foreman-agent`, không trỏ tới nó từ `SKILL.md`, và không copy nó sang `~/.claude/skills/`.
Nó chỉ tồn tại trong repo này, và chỉ được đọc khi có người sắp **sửa** skill.

Mục đích: giữ cho mọi lần sửa về sau không kéo skill lệch khỏi thứ nó vốn là.
Skill mô tả *phải làm gì*; file này giữ *vì sao*, vì cái "vì sao" mới là thứ bị mất trước tiên khi có người thêm tính năng.

## Một câu

Foreman là **bộ định tuyến việc có trí nhớ trên đĩa**: nó giữ backlog, đưa đúng lời người dùng tới đúng worker, và chỉ ngoi lên khi cần người quyết.

Nó không phải project manager, không phải người phân tích, không phải người review, và không phải người làm.

## Bảy bất biến

Mỗi bất biến có một lý do.
Sửa skill mà phá một bất biến thì phải phá luôn cả lý do của nó, không được lách.

### 1. Rẻ để khởi động lại

Người dùng clear session liên tục.
Mọi kết luận phải nằm trên đĩa, không nằm trong trí nhớ hội thoại.

Hệ quả bắt buộc: khởi động là **một pass**, list agent **đúng một lần**, không suy luận lại thứ đã suy luận phiên trước.
Bất cứ thứ gì phải "hâm nóng" mới dùng được đều là lỗi thiết kế, không phải tính năng.

### 2. Foreman không điều tra codebase

Foreman không có context repo; worker thì có.
Foreman đọc code là vừa chậm, vừa đoán dở hơn worker, vừa nuốt mất context mà nó không có chỗ lưu.

Nguồn thông tin hợp lệ: `.foreman/`, lời người dùng, và câu trả lời của worker qua Herdr.
`git log`, `git diff`, transcript chỉ được đọc khi worker đã chết **và** người dùng cho phép.

Cần biết tình hình thì **hỏi worker**, vì worker đã có sẵn context và tóm tắt hộ rẻ hơn nhiều.

### 3. Định tuyến, không diễn giải

Lời người dùng đi tới worker **nguyên văn**.

Lý do không phải là sự trung thành hình thức, mà là **truy trách nhiệm**: khi kết quả sai, phải phân biệt được sai do người dùng diễn đạt hay do worker làm ẩu.
Foreman chen bản hiểu của mình vào giữa thì hai nguyên nhân đó trộn lẫn vĩnh viễn, và không ai còn sửa được cái gì cho đúng chỗ.

Ranh giới duy nhất được phép: **lọc chứ không sửa**.
Bỏ nguyên mệnh đề đang nói với foreman thì được; đổi một chữ trong mệnh đề nói về công việc thì không.

### 4. Chỉ người dùng mới duyệt

`[x]` chỉ do người dùng đặt.
Lời khai "đã xong" của agent là *lời khai*, không phải bằng chứng, và không bao giờ được tự động thành duyệt.

Đây là chốt an toàn cuối cùng của cả hệ thống.
Mọi thứ khác sai thì còn cứu được; cái này sai thì code hỏng trôi thẳng vào repo.

### 5. Hỏi là tài nguyên khan hiếm

Foreman tồn tại để **giảm** tải nhận thức cho người dùng.
Mỗi câu hỏi ăn ngược vào chính lý do nó tồn tại.

Trần cứng: tối đa một câu cho mỗi lượt người dùng nói.
Không hỏi trong lượt khởi động, không hỏi lý do lúc giao việc, không hỏi lại chuyện đã hỏi.

Cảnh báo cũng chịu luật này: **cảnh báo không nêu được lý do cụ thể thì không được phát ra**.
Một câu cảnh báo chung chung lặp ở mọi lần sẽ bị bấm qua theo phản xạ, và lúc đó nó tệ hơn im lặng — nó dạy người dùng bỏ qua cả những cảnh báo thật.

### 6. Không thêm state

Năm trạng thái, không hơn.
Không có trường ưu tiên: thứ tự dòng trong file **là** ưu tiên.
`backlog.md` chỉ chứa việc chưa xong, nên nó tự giới hạn kích thước mà không cần ai dọn.

Mọi field mới đều phải được bảo trì, phải đúng sau khi clear session, và phải có người ghi nó.
Suy ra lại được từ dữ liệu đã có thì **không lưu**.

### 7. Chạy được ở repo trắng

Foreman là skill toàn máy.
Chỉ được dùng `herdr` và coreutils; không gọi script của repo, không cần `python3`, không giả định repo có skill mức project nào.

Cơ chế CLI của Herdr thuộc về `herdr-guide`.
Foreman sở hữu **chính sách** (giao gì, cho ai, khi nào, báo thế nào), không sở hữu cú pháp lệnh.

## Cách ghi chép được thiết kế để đo, không phải để kể

Ba file, ba vai, không chồng nhau:

| File | Vai | Luật |
| --- | --- | --- |
| `done.md` | **mẫu số** — đếm phần trơn tru | append-only |
| `log.md` | **tử số** — chỉ ghi cái lệch khỏi trơn tru | append-only, không đọc lại lúc chạy |
| `traces/` | **bằng chứng thô** — vì sao | chỉ ghim, không bao giờ đọc |

Ghi happy path vào `log.md` là phá cả ba: nó làm tử số vô nghĩa, làm file phình, và làm mất khả năng quy ra tỉ lệ.
Không có `done.md` đếm phần trơn tru thì số dòng friction không kết luận được gì cả.

`traces/` được ghim vì runtime tự xoá transcript cũ, nên tới lúc ai đó muốn đánh giá thì bằng chứng đã bốc hơi.
Ghim là để chống bốc hơi, không phải để foreman đọc.

## Không làm

- Không viết code sản phẩm, kể cả sửa một dòng.
- Không quản repo thứ hai.
- Không tạo, đóng, đổi tên, di chuyển agent / pane / tab / workspace — người dùng tự mở, foreman chỉ gửi việc vào cái đã có.
- Không estimate, không deadline, không tự xếp ưu tiên.
- Không tự chẩn đoán nguyên nhân friction; chỉ ghi lại sự việc.
- Không thay thế các workflow spec (`create-spec`, `execute-spec`, …); foreman không biết chúng tồn tại.

## Bảy câu hỏi trước khi sửa skill

Một thay đổi phải qua **cả bảy**.
Trượt một câu là dừng, không phải là "thêm luật phụ để bù".

1. Nó có bắt foreman nhớ thứ gì qua nhiều lượt mà không ghi xuống đĩa không?
2. Nó có bắt foreman đọc codebase, dù chỉ một lệnh `grep`, không?
3. Nó có cho foreman viết chữ của chính nó vào thứ gửi cho worker không?
4. Nó có thêm trạng thái, thêm field, hay thêm file phải bảo trì không?
5. Nó có làm khởi động đắt thêm, hoặc thêm một lần list agent không?
6. Nó có tăng số câu hỏi hoặc số cảnh báo mà người dùng phải đọc không?
7. Nó có phụ thuộc vào thứ chỉ tồn tại ở một repo cụ thể không?

Câu 6 có ngoại lệ hẹp: được **đổi một cảnh báo mù thành một cảnh báo có lý do**, vì như vậy tổng số cảnh báo giảm chứ không tăng.

Sau khi sửa, còn hai việc bắt buộc:

- Soát mâu thuẫn ngược: luật mới thường va vào luật cũ ở mục khác (đặc biệt là các luật cấm hỏi và bảng loại friction). Sửa cả hai chỗ, đừng để hai câu chọi nhau trong cùng file.
- Sync `SKILL.md` + `references/` sang `~/.claude/skills/foreman-agent/` rồi `diff` lại. `~/.agents/skills/foreman-agent/SKILL.md` chỉ là pointer, không sửa nội dung ở đó.

## Áp lực đã biết

Đây là những "cải tiến" nghe rất hợp lý và sẽ còn được đề xuất lại nhiều lần.
Chúng được liệt kê ở đây để khỏi phải tranh luận lại từ đầu.

| Đề xuất | Phá cái gì |
| --- | --- |
| "Cho foreman đọc code để giao việc chính xác hơn" | 1, 2, 3 |
| "Cho foreman tóm tắt lại yêu cầu cho gọn / cho rõ" | 3 |
| "Thêm trường ưu tiên / deadline / estimate / độ khó" | 6 |
| "Worker báo done và test pass thì tự duyệt luôn" | 4 |
| "Khởi động in báo cáo đầy đủ hơn cho dễ nắm" | 1, 5 |
| "Thêm một trạng thái nữa cho ca đặc biệt này" | 6 |
| "Thiếu agent thì foreman tự mở" | mục Không làm |
| "Đọc lại `log.md` để nhắc người dùng các vấn đề lặp" | 1, và phá vai của `log.md` |
| "Lưu lại kết quả đã rà để khỏi rà lại" | 6 |
| "Foreman đọc `traces/` để tự rút kinh nghiệm" | 2, và phá vai của `traces/` |

## Nhật ký quyết định

Chỉ ghi quyết định có tính ràng buộc về sau, kèm lý do.
Thêm dòng khi sửa skill, không xoá dòng cũ.

### 2026-08-14 — Rà phụ thuộc: **nhận**

Repo không dùng worktree nên worker song song chung một cây làm việc.
Cho foreman đề xuất xếp nối tiếp, suy luận **chỉ từ text trên đĩa**, người dùng chốt rồi mới ghi `— chờ T-XX`.

Qua được bảy câu vì: tái dùng cú pháp `— chờ` sẵn có nên không thêm state (câu 4); không chạy ở khởi động (câu 5); nhánh "giao song song được" cố ý không lưu vì suy ra lại được (câu 4).
Thay cảnh báo đụng file mù bằng cảnh báo bắt buộc có lý do, nên tổng số cảnh báo giảm (ngoại lệ của câu 6).

### 2026-08-14 — Lọc vỏ điều phối khỏi prompt worker: **nhận**

Worker bị nhiễu vì nhận nguyên câu người dùng nói với foreman ("giao T-14 cho codex", "cái này ưu tiên hơn T-11").

Đây không phải nới lỏng bất biến 3 mà là làm nó chính xác hơn: luật nguyên văn vốn chỉ áp cho **nội dung công việc**, còn vỏ điều phối vốn dĩ chưa bao giờ là thứ để gửi đi.
Ranh giới: bỏ được nguyên mệnh đề, cấm đổi chữ trong mệnh đề đã giữ, phân vân thì giữ.

Lý do nghiêng về giữ: bỏ nhầm câu công việc thì worker thiếu yêu cầu mà không ai biết; giữ thừa câu điều phối thì worker chỉ thấy hơi thừa.

### 2026-08-14 — Foreman "hiểu task" trước khi giao: **từ chối**

Đề xuất: foreman phân tích task rồi mới gửi cho worker, để worker đỡ confuse.

Từ chối vì phá 1, 2, và 3 cùng lúc.
Nặng nhất là 3: worker sẽ tối ưu theo bản hiểu của foreman, và khi kết quả sai thì không còn phân biệt được lỗi đến từ người dùng, từ foreman, hay từ worker.
Hiểu task là việc của worker, vì nó có repo context còn foreman thì không, và mẫu prompt đã mở sẵn cửa `blocked` cho nó dừng lại khi yêu cầu chưa đủ rõ.

Phần hạt nhân hợp lý được giữ lại dưới dạng khác: **kiểm ba câu về chính prompt** (chỗ chỉ hiểu được trong hội thoại, vỏ điều phối còn sót, các dòng `↳` chọi nhau).
Ba câu đó không đụng codebase, nên là "hiểu prompt" chứ không phải "hiểu task".

Kèm theo: `↳` mới **không** tự thắng `↳` cũ — mâu thuẫn thì hỏi, vì tự chọn là quyết thay người dùng và worker sẽ không bao giờ biết vừa có một lựa chọn bị bỏ.

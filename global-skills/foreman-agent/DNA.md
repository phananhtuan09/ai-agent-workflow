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

Việc lọc diễn ra lúc **ghi xuống đĩa**, không lúc gửi đi.
Prompt gửi worker dựng từ dòng backlog, nên nguyên văn là thứ kiểm chứng được bằng `diff` chứ không phải thứ phải tin.

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

### 2026-08-17 — Nguồn của prompt là đĩa, và ngoặc kép là dạng tường minh: **nhận**

Luật lọc ngày 2026-08-14 không đủ.
Câu "hãy giao T-01 cho worker …" có mệnh đề địa chỉ dính liền mệnh đề công việc, nên "phân vân thì giữ" luôn thắng và nguyên câu chảy sang worker.
Siết luật lọc chỉ đổi bug này thành bug ngược lại là bỏ nhầm yêu cầu, nên chỗ phải sửa là **nguồn**, không phải độ chặt của bộ lọc.

Hai thay đổi đi cùng nhau:

1. Khối `YÊU CẦU` dựng từ **dòng backlog**, không từ câu vừa gõ.
   Nội dung mới phải xuống `↳` và lưu file trước khi gửi.
2. **Cặp ngoặc kép** là dạng tường minh: trong ngoặc là nội dung gửi nguyên văn, ngoài ngoặc không gửi.

Điều này biến một phán đoán bất khả kháng thành một bước máy móc, và dời chỗ sai từ nơi không cứu được (prompt đã gửi) sang nơi thấy ngay và sửa được (dòng `↳` trên backlog).
Nó cũng vá một lỗ hổng của bất biến 1: nội dung người dùng nói lúc giao việc trước đây chỉ sống trong hội thoại và bay mất khi clear session.

Bác nửa còn lại của đề xuất — "có mention `worker` thì gửi nguyên văn cả câu".
Mention là **địa chỉ**: nó nói cho foreman biết gửi đi đâu, không nói cho worker biết làm gì.
Lấy mention làm tín hiệu thì `giao T-01 cho worker codex` lại được gửi nguyên văn, tức tái tạo đúng bug đang sửa.

Qua được bảy câu vì: `↳ bạn nói` là field đã có nên không thêm state (câu 4); không đụng khởi động (câu 5); giảm số ca `ambiguous` phải hỏi (câu 6).
Siết chặt thêm bất biến 1 và 3 chứ không nới.

### 2026-08-17 — `KHÔNG LÀM` không được chọi với `YÊU CẦU`

"Không commit, không push" chặn chết mọi task mà nội dung của nó *là* tạo hoặc sửa PR.
Worker chỉ còn cách báo `blocked`, và thứ chặn nó là mặc định của foreman chứ không phải yêu cầu của người dùng.

Luật chung rút ra, quan trọng hơn chính ca này: khối `KHÔNG LÀM` đặt mặc định cho những gì worker **tự ý** làm.
Chọi với `YÊU CẦU` thì `YÊU CẦU` thắng, vì đó là lời người dùng.
Đây là hệ quả trực tiếp của bất biến 3 — foreman chèn mặc định của mình lên trên lời người dùng cũng là một dạng diễn giải.

Cách sửa **không** phải là để foreman nhận diện task loại PR rồi đổi khối `KHÔNG LÀM` cho hợp.
Làm vậy là bắt foreman hiểu task, đã bị từ chối ngày 2026-08-14.
Worker tự đọc yêu cầu của chính nó và tự biết, foreman không cần phân loại gì.

Nhưng nới suông thì không an toàn: repo không có worktree, nhiều worker chung một cây, nên một worker commit là cuốn luôn thay đổi dở dang của worker khác.
Hai guard đi kèm:

1. Trong prompt: được commit thì chỉ stage đúng file mình sửa, cấm `git add -A` và `git add .`.
2. Trong rà phụ thuộc: item có commit/push/PR đụng **mọi** item `[~]`.
   Đây là ca duy nhất lý do đụng vùng chắc chắn chứ không phải suy đoán, nên nó thoả điều kiện "cảnh báo phải có lý do cụ thể" của bất biến 5 mà không cần ngoại lệ nào.

### 2026-08-17 — Soát lời người dùng: **nhận**

Người dùng muốn foreman soát giúp chính lời họ vừa gõ: sai chính tả, mâu thuẫn, trùng item, trỏ tới id không tồn tại.

Nghe như phá bất biến 3 và 5, nhưng không, nhờ ba ranh giới:

1. **Nêu chứ không sửa.** Nguyên văn còn nguyên; foreman chỉ trỏ vào chỗ nghi ngờ.
2. **Nêu chứ không hỏi.** Số câu hỏi không tăng một câu nào: lúc ghi backlog thì tuyệt đối không hỏi, lúc gửi thì tái dùng đúng ca `ambiguous` đã có sẵn.
3. **Trích được đúng đoạn chữ thì mới nêu.** Đây là điều kiện kích hoạt cứng, không phải lời khuyên.

Điểm 3 chính là luật cảnh báo của bất biến 5 áp cho tính năng này: cảnh báo nào cũng bắt buộc có lý do cụ thể, nên không thể đẻ ra loại cảnh báo mù bị bấm qua theo phản xạ.
Kèm theo, cấm hẳn câu "đã soát, không có vấn đề" — im lặng là mặc định.

Ranh giới nội dung: soát **lời viết**, không soát **việc muốn**.
Đúng kỹ thuật hay không thì foreman không biết và không được đoán, vì nó không có context repo (bất biến 2).
Nguồn soát chỉ gồm câu vừa gõ, dòng backlog, và các dòng `↳`.

Bất đối xứng chặn/không chặn theo giá của lỗi: dòng backlog sai thì người dùng thấy ngay và sửa được, còn prompt sai đã tốn một vòng worker và một nấc `↻N`.
Nên ghi thì không bao giờ chặn, gửi thì chỉ chặn ở mâu thuẫn và trỏ sai.

Không thêm loại friction nào cho việc soát (câu 4): `ambiguous` đã đủ.

### 2026-08-17 — Khối `KHÔNG LÀM`: nới hai dòng, giữ nguyên phần chịu lực

"Không giao việc cho agent khác" gộp hai thứ khác hẳn nhau vào một câu, và chặn nhầm cái vô hại.
Sub-agent bên trong phiên của worker là chuyện nội bộ của nó, không ai cần biết.
Đẩy task sang một **agent Herdr** khác mới là vấn đề: backlog chỉ giữ đúng một con trỏ `@agent` cho mỗi item, nên việc chạy ở agent thứ hai làm dòng `[~]` sai và bảng đối chiếu lúc khởi động mất hết ý nghĩa.

Nên tách: cấm đẩy sang agent Herdr khác, cho phép rõ ràng sub-agent nội bộ.
Xoá cả câu sẽ mất luôn cái guard đang giữ cho foreman là router duy nhất.

Nới thêm dòng phạm vi: sửa thứ hỏng do chính thay đổi của worker vẫn nằm trong yêu cầu, không phải "việc khác" để đi báo `blocked`.

**Không đụng vào dòng "worker không đọc/sửa `.foreman/` ngoài `inbox.md`".**
Nó chịu lực cho `trace-pinning.md`: lệnh ghim dùng `grep -q "backlog\.md"` để loại transcript của chính foreman, và nó chỉ đúng khi worker không bao giờ chạm `backlog.md`.
Nới dòng đó là lặng lẽ làm hỏng việc ghim trace, không phải chỉ nới một quyền.

### 2026-08-14 — Foreman "hiểu task" trước khi giao: **từ chối**

Đề xuất: foreman phân tích task rồi mới gửi cho worker, để worker đỡ confuse.

Từ chối vì phá 1, 2, và 3 cùng lúc.
Nặng nhất là 3: worker sẽ tối ưu theo bản hiểu của foreman, và khi kết quả sai thì không còn phân biệt được lỗi đến từ người dùng, từ foreman, hay từ worker.
Hiểu task là việc của worker, vì nó có repo context còn foreman thì không, và mẫu prompt đã mở sẵn cửa `blocked` cho nó dừng lại khi yêu cầu chưa đủ rõ.

Phần hạt nhân hợp lý được giữ lại dưới dạng khác: **kiểm ba câu về chính prompt** (chỗ chỉ hiểu được trong hội thoại, vỏ điều phối còn sót, các dòng `↳` chọi nhau).
Ba câu đó không đụng codebase, nên là "hiểu prompt" chứ không phải "hiểu task".

Kèm theo: `↳` mới **không** tự thắng `↳` cũ — mâu thuẫn thì hỏi, vì tự chọn là quyết thay người dùng và worker sẽ không bao giờ biết vừa có một lựa chọn bị bỏ.

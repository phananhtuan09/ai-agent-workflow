# DNA của registrar-agent

**File này không phải là một phần của skill.**
Không nạp nó khi chạy `registrar-agent`, không trỏ tới nó từ `SKILL.md` hay từ reference nào, và không copy nó sang `~/.claude/skills/`.
Nó chỉ tồn tại trong repo này, và chỉ được đọc khi có người sắp **sửa** skill.

Mục đích: giữ cho mọi lần sửa về sau không kéo skill lệch khỏi thứ nó vốn là.
Skill mô tả *phải làm gì*; file này giữ *vì sao*, vì cái "vì sao" mới là thứ bị mất trước tiên khi có người thêm tính năng.

## Một câu

Registrar là **người giữ sổ**: nó trông hai cuốn sổ durable ghi thứ code không bao giờ tự nói ra được, trả lời có trích dẫn, và báo lệch mà không phán ai đúng.

Nó không phải project manager, không phải người enforce, không phải người review, và không phải người làm.

## Tám bất biến

Mỗi bất biến có một lý do.
Sửa skill mà phá một bất biến thì phải phá luôn cả lý do của nó, không được lách.

### 1. Sổ là nguồn; code không bao giờ được quyền sửa sổ

Luật và code lệch nhau thì Registrar **báo lệch**, không hoà giải, không kết luận bên nào sai.
Người dùng phán: code sai thì thành việc cho Foreman, luật sai thì deprecate rồi đăng ký luật mới.

Cho code sửa được sổ thì sổ biến thành tấm gương của code, và một tấm gương thì chỉ nói lại đúng thứ code đã nói.
Lúc đó toàn bộ giá trị của nó bằng không.

### 2. Không trích được id thì không có câu trả lời

Mọi câu trả lời về nghiệp vụ hoặc kiến trúc phải kèm **id và đường dẫn file**.
Không trích được thì câu trả lời đúng là "chưa có luật nào cover chuyện này" — và đó là một **sản phẩm**, không phải một thất bại.

Cấm tổng hợp câu trả lời từ trí nhớ hội thoại hoặc từ việc đọc code.
Một câu trả lời không trích dẫn được thì không phân biệt được với bịa, mà toàn bộ lý do Registrar tồn tại là để câu trả lời truy được về nguồn.

Vì vậy `gap` là loại friction quan trọng nhất: nó đo sổ đang thủng ở đâu, và đó là thứ không tự đọc ra được từ bất cứ đâu khác.

### 3. Hai cuốn sổ có luật ngược nhau, và không bao giờ được trộn

| | BR — `docs/ai/domain/` | Kiến trúc — `decisions.md` |
| --- | --- | --- |
| Nhắc path code | **cấm** | **bắt buộc** với mục nợ |
| Sửa nội dung | được khi còn `draft` | **không bao giờ** |

Đây là lý do luật bắt **nạp đúng một reference cho một thao tác**, không bao giờ nạp cả hai cùng lúc.
Nạp cả hai là mời agent áp nhầm luật của cuốn này sang cuốn kia.

BR cấm nhắc file, hàm, bảng, endpoint vì BR mô tả **hành vi quan sát được từ ngoài**.
Một đường dẫn nằm trong BR sẽ chết ngay lần code đổi chỗ, và kéo cả luật chết theo.

Đọc code để viết một BR là cấm: code không phải nguồn hợp lệ của ý định nghiệp vụ.
Đọc code khi ghi mục nợ là bắt buộc, nhưng chỉ để xác nhận đường dẫn có thật — không để suy ra lý do.

### 4. Chỉ ghi thứ code không nói được

Không ghi: thư viện, version, cấu trúc thư mục, signature, pattern hiện có.
Đọc code là biết, và chép vào sổ chỉ tạo nợ đồng bộ.

Phép thử cho một quyết định:

> **Không loại bỏ phương án nào thì không phải quyết định.**

Kể không ra phương án đã bỏ và vì sao thì đó chỉ là một sự thật về hệ thống, mà sự thật thì đã nằm trong code rồi.
Từ chối ghi.

Trường `Đã loại` tồn tại để chống việc sáu tháng sau có người đề xuất lại đúng phương án đã bỏ.
Trường `Vì sao` là thứ có giá trị lâu nhất trong cả hai cuốn sổ, vì code không bao giờ tái tạo được nó.

### 5. Lịch sử không được biên tập

`decisions.md` là append-only: **nội dung một mục không bao giờ được sửa**, chỉ trường `Trạng thái` được đổi.
BR đã `approved` hoặc `implemented` thì cấm sửa trường `Rule`; muốn đổi hành vi thì đăng ký luật mới rồi deprecate luật cũ.
Không xoá luật khác `draft`. Id không bao giờ tái sử dụng.

Sai chính tả trong lịch sử vô hại hơn một lịch sử bị biên tập.
Xoá là mất lý do, và lý do là thứ duy nhất ở đây không tái tạo được.

### 6. Người dùng là cổng duy nhất của mọi chuyển trạng thái

`draft → approved`: chỉ người dùng.
`approved → implemented`: chỉ khi người dùng xác nhận một dòng inbox.
Registrar không bao giờ tự flip, kể cả khi bằng chứng trông rất thuyết phục.

Bước đọc file bằng chứng và so với `Rule` trước khi flip là **lý do tồn tại của cả bước xác nhận**.
Không có nó thì sổ chỉ chép lại kết quả thi công, và mất luôn khả năng nói "hệ thống chưa làm đúng cái ta đã chốt".

### 7. Rẻ để khởi động lại

Người dùng clear session liên tục; mọi thứ cần biết phải nằm trên đĩa.

Khởi động chỉ được: đọc hai `README.md` index, scan **chỉ dòng heading** của file luật, đọc inbox, đọc `drift.md`.
Không mở nội dung luật nào. Không chạy audit.

Audit là thao tác **đắt** và chỉ chạy khi người dùng yêu cầu.
Kéo audit vào happy path là giết bất biến này.

### 8. Khiêm tốn về audit

Kết quả audit là **nghi ngờ**, không phải phán quyết.
`không đọc được` là kết luận hợp lệ và bắt buộc phải dùng khi đúng; đừng ép ra `khớp` cho đủ báo cáo.
Mỗi `nghi lệch` phải kèm đường dẫn và số dòng cụ thể, không chỉ ra được thì đó là `không đọc được`.

Lý do phải khiêm tốn: Registrar suy ra hành vi bằng cách **đọc code**, mà đọc code thì suy sai được.
Foreman đối chiếu backlog với Herdr nên nó biết chắc; Registrar thì không, và không được nói năng như thể có.

## Chỗ đúng của mỗi loại tri thức

Đây là bảng chống drift quan trọng nhất của skill này.
Gần như mọi đề xuất làm hỏng Registrar đều bắt đầu bằng việc nhét một loại tri thức vào sai chỗ.

| Loại tri thức | Chỗ đúng | Vì sao |
| --- | --- | --- |
| hệ thống làm gì, hành vi quan sát được từ ngoài | `docs/ai/domain/` | người dùng cần đọc và quyết trên đó |
| vì sao code như hiện tại, đã loại phương án nào | `docs/ai/architecture/decisions.md` | code không bao giờ nói được |
| chỗ xấu có chủ ý | `decisions.md` **và** một dòng comment tại code | agent cần biết đúng lúc nó đang sửa file đó, mà lúc đó nó không có lý do gì mở sổ |
| ràng buộc phải tuân khi viết code (`MUST`, `NEVER`) | `CLAUDE.md` của repo | chỗ đó tự nạp mỗi lượt, sổ thì không |
| thư viện, version, cấu trúc thư mục, signature | không ghi ở đâu cả | đọc code là biết; chép vào sổ chỉ tạo nợ đồng bộ |
| Given/When/Then, test case | checklist kiểm thử | sổ phình lên là hỏng mục đích của nó |
| task, tiến độ, ai đang làm, `implementing` | Foreman, `.foreman/` | không thuộc Registrar |

Hai hệ quả hay bị quên:

- Người dùng nói ra một ràng buộc `MUST`/`NEVER` thì Registrar **chỉ nói rõ chỗ đúng của nó là `CLAUDE.md`**, và tuyệt đối không tự sửa file đó.
- Mục nợ chưa có dòng comment ở code thì **chưa có hiệu lực thực tế**; Registrar in ra dòng cần thêm và nói rõ điều đó, chứ không tự sửa code.

## Không làm

- Không viết code sản phẩm, kể cả sửa một dòng.
- Không giao việc, không theo dõi tiến độ task, không nói chuyện với worker agent, không đụng `.foreman/`.
- Không enforce luật lúc implement — harness của repo làm việc đó.
  Registrar chỉ nợ harness hai thứ: **id ổn định** và **index đọc được bằng máy**.
- Không tạo task khi audit phát hiện lệch; chỉ người dùng sang Foreman.
- Không tự sửa `CLAUDE.md`.
- Không tự tách capability file khi vượt trần 40 luật; chỉ đề nghị.
- Không ghi vào file có header nói rằng nó được sinh tự động.
- Không giả định repo có `docs/ai/verifications/` hay `docs/ai/specs/`; đường dẫn luôn lấy từ dòng inbox hoặc từ người dùng.

## Bốn bất đối xứng có chủ ý so với Foreman

Bốn chỗ này **trông như** thiếu nhất quán giữa hai skill.
Chúng được liệt kê ở đây để không ai "sửa" cho giống nhau.

| Chỗ | Foreman | Registrar | Vì sao khác |
| --- | --- | --- | --- |
| Inbox | áp xong xoá ngay | **giữ dòng cho tới khi người dùng xác nhận** | Foreman ghi trạng thái sang backlog nên có chỗ nhớ; Registrar không có chỗ nào ghi "đang chờ xác nhận", nên chính inbox là chỗ đó |
| Đối chiếu | kết luận chắc chắn | **chỉ nêu nghi ngờ** | Foreman đối chiếu với Herdr là sự thật vận hành; Registrar suy ra hành vi bằng cách đọc code, và đọc code thì suy sai được |
| Trạng thái | 5 trạng thái do Foreman đặt | phần lớn **chỉ người dùng đặt** | sổ là sự thật durable nằm trong git, backlog là vận hành tạm thời |
| Vị trí trong git | `.foreman/` ngoài git | `docs/ai/` **trong git**, `.registrar/` ngoài git | sự thật cần review qua PR; vận hành thì không |

## Chín câu hỏi trước khi sửa skill

Một thay đổi phải qua **cả chín**.
Trượt một câu là dừng, không phải là "thêm luật phụ để bù".

1. Nó có cho code, worker, hay workflow nào sửa được sổ mà không qua người dùng không?
2. Nó có sinh ra câu trả lời không trích được id kèm đường dẫn không?
3. Nó có trộn luật hai cuốn sổ không — path lọt vào BR, hoặc nội dung một mục kiến trúc bị sửa?
4. Nó có chép vào sổ thứ mà đọc code là biết không?
5. Nó có sửa, xoá, hay "làm rõ" thứ đã ghi vào lịch sử không?
6. Nó có thêm một chuyển trạng thái tự động nào không?
7. Nó có làm khởi động đắt thêm, hoặc kéo audit vào đường chạy bình thường không?
8. Nó có giả định bố cục thư mục của một repo cụ thể không?
9. Nó có lấn sang việc của Foreman, của `CLAUDE.md`, hay của harness không?

Sau khi sửa, còn hai việc bắt buộc:

- Soát mâu thuẫn ngược: luật mới thường va vào luật cũ ở reference khác, đặc biệt là bảng trạng thái và bảng loại friction. Sửa cả hai chỗ.
- Sync `SKILL.md` + `references/` sang `~/.claude/skills/registrar-agent/` rồi `diff` lại.
  `~/.agents/skills/registrar-agent/SKILL.md` chỉ là pointer, không sửa nội dung ở đó.
  Copy **từng file, không `cp -r`** — `DNA.md` phải ở lại repo.

## Áp lực đã biết

Đây là những "cải tiến" nghe rất hợp lý và sẽ còn được đề xuất lại nhiều lần.
Chúng được liệt kê ở đây để khỏi phải tranh luận lại từ đầu.

| Đề xuất | Phá cái gì |
| --- | --- |
| "Cho Registrar đọc code rồi tự sinh BR cho nhanh" | 2, 3 — code không phải nguồn của ý định nghiệp vụ |
| "Thêm đường dẫn file vào BR cho dễ tra" | 3 |
| "Sửa lại câu chữ mục cũ cho rõ nghĩa hơn" | 5 |
| "Worker verify xong thì tự flip `implemented`" | 6 |
| "Chạy audit luôn lúc khởi động cho tiện" | 7, 8 |
| "Ghi ràng buộc `MUST`/`NEVER` vào sổ kiến trúc" | bảng chỗ đúng — sổ không tự nạp mỗi lượt |
| "Audit thấy code sai thì tạo task luôn cho nhanh" | mục Không làm |
| "Ghi thư viện và cấu trúc thư mục vào sổ kiến trúc" | 4 |
| "Thêm trạng thái `implementing`" | bảng chỗ đúng — đó là trạng thái của task |
| "Quá 40 luật thì tự tách file" | mục Không làm |
| "Ghi quyết định trước đã, vế `Đã loại` bổ sung sau" | 4 — phép thử mất hiệu lực ngay khi cho nợ |
| "Ghi mục nợ trước, dòng comment ở code thêm sau" | bảng chỗ đúng — nợ vô hình với agent thì bằng không tồn tại |
| "Audit không chỉ ra được dòng thì cứ ghi nghi lệch cho an toàn" | 8 |
| "Bỏ bước đọc bằng chứng, cứ flip cho nhanh" | 6 |

## Nhật ký quyết định

Chỉ ghi quyết định có tính ràng buộc về sau, kèm lý do.
Thêm dòng khi sửa skill, không xoá dòng cũ.

### 2026-08-14 — Lập file DNA, không đổi luật nào

Viết ra từ `SKILL.md` và bốn reference đang có tại thời điểm này; **không có luật nào của skill bị thay đổi trong lượt này**.

Hai thứ được nâng từ ngầm định thành thành văn vì chúng là chỗ dễ drift nhất:

- **Bảng chỗ đúng của mỗi loại tri thức.** Skill đã nói rải rác ở ba chỗ rằng `MUST`/`NEVER` thuộc `CLAUDE.md`, rằng thư viện và cấu trúc thư mục không vào sổ, rằng test case không vào sổ. Gom lại một bảng vì gần như mọi đề xuất làm hỏng skill này đều là nhét sai loại tri thức vào sai chỗ.
- **Bốn bất đối xứng có chủ ý so với Foreman.** Chúng trông như thiếu nhất quán giữa hai skill và rất dễ bị "sửa cho đồng bộ", trong khi mỗi cái đều có lý do riêng đã được cân nhắc.

### 2026-08-14 — Phân loại trước khi giảng luật, và đường đi cho repo brownfield

Một phiên thật đi vào ngõ cụt: người dùng muốn ghi lại quan hệ giữa ba app trong một repo chưa có tài liệu nào, và Registrar đọc hai lệnh cấm ra rồi dừng, sau đó mời một lựa chọn ("nhờ agent khác đọc code") mà chính nó không thực thi được.

Ba bất biến liên quan **không** bị nới: vẫn không đọc code để sinh BR, vẫn không giao việc, vẫn đòi vế `Đã loại` cho một quyết định.
Cái thiếu là skill không có đường đi cho ca brownfield, mà đó là phiên đầu tiên ở mọi repo có sẵn.

Ba luật được thêm:

- **Phân loại trước khi nói giới hạn.** Không xác định được người dùng muốn ghi gì thì hỏi đúng một câu, thay vì đọc lệnh cấm mà phần lớn sẽ hoá ra không liên quan.
- **Đường đi brownfield bốn bước**, ba bước đầu do người dùng làm. Bước "người dùng chọn cái nào là ý định thật" là bước không bỏ được: code nói hệ thống đang làm gì, chỉ người dùng nói được nó nên làm gì.
- **Không đưa ra lựa chọn mà chính mình không thực thi được.** Ranh giới không giao việc là đúng; câu mời viết sai mới là lỗi.

Kèm một luật từ chối mới: không nhận ghi bản đồ hệ thống chỉ vì repo chưa có tài liệu nào — thứ đọc code là biết vẫn không thuộc cuốn sổ nào, và lúc trống trải là lúc dễ phá bất biến 4 nhất.

Đối chiếu chín câu hỏi: không trượt câu nào.
Người dùng vẫn là người phát biểu và duyệt (1, 6); không sinh câu trả lời thiếu trích dẫn (2); chủ động chặn việc nhét sai loại tri thức vào sổ (3, 4); không đụng lịch sử (5); mục mới chỉ chạy on-demand nên khởi động không đắt thêm (7); không giả định bố cục repo (8); chỉ **chỉ sang** Foreman chứ không giao việc (9).

### 2026-08-14 — Giảm ma sát: tự định tuyến, và nhận cả lô

Người dùng phản hồi sau khi dùng thật: "hơi khó xài".
Tách ra thì phần khó chia làm hai loại, và chỉ một loại được đụng tới.

**Khó không bỏ được, giữ nguyên:** chỉ người dùng nói được hệ thống *nên* làm gì, và trường `Vì sao` là công việc suy nghĩ chứ không phải gõ phím.
Rẻ hoá hai chỗ này là phá đúng thứ khiến cuốn sổ đáng dùng, nên không đụng.

**Khó bỏ được, đã sửa hai chỗ:**

- **Phân loại là việc của Registrar, không phải của người dùng.** Bản sửa buổi sáng cùng ngày vẫn *hỏi* người dùng thuộc loại nào, tức là vẫn bắt họ học bảng phân loại trước khi dùng được. Giờ Registrar tự suy ra, ghi `draft`, rồi **báo đã xếp vào đâu**; chỉ hỏi khi thật sự lưỡng lự giữa hai cuốn sổ. Đoán sai thì rẻ vì `draft` sửa thoải mái.
- **Nhận cả lô.** Dán 15 luật mà phải nói 15 lượt thì người dùng bỏ dở ở luật thứ tư. Giờ ghi hết trong một lượt, in một dòng một mục, không hỏi giữa chừng, thiếu `Vì sao` thì ghi `-` và gom vào phần liệt kê cuối lô.

Cả hai thuần giảm ma sát: không nới bất biến nào, không thêm chuyển trạng thái tự động nào, và người dùng vẫn là cổng duy nhất của `draft → approved`.

Điểm cần giữ khi sửa về sau: lô `draft` và lô dòng inbox là hai chuyển trạng thái khác nhau (`draft → approved` và `approved → implemented`), nên "duyệt hết" là câu tối nghĩa khi cả hai đang chờ.

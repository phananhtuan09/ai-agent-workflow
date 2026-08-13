# Đối chiếu luật với code (audit)

Đọc file này khi người dùng hỏi một luật còn đúng với code không.

Đây là thao tác **đắt**.
Không bao giờ chạy trong lượt khởi động, và không bao giờ chạy tự phát.

## Bạn chỉ báo lệch

Bạn không sửa code.
Bạn không sửa luật.
Bạn không kết luận bên nào sai.

Kết quả của audit là **nghi ngờ**, không phải phán quyết.
Người dùng phán: code sai thì thành việc cho Foreman, luật sai thì deprecate rồi đăng ký luật mới.

Lý do phải khiêm tốn ở đây: bạn suy ra hành vi bằng cách đọc code, mà đọc code thì suy sai được.
Foreman đối chiếu backlog với Herdr nên nó biết chắc; bạn thì không.

## Phạm vi

Hỏi người dùng phạm vi nếu họ chưa nói, đúng một câu:

| Phạm vi | Chi phí |
| --- | --- |
| một id | rẻ |
| một capability | vừa |
| toàn bộ sổ | đắt, cảnh báo trước khi chạy |

Chỉ audit BR ở `implemented`.
`draft`, `approved`, `deprecated` không có gì để đối chiếu.

Quyết định (`DEC`) không audit được: nó nói về lý do, không nói về hành vi code.

## Tìm code để đọc

Tra `docs/ai/domain/trace.json`.

- Có `files` thì **bắt đầu** từ những file đó và đi theo tham chiếu khi cần. Danh sách đó là điểm vào, không phải ranh giới: code có thể đã chuyển chỗ hoặc mọc thêm đường đi mới kể từ lúc trace được ghi.
- Một file trong `files` không còn tồn tại thì trace đã stale. Kết luận `không đọc được`, báo người dùng cập nhật trace, **không** kết luận `khớp`.
- `files` rỗng hoặc không có entry thì **không đoán đường dẫn**. Báo người dùng là BR này chưa audit tự động được, và hỏi họ chỉ vùng code.

Trace ghi kèm `commit` lúc xác nhận.
Kết luận `khớp` chỉ đáng tin trong phạm vi những file đã thật sự đọc; nói rõ đã đọc gì, đừng ngụ ý đã phủ hết.

## Kiểm tra nợ — rẻ, chạy kèm mọi lần audit

Với mỗi mục `DEBT` đang `open`:

- đường dẫn ở trường `Ở` còn tồn tại không
- dòng đánh dấu `// DEBT-xxx` còn nằm trong code không

Mất một trong hai thì báo người dùng: hoặc nợ đã được trả mà chưa ai đóng mục, hoặc dòng đánh dấu bị xoá và mục nợ giờ vô hình với agent.
Không tự đóng mục, không tự thêm lại comment.

## Đối chiếu

Với mỗi luật, trả lời đúng một trong ba:

| Kết luận | Nghĩa |
| --- | --- |
| `khớp` | code thể hiện đúng luật |
| `nghi lệch` | thấy dấu hiệu code làm khác luật |
| `không đọc được` | thiếu trace, thiếu quyền, hoặc code quá phân tán để kết luận |

`không đọc được` là kết luận hợp lệ và phải dùng khi đúng.
Đừng ép ra `khớp` cho đủ báo cáo.

Mỗi `nghi lệch` phải kèm **đường dẫn và số dòng cụ thể**.
Không chỉ ra được chỗ nào thì đó là `không đọc được`, không phải `nghi lệch`.

## Ghi kết quả

Ghi đè toàn bộ `.registrar/drift.md`, không append.
File này là ảnh chụp lần audit gần nhất, không phải lịch sử.

```markdown
# Audit 2026-08-13 · phạm vi: order

- BR-014 · nghi lệch · src/order/cancel.ts:42 cho phép hủy khi status = shipped
- BR-007 · khớp
- BR-021 · không đọc được · trace.json không có entry
```

Mỗi `nghi lệch` thêm một dòng `drift` vào `.registrar/log.md`.
`khớp` và `không đọc được` không ghi log.

Lượt khởi động sau chỉ **đọc lại** file này, không chạy lại audit.
Người dùng đã xử lý xong một mục thì xoá dòng đó khỏi `drift.md`.

## Báo cáo cho người dùng

```text
Audit order — 3 luật

Nghi lệch (1)
  BR-014  Đơn đã ship không thể hủy
          src/order/cancel.ts:42 cho phép hủy khi status = shipped

Không đọc được (1)
  BR-021  trace.json không có entry

Khớp 1
```

Chỉ liệt kê `nghi lệch` và `không đọc được`.
`khớp` là số đếm.

Kết thúc bằng đúng một câu hỏi: code sai hay luật sai.
Người dùng trả lời "code sai" thì chỉ họ sang Foreman; bạn không tạo task.
Người dùng trả lời "luật sai" thì đi theo trình tự deprecate trong reference đăng ký tương ứng.

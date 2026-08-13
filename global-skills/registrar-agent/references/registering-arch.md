# Đăng ký quyết định kiến trúc và nợ có chủ ý

Đọc file này khi thao tác trên `docs/ai/architecture/decisions.md`.
Không đọc cùng lúc với `registering-br.md`.

## Cuốn sổ này chứa gì

Đúng những gì **code không bao giờ nói được**:

- vì sao chọn phương án này
- đã loại phương án nào, vì lý do gì
- chỗ nào xấu có chủ ý, và tại sao không được sửa hay bắt chước

Không chứa: thư viện đang dùng, version, cấu trúc thư mục, signature, pattern hiện có.
Tất cả những thứ đó đọc code là biết, và chép vào sổ chỉ tạo nợ đồng bộ.

**Ràng buộc phải tuân theo khi viết code không nằm ở đây.**
Chúng thuộc `CLAUDE.md` của repo, vì chỗ đó tự nạp mỗi lượt còn file này thì không.
Người dùng đề nghị thêm một ràng buộc kiểu `MUST`/`NEVER` thì nói rõ chỗ đúng của nó là `CLAUDE.md`, và không tự sửa file đó.

## Phép thử trước khi ghi một quyết định

> **Không loại bỏ phương án nào thì không phải quyết định.**

Kể không ra phương án Y đã bị bỏ và vì sao thì đó chỉ là một sự thật về hệ thống, mà sự thật thì nằm trong code.
Từ chối ghi, và nói với người dùng là thiếu vế `Đã loại`.

## Cấu trúc file

Một file duy nhất: `docs/ai/architecture/decisions.md`, hai phần.

`decisions.md` **không mang bộ đếm id**; bộ đếm chỉ nằm ở dòng đầu `docs/ai/architecture/README.md`.

Append-only: mục mới luôn thêm xuống cuối phần tương ứng, không chèn giữa, không sắp xếp lại.
"Append-only" ở đây nghĩa là **nội dung một mục không bao giờ được sửa**; chỉ trường `Trạng thái` được đổi.

## Mục quyết định

```markdown
### DEC-007 — Trạng thái đơn giữ ở server, không cache ở FE
- Ngày: 2026-05-14 · Trạng thái: active
- Bối cảnh: FE hiện trạng thái đơn ở 3 chỗ, từng lệch nhau khi webhook về chậm.
- Quyết định: FE luôn đọc trạng thái từ API, không giữ bản sao trong store.
- Đã loại: cache trong redux kèm optimistic update — không reconcile được với webhook async.
- Chấp nhận: thêm một request khi mở trang đơn.
- Xem lại khi: p95 của endpoint đơn vượt 500ms, hoặc có websocket đẩy trạng thái.
```

Trường bắt buộc: `Ngày`, `Trạng thái`, `Bối cảnh`, `Quyết định`, `Đã loại`.
Trường tuỳ chọn: `Chấp nhận`, `Xem lại khi`, `Thay bởi`.

`Đã loại` là trường chống việc sáu tháng sau có người đề xuất lại đúng phương án đã bỏ.
`Xem lại khi` biến một quyết định cũ thành thứ tự báo hết hạn thay vì thành khảo cổ học; hỏi người dùng một câu nếu họ chưa nói, họ không trả lời thì ghi `-`.

Trạng thái chỉ có hai giá trị: `active` và `superseded by DEC-xxx`.
Không có vòng đời duyệt; một quyết định đã được nói ra là đã có hiệu lực.

## Mục nợ có chủ ý

```markdown
### DEBT-004 — Toast tự dựng thay vì dùng thư viện
- Ở: `src/components/Toast/`
- Trạng thái: open · từ 2026-03-11
- Vì sao chấp nhận: bản thư viện lúc đó xung đột với portal của modal, cần ship gấp.
- ĐỪNG: bắt chước sang chỗ khác · tự refactor giữa lúc làm task khác
- Trả nợ khi: nâng modal lên radix, gộp cả hai vào một portal root.
```

Trường bắt buộc: `Ở`, `Trạng thái`, `Vì sao chấp nhận`, `ĐỪNG`.
Trường tuỳ chọn: `Trả nợ khi`.

Trạng thái: `open` hoặc `paid · YYYY-MM-DD`.

`ĐỪNG` là trường vận hành thật sự đối với agent.
Thiếu nó thì agent gặp code xấu sẽ hoặc nhân bản nó vì tưởng đó là cách hệ thống làm, hoặc tự ý refactor giữa lúc làm việc khác.
Ghi cụ thể cấm gì, không ghi chung chung.

Kiểm tra đường dẫn trong `Ở` có tồn tại trước khi ghi.
Không tồn tại thì hỏi lại, đừng ghi một mục nợ trỏ vào hư không.

### Dòng đánh dấu tại code là bắt buộc

Mục nợ được cần **đúng lúc agent đang sửa file đó**, mà lúc đó nó không có lý do gì để mở `decisions.md`.

Nên mỗi mục nợ phải có hai nửa:

- **Ở code**: một dòng comment — `// DEBT-004: cố ý, xem docs/ai/architecture/decisions.md`
- **Ở sổ**: toàn bộ lý do

Bạn không tự sửa code.
Ghi xong mục nợ thì **in ra dòng comment cần thêm và đường dẫn cần thêm vào**, rồi nói rõ với người dùng rằng mục nợ chưa có hiệu lực thực tế cho tới khi dòng đó nằm trong code.

## Cấp id

Đọc bộ đếm ở dòng đầu `docs/ai/architecture/README.md`, cấp id, tăng bộ đếm ngay.
Hai chuỗi id độc lập: `DEC-` và `DEBT-`.
Id không bao giờ tái sử dụng.

## Sửa

**Không sửa nội dung mục đã ghi.** Trường duy nhất được đổi là `Trạng thái`.

- Quyết định đổi → ghi `DEC` mới, đổi `Trạng thái` mục cũ thành `superseded by DEC-xxx`, giữ nguyên toàn bộ nội dung cũ.
- Nợ đã trả → đổi `Trạng thái` sang `paid · <ngày>`, giữ nguyên phần còn lại, và nhắc người dùng xoá dòng comment ở code.
- Nợ đổi phạm vi → ghi `DEBT` mới, đổi `Trạng thái` mục cũ thành `paid` hoặc `superseded`, tuỳ điều gì đã thật sự xảy ra.

Cả ba trường hợp chỉ chạm vào trường `Trạng thái`.
Không sửa chính tả, không viết lại câu chữ, không "làm rõ" một mục đã ghi — sai chính tả trong lịch sử vô hại hơn một lịch sử bị biên tập.

## Index

Mỗi mục một dòng trong `docs/ai/architecture/README.md`:

```markdown
- DEC-007 · active · Trạng thái đơn giữ ở server, không cache ở FE
- DEC-003 · superseded by DEC-007 · Cache trạng thái đơn trong redux
- DEBT-004 · open · Toast tự dựng thay vì dùng thư viện
```

Cập nhật index trong cùng lượt với việc ghi mục, không để sang lượt sau.

## Mẫu README rỗng

```markdown
<!-- next: DEC-001 DEBT-001 -->

# Sổ kiến trúc

Index của mọi quyết định kiến trúc và nợ có chủ ý trong repo này.
Registrar giữ file này đồng bộ với `decisions.md`.

Ràng buộc phải tuân theo khi viết code **không** nằm ở đây — chúng nằm trong `CLAUDE.md` để tự nạp mỗi lượt.
Sổ này chỉ giữ thứ code không nói được: lý do, phương án đã loại, và chỗ xấu có chủ ý.

Mỗi dòng: `id · status · tóm tắt`.

## Mục

_(chưa có mục nào)_
```

# Quyết Định Kiến Trúc

Ghi đúng những gì code không bao giờ nói được: vì sao chọn thế này, đã loại phương án nào, và chỗ nào xấu có chủ ý.

Append-only: không sửa **nội dung** một mục đã ghi.
Trường duy nhất được đổi là `Trạng thái`; muốn đổi nội dung thì ghi mục mới rồi đánh dấu mục cũ `superseded`.

Bộ đếm id nằm ở `README.md`, không nằm trong file này.

Không ghi vào đây thứ đọc code là biết: thư viện đang dùng, version, cấu trúc thư mục, signature.
**Một mục không loại bỏ phương án nào thì không phải quyết định** — đó là sự thật, và sự thật nằm trong code.

## Quyết Định

Mẫu một mục:

```markdown
### DEC-001 — [Tiêu đề một dòng]
- Ngày: YYYY-MM-DD · Trạng thái: active
- Bối cảnh: [1-2 câu về tình huống lúc đó]
- Quyết định: [một câu]
- Đã loại: [phương án bị bỏ] — [vì sao bỏ]
- Chấp nhận: [tradeoff đã biết và chấp nhận]
- Xem lại khi: [điều kiện cụ thể khiến quyết định này nên được cân nhắc lại]
```

_(chưa có quyết định nào)_

## Nợ Có Chủ Ý

Mỗi mục nợ phải có một dòng đánh dấu ngay tại code, nếu không nó sẽ không bao giờ được đọc đúng lúc:

```
// DEBT-001: cố ý, xem docs/ai/architecture/decisions.md
```

Mẫu một mục:

```markdown
### DEBT-001 — [Tiêu đề một dòng]
- Ở: `path/to/code`
- Trạng thái: open · từ YYYY-MM-DD
- Vì sao chấp nhận: [lý do lúc đó]
- ĐỪNG: bắt chước sang chỗ khác · tự refactor giữa lúc làm task khác
- Trả nợ khi: [điều kiện cụ thể]
```

_(chưa có nợ nào được ghi)_

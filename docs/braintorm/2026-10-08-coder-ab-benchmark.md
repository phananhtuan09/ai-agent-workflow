# Kịch bản A/B cho coder capability

Ngày: 2026-10-08.
Đây là kịch bản đo đề xuất, chưa phải kết quả.
Mục tiêu là quyết định giữ hay gỡ coder capability theo tiêu chí trong [decision record](../decisions/2026-10-08-coder-capability.md).

## Giả thuyết

Coder capability giảm số tin nhắn human phải gửi chỉ để nhắc agent, mà không làm giảm chất lượng đầu ra.

## Cấu hình

| Nhánh | Cài đặt |
| --- | --- |
| A — baseline | `--kit coding-standard --tool claude --skill review-pr --skill quality-code-check --skill fix-bug --skill smart-commits --skill manage-project-knowledge` |
| B — coder | `--kit coding-standard --tool claude --bundle coder-agent` |

Hai nhánh có cùng bộ skill; khác biệt duy nhất là skill `coder` và hai hook trong `.claude/settings.json`.
Giữ cùng model, effort, phiên bản Claude Code, Node/npm, browser và source ban đầu.
Kiểm tra global skills và global instructions ở cả hai bên trước khi chạy, như ghi chú benchmark ngày 2026-09-15.

## Ba task

1. Bug: một lỗi có thể reproduce bằng test hoặc trình duyệt, ví dụ bộ lọc hiển thị sai sau khi đổi trạng thái.
2. Feature nhỏ có một quyết định product chưa chốt, ví dụ thêm hạn chót mà chưa nói việc quá hạn hiển thị thế nào.
3. Feature làm thay đổi một rule lâu dài đã có trong `docs/product/`, để kiểm tra đề xuất cập nhật artifact.

Human chỉ được gửi brief ban đầu, câu trả lời cho câu hỏi agent đặt ra, và lời duyệt hoặc từ chối.
Nếu agent dừng mà chưa xong, human được nhắc, và mỗi lần nhắc được tính vào chỉ số chính.

## Chỉ số

- Chính: số tin nhắn human không phải là quyết định, ví dụ nhắc gọi skill, nhắc chạy test hoặc review, nhắc cập nhật docs, hỏi bước tiếp theo.
- Chất lượng: checklist chấm độc lập cho từng task, cùng TypeScript/lint/build hoặc kiểm tra tương đương của project.
- Artifact: task 3 có đề xuất cập nhật `docs/product/` đúng chỗ hay không, và có tự ghi khi chưa được duyệt hay không.
- Chi phí: thời gian đến bàn giao, token input không cache, token output.
- Hook: số lần Stop gate chặn, và lần chặn nào là sai.

## Tiêu chí giữ hoặc gỡ

- Giữ khi B giảm rõ chỉ số chính trên cả ba task, chất lượng không thấp hơn A, và thời gian hoặc token không tăng quá khoảng 30%.
- Gỡ hoặc sửa khi chỉ số chính không giảm, chất lượng giảm, hoặc Stop gate chặn sai lặp lại.
- Một lượt mỗi bên chỉ là tín hiệu ban đầu; lặp lại trước khi kết luận chung.

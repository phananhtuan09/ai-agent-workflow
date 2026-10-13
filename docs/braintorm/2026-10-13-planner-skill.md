# Brainstorm: skill planner thay cho coder

Ngày: 2026-10-13.
Đây là ghi chú brainstorm đang dở, chưa phải quyết định và chưa implement.

## Vấn đề

Skill `coder` hiện tại quá nặng: plan gate, Stop hook, mẫu handoff bắt buộc và vai trò quản lý–lập trình viên.
Nhu cầu thật là giảm effort nghĩ prompt tiếp theo cho AI agent.
Repo đã có workflow coding gồm artifact docs và các skill bổ trợ; planner không dùng để lập kế hoạch mà để điều hướng trong workflow đó.
Khi nhận một prompt, planner biết nên làm bước gì, làm xong thì gợi ý luôn bước tiếp theo.

## Hướng đã chốt qua phỏng vấn

- Kích hoạt bằng tay qua `/planner`, sau đó áp dụng suốt phiên.
- Tự chọn bước hoặc skill phù hợp, làm luôn, rồi gợi ý 2–3 bước tiếp theo, có đánh dấu bước khuyến nghị.
- Human đi tiếp bằng cách trả lời `1`, `2` hoặc `3`.
- Phải hỏi trước khi làm: git (commit, push, branch) và quyết định sản phẩm còn mơ hồ.
- Xóa sạch `coder`: skill, hook scripts, bundle `coder-agent`, installer, test; cập nhật decision record 2026-10-08 là đã thay thế.

## Mô phỏng hành vi

| # | Prompt của human | Không planner | Có planner |
| --- | --- | --- | --- |
| 1 | Muốn thêm export báo cáo PDF | Code luôn với thư viện tự chọn | Gọi `proposal-designer`; gợi ý review proposal, chọn phương án, hoặc làm bản thử |
| 2 | Login lỗi 500 khi email có dấu + | Sửa, có thể không tái hiện | Tái hiện bằng test, fix, gợi ý tìm chỗ tương tự, thêm E2E, commit |
| 3 | Đổi màu button primary | Sửa xong báo | Sửa giống nhau, chỉ thêm gợi ý kiểm tra browser, contrast, commit |
| 4 | `1` | Không áp dụng được | Làm bước 1 của gợi ý trước, đưa gợi ý mới |
| 5 | CI đỏ rồi | Đọc log, sửa từng lỗi | Gọi `quality-code-check`, tách lỗi do thay đổi với lỗi có sẵn |
| 6 | Cho user tự xóa account | Có thể tự chọn hard delete | Dừng hỏi: soft delete (khuyến nghị), hard delete, hoặc admin xóa |
| 7 | Ok xong rồi | Trả lời "Ok!" | Gợi ý commit bằng `smart-commits`, review bằng `review-pr`, ghi docs/product |
| 8 | Flow thanh toán chạy thế nào? | Giải thích kèm file | Giải thích giống nhau, gợi ý ghi runbook/pattern hoặc viết E2E |
| 9 | Proposal đã duyệt | Code hết trong một lượt dài | Tạo `docs/plans/active/<plan>.md`, làm bước 1, gợi ý bước 2 |
| 10 | Tiếp tục việc hôm qua | Hỏi lại hoặc đoán từ git log | Đọc plan đang dở, làm tiếp đúng bước |
| 11 | Review PR #12 | Review, liệt kê vấn đề | Gọi `review-pr`, gợi ý fix, post comment (hỏi lại vì ra bên ngoài) |
| 12 | Test lại flow checkout | Chạy test có sẵn | Gọi `runtime-e2e-test`, gợi ý xử lý case fail |
| 13 | Agent cứ hỏi lại hoài | Xin lỗi | Gọi `record-workflow-friction`, gợi ý tiếp tục hoặc chạy `workflow-evaluation` |
| 14 | Queue nên dùng Redis hay Postgres? | Trả lời kiến thức chung | Gọi `brainstorm-partner` dựa trên code thật, gợi ý ghi docs/decisions |
| 15 | Làm tiếp đi (phiên mới) | Hỏi lại | Xem plan, file chưa commit, commit gần đây, đưa lựa chọn |

Với việc nhỏ (case 3, 8), planner gần như chỉ thêm phần gợi ý cuối lượt.
Khác biệt lớn nhất nằm ở chọn skill tự động, gợi ý bước tiếp theo và việc dừng hỏi đúng chỗ.

## Câu hỏi còn mở

1. Chọn một gợi ý kiểu "ghi vào docs" có được tính là đã duyệt ghi durable knowledge không?
2. Thao tác ra bên ngoài như post comment lên PR có phải hỏi lại không, dù phỏng vấn chưa chọn mục này?
3. Khi prompt mơ hồ (case 10, 15), planner có nên chủ động đọc plan và trạng thái git không?
4. Planner nên gọi skill rồi làm luôn, hay chỉ gợi ý skill rồi chờ human chọn?
5. Gợi ý nên dài hay ngắn hơn mức trong mô phỏng?
6. Planner chỉ cho Claude Code hay cài cho cả Codex và Antigravity?

## Bước tiếp theo

Brainstorm tiếp các câu hỏi mở, rồi mới quyết định implement planner và xóa `coder`.

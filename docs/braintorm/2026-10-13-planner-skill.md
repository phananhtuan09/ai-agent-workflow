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

## Chốt thêm ngày 2026-10-14

1. Chọn một gợi ý ghi docs được tính là đã duyệt khi gợi ý đó nêu đủ namespace, file đích và tóm tắt một dòng thay đổi.
   Lựa chọn đó là yêu cầu rõ ràng mà `manage-project-knowledge` cần; gợi ý chung chung kiểu "ghi docs" thì chưa tính.
2. Thao tác ra bên ngoài (post comment PR, tạo issue, gửi message, deploy) phải hỏi trước, giống git.
   Nếu human vừa chọn đúng gợi ý đó, ví dụ `2. Post comment lên PR`, thì lựa chọn đó là lời duyệt.
3. Khi prompt mơ hồ như "làm tiếp đi", planner chủ động đọc chỉ-đọc: `docs/plans/active/`, `git status`, vài commit gần nhất, rồi đưa lựa chọn.
   Chốt theo đề xuất, không hỏi riêng, vì chỉ đọc và đúng nguyên tắc inspect smallest relevant surface trong `docs/WORKFLOW.md`.
4. Planner gọi skill và làm luôn, kể cả skill tạo artifact như `proposal-designer` hay `runtime-e2e-test`.
   Chỉ dừng hỏi khi chạm git, thao tác ra bên ngoài, hoặc quyết định sản phẩm còn mơ hồ.
5. Gợi ý cuối lượt gồm 2–3 dòng, mỗi dòng không quá khoảng 15 từ: số, hành động, skill nếu có, và đánh dấu ★ cho bước khuyến nghị.
   Bỏ hẳn phần gợi ý khi không còn bước tiếp theo đáng làm.
6. Cài cho cả Claude Code, Codex và Antigravity.
   Planner chỉ là text, không cần hook; giữ mode qua lịch sử hội thoại bằng lượt bootstrap giống `brainstorm-partner`.

Phác thảo phần gợi ý:

```markdown
Tiếp theo:
1. ★ Thêm E2E cho login có email chứa dấu + (`runtime-e2e-test`)
2. Tìm chỗ khác encode email tương tự
3. Commit fix (`smart-commits`, sẽ hỏi trước khi push)
```

## Câu hỏi mới phát sinh

1. Giữ mode qua compaction: coder dùng SessionStart hook để tiêm lại contract, planner thì không.
   Phần gợi ý cuối mỗi lượt có thể đủ làm mốc, nhưng cần quan sát phiên dài thật trước khi kết luận.
2. Khi planner gọi `brainstorm-partner` (case 14), phiên chuyển sang chỉ-đọc; gợi ý phải luôn có một lựa chọn quay lại implement.
3. Human gõ `1` khi lượt trước không có gợi ý: xử lý như prompt thường hay hỏi lại?
4. Cách gọi tay trên Codex và Antigravity có thể không phải `/planner`; cần kiểm tra cú pháp từng runtime trước khi viết hướng dẫn.
5. Đo hiệu quả: kịch bản A/B của coder chưa chạy; có dùng lại [kịch bản đó](2026-10-08-coder-ab-benchmark.md) cho planner so với baseline không?
   `docs/WORKFLOW.md` yêu cầu có dùng lặp lại thật trước khi thêm skill mới.
6. Planner nằm trong bundle `core` hay bundle riêng, và có đặt `disable-model-invocation: true` để chỉ kích hoạt bằng tay không?

## Chốt khi viết bản v1 (2026-10-16)

- Gõ `/planner` chỉ bật mode, không tự đọc trạng thái repo.
- Bước tiếp theo dựa vào bản đồ workflow: biết việc đang ở chặng nào để gợi ý chặng kế.
- Prompt mơ hồ: tìm bằng chứng trong repo trước; đoán sai mà rẻ thì đoán, làm và ghi giả định; đoán sai mà đắt thì đưa các cách hiểu làm lựa chọn.
- Mặc định v1, chỉnh sau khi dùng thử:
  - không có dòng `Mục tiêu:`, chỉ ghi giả định khi thật sự đoán;
  - thứ tự ★: rủi ro, hoàn thành mục tiêu, đưa code ra ngoài, lưu kiến thức;
  - đổi UI nhìn thấy nhưng không đổi logic hay dữ liệu được tính là rẻ;
  - gõ số khi không có danh sách gợi ý được xử lý như prompt thường;
  - than phiền về agent chỉ được gợi ý `record-workflow-friction`, không tự ghi;
  - bundle riêng `planner-mode`, `disable-model-invocation: true`.

## Bước tiếp theo

Bản v1 nằm ở `skills/planner/SKILL.md`, `coder` đã bị gỡ, quyết định ghi ở [decision record](../decisions/2026-10-16-planner-capability.md).
Dùng thử trên phiên thật, đếm số lần human chọn ★, chọn lựa chọn khác, hoặc tự gõ yêu cầu khác, rồi chỉnh các mặc định.

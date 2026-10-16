# Giả lập output của skill planner

Ngày: 2026-10-16.
Đây là bản giả lập để kiểm tra intent, chưa phải hành vi thật và chưa implement.
Hướng chốt nằm trong [brainstorm planner](2026-10-13-planner-skill.md).

## Bối cảnh giả định

Project mẫu `shop-web`: Next.js, Prisma, Postgres, Stripe, test bằng Vitest và Playwright.
Repo đã cài workflow này: có `docs/product/`, `docs/decisions/`, `docs/plans/active/` và các skill bổ trợ.
Human đang ở branch `feature/login-fix` và gõ `/planner` ở đầu phiên.
Một số case nối tiếp nhau (ghi rõ "tiếp case N") để thấy luồng trả lời bằng số.

Ký hiệu trong mỗi case:

- **Agent làm**: hành động thật phía sau, human không thấy chi tiết này.
- **Output**: đúng nội dung agent trả lời trong chat.
- **Soi intent**: điểm bạn nên kiểm tra xem có đúng ý mình không.

## Tổng quan

| # | Human gõ | Planner làm | Dừng hỏi? |
| --- | --- | --- | --- |
| 1 | `/planner` | Bật mode, đọc trạng thái repo | Không |
| 2 | Muốn thêm export báo cáo PDF | `proposal-designer` viết đề xuất | Không, quyết định nằm trong gợi ý |
| 3 | `1` (tiếp case 2) | Chốt phương án, tạo plan, làm bước 1 | Không |
| 4 | Login lỗi 500 khi email có dấu + | Tái hiện bằng test, sửa, chứng minh | Không |
| 5 | Đổi màu button primary | Sửa token, kiểm tra contrast | Không |
| 6 | CI đỏ rồi | `quality-code-check`, tách lỗi mới và lỗi sẵn có | Không |
| 7 | Cho user tự xóa account | Không code | Có, quyết định sản phẩm |
| 8 | `1, đơn cũ giữ ẩn danh` (tiếp case 7) | Implement soft delete | Không |
| 9 | `1` (tiếp case 8) | `manage-project-knowledge` ghi rule | Không, lựa chọn là lời duyệt |
| 10 | Đổi giới hạn avatar 2MB lên 5MB | Làm theo request, đề xuất sửa docs cũ | Không |
| 11 | Flow thanh toán chạy thế nào? | Giải thích kèm file | Không |
| 12 | ghi lại vào docs đi (tiếp case 11) | Không ghi | Có, đích chưa cụ thể |
| 13 | Thêm skeleton cho trang đơn hàng | Làm việc mới, bỏ gợi ý cũ | Không |
| 14 | Ok xong rồi | Tóm tắt phiên, gợi ý | Không |
| 15 | commit đi | `smart-commits`, không push | Không, human đã yêu cầu |
| 16 | Làm tiếp đi (phiên mới) | Đọc plan, git, đưa lựa chọn | Có, chờ chọn |
| 17 | Review PR #12 | `review-pr` | Không |
| 18 | `2` (tiếp case 17) | Post comment lên PR | Không, lựa chọn là lời duyệt |
| 19 | Test lại flow checkout | `runtime-e2e-test` viết plan test | Có, skill yêu cầu duyệt plan |
| 20 | Queue nên dùng Redis hay Postgres? | `brainstorm-partner`, chỉ đọc | Không |
| 21 | Agent cứ hỏi lại hoài | `record-workflow-friction` | Không |

## Các case

### Case 1 — Kích hoạt planner

Human: `/planner`

Agent làm:

- Đọc `docs/plans/active/`, `git status`, 3 commit gần nhất (chỉ đọc).

Output:

```text
Planner đã bật cho phiên này.
Mình tự chọn bước hoặc skill phù hợp, làm luôn, rồi gợi ý 2–3 bước tiếp theo; bạn trả lời bằng số để đi tiếp.
Mình sẽ hỏi trước khi đụng git, thao tác ra bên ngoài, hoặc khi quyết định sản phẩm chưa rõ.

Trạng thái repo:
- Branch `feature/login-fix`, không có plan đang dở.
- 1 file chưa commit: `src/lib/api/auth.ts`.

Tiếp theo:
1. ★ Xem thay đổi chưa commit trong `auth.ts`
2. Bắt đầu việc mới: gõ yêu cầu
```

Soi intent: lượt bật mode có nên tự đọc trạng thái repo không, hay chỉ tuyên bố mode rồi chờ?

### Case 2 — Feature còn mơ hồ

Human: `Muốn thêm export báo cáo PDF`

Agent làm:

- Gọi `proposal-designer`, đọc `docs/product/reports.md` và `src/app/reports/`.
- Tạo `docs/proposals/export-bao-cao-pdf/proposal.md` ở trạng thái Draft; không sửa code.

Output:

```text
Mình đã viết đề xuất bằng `proposal-designer`: `docs/proposals/export-bao-cao-pdf/proposal.md` (Draft).
Chưa sửa code.

- A. Server render trang báo cáo sẵn có thành PDF bằng Playwright: giống UI, tốn tài nguyên server.
- B. Client dựng PDF bằng `@react-pdf/renderer`: nhẹ server, phải dựng lại layout.
- Còn mở: báo cáo trên 1.000 dòng thì chia trang hay gửi file qua email.

Tiếp theo:
1. ★ Duyệt phương án A, chia trang cho báo cáo lớn
2. Duyệt phương án B, chia trang cho báo cáo lớn
3. Sửa đề xuất trước khi duyệt
```

Soi intent: quyết định sản phẩm được đưa thẳng vào gợi ý thay vì một câu hỏi riêng; chọn `1` là duyệt luôn.

### Case 3 — Trả lời bằng số (tiếp case 2)

Human: `1`

Agent làm:

- `proposal-designer` đánh dấu đề xuất Approved với phương án A.
- Việc có 4 bước và có thể kéo qua nhiều phiên nên tạo `docs/plans/active/export-pdf.md`.
- Làm bước 1: route `GET /api/reports/revenue/pdf`, thêm test, chạy `npm run test -- reports` và `npm run typecheck`.

Output:

```text
Đã duyệt phương án A và tạo plan `docs/plans/active/export-pdf.md` (4 bước).

Bước 1 xong: `GET /api/reports/revenue/pdf` trả file PDF của báo cáo doanh thu.
- Bằng chứng: test `revenue pdf returns application/pdf` pass; `npm run typecheck` pass.
- Chưa kiểm tra: bố cục PDF bằng mắt.

Tiếp theo:
1. ★ Làm bước 2: nút "Tải PDF" trên trang báo cáo
2. Mở PDF mẫu để bạn xem bố cục
3. Commit bước 1 (`smart-commits`)
```

Soi intent: planner làm đúng một bước của plan rồi dừng gợi ý, không chạy hết 4 bước trong một lượt.

### Case 4 — Bug có thể tái hiện

Human: `Login lỗi 500 khi email có dấu +`

Agent làm:

- Viết test `login accepts plus-sign email`, chạy thấy fail với status 500.
- Sửa `src/lib/api/auth.ts` (encode email) và `src/app/api/login/route.ts` (trả 401 khi không có user).
- Chạy lại test, `npm run typecheck`, `npm run lint`.

Output:

```text
Đã sửa lỗi login 500 với email có dấu +.

- Nguyên nhân: `src/lib/api/auth.ts` ghép email vào query mà không encode, `+` thành dấu cách, server gặp user `null`.
- Sửa: encode email phía client; server trả 401 thay vì crash khi không tìm thấy user.
- Bằng chứng: test mới fail trước khi sửa, pass sau khi sửa; typecheck và lint pass.

Tiếp theo:
1. ★ Tìm chỗ khác ghép email vào URL chưa encode
2. Thêm E2E login với email có dấu + (`runtime-e2e-test`)
3. Commit fix (`smart-commits`)
```

Soi intent: không dùng skill nào cho bug, chỉ tái hiện trước khi sửa theo `docs/WORKFLOW.md`.

### Case 5 — Việc nhỏ

Human: `Đổi màu button primary sang #2563EB`

Agent làm:

- Sửa `--color-primary` trong `src/styles/tokens.css`, tính contrast chữ trắng trên nền mới.

Output:

```text
Đã đổi `--color-primary` sang `#2563EB` trong `src/styles/tokens.css`; mọi button primary dùng token này.
Contrast chữ trắng trên nền mới là 5.2:1, đạt WCAG AA.

Tiếp theo:
1. ★ Mở trang chủ trên browser để xem màu mới
2. Commit thay đổi (`smart-commits`)
```

Soi intent: với việc nhỏ, phần khác biệt duy nhất so với không có planner là 2 dòng gợi ý cuối.

### Case 6 — CI đỏ

Human: `CI đỏ rồi`

Agent làm:

- Gọi `quality-code-check`, đọc log CI của commit mới nhất, chạy lại lint, typecheck, test ở local.
- So với kết quả CI gần nhất trên `main` để tách lỗi.
- Sửa 2 lỗi do thay đổi của branch, không sửa lỗi có sẵn.

Output:

```text
CI có 3 lỗi; mình đã dùng `quality-code-check` để tách nguồn gốc.

- Đã sửa 2 lỗi do branch này: type sai ở `LoginForm.tsx`, import thừa ở `auth.ts`. Local lint và typecheck pass.
- Không sửa: test `formatDate` fail cả trên `main` (lệch timezone), không liên quan thay đổi này.

Tiếp theo:
1. ★ Push để CI chạy lại
2. Sửa test `formatDate` trong một thay đổi riêng
3. Xem chi tiết lỗi `formatDate`
```

Soi intent: `1` là push, tức thao tác git; chọn `1` được tính là human đã yêu cầu push.

### Case 7 — Quyết định sản phẩm còn mơ hồ

Human: `Cho user tự xóa account`

Agent làm:

- Đọc `docs/product/`, thấy chưa có rule xóa account; đọc schema `User` và `Order`.
- Không sửa file nào.

Output:

```text
Việc này còn quyết định sản phẩm chưa chốt nên mình dừng trước khi code.
`docs/product/` chưa có rule về xóa account, và báo cáo doanh thu đang đọc bảng `orders` gắn với user.

Chọn cách xóa:
1. ★ Soft delete: ẩn ngay, xóa thật sau 30 ngày, user khôi phục được
2. Hard delete: xóa ngay toàn bộ, không khôi phục
3. User gửi yêu cầu, admin duyệt rồi xóa

Thêm một câu: đơn hàng cũ giữ lại ẩn danh hay xóa theo? Mình khuyến nghị giữ ẩn danh.
```

Soi intent: gợi ý lúc này là câu hỏi quyết định, không phải bước tiếp theo; con số 30 ngày là đề xuất để human chọn chứ không phải policy agent tự đặt.

### Case 8 — Trả lời quyết định (tiếp case 7)

Human: `1, đơn cũ giữ ẩn danh`

Agent làm:

- Thêm cột `deletedAt` và migration, endpoint `DELETE /api/account`, nút xóa có hộp xác nhận ở trang Settings, job xóa thật sau 30 ngày.
- Chạy migration trên DB local, test unit cho endpoint và job, typecheck, lint.

Output:

```text
Đã làm soft delete account.

- User bấm "Xóa account" ở Settings, xác nhận, bị đăng xuất; đăng nhập lại trong 30 ngày sẽ khôi phục.
- Sau 30 ngày, job xóa dữ liệu cá nhân; đơn hàng cũ giữ lại với tên "Người dùng đã xóa".
- Bằng chứng: 6 test mới pass; migration chạy được trên DB local; typecheck và lint pass.
- Chưa kiểm tra: job chạy theo lịch thật trên staging.

Tiếp theo:
1. ★ Ghi rule vào `docs/product/account.md`: soft delete 30 ngày, đơn cũ ẩn danh
2. Thêm E2E cho flow xóa và khôi phục (`runtime-e2e-test`)
3. Commit (`smart-commits`)
```

Soi intent: gợi ý ghi docs nêu đủ namespace, file và nội dung, nên đủ điều kiện để chọn số là duyệt.

### Case 9 — Chọn gợi ý ghi docs (tiếp case 8)

Human: `1`

Agent làm:

- Gọi `manage-project-knowledge`, đọc `docs/product/README.md`, tạo `docs/product/account.md` theo contract của namespace.

Output:

```text
Đã ghi rule xóa account vào `docs/product/account.md` bằng `manage-project-knowledge`:
soft delete, khôi phục trong 30 ngày, sau đó xóa dữ liệu cá nhân, đơn hàng cũ giữ ẩn danh.

Tiếp theo:
1. ★ Commit code và docs thành 2 commit (`smart-commits`)
2. Review toàn bộ diff trước khi commit (`review-pr`)
```

Soi intent: không có bước hỏi xác nhận thêm sau khi human chọn `1`.

### Case 10 — Request đi ngược docs hiện có

Human: `Đổi giới hạn upload avatar từ 2MB lên 5MB`

Agent làm:

- Thấy `docs/product/profile.md` ghi giới hạn 2MB; request nói rõ thay đổi nên request là authority cho phần thay đổi này.
- Sửa validate trong `src/lib/upload.ts` và `bodySizeLimit` trong `next.config.js`, cập nhật test.

Output:

```text
Đã nâng giới hạn avatar lên 5MB ở cả validate phía client (`src/lib/upload.ts`) và giới hạn body của server (`next.config.js`).
Test upload 4.9MB pass, 5.1MB bị từ chối với thông báo mới.

`docs/product/profile.md` vẫn ghi 2MB nên giờ đã cũ.

Tiếp theo:
1. ★ Sửa `docs/product/profile.md`: giới hạn avatar 2MB thành 5MB
2. Commit (`smart-commits`)
```

Soi intent: planner không dừng hỏi vì request đã rõ, nhưng không tự sửa docs mà đưa vào gợi ý.

### Case 11 — Câu hỏi chỉ đọc

Human: `Flow thanh toán chạy thế nào?`

Agent làm:

- Đọc `src/app/checkout/`, `src/app/api/stripe/webhook/route.ts`, `src/lib/orders.ts`.

Output:

```text
Flow thanh toán có 3 chặng:

1. `src/app/checkout/actions.ts` tạo order trạng thái `pending` rồi tạo Stripe Checkout Session.
2. User trả tiền trên trang Stripe, được chuyển về `/checkout/success` (trang này chỉ hiển thị, không đổi trạng thái).
3. `src/app/api/stripe/webhook/route.ts` nhận `checkout.session.completed`, kiểm tra chữ ký, gọi `markOrderPaid` trong `src/lib/orders.ts`.
   Hàm này bỏ qua event đã xử lý, nên Stripe gửi lại cũng không trừ kho hai lần.

Tiếp theo:
1. ★ Thêm E2E cho thanh toán thành công và thất bại (`runtime-e2e-test`)
2. Ghi cách xử lý webhook vào `docs/patterns/stripe-webhook.md`
```

Soi intent: câu trả lời giống không có planner; chỉ thêm gợi ý.

### Case 12 — Yêu cầu ghi docs chung chung (tiếp case 11)

Human: `ghi lại vào docs đi`

Agent làm:

- Không ghi file; có hai đích hợp lý với ý nghĩa khác nhau.

Output:

```text
"Docs" có vài chỗ với ý nghĩa khác nhau, bạn chọn đích trước khi mình ghi:

1. ★ `docs/patterns/stripe-webhook.md`: cách kiểm tra chữ ký và xử lý event trùng
2. `docs/runbooks/stripe-webhook-retry.md`: các bước khi webhook lỗi (chỉ ghi nếu bạn đã làm thật)
3. Không ghi, giữ trong hội thoại
```

Soi intent: yêu cầu chung chung không được tính là duyệt; planner biến nó thành lựa chọn cụ thể.

### Case 13 — Human bỏ qua gợi ý và gõ việc mới

Human: `Thêm loading skeleton cho trang danh sách đơn hàng`

Agent làm:

- Thêm `src/app/orders/loading.tsx` dùng component `Skeleton` có sẵn, chạy typecheck.

Output:

```text
Đã thêm `src/app/orders/loading.tsx`: hiện 5 dòng skeleton trong lúc tải danh sách đơn hàng, dùng lại `Skeleton` có sẵn.
Typecheck pass.

Tiếp theo:
1. ★ Mở trang đơn hàng trên browser, giả lập mạng chậm để xem
2. Commit thay đổi (`smart-commits`)
```

Soi intent: gợi ý cũ bị bỏ, không nhắc lại; nếu bạn muốn planner nhắc việc còn dở thì cần nói rõ.

### Case 14 — Báo xong

Human: `Ok xong rồi`

Agent làm:

- Đọc `git status`; không làm gì thêm.

Output:

```text
Phiên này đã có: fix login với email có dấu +, đổi màu button primary, skeleton trang đơn hàng.
Còn 5 file chưa commit trên `feature/login-fix`.

Tiếp theo:
1. ★ Commit thành 3 commit theo từng việc (`smart-commits`)
2. Review diff trước khi commit (`review-pr`)
```

Soi intent: không gợi ý ghi docs vì cả 3 việc không đổi rule lâu dài.

### Case 15 — Human yêu cầu commit

Human: `commit đi`

Agent làm:

- Gọi `smart-commits`, chia thành 3 commit, chạy kiểm tra trước khi commit; không push.

Output:

```text
Đã tạo 3 commit trên `feature/login-fix` bằng `smart-commits`:
- `fix(auth): encode plus-sign emails in login request`
- `style(button): use #2563EB for primary color`
- `feat(orders): show loading skeleton`
Chưa push.

Tiếp theo:
1. ★ Push lên `origin/feature/login-fix`
2. Push và tạo PR vào `main`
```

Soi intent: "commit đi" chỉ được tính cho commit; push vẫn là lựa chọn riêng.

### Case 16 — Phiên mới, prompt mơ hồ

Human: `làm tiếp đi`

Agent làm:

- Đọc `docs/plans/active/export-pdf.md`, `git status`, 3 commit gần nhất; không sửa file nào.

Output:

```text
Mình đọc lại trạng thái:
- Plan `docs/plans/active/export-pdf.md`: bước 1/4 xong, bước 2 (nút "Tải PDF") chưa làm.
- Working tree sạch; commit gần nhất `feat(reports): render revenue report to PDF`.

Tiếp theo:
1. ★ Làm bước 2: nút "Tải PDF" trên trang báo cáo
2. Chạy lại test bước 1 trước khi làm tiếp
3. Việc khác: gõ yêu cầu
```

Soi intent: dù chỉ có một plan đang dở, planner vẫn chờ chọn thay vì làm luôn bước 2.

### Case 17 — Review PR

Human: `Review PR #12`

Agent làm:

- Gọi `review-pr`, đọc diff và các rule liên quan; không sửa code, không post gì.

Output:

```text
Mình đã review PR #12 (thêm mã giảm giá) bằng `review-pr`. Có 2 lỗi chặn merge:

1. `src/lib/coupon.ts:42`: mã hết hạn vẫn áp dụng vì so sánh ngày theo giờ local, lệch với `expiresAt` lưu UTC.
2. `src/app/api/coupon/route.ts:18`: không giới hạn số lần thử mã, dò được mã hợp lệ.

Tiếp theo:
1. ★ Sửa 2 lỗi trên branch của PR ở local
2. Post 2 lỗi thành comment lên PR #12
```

Soi intent: post comment là thao tác ra bên ngoài nên chỉ nằm trong gợi ý.

### Case 18 — Chọn thao tác ra bên ngoài (tiếp case 17)

Human: `2`

Agent làm:

- Post 2 inline comment lên PR #12.

Output:

```text
Đã post 2 comment lên PR #12, tại `coupon.ts:42` và `route.ts:18`.

Tiếp theo:
1. ★ Sửa 2 lỗi ở local sau khi tác giả đồng ý
2. Chờ tác giả trả lời, mình xem lại khi bạn gọi
```

Soi intent: không hỏi xác nhận lần nữa vì human vừa chọn đúng thao tác đó.

### Case 19 — Test lại flow có nhiều case

Human: `Test lại flow checkout`

Agent làm:

- Gọi `runtime-e2e-test`, đọc `docs/testing/README.md`, viết plan `docs/testing/active/checkout.md` với 5 case và script Playwright.
- Chưa chạy, vì skill yêu cầu human duyệt plan trước khi chạy flow có thay đổi dữ liệu.

Output:

```text
Mình đã soạn plan E2E bằng `runtime-e2e-test`: `docs/testing/active/checkout.md`, 5 case:
thanh toán thành công, thẻ bị từ chối, giỏ trống, mã giảm giá hết hạn, user chưa đăng nhập.
Chưa chạy: skill cần bạn duyệt plan trước.

Tiếp theo:
1. ★ Duyệt plan và chạy cả 5 case
2. Sửa plan trước: gõ case muốn thêm hoặc bỏ
```

Soi intent: skill tự có điểm dừng; planner tôn trọng điểm dừng đó và biến lời duyệt thành một lựa chọn số.

### Case 20 — Câu hỏi kỹ thuật cần cân nhắc

Human: `Queue nên dùng Redis hay Postgres?`

Agent làm:

- Gọi `brainstorm-partner` (chỉ đọc), đọc `docker-compose.yml`, `src/jobs/`, đếm job hiện có.

Output:

```text
Mình dùng `brainstorm-partner` (chỉ đọc) và xem code hiện tại.

- Đã có: Postgres; chưa có Redis; 3 loại job (gửi email, xóa account, đồng bộ kho), ước chừng vài trăm job mỗi giờ.
- Postgres với `pg-boss`: không thêm hạ tầng, job nằm cùng transaction với order. Hợp mức tải này.
- Redis với BullMQ: nhanh hơn và có dashboard, nhưng thêm một service phải vận hành và backup.
- Khuyến nghị: Postgres với `pg-boss`, xem lại khi vượt khoảng vài chục nghìn job mỗi giờ.

Tiếp theo:
1. ★ Ghi quyết định vào `docs/decisions/2026-10-16-job-queue.md`: dùng pg-boss
2. Thoát chế độ chỉ đọc, làm thử pg-boss cho job gửi email
3. So sánh thêm chi phí vận hành Redis
```

Soi intent: luôn có một lựa chọn thoát khỏi chế độ chỉ đọc của `brainstorm-partner`.

### Case 21 — Human bực vì agent

Human: `Agent cứ hỏi lại hoài`

Agent làm:

- Gọi `record-workflow-friction`, ghi `docs/evaluation/observations/2026-10-16-planner-repeated-questions.md` kèm bằng chứng từ phiên.

Output:

```text
Mình đã ghi lại vấn đề bằng `record-workflow-friction`: `docs/evaluation/observations/2026-10-16-planner-repeated-questions.md`.
Bằng chứng: case 12 hỏi lại đích ghi docs, case 16 hỏi lại thay vì làm tiếp plan.

Tiếp theo:
1. ★ Quay lại việc đang làm: bước 2 của plan export PDF
2. Phân tích các ghi nhận friction (`workflow-evaluation`)
```

Soi intent: `record-workflow-friction` hiện chỉ dùng khi human yêu cầu ghi; câu than phiền này có được tính là yêu cầu ghi không?

## Hành vi giả định cần bạn xác nhận

Các điểm dưới đây chưa được chốt trong brainstorm; bản giả lập đang chọn một cách.

1. Lượt bật `/planner` tự đọc trạng thái repo và gợi ý ngay (case 1).
2. Quyết định sản phẩm có thể nằm luôn trong danh sách gợi ý, chọn số là duyệt (case 2, 7).
3. Phiên mới có một plan đang dở vẫn chờ human chọn, không tự làm tiếp (case 16).
4. Gợi ý cũ bị bỏ khi human gõ việc mới, không nhắc lại việc còn dở (case 13).
5. Câu than phiền được tính là yêu cầu ghi friction (case 21).
6. Phần output chính không có mẫu cố định; chỉ phần `Tiếp theo:` có định dạng cố định.

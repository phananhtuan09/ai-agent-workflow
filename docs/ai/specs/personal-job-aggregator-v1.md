---
phase: spec
title: Personal Job Aggregator V1
description: Tool cá nhân tự động thu thập, lọc và xếp hạng job tại Việt Nam từ các nguồn dễ crawl, ưu tiên Telegram alert và dashboard tối giản
---

## Tier
Standard

## Problem
Việc tìm job hiện tại phụ thuộc vào thao tác thủ công trên nhiều trang tuyển dụng, tốn thời gian và dễ bỏ sót job phù hợp. Người dùng cần một tool cá nhân tự động gom nguồn, lọc đúng target và đẩy ra output dễ theo dõi hằng ngày.

## Scope
- V1 là tool cá nhân cho thị trường Việt Nam, không phải sản phẩm public nhiều người dùng.
- Thu thập job từ các nguồn ưu tiên dễ crawl: `VietnamWorks`, `ITviec`, `TopDev`.
- Chuẩn hóa dữ liệu job về một định dạng chung để lọc, khử trùng lặp và chấm điểm.
- Cho phép cấu hình target profile để lọc cứng và xếp hạng job theo mức độ phù hợp.
- Output chính là `Telegram`; output phụ là dashboard tối giản để xem lại và quản lý trạng thái job.
- Chỉ xử lý luồng tìm và review job; chưa bao gồm nộp hồ sơ tự động.

## Assumption Check
### Confirmed
- Người dùng muốn làm tool tự động tìm job thay cho việc vào từng trang tuyển dụng thủ công.
- Thị trường mục tiêu là Việt Nam.
- Hướng techstack cho v1 là `Python monolith` với backend, collector và database chung.
- Output mong muốn gồm `Telegram` và một dashboard nhỏ.

### Inferred But Safe
- V1 phục vụ một người dùng hoặc một nhóm rất nhỏ dùng chung cùng một target profile.
- Job target thiên về nhóm `tech/IT`, vì hai trong ba nguồn ưu tiên là `ITviec` và `TopDev`.
- Người dùng cần cả `digest` định kỳ lẫn khả năng xem lại lịch sử job đã tìm được.

### Needs Confirmation
- Bộ target profile mặc định đầu tiên gồm chính xác title, skill, location, seniority và salary nào.
- Tần suất crawl và tần suất gửi digest mong muốn theo giờ làm việc thực tế của người dùng.
- Dashboard có cần hỗ trợ nhiều profile tìm việc song song ngay trong v1 hay không.

### Chosen To Keep Scope Small
- V1 chỉ tích hợp `VietnamWorks`, `ITviec`, `TopDev`; chưa thêm `CareerViet`, `TopCV`, `Glints`.
- Mỗi job chỉ có một điểm phù hợp tổng hợp; không giải thích scoring quá chi tiết bằng AI trong v1.
- Dashboard chỉ là giao diện review tối giản; không có ứng dụng mobile, browser extension hay email workflow.
- Không có `auto-apply`, không đăng nhập thay người dùng và không cố vượt anti-bot bằng browser-first automation.

## Key Behavioral Rules
- Mỗi nguồn có collector riêng; hệ thống không giả định một bộ parser chung cho mọi site.
- Luồng thu thập ưu tiên lấy danh sách job trước, chỉ lấy chi tiết sâu khi job là mới hoặc vượt qua điều kiện lọc cứng.
- Job phải đi qua hai tầng xử lý: `hard filters` trước, `ranking` sau.
- Hard filters phải hỗ trợ tối thiểu title include/exclude, location, remote mode, seniority, salary floor, source whitelist và company blacklist.
- Ranking phải dựa tối thiểu trên title match, skill match, location/work-mode match, seniority match, salary match và độ mới của job.
- Mọi job tìm được phải được lưu lại để tránh gửi lặp và để dashboard xem lại lịch sử.
- Output Telegram chỉ gửi các job đạt ngưỡng phù hợp hoặc nằm trong digest; dashboard giữ toàn bộ tập job sau chuẩn hóa.
- Khi một nguồn trả về lỗi chặn truy cập, hệ thống phải giảm tần suất thử lại thay vì tiếp tục bắn request dồn dập.

## Agent Constraints Chosen For This Slice
- Chỉ hỗ trợ một target profile hoạt động tại một thời điểm để giữ logic lọc và output đơn giản.
- Chỉ coi các nguồn ưu tiên là nguồn `HTTP-first`; nếu một nguồn đòi hỏi browser automation để vận hành ổn định thì sẽ bị loại khỏi v1.
- Telegram là output chính cho phát hiện job mới; dashboard chỉ cần đủ để review, lưu trạng thái và tra cứu lại.

## Technical Approach
- Dùng mô hình `collector -> normalize -> dedupe -> hard filter -> rank -> notify`.
- Mỗi nguồn được đóng gói thành connector độc lập để dễ thay đổi chiến lược crawl khi site đổi cấu trúc.
- Hệ thống lưu dữ liệu job đã chuẩn hóa, lịch sử nhìn thấy và trạng thái xử lý để tránh gửi trùng và hỗ trợ review sau này.
- Bộ lọc và bộ chấm điểm được cấu hình từ target profile thay vì hard-code vào từng nguồn.
- Dashboard đọc cùng dữ liệu đã chuẩn hóa với Telegram để đảm bảo một nguồn sự thật duy nhất.

## Architecture / Pattern Notes
- V1 nên ưu tiên `HTTP/XML/HTML fetch` và parsing đơn giản; browser automation chỉ là hướng nghiên cứu cho giai đoạn sau.
- Search và lọc cần bám vào dữ liệu chuẩn hóa, không phụ thuộc trực tiếp vào raw HTML của từng nguồn.
- Anti-bot là ràng buộc sản phẩm thực tế, nên cadence crawl, backoff và request budget là một phần hành vi của hệ thống chứ không chỉ là chi tiết hạ tầng.

## Acceptance Criteria
### Thu thập và chuẩn hóa
- [ ] AC1: Hệ thống có thể thu thập job từ `VietnamWorks`, `ITviec` và `TopDev` theo lịch định kỳ mà không cần thao tác thủ công mỗi lần chạy.
- [ ] AC2: Mỗi job thu thập được được chuẩn hóa tối thiểu thành title, company, source, URL, location, work mode, seniority, salary, posted time và mô tả ngắn hoặc phần text đủ để lọc.
- [ ] AC3: Hệ thống không tạo job trùng khi cùng một job được thấy lại trong các lần crawl sau hoặc xuất hiện lại từ cùng một nguồn.

### Lọc và xếp hạng
- [ ] AC4: Người dùng có thể cấu hình một target profile với các hard filters tối thiểu: title include/exclude, skill include/exclude, location, work mode, seniority, salary floor, source whitelist và company blacklist.
- [ ] AC5: Chỉ các job vượt qua hard filters mới được đưa vào bước chấm điểm phù hợp.
- [ ] AC6: Mỗi job vượt qua hard filters có một điểm phù hợp tổng hợp và một danh sách lý do match ngắn, dễ hiểu cho người dùng.

### Output và review
- [ ] AC7: Hệ thống có thể gửi `Telegram` digest hoặc alert cho các job mới đạt ngưỡng phù hợp, kèm tối thiểu title, company, location, salary/work mode, score, lý do match và link gốc.
- [ ] AC8: Dashboard hiển thị danh sách job đã chuẩn hóa và hỗ trợ lọc/sắp xếp tối thiểu theo source, title, location, work mode, score và thời gian đăng.
- [ ] AC9: Từ dashboard hoặc output review, người dùng có thể gắn trạng thái tối thiểu `new`, `saved`, `dismissed`, `applied`.

### Độ bền vận hành
- [ ] AC10: Khi một nguồn trả về lỗi truy cập như `403`, `429` hoặc lỗi tạm thời, hệ thống tự giảm tần suất thử lại thay vì tiếp tục crawl dồn dập.
- [ ] AC11: Nếu một nguồn tạm thời lỗi, các nguồn còn lại vẫn tiếp tục chạy và output vẫn được tạo từ dữ liệu hợp lệ còn lại.

## Edge Cases / Failure States
- Một nguồn đổi layout hoặc tạm thời chặn truy cập: hệ thống đánh dấu lỗi nguồn đó, giảm tần suất crawl và không làm hỏng pipeline chung.
- Job thiếu salary hoặc seniority rõ ràng: job vẫn có thể được lưu và xuất hiện nếu các tín hiệu còn lại đủ mạnh, nhưng phải phản ánh thiếu dữ liệu trong output.
- Một job match nhiều keyword nhưng thuộc company blacklist: job bị loại ở hard filter và không được chấm điểm.
- Cùng một job được crawl lại nhiều lần trong ngày: hệ thống cập nhật trạng thái nhìn thấy gần nhất nhưng không gửi Telegram trùng.
- Không có job nào đạt ngưỡng: Telegram gửi digest rỗng có chủ đích hoặc không gửi, miễn hành vi đó nhất quán theo cấu hình.

## Out of Scope
- `CareerViet`, `TopCV`, `Glints` và các nguồn khó anti-bot khác.
- Auto-apply, tự điền form, tự đăng nhập, tự nộp CV.
- Giải thích match bằng LLM, semantic search theo CV, hoặc vector ranking nâng cao.
- Mobile app, browser extension, public multi-tenant product.
- Bộ phân tích thị trường job, thống kê xu hướng lương hoặc insight BI.

## Open Questions
- Tần suất gửi output nên mặc định là alert realtime cho job điểm cao, digest theo khung giờ, hay kết hợp cả hai.
- Mức ngưỡng score mặc định để gửi Telegram nên do người dùng nhập hay có preset ban đầu.
- V1 có cần cho phép sửa target profile trực tiếp trên dashboard hay chỉ qua cấu hình hệ thống.

## Decision Log
- Chốt slice đầu tiên là tool cá nhân cho Việt Nam, không mở rộng thành sản phẩm nhiều người dùng.
- Chốt nguồn v1 là `VietnamWorks`, `ITviec`, `TopDev` vì cân bằng tốt nhất giữa độ phủ và độ bền crawl.
- Chốt output chính là `Telegram`, còn dashboard giữ vai trò review và quản lý trạng thái.
- Chốt nguyên tắc `HTTP-first`, tránh phụ thuộc browser automation trong v1.

# Ghi chú thảo luận và thử nghiệm A/B workflow

Ngày: 2026-09-15.
Đây là ghi chú phiên làm việc theo yêu cầu của người dùng, không phải quy tắc sản phẩm hoặc quyết định kiến trúc.
Các kết luận dưới đây chỉ áp dụng cho những lượt chạy đã quan sát.

## Mục tiêu và phạm vi đã thống nhất

Đánh giá giá trị của workflow bằng cách giao cùng một task cho hai project mới: một có workflow, một không có workflow cục bộ.
Đo kết quả sản phẩm, thời gian, token, mức can thiệp của người dùng và chất lượng kiểm chứng.
Không chấm cao chỉ vì agent tạo nhiều tài liệu hoặc thực hiện nhiều bước.

Ban đầu đã thảo luận một pilot lớn hơn gồm 12 task, hai cấu hình và ba lần chạy mỗi task, tổng cộng 72 lượt.
Các nhóm task dự kiến gồm bug, feature nhỏ, thay đổi nhiều module, điều tra/review và tình huống authority chưa rõ.
Phương án đó chưa được thực hiện.

Người dùng chọn bắt đầu bằng bài tạo ứng dụng mới trong khoảng 5–10 phút mỗi bên.
Các bài dài và nhiều chặng để sau.
Một cặp chạy chỉ cung cấp tín hiệu ban đầu, chưa đủ kết luận workflow tốt hơn nói chung.

## Cấu hình workflow đã đề xuất

- Lượt đo core: baseline không có workflow cục bộ; treatment cài `coding-standard`, không thêm skill tùy chọn.
- `coding-standard` mặc định không chọn skill; bundle tên `core` là bundle skill tùy chọn, không phải điều kiện để dùng protocol.
- Không tạo sẵn spec, plan, product rules hoặc design trước khi nhận đề.
- Cài đặt được làm trước khi bấm giờ; thiết kế, viết code và kiểm tra sau khi nhận đề đều tính vào thời gian thực hiện.
- Nếu đo cả Impeccable hoặc skill khác, kết quả phản ánh cả bộ workflow và skill, không tách riêng được core.
- Hai folder riêng chưa bảo đảm độc lập vì session có thể nhận skill và hướng dẫn global hoặc từ thư mục cha.
- Workspace đánh giá nên nằm ngoài hai project dự thi.

## Đề bài nhỏ đã dùng

Xây ứng dụng todo cá nhân bằng React, TypeScript, Vite và CSS thuần.
Dữ liệu lưu bằng localStorage, không có backend hoặc dịch vụ bên ngoài.

Yêu cầu chức năng:

- Thêm công việc bằng nút “Thêm” hoặc Enter.
- Trim khoảng trắng đầu/cuối và từ chối tiêu đề rỗng.
- Chuyển công việc qua lại giữa hoàn thành và chưa hoàn thành.
- Lọc Tất cả / Chưa xong / Đã xong.
- Hiển thị tổng số việc chưa hoàn thành, độc lập với bộ lọc.
- Xóa công việc.
- Reload vẫn giữ dữ liệu và trạng thái.
- Hiển thị thông báo khi danh sách hoặc kết quả lọc trống.
- Giao diện tiếng Việt, dùng được trên desktop và màn hình rộng 375px.

Agent tự quyết các chi tiết giao diện chưa được chỉ định, giữ phạm vi nhỏ và bàn giao cách chạy cùng bằng chứng kiểm tra thực tế.
Không có yêu cầu bắt buộc lưu bộ E2E vào repository.

### Checklist độc lập

1. Mở lần đầu thấy trạng thái trống.
2. Nhập toàn khoảng trắng không tạo mục mới.
3. Nhập `  Mua sữa  ` rồi Enter tạo đúng một mục `Mua sữa`.
4. Thêm `Đọc sách` bằng nút, số chưa xong là 2.
5. Hoàn thành `Mua sữa`, số chưa xong còn 1.
6. Ba bộ lọc hiển thị đúng, số chưa xong không đổi theo bộ lọc.
7. Trong “Đã xong”, chuyển `Mua sữa` về chưa xong làm bộ lọc trống và số chưa xong thành 2.
8. Reload vẫn giữ hai mục chưa hoàn thành.
9. Xóa `Đọc sách` rồi reload không làm mục đã xóa xuất hiện lại.
10. Ở 375px không tràn ngang và thao tác thêm, hoàn thành, xóa vẫn dùng được.

Review hình ảnh bổ sung cho checklist chức năng.
Không tràn ngang chưa đủ chứng minh không có phần tử chồng lấn.

## Project và session được đánh giá

Hai đường dẫn được tái sử dụng cho lượt thứ hai, nên nội dung hiện tại không đại diện cho sản phẩm lượt đầu.
Lịch sử session là bằng chứng cần giữ để phân biệt các lượt.

| Nhãn | Project | Session lượt 1 | Session lượt 2 |
| --- | --- | --- | --- |
| X, có workflow cục bộ | `/Users/mac/Desktop/source-codes/workflow-test` | `01a0a58f-3c5c-7b42-8a4f-43531c9154d7` | `01a0a5a5-aaf7-7750-a197-3456fcf62e15` |
| Y, không workflow cục bộ | `/Users/mac/Desktop/source-codes/workflow-test-2` | `01a0a587-eeae-7af3-8639-ac937ae38268` | `01a0a5a5-5831-7bb1-bd6c-5ec4348aab30` |

Các trace gốc nằm trong `/Users/mac/.codex/sessions/2026/09/15/`, với tên file chứa session ID tương ứng.
Không sao chép raw transcript vào repository trong phiên này.
Nhãn workflow đã lộ khi đọc cấu trúc file, nên việc đánh giá không hoàn toàn mù.

## Lượt 1

Cả hai dùng `gpt-5.6-luna`, reasoning `high`, và cùng prompt task.

| Tiêu chí | X | Y |
| --- | --- | --- |
| Thời gian đến bàn giao | Khoảng 6 phút 6 giây | Khoảng 11 phút, gồm ngắt và chờ người dùng |
| Can thiệp sau prompt | Không | Ngắt gần 9 phút 56 giây, rồi yêu cầu cố định port |
| Hành vi chính | Đọc `quality-code-check`, triển khai và chạy Playwright | Dùng Impeccable global, tạo context thiết kế, detector và agent phụ review |
| Kiểm chứng của agent | Build, Playwright và xem ảnh desktop/mobile | Build, detector, source review và HTTP 200; không thử tương tác trình duyệt |
| Kiểm tra độc lập của evaluator | 10/10 chức năng, TypeScript và build đạt | 10/10 chức năng, TypeScript và build đạt |

### Phát hiện về điều kiện chạy

- X có `AGENTS.md` theo chuỗi workflow cũ, trong khi `docs/WORKFLOW.md` là protocol mới.
- Trace X không cho thấy lệnh đọc `docs/WORKFLOW.md`; không thể coi đây là phép đo core hiện tại.
- X đã có Playwright và `node_modules` trước khi nhận task; Y chưa có Playwright cục bộ.
- X dùng Node 22.20.0/npm 10.9.3; Y dùng Node 26.0.0/npm 11.12.1.
- Y sử dụng Impeccable global dù folder ban đầu không chứa workflow của project này.

Nhận xét ban đầu rằng X thêm Playwright sai nhóm dependency đã được đính chính sau khi đọc trace.
Dependency đó đã có trước task và không được quy là lỗi agent tạo ra trong lượt chạy.

### Khác biệt quan sát được

X đưa danh sách lên cao hơn trên mobile: khoảng 338px từ đầu trang, so với khoảng 665px của Y.
X phản hồi khi gửi tiêu đề rỗng, còn Y bỏ qua im lặng; cả hai vẫn đáp ứng yêu cầu từ chối rỗng.
Y có hình thức nổi bật hơn nhưng dành nhiều chiều cao cho phần giới thiệu và bảng trạng thái.
Y dùng agent phụ `01a0a594-bdd6-7971-9271-45490cb52c3f` để review source.
Review đó giúp phát hiện thiếu xử lý lỗi ghi localStorage và font tải ngoài.

### Token lượt 1

| Số liệu session chính | X | Y, gồm lượt yêu cầu bổ sung |
| --- | ---: | ---: |
| Input tổng | 840309 | 1822204 |
| Input được cache | 793088 | 1742336 |
| Output | 10710 | 19510 |

Session agent phụ của Y ghi nhận riêng 94053 input, 79616 cached input và 1029 output.
Không gộp số agent phụ vào bảng session chính.
Token là số cộng dồn qua các lần gọi model, không phải lượng văn bản duy nhất được đọc.
Không suy tỷ lệ chi phí tiền từ tổng token vì input cache có cách tính khác.

Kết luận lượt 1: X thực hiện hiệu quả hơn trong cặp chạy quan sát được, nhưng khác biệt về skill, công cụ sẵn có và runtime ngăn việc quy nguyên nhân cho core workflow.

## Thay đổi README đã thực hiện

Đã kiểm tra README, protocol, manifest, installer và updater trong repository.
README đã mô tả core mới nhưng chưa làm rõ việc installer giữ nguyên file hướng dẫn cũ.
Installer có thể để `AGENTS.md` cũ tồn tại cạnh `docs/WORKFLOW.md` mới.
Đây là hành vi bảo toàn file có sẵn, không phải installer tự migration nội dung.

Đã sửa `README.md` để:

- Chỉ rõ chạy installer từ project đích và chọn kit/runtime.
- Phân biệt source GitHub `main` với bản npm phát hành.
- Làm rõ core không cần skill và bundle `core` là tùy chọn.
- Hướng dẫn kiểm tra, bảo toàn quy tắc riêng và migration routing cũ khi được cho phép.
- Nêu template global legacy không phải nguồn cho protocol project hiện tại.
- Thêm checklist bàn giao cài đặt cho AI và lưu ý điều kiện A/B.
- Làm rõ reinstall hoặc `update --apply` không tự thay thế bước migration file cũ.

Chỉ README được thay đổi trong commit đó; không sửa hành vi installer hoặc cấu hình của hai project test.
Đã chạy `npm test`, `git diff --check` và đối chiếu `node cli.js --help`.
Các kiểm tra đều đạt.
Commit `7360585` — `docs: clarify workflow installation and legacy migration` — đã push lên `origin/main`.

## Prompt và môi trường đề xuất cho lượt 2

Giữ cùng task và model/reasoning, tắt skill bổ sung kể cả Impeccable và không gọi agent phụ.
X chỉ cài core hiện tại.

| Thành phần | Phiên bản hoặc cấu hình yêu cầu |
| --- | --- |
| Node.js / npm | 22.20.0 / 10.9.3 |
| React / React DOM | 19.1.1 / 19.1.1 |
| TypeScript / Vite | 5.9.2 / 7.1.5 |
| Plugin React | 5.0.2 |
| React types / React DOM types | 19.1.13 / 19.1.9 |
| Playwright | 1.61.0, devDependency; Chromium có sẵn trước benchmark |
| Host | 127.0.0.1 |
| Port X / Y | 5173 / 5174 |
| Xử lý port bận | `strictPort: true`; báo lỗi, không đổi port hoặc dừng process của người khác |

Đây là bộ phiên bản đã dùng để cố định thử nghiệm, không phải khuyến nghị phiên bản an toàn hiện hành.
Trong cả hai session lượt 2, npm audit báo cảnh báo high liên quan Vite 7.1.5.
Các agent giữ phiên bản theo đề và báo lại, không tự nâng cấp.

Prompt yêu cầu dừng nếu môi trường không khớp, không tự đổi Node hoặc tải browser.
Prompt cũng yêu cầu chỉ làm việc trong project hiện tại, không xem project/session khác hoặc thay đổi cấu hình global.
Agent phải kiểm thử trên đúng port, xem desktop/mobile và dừng server do mình tạo trước bàn giao.

## Lượt 2

Cả hai vẫn dùng `gpt-5.6-luna`, reasoning `high`.
X đã nhận `AGENTS.md` hiện tại và đọc `docs/WORKFLOW.md`.
Không thấy hai session dùng skill bổ sung hoặc gọi agent phụ.

Y dừng đúng điều kiện ban đầu sau khoảng 22 giây vì Node/npm không khớp.
Người dùng sau đó cho phép tiếp tục bằng Node hiện tại.
Y vì vậy vẫn dùng Node 26/npm 11, trong khi X dùng Node 22/npm 10.
Không coi sự dừng đúng yêu cầu đó là lỗi cần người dùng giải cứu.

| Tiêu chí | X | Y |
| --- | --- | --- |
| Thời gian triển khai đến bàn giao | Khoảng 6 phút 30 giây | Khoảng 3 phút 33 giây từ lệnh cho phép tiếp tục |
| Kiểm tra độc lập | 10/10 chức năng, TypeScript và build đạt | 10/10 chức năng, TypeScript và build đạt |
| Kiểm thử trong session | Playwright và xem ảnh desktop/mobile | Playwright và xem ảnh desktop/mobile |
| Bằng chứng test lưu trong project | Hai bài E2E và cấu hình runner | Chỉ có script chạy trực tiếp trong lịch sử session |
| Giao diện 375px | Không thấy lỗi bố cục rõ trong trạng thái đã xem | Bộ đếm chồng nhẹ lên vùng bộ lọc |

### Phát hiện cụ thể

Y có script `test:e2e` nhưng không có file test tương ứng.
Evaluator chạy `npm run test:e2e -- --list` và nhận `No tests found`, tổng 0 test.
Điều này không phủ nhận các script Playwright đã thực sự chạy và pass trong session Y.
Đề bài không bắt buộc lưu test, nhưng lệnh test được khai báo chưa dùng được là điểm bàn giao chưa hoàn chỉnh.
X có hai test được runner nhận diện, và trace ghi nhận chúng đã pass sau khi sửa selector.

Ở 375px, vùng bộ lọc Y kết thúc tại khoảng 254.5px và bộ đếm bắt đầu tại khoảng 248.3px.
Hai vùng chồng nhau khoảng 6px theo chiều ngang và có giao nhau theo chiều dọc.
Đây là lỗi bố cục bổ sung ngoài kết quả checklist chức năng 10/10.

X dành khoảng 1 phút 35 giây trước khi bắt đầu dựng app, chủ yếu kiểm tra nhiều bản Chromium và đọc hướng dẫn.
X sửa lỗi build thiếu type `node`, sửa selector test khớp nhiều nút và thực hiện nhiều lượt kiểm tra cuối.
Một phần công tạo ra bộ E2E dùng lại được; việc dò browser và kiểm tra rải rác có thể rút gọn.
Y triển khai nhanh hơn nhưng không lưu bộ test và bỏ sót lỗi bố cục mobile.

### Token lượt 2

| Số liệu toàn session | X | Y, gồm lượt dừng kiểm tra môi trường |
| --- | ---: | ---: |
| Input được cache | 1053184 | 358784 |
| Input không cache | 53390 | 114903 |
| Output | 11159 | 9115 |

X có tổng input cao hơn nhưng input không cache thấp hơn.
Chưa xác định bên nào rẻ hơn bằng tiền.

Kết luận lượt 2: Y nhanh hơn về thời gian thực hiện quan sát được, X tốt hơn ở khả năng chạy lại test và bố cục mobile, chức năng chính hòa.
Chưa đủ bằng chứng để nói core gây ra các khác biệt đó vì runtime vẫn khác và mỗi cấu hình mới có một lượt ở điều kiện này.

## Công việc evaluator đã thực hiện và giới hạn bằng chứng

- Đọc source, cấu hình và trace của các session được người dùng cung cấp.
- Đọc thêm session agent phụ của Y ở lượt 1 để kiểm tra nhận định review.
- Chạy TypeScript và build production vào thư mục tạm riêng.
- Chạy cùng checklist bằng Playwright trên context trình duyệt riêng và xem ảnh desktop/mobile.
- Kiểm tra danh sách test của hai project lượt 2.
- Không sửa source của các project benchmark và không sửa lỗi phát hiện trong lúc đánh giá.
- Không thực hiện một báo cáo critique Impeccable chính thức; dùng checklist benchmark đã thống nhất.

Script và ảnh đánh giá được tạo trong `/tmp/workflow-benchmark.l7PE8I/` và `/tmp/workflow-round2.ALhEey/`.
Đây là bằng chứng tạm trên máy, có thể bị hệ điều hành dọn; không phải artifact đã commit.
Build và kiểm thử độc lập chứng minh sản phẩm hiện tại chạy trong môi trường evaluator, không tái tạo đầy đủ runtime của từng session gốc.
Không khẳng định đã kiểm tra mọi trình duyệt, mọi lỗi storage hoặc toàn bộ accessibility.

## Hướng tiếp theo đã đề xuất, chưa thực hiện

1. Giữ cùng Node/npm, browser và công cụ kiểm chứng sẵn có ở cả hai bên trước khi bắt đầu session mới.
2. Giữ core hiện tại ở X và không dùng skill bổ sung ở cả hai để đo riêng core.
3. Lặp lại bài nhỏ vài lần trước khi kết luận về tốc độ hoặc chất lượng.
4. Bổ sung kiểm tra chồng lấn phần tử vào phần review mobile.
5. Chỉ thay đổi rule workflow khi có pattern lặp lại và bằng chứng quy nguyên nhân đủ rõ.
6. Sau đó mới mở rộng sang bài nhiều chặng, thay đổi yêu cầu, bug hoặc task qua nhiều module.

Không suy từ hai lượt này rằng mọi workflow đều tạo overhead hoặc rằng bỏ workflow luôn tốt hơn.
Hai lượt có cấu hình và điều kiện khác nhau, nên không gộp thành một tỷ lệ thắng/thua chung.

## Cấp Độ
Standard

## Hợp Đồng Thực Thi
### Mục Tiêu
- Tạo một file HTML local để reviewer cấu hình, xem trước và approve một workflow slice trước khi AI sinh spec chi tiết.

### Nguồn Quyết Định Đã Duyệt
- Manifest quyết định: `docs/ai/design-decisions/workflow-design-sandbox-html.json`
- HTML review thiết kế: `docs/ai/designs/workflow-design-sandbox-html.html`
- D-001: HTML sandbox lưu nháp bằng `localStorage` và có nút reset.
- D-002: Export chính có cả copy clipboard và download JSON.
- D-003: Validation chặn export khi slug, goal hoặc workflow range chưa hợp lệ.

### Bắt Buộc Xảy Ra
- Agent thực thi phải tạo một HTML tool tự chạy tại `docs/ai/tools/workflow-design-sandbox-html.html`.
- HTML tool phải cho reviewer nhập feature slug, goal, workflow range, complexity, constraints và xem preview JSON.
- HTML tool phải validate required fields trước khi cho copy hoặc download JSON.
- HTML tool phải lưu nháp bằng `localStorage` và có nút reset rõ ràng.
- HTML tool phải có cả copy clipboard và download JSON.
- HTML tool phải hiển thị trạng thái thành công hoặc lỗi trong UI.

### Không Được Xảy Ra
- Không sửa runtime orchestrator hoặc schema workflow thật.
- Không thêm backend, database, auth hoặc đồng bộ nhiều người dùng.
- Không ghi trực tiếp file trong repo từ browser.
- Không thay thế `review-spec` hoặc `execute-spec` bằng logic trong HTML.
- Không dùng dữ liệu test trong lý do hoặc constraint làm business behavior mới.

## Vấn Đề
Workflow mới cần một slice đủ nhỏ để kiểm thử chuỗi `design-spec -> create-spec -> review-spec -> execute-spec`, nhưng vẫn đủ hành vi để đánh giá quyết định product, validation, persistence và fallback.
Một file HTML tự chạy là bề mặt phù hợp vì repo hiện là package Node CLI, không có app runtime UI sẵn để reuse.

## Phạm Vi
- Tạo một single-file HTML tool chạy offline trong trình duyệt.
- Cung cấp form cấu hình workflow sandbox gồm feature slug, goal, workflow start step, workflow end step, complexity, constraints và optional notes.
- Cung cấp preset mặc định cho range `design-spec` đến `execute-spec`.
- Cung cấp preview JSON cập nhật theo input.
- Cung cấp validation chặn export khi slug, goal hoặc workflow range chưa hợp lệ.
- Cung cấp lưu nháp bằng `localStorage` và reset draft.
- Cung cấp copy clipboard và download JSON.
- Cung cấp UI status cho lỗi validation, lỗi clipboard, trạng thái copied, trạng thái downloaded và reset.

## Ngoài Phạm Vi
- Không sửa `docs/ai/workflows/feature-standard.json`.
- Không sửa `.agents/skills/design-spec` hoặc runner local đã có.
- Không tạo server hoặc endpoint mới.
- Không thêm package dependency.
- Không tạo test automation framework mới.
- Không tích hợp trực tiếp với orchestrator state.
- Không import/export file trực tiếp qua File System Access API.

## Quyết Định Thiết Kế Đã Duyệt
- D-001: Chọn `Lưu nháp bằng localStorage và có nút reset`.
  Lý do được human nhập là `test`, nên spec chỉ coi answer là quyết định hành vi; lý do không thêm yêu cầu product mới.
- D-002: Chọn `Có cả copy clipboard và download JSON`.
  Lý do được human nhập là `test`, nên spec chỉ coi answer là quyết định hành vi; lý do không thêm yêu cầu product mới.
- D-003: Chọn `Chặn export khi slug, goal hoặc workflow range chưa hợp lệ`.
  Lý do được human nhập là `test`, nên spec chỉ coi answer là quyết định hành vi; lý do không thêm yêu cầu product mới.
- Constraint chung được manifest ghi là `test`.
  Constraint này là dữ liệu smoke test và không có nghĩa executable; agent thực thi không được biến nó thành UI copy hoặc validation rule.

## Kiểm Tra Giả Định
### Đã Xác Nhận
- Manifest approval đã pass validator: `docs/ai/design-decisions/workflow-design-sandbox-html.json`.
- Manifest checksum khớp HTML review tại `docs/ai/designs/workflow-design-sandbox-html.html`.
- Repo hiện là package Node CLI, không có frontend app runtime bắt buộc.
- Feature được approve là một HTML sandbox offline, không phải thay đổi orchestrator thật.

### Suy Luận An Toàn
- Output nên đặt tại `docs/ai/tools/workflow-design-sandbox-html.html` để tách tool thực thi khỏi design review artifact trong `docs/ai/designs/`.
- HTML nên dùng inline CSS và inline JS để người dùng có thể mở trực tiếp từ filesystem.
- JSON preview nên là object mô tả sandbox input, không phải workflow config thật của orchestrator.

### Cần Xác Nhận
- Không có câu hỏi sản phẩm nào đang blocking.

### Chi Tiết Kỹ Thuật Do Agent Chọn
- Dùng `localStorage` key `workflow-design-sandbox-html:v1`.
- Dùng static arrays trong JS cho workflow steps: `design-spec`, `create-spec`, `review-spec`, `execute-spec`.
- Dùng `navigator.clipboard.writeText` trước, fallback sang hidden textarea + `document.execCommand("copy")`.
- Download JSON bằng `Blob`, `URL.createObjectURL`, và temporary anchor.

## Bằng Chứng Hệ Thống Hiện Tại
- `package.json`: repo là Node CLI package, scripts hiện chỉ phục vụ release và không cung cấp frontend dev server.
- `docs/ai/workflows/feature-standard.json`: workflow chuẩn có sequence `design-spec`, `spec`, `review-spec`, `execute-spec`, nên sandbox có thể dùng các step này làm preset.
- `docs/ai/design-decisions/workflow-design-sandbox-html.json`: approval manifest hợp lệ, có 3 decision bắt buộc về persistence, export và validation.
- `docs/ai/designs/workflow-design-sandbox-html.html`: design review mô tả primary flow gồm chọn preset, nhập intent, validate/preview và export artifact.
- `.agents/skills/design-spec/scripts/design_review_server.py`: local runner mới thuộc design-spec scope, nhưng feature sandbox này không được phụ thuộc vào runner để chạy.

## Yêu Cầu Hành Vi
### Layout Và Nội Dung
- Trang phải mở trực tiếp trong browser như một file HTML độc lập.
- First viewport phải thể hiện rõ tên `Workflow Design Sandbox HTML`, goal và trạng thái draft.
- Trang phải có form chính, preview JSON và action bar trong cùng trải nghiệm.
- UI phải phân biệt dữ liệu đang nhập, validation issue và output preview.
- Text phải viết bằng tiếng Việt; code symbols, JSON keys và workflow step ids giữ tiếng Anh.

### Khoảng Workflow
- Form phải có control chọn `start_step` và `end_step`.
- Default phải là `start_step: design-spec` và `end_step: execute-spec`.
- Danh sách step hợp lệ phải gồm `design-spec`, `create-spec`, `review-spec`, `execute-spec`.
- Preview JSON phải chứa `workflow_range.steps` là danh sách step từ start đến end theo đúng thứ tự.
- Nếu start đứng sau end trong thứ tự workflow, validation phải chặn export và hiển thị lỗi.

### Trường Nhập
- `feature_slug` là required và phải match kebab-case `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- `goal` là required và phải có ít nhất một ký tự không phải whitespace.
- `complexity` là option set hữu hạn gồm `small`, `medium`, `large`.
- `constraints` là textarea, mỗi dòng không rỗng trở thành một item trong array `constraints`.
- `notes` là optional free text và chỉ xuất hiện trong JSON khi có nội dung.

### Kiểm Tra Hợp Lệ Và Xuất Dữ Liệu
- Copy và download phải bị chặn khi validation không pass.
- Khi validation fail, UI phải hiển thị danh sách lỗi và focus field đầu tiên có lỗi nếu có field tương ứng.
- Khi validation pass, JSON preview phải là dữ liệu được copy/download.
- Copy action phải thử Clipboard API trước.
- Nếu Clipboard API fail, UI phải dùng fallback textarea copy.
- Nếu cả hai copy path fail, UI phải hiển thị lỗi và không báo success giả.
- Download action phải tạo file `{feature_slug}.workflow-sandbox.json`.

### Lưu Nháp
- Mỗi lần người dùng thay đổi input, HTML phải lưu draft vào `localStorage`.
- Khi mở lại trang, HTML phải load draft nếu key tồn tại và data parse được.
- Nếu draft parse lỗi hoặc không phải object, HTML phải bỏ draft hỏng và dùng default.
- Reset draft phải xóa `localStorage` key và khôi phục default state.
- Reset phải cập nhật preview, validation và status trong UI.

### Cấu Trúc JSON Đầu Ra
- Preview/export JSON phải có cấu trúc:

```json
{
  "schema_version": 1,
  "event": "workflow-design-sandbox",
  "feature_slug": "example-feature",
  "goal": "Review a workflow slice.",
  "complexity": "medium",
  "workflow_range": {
    "start_step": "design-spec",
    "end_step": "execute-spec",
    "steps": ["design-spec", "create-spec", "review-spec", "execute-spec"]
  },
  "constraints": ["Keep it offline"],
  "notes": "Optional notes",
  "generated_at": "2026-07-24T04:35:09.416Z"
}
```

- `generated_at` phải cập nhật khi copy hoặc download.
- Preview có thể hiển thị `generated_at` theo thời điểm render hiện tại.

## Thay Đổi Trạng Thái / Dữ Liệu / Giao Diện
- Thêm file `docs/ai/tools/workflow-design-sandbox-html.html`.
- Không thay đổi package dependency.
- Không thêm dữ liệu lưu bền trong repo ngoài file HTML tĩnh.
- Persistence cục bộ trong browser dùng `localStorage` key `workflow-design-sandbox-html:v1`.
- Interface bên ngoài chỉ là JSON object được copy hoặc download.

## Thiết Kế Kỹ Thuật Chi Tiết
### `docs/ai/tools/workflow-design-sandbox-html.html`
- Trách nhiệm: Cung cấp UI browser độc lập để tạo workflow sandbox JSON payload.
- Đầu vào: native form controls cho slug, goal, complexity, start step, end step, constraints và notes.
- Đầu ra: JSON preview, nội dung clipboard và file JSON được download.
- Chuyển trạng thái: default state -> draft loaded -> edits persisted -> validation pass/fail -> copy/download success/failure -> optional reset.
- Hành vi lỗi: validation errors xuất hiện trong vùng status thấy được; nút copy/download không tạo output khi invalid.

### Mô Hình Form
- Duy trì một JS state object duy nhất được lấy từ DOM controls.
- Serialize textarea constraints bằng cách tách theo dòng, trim từng dòng và lọc dòng rỗng.
- Tạo `workflow_range.steps` bằng cách slice fixed `WORKFLOW_STEPS` array từ start index đến end index, bao gồm cả hai đầu.
- Không dùng hidden fields cho state có ảnh hưởng đến behavior chính.

### Kiểm Tra Hợp Lệ
- `validateState(state)` trả về `{ valid, errors, firstInvalidField }`.
- Hàm này kiểm tra slug, goal, step membership và thứ tự step.
- Hàm này không validate notes hoặc constraints ngoài trimming vì không có giới hạn nào đã được approve.

### Lưu Nháp
- `saveDraft(state)` ghi vào `localStorage`.
- `loadDraft()` bắt parse/storage errors và fallback về defaults.
- `resetDraft()` xóa key và render lại defaults.
- Storage errors không fatal; UI vẫn phải hoạt động khi không có persistence.

### Sao Chép Và Tải Xuống
- `copyJson()` chạy validation, tạo payload với `generated_at` mới và ghi formatted JSON.
- `downloadJson()` chạy validation, tạo payload với `generated_at` mới và download qua Blob.
- Copy fallback tạo một textarea tạm, select nó, chạy `document.execCommand("copy")`, rồi xóa textarea.
- Cả hai action đều cập nhật vùng status `aria-live`.

## Bản Đồ Thay Đổi Theo File
| Bề mặt | Thay đổi dự kiến | Lý do | Quyết định / AC |
|---|---|---|---|
| `docs/ai/tools/workflow-design-sandbox-html.html` | Thêm HTML, CSS và JS độc lập cho sandbox form, preview, validation, persistence, copy và download. | Triển khai feature đã approve mà không đụng app runtime. | D-001, D-002, D-003 / AC1-AC10 |
| `docs/ai/tools/` | Tạo directory nếu chưa tồn tại. | Cung cấp vị trí riêng cho local workflow tools có thể chạy, tách khỏi design artifacts. | Phạm Vi / AC1 |

## Kiểm Tra Hợp Lệ / Lỗi / Trường Hợp Biên
- `feature_slug` rỗng chặn copy/download.
- `feature_slug` không đúng kebab-case chặn copy/download.
- `goal` rỗng chặn copy/download.
- Start step hoặc end step không hợp lệ chặn copy/download.
- Start step đứng sau end step chặn copy/download.
- Clipboard permission failure fallback sang textarea copy.
- Clipboard và fallback copy cùng fail thì báo lỗi.
- Download vẫn phải hoạt động khi clipboard không khả dụng.
- Draft `localStorage` hỏng phải bị bỏ qua và thay bằng defaults.
- Reset phải xóa persisted draft và UI state.
- Notes hoặc constraints dài phải wrap trong UI và preview, không gây horizontal page overflow.

## Cân Nhắc Bảo Mật / Phân Quyền
- HTML không được execute remote scripts, load CDN assets, gửi network requests hoặc embed analytics.
- HTML không được đọc arbitrary local files.
- HTML không được claim rằng nó đã ghi file vào repo.
- Clipboard writes yêu cầu user action và chỉ được copy JSON payload đang hiển thị.
- Download dùng Blob do browser tạo và không bao gồm secrets ngoài form content do user nhập.

## Tương Thích / Di Chuyển Dữ Liệu
- Không cần migration vì feature chỉ thêm một file HTML độc lập mới.
- Browser compatibility nên target Chromium-based browsers hiện tại và Firefox cho standard form controls, `localStorage`, Blob downloads và Clipboard API fallback.
- HTML phải vẫn dùng được khi mở bằng `file://`.
- Existing design artifacts và workflow JSON files phải giữ nguyên sau implementation.

## Trình Tự Triển Khai
1. Tạo `docs/ai/tools/` nếu chưa tồn tại.
2. Thêm `docs/ai/tools/workflow-design-sandbox-html.html` với semantic HTML structure.
3. Implement CSS với responsive layout, visible focus và form/preview dimensions ổn định.
4. Implement JS constants cho workflow steps, defaults và localStorage key.
5. Implement state collection, render, validation và JSON payload generation.
6. Implement localStorage load/save/reset.
7. Implement copy bằng Clipboard API và textarea fallback.
8. Implement download qua Blob.
9. Mở HTML thủ công và verify default preview, validation errors, copy/download và reset.
10. Inspect HTML cuối cùng để bảo đảm không có remote dependencies và unintended repo writes.

## Tiêu Chí Chấp Nhận
### Trang Và Layout
- [ ] AC1: Khi mở trực tiếp `docs/ai/tools/workflow-design-sandbox-html.html` trong browser, sandbox UI hiển thị mà không cần dev server.
- [ ] AC2: First viewport hiển thị title, goal, primary form controls và JSON preview mà không overlap sai trên desktop width.
- [ ] AC3: Trang vẫn usable trên mobile viewport hẹp, form và preview stack dọc và không có horizontal page overflow.

### Input Và Preview
- [ ] AC4: Default state dùng `start_step: design-spec`, `end_step: execute-spec`, `complexity: medium`, và preview chứa đủ bốn workflow steps.
- [ ] AC5: Khi cập nhật slug, goal, complexity, workflow range, constraints hoặc notes, preview JSON cũng cập nhật.
- [ ] AC6: Constraints textarea serialize các dòng không rỗng vào `constraints`.

### Kiểm Tra Hợp Lệ
- [ ] AC7: Slug rỗng hoặc không đúng kebab-case chặn copy/download và hiển thị lỗi rõ ràng.
- [ ] AC8: Goal rỗng chặn copy/download và hiển thị lỗi rõ ràng.
- [ ] AC9: Workflow range có start đứng sau end chặn copy/download và hiển thị lỗi rõ ràng.

### Lưu Nháp
- [ ] AC10: Khi edit fields, draft state được lưu trong `localStorage` và restore sau page reload.
- [ ] AC11: Reset draft xóa `localStorage`, restore defaults và cập nhật preview.

### Xuất Dữ Liệu
- [ ] AC12: Copy JSON copy validated payload và báo success, dùng fallback nếu Clipboard API không khả dụng.
- [ ] AC13: Download JSON tạo `{feature_slug}.workflow-sandbox.json` chứa cùng validated payload shape đang hiển thị trong preview.
- [ ] AC14: Exported JSON bao gồm `schema_version`, `event`, `feature_slug`, `goal`, `complexity`, `workflow_range`, `constraints`, optional `notes` và `generated_at`.

## Ma Trận Xác Minh
| AC | Chiến lược bằng chứng | Bề mặt chính |
|---|---|---|
| AC1 | Mở browser trực tiếp từ filesystem hoặc inspect static file | `docs/ai/tools/workflow-design-sandbox-html.html` |
| AC2 | Browser screenshot hoặc manual visual inspection ở desktop width | `docs/ai/tools/workflow-design-sandbox-html.html` |
| AC3 | Browser screenshot hoặc manual visual inspection ở mobile width | `docs/ai/tools/workflow-design-sandbox-html.html` |
| AC4 | Browser interaction hoặc DOM inspection với default preview | `docs/ai/tools/workflow-design-sandbox-html.html` |
| AC5 | Browser interaction thay đổi từng field | `docs/ai/tools/workflow-design-sandbox-html.html` |
| AC6 | Browser interaction với multiline constraints | `docs/ai/tools/workflow-design-sandbox-html.html` |
| AC7 | Browser interaction với invalid slug | `docs/ai/tools/workflow-design-sandbox-html.html` |
| AC8 | Browser interaction với goal rỗng | `docs/ai/tools/workflow-design-sandbox-html.html` |
| AC9 | Browser interaction với reversed range | `docs/ai/tools/workflow-design-sandbox-html.html` |
| AC10 | Browser reload sau edits và inspect behavior của `localStorage` | `docs/ai/tools/workflow-design-sandbox-html.html` |
| AC11 | Browser interaction với reset action | `docs/ai/tools/workflow-design-sandbox-html.html` |
| AC12 | Browser interaction với copy action và quan sát clipboard/fallback | `docs/ai/tools/workflow-design-sandbox-html.html` |
| AC13 | Browser interaction với download action và inspect downloaded JSON | `docs/ai/tools/workflow-design-sandbox-html.html` |
| AC14 | Inspect shape của copied/downloaded JSON | `docs/ai/tools/workflow-design-sandbox-html.html` |

## Câu Hỏi Mở
- Không có câu hỏi blocking.

## Nhật Ký Quyết Định
- 2026-07-24: Tạo từ approved design manifest `docs/ai/design-decisions/workflow-design-sandbox-html.json`.
- 2026-07-24: Phân loại là Standard vì slice có persistence, validation, fallback behavior, reset/default behavior và nhiều user-visible states.
- 2026-07-24: Chọn `docs/ai/tools/` làm vị trí implementation để tránh trộn executable sandbox tools với design review artifacts trong `docs/ai/designs/`.

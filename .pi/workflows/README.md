# Pi Workflow Tracker

Workflow tracker này dùng để hiển thị workflow hiện tại ở footer của PI TUI.

## Files
- `feature-standard.json`: workflow chuẩn theo pre-spec gate + spec-sync flow mới
- `.active-workflow.json`: state workflow đang active trong session hiện tại

## Commands
- `/workflows` — liệt kê workflow
- `/workflows current` — xem workflow active, step hiện tại, step tiếp theo, hint tiếp theo
- `/workflows view <workflow-id>` — xem toàn bộ step của workflow
- `/workflows use <workflow-id>` — kích hoạt workflow và hiển thị ở footer
- `/workflows next` — chuyển sang step tiếp theo
- `/workflows prev` — lùi về step trước
- `/workflows set <step-id|step-number>` — nhảy đến step cụ thể
- `/workflows clear` — clear workflow active khỏi footer

## Footer UI
Footer hiển thị theo dạng compact:

```text
↪ Workflow: Feature Standard · 3/8 · Decide → Create spec (/create-spec)
```

## Workflow Notes
- Workflow này là human-controlled: human tự chọn step muốn chạy.
- `Shape`, `Recon`, `Decide` là gate step để hiển thị và nhắc flow, không bắt buộc phải là command riêng.
- Nếu human bắt đầu ở `/create-spec`, agent vẫn phải chạy pass nhẹ `Shape + Recon + Decide` trước khi viết spec.
- `Review spec` là optional check, không phải step chuẩn bắt buộc trong workflow tracker mặc định.
- `Verify feature` là implementation verification.
- `Verify runtime` là runtime behavior verification sau khi implementation verification đã xong.

## Workflow JSON shape
Mỗi step nên có tối thiểu:

```json
{
  "id": "execute-spec",
  "title": "Execute spec",
  "type": "command",
  "value": "/execute-spec",
  "hint": "Gõ /execute-spec @docs/ai/specs/<file>.md"
}
```

`type`, `value`, `hint` chủ yếu dùng để hiển thị trên TUI.

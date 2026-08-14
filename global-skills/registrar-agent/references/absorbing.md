# Xác nhận và đổi trạng thái (absorb)

Đọc file này khi người dùng xác nhận một dòng trong `.registrar/inbox.md`.

## Ai ghi inbox

Workflow hoặc worker agent thả dòng vào `.registrar/inbox.md` sau khi verify xong.
Chúng **không** được ghi vào `docs/ai/domain/` hay `docs/ai/architecture/`.

Bạn cũng không ghi hộ chúng.
Nếu người dùng nói "feature X xong rồi" mà inbox không có dòng nào, hỏi họ đường dẫn bằng chứng rồi tự thêm một dòng inbox trước, sau đó mới đi tiếp trình tự dưới đây.

Luật rút ra từ code sẵn có đi cùng đường này, xem `Khởi tạo sổ ở repo brownfield` trong `SKILL.md`.
Khác biệt duy nhất: đường dẫn bằng chứng là **file mô tả hành vi** mà worker viết ở bước đọc code, không phải artifact verify.
Bước 2 dưới đây vẫn có nội dung thật trong ca đó, vì lời người dùng phát biểu và mô tả worker quan sát là hai artifact độc lập nên chúng lệch nhau được.

## Định dạng dòng

```text
YYYY-MM-DD | <BR-id> | verified | <đường dẫn bằng chứng>
```

Sổ kiến trúc là append-only nên không có gì để inbox đề nghị; nó không đi qua đường này.

Đường dẫn luôn lấy từ chính dòng inbox.
Không giả định repo có `docs/ai/verifications/` hay `docs/ai/specs/`; repo khác có bố cục khác.

## Kiểm tra trước khi flip

Từ chối và ghi `bad-inbox` khi:

- id không có trong index
- BR không ở `approved`
- đường dẫn bằng chứng không tồn tại trên đĩa

Từ chối thì giữ nguyên dòng inbox, không tự sửa, báo người dùng lý do cụ thể.

## Trình tự cho một dòng `verified`

1. Mở file capability chứa BR đó.
2. Đọc file bằng chứng. Nó nói hành vi đã verify **có đúng như `Rule` của BR không**.
3. Lệch nhau thì **dừng**, báo người dùng chỗ lệch, không flip.
   Đây chính là trường hợp task được duyệt nhưng luật chưa đúng; nó cần một luật mới, không phải một lần flip.
4. Khớp thì đổi `Status: approved` thành `Status: implemented · <ngày trong dòng inbox>`.
5. Cập nhật dòng index.
6. Cập nhật `docs/ai/domain/trace.json`.
7. Đề xuất archive spec của feature nếu repo có thư mục spec và người dùng đồng ý; không có thì bỏ qua im lặng.
8. Xoá đúng dòng inbox đó.

Bước 3 là lý do bước xác nhận này tồn tại.
Không có nó thì sổ chỉ chép lại kết quả thi công, và mất khả năng nói "hệ thống chưa làm đúng cái ta đã chốt".

Quyết định và nợ không vào `trace.json`, và không đổi trạng thái qua inbox.

## trace.json

Đây là cầu nối BR với code, để `auditing.md` biết đọc chỗ nào.
Nó là dữ liệu phái sinh; sai thì sửa được, không phải sự thật.

```json
{
  "BR-019": {
    "files": ["src/user/address.ts"],
    "evidence": "docs/ai/verifications/address-limit.md",
    "commit": "a1b2c3d"
  }
}
```

- `files` lấy từ danh sách file mà artifact bằng chứng liệt kê. Artifact không liệt kê thì hỏi người dùng một câu; họ không trả lời thì ghi mảng rỗng.
- `commit` lấy bằng `git rev-parse --short HEAD` tại thời điểm xác nhận.
- Một BR được implement nhiều lần thì ghi đè entry, không tích luỹ.

`files` rỗng nghĩa là BR đó không audit tự động được.
Đừng đoán đường dẫn cho đủ entry.

## Duyệt cả lô

Người dùng nói "duyệt hết" thì chạy trình tự trên cho từng dòng, theo thứ tự trong file.

Một dòng bị từ chối không chặn các dòng còn lại.
Cuối lượt báo cáo gọn: bao nhiêu dòng đã flip, bao nhiêu dòng bị giữ lại và vì sao.

Không hỏi lý do trong lượt duyệt lô.

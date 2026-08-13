# Đăng ký luật nghiệp vụ (BR)

Đọc file này khi thao tác trên `docs/ai/domain/`.
Không đọc cùng lúc với `registering-arch.md`.

## Luật viết

Một BR mô tả **hành vi quan sát được từ ngoài**: input, hành vi, hệ quả.

- Cấm nhắc tên file, hàm, class, bảng, cột, endpoint.
- Cấm mô tả cách hiện thực.
- Một BR là một câu khẳng định kiểm chứng được, không phải test case.
- Trường hợp biên ghi một dòng; biên đủ quan trọng thì tách thành BR riêng.

Given/When/Then đầy đủ thuộc về checklist kiểm thử, không thuộc sổ này.
Sổ này phình lên là hỏng mục đích của nó.

## Đơn vị file

Một file là một **capability**: một danh từ nghiệp vụ có vòng đời riêng.

Phép thử: đọc riêng file đó có hiểu và quyết định được không.
Phải mở ba file mới hiểu thì đang chia sai.

Luật đụng nhiều capability thì đặt ở capability **sở hữu quyết định**; chỗ kia chỉ nhắc id.
Không bao giờ chép nội dung sang file thứ hai.

Trần cứng: một file quá 40 luật thì đề nghị người dùng tách capability.
Không tự tách.

## Cấu trúc một capability file

```markdown
# Order

## Mục đích
Vòng đời đơn hàng từ lúc đặt tới lúc đóng.

## Vòng đời trạng thái
| Từ | Sự kiện | Sang | Điều kiện |
| --- | --- | --- | --- |
| draft | submit | placed | BR-002 |
| placed | ship | shipped | BR-007 |
| shipped | cancel | ✗ | BR-014 |

## Luật

### BR-014 — Đơn đã ship không thể hủy
- Status: implemented · 2026-07-02
- Rule: đơn ở shipped hoặc delivered không hủy được; người dùng phải mở return request.
- Vì sao: tiền đã settle với carrier, hủy tạo lệch sổ.
- Biên: carrier báo mất hàng sau khi ship thì đi theo BR-021, không phải hủy.
- Đã loại: hủy kèm auto refund — không reconcile được với carrier.
```

Bảng vòng đời chỉ viết khi capability thật sự có state machine.
Không bịa bảng cho capability không có vòng đời.

Trường bắt buộc: `Status`, `Rule`, `Vì sao`.
Trường tuỳ chọn: `Biên`, `Đã loại`, `Thay bởi`.

`Vì sao` là trường có giá trị lâu nhất, vì code không bao giờ tái tạo được nó.
Người dùng không nói lý do thì hỏi đúng một câu; họ không trả lời thì ghi `-`.

## Trạng thái

| Status | Nghĩa | Ai đặt |
| --- | --- | --- |
| `draft` | đang bàn, chưa chốt | bạn, khi người dùng nói |
| `approved` | người dùng đã chốt, chưa có code | người dùng duyệt |
| `implemented` | đã có trong code, audit được | người dùng xác nhận dòng inbox |
| `deprecated` | không còn đúng, giữ lại vì lý do lịch sử | người dùng duyệt |

Không có trạng thái `implementing`.
Đó là trạng thái của task và thuộc về Foreman.

`approved` kèm ngày duyệt, `implemented` kèm ngày xác nhận.

## Cấp id

Đọc bộ đếm ở dòng đầu `docs/ai/domain/README.md`, cấp id đó, tăng bộ đếm ngay.

Id không bao giờ được tái sử dụng, kể cả khi luật bị xoá lúc còn `draft`.

## Đăng ký luật mới

1. Xác định capability. Chưa có file thì tạo file mới và báo người dùng biết đã mở capability mới.
2. Cấp id, ghi luật với `Status: draft`.
3. Thêm dòng index, tăng bộ đếm.
4. In lại luật vừa ghi theo output chuẩn để người dùng duyệt.

Không hỏi lại trước khi ghi.
Ghi thô đúng lời người dùng; họ sửa ở lượt duyệt.

Trước khi ghi, tra index xem đã có luật nào nói cùng chuyện chưa.
Trùng thì báo id cũ và hỏi người dùng muốn sửa cái cũ hay đăng ký cái mới.

## Sửa

`draft` sửa thoải mái.

`approved`, `implemented`, `deprecated` thì **cấm sửa trường `Rule`**.
Người dùng yêu cầu đổi hành vi thì:

1. Đăng ký luật mới `draft` mang hành vi mới.
2. Đề xuất deprecate luật cũ, chờ người dùng duyệt.
3. Không đụng luật cũ cho tới khi được duyệt.

Sửa lỗi chính tả hoặc làm rõ câu chữ mà **không đổi nghĩa** thì được, và phải nói rõ với người dùng là đã sửa gì.

## Deprecate

Không bao giờ xoá luật khác `draft`.
Xoá là mất lý do, và lý do là thứ không tái tạo được.

```markdown
### BR-014 — Đơn đã ship không thể hủy
- Status: deprecated · 2026-08-13
- Thay bởi: BR-031
- Rule: (giữ nguyên văn cũ)
- Vì sao: (giữ nguyên văn cũ)
```

Giữ nguyên `Rule` và `Vì sao` cũ.
Thêm `Thay bởi` khi có luật thay thế; không có thì ghi `Thay bởi: -` kèm một dòng lý do bỏ hẳn.

Deprecate xong thì cập nhật index và ghi `deprecated` vào `log.md`.

## Mẫu README rỗng

```markdown
<!-- next: BR-001 -->

# Sổ nghiệp vụ

Index của mọi luật nghiệp vụ trong repo này.
Registrar giữ file này đồng bộ với các file capability.

Mỗi dòng: `id · capability · status · tóm tắt`.

## Luật

_(chưa có luật nào)_
```

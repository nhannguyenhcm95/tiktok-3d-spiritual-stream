# 05 — ART DIRECTION & UI GUIDE

## 1. Từ khóa mỹ thuật

Trang nghiêm, ấm áp, vàng kim, gỗ chạm khắc, ánh sáng từ tượng Phật, thảm đỏ, hoa sen, đông người nhưng không hỗn loạn.

## 2. Palette gợi ý

- Vàng kim chủ đạo: `#E6B84A`
- Ánh sáng vàng nhạt: `#FFE8A3`
- Đỏ thảm: `#8E1F1B`
- Đỏ trầm: `#5B1715`
- Nâu gỗ: `#5A321D`
- Kem ngà: `#F4E6C8`
- Xám áo lam: `#A9B2B9`

Màu chỉ là định hướng; kiểm tra độ tương phản và khả năng đọc trên màn hình điện thoại.

## 3. Scene composition

- Tượng Phật là focal point, đặt giữa trục dọc.
- Bàn thờ phía dưới tượng, hai bình hoa cân đối.
- Lư hương tạo điểm trung tâm trên bàn thờ.
- Lối đi/thảm đỏ tạo leading line về tượng.
- Avatar chiếm khoảng 25–40% vùng dưới tùy mật độ.
- Ranking đặt góc trên bên phải nhưng không che mặt tượng.
- Banner event gần phía trên, tránh khu vực hào quang.

## 4. Nhân vật

Avatar nhìn chủ yếu từ phía sau hoặc góc 3/4 sau, vì họ hướng về bàn thờ. Hình thể stylized 3D vừa đủ dễ nhận biết ở màn hình nhỏ. Nhiều màu áo lam/trắng/xám/nâu. Tên hiển thị nhỏ nhưng đọc được; không dùng font quá mảnh.

## 5. UI overlays

### Bảng TÂM LÒNG THÀNH

- Nền màu nâu đậm/đen trong suốt.
- Viền vàng nhạt.
- Header rõ ràng.
- Top 5–10 hiển thị ổn định.
- Tên người dùng cắt gọn nếu quá dài.
- Chỉ số điểm/đếm phải có label rõ, không nhập nhằng xu, điểm hoạt động và tiền thật.

### Notification banner

- Nền nâu sẫm, chữ kem/vàng.
- Ví dụ: “ThuySi đã dâng hương, cầu bình an (x2)” hoặc “[Tên] đã chia sẻ buổi lễ”.
- Hiện 3–5 giây, xếp hàng nếu sự kiện đến dồn dập.

### Comment bubbles

- Bong bóng nền trắng/kem, chữ đậm màu tối.
- Gắn với avatar hoặc lane UI gần avatar.
- Tối đa số bubble cấu hình được; tránh phủ kín màn hình.
- Ưu tiên comment liên quan đến command hoặc comment được bật hiển thị.

### Counter

Có thể có counter “Đang chờ lạy” hoặc bộ đếm nghi lễ, nhưng chỉ khi game logic thực sự có hàng đợi tương ứng. Không hiển thị số cứng hoặc giả lập.

## 6. Layout safe areas

Thiết kế 9:16 với safe margins. Test ở 1080×1920 và 720×1280. Để khoảng trống ở mép trên/dưới cho UI TikTok tùy thiết bị. OBS output chỉ chứa phần game; TikTok native controls được nền tảng render riêng.

## 7. Motion principles

- Ánh sáng chuyển động chậm, không nhấp nháy mạnh.
- Cánh hoa/particle chỉ dùng cho gift được map.
- Không camera shake.
- Transition animation mềm, không teleport nếu không cần.
- Hiệu ứng gift lớn có thời lượng ngắn và không che cảnh chính.

## 8. Asset pipeline

- Model: GLB/GLTF.
- Texture: KTX2/Basis nếu cần tối ưu.
- Animation: clips có tên ổn định, document rig/retarget convention.
- Mỗi asset có nguồn và license trong `ASSET_CREDITS.md`.
- Không lấy screenshot trong reference_images làm texture hoặc background trong bản phát hành.

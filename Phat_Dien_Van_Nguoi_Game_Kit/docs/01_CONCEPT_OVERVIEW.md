# 01 — TỔNG QUAN CONCEPT

## 1. Định nghĩa game

**Phật Điện Vạn Người** là một game social interactive chạy đồng thời với TikTok LIVE. Người xem livestream chính là người chơi; mỗi người được đại diện bằng một avatar Phật tử trong điện Phật ảo. Người xem tương tác bằng comment và gift ngay trên TikTok, còn game nhận các sự kiện đó và hiển thị hành động tương ứng trên avatar.

Không phải game RPG/combat, không phải ứng dụng game độc lập yêu cầu từng người xem cài đặt. Máy của streamer chạy game; hình ảnh được phát lên LIVE thông qua OBS Browser Source hoặc TikTok LIVE Studio.

## 2. Những yếu tố nhìn thấy trong clip tham chiếu

- Khung hình dọc, phù hợp tỷ lệ điện thoại 9:16.
- Tượng Phật màu vàng lớn ở chính giữa phần trên, có hào quang và ánh sáng vàng.
- Điện thờ nhiều chi tiết: bàn thờ, hoa, lư hương, đèn, nến, kiến trúc gỗ và thảm đỏ.
- Nhiều avatar Phật tử xuất hiện ở phần dưới, quay lưng/hướng về tượng Phật; có nhân vật quỳ/ngồi và một số nhân vật di chuyển trên lối đi.
- Avatar mặc nhiều tông trang phục như trắng, xám, nâu; có tên hiển thị cạnh hoặc trên đầu nhân vật.
- Bình luận được hiển thị thành bong bóng gần khu vực nhân vật.
- Phía trên có banner thông báo sự kiện, ví dụ người xem chia sẻ buổi lễ hoặc một hoạt động dâng hương/cầu bình an.
- Góc phía trên bên phải có bảng **TÂM LÒNG THÀNH**, hiển thị danh sách người chơi và chỉ số/xu theo thiết kế của phiên LIVE.
- Có bộ đếm/trạng thái kiểu “đang chờ lạy” trong một số khung hình.

Các nội dung cụ thể về điểm, cách quy đổi quà và điều kiện kích hoạt cần được cấu hình; không suy diễn chúng là quy tắc cố định của game gốc.

## 3. Quy tắc sản phẩm do chủ dự án xác định

1. Người xem TikTok LIVE là người chơi.
2. Mỗi người xem có một avatar Phật tử đại diện.
3. Comment là cách gọi hành động cho avatar.
4. Gift/donate là cách kích hoạt hành động đặc biệt hoặc hiệu ứng.
5. Người xem không cần điều khiển trực tiếp game bằng joystick.
6. Avatar được gắn với định danh người dùng TikTok trong phạm vi phiên LIVE.
7. Nhiều người xem có thể cùng tồn tại trong một điện Phật ảo.

## 4. Vòng lặp gameplay

1. Streamer mở game và tạo phiên LIVE.
2. Game kết nối một nguồn sự kiện LIVE.
3. Người xem tham gia. Nếu nguồn dữ liệu có sự kiện join cá nhân, game tạo avatar ngay; nếu không, game tạo avatar ở sự kiện đầu tiên của người đó (comment/gift/share) và hiển thị rõ chế độ fallback trong admin.
4. Avatar được xếp vị trí trong điện, hướng về tượng Phật.
5. Người xem comment từ khóa. Backend chuyển comment thành command.
6. Avatar tương ứng thực hiện animation.
7. Người xem gửi gift. Backend nhận event, xác định người gửi và gift, sau đó kích hoạt animation cá nhân hoặc event toàn cảnh.
8. Bảng TÂM LÒNG THÀNH, notification và các chỉ số được cập nhật theo luật cấu hình.
9. Phiên LIVE kết thúc; hệ thống lưu thống kê phiên, đóng kết nối và dọn trạng thái tạm.

## 5. Phân biệt vai trò các thành phần

| Thành phần | Vai trò |
|---|---|
| TikTok LIVE | Nơi người xem theo dõi, comment, tặng quà và chia sẻ |
| Live Event Provider | Đọc sự kiện LIVE từ nguồn tích hợp đã cấu hình |
| Backend | Định danh người xem, parse command, xử lý gift, điểm và phiên |
| Game 3D | Render điện Phật, avatar, animation và hiệu ứng |
| OBS / LIVE Studio | Đưa hình ảnh game lên luồng livestream |
| Admin Dashboard | Kết nối, giám sát, cấu hình command/gift, test và xử lý lỗi |

## 6. Phân biệt dữ liệu thật và dữ liệu giả lập

- Sự kiện từ connector thật phải có `source: "tiktok"` hoặc tên provider tương ứng.
- Sự kiện demo phải có `source: "mock"` và được đánh dấu rõ trong giao diện quản trị.
- Không được hiển thị “Đã kết nối TikTok” chỉ vì backend hoặc WebSocket đã chạy.
- Số người xem tổng và số user ID đã nhận diện là hai chỉ số khác nhau.
- Nếu không nhận được danh sách người xem cá nhân, không được tạo ra hàng trăm avatar giả dựa trên viewer count.

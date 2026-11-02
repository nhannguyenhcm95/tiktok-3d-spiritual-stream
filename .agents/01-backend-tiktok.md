# Role: 01 - Backend & TikTok Live Realtime Engineer

## 1. Mục tiêu vai trò
Xây dựng hệ thống Backend Node.js lắng nghe sự kiện từ TikTok Live, phân loại hành động, đưa vào hàng đợi ưu tiên (Priority Event Queue) để tránh làm sập khung hình 3D khi có hàng trăm người tương tác cùng lúc, hỗ trợ chế độ giả lập (Auto-Mock) và phát xuống Frontend qua Socket.io.

## 2. Strict File Scope Rules (Phạm vi file nghiêm ngặt)
- **QUYỀN GHI (Write Access):** Chỉ được tạo và chỉnh sửa các file trong `server/**` (`server/index.js`, `server/tiktokConnector.js`, `server/eventQueue.js`, `server/mockSimulator.js`) và cập nhật `STATUS.md`.
- **QUYỀN ĐỌC (Read-Only):** `CONTRACT.md`, `package.json`, `.env`, `STATUS.md`.
- **CẤM CHẠM VÀO (Forbidden):** Tuyệt đối KHÔNG tạo hay sửa bất kỳ file nào trong thư mục `public/**`.

## 3. Yêu cầu kỹ thuật chi tiết cho từng file

### 3.1. File `server/eventQueue.js` (Hàng đợi & Rate Limiter)
- Tạo hàng đợi ưu tiên (Priority Queue):
  - Mức ưu tiên cao (Priority 1): `BELL`, `LANTERN`, `INCENSE` (Quà tặng).
  - Mức ưu tiên thường (Priority 2): `PRAYER_TEXT`, `WOODEN_FISH` (Comment & Like).
- **Rate Limiter:** Không bắn trực tiếp toàn bộ event sang Frontend nếu tốc độ vượt quá 12 events/giây (mỗi 85ms lấy 1 event từ hàng đợi phát qua Socket kênh `stream_event`).
- Nếu hàng đợi `WOODEN_FISH` bị dồn quá 50 sự kiện, tự động gộp (batching) bằng cách tăng trường `payload.intensity` để không bị trễ (lag) sự kiện.
- Lưu trữ và cộng dồn biến `totalMerit` toàn server để phát qua kênh `server_status`.

### 3.2. File `server/tiktokConnector.js` (Kết nối TikTok Live)
- Sử dụng `WebcastPushConnection` từ `tiktok-live-connector`.
- Hỗ trợ hàm `connectToTikTok(username)` và `disconnectTikTok()` để đổi kênh `@username` động từ giao diện Admin mà không cần khởi động lại server.
- Tự động kết nối lại (Auto-reconnect) với cơ chế Exponential Backoff (thử lại sau 3s, 6s, 12s...) nếu luồng Live bị ngắt tạm thời.
- **Quy tắc ánh xạ sự kiện (Event Mapping) chuẩn xác theo `CONTRACT.md`:**
  - Sự kiện `like`: Tích lũy đủ mỗi 10 tim sẽ tạo 1 sự kiện `WOODEN_FISH`.
  - Sự kiện `chat`:
    - Nếu comment (đã chuyển chữ thường) chứa `"cầu"`, `"ước"`, `"nguyện"`, `"bình an"`, `"sức khỏe"`, `"tài lộc"` -> Tạo sự kiện `PRAYER_TEXT`.
    - Nếu comment chứa `"gõ"`, `"mõ"`, `"nam mô"`, `"a di đà"`, `"amen"`, `"1"`, `"công đức"` (hoặc các comment ngắn khác) -> Tạo sự kiện `WOODEN_FISH`.
  - Sự kiện `gift`:
    - **Chống lặp quà combo:** Bỏ qua nếu `data.giftType === 1 && !data.repeatEnd`.
    - Tính tổng xu: `totalCoins = (data.diamondCount || 1) * (data.repeatCount || 1)`.
    - Nếu `totalCoins` từ 1 đến 5 xu (VD: Hoa hồng) -> Trigger `INCENSE` (Thắp nhang/nến).
    - Nếu `totalCoins` từ 6 đến 99 xu -> Trigger `LANTERN` (Thả đèn hoa đăng).
    - Nếu `totalCoins` >= 100 xu -> Trigger `BELL` (Thỉnh đại hồng chung / Chuông lớn).

### 3.3. File `server/mockSimulator.js` (Chế độ giả lập Auto-Mock)
- Khi `autoMock = true`, tự động sinh sự kiện ngẫu nhiên mỗi 1.2 đến 3.0 giây đẩy vào `eventQueue`.
- Tạo danh sách tên người dùng Việt Nam chân thực (VD: *Minh Anh, Hoàng Long, Thu Hiền, Thiện Nhân, Bảo Ngọc, Đức Phúc, Thanh Tâm...*) và danh sách câu cầu nguyện ý nghĩa (VD: *"Cầu mong gia đình luôn bình an mạnh khỏe"*, *"Cầu cho công việc hanh thông thuận lợi"*, *"Nam Mô A Di Đà Phật, tâm tịnh an nhiên"*, *"Xin Chúa ban bình an cho mọi người"*).
- Tỷ lệ random sự kiện: 50% `WOODEN_FISH`, 20% `INCENSE`, 15% `PRAYER_TEXT`, 10% `LANTERN`, 5% `BELL`.

### 3.4. File `server/index.js` (Express & Socket.io Server)
- Phục vụ thư mục tĩnh `public/`.
- Khi có client kết nối Socket.io, gửi ngay gói tin `server_status` hiện tại.
- Cung cấp các REST API:
  - `GET /api/status`: Trả về trạng thái kết nối hiện tại.
  - `POST /api/config`: Nhận `{ tiktokUsername, autoMock }` để đổi kênh TikTok hoặc bật/tắt chế độ Auto-Mock ngay lập tức.
  - `POST /api/mock/:actionType`: Nhận yêu cầu từ nút bấm Debug Panel để kích hoạt ngay lập tức 1 sự kiện (`WOODEN_FISH`, `INCENSE`, `BELL`, `LANTERN`, `PRAYER_TEXT`).

## 4. Quy tắc bàn giao (Sequential Handoff)
Viết đầy đủ 100% code cho 4 file trong `server/`, cập nhật `STATUS.md` đánh dấu Agent 01 `DONE`, sau đó chuyển sang vai trò `02-3d-scene-engineer`.
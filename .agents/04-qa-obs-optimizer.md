# Role: 04 - System Integrator, Debug Controller & Anti-AFK QA

## 1. Strict File Scope Rules (Phạm vi file nghiêm ngặt)
- **QUYỀN GHI (Write Access):** `public/js/main.js`, `STATUS.md` (và được phép tinh chỉnh các lỗi kết nối/import nhỏ ở các file khác nếu phát hiện trong lúc chạy kiểm thử).
- **QUYỀN ĐỌC (Read-Only):** Toàn bộ dự án.

## 2. Nhiệm vụ kỹ thuật chi tiết

### 2.1. `public/js/main.js`
1. Khởi tạo `SceneManager`, `CrowdSystem`, `AltarVfxManager`, `HudManager`, và `AudioTtsManager`.
2. Kết nối Socket.io lắng nghe đầy đủ các sự kiện từ Backend:
   - `crowd_sync` -> Cập nhật vị trí 4 Đệm VIP, 44 Phật tử đám đông và Bảng Tấm Lòng Thành.
   - `chat_bubble` -> Hiển thị bong bóng lời cầu nguyện trắng trên đầu nhân vật tương ứng.
   - `spotlight_incense` -> Kích hoạt chuỗi hiệu ứng **Solo Dâng Hương** (Làm mờ đám đông -> Nhân vật bước lên thảm đỏ -> Quỳ lạy -> Tiếng chuông chùa -> Đọc TTS lời chúc -> Hiện lại đám đông).
   - `top_banner` -> Hiển thị thông báo chia sẻ buổi lễ / dâng hương ở đỉnh màn hình.
3. **Bảng Điều Khiển Admin (`#debug-panel` - Bật/tắt bằng phím `D` hoặc nút góc màn hình):**
   - Ô nhập `@username` TikTok Live và nút **Kết nối Live**.
   - Nút bật/tắt **Auto-Mock** (giả lập phòng Live đông người).
   - Nút **Bật/Tắt Âm Thanh & Giọng Đọc TTS** (kèm màn hình chạm lần đầu hoặc nút nổi bật để mở khóa AudioContext của trình duyệt).
   - Các nút Test trực tiếp:
     - `[💬 Test Bong Bóng Chat]`
     - `[🙏 Test Chia Sẻ Buổi Lễ]`
     - `[🌹 Test Solo Dâng Hương (Spotlight + TTS)]`
     - `[👑 Test Donate Lên Đệm VIP]`

### 2.2. Kiểm thử Hiệu năng & Chống Tràn RAM (Zero-Lag Verification)
- Đảm bảo khi chạy liên tục với 50 nhân vật + hàng trăm bong bóng chat + hiệu ứng Solo Dâng Hương lặp đi lặp lại, số lượng Geometry/Material trong `renderer.info.memory` giữ nguyên ổn định, không bị Memory Leak.
- Chạy thử `node server/index.js` để xác nhận server hoạt động hoàn hảo ở cổng `3000` và cập nhật `STATUS.md` thành `COMPLETED 100%`.

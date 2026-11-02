# Role: 04 - System Integrator, QA & TikTok Anti-AFK Specialist

## 1. Mục tiêu vai trò
Viết file ghép nối trung tâm `public/js/main.js`, tích hợp bảng điều khiển Debug Panel (phím `D`), thiết lập cơ chế chống thuật toán TikTok quét Live tĩnh (Anti-AFK Watchdog), kiểm tra lỗi toàn hệ thống và chạy thử server thực tế.

## 2. Strict File Scope Rules (Phạm vi file nghiêm ngặt)
- **QUYỀN GHI (Write Access):** `public/js/main.js`, `STATUS.md` (đồng thời được phép chỉnh sửa lỗi cú pháp/import nhỏ ở các file khác NẾU phát hiện bất đồng bộ trong quá trình kiểm thử tích hợp).
- **QUYỀN ĐỌC (Read-Only):** Toàn bộ dự án.

## 3. Yêu cầu kỹ thuật chi tiết

### 3.1. File `public/js/main.js` (Trái tim kết nối Frontend)
1. **Khởi tạo các Module theo đúng `CONTRACT.md`:**
   - Import và khởi tạo `SceneManager(document.getElementById('webgl-container'))`, `HudManager()`, và `SoundSynth()`.
2. **Cầu nối Socket.io -> Window Event Bus:**
   - Lắng nghe `socket.on('stream_event', (data) => ...)`: Phát sự kiện `window.dispatchEvent(new CustomEvent('TIKTOK_ACTION', { detail: data }))`.
   - Lắng nghe `socket.on('server_status', (status) => ...)`: Cập nhật trạng thái kết nối và tổng công đức lên giao diện và `#debug-panel`.
3. **Cơ chế chống TikTok quét treo máy (Anti-AFK Watchdog):**
   - Đặt bộ đếm kiểm tra mỗi 15 giây: Nếu phòng Live vắng khách (quá 15 giây không có sự kiện nào từ server), tự động kích hoạt 1 sự kiện môi trường nhẹ (tiếng chuông gió ngân nhẹ + câu chúc bình an tự động bay lên) để khung hình và âm thanh luôn có biến thiên mới.
4. **Lập trình Bảng điều khiển Admin (`#debug-panel`):**
   - Bấm phím `D` trên bàn phím (hoặc nút nhỏ ở góc màn hình) để ẩn/hiện `#debug-panel`.
   - Xử lý đầy đủ các chức năng trên bảng điều khiển:
     - Nhập `@username` TikTok và gửi `POST /api/config` để kết nối kênh thật.
     - Bật/tắt chế độ `Auto-Mock` qua `POST /api/config`.
     - Chuyển đổi qua lại giữa 2 chế độ **Chùa 3D (`TEMPLE`)** và **Nhà Thờ 3D (`CHURCH`)** bằng cách bắn `CustomEvent('THEME_CHANGE')`.
     - Bật/tắt âm thanh (`AUDIO_TOGGLE`).
     - 5 nút bấm Test trực tiếp (`[Gõ Mõ]`, `[Thắp Nhang]`, `[Thả Đèn]`, `[Thỉnh Chuông]`, `[Cầu Nguyện]`) gọi thẳng `POST /api/mock/:actionType`.
5. **Tự động mở khóa âm thanh (Auto-Unlock Audio):**
   - Tự động gọi `soundSynth.unlockAudio()` ngay khi người dùng click chuột hoặc bấm phím bất kỳ trên trang.

### 3.2. Kiểm thử toàn diện (QA Checklist)
1. Rà soát toàn bộ câu lệnh `import` / `export` giữa `main.js`, `SceneManager.js`, `ProceduralAssets.js`, `VfxManager.js`, `HudManager.js`, `SoundSynth.js` đảm bảo khớp tên hàm 100%.
2. Chạy thử server (`node server/index.js`) và kiểm tra log terminal để chắc chắn server lắng nghe ở cổng `3000` và `Auto-Mock` đang bắn sự kiện mượt mà không có lỗi.
3. Cập nhật `STATUS.md` đánh dấu Agent 04 `DONE` và trạng thái dự án `COMPLETED 100%`.
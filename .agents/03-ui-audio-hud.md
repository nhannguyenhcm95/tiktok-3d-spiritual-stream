# Role: 03 - UI Overlay, 9:16 Safe-Zone HUD & Web Audio Engineer

## 1. Mục tiêu vai trò
Xây dựng giao diện HTML/CSS tỷ lệ dọc 9:16 tuân thủ vùng an toàn (Safe-Zone) của TikTok Live, quản lý Bảng Xếp Hạng Công Đức, thông báo cầu nguyện và bộ tổng hợp âm thanh Web Audio API Synthesizer đa luồng không cần file `.mp3` bên ngoài.

## 2. Strict File Scope Rules (Phạm vi file nghiêm ngặt)
- **QUYỀN GHI (Write Access):** `public/index.html`, `public/css/style.css`, `public/js/ui/HudManager.js`, `public/js/audio/SoundSynth.js`, và cập nhật `STATUS.md`.
- **QUYỀN ĐỌC (Read-Only):** `CONTRACT.md`, `STATUS.md`.
- **CẤM CHẠM VÀO (Forbidden):** Tuyệt đối KHÔNG chạm vào `server/**`, `public/js/3d/**`, `public/js/main.js`.

## 3. Yêu cầu kỹ thuật chi tiết cho từng file

### 3.1. File `public/index.html`
- Khai báo `<script type="importmap">` chuẩn xác:
  ```html
  <script type="importmap">
    {
      "imports": {
        "three": "[https://unpkg.com/three@0.160.0/build/three.module.js](https://unpkg.com/three@0.160.0/build/three.module.js)",
        "gsap": "[https://unpkg.com/gsap@3.12.5/index.js](https://unpkg.com/gsap@3.12.5/index.js)"
      }
    }
  </script>
  ```
- Nhúng `<script src="/socket.io/socket.io.js"></script>`.
- Tạo đầy đủ các thẻ HTML với **chính xác 100% các ID quy định trong `CONTRACT.md`**:
  - `#app-wrapper`
  - `#webgl-container`
  - `#hud-layer` (chứa `#merit-counter`, `#leaderboard-list`, `#toast-container`, `#prayer-wall`, và hướng dẫn tương tác ngắn gọn cho khán giả như: *"Chat 'Nam Mô' để Gõ Mõ | Tặng Hoa Hồng: Thắp Nhang | Quà lớn: Thỉnh Chuông"*).
  - `#debug-panel` (Chứa ô nhập `@username` TikTok, nút Connect, nút bật/tắt Auto-Mock, nút đổi Theme Chùa/Nhà Thờ, nút Mute/Unmute, và 5 nút Test nhanh sự kiện).
- Cuối thẻ `<body>` gọi `<script type="module" src="/js/main.js"></script>`.

### 3.2. File `public/css/style.css` (Chuẩn TikTok 9:16 Safe-Zone)
- Thiết kế khung hiển thị dọc 9:16 sang trọng, huyền ảo (Glassmorphism nền đen mờ viền vàng kim `#ffd700`, font chữ dễ đọc trên màn hình điện thoại).
- **Quy chuẩn TikTok Safe-Zone:**
  - **20% Trên cùng:** Đặt `#merit-counter` (Tổng Công Đức) và `#leaderboard-list` (Top 3 Bảng Vàng Công Đức).
  - **50% Giữa màn hình:** Đặt `#toast-container` (hiện thông báo khi có người thắp hương/thỉnh chuông) và `#prayer-wall` (thẻ lời cầu nguyện lung linh ở cạnh phải).
  - **30% Dưới cùng:** Tuyệt đối để trống góc dưới bên trái (vì khung chat của ứng dụng TikTok sẽ đè lên vùng này). Chỉ để một thanh hướng dẫn nhỏ gọn tinh tế ở sát mép hoặc phía trên vùng chat.

### 3.3. File `public/js/ui/HudManager.js`
- Export class `HudManager` đúng chuẩn `CONTRACT.md`.
- Lắng nghe `window.addEventListener('TIKTOK_ACTION', (e) => ...)`:
  - **Tính điểm Công Đức:** `WOODEN_FISH` = +1, `PRAYER_TEXT` = +2, `INCENSE` = +10, `LANTERN` = +50, `BELL` = +200 (nhân với `payload.intensity` hoặc `repeatCount`).
  - Lưu trữ điểm của từng `user.uniqueId`, tự động sắp xếp và render **Top 3 Bảng Vàng Công Đức** lên `#leaderboard-list` kèm hiệu ứng nảy số.
  - Hiển thị **Toast Notification** đẹp mắt tại `#toast-container` khi có sự kiện `INCENSE`, `LANTERN`, `BELL` (tự động xóa sau 4 giây).
  - Hiển thị lời cầu nguyện của khán giả lên `#prayer-wall` khi có sự kiện `PRAYER_TEXT` hoặc `LANTERN` (giới hạn tối đa 3 thẻ hiển thị cùng lúc).

### 3.4. File `public/js/audio/SoundSynth.js` (Web Audio API Synthesizer)
- Export class `SoundSynth` đúng chuẩn `CONTRACT.md`.
- Sử dụng **Web Audio API thuần (`window.AudioContext`)** để tự tổng hợp âm thanh sống động ngay lập tức mà không cần phụ thuộc file `.mp3` bên ngoài:
  1. **Tiếng Mõ Gỗ (`playWoodenFish()`):** Kết hợp Oscillator sóng `triangle` + `BiquadFilterNode` (bandpass ~720Hz, Q=8) với đường bao âm lượng (Envelope) gõ dứt khoát trong `0.12s`, nghe đúng tiếng *"Cốc!"* trầm ấm của mõ chùa.
  2. **Tiếng Đại Hồng Chung (`playBell()`):** Kết hợp 3 Oscillator sóng `sine` tạo âm bồi kim loại (165Hz, 330Hz, 495Hz) ngân vang kéo dài `4.0s` với hiệu ứng rung nhẹ.
  3. **Tiếng Chuông Gió / Thắp Nhang (`playChime()`):** Sóng `sine` trong trẻo ở tần số cao (1318Hz -> 1760Hz) ngân nhẹ `1.2s` khi có người thắp nhang, thả đèn hoặc gửi lời cầu nguyện.
- **Chống vỡ tiếng (Polyphony & Pitch Variation):**
  - Giới hạn phát tối đa 8 luồng âm thanh/giây.
  - Tự động biến thiên nhẹ tần số ngẫu nhiên (`±4%`) mỗi lần gõ mõ để khi nhiều người gõ liên tục âm thanh nghe tự nhiên như gõ thật, không bị đơ hay rè trên OBS.

## 4. Quy tắc bàn giao (Sequential Handoff)
Hoàn thiện 4 file thuộc phạm vi UI & Audio, cập nhật `STATUS.md` đánh dấu Agent 03 `DONE`, sau đó chuyển sang vai trò cuối cùng `04-qa-obs-optimizer`.
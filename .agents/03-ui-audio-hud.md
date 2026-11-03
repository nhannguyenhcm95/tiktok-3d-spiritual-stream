# Role: 03 - UI HUD, Speech Bubbles Pooling & Audio/TTS Engineer

## 1. Strict File Scope Rules (Phạm vi file nghiêm ngặt)
- **QUYỀN GHI (Write Access):** `public/index.html`, `public/css/style.css`, `public/js/ui/HudManager.js`, `public/js/audio/AudioTtsManager.js` và cập nhật `STATUS.md`.
- **QUYỀN ĐỌC (Read-Only):** `CONTRACT.md`, `STATUS.md`.
- **CẤM CHẠM VÀO (Forbidden):** `server/**`, `public/js/3d/**`, `public/js/main.js`.

## 2. Nhiệm vụ kỹ thuật chi tiết (Chuẩn Giao diện Video Mẫu)

### 2.1. `public/index.html` & `public/css/style.css`
- Thiết kế khung hiển thị dọc **9:16** chuẩn TikTok Live (trên máy tính hiển thị khung dọc 9:16 căn giữa màn hình hoặc toàn màn hình khi có `?obs=true`).
- **Bảng `TẤM LÒNG THÀNH` (`#tam-long-thanh-panel` - Góc phải trên):**
  - Nền nâu đen bán trong suốt (`rgba(28, 14, 6, 0.82)`), viền vàng kim mảnh, bo góc `12px`.
  - Tiêu đề chữ vàng đậm: **TẤM LÒNG THÀNH**.
  - Dòng phụ: `Đệm cuối (hạng 5) có 204 xu`.
  - Danh sách 4 người bám đuổi: Hiển thị số thứ tự tròn, Tên người dùng, icon đồng xu vàng + số xu bên phải, và dòng chữ nhỏ màu vàng nhạt ở dưới: `còn 47 xu để lên đệm`.
  - Ngay bên dưới khung bảng là badge nhỏ: `Vòng lạy: 45`.
- **Banner Thông báo Đỉnh (`#top-banner-toast`):**
  - Đặt ở chính giữa phía trên (ngay ngang ngực/vai tượng Phật), nền nâu sẫm viền vàng phát sáng, chữ trắng đậm: `"Trântrân đã chia sẻ buổi lễ 🙏"` hoặc `"ThuỳsDỉ dâng hương, cầu bình an (x2)"`.
- **Nhãn tên Nhân vật & Bong bóng Chat Cầu Nguyện (`#labels-layer`):**
  - **Nhãn tên (`name-tag`):** Khung đen mờ nhỏ gọn (`rgba(0,0,0,0.68)`), chữ trắng `11px`, bo tròn, gắn ngay trên đầu mỗi nhân vật. Với 4 vị trí Đệm VIP hàng đầu thì có số thứ tự `1. Hoàng Quân`, `2. thu.tr`... Với nhân vật Solo Dâng Hương thì khung tên nổi bật hơn kèm icon hoa hồng/nhang.
  - **Bong bóng Chat (`speech-bubble`):** Nền trắng tinh (`#ffffff`), chữ đen đậm (`#1a1a1a`), bo góc `10px`, có mũi tên tam giác nhỏ chỉ xuống đầu nhân vật, hiệu ứng pop-in mượt mà.

### 2.2. `public/js/ui/HudManager.js` (DOM Object Pooling chống giật lag)
- Quản lý cập nhật Bảng `TẤM LÒNG THÀNH`, bộ đếm `Vòng lạy`, `Top Banner Toast`.
- **Tối ưu hiệu năng DOM:** Tạo sẵn 1 Pool các thẻ `name-tag` và `speech-bubble`, chỉ cập nhật `transform: translate3d(x, y, 0)` và `opacity` theo tọa độ từ `CrowdSystem.js`. Khi vào chế độ **Spotlight Solo Dâng Hương**, tự động ẩn toàn bộ nhãn tên của đám đông và chỉ hiện nhãn tên + bong bóng cầu nguyện của nhân vật Solo.

### 2.3. `public/js/audio/AudioTtsManager.js` (Nhạc Thiền, Chuông Chùa & Giọng Đọc AI Tiếng Việt)
1. **Nhạc nền đàn tranh / sáo trúc tịnh tâm (Procedural Ambient Pentatonic Melody):**
   - Dùng Web Audio API tổng hợp tiếng đàn tranh / sáo trúc ngũ cung êm dịu chạy nền liên tục (giống hệt giai điệu nhẹ nhàng trong video mẫu) mà không cần file mp3 bản quyền.
2. **Tiếng Đại Hồng Chung (`playTempleBell()`):**
   - Khi nhân vật Solo quỳ xuống dâng hương trước bàn thờ, phát tiếng chuông chùa trầm hùng ngân vang (`Boong...`).
3. **Giọng đọc AI Tiếng Việt (`speakVietnamese(text)`):**
   - Ưu tiên phát qua luồng âm thanh `/api/tts?text=...` (Google TTS tiếng Việt chuẩn tự nhiên) kết hợp fallback sang `window.speechSynthesis` (`lang = 'vi-VN'`).
   - Đọc rõ ràng câu chúc khi có người dâng hương: *"Dâu Việt nhà Trung đã dâng hương, chúc bạn tiền vào như nước"*.

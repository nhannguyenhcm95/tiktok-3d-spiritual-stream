# Role: 01 - Backend, Leaderboard & Spotlight Queue Engineer

## 1. Strict File Scope Rules (Phạm vi file nghiêm ngặt)
- **QUYỀN GHI (Write Access):** Toàn bộ file trong `server/**` (`server/index.js`, `server/tiktokConnector.js`, `server/leaderboardEngine.js`, `server/eventQueue.js`, `server/mockSimulator.js`) và cập nhật `STATUS.md`.
- **QUYỀN ĐỌC (Read-Only):** `CONTRACT.md`, `package.json`, `.env`, `STATUS.md`.
- **CẤM CHẠM VÀO (Forbidden):** Không tạo hoặc sửa bất kỳ file nào trong `public/**`.

## 2. Nhiệm vụ kỹ thuật chi tiết

### 2.1. `server/leaderboardEngine.js` (Thuật toán Đệm VIP & Bảng Tấm Lòng Thành)
- Lưu danh sách người dùng tương tác trong phiên Live (`Map<uniqueId, UserRecord>`).
- Mỗi `UserRecord` gồm: `{ uniqueId, nickname, coins, robeType, slotIndex, lastActive }`.
  - `robeType` phân bổ ngẫu nhiên hoặc theo cấp độ: `"GREY"` (Áo lam), `"WHITE"` (Áo dài trắng), `"BROWN"` (Áo nâu), `"MONK_YELLOW"` (Áo vàng sư thầy).
- **Tính toán VIP & Chasers:**
  - Sắp xếp giảm dần theo `coins`.
  - **Top 1 -> Top 5 (`vipSeats`):** Ngồi trên 5 đệm đỏ VIP hàng đầu (4 đệm hiển thị trực diện trên sân khấu và mốc hạng 5 làm chuẩn). Nếu chưa đủ 5 người có xu, tạo sẵn các vị trí mặc định (VD: Hạng 1: 320 xu, Hạng 2: 280 xu, Hạng 3: 250 xu, Hạng 4: 220 xu, Hạng 5: 204 xu) để bảng xếp hạng luôn sinh động ngay từ đầu.
  - **Mốc chuẩn (`fifthSeatCoins`):** Bằng số xu của người đứng Hạng 5.
  - **Danh sách bám đuổi (`chasers`):** Lấy 4 người đứng tiếp theo (từ Hạng 6 đến Hạng 9 hoặc 7 đến 10), tự động tính:
    `coinsNeeded = Math.max(1, fifthSeatCoins - user.coins + 1)`
    để hiển thị câu: `"còn XX xu để lên đệm"`.
  - **Danh sách đám đông (`crowdMembers`):** Tối đa 48 người đang hoạt động gần nhất được gán `slotIndex` từ `0` đến `47` ở hai bên thảm đỏ.

### 2.2. `server/eventQueue.js` (Hàng đợi Spotlight Solo Dâng Hương)
- Khi có sự kiện `gift` (tặng quà):
  - Đưa vào hàng đợi `spotlightQueue`.
  - Mỗi sự kiện `spotlight_incense` cần **4.8 giây** để nhân vật bước lên thảm đỏ, quỳ lạy và đọc TTS xong. Do đó, `eventQueue` chỉ phát sự kiện `spotlight_incense` tiếp theo sau khi sự kiện trước đã chạy xong (tránh 2 người đè lên nhau trên thảm đỏ).
  - Tự động ghép câu chúc ngẫu nhiên vào trường `ttsText`:
    - *"[Nickname] đã gửi tặng chùa [Tên quà], chúc bạn tâm an trí sáng."*
    - *"[Nickname] đã dâng hương, chúc bạn tiền vào như nước."*
    - *"[Nickname] đã dâng hương, chúc bạn sớm có người yêu."*
    - *"[Nickname] đã dâng hương, chúc gia đình vạn sự bình an, học hành đỗ đạt."*

### 2.3. `server/tiktokConnector.js` (Kết nối TikTok Live)
- Dùng `WebcastPushConnection` từ `tiktok-live-connector`:
  - `member` (Vào phòng) & `like`: Thêm user vào `crowdMembers` nếu còn chỗ trống.
  - `share`: Phát sự kiện `top_banner` với nội dung `"[Nickname] đã chia sẻ buổi lễ 🙏"`.
  - `chat`: Thêm user vào đám đông và phát ngay sự kiện `chat_bubble` để hiện bong bóng lời cầu nguyện trên đầu nhân vật đó.
  - `gift`: Bỏ qua nếu `giftType === 1 && !repeatEnd`. Cộng xu vào `leaderboardEngine`, phát `top_banner` (`"[Nickname] dâng hương, cầu bình an (x[repeatCount])"`), cập nhật `crowd_sync` và đẩy vào `spotlightQueue`.

### 2.4. `server/mockSimulator.js` (Giả lập Phòng Live Đông Đúc Như Thật)
- Khởi tạo sẵn 44 Phật tử trong đám đông + Top 10 bảng xếp hạng (giống hệt video mẫu: *Hoàng Quân, thu.tr, kjen, xìn gói cuối, Von'S Tea, Joon, Mạnh Trần, Viviannetran, Nguyễn Thịnh, Thúy Đỉ, 24th2, Nhân skay, Xoài Non...*).
- Khi `AUTO_MOCK=true`:
  - Mỗi **1.2 giây**: Chọn ngẫu nhiên 1-2 người trong đám đông bắn `chat_bubble` với các câu cầu nguyện chân thực (*"cầu thi tốt 🍀"*, *"Mong bình an"*, *"nam mô a di đà phật"*, *"A di đà phật"*, *"cho con thi qua 6 môn"*, *"cầu cho live của con viral"*, *"ƯỚC CÓ HÍ"*).
  - Mỗi **5.5 giây**: Bắn 1 sự kiện `top_banner` chia sẻ buổi lễ.
  - Mỗi **11 giây**: Bắn 1 sự kiện `spotlight_incense` (tặng quà dâng hương) để kích hoạt hiệu ứng ẩn đám đông -> 1 người bước lên thảm đỏ lạy Phật -> đọc TTS.

### 2.5. `server/index.js`
- Phục vụ static `public/`, Socket.io và các API điều khiển:
  - `POST /api/config`: Đổi `tiktokUsername` hoặc bật/tắt `autoMock`.
  - `POST /api/mock/:type`: Kích hoạt nhanh `CHAT`, `SHARE`, `GIFT_SMALL`, `GIFT_VIP` từ Debug Panel.
  - `GET /api/tts`: Proxy chuyển văn bản tiếng Việt sang audio stream (Google Translate TTS API miễn phí `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=...`) để trình duyệt và OBS phát được giọng đọc tiếng Việt mượt mà 100% cả khi máy không cài sẵn voice tiếng Việt.

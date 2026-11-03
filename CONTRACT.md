# PROJECT CONTRACT: TIKTOK LIVE INTERACTIVE BUDDHIST HALL (CHÁNH ĐIỆN DÂNG HƯƠNG & ĐÁM ĐÔNG QUỲ LẠY)

## 1. Mục tiêu & Cơ chế Cốt lõi (Chuẩn 100% theo Video Mẫu)
Xây dựng ứng dụng Web 3D/2.5D Tương tác Livestream TikTok tỷ lệ dọc **9:16 (1080x1920)** cho phép hàng chục khán giả xem Live xuất hiện trực tiếp trong Chánh Điện để cùng quỳ lạy, bình luận cầu nguyện, chia sẻ buổi lễ và tặng quà dâng hương.

### 5 Cơ chế Tương tác & Kiếm tiền (Monetization Loops) bắt buộc:
1. **Hệ thống Đám đông Khán giả (Crowd & VIP Cushion System):**
   - **4-5 Đệm Ngồi VIP (Hàng đầu sát bàn thờ Phật):** Dành riêng cho Top 1 -> Top 5 người có tổng xu tặng quà cao nhất phiên Live (hiển thị rõ thứ hạng `1. Tên`, `2. Tên`... trên đầu).
   - **Đám đông Phật tử (40–60 chỗ đứng hai bên thảm đỏ):** Khán giả vào xem, thả tim, chia sẻ hoặc comment sẽ được cấp 1 nhân vật mặc áo lam / áo dài trắng / áo nâu / áo vàng sư thầy đứng ở hai bên cánh gà, gắn tên TikTok trên đầu.
   - **Chu kỳ Đồng bộ Quỳ Lạy (Synchronized Bowing Loop):** Tất cả nhân vật cùng thực hiện nhịp nhàng: *Đứng chắp tay -> Quỳ gối -> Cúi đầu lạy sát đất -> Ngồi dậy -> Đứng lên*. Mỗi chu kỳ cập nhật bộ đếm `Vòng lạy: XX`.

2. **Chế độ "Spotlight Solo Dâng Hương" (Khi có người Tặng Quà / Gift):**
   - Khi nhận sự kiện `GIFT` (từ hàng đợi ưu tiên):
     - **Bước 1 (Fade-out Crowd):** Toàn bộ đám đông hai bên và trên đệm VIP mờ dần (`opacity -> 0` trong 0.45s) để nhường trọn khung hình.
     - **Bước 2 (Solo Walk & Bow):** Nhân vật của người tặng quà xuất hiện ở cuối **Thảm Đỏ Hoa Sen** chính giữa, bước đi trang nghiêm lên trước Lư Hương, dừng lại chắp tay và quỳ lạy. Trên đầu hiện tên + icon quà (VD: `Dâu Việt nhà Trung (モン)` hoặc `rose 🌹`).
     - **Bước 3 (VFX + Chuông + Giọng đọc TTS Tiếng Việt):** Lư hương bùng sáng hào quang vàng kim, nhang mới cắm vào lư, tiếng Đại Hồng Chung ngân vang kèm giọng đọc AI (TTS) đọc câu chúc:
       - *"[Nickname] đã gửi tặng chùa [Tên quà], chúc bạn tâm an trí sáng!"*
       - *"[Nickname] đã dâng hương, chúc bạn tiền vào như nước / chúc bạn sớm có người yêu / vạn sự hanh thông!"*
     - **Bước 4 (Fade-in Crowd):** Sau ~4.5 giây, đám đông hiện rõ trở lại (`opacity -> 1`) và cập nhật lại vị trí Đệm VIP nếu người tặng vừa vượt mốc xu.

3. **Bảng "TẤM LÒNG THÀNH" (Thuật toán Kích thích Đua Top Lên Đệm):**
   - Đặt ở góc trên bên phải, hiển thị:
     - Dòng tiêu đề: **TẤM LÒNG THÀNH**
     - Dòng mốc chuẩn: **`Đệm cuối (hạng 5) có [X] xu`** (lấy số xu của người đang giữ vị trí hạng 5; nếu chưa đủ 5 người donate thì mặc định mốc cơ sở là `50 xu`).
     - Hiển thị danh sách 4 người đang bám đuổi ngay phía dưới (Hạng 6 -> Hạng 9 hoặc Hạng 7 -> 10), mỗi dòng tính toán tự động:
       - `[Hạng]. [Nickname] — [Số xu] 🪙`
       - Dòng phụ kích thích: **`còn [Mốc hạng 5 - Số xu hiện tại + 1] xu để lên đệm`**

4. **Bong bóng Chat Cầu Nguyện (Realtime Speech Bubbles):**
   - Khi khán giả comment trên Live (VD: *"cầu thi tốt"*, *"Mong bình an"*, *"nam mô a di đà phật"*, *"cho con thi qua 6 môn"*), bong bóng chat nền trắng viền vàng bo tròn hiện ngay phía trên đầu nhân vật của người đó trong 4.5 giây.

5. **Banner Thông báo Đỉnh màn hình (Top Toast Notification):**
   - Hiển thị mượt mà khi có người chia sẻ buổi lễ (`"[Nickname] đã chia sẻ buổi lễ 🙏"`) hoặc dâng hương combo (`"[Nickname] dâng hương, cầu bình an (x2)"`).

---

## 2. Cấu trúc Cây Thư Mục Chuẩn (Directory Tree)

```text
project-root/
├── CONTRACT.md
├── STATUS.md
├── MASTER_PROMPT.md
├── package.json
├── .env.example
├── server/
│   ├── index.js              # Express + Socket.io + Static + REST API + TTS Proxy
│   ├── tiktokConnector.js    # Kết nối tiktok-live-connector (chat, gift, share, like, member)
│   ├── leaderboardEngine.js  # Quản lý Điểm/Xu, Top 5 Đệm VIP, Top bám đuổi & tính xu thiếu
│   ├── eventQueue.js         # Hàng đợi Spotlight Dâng Hương (tránh đè animation khi nhiều gift)
│   └── mockSimulator.js      # Giả lập 50 khán giả comment, share, tặng quà liên tục để test
└── public/
    ├── index.html            # Khung 9:16 (1080x1920), DOM Layers & Importmap Three.js + GSAP
    ├── css/
    │   └── style.css         # Giao diện Hoàng Kim, Bảng Tấm Lòng Thành, Bong bóng Chat, Thảm đỏ
    └── js/
        ├── main.js           # Entry point: Socket.io -> Window Event Bus + Debug Panel (Phím D)
        ├── 3d/
        │   ├── SceneManager.js     # Cảnh Chánh Điện Hoàng Kim, Tượng Phật, Bàn thờ, Lư hương, Nến
        │   ├── CrowdSystem.js      # Quản lý 50 Phật tử + 5 Đệm VIP + Nhân vật Solo bước đi & quỳ lạy
        │   └── AltarVfxManager.js  # Hào quang Phật, Khói hương, Nến lung linh, Hoa sen thảm đỏ
        ├── ui/
        │   └── HudManager.js       # Bảng Tấm Lòng Thành, Top Toast, Bong bóng Chat Pooling, Vòng lạy
        └── audio/
            └── AudioTtsManager.js  # Nhạc nền tịnh tâm, Tiếng Đại Hồng Chung, Mõ & Giọng đọc AI (TTS)
```

---

## 3. Chuẩn Giao Tiếp Socket.io (Backend -> Frontend)

1. **`crowd_sync`**: Đồng bộ danh sách người trên Đệm VIP, Bảng Tấm Lòng Thành và Đám đông:
```json
{
  "vipSeats": [
    { "rank": 1, "uniqueId": "u1", "nickname": "Hoàng Quân", "coins": 520, "robeType": "WHITE" },
    { "rank": 2, "uniqueId": "u2", "nickname": "thu.tr", "coins": 380, "robeType": "GREY" },
    { "rank": 3, "uniqueId": "u3", "nickname": "kjen", "coins": 290, "robeType": "BROWN" },
    { "rank": 4, "uniqueId": "u4", "nickname": "xìn gói cuối", "coins": 240, "robeType": "WHITE" },
    { "rank": 5, "uniqueId": "u5", "nickname": "Minh Tâm", "coins": 204, "robeType": "MONK_YELLOW" }
  ],
  "fifthSeatCoins": 204,
  "chasers": [
    { "rank": 6, "nickname": "Von'S Tea", "coins": 158, "coinsNeeded": 47 },
    { "rank": 7, "nickname": "Joon", "coins": 150, "coinsNeeded": 55 },
    { "rank": 8, "nickname": "Mạnh Trần", "coins": 138, "coinsNeeded": 67 },
    { "rank": 9, "nickname": "Viviannetran", "coins": 136, "coinsNeeded": 69 }
  ],
  "crowdMembers": [
    { "uniqueId": "c1", "nickname": "Nguyễn Thịnh", "robeType": "GREY", "slotIndex": 0 }
  ]
}
```

2. **`chat_bubble`**: Khi có người bình luận cầu nguyện:
```json
{
  "id": "chat_101",
  "uniqueId": "c1",
  "nickname": "Nguyễn Thịnh",
  "comment": "cầu thi tốt 🍀",
  "slotIndex": 0,
  "isVip": false
}
```

3. **`spotlight_incense`**: Khi có người tặng quà (chạy tuần tự từng người qua Queue):
```json
{
  "id": "gift_202",
  "uniqueId": "u99",
  "nickname": "Dâu Việt nhà Trung (モン)",
  "giftName": "Rosa",
  "diamondCount": 10,
  "repeatCount": 1,
  "robeType": "GREY",
  "ttsText": "Dâu Việt nhà Trung đã dâng hương, chúc bạn tiền vào như nước"
}
```

4. **`top_banner`**: Khi có người chia sẻ Live hoặc dâng hương:
```json
{
  "text": "Trântrân đã chia sẻ buổi lễ 🙏",
  "type": "SHARE | INCENSE"
}
```

---

## 4. Chuẩn DOM IDs Bắt Buộc Trong `public/index.html`
- `#app-wrapper`: Khung dọc 9:16 (`aspect-ratio: 9/16`, nền Chánh Điện hoàng kim).
- `#webgl-container`: Chứa canvas 3D Three.js.
- `#labels-layer`: Lớp DOM dùng Object Pooling hiển thị nhãn tên người xem và Bong bóng chat trắng.
- `#hud-layer`:
  - `#temple-badge`: Góc trái trên (`Tâm An Lạc...`).
  - `#top-banner-toast`: Khung thông báo giữa màn hình phía dưới tượng Phật (`"Trântrân đã chia sẻ buổi lễ 🙏"`).
  - `#tam-long-thanh-panel`: Bảng **TẤM LÒNG THÀNH** góc phải trên:
    - `#fifth-seat-info`: Hiển thị `"Đệm cuối (hạng 5) có 204 xu"`.
    - `#chasers-list`: Danh sách người bám đuổi kèm dòng `"còn XX xu để lên đệm"`.
    - `#bow-counter`: Hiển thị `"Vòng lạy: 45"`.
- `#debug-panel`: Bảng điều khiển ẩn (bật/tắt bằng phím `D`).

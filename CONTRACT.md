# PROJECT CONTRACT: 3D TikTok Interactive Spiritual Stream (Temple & Church)

## 1. Cấu trúc cây thư mục bắt buộc (Directory Tree)
Toàn bộ dự án sử dụng ES Modules (`type="module"` trên Frontend) và CommonJS trên Backend:

```text
project-root/
├── CONTRACT.md
├── STATUS.md
├── package.json
├── .env.example
├── server/
│   ├── index.js              # Express + Socket.io Server + Static serving
│   ├── tiktokConnector.js    # Kết nối tiktok-live-connector + Auto reconnect
│   ├── eventQueue.js         # Hàng đợi chống nghẽn (Rate Limiter & Priority Queue)
│   └── mockSimulator.js      # Bộ giả lập tự động bắn event khi chưa bật Live
└── public/
    ├── index.html            # Giao diện chính tỷ lệ 9:16 (1080x1920)
    ├── css/
    │   └── style.css         # CSS Safe-zone TikTok, hiệu ứng HUD, Debug Panel
    └── js/
        ├── main.js           # Entry point: Nối Socket.io -> Window Event Bus + Debug Panel
        ├── 3d/
        │   ├── SceneManager.js    # Khởi tạo Three.js, Camera Sway, Lighting, Render loop
        │   ├── ProceduralAssets.js# Dựng hình 3D: Mõ, Chuông, Lư hương, Nhang, Đèn, Tượng/Thánh giá
        │   └── VfxManager.js      # Hạt khói (Particles), Hào quang, Shockwave, Chữ 3D bay lên
        ├── ui/
        │   └── HudManager.js      # Quản lý Bảng công đức, Toast thông báo, Lời cầu nguyện
        └── audio/
            └── SoundSynth.js      # Web Audio API Synthesizer (Tiếng mõ, chuông, nhạc nền thiền)
```

## 2. Chuẩn giao tiếp Socket.io (Backend -> Frontend)
- **Kênh phát sự kiện tương tác:** `stream_event`
- **Cấu trúc JSON Payload bắt buộc:**
```json
{
  "id": "evt_1730000001",
  "timestamp": 1730000000000,
  "actionType": "WOODEN_FISH | INCENSE | BELL | LANTERN | PRAYER_TEXT",
  "user": {
    "uniqueId": "user_tiktok_id",
    "nickname": "Thiện Nhân",
    "avatarUrl": "[https://via.placeholder.com/100](https://via.placeholder.com/100)"
  },
  "payload": {
    "comment": "Cầu bình an cho gia đình",
    "giftName": "Rose",
    "diamondCount": 1,
    "repeatCount": 1,
    "intensity": 1
  }
}
```
- **Kênh cập nhật trạng thái phòng:** `server_status`
```json
{
  "connected": true,
  "tiktokUsername": "kenh_tiktok",
  "autoMock": true,
  "totalMerit": 1250
}
```

## 3. Chuẩn giao tiếp Window Event Bus (Nội bộ Frontend)
Để các module 3D, UI và Audio hoạt động độc lập không bị lỗi import chéo, `public/js/main.js` sẽ chuyển tiếp dữ liệu qua `window.dispatchEvent`:

1. **`window.addEventListener('TIKTOK_ACTION', (e) => { const data = e.detail; })`**
   - `e.detail` chứa đúng JSON Payload của `stream_event`.
   - `SceneManager.js`, `HudManager.js`, và `SoundSynth.js` cùng lắng nghe sự kiện này để tự xử lý phần việc của mình.
2. **`window.addEventListener('THEME_CHANGE', (e) => { const theme = e.detail.theme; })`**
   - `theme` nhận giá trị `"TEMPLE"` (Chùa) hoặc `"CHURCH"` (Nhà thờ).
3. **`window.addEventListener('AUDIO_TOGGLE', (e) => { const muted = e.detail.muted; })`**
   - Bật/tắt âm thanh синтезатор (Synthesizer).

## 4. Chuẩn DOM IDs trong `public/index.html`
File `public/index.html` BẮT BUỘC phải có các thẻ với ID chính xác sau:
- `#app-wrapper`: Khung chứa chính tỷ lệ 9:16 (`width: 100vw; height: 100vh; max-width: 540px; aspect-ratio: 9/16` hoặc full màn hình OBS).
- `#webgl-container`: Thẻ `div` nằm dưới cùng (`z-index: 1`) để `SceneManager.js` gắn `renderer.domElement`.
- `#hud-layer`: Thẻ `div` đè lên trên (`z-index: 10; pointer-events: none`) chứa:
  - `#merit-counter`: Hiển thị tổng công đức.
  - `#leaderboard-list`: Danh sách Top 3 người tích công đức.
  - `#toast-container`: Vùng hiện thông báo người thắp nhang / tặng quà.
  - `#prayer-wall`: Vùng hiển thị câu cầu nguyện nổi bật.
- `#debug-panel`: Bảng điều khiển ẩn (`z-index: 100`, bật/tắt bằng phím `D`).

## 5. Chuẩn Export của các Module ES6
- `public/js/3d/SceneManager.js`: `export class SceneManager { constructor(containerEl) {} init() {} setTheme(themeName) {} }`
- `public/js/ui/HudManager.js`: `export class HudManager { constructor() {} init() {} }`
- `public/js/audio/SoundSynth.js`: `export class SoundSynth { constructor() {} init() {} unlockAudio() {} }`
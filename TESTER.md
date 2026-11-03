# QUY CHUẨN KIỂM THỬ TOÀN DIỆN (TESTER SPECIFICATION & QA PROTOCOL)
**Dự án:** Niệm Phật Cầu An & Đạo Tràng Siêu Độ (Chùa An Lạc 3D)  
**Tiêu chuẩn:** Zero-Error, Strict Contract Verification & Live-Stream Ready

---

## 1. MỤC TIÊU KIỂM THỬ (QA OBJECTIVES)
1. **Kiểm tra cú pháp & tính tương thích ES Modules:** Đảm bảo toàn bộ mã nguồn Client (`js/`) và Backend (`server/`) không có bất kỳ lỗi SyntaxError hay ReferenceError.
2. **Kiểm tra khớp nối Interface (Contract & Method Signature Verification):** Mọi hàm được gọi từ `main.js` tới các module con (`TempleWorld`, `EnvironmentVfx`, `CollisionSystem`, `PlayerController`, `AiPilgrimsManager`, `HandSealSystem`, `SieuDoRitual`, `TempleActivities`, `WebAudioSynth`, `ShareCardExporter`) phải tồn tại thực tế và khớp tham số.
3. **Kiểm tra toàn vẹn DOM (DOM Integrity):** Toàn bộ các element ID và class được query trong `js/main.js` và các activities phải tồn tại chính xác trong `index.html` và được định nghĩa CSS trong `css/style.css`.
4. **Kiểm tra Web Server & API Endpoints:** Chạy server `server/index.js`, kiểm tra endpoint `/`, `/api/status`, `/api/players`, và kiểm tra WebSocket connection `io()`.
5. **Kiểm tra Logic 5 Hoạt Động & Hệ Thống Kết Ấn:**
   - Hoạt động Thắp Hương (1 & 3 nén, tăng khói hương, cộng công đức).
   - Hoạt động Thỉnh Đại Hồng Chung (vòng hào quang co lại, tính rating, ngân chuông).
   - Hoạt động Gõ Mõ 30s (tính nhịp, đếm ngược, tổng kết điểm Tâm An 0-100).
   - Hoạt động Viết Sớ Cầu An (lọc từ, spawn lụa Bồ Đề hoặc đèn hoa đăng hồ sen).
   - Hoạt động Xin Quẻ (đủ 40 quẻ thiện lành, hiển thị đúng cấu trúc).
   - Hệ thống Kết Ấn (4 đồ hình mudra trên Canvas, nối điểm phát sáng, bùng nổ sóng linh quang).
6. **Kiểm tra Luồng Dữ Liệu Quà Tặng TikTok:** Đảm bảo khớp bảng giá quà tặng (1 xu đến 449.999 xu) kích hoạt đúng animation và VFX.

---

## 2. MA TRẬN PHÂN TÍCH TƯƠNG THÍCH MÃ NGUỒN (INTERFACE AUDIT MATRIX)

| Module Client | Các hàm bắt buộc phải có | Trạng thái yêu cầu |
| :--- | :--- | :--- |
| `TempleWorld.js` | `getColliders()`, `spawnFloatingLantern(name)`, `update(delta)`, `interactionZones` | MUST PASS |
| `EnvironmentVfx.js` | `update(delta, playerPos)`, `triggerShockwave(pos, color)`, `spawnLotusStep(x, z)`, `purifyLinhQuang()` | MUST PASS |
| `CollisionSystem.js` | `addColliders(colliders)`, `checkMove(currentPos, nextPos, radius)` | MUST PASS |
| `PlayerController.js`| `update(delta)`, `getPosition()`, `setAnimation(name, duration)`, `setJoystickInput(x, y)`, `setDevoteeName(name)` | MUST PASS |
| `AiPilgrimsManager.js`| `update(delta, playerPos)` | MUST PASS |
| `HandSealSystem.js` | `open(index)`, `close()`, `setSealIndex(index)`, `resizeCanvas()` | MUST PASS |
| `SieuDoRitual.js` | `chantOnce(text)`, `performSieuDoRitual()`, `processGiftEvent(giftData)` | MUST PASS |
| `TempleActivities.js`| `lightIncense(count, name)`, `startBellMiniGame(el)`, `strikeBell()`, `stopBellMiniGame()`, `startWoodenFishSession(onTick, onComplete)`, `tapWoodenFish()`, `finishWoodenFishSession(onComplete)`, `submitPrayer(data)`, `drawFortuneStick()` | MUST PASS |
| `WebAudioSynth.js` | `init()`, `startAmbient()`, `setMuted(muted)`, `playWoodenFish()`, `playGreatBell()`, `playSingingBowl(freq)`, `playVajraBell()`, `playChantDrone()` | MUST PASS |
| `ShareCardExporter.js`| `exportCard(data)` | MUST PASS |

---

## 3. CHECKLIST KIỂM TRA DOM & GIAO DIỆN

- [ ] `#canvas-container`
- [ ] `#floating-text-container`
- [ ] `#toast-notification`
- [ ] `#hud-player-name`, `#stat-chant-count`, `#stat-merit-points`
- [ ] `#btn-audio-toggle`, `#audio-icon`, `#btn-open-merit`, `#btn-open-share`
- [ ] `#interaction-prompt`
- [ ] `#joystick-zone`, `#joystick-thumb`
- [ ] `#btn-chant-once`, `#btn-open-seal`, `#btn-interact`, `#interact-icon`, `#interact-text`
- [ ] `#modal-welcome`, `#input-welcome-name`, `#btn-start-game`
- [ ] `#modal-handseal`, `#btn-close-handseal`, `#seal-tabs`, `#handseal-canvas`, `#seal-display-name`, `#seal-display-meaning`
- [ ] `#modal-incense`, `#btn-close-incense`, `#btn-confirm-incense`
- [ ] `#modal-bell`, `#btn-close-bell`, `#bell-hit-ring`, `#btn-strike-bell`, `#bell-rating-result`
- [ ] `#modal-woodenfish`, `#btn-close-woodenfish`, `#mo-time-display`, `#mo-score-display`, `#mo-tap-btn`, `#mo-rating-text`
- [ ] `#modal-prayer`, `#btn-close-prayer`, `#prayer-sender`, `#prayer-content`, `#btn-submit-prayer`
- [ ] `#modal-fortune`, `#btn-close-fortune`, `#fortune-tube`, `#fortune-result-card`, `#fortune-title`, `#fortune-poem`, `#fortune-meaning`, `#btn-draw-fortune`
- [ ] `#modal-merit`, `#btn-close-merit`, `#scroll-devotee-name`, `#scroll-chant-count`, `#scroll-incense-count`, `#scroll-taman-score`, `#scroll-purified-count`, `#btn-export-share-card`

---

## 4. QUY TRÌNH THỰC THI KIỂM THỬ (EXECUTION STEPS)
1. Chạy kịch bản kiểm tra tự động `test_audit.js` để quét toàn bộ DOM, Method Signature và Cú pháp.
2. Khởi chạy Server Node.js trong môi trường sandbox và dùng HTTP probe kiểm tra các route tĩnh và API.
3. Nếu phát hiện bất kỳ điểm sai lệch hoặc thiếu sót nào, sửa chữa ngay lập tức và tái kiểm tra.
4. Báo cáo chi tiết kết quả thử nghiệm cho người dùng.


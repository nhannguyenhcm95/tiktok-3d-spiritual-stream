# Role: 02 - 3D Golden Sanctuary & Crowd Animation Engineer

## 1. Strict File Scope Rules (Phạm vi file nghiêm ngặt)
- **QUYỀN GHI (Write Access):** Chỉ tạo và sửa file trong `public/js/3d/**` (`SceneManager.js`, `CrowdSystem.js`, `AltarVfxManager.js`) và cập nhật `STATUS.md`.
- **QUYỀN ĐỌC (Read-Only):** `CONTRACT.md`, `STATUS.md`.
- **CẤM CHẠM VÀO (Forbidden):** `server/**`, `public/index.html`, `public/css/**`, `public/js/ui/**`, `public/js/audio/**`, `public/js/main.js`.

## 2. Nhiệm vụ kỹ thuật chi tiết (Chuẩn 100% Thẩm mỹ Video Mẫu & Tối ưu 60FPS)

### 2.1. `public/js/3d/SceneManager.js` (Chánh Điện Hoàng Kim 9:16)
Thiết lập góc máy cố định đối xứng chính diện (Symmetrical Perspective Camera) chia khung hình 9:16 thành 2 nửa hoàn hảo như video:
1. **Nửa trên (Chánh Điện & Đại Phật Tượng Hoàng Kim):**
   - **Tượng Phật A Di Đà ngồi kiết già trên tòa sen vàng:** Tỷ lệ uy nghi, chất liệu vàng rực rỡ (`MeshStandardMaterial` với `color: 0xffd54f, emissive: 0xb87300, roughness: 0.25, metalness: 0.65`), tay bắt ấn Thiền định, ngực có chữ Vạn vàng.
   - **Vách hậu & Rèm đỏ:** Vách gỗ chạm khắc ánh vàng ấm phía sau, hai góc trên màn hình có rèm nhung đỏ viền tua rua vàng.
   - **Bàn thờ & Lư hương đồng phát sáng:** Chính giữa phía trước tượng Phật là bàn thờ chạm trổ, đặt Lư hương đồng tỏa sáng rực rỡ, hai bên là **2 bình sứ trắng cắm hoa cúc/sen trắng xanh** sum suê và hàng nến vàng lung linh.
2. **Nửa dưới (Sân Chánh Điện, 4 Đệm VIP & Thảm Đỏ Hoa Sen):**
   - **Sân gỗ/gạch đỏ trầm** có chiều sâu.
   - **Thảm đỏ hoa sen ở chính giữa (Center Red Carpet):** Trải dọc từ đáy màn hình lên tới trước bàn thờ, mặt thảm vẽ họa tiết hoa sen vàng kim và đường diềm vàng hai bên bằng `CanvasTexture` sắc nét.
   - **4 Đệm ngồi VIP (Tọa cụ đỏ viền vàng):** Đặt thành hàng ngang ngay phía trước bàn thờ (2 đệm bên trái thảm đỏ, 2 đệm bên phải thảm đỏ).

### 2.2. `public/js/3d/CrowdSystem.js` (Hệ thống 50 Phật tử + 4 VIP + Nhân vật Solo Dâng Hương)
- **Dựng hình Nhân vật 3D Chibi Đa Khớp nhìn từ sau lưng (Back-view Articulated Pilgrims):**
  - Gồm các bộ phận có khớp xoay: `torso` (vạt áo dài/áo tràng), `head` (búi tóc tròn có trâm cài cho nữ áo trắng/áo lam, hoặc đầu tròn cho sư thầy áo vàng/nâu), `leftArm`, `rightArm`, `kneelingBase`.
  - Hỗ trợ 4 kiểu trang phục giống hệt video:
    1. `GREY`: Áo tràng lam (xanh xám nhạt), búi tóc đen.
    2. `WHITE`: Áo dài trắng thanh lịch, tóc búi có trâm.
    3. `BROWN`: Áo tràng nâu trầm.
    4. `MONK_YELLOW`: Áo cà sa vàng cam của tiểu sư thầy.
- **Bố trí vị trí (Slot Layout):**
  - **4 vị trí VIP:** Ngồi trên 4 chiếc đệm đỏ hàng đầu.
  - **44 vị trí Đám đông:** Xếp thành các hàng so le ở hai bên cánh trái và cánh phải của thảm đỏ (chừa trống hoàn toàn lối đi thảm đỏ ở giữa).
- **Đồng bộ Chu kỳ Quỳ Lạy (Synchronized Bowing Loop - 6 giây/vòng):**
  - Mọi nhân vật trong đám đông và trên đệm VIP cùng thực hiện mượt mà bằng GSAP / Sine interpolation:
    - Giây 0.0 -> 1.2: Đứng/Ngồi thẳng lưng, hai tay chắp lễ.
    - Giây 1.2 -> 2.8: Quỳ xuống, gập thân và cúi đầu sát đất, hai tay mở úp xuống chiếu (Lạy Phật).
    - Giây 2.8 -> 4.2: Giữ tư thế lạy trang nghiêm.
    - Giây 4.2 -> 6.0: Nâng người ngồi dậy về tư thế chắp tay và phát sự kiện tăng `Vòng lạy`.
- **Hiệu ứng "Spotlight Solo Dâng Hương" (`triggerSpotlightIncense(data)`):**
  - Khi nhận sự kiện `SPOTLIGHT_INCENSE`:
    1. Làm mờ toàn bộ 44 nhân vật đám đông + 4 nhân vật VIP (`opacity` giảm từ `1` về `0` trong `0.45s`, đồng thời ẩn lớp nhãn tên đám đông).
    2. Xuất hiện **1 Nhân vật Solo** ở cuối thảm đỏ (`z` gần đáy màn hình).
    3. Nhân vật Solo bước đi uyển chuyển dọc theo giữa thảm đỏ tiến lên trước bàn thờ (trong `1.8s`), dừng lại trước lư hương, chắp tay rồi thực hiện động tác **Quỳ cúi lạy sâu** (trong `2.4s`).
    4. Sau khi lạy xong (`4.6s`), nhân vật Solo mờ dần và toàn bộ đám đông + VIP hiện rõ trở lại (`opacity: 1`).
- **Xuất tọa độ 2D (`getProjectedAnchors(camera)`):**
  - Cung cấp tọa độ màn hình `(x, y)` của từng nhân vật VIP, đám đông và nhân vật Solo để `HudManager.js` gắn nhãn tên và bong bóng chat chính xác trên đầu mà không tốn tài nguyên tạo/xóa Sprite 3D liên tục.

### 2.3. `public/js/3d/AltarVfxManager.js` (Hào Quang, Khói Hương & Ánh Nến)
- Vòng hào quang sau đầu tượng Phật tỏa sáng dịu nhẹ theo nhịp thở.
- Hệ thống hạt khói hương (`THREE.Points`) bay lên từ lư hương.
- Khi có sự kiện `SPOTLIGHT_INCENSE`: Kích hoạt hiệu ứng **Lư Hương Bùng Sáng** (luồng sáng vàng ấm + 3 nén nhang phát sáng cắm vào lư + hạt kim tuyến vàng bay lên).

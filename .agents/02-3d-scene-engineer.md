# Role: 02 - 3D Graphics & WebGL Engineer (Three.js / GSAP)

## 1. Mục tiêu vai trò
Thiết kế và lập trình không gian 3D tương tác thời gian thực tỷ lệ dọc (9:16), tự động dựng toàn bộ vật thể 3D bằng Procedural Geometry kết hợp chất liệu ánh sáng chân thực, hệ thống hạt khói hương (Particle System) và chuyển động vật lý mượt mà ở mức 60 FPS.

## 2. Strict File Scope Rules (Phạm vi file nghiêm ngặt)
- **QUYỀN GHI (Write Access):** Chỉ được tạo và sửa các file trong `public/js/3d/**` (`SceneManager.js`, `ProceduralAssets.js`, `VfxManager.js`) và cập nhật `STATUS.md`.
- **QUYỀN ĐỌC (Read-Only):** `CONTRACT.md`, `STATUS.md`.
- **CẤM CHẠM VÀO (Forbidden):** Tuyệt đối KHÔNG chạm vào `server/**`, `public/index.html`, `public/css/**`, `public/js/ui/**`, `public/js/audio/**`, `public/js/main.js`.

## 3. Yêu cầu kỹ thuật chi tiết cho từng file
Sử dụng `import * as THREE from 'three';` và `import gsap from 'gsap';` (được định nghĩa trong importmap của HTML). Code phải hoàn chỉnh 100%, không dùng hàm rỗng hay placeholder:

### 3.1. File `public/js/3d/ProceduralAssets.js` (Dựng mô hình 3D tự động)
Thiết kế các hàm tạo `THREE.Group` với chất liệu `MeshStandardMaterial` & `MeshPhysicalMaterial` (có độ bóng kim loại/gỗ trầm ấm):
1. **Không gian & Bàn thờ chính (`createAltarGroup()`):**
   - Bàn gỗ lim chạm khắc nhiều tầng ở trung tâm, nền gạch/đá phản chiếu ánh sáng mờ.
   - **Lư hương đồng lớn (Censer):** Đặt chính giữa bàn thờ, có hai tai rồng/hoa văn hai bên, chân đế và lớp tro xám bên trong để cắm nhang.
2. **Chế độ Chủ đề (`TEMPLE` vs `CHURCH`):**
   - **Group `TEMPLE` (Chùa):** Tượng Phật ngồi tòa sen vàng ở tầng trên cao + Vòng hào quang rực rỡ phía sau (`TorusGeometry` + các tia sáng phát quang xoay chậm).
   - **Group `CHURCH` (Nhà thờ):** Cây Thánh giá lớn phát sáng ấm áp trên bệ đá cao + Khung cửa kính màu (Stained Glass) tỏa luồng sáng God-rays và hai chân nến thờ hai bên.
3. **Bộ Mõ gỗ & Dùi gõ (`createWoodenFishGroup()`):**
   - Đặt ở góc phải tiền cảnh (tầng dưới) để khán giả nhìn rõ nhất.
   - Thân mõ gỗ tròn dẹp màu nâu đỏ bóng, có khe rỗng giữa, đặt trên đệm gấm đỏ. Dùi gỗ đặt nghiêng sẵn sàng gõ.
4. **Đại Hồng Chung / Chuông đồng (`createBellGroup()`):**
   - Đặt ở góc trái tiền cảnh, treo trên giá gỗ chạm khắc, đi kèm chày gỗ treo ngang phía trước để đâm vào chuông khi có sự kiện `BELL`.
5. **Hàm tạo Nén nhang / Ngọn nến động (`createIncenseOrCandle(nickname, theme)`):**
   - Nếu `TEMPLE`: Tạo nén nhang mảnh cắm vào lư hương, đỉnh nhang có đốm lửa đỏ rực (`MeshBasicMaterial` màu cam đỏ).
   - Nếu `CHURCH`: Tạo ngọn nến trắng đặt quanh bàn thờ với ngọn lửa vàng nhấp nháy.
   - Gắn kèm một `THREE.Sprite` (vẽ bằng HTML5 Canvas 2D) hiển thị khung bo tròn chứa tên `nickname` của khán giả ngay phía trên cây nhang/nến.
6. **Hàm tạo Đèn Hoa Đăng (`createSkyLantern(nickname, comment)`):**
   - Khối lồng đèn giấy phát sáng màu vàng cam ấm áp (có `PointLight` nhỏ bên trong hoặc `emissive` mạnh) kèm thẻ tên người thả bay từ từ lên bầu trời đêm.

### 3.2. File `public/js/3d/VfxManager.js` (Hạt khói, Sóng âm & Quản lý RAM)
1. **Hệ thống khói hương (`SmokeParticleSystem`):**
   - Tạo các hạt khói (`THREE.Points` với texture gradient tròn mềm tự vẽ bằng Canvas) bay lên từ lư hương, uốn lượn mềm mại theo hàm sóng `Math.sin(time + y)` và mờ dần khi lên cao.
2. **Hiệu ứng Gõ mõ (`triggerWoodenFishVfx(position)`):**
   - Tạo vòng sóng âm vàng kim (`RingGeometry`) lan rộng ra dưới mặt bàn rồi mờ dần.
   - Tạo `THREE.Sprite` chữ **"+1 Công Đức"** màu vàng kim bay vút lên theo trục Y rồi biến mất.
3. **Hạt bụi vàng không gian (`AmbientDust`):**
   - 150 hạt bụi sáng lơ lửng khắp khung hình 9:16 tạo chiều sâu huyền ảo.
4. **Phòng chống tràn RAM (Anti-Memory Leak - BẮT BUỘC):**
   - Giới hạn tối đa **30 cây nhang/nến** trên bàn thờ và **15 đèn hoa đăng** trên trời cùng lúc.
   - Khi vượt quá giới hạn hoặc khi đối tượng hết thời gian hiển thị (30 giây), BẮT BUỘC phải xóa khỏi `scene` và gọi đệ quy `.geometry.dispose()`, `.material.dispose()`, `.texture.dispose()` để OBS chạy 24/24 không bị tăng RAM.

### 3.3. File `public/js/3d/SceneManager.js` (Điều phối 3D, Camera 9:16 & GSAP)
1. **Bố cục Camera 9:16 & Ánh sáng:**
   - Góc máy chính diện hơi chếch từ dưới lên (Low-angle solemn view), tối ưu cho tỷ lệ dọc 9:16.
   - Ánh sáng: `AmbientLight` dịu nhẹ, `PointLight` vàng ấm tại lư hương và hào quang, kèm sương mù `THREE.FogExp2` tạo chiều sâu.
2. **Chuyển động Camera Sway (Chống TikTok quét AFK):**
   - Trong vòng lặp `animate()`, máy quay luôn lắc lư nhẹ nhàng theo hình sin (`Math.sin(elapsedTime * 0.5)`) như nhịp thở và vòng hào quang luôn xoay chậm để khung hình không bao giờ đứng yên.
3. **Lắng nghe Window Event Bus theo đúng `CONTRACT.md`:**
   - `window.addEventListener('TIKTOK_ACTION', (e) => ...)`:
     - `WOODEN_FISH`: Dùng GSAP xoay dùi gỗ đập vào mõ (0.08s) -> Mõ co giãn nảy nhẹ (elastic scale bounce) -> Gọi `vfx.triggerWoodenFishVfx()`.
     - `INCENSE`: Tạo nén nhang/nến mới bay từ trên xuống cắm vào lư hương bằng GSAP -> Kích hoạt khói hương dày hơn.
     - `BELL`: Dùng GSAP kéo chày gỗ lùi lại rồi đâm mạnh vào Đại Hồng Chung -> Chuông rung lắc (`rotation.z` dao động tắt dần) -> Hiệu ứng Camera Shake nhẹ + Bùng sáng `PointLight` vàng kim toàn cảnh.
     - `LANTERN` & `PRAYER_TEXT`: Thả đèn hoa đăng bay từ từ lên bầu trời đêm kèm câu cầu nguyện.
   - `window.addEventListener('THEME_CHANGE', (e) => ...)`: Chuyển đổi mượt mà giữa cảnh Chùa (`TEMPLE`) và Nhà thờ (`CHURCH`), đổi màu sương mù và ánh sáng tương ứng.

## 4. Quy tắc bàn giao (Sequential Handoff)
Hoàn thiện 3 file trong `public/js/3d/`, cập nhật `STATUS.md` đánh dấu Agent 02 `DONE`, sau đó chuyển sang vai trò `03-ui-audio-hud`.
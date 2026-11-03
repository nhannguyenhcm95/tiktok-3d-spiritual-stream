# TÀI LIỆU ĐẶC TẢ ĐỒ HỌA (ART & TECHNICAL GRAPHICS SPEC) CHO ANTIGRAVITY
**Mục tiêu:** Nâng cấp toàn bộ hệ thống hiển thị 3D (`SceneManager.js`, `CrowdSystem.js`, `AltarVfxManager.js`) để tái hiện **100% bố cục, ánh sáng điện ảnh (Cinematic Lighting), chất liệu đá - đồng cổ và đội hình đám đông quỳ lạy** như bức ảnh tham chiếu Chánh Điện Ngũ Phương Phật.

---

## PHẦN 1: CÂU LỆNH PROMPT ĐỂ DÁN TRỰC TIẾP VÀO ANTIGRAVITY

> **Cách dùng:** Bạn lưu bức ảnh mẫu vào thư mục `public/assets/chanh-dien-ref.jpg` (nếu muốn dùng chế độ Hybrid 2.5D) hoặc đính kèm ảnh cùng file này vào khung chat của Antigravity và dán đoạn lệnh sau:

```text
Hãy đọc kỹ file @GRAPHICS_ANTIGRAVITY_SPEC.md và bức ảnh mẫu đính kèm để nâng cấp toàn diện 3 file đồ họa trong `public/js/3d/` (`SceneManager.js`, `CrowdSystem.js`, `AltarVfxManager.js`) và `public/css/style.css`.

YÊU CẦU BẮT BUỘC:
1. Tái hiện chính xác bố cục "Đại Hùng Bảo Điện - Ngũ Phương Phật":
   - Kiến trúc tường đá xám cổ kính, 2 khung cửa sổ hoa văn chữ Thọ/hình học đối xứng 2 bên, hàng cột đá lớn hai bên cánh gà đón nắng chiếu xiên từ phải sang trái.
   - 5 Pho Tượng Phật ngồi trên đài sen vàng (1 Đại Phật trung tâm có phù điêu Hào Quang Mandala đồng cổ khổng lồ phía sau + 2 Phật nhị vị hai bên + 2 Phật tiểu vị ngoài cùng), chất liệu da bạc đá mờ (Brushed Pewter) kết hợp y áo đồng vàng cổ (Antique Bronze Gold).
   - Bàn thờ đá nhiều tầng phía dưới đặt các bình hoa sen/mẫu đơn hồng phấn và đèn bơ/nến vàng ấm.
2. Hệ thống Ánh sáng Điện ảnh & Đổ bóng (Cinematic God Rays & Long Shadows):
   - Ánh nắng chiều chiếu xiên góc từ hàng cột bên phải sang trái, tạo các luồng tia sáng (Volumetric God Rays) và bóng đổ dài sắc nét của từng Phật tử trên nền gạch đá xám lớn.
3. Đội hình Nhân vật & Chuyển động:
   - Giữa lối đi chính (Central Aisle): Vị Chủ Lễ / Nhân vật Spotlight mặc y Ca-sa vàng cam đứng chắp tay trang nghiêm ngay trước đài sen chính.
   - Hai bên lối đi (Left & Right Blocks): Đội hình 60-80 Phật tử đầu tròn, mặc áo tràng xám tro vắt một bên vai, xếp hàng ngay ngắn theo lưới (Grid), quỳ gối lộ bàn chân phía sau, hai tay chắp trước ngực, đồng bộ chu kỳ Quỳ Lạy mượt mà ở 60 FPS.
4. Viết đầy đủ 100% code (không viết rút gọn, không để TODO), hỗ trợ cả 2 chế độ: Full 3D PBR Procedural/GLB và Hybrid 2.5D Depth-Shadow để đạt độ chân thực tối đa.
```

---

## PHẦN 2: PHÂN TÍCH BỐ CỤC & BẢNG MÀU PBR (ART DIRECTION)

### 1. Bảng màu & Chất liệu Chuẩn (PBR Material Palette)
Antigravity phải sử dụng đúng mã màu Hex và thông số vật lý (`roughness`, `metalness`) dưới đây:

| Thành phần | Mã màu Hex | Roughness | Metalness | Mô tả chất liệu |
| :--- | :--- | :--- | :--- | :--- |
| **Thân Tượng Phật (Pewter Stone)** | `#8C9295` | $0.45$ | $0.60$ | Đá bạc ánh kim mờ, phản xạ dịu ánh nắng |
| **Y Áo Phật & Đài Sen (Antique Bronze)** | `#C59B5F` | $0.32$ | $0.85$ | Đồng vàng cổ đánh bóng nhẹ ở các nếp gấp |
| **Phù Điêu Mandala Sau Lưng Phật** | `#9E7B42` | $0.40$ | $0.80$ | Đồng chạm nổi hoa văn đồng tâm cổ kính |
| **Tường Đá & Cột Đá (Temple Stone)** | `#7D7B76` | $0.85$ | $0.05$ | Đá tảng xám tro ghép khít có vân nhám |
| **Sàn Gạch Đá Lớn (Slate Floor)** | `#686A6C` | $0.55$ | $0.15$ | Gạch đá phẳng có rãnh chia ô, hắt sáng nhẹ |
| **Áo Tràng Đám Đông (Monk Grey Robe)** | `#54595E` | $0.88$ | $0.02$ | Vải thô màu xám tro trầm mặc, lệch một bên vai |
| **Y Ca-sa Chủ Lễ / Spotlight (Saffron)** | `#D99B26` | $0.75$ | $0.10$ | Vải lụa/thô vàng nghệ ấm nổi bật giữa sảnh |
| **Ánh Nắng Xiên (Warm Sunlight)** | `#FFF1D0` | — | — | Ánh sáng mặt trời ấm áp chiếu từ hướng Đông-Nam |
| **Bóng Đổ Sàn Đá (Ambient Shadow)** | `#363B40` | — | — | Bóng đổ màu xám lạnh tương phản với nắng ấm |

---

## PHẦN 3: KIẾN TRÚC KỸ THUẬT 3D TRONG `SceneManager.js`

Để đạt chất lượng thị giác giống hệt ảnh mẫu mà vẫn chạy mượt $60\text{ FPS}$ trên trình duyệt và OBS, `SceneManager.js` cần được thiết kế với **2 lớp hiển thị kết hợp (Hybrid Photorealistic + Full 3D PBR)**:

### 1. Thiết lập Camera & Phối cảnh Đối xứng (One-Point Perspective)
* **Tỷ lệ khung hình:** Hỗ trợ linh hoạt cả khung dọc TikTok ($9:16$) và khung ngang chuẩn điện ảnh ($16:9$) mà không làm méo tượng Phật.
* **Thông số Camera:**
  * `FOV`: $38^\circ$ (tiêu cự tele nhẹ giúp nén không gian, làm tượng Phật trung tâm trông đồ sộ và uy nghiêm).
  * `Position`: $(0, 3.2, 16.5)$ — Đặt ở tầm mắt người đứng cuối chánh điện nhìn thẳng vào trục chính.
  * `LookAt`: $(0, 4.8, -6.0)$ — Hướng tâm vào giữa ngực pho Đại Phật và vị Sư áo vàng.

### 2. Dựng Kiến trúc Chánh Điện & Ngũ Phương Phật (`buildGrandSanctuary()`)
* **Tường Hậu Cung & Cửa Sổ Hoa Văn Chữ Thọ:**
  * Tạo bức tường hậu cung tại $z = -12$ cao $22\text{m}$ với Procedural Stone Bump Map (tạo rãnh gạch đá tự nhiên bằng `CanvasTexture`).
  * Hai bên tường hậu ($x = \pm 7.5$) khoét 2 khung cửa sổ dọc cao $11\text{m}$, bên trong gắn lưới hoa văn hình học Á Đông (Lattice Grid) có lớp `MeshBasicMaterial` phát sáng ngược (`#FFF8E7`) từ phía sau.
* **Hàng Cột Đá Hai Bên (Colonnade Pillars):**
  * Dựng 4 cặp cột đá vuông có rãnh dọc (Fluted Stone Pillars) ở $x = \pm 11.5$, khoảng cách giữa các cột theo trục $z$ là $4.5\text{m}$.
  * Chính khe hở giữa các cột bên phải ($x = +11.5$) là nơi luồng ánh sáng mặt trời chiếu xuyên qua tạo vệt nắng và bóng đổ sọc chéo trên sàn.
* **Quần thể 5 Pho Tượng Phật (Five-Buddha Altar Composition):**
  * **Pho Đại Phật Trung Tâm** tại $(0, 4.2, -10.0)$, tỷ lệ `scale = 2.6`:
    * Phía sau lưng gắn **Đĩa Hào Quang Mandala Đồng Cổ** đường kính $R = 5.2\text{m}$, tạo vân chạm nổi bằng các vòng tròn đồng tâm (Concentric Rings + Lotus Petals) kết hợp `bumpMap`.
    * Ngồi kiết già trên đài sen 3 tầng cánh vàng đồng.
    * Tạo hiệu ứng **2 chất liệu tách biệt**: Phần thân/khuôn mặt/bàn tay màu đá bạc (`#8C9295`), phần y áo vắt chéo qua vai trái màu vàng đồng cổ (`#C59B5F`).
  * **2 Pho Phật Nhị Vị (Trung bình)** tại $(\pm 4.6, 3.2, -10.2)$, `scale = 1.65`, ngồi trên đài sen 2 tầng.
  * **2 Pho Phật Tiểu Vị (Ngoài cùng)** tại $(\pm 8.2, 2.6, -10.5)$, `scale = 1.05`, đặt trên bệ đài sen cao.
* **Bàn Thờ Đá & Hoa Cúng Dường:**
  * Bệ đá 2 cấp chạy ngang chân 5 đài sen ($z = -8.2$), bày 6 bình hoa mẫu đơn/hoa sen lớn màu hồng phấn - trắng (`#F4D6DC`, `#FFFDF9`) và 4 cây đèn bơ vàng tỏa sáng ấm áp.

### 3. Hệ thống Ánh sáng, Bóng đổ Dài & Tia Nắng (God Rays)
Đây là yếu tố quyết định 80% vẻ đẹp của bức ảnh:
* **Renderer:**
  * Bật `renderer.shadowMap.enabled = true` và `renderer.shadowMap.type = THREE.PCFSoftShadowMap`.
  * Sử dụng `THREE.ACESFilmicToneMapping` với `toneMappingExposure = 1.15`.
* **Directional Sunlight (Nắng chiếu xiên từ phải sang trái):**
  * Vị trí đèn: `sunLight.position.set(18, 11, 4)` chiếu về `(0, 0, -2)`.
  * Góc chiếu tạo bóng đổ dài theo phương chéo góc $\theta \approx -62^\circ$ từ phải sang trái.
  * `sunLight.castShadow = true`, độ phân giải `shadow.mapSize.set(2048, 2048)`, `shadow.bias = -0.0005`.
* **Ambient & Hemisphere Light (Ánh sáng môi trường dịu):**
  * `HemisphereLight(0xdde4ea, 0x4a453e, 0.65)` để phần trong bóng râm không bị đen đặc mà mang sắc xám xanh đá tự nhiên.
* **Volumetric Light Shafts (Luồng tia nắng xuyên cột):**
  * Trong `AltarVfxManager.js`, tạo 3 tấm Plane nghiêng theo đúng vector của `sunLight`, áp dụng Custom Shader hoặc Gradient Alpha Texture (`THREE.AdditiveBlending`, `depthWrite: false`) mô phỏng các luồng bụi nắng (God Rays) chiếu từ khe cột bên phải xuống sàn.

---

## PHẦN 4: ĐỘI HÌNH ĐÁM ĐÔNG QUỲ LẠY & CHỦ LỄ (`CrowdSystem.js`)

Bố cục nhân vật phải tuân thủ tuyệt đối hình mẫu:

### 1. Vị Chủ Lễ / Nhân vật Spotlight Áo Vàng Trung Tâm
* **Vị trí đứng:** Đặt ngay chính giữa lối đi $(0, 0, -5.2)$, quay lưng về phía camera, mặt hướng thẳng lên pho Đại Phật.
* **Ngoại hình:**
  * Mặc y Ca-sa màu vàng nghệ (`#D99B26`) có các nếp gấp vải dọc từ vai trái xuống chân, đầu cạo trọc hoặc tóc bạc trang nghiêm, hai tay chắp trước ngực.
* **Tích hợp Tương tác TikTok Live (`spotlight_incense`):**
  * Khi có khán giả tặng quà trên Live, nhân vật của người tặng quà sẽ khoác **Y Áo Vàng Hoàng Kim**, bước đi dọc theo lối đi trung tâm từ $z = +10$ lên vị trí $z = -5.2$, thực hiện nghi thức dâng hương và quỳ lạy dưới ánh hào quang chiếu rọi.

### 2. Đội hình 64 Phật Tử Áo Xám Quỳ Hai Bên (Left & Right Kneeling Grid)
* **Chia làm 2 khối đối xứng qua lối đi trung tâm** (độ rộng lối đi giữa là $2.4\text{m}$ để lộ rõ vị Sư áo vàng và bóng nắng):
  * **Khối Bên Trái:** 4 cột $\times$ 8 hàng ($x \in [-1.6, -7.2]$, $z \in [-3.5, +9.5]$).
  * **Khối Bên Phải:** 4 cột $\times$ 8 hàng ($x \in [+1.6, +7.2]$, $z \in [-3.5, +9.5]$).
  * Cộng thêm **4–5 vị trí Hàng Đầu sát lối đi** dành cho **Top Đệm VIP** của phiên Live.
* **Tạo hình Nhân vật Quỳ Lạy Chi tiết (Anatomical Kneeling Figure):**
  * Khác với hình trụ đơn giản, mỗi nhân vật trong `CrowdSystem.js` cần có cấu trúc khớp (Hierarchy Rig) gồm:
    1. **Đầu & Cổ (`headGroup`):** Đầu tròn hơi cúi nhẹ thành kính, tai rõ ràng, màu da ấm (`#D8A984`).
    2. **Thân trên & Áo tràng lệch vai (`torsoGroup`):** Vai phải để trần màu da, dải áo màu xám tro (`#54595E`) vắt chéo qua vai trái, có đai lưng vải thắt gọn ở eo.
    3. **Hai cánh tay chắp lễ (`armsGroup`):** Khuỷu tay gập, hai bàn tay chắp lại đặt trước ngực/trán (`Anjali Mudra`).
    4. **Phần chân quỳ & Hai bàn chân lộ phía sau (`kneelingLegsGroup`):** Đùi và bắp chân gập sát sàn, hai lòng bàn chân (`#CFA07A`) dựng đứng phía sau gót đúng tư thế quỳ truyền thống Á Đông.
  * **Bắt buộc bật `castShadow = true` và `receiveShadow = true`** trên toàn bộ mesh nhân vật để mỗi người đều đổ một vệt bóng dài sang bên trái trên nền gạch đá.

### 3. Chu kỳ Động tác Quỳ Lạy Đồng bộ (Synchronized Prostration Animation)
Sử dụng hàm nội suy mượt theo pha thời gian $t \in [0, T]$ (với chu kỳ $T = 7.0\text{s}$):
* **Giai đoạn 1 ($0.0\text{s} \rightarrow 2.0\text{s}$ - Quỳ Tịnh Tâm Chắp Tay):** Ngồi thẳng lưng trên hai gót chân, hai tay chắp trước ngực, thở nhẹ (`torso.rotation.x = 0.05`).
* **Giai đoạn 2 ($2.0\text{s} \rightarrow 3.5\text{s}$ - Cúi Lạy Sát Đất / Ngũ Thể Đầu Địa):** Đưa hai tay từ ngực lên trán rồi vươn ra phía trước đặt xuống sàn, thân trên gập sâu xuống (`torso.rotation.x` tiến tới $1.15\text{ rad}$), đầu chạm sát mặt đá.
* **Giai đoạn 3 ($3.5\text{s} \rightarrow 5.0\text{s}$ - Giữ Tư Thế Chí Thành):** Giữ nguyên tư thế cúi lạy sát đất, bàn tay lật ngửa nhẹ.
* **Giai đoạn 4 ($5.0\text{s} \rightarrow 7.0\text{s}$ - Thu Mình Ngồi Dậy):** Nâng thân trên về lại tư thế quỳ thẳng lưng, hai tay thu về chắp trước ngực và tăng bộ đếm `Vòng lạy: XX`.

---

## PHẦN 5: CHẾ ĐỘ HYBRID 2.5D SIÊU THỰC (TUỲ CHỌN KẾT HỢP ẢNH GỐC)

Nếu bạn muốn hậu cảnh 5 pho tượng Phật và bức phù điêu Mandala đạt độ chi tiết chạm khắc **100% y hệt từng pixel của bức ảnh mẫu** mà không phụ thuộc vào model `.glb` bên ngoài, hãy yêu cầu Antigravity bổ sung cờ `CONFIG.USE_PHOTO_BACKDROP = true` trong `SceneManager.js`:

1. **Lớp Hậu cảnh (Backdrop Plane):** Gắn trực tiếp bức ảnh mẫu làm Texture độ phân giải cao cho phần Kiến trúc & 5 Pho Tượng Phật phía trên.
2. **Lớp Hiệu ứng Động (3D VFX Overlay):** Đặt các hạt bụi nắng vàng (`God Rays`), khói trầm hương bay lên từ lư hương, ánh nến lung linh và vòng sáng Hào quang xoay nhẹ đè khớp tọa độ lên 5 pho tượng.
3. **Lớp Sàn Shadow-Catcher & Nhân vật 3D Tương tác:** Gắn tên TikTok, bong bóng chat cầu nguyện (`"cầu bình an"`, `"cầu thi đỗ"`) và hiệu ứng nhân vật bước lên lối đi chính giữa khi có người tặng quà.

---

## PHẦN 6: CHECKLIST NGHIỆM THU CHO ANTIGRAVITY (QA VERIFICATION)

Sau khi Antigravity viết xong code, yêu cầu Agent 04 tự kiểm tra các tiêu chí sau:
- [ ] **Ánh sáng & Bóng đổ:** Bóng của 64 Phật tử và vị Sư áo vàng phải đổ dài từ phải sang trái trên nền gạch đá có kẻ ô.
- [ ] **Tông màu:** Tuyệt đối không dùng màu vàng chói lóa kiểu hoạt hình; phải dùng tông **Đá xám tro (`#7D7B76`) + Đồng cổ (`#C59B5F`) + Nắng kem ấm (`#FFF1D0`)**.
- [ ] **Đội hình:** Có lối đi trống ở chính giữa, vị Sư áo vàng đứng trung tâm, hai khối Phật tử áo xám quỳ ngay ngắn hai bên lộ hai bàn chân phía sau.
- [ ] **Tương tác TikTok Live:** Bảng **TẤM LÒNG THÀNH**, **Vòng lạy**, **Bong bóng Chat** và **Spotlight Dâng Hương** vẫn hoạt động trơn tru trên nền đồ họa mới ở mức $60\text{ FPS}$.
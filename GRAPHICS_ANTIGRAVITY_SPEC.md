# TÀI LIỆU ĐẶC TẢ ĐỒ HỌA CHÁNH ĐIỆN 3D (UNITY & BLENDER EDITION) CHO ANTIGRAVITY

**Mục tiêu:** Xây dựng hoàn chỉnh dự án game tương tác TikTok Live **"Đại Hùng Bảo Điện - Ngũ Phương Phật"** bằng **Blender (tạo Model 3D tự động bằng Python `bpy`)** kết hợp **Unity Engine (URP/HDRP C# Scripts)**, tái hiện **100% bố cục, ánh sáng điện ảnh xuyên cột (God Rays), chất liệu đá - đồng cổ và đội hình 64 Phật tử quỳ lạy** như bức ảnh mẫu.

---

## PHẦN 1: MASTER PROMPT ĐỂ DÁN TRỰC TIẾP VÀO ANTIGRAVITY

> **Cách dùng:** Đính kèm 2 file `@GRAPHICS_ANTIGRAVITY_SPEC.md`, `@UNITY_BLENDER_CODE_SCAFFOLD.md` cùng bức ảnh mẫu Chánh Điện vào Antigravity và dán câu lệnh sau:

```text
Hãy đọc kỹ 2 file @GRAPHICS_ANTIGRAVITY_SPEC.md và @UNITY_BLENDER_CODE_SCAFFOLD.md cùng bức ảnh mẫu đính kèm để xây dựng hoàn chỉnh dự án Game 3D Tương tác TikTok Live bằng bộ công cụ **Blender + Unity (URP) + Node.js TikTok Bridge**.

YÊU CẦU THỰC THI TUẦN TỰ:
1. Blender Procedural Asset Pipeline (`BlenderScripts/generate_temple_assets.py`):
   - Viết script Python cho Blender (`bpy`) tự động dựng và xuất file `.fbx` vào thư mục `UnityProject/Assets/Models/` gồm:
     + Quần thể 5 Pho Tượng Phật ngồi đài sen (1 Đại Phật trung tâm + 2 Nhị vị + 2 Tiểu vị) kèm đĩa Phù điêu Hào quang Mandala chạm nổi đồng tâm phía sau.
     + Kiến trúc Tường đá xám, 2 khung cửa sổ hoa văn chữ Thọ/hình học đối xứng 2 bên, hàng cột đá lớn có rãnh dọc và sàn gạch đá chia ô.
     + Mô hình Nhân vật Phật tử mặc áo tràng xám vắt lệch vai, tư thế quỳ gối lộ hai lòng bàn chân phía sau, gắn sẵn xương (Armature Rig: Pelvis, Spine, Chest, Neck, Head, Arms_Anjali) để diễn hoạt động tác Quỳ Lạy.
2. Hệ thống Đồ họa, Ánh sáng & Vật liệu PBR trong Unity (`SanctuaryEnvironmentBuilder.cs` & Shaders):
   - Thiết lập vật liệu chuẩn PBR (Universal Render Pipeline / Lit): Thân tượng Phật đá bạc mờ (`#8C9295`), Y áo & Đài sen đồng cổ (`#C59B5F`), Tường & Cột đá (`#7D7B76`), Sàn đá phản xạ nhẹ (`#686A6C`).
   - Thiết lập Directional Light chiếu xiên góc từ hàng cột bên phải sang trái, bật Soft Shadows độ phân giải cao (4096x4096) và các luồng tia nắng Volumetric God Rays.
3. Đội hình 64 Phật tử Quỳ Lạy + Chủ Lễ Áo Vàng + Spotlight Dâng Hương (`CrowdProstrationManager.cs`):
   - Giữa lối đi chính: Vị Sư Chủ Lễ mặc y Ca-sa vàng nghệ (`#D99B26`) đứng chắp tay trang nghiêm trước đài sen chính.
   - Hai bên lối đi: 2 khối Phật tử áo tràng xám (`#54595E`) xếp đội hình 4x8 mỗi bên (tổng 64 vị trí + 5 Đệm VIP hàng đầu), đồng bộ chu kỳ Quỳ Lạy 4 giai đoạn mượt mà ở 60 FPS.
   - Khi có sự kiện tặng quà (`spotlight_incense`): Làm mờ toàn bộ đám đông hai bên, nhân vật người tặng quà khoác y vàng bước đi trên lối đi chính lên trước bàn thờ dâng hương, phát tiếng Đại Hồng Chung và giọng đọc AI (TTS).
4. Giao diện HUD & Tương tác TikTok Live (`TikTokOverlayHudManager.cs` & `TikTokWebSocketClient.cs`):
   - Object Pooling cho nhãn tên TikTok và Bong bóng Chat cầu nguyện trên đầu từng Phật tử.
   - Bảng "TẤM LÒNG THÀNH" góc phải trên tự động tính "Đệm cuối (hạng 5) có XX xu" và "còn XX xu để lên đệm".

Hãy viết đầy đủ 100% mã nguồn cho từng file theo đúng cấu trúc trong @UNITY_BLENDER_CODE_SCAFFOLD.md (tuyệt đối không viết rút gọn hay để comment TODO).
```

---

## PHẦN 2: BẢNG THÔNG SỐ VẬT LIỆU PBR CHUẨN UNITY (URP / HDRP LIT)

> **Lưu ý quan trọng cho Unity:** Trong Unity URP/HDRP, thông số độ nhẵn bề mặt dùng **Smoothness** ($\text{Smoothness} = 1.0 - \text{Roughness}$). Antigravity phải áp dụng đúng bảng thông số dưới đây:

| Thành phần 3D | Albedo Hex | Metallic | Smoothness | Normal / Bump Scale | Mô tả hiệu ứng thị giác trong Unity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Thân Tượng Phật (`Mat_BuddhaSkin_Pewter`)** | `#8C9295` | $0.60$ | $0.55$ | $0.25$ | Đá bạc ánh kim mờ, bắt sáng viền dịu khi nắng chiếu |
| **Y Áo Phật & Đài Sen (`Mat_AntiqueBronze`)** | `#C59B5F` | $0.85$ | $0.68$ | $0.40$ | Đồng vàng cổ đánh bóng ở các nếp gấp y áo và cánh sen |
| **Phù Điêu Mandala (`Mat_MandalaRelief`)** | `#9E7B42` | $0.80$ | $0.60$ | $1.20$ | Đồng chạm nổi hoa văn đồng tâm có chiều sâu bóng đổ |
| **Tường & Cột Đá (`Mat_TempleStone`)** | `#7D7B76` | $0.05$ | $0.15$ | $0.85$ | Đá tảng xám tro cổ kính có rãnh ghép khối |
| **Sàn Gạch Đá Lớn (`Mat_SlateFloor`)** | `#686A6C` | $0.15$ | $0.45$ | $0.50$ | Gạch đá phẳng kẻ ô lớn, phản chiếu bóng mờ (Reflection Probe) |
| **Áo Tràng Đám Đông (`Mat_MonkGreyRobe`)** | `#54595E` | $0.02$ | $0.12$ | $0.60$ | Vải thô màu xám tro trầm mặc, nếp gấp tự nhiên |
| **Y Ca-sa Chủ Lễ (`Mat_SaffronRobe`)** | `#D99B26` | $0.08$ | $0.25$ | $0.55$ | Vải lụa/thô vàng nghệ ấm nổi bật tại trung tâm chánh điện |
| **Khung Cửa Sổ Phát Sáng (`Mat_WindowGlow`)** | `#FFF5D6` | $0.00$ | $1.00$ | — | Bật `Emission` cường độ $2.4\text{ HDR}$ để tạo nguồn sáng hắt qua hoa văn |

---

## PHẦN 3: THIẾT LẬP CAMERA, ÁNH SÁNG & VOLUMETRIC GOD RAYS TRONG UNITY

### 1. Thông số Camera Chính (`Main Camera`)
* **Position:** $(0.0, 3.2, -16.5)$ (Trong hệ trục tọa độ thuận tay trái của Unity: trục $+Z$ hướng thẳng vào bàn thờ Phật).
* **Rotation:** $(6.5^\circ, 0.0^\circ, 0.0^\circ)$ — Nhìn thẳng vào trục đối xứng của Đại Phật và vị Sư áo vàng.
* **Field of View (FOV):**
  * Chế độ ngang chuẩn ảnh mẫu ($16:9$): $\text{Vertical FOV} = 36^\circ$.
  * Chế độ dọc TikTok Live ($9:16$): Tự động quy đổi $\text{Horizontal FOV}$ tương đương để giữ trọn 5 pho tượng Phật và 2 hàng cột đá.
* **Post-Processing (`Global Volume`):**
  * **Tonemapping:** `ACES`
  * **Bloom:** `Threshold = 1.1`, `Intensity = 0.35`, `Scatter = 0.7` (làm dịu ánh nắng ở khe cột và ngọn đèn bơ).
  * **Color Adjustments:** `Post Exposure = +0.2`, `Contrast = +12`, `Saturation = -8` (tạo chất màu điện ảnh trầm mặc).
  * **Vignette:** `Intensity = 0.22`.

### 2. Ánh sáng Mặt trời Chiếu Xiên & Bóng đổ Dài (`Directional Light - Sun`)
* **Rotation:** $(24^\circ, -118^\circ, 0^\circ)$ — Chiếu từ phía trên bên phải xuyên qua hàng cột đá phải sang sàn bên trái.
* **Color:** `#FFF1D0` (Nắng vàng kem ấm áp), `Intensity = 2.8`.
* **Shadows:**
  * `Shadow Type = Soft Shadows`
  * `Resolution = 4096x4096`, `Cascade Count = 4`
  * `Depth Bias = 0.02`, `Normal Bias = 0.4` (đảm bảo bóng của từng bàn chân và thân người quỳ đổ dài sắc nét trên sàn gạch đá).

### 3. Hiệu ứng Tia Nắng Xuyên Cột (`Volumetric God Rays`)
* Đặt 4 Mesh dải sáng (`Quad` nghiêng theo vector ánh nắng mặt trời từ khe cột bên phải $x = +11.5$ xuống mặt sàn $x = -6.0$).
* Sử dụng Shader `Particles/Standard Unlit` (chế độ `Additive`, tắt `ZWrite`, kèm Fresnel/Edge Fade) kết hợp hạt bụi lơ lửng (`ParticleSystem`) bay chậm trong vùng nắng.

---

## PHẦN 4: QUY TRÌNH BLENDER $\rightarrow$ UNITY CHO ĐỘI HÌNH 64 PHẬT TỬ & NGŨ PHƯƠNG PHẬT

### 1. Tọa độ Bố cục Chánh Điện trong Unity (Hệ trục $+Z$ hướng về Bàn thờ)
* **Bức tường Hậu cung & 2 Cửa sổ hoa văn:** Đặt tại $z = +12.0\text{ m}$.
* **Quần thể 5 Pho Tượng Phật:**
  * **Đại Phật Trung tâm + Phù điêu Mandala ($R = 5.2\text{ m}$):** Đặt tại $(0.0, 4.2, +10.0)$, `Scale = (2.6, 2.6, 2.6)`.
  * **2 Pho Phật Nhị Vị:** Đặt tại $(\pm 4.6, 3.2, +10.2)$, `Scale = (1.65, 1.65, 1.65)`.
  * **2 Pho Phật Tiểu Vị:** Đặt tại $(\pm 8.2, 2.6, +10.5)$, `Scale = (1.05, 1.05, 1.05)`.
* **Bàn thờ Đá, Bình hoa Mẫu đơn/Hoa sen & Đèn bơ:** Đặt dọc theo $z = +8.2\text{ m}$.
* **Vị Sư Chủ Lễ Áo Vàng (`#D99B26`):** Đứng tại chính giữa lối đi $(0.0, 0.0, +5.2)$, mặt hướng về $+Z$ (quay lưng về Camera).
* **Đội hình 64 Phật tử Áo Xám Quỳ Lạy:**
  * Chia làm 2 khối Trái ($x \in [-7.2, -1.6]$) và Phải ($x \in [+1.6, +7.2]$), mỗi khối $4 \text{ cột} \times 8 \text{ hàng}$ trải từ $z = +3.5\text{ m}$ lùi về $z = -9.5\text{ m}$.
  * Lối đi chính giữa rộng $3.2\text{ m}$ để lộ rõ bóng nắng và làm đường đi cho **Nhân vật Spotlight Dâng Hương** khi có khán giả tặng quà.

### 2. Cấu trúc Xương (Rig) & Chu kỳ Quỳ Lạy 4 Giai đoạn ($T = 7.0\text{ s}$)
Mỗi nhân vật Phật tử có các khớp điều khiển trực tiếp qua C# (`CrowdProstrationManager.cs`) hoặc `Animator`:
1. **Giai đoạn 1 ($0.0\text{ s} \rightarrow 2.0\text{ s}$ — Quỳ Thẳng Chắp Tay):** Quỳ trên hai gót chân, hai lòng bàn chân dựng đứng phía sau, lưng thẳng (`Spine.localRotation.x = 4^\circ`), hai tay chắp trước ngực (`Anjali`).
2. **Giai đoạn 2 ($2.0\text{ s} \rightarrow 3.5\text{ s}$ — Cúi Lạy Ngũ Thể Đầu Địa):** Hai tay đưa lên trán rồi vươn ra chạm sàn phía trước, khớp hông và lưng gập xuống (`Spine.localRotation.x` nội suy mượt tới $68^\circ$), trán chạm sát mặt sàn đá.
3. **Giai đoạn 3 ($3.5\text{ s} \rightarrow 5.0\text{ s}$ — Giữ Tư Thế Chí Thành):** Giữ nguyên tư thế cúi lạy sát đất, hai lòng bàn tay ngửa nhẹ lên trên.
4. **Giai đoạn 4 ($5.0\text{ s} \rightarrow 7.0\text{ s}$ — Thu Mình Ngồi Dậy):** Nâng thân trên về tư thế quỳ thẳng lưng, thu hai tay về chắp trước ngực và cộng $+1$ vào bộ đếm `Vòng lạy: XX`.
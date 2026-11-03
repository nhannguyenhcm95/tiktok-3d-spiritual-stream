# MASTER SPECIFICATION: WEB GAME 3D "NIỆM PHẬT CẦU AN & ĐẠO TRÀNG SIÊU ĐỘ"
*(Phong cách www.niemphat.online kết hợp hệ thống Kết Ấn - Siêu Độ & Không gian Chùa Việt 3D)*

## 1. Tổng quan & Mục tiêu Sản phẩm
Xây dựng một Web Game 3D nhập vai góc nhìn thứ 3 (Third-Person 3D Interactive Spiritual World) chạy trực tiếp trên trình duyệt (ưu tiên màn hình dọc Mobile và hỗ trợ đầy đủ PC).
- **Trải nghiệm cốt lõi:** Người chơi nhập tên, hóa thân thành nhân vật 3D (Phật tử áo lam / Tiểu sư thầy / Đạo sư) đi dạo tự do trong khuôn viên Chùa cổ Việt Nam lúc hoàng hôn chuyển sang đêm.
- **Đặc trưng "Niệm Phật - Kết Ấn - Siêu Độ":**
  1. **Bộ Bộ Sinh Liên (Mỗi bước nở hoa sen):** Khi nhân vật vừa đi vừa bật chế độ "Tịnh Hành Niệm Phật", mỗi bước chân chạm đất sẽ nở ra một đài sen vàng phát sáng rồi tan dần.
  2. **Hệ thống Kết Ấn (Hand Seals - Thủ Ấn):** Người chơi mở giao diện Kết Ấn, nối các điểm linh quang theo đồ hình (Liên Hoa Hợp Chưởng Ấn, Vô Úy Ấn, Định Ấn, Kim Cang Ấn) để phóng luồng sáng vàng kim tịnh hóa không gian.
  3. **Đàn Tràng Siêu Độ & Phóng Sinh:** Các đốm linh quang u tối (biểu trưng cho nỗi buồn/oán khí/vong linh cần siêu độ) lơ lửng quanh khu vực đàn tràng; khi người chơi Niệm Phật, Gõ Mõ, Thỉnh Chuông hoặc Kết Ấn, ánh sáng Phật pháp sẽ cảm hóa các đốm này thành linh quang vàng ấm bay lên bầu trời đêm.
  4. **Đầy đủ 5 Hoạt động Cầu An:** Thắp hương (1 hoặc 3 nén), Thỉnh Đại Hồng Chung, Gõ mõ tụng kinh theo nhịp, Viết sớ cầu an / cầu siêu (treo lụa đỏ lên cây Bồ Đề hoặc thả đèn hoa đăng Hồ Sen), và Xin quẻ đầu năm (40 quẻ thiện lành).

---

## 2. Cấu trúc Thư mục Dự án (Chuẩn ES Modules, Không cần Bundler phức tạp)

```text
project-root/
├── NIEMPHAT_3D_SPEC.md
├── index.html                  # Bản chạy độc lập hoặc qua Live Server
├── css/
│   └── style.css               # Giao diện Mobile-first, UI Kết Ấn, Sổ Công Đức, Joystick
├── assets/
│   └── models/                 # Thư mục chờ nạp file .glb từ Tripo 3D (character.glb, buddha.glb...)
└── js/
    ├── main.js                 # Khởi tạo Game Loop, quản lý State, Lưu LocalStorage
    ├── world/
    │   ├── TempleWorld.js      # Dựng cảnh Chùa 3D: Tam Quan, Chính Điện, Lư Hương, Hồ Sen, Bồ Đề, Đàn Siêu Độ
    │   ├── EnvironmentVfx.js   # Chu kỳ Hoàng hôn -> Đêm, Khói hương, Đom đóm, Hoa sen nở dưới chân, Linh quang
    │   └── CollisionSystem.js  # Hệ thống kiểm tra va chạm AABB / Circle chống đi xuyên tường, tượng
    ├── entities/
    │   ├── PlayerController.js # Điều khiển nhân vật 3D (WASD + Joystick + Orbit Camera mượt) + GLTFLoader fallback
    │   └── AiPilgrimsManager.js# Quản lý 40-60 khách hành hương AI bằng InstancedMesh + Bong bóng niệm Phật
    ├── activities/
    │   ├── HandSealSystem.js   # Mini-game Kết Ấn (vẽ đồ hình linh quang trên Canvas + Bùng nổ VFX 3D)
    │   ├── SieuDoRitual.js     # Nghi thức Siêu Độ & Niệm Phật xoay chuỗi hạt Bồ Đề 108 hạt
    │   └── TempleActivities.js # 5 hoạt động: Thắp hương, Thỉnh chuông, Gõ mõ 30s, Viết lời cầu an, Xin quẻ
    └── utils/
        ├── WebAudioSynth.js    # Tổng hợp âm thanh: Tiếng niệm Phật trầm, Chuông, Mõ, Gió, Nước, Âm Kết Ấn
        └── ShareCardExporter.js# Xuất ảnh dọc 1080x1350 bằng Canvas 2D + Web Share API
```

---

## 3. Chi tiết Thiết kế Nhân vật 3D & Cơ chế Nạp Model Tripo 3D (`PlayerController.js`)

1. **Hỗ trợ雙chế độ Model (Tripo 3D `.glb` + Procedural Articulated Rig):**
   - Tích hợp `GLTFLoader` từ `three/addons/loaders/GLTFLoader.js`.
   - Cấu hình hằng số `MODEL_CONFIG = { playerGlbUrl: './assets/models/player.glb', useProceduralFallback: true }`.
   - Nếu chưa có file `.glb` trong thư mục `assets/models/`, hệ thống **tự động dựng một Nhân vật 3D Đa Khớp (Articulated Chibi Monk / Phật tử)** chất lượng cao bằng hình khối Three.js có phân tách khớp rõ ràng:
     - `headGroup` (Đầu tròn, tóc/mũ đạo sư, khuôn mặt hiền hòa, vòng sáng nhỏ sau lưng khi kết ấn).
     - `torsoMesh` (Thân mặc áo lam hoặc áo tràng nâu vàng có vạt áo chữ Y và dây đai lưng).
     - `leftArmPivot`, `rightArmPivot` (Hai cánh tay + bàn tay có thể vung khi đi bộ, chắp tay trước ngực khi lễ Phật, và múa ấn khi Kết Ấn).
     - `leftLegPivot`, `rightLegPivot` (Hai chân bước đi nhịp nhàng theo vận tốc di chuyển).
   - Trên đầu nhân vật có nhãn tên người chơi nổi bật và hào quang nhẹ dưới chân.

2. **Bộ chuyển động (Procedural Animation State Machine):**
   - `IDLE`: Hít thở nhẹ, hai tay chắp nhẹ trước ngực (Hợp chưởng).
   - `WALK`: Tay chân đánh nhịp ngược pha theo hàm `Math.sin(time * speed)`, thân nhấp nhô nhẹ. Nếu bật "Bộ Bộ Sinh Liên", cứ mỗi `0.6m` di chuyển sẽ để lại 1 bông sen vàng phát sáng dưới mặt gạch.
   - `BOW` (Lễ bái): Gập thân 45 độ, hai tay nâng lên trán rồi hạ xuống ngực.
   - `MEDITATE` (Tịnh tọa Niệm Phật): Ngồi xếp bằng trên蒲đoàn (bồ đoàn), xoay chuỗi hạt, xung quanh có chữ *"Nam Mô A Di Đà Phật"* bay lên.
   - `HAND_SEAL` (Kết Ấn): Hai tay xoay vòng trước ngực, phát tia sáng vàng kim lên trời.

3. **Camera & Điều khiển:**
   - Góc nhìn thứ 3 từ sau lưng (`PerspectiveCamera`), đi theo nhân vật bằng nội suy mượt `lerp(0.12)`.
   - Kéo chuột hoặc vuốt màn hình để xoay góc nhìn 360 độ quanh nhân vật (`Orbit Camera`), cuộn chuột/chụm tay để zoom gần/xa.
   - Góc trái dưới: Cần điều khiển ảo (`Virtual Joystick`) nhạy, mượt.
   - Góc phải dưới: Cụm nút nhanh gồm:
     - Nút **[📿 Niệm Phật (+1 Công Đức)]**: Bấm liên tục để xoay tràng hạt, phát âm thanh mõ/niệm trầm và tích lũy điểm Tịnh Tâm.
     - Nút **[✨ Kết Ấn]**: Mở bảng vẽ Thủ Ấn.
     - Nút **[🙏 Tương tác]** (Chỉ hiện to sáng khi đứng gần Lư hương, Gác chuông, Chính điện, Đàn siêu độ, Cây Bồ Đề, Hồ Sen, Bàn xin quẻ).

---

## 4. Chi tiết Bối cảnh 3D (`TempleWorld.js` & `EnvironmentVfx.js`)

Không gian Chùa Việt cổ kính rộng `80x80m`, ánh sáng hoàng hôn tím cam chuyển dần sang đêm trăng thanh tịnh:
1. **Cổng Tam Quan (Phía Nam):** 3 lối vào, mái ngói đỏ chồng diêm, đầu đao cong, bảng tên chữ Quốc ngữ **"CHÙA AN LẠC"** (tuyệt đối không dùng chữ Hán).
2. **Sân gạch đỏ & Hàng đèn lồng:** Gạch tàu cổ kính, 2 hàng đèn lồng đỏ tỏa ánh sáng cam ấm áp dọc lối đi chính.
3. **Lư Hương Đại Đồng (Giữa sân):** Có tai rồng, lớp tro, cắm sẵn các nén hương đang cháy đỏ đầu và cột khói hương hạt mờ (`THREE.Points`) uốn lượn bay lên.
4. **Đại Hùng Bảo Điện (Chính Điện phía Bắc):**
   - Nền đá tam cấp, cột gỗ lim đỏ, mái cong 2 tầng.
   - Bên trong là **Tượng Phật A Di Đà / Thích Ca ngồi tòa sen vàng** trang nghiêm, phía sau có vòng hào quang xoay chậm.
   - Phía trước bên phải có **Bàn Gõ Mõ & Chuông Gia Trì** cùng các tấm đệm ngồi thiền.
5. **Đàn Tràng Siêu Độ (Góc Tây Bắc):**
   - Đài đá tròn khắc hoa văn hoa sen, xung quanh có các đốm linh quang mờ ảo đang chờ được tịnh hóa.
   - Khi người chơi đứng vào Đàn Tràng và thực hiện **Kết Ấn** hoặc **Niệm Phật**, một cột sáng vàng từ bầu trời chiếu xuống, biến các đốm linh quang tối thành các hạt ánh sáng vàng bay vút lên trời đêm kèm thông báo *"Linh quang đã được tịnh hóa, nguyện cầu siêu sinh Tịnh Độ"*.
6. **Gác Chuông (Phía Tây):** Treo quả Đại Hồng Chung và chày gỗ.
7. **Cây Bồ Đề Cổ Thụ & Hồ Sen (Phía Đông):**
   - Cây Bồ Đề tán rộng treo hàng chục dải lụa đỏ đung đưa trong gió.
   - Hồ Sen nước trong phản chiếu ánh đèn, có lá sen, hoa sen hồng và những chiếc đèn hoa đăng đang trôi.
8. **Bàn Xin Quẻ Đầu Năm (Phía Tây Nam):** Bàn gỗ đỏ đặt ống xăm tre.

---

## 5. Chi tiết Hệ thống Kết Ấn & 5 Hoạt động (`HandSealSystem.js` & `TempleActivities.js`)

1. **Mini-game Kết Ấn (`HandSealSystem.js`):**
   - Hiển thị 1 Canvas đồ hình 5 ngôi sao / 7 điểm linh quang (Linh Ấn: *Liên Hoa Ấn, Vô Úy Ấn, Kim Cang Ấn, Tịnh Hóa Ấn*).
   - Người chơi kéo ngón tay (hoặc chuột) nối liền các điểm theo thứ tự phát sáng.
   - Khi nối xong: Phát âm thanh chuông kim cang ngân vang, nhân vật 3D múa ấn, một vòng sóng ánh sáng vàng kim (`Shockwave Ring` + `Lotus Petals Particle`) lan rộng khắp sân chùa, cộng điểm Công Đức / Tâm An và siêu độ tức thì các linh quang quanh đó.
2. **Thắp hương:** Chọn 1 hoặc 3 nén. Nhân vật chắp tay cúi lễ, cắm hương vào lư đồng, khói bốc lên dày hơn.
3. **Thỉnh Đại Hồng Chung:** Chạm đúng lúc vòng sáng co lại trùng khít tâm chuông. Đúng nhịp thì tiếng chuông ngân dài, màn hình rung nhẹ, sóng âm vàng lan tỏa.
4. **Gõ mõ tụng kinh (30 giây):** Chạm mõ theo nhịp vòng sáng thu về, chấm *"Tĩnh tâm / Được / Lệch nhịp"*, cuối lượt tổng kết điểm **Tâm An (0–100)** kèm câu chúc nhẹ nhàng.
5. **Viết lời Cầu An / Cầu Siêu:** Nhập tối đa 120 ký tự (có bộ lọc từ thô tục), chọn **Treo dải lụa đỏ lên Cây Bồ Đề** hoặc **Thả đèn hoa đăng xuống Hồ Sen** (vật thể 3D xuất hiện thật trong cảnh).
6. **Xin quẻ đầu năm (Giải trí):** Lắc ống xăm nhận 1 trong 40 câu chúc đầu năm tích cực, luôn hiển thị dòng *"Mang tính giải trí"*.

---

## 6. Tối ưu Hiệu năng & Chất lượng (`Zero-Lag Rules`)
- Giới hạn `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`.
- Dùng chung `Geometry` và `Material` cho các vật thể lặp lại.
- Toàn bộ 45 khách hành hương AI bắt buộc dùng `THREE.InstancedMesh` để chỉ tốn 2 Draw Calls.
- Không khởi tạo `new THREE.Vector3()` hay `Geometry/Material` mới bên trong vòng lặp `requestAnimationFrame`.
- Lưu trữ tự động vào `localStorage` (Tên, Số lần niệm Phật, Số nén hương, Số lần Kết Ấn Siêu Độ, Điểm Tâm An, Lời cầu đã viết, Quẻ đã xin) và xuất ảnh dọc `1080x1350` qua Canvas 2D.
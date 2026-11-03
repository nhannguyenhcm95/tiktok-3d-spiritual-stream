# 03 — MASTER PROMPT CHO AI LẬP TRÌNH

> Sao chép toàn bộ nội dung từ dòng dưới đây và giao cho AI lập trình có quyền đọc/ghi project.

---

## VAI TRÒ

Bạn là một nhóm phát triển game và realtime application gồm Senior Game Developer, Three.js Engineer, Full-stack TypeScript Engineer, Backend Architect, Technical Artist, UI/UX Designer và QA Engineer.

Bạn phải **xây dựng sản phẩm chạy được**, không chỉ viết kế hoạch, mockup hoặc mô tả. Trước khi chỉnh sửa, hãy kiểm tra toàn bộ project hiện tại, đọc cấu trúc thư mục, package files, code và trạng thái Git nếu có. Không xóa hoặc ghi đè file chưa hiểu chức năng.

## MỤC TIÊU SẢN PHẨM

Xây dựng game 3D tương tác TikTok LIVE tên tạm thời **Phật Điện Vạn Người**.

Người xem TikTok LIVE là người chơi. Mỗi người xem được đại diện bởi một avatar Phật tử 3D trong điện Phật. Người xem dùng comment để điều khiển avatar thực hiện các nghi lễ/hành động; gift/donate kích hoạt animation cá nhân hoặc hiệu ứng toàn cảnh; share/follow/like có thể tạo notification tùy dữ liệu nguồn.

Người xem không cài game và không dùng joystick. Game chạy trên máy streamer, hiển thị qua OBS Browser Source hoặc TikTok LIVE Studio.

## TÀI LIỆU PHẢI ĐỌC

Đọc trước khi code:
- `docs/01_CONCEPT_OVERVIEW.md`
- `docs/02_GAME_DESIGN_DOCUMENT.md`
- `docs/04_TECHNICAL_ARCHITECTURE.md`
- `docs/05_ART_AND_UI_GUIDE.md`
- `docs/06_MVP_BACKLOG_AND_ACCEPTANCE.md`
- Toàn bộ ảnh trong `reference_images/`

Nếu một yêu cầu xung đột, ưu tiên định nghĩa concept của chủ dự án trong GDD; báo lại các xung đột kỹ thuật, không âm thầm đổi gameplay.

## STACK ĐỀ XUẤT

### Frontend/game
- React + TypeScript + Vite.
- Three.js + React Three Fiber + Drei.
- Zustand cho state UI/game có chọn lọc.
- Socket.IO Client.
- GLB/GLTF cho asset 3D.

### Backend
- Node.js + TypeScript.
- Fastify hoặc Express.
- Socket.IO.
- Zod để validate payload.
- Prisma + SQLite cho MVP; thiết kế migration-friendly để chuyển PostgreSQL.
- Redis chỉ bổ sung khi thực sự cần scale nhiều process.

Không thêm framework/phụ thuộc lớn nếu có giải pháp nhẹ và rõ ràng hơn. Ghi lý do cho mọi thay đổi stack đáng kể.

## NGUYÊN TẮC TÍCH HỢP TIKTOK

Tạo interface `LiveEventProvider` và ít nhất hai adapter:
1. `MockLiveProvider`: hoạt động ngay, không cần tài khoản hoặc credentials, tạo được join/comment/gift/share/follow/like/viewer-count/live lifecycle.
2. `TikTokLiveProvider`: adapter riêng, chỉ kích hoạt khi đã chọn được connector hợp lệ và cấu hình đúng.

Không giả định có API công khai đầy đủ cho mọi sự kiện. Không tự động scraping trái phép, không yêu cầu người dùng đưa cookie/token phiên cá nhân, không vượt cơ chế xác thực/bảo vệ. Không hardcode tên thư viện bên thứ ba như thể đó là tích hợp chính thức.

Chỉ hiển thị trạng thái `CONNECTED` khi handshake và nhận được tín hiệu thật từ provider. Tách trạng thái `BACKEND_READY`, `SOCKET_CONNECTED`, `MOCK_CONNECTED`, `TIKTOK_CONNECTED`.

Nếu provider không có sự kiện viewer join cá nhân:
- Không tạo avatar giả từ tổng viewer count.
- Tạo avatar khi user xuất hiện lần đầu qua comment/gift/share.
- Ghi trạng thái `identitySource: first_interaction_fallback`.
- Admin phải thấy rõ rằng danh sách avatar lúc này không đại diện đầy đủ mọi watcher thụ động.

## SCENE 3D

Dựng điện Phật 3D, không dùng một ảnh background phẳng làm sản phẩm cuối.

Đặc điểm thị giác theo reference:
- Tượng Phật vàng lớn ở trung tâm phần trên.
- Hào quang sau đầu, ánh sáng vàng ấm.
- Bàn thờ gỗ nhiều chi tiết, lư hương ở giữa.
- Hoa hai bên, đèn/nến, vật phẩm trang trí.
- Thảm đỏ với họa tiết hoa sen dẫn từ foreground đến bàn thờ.
- Nhiều avatar Phật tử ở phần dưới, quay mặt về tượng Phật; hàng trước gần bàn thờ, hàng sau mở rộng ra foreground.
- Avatar có trang phục trắng, xám, nâu/lam; một số ngồi/quỳ, một số di chuyển trên lối đi.
- Bố cục dọc 9:16.

Nếu chưa có model 3D có license phù hợp, dựng blockout/procedural placeholder sạch sẽ có tỷ lệ đúng; tạo asset loader để thay GLB sau này. Không tải asset không rõ license và không dùng nguyên screenshot clip làm texture game.

Camera trực diện, cố định trong MVP. Giữ tượng Phật luôn nhìn thấy. Scene cần có môi trường, ánh sáng, vật liệu, bóng đổ phù hợp; ưu tiên performance khi có nhiều avatar.

## AVATAR SYSTEM

- Một `platformUserId` duy nhất có tối đa một avatar trong một `sessionId`.
- Nickname chỉ là display name, không phải primary key.
- Tạo avatar khi nhận viewer_joined hợp lệ; fallback tạo ở first interaction nếu join không có.
- Tạo ít nhất 6 mẫu avatar khác nhau, có thể mix trang phục/tóc.
- Tên hiển thị gọn, có giới hạn ký tự.
- Dùng spawn slots theo hàng/cột, hướng về tượng Phật.
- Không chồng lấn; mở rộng hàng phía sau khi đầy.
- Quản lý `LogicalPlayer` riêng với `VisualAvatar` để hỗ trợ hàng nghìn logical users nhưng chỉ render số avatar phù hợp hiệu năng.
- Dùng object pooling, Instancing/LOD khi benchmark xác nhận cần.

## ANIMATION STATE MACHINE

Triển khai các state tối thiểu:
`IDLE_STAND`, `IDLE_KNEEL`, `WALK_TO_SLOT`, `SIT`, `KNEEL`, `JOIN_HANDS`, `CHANT`, `PRAY`, `BOW`, `DEEP_BOW`, `OFFER_INCENSE`, `OFFER_FLOWER`, `RECEIVE_GIFT`.

Nếu chưa có animation asset, tạo animation procedural/basic rig thử nghiệm nhưng phải đóng gói sau một interface để thay GLB/animation clip. Không làm avatar chỉ đổi pose tĩnh khi có thể tạo chuyển động đơn giản.

Command mới phải đi qua action queue hoặc priority rules; không giật state do sự kiện dồn dập. Hoàn tất action trở về idle state được cấu hình.

## COMMENT COMMAND ENGINE

Tạo `CommandParser` riêng, hỗ trợ:
- lowercase, trim, normalize Unicode tiếng Việt.
- alias có dấu/không dấu.
- exact match mặc định.
- prefix mode tùy chọn (`!lay`, `!quy`).
- cooldown per user và per command.
- rate limit, event queue và log.
- admin có thể sửa alias/action/cooldown mà không sửa code.

Mapping khởi đầu:
- `nam mô`, `nam mo` → `CHANT` → chắp tay rồi niệm Phật.
- `quỳ`, `quy` → `KNEEL`.
- `lạy`, `lay`, `lạy phật` → `BOW`.
- `đứng`, `dung`, `đứng lên` → `STAND`.
- `cầu an`, `cau an`, `cầu nguyện` → `PRAY`.
- `dâng hương`, `dang huong` → `OFFER_INCENSE`.
- `dâng hoa`, `dang hoa` → `OFFER_FLOWER`.

Đây là mapping MVP có thể chỉnh, không phải tuyên bố rằng các lệnh này đều có sẵn trong game gốc. Mặc định exact match để tránh comment thường vô tình kích hoạt command.

## GIFT ENGINE

Tạo `GiftMappingManager` có thể cấu hình từ JSON/admin:
- gift ID/name → avatar action, scene effect, both hoặc notification only.
- nhận diện sender ID và avatar.
- hỗ trợ quantity/repeat metadata nếu provider cung cấp.
- xử lý gift streak/idempotency để không cộng trùng.
- notification phải hiển thị đúng người gửi.
- không tự quy đổi giá trị gift thành tiền thật hoặc cam kết công đức.

Ví dụ hành động: dâng hoa, dâng đèn/nến, dâng hương, nhận quà, cánh hoa rơi, hiệu ứng ánh sáng, hào quang nhẹ. Mọi hiệu ứng lớn phải có duration, cooldown và giới hạn concurrent effects.

## UI LIVESTREAM

Thiết kế 9:16 và có `OBS mode`:
- Scene chính chiếm diện tích lớn.
- Bảng `TÂM LÒNG THÀNH` ở phía trên bên phải như clip.
- Banner thông báo share/gift ở vùng trên.
- Tên avatar và comment bubble gọn quanh khu vực nhân vật.
- Counter tùy chọn: viewer count, số avatar đã nhận diện, số hành động, queue `đang chờ lạy` nếu admin bật.
- Không che mặt tượng Phật và vùng nhân vật.
- Có transparent/overlay mode nếu phù hợp kỹ thuật.
- UI nền tảng TikTok (title, close, status bar) không được vẽ giả vào game.

Bảng ranking cấu hình Top 5/10/20. Tách `activityScore`, `ritualActionCount`, `giftCount` và `giftValueFromProvider`; không gộp thành một con số nếu không có rule rõ ràng.

## BACKEND VÀ EVENT PIPELINE

Event flow:
`Provider → Adapter → Normalize/Validate → Deduplicate → Resolve Identity → Queue → Game Logic → Socket.IO → Frontend animation/UI`.

Tạo modules:
- providers
- sessions
- identity
- avatars
- commands
- gifts
- scores
- notifications
- moderation
- event-log
- socket
- admin

Mỗi event normalized có tối thiểu `eventId`, `sessionId`, `provider`, `type`, `occurredAt`, `user`, `payload`, `rawReference` (không lưu raw nhạy cảm không cần thiết).

Dùng Zod hoặc validator rõ ràng. Xử lý disconnect/reconnect, heartbeat, queue overflow, malformed payload, duplicate event và provider timeout. Không để frontend xử lý logic quy tắc quan trọng.

## ADMIN DASHBOARD

Tối thiểu có:
- Start/stop session.
- Mock mode / live mode.
- Kết nối provider và hiển thị trạng thái chi tiết.
- Hiển thị viewer count / identified users / avatars rendered / event rate / queue depth.
- Quản lý command mappings và cooldown.
- Quản lý gift mappings.
- Bật/tắt ranking, bubbles, notification, effects.
- Test event: join, comment, gift, share, follow, like, viewer count.
- Event log và lỗi.
- Pause command/gift và clear scene.

Admin dashboard không được render vào stream output.

## PERFORMANCE

Thiết kế logical players tách visual players. Benchmark dần 50, 100, 200 visual avatars trên máy tham chiếu; không tự tuyên bố hỗ trợ 10.000 avatar render. Có thể stress test 1.000–10.000 logical users/events bằng mock backend.

Áp dụng khi phù hợp:
- instancing cho mesh lặp.
- LOD.
- object pooling.
- frustum culling.
- throttling UI updates.
- gom animation/event giống nhau.
- giới hạn comment bubbles và particle count.

Mục tiêu 30–60 FPS tùy cấu hình máy, ghi rõ phần cứng test. Không hy sinh đúng danh tính người gửi để tăng hiệu năng.

## BẢO MẬT VÀ QUYỀN RIÊNG TƯ

- Credentials chỉ nằm server-side trong environment/secret manager.
- Không lưu cookie, session token cá nhân hoặc dữ liệu nhạy cảm.
- Không đưa provider secrets vào Vite bundle.
- Giới hạn tốc độ theo user/session.
- Log tối thiểu, có retention policy.
- Có thể ẩn/xóa avatar và dữ liệu session theo cấu hình.

## LỘ TRÌNH CODE

1. Audit project, lập plan, ghi rõ rủi ro/thiếu credentials.
2. Scaffold frontend/backend/shared types và chạy được.
3. Xây dựng scene 3D và camera 9:16.
4. Xây dựng avatar/spawn slots/animation.
5. Xây dựng backend session/identity/command/gift/event queue.
6. Kết nối MockLiveProvider và Socket.IO end-to-end.
7. Xây dựng UI livestream và bảng TÂM LÒNG THÀNH.
8. Xây dựng admin dashboard.
9. Viết test tự động và stress test.
10. Tích hợp Live provider thật nếu có nguồn hợp lệ, cấu hình và quyền cần thiết.
11. Hướng dẫn OBS và đóng gói.

## TIÊU CHÍ NGHIỆM THU MVP

- Game scene 3D chạy ở tỷ lệ 9:16.
- Có tượng Phật, bàn thờ, hoa/đèn/lư hương/thảm đỏ.
- Có tối thiểu 6 biến thể avatar.
- Mock viewer_join tạo đúng một avatar theo user ID.
- Comment `NAM MÔ` khiến đúng avatar chắp tay/niệm.
- Comment `QUỲ` và `LẠY` kích hoạt animation đúng.
- Gift mock kích hoạt đúng avatar hoặc scene effect.
- Share mock tạo notification.
- Bảng TÂM LÒNG THÀNH cập nhật theo rules.
- Duplicate event không tạo avatar/điểm/gift trùng.
- Reconnect không làm crash scene.
- Admin test được event mà không cần TikTok.
- OBS Browser Source hiển thị game đúng frame.
- README có lệnh cài đặt, chạy, mock, build và OBS.

## QUY TẮC LÀM VIỆC

- Không dừng ở kế hoạch; hãy code và chạy thử.
- Không tạo fake integration hoặc fake data rồi gọi là LIVE thật.
- Không để TODO ở chức năng MVP cốt lõi.
- Không nhồi toàn bộ logic vào một file.
- Không bỏ qua lỗi TypeScript, lint, build hoặc console.
- Sau mỗi giai đoạn: chạy tests/build, sửa lỗi và cập nhật README.
- Nếu một phần phụ thuộc API/quyền/credential chưa có, triển khai interface + mock, mô tả blocker chính xác, tiếp tục hoàn thiện các phần độc lập.
- Kết thúc bằng báo cáo: chức năng hoàn tất, chức năng chưa hoàn tất, lệnh chạy, test đã chạy, giới hạn còn lại.

**BẮT ĐẦU:** kiểm tra project hiện tại, đọc các tài liệu trong bộ kit và thực hiện giai đoạn 1. Không chỉ trả lời bằng một kế hoạch.

---

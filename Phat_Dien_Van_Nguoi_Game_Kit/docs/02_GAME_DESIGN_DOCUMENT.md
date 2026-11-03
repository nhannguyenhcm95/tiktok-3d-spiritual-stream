# 02 — GAME DESIGN DOCUMENT (GDD)

## 1. Thông tin sản phẩm

- **Tên dự án:** Phật Điện Vạn Người (tên tạm).
- **Thể loại:** TikTok LIVE Interactive Social Game / Virtual Social Space.
- **Nền tảng vận hành:** Máy tính streamer; xuất hình qua OBS Browser Source hoặc TikTok LIVE Studio.
- **Tỷ lệ hiển thị chính:** 9:16, có phương án 16:9 cho kiểm thử desktop.
- **Ngôn ngữ mặc định:** Tiếng Việt.
- **Người chơi:** Người xem TikTok LIVE.
- **Input chính:** Comment, gift; tùy khả năng nguồn sự kiện có thể dùng join, share, follow, like.

## 2. Pillars — trụ cột thiết kế

1. **Hiện diện:** Người xem nhìn thấy avatar đại diện mình trong cùng một không gian.
2. **Phản hồi tức thì:** Comment/gift tạo phản ứng dễ nhận biết, đúng avatar.
3. **Cộng đồng:** Nhiều avatar cùng thực hiện hoạt động trong điện Phật.
4. **Trang nghiêm:** Hình ảnh và âm thanh giữ sắc thái tôn nghiêm, không biến nghi lễ thành combat hoặc trò đùa phản cảm.
5. **Ổn định livestream:** Game phải chịu được sự kiện dồn dập, reconnect và phiên LIVE dài.

## 3. Scene và bố cục

### 3.1. Môi trường

- Đại điện đối xứng, tượng Phật vàng ở trung tâm phía trên.
- Hào quang sau tượng; ánh sáng thể tích hoặc giả lập bằng shader/texture có kiểm soát.
- Bàn thờ nhiều lớp, bình hoa hai bên, lư hương ở giữa, đèn/nến, kiến trúc gỗ chạm khắc.
- Lối đi/thảm đỏ dẫn từ tiền cảnh tới bàn thờ, có hoa văn sen.
- Khu vực avatar chia thành nhiều hàng và các điểm đứng/quỳ dọc hai bên lối đi.

### 3.2. Camera

- Camera trực diện về bàn thờ.
- Góc nhìn đủ rộng để thấy tượng Phật và nhiều hàng avatar.
- Camera cố định trong MVP; có thể bổ sung chuyển động cinematic rất nhẹ.
- Không zoom hoặc rung camera theo gift mặc định, tránh làm người xem khó theo dõi.

### 3.3. Tách UI game khỏi UI TikTok

Game chỉ render scene và overlay do game quản lý: bảng TÂM LÒNG THÀNH, notification, tên avatar, bong bóng comment, counters. Các thành phần như thanh trạng thái điện thoại, tiêu đề tài khoản LIVE, nút đóng và controls native của TikTok là UI nền tảng; không vẽ giả chúng vào game.

## 4. Avatar và danh tính

### 4.1. Identity

- Khóa chính: `platformUserId` do provider trả về.
- Tên hiển thị: `nickname` tại thời điểm nhận sự kiện.
- Một người chỉ có một avatar trong một `sessionId`.
- Nickname có thể thay đổi, không được dùng làm khóa duy nhất.
- Ghi nhận `firstSeenAt`, `lastSeenAt`, `presenceStatus`.

### 4.2. Tạo avatar

- Ưu tiên tạo khi có sự kiện `viewer_joined` cá nhân nếu provider có hỗ trợ thực tế.
- Fallback: tạo avatar ở sự kiện comment/gift/share đầu tiên của user chưa có trong session.
- Nếu chỉ nhận được tổng viewer count, không thể suy ra danh sách user ID; chỉ cập nhật counter, không tạo avatar giả.

### 4.3. Ngoại hình

MVP tối thiểu 6–8 biến thể hình thể/trang phục có thể phối hợp:
- Phật tử nam/nữ (không cần phân loại từ dữ liệu nhạy cảm; chọn mẫu ngẫu nhiên hoặc do admin cấu hình).
- Áo lam/xám/trắng/nâu.
- Kiểu tóc và dáng người khác nhau.
- Tên hiển thị trên nameplate, có cắt ngắn khi quá dài.
- Có thể gắn màu/viền danh hiệu theo điểm hoạt động, không mặc định theo giá trị tiền.

Avatar là đại diện đồ họa, không được suy đoán giới tính, tuổi, tôn giáo hay đặc điểm thật từ tài khoản người xem. Người chơi có thể được gán mẫu ngẫu nhiên.

### 4.4. Vị trí và mật độ

- Tạo `SpawnSlot` cố định theo hàng/cột và khu vực.
- Các avatar hướng về tượng Phật.
- Vị trí gần trung tâm/lối đi có giới hạn; mở rộng sang hàng sau khi hết chỗ.
- Giữ khoảng cách, tránh giao nhau và tránh che tượng/bàn thờ.
- Nếu quá đông, dùng visual LOD, icon/marker hoặc avatar nhỏ ở xa; vẫn giữ logical player đầy đủ.
- Người chơi mới vào có thể được đặt ở vị trí có sẵn, tránh di chuyển toàn bộ đội hình liên tục.

## 5. Animation State Machine

State đề xuất:

- `IDLE_STAND`
- `IDLE_KNEEL`
- `WALK_TO_SLOT`
- `SIT`
- `KNEEL`
- `JOIN_HANDS`
- `CHANT`
- `PRAY`
- `BOW`
- `DEEP_BOW`
- `OFFER_INCENSE`
- `OFFER_FLOWER`
- `RECEIVE_GIFT`

Quy tắc:
- Animation có blend-in/blend-out hoặc transition hợp lý.
- Command mới không được làm avatar giật trạng thái liên tục; dùng queue hoặc ưu tiên lệnh.
- Trạng thái nền sau khi hoàn tất action trở về `IDLE_KNEEL` hoặc trạng thái đã cấu hình.
- Các action có thời lượng, cooldown và mức ưu tiên riêng.
- Khi gift đến trong lúc animation đang chạy: ưu tiên gift nếu action đó được cấu hình high priority; nếu không, xếp hàng.

## 6. Comment command system

### 6.1. Command parser

- Chuẩn hóa Unicode tiếng Việt (NFC/NFD).
- Chuyển lowercase, trim, gom khoảng trắng.
- Hỗ trợ bảng alias có dấu/không dấu.
- Có mode `exact` (toàn bộ comment khớp lệnh) và `prefix` (ví dụ `!lay`).
- Mặc định `exact` để tránh kích hoạt nhầm khi từ khóa xuất hiện trong câu dài.
- Chống spam theo user ID và command.
- Có whitelist/blacklist command do admin quản lý.

### 6.2. Command mẫu ban đầu

| Từ khóa | Command ID | Animation | Ghi chú |
|---|---|---|---|
| `nam mô`, `nam mo` | `CHANT` | JOIN_HANDS → CHANT | Alias |
| `quỳ`, `quy` | `KNEEL` | KNEEL | |
| `lạy`, `lay`, `lạy phật` | `BOW` | BOW | |
| `đứng`, `dung`, `đứng lên` | `STAND` | IDLE_STAND | |
| `cầu an`, `cau an`, `cầu nguyện` | `PRAY` | PRAY | |
| `dâng hương`, `dang huong` | `OFFER_INCENSE` | OFFER_INCENSE | Có thể dành cho gift hoặc command tùy admin |
| `dâng hoa`, `dang hoa` | `OFFER_FLOWER` | OFFER_FLOWER | |

Đây là mapping đề xuất cho MVP, admin có thể sửa. Không khẳng định đây là toàn bộ từ khóa của game tham chiếu.

### 6.3. Cooldown và queue

- Cooldown mặc định: 2–4 giây/user, cấu hình được.
- Command không hợp lệ không phát animation.
- Command hợp lệ được đưa vào queue theo session.
- Có thể coalesce các lệnh giống nhau liên tiếp.
- Ưu tiên action có liên quan đến gift nếu được cấu hình.
- Giữ event log để điều tra khi một comment không kích hoạt.

## 7. Gift / donate system

### 7.1. Nguyên tắc

Gift là một sự kiện trong gameplay, không mặc định là khoản quyên góp, công đức hay cam kết về lợi ích tâm linh. Game chỉ thể hiện phản ứng đồ họa theo mapping do admin thiết lập.

### 7.2. Mapping mẫu

| Nhóm gift | Phản ứng gợi ý |
|---|---|
| Hoa | Avatar dâng hoa hoặc xuất hiện hoa sen |
| Nến/đèn | Avatar dâng đèn, tạo ánh sáng nhỏ |
| Quà thông thường | Animation `RECEIVE_GIFT` và notification |
| Quà có hiệu ứng lớn | Event toàn cảnh: cánh hoa/ánh sáng/hào quang |
| Gift streak | Combo một sự kiện theo quy tắc repeat của provider |

Tên và ID gift phải được lấy từ payload thật. Không hardcode danh mục quà hoặc giá trị xu giả định.

### 7.3. Chống tính trùng gift

- Ưu tiên event ID duy nhất từ provider.
- Nếu provider gửi gift streak nhiều bản cập nhật, dùng `repeatCount`, `repeatEnd` và key chuỗi để tránh cộng lại toàn bộ số lượng ở mỗi update.
- Lưu idempotency key đã xử lý trong cửa sổ thời gian của session.
- Chỉ hiển thị “đã xử lý” khi backend đã nhận và dispatch event.

### 7.4. Cá nhân và toàn cảnh

Gift mapping có thể là:
- `avatar_action`: tác động avatar người tặng.
- `scene_effect`: hiệu ứng toàn cảnh.
- `both`: cả hai.
- `notification_only`: chỉ thông báo.

## 8. Sự kiện phụ

- `share`: thông báo người dùng đã chia sẻ buổi LIVE; có thể kích hoạt chắp tay nếu bật.
- `follow`: notification nhẹ; không tự tạo avatar trừ khi có yêu cầu riêng.
- `like`: có thể gom nhóm theo batch, không phát một animation cho mỗi like nếu tốc độ cao.
- `viewer_count`: cập nhật tổng người xem từ provider; không suy ra danh tính cá nhân.
- `live_started` / `live_ended`: quản lý vòng đời phiên.

## 9. Bảng TÂM LÒNG THÀNH

Bảng ở vùng trên bên phải của scene, lấy cảm hứng từ clip.

Thông tin có thể hiển thị:
- Top N người dùng.
- Nickname.
- Điểm hoạt động hoặc số xu do provider trả về (tách biệt với điểm gameplay).
- Số hành động nghi lễ hợp lệ.
- Trạng thái/tiến độ lên hạng nếu có quy tắc cụ thể.

Cấu hình:
- Top 5 / 10 / 20.
- Xếp hạng theo điểm hoạt động hoặc gift metadata.
- Cập nhật realtime nhưng có debounce 500–1500 ms.
- Animation đổi hạng nhẹ, không nhấp nháy.
- Không cộng điểm trùng event.
- Ghi rõ nguồn và quy tắc của chỉ số.

Tách riêng các trường:
- `activityScore`
- `giftCount`
- `giftValueFromProvider` (nếu provider thực sự cung cấp)
- `ritualActionCount`

Không tự quy đổi điểm sang thu nhập thực tế.

## 10. Comment bubble và notification

- Comment bubble có thể xuất hiện gần avatar hoặc ở lane overlay.
- Ưu tiên comment khớp command; comment tự do có thể được hiển thị theo whitelist/moderation.
- Cắt ngắn text dài, giới hạn số bubble đồng thời.
- Tự biến mất sau 3–6 giây.
- Chống profanity/spam theo cấu hình.
- Notification gift/share xuất hiện ở vùng banner phía trên, không che tượng Phật.

## 11. Audio

MVP có thể dùng:
- Ambience nhẹ của điện Phật.
- Chuông/âm báo nhỏ cho một số event.
- Không phát âm thanh cho từng comment nếu lượng event lớn.
- Có master mute, ambience volume, effects volume trong admin.
- Tôn trọng bản quyền âm thanh.

## 12. Admin mode

Admin Dashboard không xuất hiện trong livestream.

Chức năng:
- Tạo/đóng session.
- Chọn Mock Provider hoặc Live Provider.
- Nhập cấu hình nguồn LIVE (không lưu credential vào frontend).
- Theo dõi trạng thái connector.
- Hiển thị viewer count, identified users, avatars rendered, queue length, event rate.
- Chỉnh command aliases, cooldown, gift mappings, score rules.
- Test join/comment/gift/share bằng mock event.
- Tạm dừng nhận command hoặc gift.
- Bật/tắt comment bubble, ranking, effects.
- Xem event log và lỗi.
- Xuất summary phiên.

## 13. Kết thúc phiên LIVE

- Ngừng nhận event mới.
- Flush queue trong giới hạn thời gian.
- Persist session summary.
- Clear scene state.
- Close provider connection.
- Không giữ avatar của phiên trước trong phiên mới trừ khi có yêu cầu cấu hình cụ thể.

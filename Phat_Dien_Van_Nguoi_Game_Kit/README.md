# PHẬT ĐIỆN VẠN NGƯỜI — GAME CREATION KIT

Bộ tài liệu khởi tạo dự án game tương tác TikTok LIVE theo clip tham chiếu do người dùng cung cấp.

## Concept cốt lõi

Người xem TikTok LIVE là người chơi. Mỗi người xem được đại diện bởi một avatar Phật tử trong không gian điện Phật 3D. Người xem dùng comment để gọi hành động cho avatar; gift/donate kích hoạt animation hoặc hiệu ứng cá nhân/toàn cảnh; share và các sự kiện LIVE khác có thể tạo thông báo hoặc hành động phụ.

Người xem không cần cài game hay điều khiển bằng joystick. Game chạy trên máy tính của streamer và được đưa lên livestream qua OBS Browser Source hoặc TikTok LIVE Studio.

## Nội dung ZIP

- `docs/01_CONCEPT_OVERVIEW.md` — mô tả concept, gameplay loop và điều rút ra từ clip.
- `docs/02_GAME_DESIGN_DOCUMENT.md` — GDD: luật chơi, avatar, comment, gift, bảng TÂM LÒNG THÀNH, UI và vận hành.
- `docs/03_MASTER_PROMPT_FOR_CODING_AI.md` — prompt đầy đủ để giao cho AI lập trình.
- `docs/04_TECHNICAL_ARCHITECTURE.md` — kiến trúc frontend/backend, event pipeline, schema và scale.
- `docs/05_ART_AND_UI_GUIDE.md` — hướng dẫn mỹ thuật, bố cục 9:16, phân biệt UI game với UI TikTok.
- `docs/06_MVP_BACKLOG_AND_ACCEPTANCE.md` — thứ tự thực hiện và tiêu chí nghiệm thu.
- `config/` — ví dụ command mapping, gift mapping, chuẩn hóa event và `.env.example`.
- `diagrams/` — sơ đồ kiến trúc và luồng sự kiện dạng SVG.
- `reference_images/` — ảnh trích từ clip gốc và contact sheet để tham chiếu.
- `templates/` — checklist kiểm thử và mẫu báo cáo lỗi.

## Cách dùng bộ tài liệu

1. Gửi `docs/03_MASTER_PROMPT_FOR_CODING_AI.md` cho AI lập trình (Codex, Cursor, Claude Code hoặc công cụ tương tự).
2. Đưa cả thư mục `reference_images/` vào ngữ cảnh để AI hiểu bố cục, màu sắc và mật độ nhân vật.
3. Yêu cầu AI đọc thêm GDD, kiến trúc kỹ thuật và tiêu chí nghiệm thu trước khi code.
4. Phát triển và kiểm thử bằng `MockLiveProvider` trước; chỉ kết nối TikTok LIVE thật sau khi xác minh nguồn tích hợp hợp lệ và hoạt động trong môi trường thực tế.

## Lưu ý quan trọng về tích hợp TikTok

Bộ tài liệu định nghĩa một `LiveEventProvider` độc lập, không giả định TikTok luôn cung cấp đầy đủ mọi sự kiện hoặc API công khai cho mọi tài khoản. Một số connector bên thứ ba có thể không chính thức, thay đổi hoặc ngừng hoạt động. Vì vậy:

- `MockLiveProvider` phải hoạt động độc lập để phát triển và demo.
- `TikTokLiveProvider` chỉ được đánh dấu Connected sau khi kết nối thật thành công.
- Sự kiện `viewer_joined` chỉ được dùng khi connector thực sự cung cấp dữ liệu người xem cá nhân.
- Nếu không có sự kiện join, tạo avatar khi user xuất hiện lần đầu qua comment/gift/share và ghi rõ đây là chế độ fallback.
- Không scraping trái phép, không lấy cookie hoặc token phiên cá nhân, không vượt cơ chế bảo vệ nền tảng.

## Phạm vi hình ảnh

Các hình trong `reference_images/` là ảnh chụp/trích từ clip người dùng cung cấp, dùng làm tài liệu tham chiếu nội bộ cho việc phân tích bố cục và trải nghiệm. Chúng không phải model 3D, texture hay asset được phép đưa thẳng vào sản phẩm thương mại. Khi sản xuất, hãy tạo hoặc mua asset có giấy phép phù hợp.

## Trạng thái dự án

Đây là **bộ đặc tả và prompt để tạo game**, không phải source code game hoàn chỉnh. ZIP không tuyên bố rằng game đã được lập trình hoặc đã kết nối TikTok LIVE.

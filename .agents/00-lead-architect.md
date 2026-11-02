# Role: 00 - Lead Architect & Project Manager (3D TikTok Interactive Stream)

## 1. Mục tiêu dự án
Xây dựng ứng dụng web 3D thời gian thực chạy trên trình duyệt (nhúng vào OBS Browser Source tỷ lệ dọc 9:16 - 1080x1920) phục vụ Livestream TikTok chủ đề "Không gian Tâm linh 3D (Chùa / Nhà thờ)". Khán giả tương tác qua Comment, Like, Gift để kích hoạt các hành động 3D (gõ mõ, thỉnh chuông, thắp nhang/nến, thả đèn hoa đăng, hiện lời cầu nguyện).

## 2. Strict File Scope Rules (Phạm vi file nghiêm ngặt)
- **QUYỀN GHI (Write Access):** `package.json`, `.env.example`, `STATUS.md`, và tạo sẵn cấu trúc thư mục rỗng (`server/`, `public/css/`, `public/js/3d/`, `public/js/ui/`, `public/js/audio/`).
- **QUYỀN ĐỌC (Read-Only):** `CONTRACT.md`.
- **CẤM CHẠM VÀO (Forbidden):** Tuyệt đối KHÔNG viết code vào các file `.js`, `.html`, `.css` thuộc nhiệm vụ của các Agent 01, 02, 03, 04.

## 3. Nhiệm vụ cụ thể
1. Đọc kỹ `CONTRACT.md` để nắm toàn bộ cấu trúc cây thư mục và chuẩn giao tiếp.
2. Tạo đầy đủ các thư mục rỗng theo đúng cấu trúc trong `CONTRACT.md`.
3. Tạo file `package.json` hoàn chỉnh:
   - Dependencies: `express` (^4.18.2), `socket.io` (^4.7.4), `tiktok-live-connector` (^1.2.4), `dotenv` (^16.4.5), `cors` (^2.8.5).
   - Scripts: `"start": "node server/index.js"`, `"dev": "node server/index.js"`.
   - *Lưu ý:* Three.js và GSAP trên Frontend sẽ được nạp qua `<script type="importmap">` (CDN unpkg) trong `public/index.html` để trình duyệt chạy ES Module trực tiếp siêu nhẹ, không cần bundler phức tạp.
4. Tạo file `.env.example` và `.env` với nội dung:
   ```env
   PORT=3000
   TIKTOK_USERNAME=
   AUTO_MOCK=true
   ```
5. Tạo file `STATUS.md` ghi rõ bảng tiến độ của 5 Agent:
   - Agent 00 (Lead Architect): `DONE`
   - Agent 01 (Backend TikTok): `PENDING`
   - Agent 02 (3D Scene Engineer): `PENDING`
   - Agent 03 (UI & Audio HUD): `PENDING`
   - Agent 04 (QA & OBS Integrator): `PENDING`
6. Chạy lệnh `npm install` để cài đặt xong toàn bộ thư viện Backend.

## 4. Quy tắc bàn giao (Sequential Handoff)
Sau khi `npm install` hoàn tất và `STATUS.md` đã được cập nhật, hãy kết thúc vai trò 00 để chuyển sang vai trò `01-backend-tiktok`.
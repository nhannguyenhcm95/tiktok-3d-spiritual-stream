# Role: 00 - Lead Architect & Performance Director

## 1. Strict File Scope Rules (Phạm vi file nghiêm ngặt)
- **QUYỀN GHI (Write Access):** `package.json`, `.env.example`, `.env`, `.gitignore`, `STATUS.md`, và khởi tạo các thư mục rỗng (`server/`, `public/css/`, `public/js/3d/`, `public/js/ui/`, `public/js/audio/`).
- **QUYỀN ĐỌC (Read-Only):** `CONTRACT.md`.
- **CẤM CHẠM VÀO (Forbidden):** Không viết code vào các file `.js`, `.html`, `.css` của các Agent 01, 02, 03, 04.

## 2. Nhiệm vụ cụ thể
1. Đọc kỹ `CONTRACT.md` để nắm vững kiến trúc "Chánh Điện Dâng Hương & Đám Đông Quỳ Lạy" chuẩn theo video mẫu.
2. Tạo file `package.json`:
   - Dependencies: `express` (^4.18.2), `socket.io` (^4.7.4), `tiktok-live-connector` (^1.2.4), `dotenv` (^16.4.5), `cors` (^2.8.5).
   - Scripts: `"start": "node server/index.js"`, `"dev": "node server/index.js"`.
3. Tạo file `.env.example` và `.env`:
   ```env
   PORT=3000
   TIKTOK_USERNAME=
   AUTO_MOCK=true
   ```
4. Tạo file `.gitignore` (chặn `node_modules/`, `.env`, `.DS_Store`).
5. Tạo file `STATUS.md` theo dõi tiến độ 5 Agent và chạy `npm install` để đảm bảo thư viện sẵn sàng.

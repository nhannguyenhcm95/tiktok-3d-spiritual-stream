# QA checklist

## Visual
- [ ] 9:16 canvas đúng, không crop tượng Phật.
- [ ] Ranking không che tượng.
- [ ] Avatar không chồng lấn hoặc xuyên sàn.
- [ ] Comment bubble không phủ kín scene.
- [ ] Font và nameplate đọc được trên màn hình điện thoại.

## Functional
- [ ] Một user ID chỉ có một avatar/session.
- [ ] Comment alias có dấu/không dấu hoạt động.
- [ ] Exact match không kích hoạt nhầm giữa câu dài.
- [ ] Cooldown hoạt động.
- [ ] Gift mapping gắn đúng sender.
- [ ] Gift streak không bị cộng trùng.
- [ ] Share tạo đúng notification.
- [ ] Ranking không cộng trùng.

## Resilience
- [ ] Provider disconnect không crash frontend.
- [ ] Reconnect không nhân đôi event.
- [ ] Event payload sai schema được ghi log và bỏ qua an toàn.
- [ ] Queue có giới hạn và hành vi overflow.
- [ ] Session kết thúc dọn scene đúng.

## Deployment
- [ ] Frontend build thành công.
- [ ] Backend build thành công.
- [ ] Tests pass.
- [ ] Mock mode chạy không cần TikTok.
- [ ] OBS Browser Source hiển thị đúng.

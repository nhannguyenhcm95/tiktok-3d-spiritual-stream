# 06 — MVP BACKLOG & ACCEPTANCE TESTS

## Sprint 0 — Audit và scaffold

- [ ] Audit môi trường, node/package manager, Git, cấu trúc hiện có.
- [ ] Tạo workspace frontend/backend/shared types.
- [ ] TypeScript strict mode, lint, formatter.
- [ ] Health endpoint backend.
- [ ] Frontend render trang game tối thiểu.
- [ ] README lệnh setup/dev/build.

## Sprint 1 — Scene 3D

- [ ] Canvas 9:16 responsive.
- [ ] Camera trực diện.
- [ ] Blockout điện Phật.
- [ ] Tượng Phật trung tâm và hào quang.
- [ ] Bàn thờ, hoa, lư hương, đèn, thảm đỏ.
- [ ] Lighting/materials.
- [ ] UI game không chồng lên tượng.

## Sprint 2 — Avatar

- [ ] 6+ avatar variants hoặc placeholder rigged variants.
- [ ] Spawn slot grid.
- [ ] Nameplate.
- [ ] LogicalPlayer/VisualAvatar tách biệt.
- [ ] Idle/kneel/stand/walk/join-hands/bow/pray.
- [ ] Avatar pooling và cleanup.

## Sprint 3 — Event backend và mock

- [ ] LiveEventProvider interface.
- [ ] MockLiveProvider.
- [ ] Normalized event schema + validation.
- [ ] Session Manager.
- [ ] Identity Manager.
- [ ] Event deduplication.
- [ ] Socket.IO rooms.
- [ ] Admin test event.

## Sprint 4 — Comment/gift gameplay

- [ ] Command parser Unicode Vietnamese.
- [ ] Alias mapping JSON.
- [ ] Cooldown/rate limit.
- [ ] Action queue/state machine.
- [ ] Gift mapping.
- [ ] Gift streak dedupe.
- [ ] Notification/bubble.
- [ ] TÂM LÒNG THÀNH.

## Sprint 5 — Admin/OBS

- [ ] Dashboard trạng thái provider.
- [ ] Mock/live mode indicator.
- [ ] Quản lý commands/gifts.
- [ ] Pause/clear/stop session.
- [ ] OBS Browser Source instructions.
- [ ] 9:16 output QA.

## Sprint 6 — Hardening

- [ ] Reconnect and network failure.
- [ ] Invalid payload.
- [ ] Duplicate events.
- [ ] Queue overload.
- [ ] 100 visual avatar benchmark (máy test được ghi rõ).
- [ ] 1,000 logical players mock stress test.
- [ ] Long-running soak test.
- [ ] Security review.

## Acceptance test cases

| ID | Given | When | Then |
|---|---|---|---|
| AT-01 | Session đang chạy mock | Viewer A join | Tạo đúng 1 avatar gắn A |
| AT-02 | A đã có avatar | A comment tiếp | Không tạo avatar thứ hai |
| AT-03 | A đã có avatar | A comment “NAM MÔ” | Avatar A chắp tay/niệm |
| AT-04 | A đã có avatar | A comment “QUỲ” | Avatar A quỳ |
| AT-05 | A đã có avatar | A comment “LẠY” | Avatar A thực hiện bow |
| AT-06 | A đã có avatar | A gửi gift mock | Đúng avatar A chạy action mapping |
| AT-07 | Gift mapping là scene effect | Gift event đến | Scene phát đúng effect một lần |
| AT-08 | Event có cùng dedupeKey | Gửi lại event | Không cộng điểm/gift lần hai |
| AT-09 | Provider disconnect | Connector mất kết nối | Scene không crash, status đổi sang disconnected |
| AT-10 | Viewer count có 300 nhưng không có danh sách user | Event count đến | Counter cập nhật; không tạo 300 avatar giả |
| AT-11 | Bảng ranking bật | Score thay đổi | Ranking cập nhật theo debounce |
| AT-12 | Admin đang mở | Test command | Event chạy qua pipeline như mock event bình thường |
| AT-13 | LIVE session kết thúc | `live_ended` nhận được | Dừng input, persist summary, clear session |

## Definition of Done

MVP chỉ được nghiệm thu khi frontend build, backend build, tests pass, mock end-to-end hoạt động và có hướng dẫn chạy. TikTok integration thật là hạng mục riêng, phụ thuộc provider/permission/credentials và phải được xác minh trên tài khoản LIVE thực tế.

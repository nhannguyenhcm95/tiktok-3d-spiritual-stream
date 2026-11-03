# 04 — KIẾN TRÚC KỸ THUẬT

## 1. Nguyên tắc kiến trúc

- Game frontend không phụ thuộc trực tiếp vào API riêng của TikTok.
- Chuẩn hóa mọi nguồn dữ liệu qua `LiveEventProvider`.
- Logic định danh, command, gift và score nằm ở backend.
- Rendering chỉ nhận trạng thái/avatar action đã được backend xác thực.
- `LogicalPlayer` tách khỏi `VisualAvatar`.
- Mock mode phải chạy end-to-end không cần TikTok.

## 2. Sơ đồ tầng

1. **External live source:** TikTok LIVE hoặc nguồn connector hợp lệ.
2. **Provider adapter:** đọc payload đặc thù, reconnect và chuyển thành event nội bộ.
3. **Normalization/validation:** kiểm tra schema, chuẩn hóa timestamp, user, gift, comment.
4. **Deduplication:** phát hiện event lặp bằng event ID hoặc idempotency key.
5. **Identity/session:** gắn event vào đúng live session và user ID.
6. **Gameplay services:** command parser, gift mapping, score, notification, presence.
7. **Realtime transport:** Socket.IO room theo session.
8. **Game client:** cập nhật logical/visual state, chạy animation và UI.
9. **Admin/observability:** trạng thái connector, metrics, event log và test tools.

Xem `../diagrams/architecture.svg` và `../diagrams/event_flow.svg`.

## 3. Gợi ý cấu trúc source

```text
phat-dien-game/
  apps/
    web-game/
      src/game/scene/
      src/game/characters/
      src/game/animations/
      src/game/effects/
      src/game/ui/
      src/admin/
      src/stores/
      src/services/
    server/
      src/providers/
      src/sessions/
      src/identity/
      src/avatars/
      src/commands/
      src/gifts/
      src/scores/
      src/notifications/
      src/events/
      src/socket/
      src/admin/
  packages/
    shared-types/
    config/
  assets/
    models/
    textures/
    audio/
  docs/
```

## 4. LiveEventProvider contract

Pseudo-TypeScript:

```ts
export type LiveEventType =
  | 'viewer_joined' | 'viewer_left' | 'comment' | 'gift'
  | 'share' | 'follow' | 'like' | 'viewer_count'
  | 'live_started' | 'live_ended' | 'connection_status'
  | 'connection_error';

export interface LiveUser {
  platformUserId: string;
  nickname: string;
  avatarUrl?: string;
}

export interface NormalizedLiveEvent<T = unknown> {
  eventId: string;
  sessionId: string;
  provider: 'mock' | 'tiktok' | string;
  type: LiveEventType;
  occurredAt: string;
  user?: LiveUser;
  payload: T;
  dedupeKey?: string;
}

export interface LiveEventProvider {
  connect(options: Record<string, unknown>): Promise<void>;
  disconnect(): Promise<void>;
  onEvent(handler: (event: NormalizedLiveEvent) => void): () => void;
  getStatus(): 'disconnected' | 'connecting' | 'connected' | 'error';
}
```

Một connector có thể không phát đầy đủ `viewer_joined`, `viewer_left`, `avatarUrl` hoặc gift metadata. Adapter phải biểu diễn field thiếu là `undefined`/null; tuyệt đối không bịa dữ liệu.

## 5. Luồng xử lý comment

1. Validate normalized event.
2. Kiểm tra session đang active.
3. Resolve user theo `platformUserId`.
4. Nếu chưa có avatar và đây là first interaction, tạo logical player + avatar.
5. Normalize comment text.
6. Match command theo exact/prefix mode.
7. Check per-user cooldown và rate limit.
8. Ghi event/action log.
9. Đưa animation action vào queue.
10. Emit `avatar.action` tới socket room của session.
11. Frontend tìm đúng avatar theo `playerId` và chạy animation.
12. Nếu command không match, có thể hiển thị comment bubble theo policy, nhưng không kích hoạt animation.

## 6. Luồng xử lý gift

1. Nhận gift event.
2. Validate sender, gift metadata, quantity và repeat state.
3. Tạo dedupe key và loại duplicate.
4. Resolve/create player.
5. Tìm gift mapping theo gift ID; fallback theo nhóm nếu admin cho phép.
6. Tính action/scene effect.
7. Ghi gift record idempotently.
8. Dispatch avatar action và/hoặc scene effect.
9. Cập nhật ranking/metrics theo rule được cấu hình.
10. Emit notification.

Gift streak phải tuân theo semantics thực tế của provider: một số connector phát nhiều update trong lúc streak chạy. Không cộng `repeatCount` như giao dịch mới ở mọi update nếu payload là snapshot tổng lũy kế.

## 7. Presence và định danh

`PlayerSession` tối thiểu:

```ts
interface PlayerSession {
  id: string;
  sessionId: string;
  platformUserId: string;
  nickname: string;
  identitySource: 'viewer_join' | 'first_interaction_fallback';
  firstSeenAt: string;
  lastSeenAt: string;
  presenceStatus: 'active' | 'idle' | 'left' | 'unknown';
  avatarVariantId: string;
  spawnSlotId?: string;
  activityScore: number;
  ritualActionCount: number;
  giftCount: number;
}
```

Nếu không có viewer_left, không được khẳng định user đã rời. Dùng `presenceStatus: unknown` hoặc quy tắc idle timeout được ghi rõ; không xóa identity ngay khi mất kết nối.

## 8. Socket events

Client → server:
- `admin.session.start`
- `admin.session.stop`
- `admin.test.event`
- `admin.config.update`
- `admin.provider.connect`
- `admin.provider.disconnect`

Server → client:
- `session.state`
- `player.created`
- `player.updated`
- `player.action`
- `scene.effect`
- `ranking.updated`
- `notification.created`
- `metrics.updated`
- `provider.status`
- `server.error`

Mọi admin action phải được xác thực. Browser Source chỉ nhận data cần render, không nhận provider credentials.

## 9. Database tối thiểu

- `LiveSession`: id, provider, status, startedAt, endedAt, settings.
- `PlayerSession`: sessionId, platformUserId, nickname, identitySource, variant, timestamps, score counters.
- `ProcessedEvent`: sessionId, provider, eventId/dedupeKey, eventType, processedAt.
- `PlayerAction`: playerSessionId, actionId, sourceEventId, createdAt.
- `GiftRecord`: playerSessionId, giftId, giftName, count, providerValue?, eventKey.
- `CommandMapping`: alias, normalizedAlias, commandId, enabled, cooldownMs.
- `GiftMapping`: giftId/group, actionType, animationId, effectId, scoreRule.
- `SessionSummary`: aggregate counts and final ranking snapshot.

## 10. Quy mô và hiệu năng

Không đồng nhất “10.000 logical players” với “10.000 avatar chất lượng cao render đồng thời”.

- Backend có thể stress-test event stream và hàng nghìn logical identities bằng mock.
- Rendering chọn số avatar theo benchmark thực trên máy streamer.
- LOD: avatar gần rõ, xa đơn giản hơn; rất xa có thể marker/cluster.
- Instancing dùng cho thành phần lặp như hoa, đèn, hiệu ứng hạt; rigged skinned avatars có thể cần GPU instancing chuyên biệt hoặc giới hạn số lượng.
- Tách animation update rate theo khoảng cách.
- Limit particle, notification và bubble.
- Không broadcast ranking update cho từng event nếu có thể batch 500–1500ms.

## 11. Observability

Metrics đề xuất:
- provider connection state
- event rate by type
- invalid events
- duplicate events
- command match rate
- queue depth / queue latency
- socket connected clients
- logical players
- rendered avatars
- frame time / FPS (client)
- reconnect count
- gift streak dedupe count

## 12. Security

- Environment secrets chỉ backend.
- Không truyền cookie/session token cá nhân vào frontend.
- Validate tất cả event và admin inputs.
- Rate limit theo IP/user/session.
- Xác thực admin.
- Không ghi raw payload có dữ liệu cá nhân vượt mức cần thiết.
- Có retention và clear session data policy.

/**
 * Event Queue & Identity Engine — PHẬT ĐIỆN VẠN NGƯỜI
 * Tích hợp theo chuẩn Game Kit:
 * 1. Event Deduplication & Idempotency (Chống trùng lặp sự kiện)
 * 2. Per-User Rate Limiting & Cooldowns (Chống spam comment)
 * 3. Dynamic Command & Gift Mapping (Quản lý cấu hình JSON thời gian thực)
 * 4. Bảng TÂM LÒNG THÀNH (Leaderboard Top 10) & Session Manager
 */

const fs = require('fs');
const path = require('path');

const COMMAND_CONFIG_PATH = path.join(__dirname, '..', 'config', 'command-mapping.json');
const GIFT_CONFIG_PATH = path.join(__dirname, '..', 'config', 'gift-mapping.json');

class EventQueue {
  constructor() {
    this.highPriorityQueue = [];   // Quà tặng lớn & cúng dường đặc biệt
    this.normalPriorityQueue = []; // Comment lệnh, Vái lạy, Quỳ, Dâng hoa, Gõ mõ
    this.totalMerit = 12480;       // Khởi điểm công đức
    this.timer = null;
    this.io = null;
    this.intervalMs = 80;          // ~12 events / sec

    this.users = new Map();        // uniqueId -> User Profile & Stats
    this.userCooldowns = new Map();// `${userId}:${commandId}` -> lastExecutedTime
    this.seenEventIds = new Set(); // Chống trùng lặp theo Event ID
    this.seenDedupeKeys = new Map();// dedupeKey -> timestamp (idempotency)

    this.commandConfig = this._loadCommandConfig();
    this.giftConfig = this._loadGiftConfig();

    // Dọn dẹp cache dedupe định kỳ mỗi 60 giây
    setInterval(() => this._cleanupDedupeCache(), 60000);
  }

  _loadCommandConfig() {
    try {
      if (fs.existsSync(COMMAND_CONFIG_PATH)) {
        return JSON.parse(fs.readFileSync(COMMAND_CONFIG_PATH, 'utf8'));
      }
    } catch (e) {
      console.warn('[EventQueue] Không đọc được command-mapping.json, dùng cấu hình mặc định:', e.message);
    }
    return { mode: 'exact', defaultCooldownMs: 2500, commands: [] };
  }

  _loadGiftConfig() {
    try {
      if (fs.existsSync(GIFT_CONFIG_PATH)) {
        return JSON.parse(fs.readFileSync(GIFT_CONFIG_PATH, 'utf8'));
      }
    } catch (e) {
      console.warn('[EventQueue] Không đọc được gift-mapping.json, dùng cấu hình mặc định:', e.message);
    }
    return { streakPolicy: { deduplicateByProviderEventId: true }, mappings: [] };
  }

  getCommandConfig() {
    return this.commandConfig;
  }

  updateCommandConfig(newConfig) {
    this.commandConfig = newConfig;
    try {
      fs.writeFileSync(COMMAND_CONFIG_PATH, JSON.stringify(newConfig, null, 2), 'utf8');
      console.log('[EventQueue] Đã lưu cấu hình command-mapping.json mới.');
    } catch (e) {
      console.error('[EventQueue] Lỗi khi lưu command-mapping.json:', e.message);
    }
  }

  getGiftConfig() {
    return this.giftConfig;
  }

  updateGiftConfig(newConfig) {
    this.giftConfig = newConfig;
    try {
      fs.writeFileSync(GIFT_CONFIG_PATH, JSON.stringify(newConfig, null, 2), 'utf8');
      console.log('[EventQueue] Đã lưu cấu hình gift-mapping.json mới.');
    } catch (e) {
      console.error('[EventQueue] Lỗi khi lưu gift-mapping.json:', e.message);
    }
  }

  init(io) {
    this.io = io;
    if (!this.timer) {
      this.timer = setInterval(() => this.processNext(), this.intervalMs);
    }
  }

  _cleanupDedupeCache() {
    const now = Date.now();
    for (const [key, ts] of this.seenDedupeKeys.entries()) {
      if (now - ts > 60000) {
        this.seenDedupeKeys.delete(key);
      }
    }
    if (this.seenEventIds.size > 2000) {
      this.seenEventIds.clear();
    }
  }

  /**
   * Kiểm tra Cooldown theo từng User ID và Command ID
   */
  checkUserCooldown(userId, commandId) {
    if (!userId || !commandId) return true;
    const now = Date.now();
    const key = `${userId}:${commandId}`;
    const lastTime = this.userCooldowns.get(key) || 0;

    let cooldownMs = this.commandConfig.defaultCooldownMs || 2500;
    const matchedCmd = this.commandConfig.commands?.find(c => c.id === commandId);
    if (matchedCmd && matchedCmd.cooldownMs) {
      cooldownMs = matchedCmd.cooldownMs;
    }

    if (now - lastTime < cooldownMs) {
      return false; // Còn trong thời gian chờ (cooldown)
    }

    this.userCooldowns.set(key, now);
    return true;
  }

  /**
   * Tính điểm tương tác & công đức theo cấu hình
   */
  calculateMerit(actionType, payload = {}) {
    const repeatCount = payload.repeatCount || 1;

    // 1. Kiểm tra trong gift mapping
    const giftMap = this.giftConfig.mappings?.find(g => g.id === actionType);
    if (giftMap && giftMap.pointsPerUnit) {
      return giftMap.pointsPerUnit * repeatCount;
    }

    // 2. Kiểm tra trong command mapping
    const cmdMap = this.commandConfig.commands?.find(c => c.id === actionType);
    if (cmdMap && cmdMap.points) {
      return cmdMap.points;
    }

    // 3. Fallback theo mặc định
    switch (actionType) {
      case 'VIEWER_JOINED': return 1;
      case 'SHARE': return 10;
      case 'CHANT':
      case 'NIEM_PHAT': return 2;
      case 'KNEEL': return 2;
      case 'BOW': return 3;
      case 'STAND': return 2;
      case 'PRAY':
      case 'PRAYER_TEXT': return 5;
      case 'OFFER_FLOWER': return 5;
      case 'OFFER_INCENSE': return 10;
      case 'WALK_TO_ALTAR': return 5;
      case 'WOODEN_FISH': return 1 * (payload.intensity || 1);
      case 'COMMENT_CHAT': return 1;
      default: return 5;
    }
  }

  /**
   * Cập nhật danh tính và thống kê người chơi (User Identity Manager)
   */
  _trackUser(user, actionType, points, payload = {}) {
    if (!user || !user.uniqueId) return;
    const uid = user.uniqueId;
    let existing = this.users.get(uid);

    if (!existing) {
      existing = {
        uniqueId: uid,
        nickname: user.nickname || 'Phật Tử',
        avatarUrl: user.avatarUrl || 'https://via.placeholder.com/100',
        score: 0,
        actionsCount: 0,
        giftsCount: 0,
        joinedAt: Date.now(),
        lastActive: Date.now(),
        lastAction: actionType,
        avatarIndex: this.users.size % 8 // 8 biến thể trang phục
      };
      this.users.set(uid, existing);
    }

    existing.nickname = user.nickname || existing.nickname;
    if (user.avatarUrl) existing.avatarUrl = user.avatarUrl;
    existing.score += points;
    existing.actionsCount += 1;
    existing.lastActive = Date.now();
    existing.lastAction = actionType;

    if (actionType.startsWith('INCENSE') || actionType.startsWith('GOLDEN') || ['BELL', 'CONFETTI', 'LANTERN', 'OFFERING_FRUIT', 'PARADE_FLOAT', 'BUDDHA_LIGHT', 'THOUSAND_LANTERNS', 'TIKTOK_UNIVERSE'].includes(actionType)) {
      existing.giftsCount += (payload.repeatCount || 1);
    }

    return existing;
  }

  getLeaderboard(limit = 10) {
    return Array.from(this.users.values())
      .sort((a, b) => b.score - a.score || b.actionsCount - a.actionsCount)
      .slice(0, limit);
  }

  getAllUsers() {
    return Array.from(this.users.values());
  }

  resetUsers() {
    this.users.clear();
    this.userCooldowns.clear();
    this.totalMerit = 12480;
  }

  enqueue(event) {
    if (!event || !event.actionType) return false;

    // 1. Chống trùng lặp theo Event ID
    const eventId = event.id || `evt_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    if (this.seenEventIds.has(eventId)) {
      console.log(`[EventQueue] Bỏ qua sự kiện trùng ID: ${eventId}`);
      return false;
    }
    this.seenEventIds.add(eventId);

    // 2. Chống trùng lặp theo dedupeKey (Idempotency)
    const dedupeKey = event.dedupeKey || `${event.actionType}:${event.user?.uniqueId}:${eventId}`;
    if (this.seenDedupeKeys.has(dedupeKey)) {
      return false;
    }
    this.seenDedupeKeys.set(dedupeKey, Date.now());

    // 3. Kiểm tra Cooldown theo user (nếu là comment/command)
    const isCommand = ['CHANT', 'NIEM_PHAT', 'KNEEL', 'BOW', 'STAND', 'PRAY', 'OFFER_INCENSE', 'OFFER_FLOWER', 'WALK_TO_ALTAR'].includes(event.actionType);
    if (isCommand && event.user?.uniqueId) {
      const allowed = this.checkUserCooldown(event.user.uniqueId, event.actionType);
      if (!allowed) {
        // Vẫn gửi comment bubble nếu có comment, nhưng không lặp animation
        return false;
      }
    }

    const normalizedEvent = {
      id: eventId,
      timestamp: event.timestamp || Date.now(),
      actionType: event.actionType,
      dedupeKey,
      user: {
        uniqueId: event.user?.uniqueId || 'phat_tu_an_danh',
        nickname: event.user?.nickname || 'Phật Tử Thành Tâm',
        avatarUrl: event.user?.avatarUrl || 'https://via.placeholder.com/100'
      },
      payload: {
        comment: event.payload?.comment || '',
        command: event.payload?.command || event.actionType,
        giftName: event.payload?.giftName || '',
        diamondCount: Number(event.payload?.diamondCount) || 0,
        repeatCount: Number(event.payload?.repeatCount) || 1,
        totalCoins: Number(event.payload?.totalCoins) || 0,
        intensity: Number(event.payload?.intensity) || 1,
        tier: event.payload?.tier || 'normal'
      }
    };

    const merit = this.calculateMerit(normalizedEvent.actionType, normalizedEvent.payload);
    this.totalMerit += merit;

    // Cập nhật User Identity & Stats
    const userProfile = this._trackUser(normalizedEvent.user, normalizedEvent.actionType, merit, normalizedEvent.payload);
    if (userProfile) {
      normalizedEvent.user.avatarIndex = userProfile.avatarIndex;
      normalizedEvent.user.score = userProfile.score;
      normalizedEvent.user.actionsCount = userProfile.actionsCount;
    }

    normalizedEvent.leaderboard = this.getLeaderboard(10);
    normalizedEvent.totalMerit = this.totalMerit;

    // Quà tặng từ 99 xu trở lên hoặc quà lớn thuộc mức ưu tiên cao
    const highPriorityTypes = [
      'BELL', 'CONFETTI', 'PARADE_FLOAT', 'BUDDHA_LIGHT',
      'THOUSAND_LANTERNS', 'GOLDEN_PAGODA', 'GOLDEN_LION',
      'GOLDEN_PHOENIX', 'TIKTOK_UNIVERSE'
    ];

    if (highPriorityTypes.includes(normalizedEvent.actionType)) {
      this.highPriorityQueue.push(normalizedEvent);
    } else {
      this.normalPriorityQueue.push(normalizedEvent);
    }

    return true;
  }

  processNext() {
    if (!this.io) return;

    let eventToEmit = null;
    if (this.highPriorityQueue.length > 0) {
      eventToEmit = this.highPriorityQueue.shift();
    } else if (this.normalPriorityQueue.length > 0) {
      eventToEmit = this.normalPriorityQueue.shift();
    }

    if (eventToEmit) {
      this.io.emit('stream_event', eventToEmit);
    }
  }

  getTotalMerit() {
    return this.totalMerit;
  }

  getStats() {
    return {
      highPriorityLength: this.highPriorityQueue.length,
      normalPriorityLength: this.normalPriorityQueue.length,
      totalMerit: this.totalMerit,
      totalUsers: this.users.size,
      top1: this.getLeaderboard(1)[0] || null
    };
  }

  destroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

const eventQueue = new EventQueue();
module.exports = eventQueue;

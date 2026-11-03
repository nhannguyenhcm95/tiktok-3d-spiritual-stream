/**
 * Event Queue & User Identity Engine — PHẬT ĐIỆN VẠN NGƯỜI
 * Quản lý hàng đợi ưu tiên, danh tính người chơi (User Identity Manager),
 * tính điểm Bảng TÂM LÒNG THÀNH (Leaderboard) và điều tiết sự kiện thời gian thực.
 */

class EventQueue {
  constructor() {
    this.highPriorityQueue = [];   // Quà tặng lớn & cúng dường đặc biệt
    this.normalPriorityQueue = []; // Comment lệnh, Vái lạy, Quỳ, Dâng hoa, Gõ mõ
    this.totalMerit = 12480;       // Khởi điểm công đức
    this.timer = null;
    this.io = null;
    this.intervalMs = 80;          // ~12 events / sec
    this.users = new Map();        // uniqueId -> User Profile & Stats
    this.maxAvatars = 200;         // Giới hạn quản lý avatar cùng lúc
  }

  init(io) {
    this.io = io;
    if (!this.timer) {
      this.timer = setInterval(() => this.processNext(), this.intervalMs);
    }
  }

  /**
   * Tính điểm tương tác & công đức theo đúng bảng giá cúng dường và lệnh
   */
  calculateMerit(actionType, payload = {}) {
    const repeatCount = payload.repeatCount || 1;
    const coins = payload.totalCoins || payload.diamondCount || 1;

    switch (actionType) {
      case 'VIEWER_JOINED':
        return 1;
      case 'SHARE':
        return 10;
      case 'NIEM_PHAT':
        return 2;
      case 'KNEEL':
        return 2;
      case 'BOW':
        return 3;
      case 'STAND':
        return 2;
      case 'PRAY':
        return 5;
      case 'OFFER_FLOWER':
        return 5;
      case 'WALK_TO_ALTAR':
        return 5;
      case 'WOODEN_FISH':
        return 1 * (payload.intensity || 1);
      case 'PRAYER_TEXT':
        return 5;
      case 'COMMENT_CHAT':
        return 1;
      case 'INCENSE_1':
        return 10 * repeatCount;
      case 'INCENSE_3':
        return 50 * repeatCount;
      case 'LANTERN':
        return 100 * repeatCount;
      case 'OFFERING_FRUIT':
        return 200 * repeatCount;
      case 'BELL':
        return 1000 * repeatCount;
      case 'CONFETTI':
        return 1500 * repeatCount;
      case 'PARADE_FLOAT':
        return 30000 * repeatCount;
      case 'BUDDHA_LIGHT':
        return 50000 * repeatCount;
      case 'THOUSAND_LANTERNS':
        return 70000 * repeatCount;
      case 'GOLDEN_PAGODA':
        return 200000 * repeatCount;
      case 'GOLDEN_LION':
        return 300000 * repeatCount;
      case 'GOLDEN_PHOENIX':
        return 400000 * repeatCount;
      case 'TIKTOK_UNIVERSE':
        return 5000000 * repeatCount;
      default:
        return Math.max(1, coins * 10 * repeatCount);
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

  /**
   * Lấy danh sách Bảng TÂM LÒNG THÀNH (Top N)
   */
  getLeaderboard(limit = 10) {
    return Array.from(this.users.values())
      .sort((a, b) => b.score - a.score || b.actionsCount - a.actionsCount)
      .slice(0, limit);
  }

  /**
   * Lấy toàn bộ danh sách Phật tử trong điện
   */
  getAllUsers() {
    return Array.from(this.users.values());
  }

  resetUsers() {
    this.users.clear();
    this.totalMerit = 12480;
  }

  enqueue(event) {
    if (!event || !event.actionType) return;

    const normalizedEvent = {
      id: event.id || `evt_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      timestamp: event.timestamp || Date.now(),
      actionType: event.actionType,
      user: {
        uniqueId: event.user?.uniqueId || 'phat_tu_an_danh',
        nickname: event.user?.nickname || 'Phật Tử Thành Tâm',
        avatarUrl: event.user?.avatarUrl || 'https://via.placeholder.com/100'
      },
      payload: {
        comment: event.payload?.comment || '',
        command: event.payload?.command || '',
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

    // Đính kèm leaderboard top 10
    normalizedEvent.leaderboard = this.getLeaderboard(10);
    normalizedEvent.totalMerit = this.totalMerit;

    // Quà tặng từ 99 xu trở lên thuộc mức ưu tiên cao
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

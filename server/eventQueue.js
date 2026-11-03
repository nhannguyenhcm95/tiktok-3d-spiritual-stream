/**
 * Event Queue & Rate Limiter for TikTok Spiritual Live Stream
 * Quản lý hàng đợi ưu tiên, điều tiết tốc độ phát và tính điểm công đức
 * theo bảng giá cúng dường thực tế của TikTok Live.
 */

class EventQueue {
  constructor() {
    this.highPriorityQueue = [];   // Quà tặng lớn & cúng dường đặc biệt
    this.normalPriorityQueue = []; // Comment, Vái lạy A Di Đà Phật, Gõ mõ
    this.totalMerit = 12480;       // Khởi điểm công đức chùa An Lạc
    this.timer = null;
    this.io = null;
    this.intervalMs = 80;          // ~12 events / sec
  }

  init(io) {
    this.io = io;
    if (!this.timer) {
      this.timer = setInterval(() => this.processNext(), this.intervalMs);
    }
  }

  /**
   * Tính điểm công đức tương ứng với cấp bậc donate
   */
  calculateMerit(actionType, payload = {}) {
    const repeatCount = payload.repeatCount || 1;
    const coins = payload.diamondCount || 1;

    switch (actionType) {
      case 'BOW':
        return 2; // Niệm A Di Đà Phật vái lạy
      case 'WOODEN_FISH':
        return 1 * (payload.intensity || 1);
      case 'PRAYER_TEXT':
        return 5;
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

  enqueue(event) {
    if (!event || !event.actionType) return;

    const normalizedEvent = {
      id: event.id || `evt_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      timestamp: event.timestamp || Date.now(),
      actionType: event.actionType,
      user: {
        uniqueId: event.user?.uniqueId || 'khach_hanh_huong',
        nickname: event.user?.nickname || 'Khách Hành Hương',
        avatarUrl: event.user?.avatarUrl || 'https://via.placeholder.com/100'
      },
      payload: {
        comment: event.payload?.comment || '',
        giftName: event.payload?.giftName || '',
        diamondCount: Number(event.payload?.diamondCount) || 1,
        repeatCount: Number(event.payload?.repeatCount) || 1,
        intensity: Number(event.payload?.intensity) || 1,
        tier: event.payload?.tier || 'normal'
      }
    };

    const merit = this.calculateMerit(normalizedEvent.actionType, normalizedEvent.payload);
    this.totalMerit += merit;

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
      totalMerit: this.totalMerit
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

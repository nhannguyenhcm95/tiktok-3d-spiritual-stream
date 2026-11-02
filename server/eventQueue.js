/**
 * Event Queue & Rate Limiter for TikTok Spiritual Live Stream
 * Quản lý hàng đợi ưu tiên, điều tiết tốc độ (12 events/sec ~ 85ms/event)
 * và tự động gộp sự kiện mõ khi dồn hàng đợi (Batching).
 */

class EventQueue {
  constructor() {
    this.highPriorityQueue = []; // Priority 1: BELL, LANTERN, INCENSE
    this.normalPriorityQueue = []; // Priority 2: PRAYER_TEXT, WOODEN_FISH
    this.totalMerit = 0;
    this.timer = null;
    this.io = null;
    this.intervalMs = 85; // ~11.76 events / sec (< 12 events/s)
  }

  /**
   * Gán đối tượng Socket.io và bắt đầu vòng lặp xử lý hàng đợi
   * @param {import('socket.io').Server} io
   */
  init(io) {
    this.io = io;
    if (!this.timer) {
      this.timer = setInterval(() => this.processNext(), this.intervalMs);
    }
  }

  /**
   * Tính điểm công đức tương ứng với loại hành động
   * @param {string} actionType
   * @param {object} payload
   * @returns {number}
   */
  calculateMerit(actionType, payload = {}) {
    const intensity = payload.intensity || 1;
    const repeatCount = payload.repeatCount || 1;
    switch (actionType) {
      case 'WOODEN_FISH':
        return 1 * intensity;
      case 'PRAYER_TEXT':
        return 2 * intensity;
      case 'INCENSE':
        return 10 * repeatCount;
      case 'LANTERN':
        return 50 * repeatCount;
      case 'BELL':
        return 200 * repeatCount;
      default:
        return 1;
    }
  }

  /**
   * Đẩy một sự kiện vào hàng đợi thích hợp
   * @param {object} event
   */
  enqueue(event) {
    if (!event || !event.actionType) return;

    // Chuẩn hóa cấu trúc event nếu thiếu
    const normalizedEvent = {
      id: event.id || `evt_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      timestamp: event.timestamp || Date.now(),
      actionType: event.actionType,
      user: {
        uniqueId: event.user?.uniqueId || 'anonym_user',
        nickname: event.user?.nickname || 'Khán Giả Ẩn Danh',
        avatarUrl: event.user?.avatarUrl || 'https://via.placeholder.com/100'
      },
      payload: {
        comment: event.payload?.comment || '',
        giftName: event.payload?.giftName || '',
        diamondCount: Number(event.payload?.diamondCount) || 1,
        repeatCount: Number(event.payload?.repeatCount) || 1,
        intensity: Number(event.payload?.intensity) || 1
      }
    };

    // Cộng điểm công đức toàn cục
    const merit = this.calculateMerit(normalizedEvent.actionType, normalizedEvent.payload);
    this.totalMerit += merit;

    // Phân loại ưu tiên
    if (['BELL', 'LANTERN', 'INCENSE'].includes(normalizedEvent.actionType)) {
      this.highPriorityQueue.push(normalizedEvent);
    } else {
      // Nếu hàng đợi WOODEN_FISH quá 50 sự kiện, tự động gộp (Batching)
      if (normalizedEvent.actionType === 'WOODEN_FISH') {
        const woodenFishCount = this.normalPriorityQueue.filter(
          (e) => e.actionType === 'WOODEN_FISH'
        ).length;

        if (woodenFishCount >= 50) {
          // Tìm sự kiện WOODEN_FISH gần nhất của cùng user hoặc cuối cùng để tăng intensity
          const lastFish = [...this.normalPriorityQueue]
            .reverse()
            .find((e) => e.actionType === 'WOODEN_FISH');

          if (lastFish) {
            lastFish.payload.intensity = (lastFish.payload.intensity || 1) + normalizedEvent.payload.intensity;
            return;
          }
        }
      }
      this.normalPriorityQueue.push(normalizedEvent);
    }
  }

  /**
   * Lấy sự kiện tiếp theo để phát xuống Frontend
   */
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

  /**
   * Lấy tổng công đức hiện tại
   * @returns {number}
   */
  getTotalMerit() {
    return this.totalMerit;
  }

  /**
   * Đặt lại hoặc cập nhật tổng công đức
   * @param {number} points
   */
  addMerit(points) {
    this.totalMerit += points;
  }

  /**
   * Lấy thông tin thống kê hàng đợi
   */
  getStats() {
    return {
      highPriorityLength: this.highPriorityQueue.length,
      normalPriorityLength: this.normalPriorityQueue.length,
      totalMerit: this.totalMerit
    };
  }

  /**
   * Dừng bộ đếm khi tắt server
   */
  destroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

// Export singleton instance
const eventQueue = new EventQueue();
module.exports = eventQueue;


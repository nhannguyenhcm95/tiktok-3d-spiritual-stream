/**
 * Event Queue & Spotlight Incense Sequencer
 * Điều phối sự kiện Solo Dâng Hương tuần tự, tránh xung đột khi nhiều người tặng quà cùng lúc.
 * Tuân thủ chuẩn CONTRACT.md
 */

class EventQueue {
  constructor() {
    this.io = null;
    this.spotlightQueue = [];
    this.isProcessingSpotlight = false;
    this.spotlightDurationMs = 4800; // 4.8 giây mỗi nghi thức dâng hương
    this.totalSpotlightsServed = 0;
    this.ttsWishes = [
      '{nickname} đã gửi tặng chùa {giftName}, chúc bạn tâm an trí sáng.',
      '{nickname} đã dâng hương, chúc bạn tiền vào như nước.',
      '{nickname} đã dâng hương, chúc bạn sớm có người yêu.',
      '{nickname} đã dâng hương, chúc gia đình vạn sự bình an, học hành đỗ đạt.',
      '{nickname} dâng hương kính Phật, chúc công thành danh toại, vạn sự hanh thông.',
      '{nickname} đã dâng nén tâm hương, chúc thân tâm an lạc, phước thọ vô biên.',
      '{nickname} đã cúng dường hoa quả, chúc tài lộc dồi dào, phúc như đông hải.'
    ];
  }

  /**
   * Khởi tạo socket.io instance
   */
  init(io) {
    this.io = io;
  }

  /**
   * Sinh câu chúc ngẫu nhiên kèm tên và quà tặng
   */
  generateTtsText(nickname, giftName) {
    const template = this.ttsWishes[Math.floor(Math.random() * this.ttsWishes.length)];
    return template
      .replace('{nickname}', nickname || 'Phật tử')
      .replace('{giftName}', giftName || 'tâm hương');
  }

  /**
   * Thêm sự kiện tặng quà vào hàng đợi dâng hương
   */
  enqueueSpotlight(giftData) {
    const {
      uniqueId,
      nickname,
      giftName = 'Hoa hồng',
      diamondCount = 10,
      repeatCount = 1,
      robeType = 'GREY'
    } = giftData;

    const ttsText = giftData.ttsText || this.generateTtsText(nickname, giftName);

    const eventPayload = {
      id: `gift_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      uniqueId: uniqueId || `user_${Date.now()}`,
      nickname: nickname || 'Phật tử ẩn danh',
      giftName,
      diamondCount: Number(diamondCount) || 1,
      repeatCount: Number(repeatCount) || 1,
      robeType,
      ttsText
    };

    this.spotlightQueue.push(eventPayload);
    this.processQueue();
    return eventPayload;
  }

  /**
   * Xử lý hàng đợi tuần tự, mỗi sự kiện cách nhau spotlightDurationMs
   */
  processQueue() {
    if (this.isProcessingSpotlight || this.spotlightQueue.length === 0) {
      return;
    }

    this.isProcessingSpotlight = true;
    const currentEvent = this.spotlightQueue.shift();
    this.totalSpotlightsServed++;

    if (this.io) {
      // Phát sự kiện spotlight_incense tới client
      this.io.emit('spotlight_incense', currentEvent);
      console.log(`[SpotlightQueue] Phát spotlight_incense cho: ${currentEvent.nickname} (${currentEvent.giftName})`);
    }

    // Sau khi diễn hoạt xong 4.8 giây, mở khóa để phục vụ người tiếp theo
    setTimeout(() => {
      this.isProcessingSpotlight = false;
      this.processQueue();
    }, this.spotlightDurationMs);
  }

  /**
   * Lấy thống kê hàng đợi
   */
  getStats() {
    return {
      queueLength: this.spotlightQueue.length,
      isBusy: this.isProcessingSpotlight,
      totalServed: this.totalSpotlightsServed
    };
  }
}

module.exports = new EventQueue();

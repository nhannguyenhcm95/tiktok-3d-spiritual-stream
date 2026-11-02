/**
 * Mock Simulator Module
 * Tự động tạo sự kiện ngẫu nhiên chân thực khi chưa có live stream TikTok
 * và hỗ trợ kích hoạt thủ công qua Debug Panel REST API.
 */

const eventQueue = require('./eventQueue');

class MockSimulator {
  constructor() {
    this.timer = null;
    this.enabled = false;

    // Danh sách tên người dùng Việt Nam chân thực
    this.users = [
      { uniqueId: 'thien_nhan_vn', nickname: 'Thiện Nhân', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' },
      { uniqueId: 'minh_anh_hanoi', nickname: 'Minh Anh', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
      { uniqueId: 'hoang_long_88', nickname: 'Hoàng Long', avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop' },
      { uniqueId: 'thu_hien_peace', nickname: 'Thu Hiền', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
      { uniqueId: 'bao_ngoc_zen', nickname: 'Bảo Ngọc', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop' },
      { uniqueId: 'duc_phuc_99', nickname: 'Đức Phúc', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
      { uniqueId: 'thanh_tam_chua', nickname: 'Thanh Tâm', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop' },
      { uniqueId: 'dieu_huong_vn', nickname: 'Diệu Hương', avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop' },
      { uniqueId: 'tuan_kiet_sg', nickname: 'Tuấn Kiệt', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
      { uniqueId: 'ngoc_tram_an', nickname: 'Ngọc Trâm', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' }
    ];

    // Danh sách lời cầu nguyện ý nghĩa
    this.prayers = [
      'Cầu mong gia đình luôn bình an mạnh khỏe, tai qua nạn khỏi',
      'Cầu cho công việc hanh thông thuận lợi, vạn sự như ý',
      'Nam Mô A Di Đà Phật, tâm tịnh an nhiên, phúc đức tràn đầy',
      'Xin Chúa và Đức Mẹ ban bình an, tình thương cho gia đình',
      'Cầu cho ông bà cha mẹ trường thọ bách niên, sống vui khỏe',
      'Cầu cho con cái học hành đỗ đạt, công thành danh toại',
      'Cầu quốc thái dân an, phong điều vũ thuận, muôn người hạnh phúc',
      'Nguyện xin phước lành che chở cho mọi người thân yêu vượt qua khó khăn'
    ];

    // Bình luận gõ mõ
    this.fishComments = [
      'Nam Mô A Di Đà Phật',
      '1',
      'Gõ mõ tích công đức',
      'Nam Mô Quan Thế Âm Bồ Tát',
      'Amen! Tạ ơn Chúa',
      'Công đức vô lượng',
      'Tâm an vạn sự an'
    ];
  }

  /**
   * Bắt đầu vòng lặp bắn sự kiện giả lập ngẫu nhiên
   */
  start() {
    if (this.enabled) return;
    this.enabled = true;
    console.log('[MockSimulator] Chế độ AUTO_MOCK đã BẬT. Bắt đầu sinh sự kiện ngẫu nhiên...');
    this._scheduleNext();
  }

  /**
   * Dừng vòng lặp sinh sự kiện
   */
  stop() {
    this.enabled = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    console.log('[MockSimulator] Chế độ AUTO_MOCK đã TẮT.');
  }

  isEnabled() {
    return this.enabled;
  }

  _scheduleNext() {
    if (!this.enabled) return;

    // Ngẫu nhiên từ 1.2s đến 3.0s (1200ms - 3000ms)
    const delay = Math.floor(Math.random() * 1800) + 1200;
    this.timer = setTimeout(() => {
      this._generateRandomEvent();
      this._scheduleNext();
    }, delay);
  }

  _getRandomUser() {
    const idx = Math.floor(Math.random() * this.users.length);
    return this.users[idx];
  }

  /**
   * Sinh 1 sự kiện theo tỷ lệ xác suất:
   * 50% WOODEN_FISH | 20% INCENSE | 15% PRAYER_TEXT | 10% LANTERN | 5% BELL
   */
  _generateRandomEvent() {
    const rand = Math.random() * 100;
    const user = this._getRandomUser();

    if (rand < 50) {
      // 50% Gõ mõ
      const comment = this.fishComments[Math.floor(Math.random() * this.fishComments.length)];
      this.triggerManual('WOODEN_FISH', user, {
        comment,
        intensity: Math.random() < 0.2 ? 2 : 1
      });
    } else if (rand < 70) {
      // 20% Thắp nhang
      this.triggerManual('INCENSE', user, {
        giftName: 'Hoa Hồng',
        diamondCount: 1,
        repeatCount: 1,
        comment: 'Thành tâm dâng nén hương thơm'
      });
    } else if (rand < 85) {
      // 15% Lời cầu nguyện
      const prayer = this.prayers[Math.floor(Math.random() * this.prayers.length)];
      this.triggerManual('PRAYER_TEXT', user, {
        comment: prayer,
        intensity: 1
      });
    } else if (rand < 95) {
      // 10% Thả hoa đăng
      const prayer = this.prayers[Math.floor(Math.random() * this.prayers.length)];
      this.triggerManual('LANTERN', user, {
        giftName: 'Đèn Hoa Đăng Lung Linh',
        diamondCount: 10,
        repeatCount: 1,
        comment: prayer
      });
    } else {
      // 5% Thỉnh Đại Hồng Chung
      this.triggerManual('BELL', user, {
        giftName: 'Chuông Đồng Đại Phúc',
        diamondCount: 199,
        repeatCount: 1,
        comment: 'Thỉnh Đại Hồng Chung - Phước lộc tràn đầy'
      });
    }
  }

  /**
   * Kích hoạt thủ công một loại hành động (dùng cho REST API / nút bấm Debug)
   * @param {string} actionType
   * @param {object} customUser
   * @param {object} customPayload
   */
  triggerManual(actionType, customUser = null, customPayload = {}) {
    const user = customUser || this._getRandomUser();
    let payload = {
      comment: customPayload.comment || '',
      giftName: customPayload.giftName || '',
      diamondCount: customPayload.diamondCount || 1,
      repeatCount: customPayload.repeatCount || 1,
      intensity: customPayload.intensity || 1
    };

    if (!payload.comment) {
      if (actionType === 'WOODEN_FISH') payload.comment = 'Nam Mô A Di Đà Phật';
      else if (actionType === 'INCENSE') payload.comment = 'Thành kính dâng hương';
      else if (actionType === 'BELL') payload.comment = 'Thỉnh chuông cầu nguyện';
      else if (actionType === 'LANTERN') payload.comment = 'Thả đèn ước nguyện';
      else if (actionType === 'PRAYER_TEXT') payload.comment = 'Cầu mong gia quyến bình an cát tường';
    }

    const event = {
      id: `mock_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      timestamp: Date.now(),
      actionType,
      user,
      payload
    };

    eventQueue.enqueue(event);
    return event;
  }
}

// Export singleton instance
const mockSimulator = new MockSimulator();
module.exports = mockSimulator;


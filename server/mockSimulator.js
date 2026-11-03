/**
 * Mock Simulator Module
 * Giả lập luồng tương tác TikTok Live: Niệm Phật vái lạy, gửi lời cầu an,
 * và cúng dường quà tặng theo đúng bảng giá xu thực tế.
 */

const eventQueue = require('./eventQueue');

class MockSimulator {
  constructor() {
    this.timer = null;
    this.enabled = false;

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

    this.buddhaComments = [
      'Nam Mô A Di Đà Phật 🙏',
      'A Di Đà Phật',
      'Nam Mô Bổn Sư Thích Ca Mâu Ni Phật',
      'Nam Mô Đại Bi Quán Thế Âm Bồ Tát',
      'Con thành tâm vái lạy Phật 🙏',
      'Tâm an vạn sự an, A Di Đà Phật'
    ];

    this.prayers = [
      'Cầu mong cha mẹ luôn khỏe mạnh, sống đời cùng con cháu',
      'Cầu cho kỳ thi sắp tới của con thuận buồm xuôi gió',
      'Cầu gia quyến bình an, vạn sự hanh thông như ý',
      'Nguyện xin phước lành che chở cho muôn người ấm no',
      'Cầu cho công việc suôn sẻ, tai qua nạn khỏi',
      'Cầu con cái chăm ngoan học giỏi, hiếu thảo'
    ];

    // Bảng quà tặng mô phỏng đúng bảng giá xu TikTok
    this.gifts = [
      { name: 'Hoa Hồng', coins: 1, action: 'INCENSE_1' },
      { name: 'Bắn Tim', coins: 5, action: 'INCENSE_3' },
      { name: 'Cỏ Bốn Lá', coins: 10, action: 'LANTERN' },
      { name: 'Nước Hoa', coins: 20, action: 'OFFERING_FRUIT' },
      { name: 'Hạc Giấy', coins: 99, action: 'BELL' },
      { name: 'Pháo Hoa Giấy', coins: 100, action: 'CONFETTI' },
      { name: 'Xe Máy Gấu', coins: 2999, action: 'PARADE_FLOAT' },
      { name: 'Máy Bay Phản Lực', coins: 5000, action: 'BUDDHA_LIGHT' },
      { name: 'Ô Tô Thể Thao', coins: 7000, action: 'THOUSAND_LANTERNS' },
      { name: 'Lâu Đài Ảo', coins: 20000, action: 'GOLDEN_PAGODA' },
      { name: 'Con Sư Tử (Lion)', coins: 29999, action: 'GOLDEN_LION' },
      { name: 'Phượng Hoàng Lửa', coins: 39999, action: 'GOLDEN_PHOENIX' },
      { name: 'Vũ Trụ TikTok', coins: 449999, action: 'TIKTOK_UNIVERSE' }
    ];
  }

  start() {
    if (this.enabled) return;
    this.enabled = true;
    console.log('[MockSimulator] Chế độ AUTO_MOCK đã BẬT.');
    this._scheduleNext();
  }

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
    const delay = Math.floor(Math.random() * 1600) + 1200; // 1.2s - 2.8s
    this.timer = setTimeout(() => {
      this._generateRandomEvent();
      this._scheduleNext();
    }, delay);
  }

  _getRandomUser() {
    return this.users[Math.floor(Math.random() * this.users.length)];
  }

  _generateRandomEvent() {
    const rand = Math.random() * 100;
    const user = this._getRandomUser();

    if (rand < 40) {
      // 40%: Niệm A Di Đà Phật Vái Lạy
      const comment = this.buddhaComments[Math.floor(Math.random() * this.buddhaComments.length)];
      this.triggerManual('BOW', user, { comment });
    } else if (rand < 65) {
      // 25%: Gửi Lời Cầu An
      const prayer = this.prayers[Math.floor(Math.random() * this.prayers.length)];
      this.triggerManual('PRAYER_TEXT', user, { comment: prayer });
    } else {
      // 35%: Cúng Dường Quà Tặng theo bảng giá
      // Quà nhỏ (1-20 xu) chiếm đa số, quà lớn thi thoảng nổ
      const giftRand = Math.random() * 100;
      let giftItem = this.gifts[0]; // Hoa hồng

      if (giftRand < 45) giftItem = this.gifts[0]; // 1 xu
      else if (giftRand < 70) giftItem = this.gifts[1]; // 5 xu
      else if (giftRand < 85) giftItem = this.gifts[2]; // 10 xu
      else if (giftRand < 92) giftItem = this.gifts[3]; // 20 xu
      else if (giftRand < 96) giftItem = this.gifts[4]; // 99 xu
      else if (giftRand < 98) giftItem = this.gifts[5]; // 100 xu
      else if (giftRand < 99) giftItem = this.gifts[6]; // 2999 xu
      else {
        // Quà siêu to (Sư tử / Phượng hoàng / Phật quang)
        const superGifts = this.gifts.slice(7);
        giftItem = superGifts[Math.floor(Math.random() * superGifts.length)];
      }

      this.triggerManual(giftItem.action, user, {
        giftName: giftItem.name,
        diamondCount: giftItem.coins,
        repeatCount: 1,
        comment: `Cúng dường ${giftItem.name} (${giftItem.coins.toLocaleString('vi-VN')} xu)`
      });
    }
  }

  triggerManual(actionType, customUser = null, customPayload = {}) {
    const user = customUser || this._getRandomUser();
    const payload = {
      comment: customPayload.comment || '',
      giftName: customPayload.giftName || '',
      diamondCount: customPayload.diamondCount || 1,
      repeatCount: customPayload.repeatCount || 1,
      intensity: customPayload.intensity || 1
    };

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

const mockSimulator = new MockSimulator();
module.exports = mockSimulator;

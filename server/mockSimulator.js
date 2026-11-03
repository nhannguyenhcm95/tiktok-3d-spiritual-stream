/**
 * Mock Simulator Module — PHẬT ĐIỆN VẠN NGƯỜI
 * Giả lập luồng người xem TikTok Live chân thực: Người mới tham gia (Join),
 * Điều khiển Avatar bằng comment lệnh (Nam mô, Quỳ, Lạy, Cầu an, Dâng hoa, Đứng),
 * Chia sẻ Live, và Cúng dường quà tặng theo đúng bảng giá xu.
 */

const eventQueue = require('./eventQueue');

class MockSimulator {
  constructor() {
    this.timer = null;
    this.enabled = false;

    // Danh sách 24 người xem phong phú
    this.users = [
      { uniqueId: 'user_thien_nhan', nickname: 'Thiện Nhân', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' },
      { uniqueId: 'user_minh_anh', nickname: 'Minh Anh', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
      { uniqueId: 'user_hoang_long', nickname: 'Hoàng Long', avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop' },
      { uniqueId: 'user_thu_hien', nickname: 'Thu Hiền', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
      { uniqueId: 'user_bao_ngoc', nickname: 'Bảo Ngọc', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop' },
      { uniqueId: 'user_duc_phuc', nickname: 'Đức Phúc', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
      { uniqueId: 'user_thanh_tam', nickname: 'Thanh Tâm', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop' },
      { uniqueId: 'user_dieu_huong', nickname: 'Diệu Hương', avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop' },
      { uniqueId: 'user_tuan_kiet', nickname: 'Tuấn Kiệt', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
      { uniqueId: 'user_ngoc_tram', nickname: 'Ngọc Trâm', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
      { uniqueId: 'user_quang_vinh', nickname: 'Quang Vinh', avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop' },
      { uniqueId: 'user_anh_thu', nickname: 'Anh Thư', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop' },
      { uniqueId: 'user_van_hung', nickname: 'Văn Hùng', avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop' },
      { uniqueId: 'user_kim_chi', nickname: 'Kim Chi', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop' },
      { uniqueId: 'user_thien_phuc', nickname: 'Thiện Phúc', avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop' },
      { uniqueId: 'user_mai_lan', nickname: 'Mai Lan', avatarUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop' }
    ];

    this.prayers = [
      'Cầu mong cha mẹ luôn khỏe mạnh, bình an',
      'Cầu cho kỳ thi sắp tới của con thuận buồm xuôi gió',
      'Cầu gia quyến bình an, vạn sự hanh thông như ý',
      'Nguyện xin phước lành che chở cho muôn người ấm no',
      'Cầu cho công việc suôn sẻ, tai qua nạn khỏi',
      'Cầu con cái chăm ngoan học giỏi, hiếu thảo'
    ];

    // Bảng quà tặng theo bảng giá xu TikTok
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
    const delay = Math.floor(Math.random() * 1800) + 1200; // 1.2s - 3s
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

    if (rand < 15) {
      // 15%: Người mới bước vào điện (Join)
      const freshUser = {
        uniqueId: `user_new_${Math.floor(Math.random() * 900) + 100}`,
        nickname: `Phật Tử ${Math.floor(Math.random() * 900) + 100}`,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'
      };
      this.triggerManual('VIEWER_JOINED', freshUser, { comment: 'Vừa vào lễ Phật 🙏' });
    } else if (rand < 35) {
      // 20%: Lệnh Niệm Phật (NIEM_PHAT)
      this.triggerManual('NIEM_PHAT', user, { comment: 'Nam Mô A Di Đà Phật 🙏', command: 'NIEM_PHAT' });
    } else if (rand < 48) {
      // 13%: Lệnh Lạy Phật (BOW)
      this.triggerManual('BOW', user, { comment: 'Con thành tâm đảnh lễ lạy Phật 🙏', command: 'BOW' });
    } else if (rand < 58) {
      // 10%: Lệnh Quỳ (KNEEL)
      this.triggerManual('KNEEL', user, { comment: 'Quỳ', command: 'KNEEL' });
    } else if (rand < 68) {
      // 10%: Lệnh Cầu An (PRAY)
      const prayer = this.prayers[Math.floor(Math.random() * this.prayers.length)];
      this.triggerManual('PRAY', user, { comment: prayer, command: 'PRAY' });
    } else if (rand < 76) {
      // 8%: Lệnh Dâng Hoa (OFFER_FLOWER)
      this.triggerManual('OFFER_FLOWER', user, { comment: 'Dâng hoa cúng Phật 🌸', command: 'OFFER_FLOWER' });
    } else if (rand < 82) {
      // 6%: Lệnh Đứng (STAND)
      this.triggerManual('STAND', user, { comment: 'Đứng lên', command: 'STAND' });
    } else if (rand < 88) {
      // 6%: Chia sẻ Live (SHARE)
      this.triggerManual('SHARE', user, { comment: 'Đã chia sẻ buổi lễ 🙏' });
    } else {
      // 12%: Cúng Dường Quà Tặng (Gift)
      const giftRand = Math.random() * 100;
      let giftItem = this.gifts[0]; // Hoa hồng

      if (giftRand < 50) giftItem = this.gifts[0]; // 1 xu
      else if (giftRand < 75) giftItem = this.gifts[1]; // 5 xu
      else if (giftRand < 88) giftItem = this.gifts[2]; // 10 xu
      else if (giftRand < 94) giftItem = this.gifts[3]; // 20 xu
      else if (giftRand < 98) giftItem = this.gifts[4]; // 99 xu
      else giftItem = this.gifts[5]; // 100 xu

      this.triggerManual(giftItem.action, user, {
        giftName: giftItem.name,
        totalCoins: giftItem.coins,
        diamondCount: giftItem.coins,
        repeatCount: 1,
        comment: `Cúng dường ${giftItem.name} (${giftItem.coins} xu)`
      });
    }
  }

  triggerManual(actionType, user = null, payload = {}) {
    const selectedUser = user || this._getRandomUser();

    // Tìm thông tin quà tặng nếu là gift action
    const matchedGift = this.gifts.find(g => g.action === actionType);

    const event = {
      id: `mock_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      timestamp: Date.now(),
      actionType,
      user: selectedUser,
      payload: {
        comment: payload.comment || '',
        command: payload.command || actionType,
        giftName: payload.giftName || (matchedGift ? matchedGift.name : ''),
        diamondCount: payload.diamondCount || (matchedGift ? matchedGift.coins : 0),
        totalCoins: payload.totalCoins || (matchedGift ? matchedGift.coins : 0),
        repeatCount: payload.repeatCount || 1,
        intensity: payload.intensity || 1
      }
    };

    eventQueue.enqueue(event);
    return event;
  }
}

const mockSimulator = new MockSimulator();
module.exports = mockSimulator;

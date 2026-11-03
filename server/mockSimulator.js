/**
 * Mock Simulator — Giả lập Phòng Live Đông Đúc 100% Chân Thực
 * Tự động bắn bình luận cầu nguyện, chia sẻ live và quà tặng dâng hương
 * Tuân thủ chuẩn CONTRACT.md
 */

const leaderboardEngine = require('./leaderboardEngine');
const eventQueue = require('./eventQueue');

class MockSimulator {
  constructor() {
    this.io = null;
    this.enabled = false;
    this.chatTimer = null;
    this.shareTimer = null;
    this.giftTimer = null;

    this.mockPrayers = [
      'cầu thi tốt 🍀',
      'Mong bình an',
      'nam mô a di đà phật',
      'A di đà phật 🙏',
      'cho con thi qua 6 môn',
      'cầu cho live của con viral',
      'ƯỚC CÓ HÍ ✨',
      'Cầu mẹ mau lành bệnh ạ',
      'Cầu cho công việc hanh thông',
      'Cầu bình an cho cả gia đình',
      'Nam Mô Đại Bi Quán Thế Âm Bồ Tát',
      'Cầu cho con đạt học bổng kỳ này',
      'Cầu tài lộc buôn may bán đắt',
      'Con xin sám hối mọi lỗi lầm',
      'Mong mọi sự an lành, vạn sự như ý',
      'Cầu duyên lành sớm tới',
      'Chúc mọi người xem live hoan hỷ 🙏',
      'Nam Mô A Di Đà Phật 🌸',
      'Cầu sức khỏe dồi dào',
      'Xin lộc bình an may mắn'
    ];

    this.mockGifts = [
      { giftName: 'Rosa', diamondCount: 10 },
      { giftName: 'Hoa hồng', diamondCount: 1 },
      { giftName: 'Tâm hương', diamondCount: 5 },
      { giftName: 'Vương miện', diamondCount: 99 },
      { giftName: 'Cỏ 4 lá', diamondCount: 10 },
      { giftName: 'Bảo Tháp', diamondCount: 200 }
    ];
  }

  /**
   * Khởi tạo với Socket.io
   */
  init(io, autoStart = true) {
    this.io = io;
    if (autoStart) {
      this.start();
    }
  }

  isEnabled() {
    return this.enabled;
  }

  start() {
    if (this.enabled) return;
    this.enabled = true;
    console.log('[MockSimulator] Bắt đầu chế độ Auto-Mock mô phỏng phòng Live đông đúc!');

    // 1. Chu kỳ bắn bình luận cầu nguyện: Mỗi 1.2 giây
    this.chatTimer = setInterval(() => {
      this.triggerRandomChat();
    }, 1200);

    // 2. Chu kỳ bắn chia sẻ buổi lễ: Mỗi 5.5 giây
    this.shareTimer = setInterval(() => {
      this.triggerRandomShare();
    }, 5500);

    // 3. Chu kỳ bắn tặng quà Dâng Hương Spotlight: Mỗi 11 giây
    this.giftTimer = setInterval(() => {
      this.triggerRandomGift();
    }, 11000);
  }

  stop() {
    if (!this.enabled) return;
    this.enabled = false;
    clearInterval(this.chatTimer);
    clearInterval(this.shareTimer);
    clearInterval(this.giftTimer);
    this.chatTimer = null;
    this.shareTimer = null;
    this.giftTimer = null;
    console.log('[MockSimulator] Đã dừng chế độ Auto-Mock.');
  }

  toggle() {
    if (this.enabled) {
      this.stop();
    } else {
      this.start();
    }
    return this.enabled;
  }

  /**
   * Bắn 1-2 bình luận cầu nguyện ngẫu nhiên từ đám đông
   */
  triggerRandomChat() {
    if (!this.io) return;

    const payload = leaderboardEngine.getCrowdSyncPayload();
    const members = payload.crowdMembers;
    if (!members || members.length === 0) return;

    // Chọn ngẫu nhiên 1 người
    const randomMember = members[Math.floor(Math.random() * members.length)];
    const randomPrayer = this.mockPrayers[Math.floor(Math.random() * this.mockPrayers.length)];

    this.io.emit('chat_bubble', {
      id: `chat_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      uniqueId: randomMember.uniqueId,
      nickname: randomMember.nickname,
      comment: randomPrayer,
      slotIndex: randomMember.slotIndex,
      isVip: false
    });
  }

  /**
   * Bắn 1 thông báo chia sẻ live
   */
  triggerRandomShare() {
    if (!this.io) return;

    const payload = leaderboardEngine.getCrowdSyncPayload();
    const allUsers = [...payload.vipSeats, ...payload.crowdMembers];
    const user = allUsers[Math.floor(Math.random() * allUsers.length)];
    const name = user ? user.nickname : 'Phật tử';

    this.io.emit('top_banner', {
      text: `${name} đã chia sẻ buổi lễ 🙏`,
      type: 'SHARE'
    });
  }

  /**
   * Kích hoạt 1 sự kiện tặng quà Dâng Hương Spotlight
   */
  triggerRandomGift() {
    const payload = leaderboardEngine.getCrowdSyncPayload();
    const allUsers = [...payload.crowdMembers, ...payload.chasers];
    const candidate = allUsers[Math.floor(Math.random() * allUsers.length)] || {
      uniqueId: `donor_${Date.now()}`,
      nickname: 'Dâu Việt nhà Trung (モン)',
      robeType: 'GREY'
    };

    const gift = this.mockGifts[Math.floor(Math.random() * this.mockGifts.length)];
    const repeatCount = Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 1;
    const totalCoins = gift.diamondCount * repeatCount;

    // Cập nhật điểm cho thí chủ
    const user = leaderboardEngine.addOrUpdateUser({
      uniqueId: candidate.uniqueId,
      nickname: candidate.nickname,
      robeType: candidate.robeType
    }, totalCoins);

    if (this.io) {
      // Banner
      this.io.emit('top_banner', {
        text: `${user.nickname} dâng hương, cầu bình an (x${repeatCount})`,
        type: 'INCENSE'
      });

      // Đồng bộ đệm và bảng xếp hạng
      this.io.emit('crowd_sync', leaderboardEngine.getCrowdSyncPayload());
    }

    // Đẩy vào hàng đợi Spotlight
    eventQueue.enqueueSpotlight({
      uniqueId: user.uniqueId,
      nickname: user.nickname,
      giftName: gift.giftName,
      diamondCount: gift.diamondCount,
      repeatCount,
      robeType: user.robeType
    });
  }

  /**
   * Kích hoạt các loại test nhanh từ Debug Panel
   */
  triggerTest(type) {
    switch (type) {
      case 'CHAT':
        this.triggerRandomChat();
        break;
      case 'SHARE':
        this.triggerRandomShare();
        break;
      case 'GIFT_SMALL': {
        const user = leaderboardEngine.touchUser(`test_${Date.now()}`, 'Phật Tử Thí Chủ');
        leaderboardEngine.addOrUpdateUser({ uniqueId: user.uniqueId, nickname: user.nickname }, 10);
        if (this.io) {
          this.io.emit('crowd_sync', leaderboardEngine.getCrowdSyncPayload());
        }
        eventQueue.enqueueSpotlight({
          uniqueId: user.uniqueId,
          nickname: user.nickname,
          giftName: 'Hoa hồng 🌹',
          diamondCount: 10,
          repeatCount: 1,
          robeType: 'WHITE',
          ttsText: `${user.nickname} đã dâng hương, chúc bạn tâm an trí sáng!`
        });
        break;
      }
      case 'GIFT_VIP': {
        // Tặng quà lớn vượt qua Đệm 5 để nhảy vào VIP
        const fifthSeat = leaderboardEngine.getCrowdSyncPayload().fifthSeatCoins;
        const donorName = 'Đại Gia Phước Lộc';
        const user = leaderboardEngine.addOrUpdateUser(
          { uniqueId: `vip_${Date.now()}`, nickname: donorName, robeType: 'MONK_YELLOW' },
          fifthSeat + 50
        );
        if (this.io) {
          this.io.emit('top_banner', {
            text: `🎉 ${donorName} vừa công đức lớn và bước lên ĐỆM VIP!`,
            type: 'INCENSE'
          });
          this.io.emit('crowd_sync', leaderboardEngine.getCrowdSyncPayload());
        }
        eventQueue.enqueueSpotlight({
          uniqueId: user.uniqueId,
          nickname: donorName,
          giftName: 'Đại Lễ Hoàng Kim 👑',
          diamondCount: fifthSeat + 50,
          repeatCount: 1,
          robeType: 'MONK_YELLOW',
          ttsText: `${donorName} đã dâng hương công đức vô lượng, chúc bạn tiền vào như nước, vạn sự như ý!`
        });
        break;
      }
      default:
        console.warn(`[MockSimulator] Loại test không rõ: ${type}`);
    }
  }
}

module.exports = new MockSimulator();

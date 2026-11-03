/**
 * Mock Simulator for Unity & Web TikTok Live Server
 */

const leaderboardEngine = require('./leaderboardEngine');

class MockSimulator {
  constructor() {
    this.broadcastFn = null;
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
      'Nam Mô Đại Bi Quán Thế Âm Bồ Tát'
    ];
  }

  init(broadcastFn, autoStart = true) {
    this.broadcastFn = broadcastFn;
    if (autoStart) this.start();
  }

  start() {
    if (this.enabled) return;
    this.enabled = true;

    this.chatTimer = setInterval(() => {
      this.triggerRandomChat();
    }, 1200);

    this.shareTimer = setInterval(() => {
      this.triggerRandomShare();
    }, 5500);

    this.giftTimer = setInterval(() => {
      this.triggerRandomGift();
    }, 11000);
  }

  stop() {
    this.enabled = false;
    clearInterval(this.chatTimer);
    clearInterval(this.shareTimer);
    clearInterval(this.giftTimer);
  }

  triggerRandomChat() {
    if (!this.broadcastFn) return;
    const payload = leaderboardEngine.getCrowdSyncPayload();
    const member = payload.crowdMembers[Math.floor(Math.random() * payload.crowdMembers.length)];
    const prayer = this.mockPrayers[Math.floor(Math.random() * this.mockPrayers.length)];

    this.broadcastFn('chat_bubble', {
      id: `chat_${Date.now()}`,
      uniqueId: member.uniqueId,
      nickname: member.nickname,
      comment: prayer,
      slotIndex: member.slotIndex,
      isVip: false
    });
  }

  triggerRandomShare() {
    if (!this.broadcastFn) return;
    const payload = leaderboardEngine.getCrowdSyncPayload();
    const user = payload.crowdMembers[Math.floor(Math.random() * payload.crowdMembers.length)];
    this.broadcastFn('top_banner', {
      text: `${user.nickname} đã chia sẻ buổi lễ 🙏`,
      type: 'SHARE'
    });
  }

  triggerRandomGift() {
    if (!this.broadcastFn) return;
    const donorName = 'Dâu Việt nhà Trung (モン)';
    const user = leaderboardEngine.addOrUpdateUser({ uniqueId: `donor_${Date.now()}`, nickname: donorName }, 10);
    this.broadcastFn('top_banner', {
      text: `${donorName} dâng hương, cầu bình an (x1)`,
      type: 'INCENSE'
    });
    this.broadcastFn('crowd_sync', leaderboardEngine.getCrowdSyncPayload());
    this.broadcastFn('spotlight_incense', {
      id: `gift_${Date.now()}`,
      uniqueId: user.uniqueId,
      nickname: donorName,
      giftName: 'Rosa 🌹',
      diamondCount: 10,
      repeatCount: 1,
      robeType: 'SAFFRON',
      ttsText: `${donorName} đã dâng hương, chúc bạn tiền vào như nước.`
    });
  }
}

module.exports = new MockSimulator();


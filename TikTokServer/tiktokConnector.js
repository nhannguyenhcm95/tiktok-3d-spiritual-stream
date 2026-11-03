/**
 * TikTok Live Connector Integration for TikTokServer
 */

const { WebcastPushConnection } = require('tiktok-live-connector');
const leaderboardEngine = require('./leaderboardEngine');

class TikTokConnector {
  constructor() {
    this.connection = null;
    this.broadcastFn = null;
    this.username = '';
  }

  init(broadcastFn, username = '') {
    this.broadcastFn = broadcastFn;
    if (username) this.connect(username);
  }

  async connect(username) {
    this.username = username.replace(/^@/, '').trim();
    if (this.connection) {
      try { this.connection.disconnect(); } catch (e) {}
    }

    try {
      this.connection = new WebcastPushConnection(this.username, {
        processInitialData: false,
        enableExtendedGiftInfo: true
      });

      this.connection.on('chat', (data) => {
        const user = leaderboardEngine.touchUser(data.uniqueId, data.nickname);
        if (this.broadcastFn) {
          this.broadcastFn('chat_bubble', {
            id: `chat_${Date.now()}`,
            uniqueId: user.uniqueId,
            nickname: user.nickname,
            comment: data.comment,
            slotIndex: user.slotIndex,
            isVip: user.slotIndex === -1
          });
        }
      });

      this.connection.on('share', (data) => {
        if (this.broadcastFn) {
          this.broadcastFn('top_banner', {
            text: `${data.nickname || data.uniqueId} đã chia sẻ buổi lễ 🙏`,
            type: 'SHARE'
          });
        }
      });

      this.connection.on('gift', (data) => {
        if (data.giftType === 1 && !data.repeatEnd) return;
        const total = (data.diamondCount || 1) * (data.repeatCount || 1);
        const user = leaderboardEngine.addOrUpdateUser({ uniqueId: data.uniqueId, nickname: data.nickname }, total);
        if (this.broadcastFn) {
          this.broadcastFn('top_banner', {
            text: `${user.nickname} dâng hương, cầu bình an (x${data.repeatCount || 1})`,
            type: 'INCENSE'
          });
          this.broadcastFn('crowd_sync', leaderboardEngine.getCrowdSyncPayload());
          this.broadcastFn('spotlight_incense', {
            id: `gift_${Date.now()}`,
            uniqueId: user.uniqueId,
            nickname: user.nickname,
            giftName: data.giftName || 'Hoa',
            diamondCount: data.diamondCount || 1,
            repeatCount: data.repeatCount || 1,
            robeType: 'SAFFRON',
            ttsText: `${user.nickname} đã dâng hương, chúc bạn tâm an trí sáng, vạn sự hanh thông.`
          });
        }
      });

      await this.connection.connect();
      console.log(`[TikTokConnector] Kết nối thành công tới @${this.username}`);
      return true;
    } catch (err) {
      console.error(`[TikTokConnector] Lỗi kết nối: ${err.message}`);
      return false;
    }
  }
}

module.exports = new TikTokConnector();

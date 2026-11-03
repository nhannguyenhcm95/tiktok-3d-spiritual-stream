/**
 * TikTok Live Connector Integration
 * Kết nối TikTok LIVE thời gian thực, chuẩn hóa sự kiện và điều phối tới Leaderboard & Spotlight
 * Tuân thủ chuẩn CONTRACT.md
 */

const { WebcastPushConnection } = require('tiktok-live-connector');
const leaderboardEngine = require('./leaderboardEngine');
const eventQueue = require('./eventQueue');

class TikTokConnector {
  constructor() {
    this.tiktokLiveConnection = null;
    this.tiktokUsername = '';
    this.isConnected = false;
    this.io = null;
    this.statusListeners = [];
  }

  /**
   * Khởi tạo với Socket.io instance
   */
  init(io, initialUsername = '') {
    this.io = io;
    if (initialUsername) {
      this.connect(initialUsername);
    }
  }

  /**
   * Đăng ký callback khi trạng thái kết nối đổi
   */
  onStatusChange(callback) {
    if (typeof callback === 'function') {
      this.statusListeners.push(callback);
    }
  }

  notifyStatus() {
    this.statusListeners.forEach((cb) => {
      try {
        cb(this.getStatus());
      } catch (err) {
        console.error('[TikTokConnector] Lỗi callback trạng thái:', err);
      }
    });
  }

  getStatus() {
    return {
      connected: this.isConnected,
      tiktokUsername: this.tiktokUsername
    };
  }

  /**
   * Kết nối tới phòng TikTok LIVE của streamer
   */
  async connect(username) {
    if (!username) {
      console.warn('[TikTokConnector] Username trống, bỏ qua kết nối.');
      return false;
    }

    const cleanUsername = username.replace(/^@/, '').trim();
    if (this.tiktokLiveConnection && this.isConnected && this.tiktokUsername === cleanUsername) {
      console.log(`[TikTokConnector] Đang kết nối sẵn tới @${cleanUsername}`);
      return true;
    }

    this.disconnect();
    this.tiktokUsername = cleanUsername;
    console.log(`[TikTokConnector] Đang kết nối tới TikTok LIVE @${cleanUsername}...`);

    try {
      this.tiktokLiveConnection = new WebcastPushConnection(cleanUsername, {
        processInitialData: false,
        enableExtendedGiftInfo: true,
        enableWebsocketUpgrade: true,
        requestPollingIntervalMs: 1500
      });

      this.bindEvents();

      const state = await this.tiktokLiveConnection.connect();
      this.isConnected = true;
      console.log(`[TikTokConnector] Kết nối thành công tới phòng LIVE @${cleanUsername}! Room ID: ${state.roomId}`);
      this.notifyStatus();
      return true;
    } catch (err) {
      console.error(`[TikTokConnector] Không thể kết nối tới @${cleanUsername}:`, err.message);
      this.isConnected = false;
      this.notifyStatus();
      return false;
    }
  }

  /**
   * Ngắt kết nối
   */
  disconnect() {
    if (this.tiktokLiveConnection) {
      try {
        this.tiktokLiveConnection.disconnect();
      } catch (e) {
        // bỏ qua
      }
      this.tiktokLiveConnection = null;
    }
    this.isConnected = false;
    this.notifyStatus();
  }

  /**
   * Gắn các bộ lắng nghe sự kiện từ TikTok Webcast
   */
  bindEvents() {
    if (!this.tiktokLiveConnection) return;

    // 1. Người xem vào phòng (member)
    this.tiktokLiveConnection.on('member', (data) => {
      const uniqueId = data.uniqueId || `user_${data.userId}`;
      const nickname = data.nickname || data.uniqueId || 'Phật tử';
      const user = leaderboardEngine.touchUser(uniqueId, nickname);

      if (this.io) {
        this.io.emit('crowd_sync', leaderboardEngine.getCrowdSyncPayload());
      }
    });

    // 2. Thả tim (like)
    this.tiktokLiveConnection.on('like', (data) => {
      const uniqueId = data.uniqueId || `user_${data.userId}`;
      const nickname = data.nickname || data.uniqueId || 'Phật tử';
      leaderboardEngine.touchUser(uniqueId, nickname);
    });

    // 3. Khán giả bình luận (chat) -> Hiện bong bóng chat trên đầu
    this.tiktokLiveConnection.on('chat', (data) => {
      const uniqueId = data.uniqueId || `user_${data.userId}`;
      const nickname = data.nickname || data.uniqueId || 'Phật tử';
      const comment = data.comment || '';
      const user = leaderboardEngine.touchUser(uniqueId, nickname);

      if (this.io) {
        // Phát sự kiện chat_bubble cho client hiển thị
        this.io.emit('chat_bubble', {
          id: `chat_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          uniqueId: user.uniqueId,
          nickname: user.nickname,
          comment,
          slotIndex: user.slotIndex,
          isVip: user.slotIndex === -1
        });
      }
    });

    // 4. Chia sẻ livestream (share) -> Hiện banner thông báo đỉnh
    this.tiktokLiveConnection.on('share', (data) => {
      const uniqueId = data.uniqueId || `user_${data.userId}`;
      const nickname = data.nickname || data.uniqueId || 'Phật tử';
      leaderboardEngine.touchUser(uniqueId, nickname);

      if (this.io) {
        this.io.emit('top_banner', {
          text: `${nickname} đã chia sẻ buổi lễ 🙏`,
          type: 'SHARE'
        });
      }
    });

    // 5. Tặng quà dâng hương (gift) -> Spotlight Solo Dâng Hương & Cập nhật Bảng Tấm Lòng Thành
    this.tiktokLiveConnection.on('gift', (data) => {
      // Bỏ qua các streak đang bấm liên tục chưa kết thúc để tránh spam
      if (data.giftType === 1 && !data.repeatEnd) {
        return;
      }

      const uniqueId = data.uniqueId || `user_${data.userId}`;
      const nickname = data.nickname || data.uniqueId || 'Thí chủ';
      const giftName = data.giftName || 'Hoa';
      const diamondCount = Number(data.diamondCount) || 1;
      const repeatCount = Number(data.repeatCount) || 1;
      const totalCoins = diamondCount * repeatCount;

      // Cộng xu và cập nhật vị trí
      const user = leaderboardEngine.addOrUpdateUser({ uniqueId, nickname }, totalCoins);

      if (this.io) {
        // Thông báo banner
        this.io.emit('top_banner', {
          text: `${nickname} dâng hương, cầu bình an (x${repeatCount})`,
          type: 'INCENSE'
        });

        // Đồng bộ lại bảng xếp hạng & vị trí đệm
        this.io.emit('crowd_sync', leaderboardEngine.getCrowdSyncPayload());
      }

      // Đưa vào hàng đợi Solo Dâng Hương
      eventQueue.enqueueSpotlight({
        uniqueId: user.uniqueId,
        nickname: user.nickname,
        giftName,
        diamondCount,
        repeatCount,
        robeType: user.robeType
      });
    });

    // 6. Xử lý khi ngắt kết nối đột ngột
    this.tiktokLiveConnection.on('disconnected', () => {
      console.warn('[TikTokConnector] Mất kết nối tới TikTok LIVE.');
      this.isConnected = false;
      this.notifyStatus();
    });

    this.tiktokLiveConnection.on('streamEnd', () => {
      console.warn('[TikTokConnector] Phiên TikTok LIVE đã kết thúc.');
      this.isConnected = false;
      this.notifyStatus();
    });
  }
}

module.exports = new TikTokConnector();

/**
 * TikTok Live Connector Module
 * Kết nối TikTok Live thời gian thực, tự động reconnect và ánh xạ sự kiện sang Event Queue
 */

const { WebcastPushConnection } = require('tiktok-live-connector');
const eventQueue = require('./eventQueue');

class TikTokConnector {
  constructor() {
    this.connection = null;
    this.currentUsername = '';
    this.isConnected = false;
    this.reconnectTimeout = null;
    this.reconnectAttempt = 0;
    this.maxReconnectDelay = 30000; // Tối đa 30s
    this.likeCounters = new Map(); // Đếm like theo từng user hoặc tổng tích lũy
    this.totalAccumulatedLikes = 0;
    this.onStatusChangeCallback = null;
  }

  /**
   * Đăng ký callback khi trạng thái kết nối thay đổi
   * @param {Function} cb
   */
  onStatusChange(cb) {
    this.onStatusChangeCallback = cb;
  }

  notifyStatus() {
    if (typeof this.onStatusChangeCallback === 'function') {
      this.onStatusChangeCallback(this.getStatus());
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      tiktokUsername: this.currentUsername || '',
      reconnectAttempt: this.reconnectAttempt
    };
  }

  /**
   * Ngắt kết nối hiện tại nếu có
   */
  async disconnectTikTok() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.reconnectAttempt = 0;

    if (this.connection) {
      try {
        await this.connection.disconnect();
      } catch (err) {
        console.warn('[TikTokConnector] Warning on disconnect:', err.message);
      }
      this.connection = null;
    }

    this.isConnected = false;
    this.notifyStatus();
    console.log('[TikTokConnector] Đã ngắt kết nối TikTok Live.');
  }

  /**
   * Kết nối tới một kênh TikTok Live bất kỳ
   * @param {string} username Tên tài khoản TikTok (bỏ qua dấu @ nếu có)
   */
  async connectToTikTok(username) {
    if (!username || typeof username !== 'string') {
      console.warn('[TikTokConnector] Username không hợp lệ.');
      return false;
    }

    const cleanUsername = username.replace(/^@/, '').trim();
    if (!cleanUsername) return false;

    // Nếu đang kết nối cùng kênh, không cần kết nối lại
    if (this.isConnected && this.currentUsername === cleanUsername) {
      return true;
    }

    // Ngắt kết nối cũ nếu có
    await this.disconnectTikTok();

    this.currentUsername = cleanUsername;
    return this._initiateConnection();
  }

  /**
   * Khởi tạo đối tượng WebcastPushConnection và đăng ký các sự kiện
   */
  async _initiateConnection() {
    try {
      console.log(`[TikTokConnector] Đang kết nối tới TikTok Live của @${this.currentUsername}...`);
      this.connection = new WebcastPushConnection(this.currentUsername, {
        processInitialData: false,
        enableExtendedGiftInfo: true,
        enableWebsocketUpgrade: true,
        requestPollingIntervalMs: 1000,
        clientParams: {
          app_language: 'vi-VN',
          webcast_language: 'vi-VN'
        }
      });

      this._setupListeners();

      const state = await this.connection.connect();
      this.isConnected = true;
      this.reconnectAttempt = 0;
      console.log(`[TikTokConnector] Kết nối thành công tới phòng Live của @${this.currentUsername} (Room ID: ${state.roomId})`);
      this.notifyStatus();
      return true;
    } catch (err) {
      this.isConnected = false;
      console.error(`[TikTokConnector] Kết nối thất bại tới @${this.currentUsername}:`, err.message);
      this.notifyStatus();
      this._scheduleReconnect();
      return false;
    }
  }

  /**
   * Cơ chế tự động thử kết nối lại với Exponential Backoff (3s, 6s, 12s, 24s...)
   */
  _scheduleReconnect() {
    if (!this.currentUsername) return;

    this.reconnectAttempt++;
    // Exponential backoff: 3000 * 2^(attempt-1), trần maxReconnectDelay
    const delay = Math.min(3000 * Math.pow(2, this.reconnectAttempt - 1), this.maxReconnectDelay);
    console.log(`[TikTokConnector] Sẽ thử kết nối lại lần ${this.reconnectAttempt} sau ${(delay / 1000).toFixed(1)} giây...`);

    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this._initiateConnection();
    }, delay);
  }

  /**
   * Đăng ký các event listeners từ TikTok Live Connector
   */
  _setupListeners() {
    if (!this.connection) return;

    // Sự kiện ngắt kết nối từ TikTok
    this.connection.on('disconnected', () => {
      console.warn('[TikTokConnector] Mất kết nối từ TikTok Live.');
      this.isConnected = false;
      this.notifyStatus();
      this._scheduleReconnect();
    });

    this.connection.on('streamEnd', () => {
      console.warn('[TikTokConnector] Luồng Live của người dùng đã kết thúc.');
      this.isConnected = false;
      this.notifyStatus();
    });

    this.connection.on('error', (err) => {
      console.error('[TikTokConnector] Lỗi kết nối:', err.message);
    });

    // 1. Sự kiện LIKE
    this.connection.on('like', (data) => {
      // Mỗi 10 lượt like tích lũy -> sinh 1 sự kiện gõ mõ WOODEN_FISH
      const likeCount = data.likeCount || 1;
      this.totalAccumulatedLikes += likeCount;

      if (this.totalAccumulatedLikes >= 10) {
        const triggers = Math.floor(this.totalAccumulatedLikes / 10);
        this.totalAccumulatedLikes = this.totalAccumulatedLikes % 10;

        eventQueue.enqueue({
          id: `like_${Date.now()}_${Math.random()}`,
          timestamp: Date.now(),
          actionType: 'WOODEN_FISH',
          user: {
            uniqueId: data.uniqueId || 'like_user',
            nickname: data.nickname || data.uniqueId || 'Khán Giả',
            avatarUrl: data.profilePictureUrl || 'https://via.placeholder.com/100'
          },
          payload: {
            comment: `Thả tim x${likeCount}`,
            giftName: '',
            diamondCount: 0,
            repeatCount: 1,
            intensity: Math.min(triggers, 5) // Tăng intensity nếu dồn nhiều like
          }
        });
      }
    });

    // 2. Sự kiện CHAT (Comment)
    this.connection.on('chat', (data) => {
      const commentRaw = data.comment || '';
      const lower = commentRaw.toLowerCase();

      const user = {
        uniqueId: data.uniqueId || 'chat_user',
        nickname: data.nickname || data.uniqueId || 'Thiện Nam Tín Nữ',
        avatarUrl: data.profilePictureUrl || 'https://via.placeholder.com/100'
      };

      // Từ khóa Lời cầu nguyện
      const prayerKeywords = ['cầu', 'ước', 'nguyện', 'bình an', 'sức khỏe', 'tài lộc', 'gia đạo', 'may mắn', 'bình yên'];
      const hasPrayer = prayerKeywords.some((kw) => lower.includes(kw));

      if (hasPrayer) {
        eventQueue.enqueue({
          id: `chat_pray_${Date.now()}_${Math.random()}`,
          timestamp: Date.now(),
          actionType: 'PRAYER_TEXT',
          user,
          payload: {
            comment: commentRaw,
            giftName: '',
            diamondCount: 0,
            repeatCount: 1,
            intensity: 1
          }
        });
        return;
      }

      // Từ khóa Gõ Mõ
      const woodenKeywords = ['gõ', 'mõ', 'nam mô', 'a di đà', 'amen', '1', 'công đức', 'mo', 'go', 'thanh tam'];
      const hasWooden = woodenKeywords.some((kw) => lower.includes(kw));

      if (hasWooden || commentRaw.trim().length <= 5) {
        // Comment ngắn hoặc chứa từ khóa mõ -> Gõ mõ
        eventQueue.enqueue({
          id: `chat_fish_${Date.now()}_${Math.random()}`,
          timestamp: Date.now(),
          actionType: 'WOODEN_FISH',
          user,
          payload: {
            comment: commentRaw,
            giftName: '',
            diamondCount: 0,
            repeatCount: 1,
            intensity: 1
          }
        });
      }
    });

    // 3. Sự kiện GIFT (Quà tặng)
    this.connection.on('gift', (data) => {
      // Chống lặp quà combo: Bỏ qua nếu data.giftType === 1 && !data.repeatEnd
      if (data.giftType === 1 && !data.repeatEnd) {
        return;
      }

      const diamondCount = Number(data.diamondCount) || 1;
      const repeatCount = Number(data.repeatCount) || 1;
      const totalCoins = diamondCount * repeatCount;
      const giftName = data.giftName || 'Món Quà';

      const user = {
        uniqueId: data.uniqueId || 'gift_user',
        nickname: data.nickname || data.uniqueId || 'Mạnh Thường Quân',
        avatarUrl: data.profilePictureUrl || 'https://via.placeholder.com/100'
      };

      let actionType = 'INCENSE';
      if (totalCoins >= 100) {
        actionType = 'BELL'; // Quà lớn >= 100 xu: Thỉnh Đại Hồng Chung
      } else if (totalCoins >= 6) {
        actionType = 'LANTERN'; // Quà 6-99 xu: Thả Đèn Hoa Đăng
      } else {
        actionType = 'INCENSE'; // Quà 1-5 xu: Thắp Nhang/Nến
      }

      eventQueue.enqueue({
        id: `gift_${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
        actionType,
        user,
        payload: {
          comment: `Tặng ${giftName} (x${repeatCount})`,
          giftName,
          diamondCount,
          repeatCount,
          intensity: Math.min(Math.ceil(totalCoins / 10), 5)
        }
      });
    });
  }
}

// Export singleton instance
const tiktokConnector = new TikTokConnector();
module.exports = tiktokConnector;


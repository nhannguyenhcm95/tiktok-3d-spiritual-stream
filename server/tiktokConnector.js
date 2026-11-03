/**
 * TikTok Live Connector Module
 * Kết nối TikTok Live thời gian thực, tự động reconnect và ánh xạ sự kiện
 * sang các hoạt động tâm linh chùa Việt theo đúng bảng giá cúng dường.
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
    this.maxReconnectDelay = 30000;
    this.totalAccumulatedLikes = 0;
    this.onStatusChangeCallback = null;
  }

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
        console.warn('[TikTokConnector] Cảnh báo khi ngắt kết nối:', err.message);
      }
      this.connection = null;
    }

    this.isConnected = false;
    this.notifyStatus();
    console.log('[TikTokConnector] Đã ngắt kết nối TikTok Live.');
  }

  async connectToTikTok(username) {
    if (!username || typeof username !== 'string') {
      console.warn('[TikTokConnector] Username không hợp lệ.');
      return false;
    }

    const cleanUsername = username.replace(/^@/, '').trim();
    if (!cleanUsername) return false;

    if (this.isConnected && this.currentUsername === cleanUsername) {
      return true;
    }

    await this.disconnectTikTok();
    this.currentUsername = cleanUsername;
    return this._initiateConnection();
  }

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
      console.log(`[TikTokConnector] Kết nối thành công tới phòng Live @${this.currentUsername} (Room ID: ${state.roomId})`);
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

  _scheduleReconnect() {
    if (!this.currentUsername) return;
    this.reconnectAttempt++;
    const delay = Math.min(3000 * Math.pow(2, this.reconnectAttempt - 1), this.maxReconnectDelay);
    console.log(`[TikTokConnector] Thử kết nối lại lần ${this.reconnectAttempt} sau ${(delay / 1000).toFixed(1)}s...`);

    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this._initiateConnection();
    }, delay);
  }

  _setupListeners() {
    if (!this.connection) return;

    this.connection.on('disconnected', () => {
      console.warn('[TikTokConnector] Mất kết nối từ TikTok Live.');
      this.isConnected = false;
      this.notifyStatus();
      this._scheduleReconnect();
    });

    this.connection.on('streamEnd', () => {
      console.warn('[TikTokConnector] Luồng Live đã kết thúc.');
      this.isConnected = false;
      this.notifyStatus();
    });

    this.connection.on('error', (err) => {
      console.error('[TikTokConnector] Lỗi:', err.message);
    });

    // 1. LIKE -> Tích lũy 10 like = 1 tiếng gõ mõ
    this.connection.on('like', (data) => {
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
            nickname: data.nickname || data.uniqueId || 'Khách Thả Tim',
            avatarUrl: data.profilePictureUrl || 'https://via.placeholder.com/100'
          },
          payload: {
            comment: `Thả tim x${likeCount}`,
            giftName: '',
            diamondCount: 0,
            repeatCount: 1,
            intensity: Math.min(triggers, 4)
          }
        });
      }
    });

    // 2. CHAT -> Phân tích câu: "A di đà phật" (Vái lạy), Lời cầu an, Gõ mõ
    this.connection.on('chat', (data) => {
      const commentRaw = data.comment || '';
      const lower = commentRaw.toLowerCase();

      const user = {
        uniqueId: data.uniqueId || 'chat_user',
        nickname: data.nickname || data.uniqueId || 'Khách Hành Hương',
        avatarUrl: data.profilePictureUrl || 'https://via.placeholder.com/100'
      };

      // Từ khóa Niệm Phật Vái Lạy
      const buddhaWords = ['a di đà', 'a di da', 'nam mô', 'nam mo', 'phật', 'phat', 'vái', 'lạy', 'bồ tát', 'bo tat', 'quan âm', 'chúc phúc'];
      const hasBuddha = buddhaWords.some(kw => lower.includes(kw));

      if (hasBuddha) {
        eventQueue.enqueue({
          id: `chat_bow_${Date.now()}_${Math.random()}`,
          timestamp: Date.now(),
          actionType: 'BOW',
          user,
          payload: {
            comment: commentRaw,
            giftName: '',
            diamondCount: 0,
            repeatCount: 1
          }
        });
        return;
      }

      // Từ khóa Lời Cầu An
      const prayerWords = ['cầu', 'ước', 'nguyện', 'bình an', 'sức khỏe', 'mạnh khỏe', 'thi cử', 'đỗ đạt', 'cha mẹ', 'gia đình', 'bình yên', 'may mắn'];
      const hasPrayer = prayerWords.some(kw => lower.includes(kw));

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
            repeatCount: 1
          }
        });
        return;
      }

      // Comment ngắn hoặc từ khóa mõ
      if (lower.includes('gõ') || lower.includes('mõ') || lower.includes('1') || commentRaw.trim().length <= 4) {
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

    // 3. GIFT -> Ánh xạ theo đúng bảng giá xu TikTok
    this.connection.on('gift', (data) => {
      if (data.giftType === 1 && !data.repeatEnd) return; // Chống lặp combo đang bắn dở

      const diamondCount = Number(data.diamondCount) || 1;
      const repeatCount = Number(data.repeatCount) || 1;
      const totalCoins = diamondCount * repeatCount;
      const giftName = data.giftName || 'Món Quà';

      const user = {
        uniqueId: data.uniqueId || 'gift_user',
        nickname: data.nickname || data.uniqueId || 'Mạnh Thường Quân',
        avatarUrl: data.profilePictureUrl || 'https://via.placeholder.com/100'
      };

      let actionType = 'INCENSE_1';
      let tier = 'normal';

      if (totalCoins >= 400000) {
        actionType = 'TIKTOK_UNIVERSE'; // Vũ trụ TikTok
        tier = 'mythic';
      } else if (totalCoins >= 39000) {
        actionType = 'GOLDEN_PHOENIX'; // Phượng hoàng lửa
        tier = 'legendary';
      } else if (totalCoins >= 29000) {
        actionType = 'GOLDEN_LION'; // Con sư tử
        tier = 'legendary';
      } else if (totalCoins >= 20000) {
        actionType = 'GOLDEN_PAGODA'; // Lâu đài ảo
        tier = 'epic';
      } else if (totalCoins >= 7000) {
        actionType = 'THOUSAND_LANTERNS'; // Ô tô / Tiệc sinh nhật
        tier = 'epic';
      } else if (totalCoins >= 5000) {
        actionType = 'BUDDHA_LIGHT'; // Máy bay / Nhà gỗ
        tier = 'rare';
      } else if (totalCoins >= 2900) {
        actionType = 'PARADE_FLOAT'; // Xe máy gấu
        tier = 'rare';
      } else if (totalCoins >= 100) {
        actionType = 'CONFETTI'; // Pháo hoa giấy
        tier = 'uncommon';
      } else if (totalCoins >= 99) {
        actionType = 'BELL'; // Hạc giấy / Vương miện nhỏ -> Thỉnh Đại Hồng Chung
        tier = 'uncommon';
      } else if (totalCoins >= 20) {
        actionType = 'OFFERING_FRUIT'; // Nước hoa -> Dâng Mâm Hoa Quả
        tier = 'uncommon';
      } else if (totalCoins >= 10) {
        actionType = 'LANTERN'; // Rosa / Cỏ bốn lá -> Thả Đèn Hoa Đăng
        tier = 'normal';
      } else if (totalCoins >= 5) {
        actionType = 'INCENSE_3'; // Bắn tim / Quả đào -> Thắp 3 nén Tam Bảo
        tier = 'normal';
      } else {
        actionType = 'INCENSE_1'; // Hoa hồng, Tim -> Thắp 1 nén tâm hương
        tier = 'normal';
      }

      eventQueue.enqueue({
        id: `gift_${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
        actionType,
        user,
        payload: {
          comment: `Cúng dường ${giftName} (x${repeatCount}) - ${totalCoins.toLocaleString('vi-VN')} xu`,
          giftName,
          diamondCount,
          repeatCount,
          tier
        }
      });
    });
  }
}

const tiktokConnector = new TikTokConnector();
module.exports = tiktokConnector;

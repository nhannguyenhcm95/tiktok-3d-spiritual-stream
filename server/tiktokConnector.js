/**
 * TikTok Live Connector Module — PHẬT ĐIỆN VẠN NGƯỜI
 * Kết nối TikTok Live thời gian thực, tự động reconnect và chuẩn hóa sự kiện
 * sang các hoạt động Phật tử 3D theo đúng Command Parser và Bảng Giá Gift.
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

  /**
   * Command Parser chuẩn hóa tiếng Việt có dấu và không dấu
   * Hỗ trợ cấu hình động từ command-mapping.json
   */
  _parseCommentCommand(rawComment) {
    if (!rawComment) return { actionType: 'COMMENT_CHAT', command: '' };
    const str = rawComment.trim();
    const lower = str.toLowerCase();
    const noMark = lower
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd');

    // 1. Kiểm tra cấu hình động từ command-mapping.json
    const cmdConfig = eventQueue.getCommandConfig();
    if (cmdConfig && Array.isArray(cmdConfig.commands)) {
      for (const cmd of cmdConfig.commands) {
        if (!cmd.enabled) continue;
        if (cmd.aliases && cmd.aliases.some(alias => {
          const aLower = alias.toLowerCase();
          const aNoMark = aLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
          const prefix = '!' + aNoMark.replace(/\s+/g, '');
          return lower === aLower || noMark === aNoMark || lower.startsWith(prefix);
        })) {
          return { actionType: cmd.id, command: cmd.id };
        }
      }
    }

    // 2. Lệnh DÂNG HƯƠNG (OFFER_INCENSE)
    if (
      lower === 'dâng hương' || lower === 'dang huong' ||
      lower === 'thắp hương' || lower === 'thap huong' ||
      lower.startsWith('!huong') || lower.startsWith('!danghuong')
    ) {
      return { actionType: 'OFFER_INCENSE', command: 'OFFER_INCENSE' };
    }

    // 3. Lệnh LẠY / LẠY PHẬT (BOW)
    if (
      lower === 'lạy' || lower === 'lay' ||
      lower === 'lạy phật' || lower === 'lay phat' ||
      lower.startsWith('!lay') || lower.startsWith('!lạy') ||
      lower === 'đảnh lễ' || lower === 'danh le'
    ) {
      return { actionType: 'BOW', command: 'BOW' };
    }

    // 4. Lệnh NIỆM PHẬT / NAM MÔ (CHANT / NIEM_PHAT)
    if (
      lower === 'nam mô' || lower === 'nam mo' ||
      lower === 'a di đà phật' || lower === 'a di da phat' ||
      lower === 'nam mô a di đà phật' || lower === 'nam mo a di da phat' ||
      lower === 'a di đà' || lower === 'a di da' ||
      lower.startsWith('!nammo') || lower.startsWith('!adida')
    ) {
      return { actionType: 'CHANT', command: 'CHANT' };
    }

    // 5. Lệnh QUỲ (KNEEL)
    if (lower === 'quỳ' || lower === 'quy' || lower.startsWith('!quy') || lower.startsWith('!quỳ')) {
      return { actionType: 'KNEEL', command: 'KNEEL' };
    }

    // 6. Lệnh ĐỨNG / ĐỨNG LÊN (STAND)
    if (
      lower === 'đứng' || lower === 'dung' ||
      lower === 'đứng lên' || lower === 'dung len' ||
      lower.startsWith('!dung') || lower.startsWith('!đứng')
    ) {
      return { actionType: 'STAND', command: 'STAND' };
    }

    // 7. Lệnh CẦU AN / CẦU NGUYỆN (PRAY)
    if (
      lower === 'cầu an' || lower === 'cau an' ||
      lower === 'cầu nguyện' || lower === 'cau nguyen' ||
      lower.startsWith('!cauan') || lower.startsWith('!pray')
    ) {
      return { actionType: 'PRAY', command: 'PRAY' };
    }

    // 8. Lệnh DÂNG HOA (OFFER_FLOWER)
    if (
      lower === 'dâng hoa' || lower === 'dang hoa' ||
      lower === 'hoa' || lower.startsWith('!hoa') || lower.startsWith('!danghoa')
    ) {
      return { actionType: 'OFFER_FLOWER', command: 'OFFER_FLOWER' };
    }

    // 9. Lệnh ĐI LỄ (WALK_TO_ALTAR)
    if (lower === 'đi lễ' || lower === 'di le' || lower.startsWith('!dile')) {
      return { actionType: 'WALK_TO_ALTAR', command: 'WALK_TO_ALTAR' };
    }

    // 10. Lời cầu nguyện tự do (PRAYER_TEXT)
    const prayerKeywords = ['cầu', 'ước', 'nguyện', 'bình an', 'sức khỏe', 'mạnh khỏe', 'thi cử', 'đỗ đạt', 'cha mẹ', 'gia đình', 'bình yên', 'may mắn'];
    const hasPrayer = prayerKeywords.some(kw => noMark.includes(kw));
    if (hasPrayer) {
      return { actionType: 'PRAYER_TEXT', command: 'PRAYER_TEXT' };
    }

    // 11. Lệnh gõ mõ (WOODEN_FISH)
    if (noMark.includes('go mo') || lower === 'mõ' || lower === 'mo' || lower === '1') {
      return { actionType: 'WOODEN_FISH', command: 'WOODEN_FISH' };
    }

    // 12. Comment trò chuyện thông thường -> Hiện Comment Bubble trên đầu nhân vật
    return { actionType: 'COMMENT_CHAT', command: 'CHAT' };
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

    // 1. MEMBER JOIN -> Tạo Phật tử mới trong điện
    this.connection.on('member', (data) => {
      const user = {
        uniqueId: data.uniqueId || `user_${Date.now()}`,
        nickname: data.nickname || data.uniqueId || 'Phật Tử Mới',
        avatarUrl: data.profilePictureUrl || 'https://via.placeholder.com/100'
      };

      eventQueue.enqueue({
        id: `join_${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
        actionType: 'VIEWER_JOINED',
        user,
        payload: {
          comment: 'Vừa bước vào Đại Hùng Bảo Điện 🙏'
        }
      });
    });

    // 2. SHARE LIVE -> Phật tử chắp tay cầu nguyện & hiện thông báo
    this.connection.on('share', (data) => {
      const user = {
        uniqueId: data.uniqueId || 'share_user',
        nickname: data.nickname || data.uniqueId || 'Phật Tử Thành Tâm',
        avatarUrl: data.profilePictureUrl || 'https://via.placeholder.com/100'
      };

      eventQueue.enqueue({
        id: `share_${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
        actionType: 'SHARE',
        user,
        payload: {
          comment: 'Đã chia sẻ buổi lễ cầu an 🙏'
        }
      });
    });

    // 3. LIKE -> Tích lũy 10 like = 1 tiếng gõ mõ
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

    // 4. CHAT -> Phân tích Command Parser điều khiển Avatar & Comment Bubble
    this.connection.on('chat', (data) => {
      const commentRaw = data.comment || '';
      const user = {
        uniqueId: data.uniqueId || 'chat_user',
        nickname: data.nickname || data.uniqueId || 'Phật Tử',
        avatarUrl: data.profilePictureUrl || 'https://via.placeholder.com/100'
      };

      const parsed = this._parseCommentCommand(commentRaw);

      eventQueue.enqueue({
        id: `chat_${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
        actionType: parsed.actionType,
        user,
        payload: {
          comment: commentRaw,
          command: parsed.command,
          giftName: '',
          diamondCount: 0,
          repeatCount: 1
        }
      });
    });

    // 5. GIFT -> Ánh xạ theo bảng giá xu TikTok sang hành động cúng dường 3D
    this.connection.on('gift', (data) => {
      if (data.giftType === 1 && !data.repeatEnd) return; // Chống lặp combo đang dở

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
        actionType = 'TIKTOK_UNIVERSE'; // 449.999 xu: Vũ trụ TikTok
        tier = 'mythic';
      } else if (totalCoins >= 39000) {
        actionType = 'GOLDEN_PHOENIX'; // 39.999 xu: Phượng hoàng lửa
        tier = 'legendary';
      } else if (totalCoins >= 29000) {
        actionType = 'GOLDEN_LION'; // 29.999 xu: Con sư tử
        tier = 'legendary';
      } else if (totalCoins >= 20000) {
        actionType = 'GOLDEN_PAGODA'; // 20.000 xu: Lâu đài ảo
        tier = 'epic';
      } else if (totalCoins >= 7000) {
        actionType = 'THOUSAND_LANTERNS'; // 7.000 xu: Ô tô / Tiệc sinh nhật
        tier = 'epic';
      } else if (totalCoins >= 5000) {
        actionType = 'BUDDHA_LIGHT'; // 5.000 xu: Máy bay / Nhà gỗ
        tier = 'rare';
      } else if (totalCoins >= 2900) {
        actionType = 'PARADE_FLOAT'; // 2.999 xu: Xe máy Gấu nhịp điệu
        tier = 'rare';
      } else if (totalCoins >= 100) {
        actionType = 'CONFETTI'; // 100 xu: Pháo hoa giấy
        tier = 'uncommon';
      } else if (totalCoins >= 99) {
        actionType = 'BELL'; // 99 xu: Hạc giấy / Vương miện nhỏ -> Thỉnh Đại Hồng Chung
        tier = 'uncommon';
      } else if (totalCoins >= 20) {
        actionType = 'OFFERING_FRUIT'; // 20 xu: Nước hoa -> Mâm Hoa Quả
        tier = 'uncommon';
      } else if (totalCoins >= 10) {
        actionType = 'LANTERN'; // 10 xu: Rosa / Cỏ 4 lá -> Đèn Hoa Đăng
        tier = 'normal';
      } else if (totalCoins >= 5) {
        actionType = 'INCENSE_3'; // 5 xu: Bắn tim / Quả đào -> Thắp 3 nén Tam Bảo
        tier = 'normal';
      } else {
        actionType = 'INCENSE_1'; // 1 xu: Hoa hồng, Tim -> Thắp 1 nén tâm hương
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
          totalCoins,
          tier
        }
      });
    });
  }
}

const tiktokConnector = new TikTokConnector();
module.exports = tiktokConnector;

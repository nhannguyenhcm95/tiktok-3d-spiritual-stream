/**
 * HUD Manager — PHẬT ĐIỆN VẠN NGƯỜI
 * Quản lý Bảng TÂM LÒNG THÀNH (Top 10), Bảng Tổng Công Đức,
 * Banner Thông Báo (Join, Share, Gift), Toast và Prayer Wall.
 */

export class HudManager {
  constructor(soundSynth) {
    this.sound = soundSynth;
    this.totalMerit = 12480;
    this.displayedMerit = 12480;
    this.userScores = new Map(); // uniqueId -> { nickname, avatarUrl, score, actionsCount }
    this.totalDevotees = 8;

    // DOM Elements
    this.meritCounterEl = null;
    this.devoteeCounterEl = null;
    this.leaderboardListEl = null;
    this.toastContainerEl = null;
    this.prayerWallEl = null;
    this.topBannerEl = null;

    this.meritAnimTimer = null;
    this._onTikTokAction = this._onTikTokAction.bind(this);
    this._onServerStatus = this._onServerStatus.bind(this);
  }

  init() {
    this.meritCounterEl = document.getElementById('merit-counter');
    this.devoteeCounterEl = document.getElementById('devotee-counter');
    this.leaderboardListEl = document.getElementById('leaderboard-list');
    this.toastContainerEl = document.getElementById('toast-container');
    this.prayerWallEl = document.getElementById('prayer-wall');
    this.topBannerEl = document.getElementById('hud-event-banner');

    window.addEventListener('TIKTOK_ACTION', this._onTikTokAction);
    window.addEventListener('SERVER_STATUS_UPDATE', this._onServerStatus);
  }

  _onServerStatus(e) {
    const status = e.detail;
    if (!status) return;

    if (typeof status.totalMerit === 'number' && status.totalMerit > this.totalMerit) {
      this.totalMerit = status.totalMerit;
      this._updateMeritDisplay();
    }

    if (typeof status.totalUsers === 'number') {
      this.totalDevotees = Math.max(8, status.totalUsers);
      if (this.devoteeCounterEl) {
        this.devoteeCounterEl.textContent = `${this.totalDevotees} Phật tử`;
      }
    }

    if (Array.isArray(status.leaderboard) && status.leaderboard.length > 0) {
      this._renderLeaderboardFromArray(status.leaderboard);
    }
  }

  _calculateMerit(actionType, payload = {}) {
    const repeatCount = payload.repeatCount || 1;
    switch (actionType) {
      case 'VIEWER_JOINED':
        return 1;
      case 'SHARE':
        return 10;
      case 'NIEM_PHAT':
      case 'KNEEL':
      case 'STAND':
        return 2;
      case 'BOW':
        return 3;
      case 'PRAY':
      case 'PRAYER_TEXT':
      case 'OFFER_FLOWER':
      case 'WALK_TO_ALTAR':
        return 5;
      case 'WOODEN_FISH':
        return 1 * (payload.intensity || 1);
      case 'COMMENT_CHAT':
        return 1;
      case 'INCENSE_1':
        return 10 * repeatCount;
      case 'INCENSE_3':
        return 50 * repeatCount;
      case 'LANTERN':
        return 100 * repeatCount;
      case 'OFFERING_FRUIT':
        return 200 * repeatCount;
      case 'BELL':
        return 1000 * repeatCount;
      case 'CONFETTI':
        return 1500 * repeatCount;
      case 'PARADE_FLOAT':
        return 30000 * repeatCount;
      case 'BUDDHA_LIGHT':
        return 50000 * repeatCount;
      case 'THOUSAND_LANTERNS':
        return 70000 * repeatCount;
      case 'GOLDEN_PAGODA':
        return 200000 * repeatCount;
      case 'GOLDEN_LION':
        return 300000 * repeatCount;
      case 'GOLDEN_PHOENIX':
        return 400000 * repeatCount;
      case 'TIKTOK_UNIVERSE':
        return 5000000 * repeatCount;
      default:
        return 10;
    }
  }

  _onTikTokAction(e) {
    const data = e.detail;
    if (!data || !data.actionType) return;

    const { actionType, user, payload, leaderboard } = data;
    const points = this._calculateMerit(actionType, payload);

    // 1. Cộng tổng công đức
    this.totalMerit += points;
    this._updateMeritDisplay();

    // 2. Cập nhật số Phật tử
    this.totalDevotees++;
    if (this.devoteeCounterEl) {
      this.devoteeCounterEl.textContent = `${this.totalDevotees} Phật tử`;
    }

    // 3. Cập nhật Bảng TÂM LÒNG THÀNH
    if (Array.isArray(leaderboard) && leaderboard.length > 0) {
      this._renderLeaderboardFromArray(leaderboard);
    } else if (user && user.uniqueId) {
      const existing = this.userScores.get(user.uniqueId) || {
        nickname: user.nickname || 'Phật Tử',
        avatarUrl: user.avatarUrl || 'https://via.placeholder.com/100',
        score: 0,
        actionsCount: 0
      };
      existing.score += points;
      existing.actionsCount += 1;
      existing.nickname = user.nickname || existing.nickname;
      if (user.avatarUrl) existing.avatarUrl = user.avatarUrl;
      this.userScores.set(user.uniqueId, existing);
      this._renderLeaderboard();
    }

    // 4. Phát âm thanh tương ứng
    if (this.sound) {
      if (actionType === 'WOODEN_FISH' || actionType === 'NIEM_PHAT') {
        this.sound.playWoodenFish();
      } else if (actionType === 'BELL') {
        this.sound.playBell();
      } else if (actionType.startsWith('INCENSE') || actionType === 'OFFER_FLOWER' || actionType === 'BOW') {
        this.sound.playBowl();
      }
    }

    // 5. Hiển thị Toast & Thông báo trên đỉnh
    this._showToast(actionType, user, payload);

    // 6. Lời cầu nguyện lên Prayer Wall
    if (actionType === 'PRAYER_TEXT' || actionType === 'PRAY') {
      const comment = payload?.comment || '';
      if (comment.trim().length > 0 && !['cầu an', 'cầu nguyện'].includes(comment.toLowerCase().trim())) {
        this._showPrayerCard(user?.nickname || 'Phật Tử', comment);
      }
    }
  }

  _updateMeritDisplay() {
    if (!this.meritCounterEl) return;
    this.meritCounterEl.classList.remove('bounce');
    void this.meritCounterEl.offsetWidth;
    this.meritCounterEl.classList.add('bounce');

    if (this.meritAnimTimer) clearInterval(this.meritAnimTimer);
    this.meritAnimTimer = setInterval(() => {
      const diff = this.totalMerit - this.displayedMerit;
      if (diff <= 0) {
        this.displayedMerit = this.totalMerit;
        this.meritCounterEl.textContent = this.displayedMerit.toLocaleString('vi-VN');
        clearInterval(this.meritAnimTimer);
        this.meritAnimTimer = null;
      } else {
        const step = Math.max(1, Math.ceil(diff / 6));
        this.displayedMerit += step;
        this.meritCounterEl.textContent = this.displayedMerit.toLocaleString('vi-VN');
      }
    }, 30);
  }

  /**
   * Render Bảng TÂM LÒNG THÀNH (Top 10)
   */
  _renderLeaderboardFromArray(items) {
    if (!this.leaderboardListEl) return;
    const topItems = items.slice(0, 10);
    this.leaderboardListEl.innerHTML = '';

    topItems.forEach((item, index) => {
      const rank = index + 1;
      const row = document.createElement('div');
      row.className = `leaderboard-item rank-${rank <= 3 ? rank : 'normal'}`;
      row.innerHTML = `
        <div class="leaderboard-user">
          <span class="leaderboard-rank">#${rank}</span>
          <img class="leaderboard-avatar" src="${item.avatarUrl || 'https://via.placeholder.com/100'}" alt="${item.nickname}" onerror="this.src='https://via.placeholder.com/100'" />
          <span class="leaderboard-name">${this._escapeHtml(item.nickname)}</span>
        </div>
        <span class="leaderboard-score">+${(item.score || 0).toLocaleString('vi-VN')}</span>
      `;
      this.leaderboardListEl.appendChild(row);
    });
  }

  _renderLeaderboard() {
    if (!this.leaderboardListEl) return;
    const sorted = Array.from(this.userScores.values())
      .sort((a, b) => b.score - a.score || b.actionsCount - a.actionsCount)
      .slice(0, 10);

    if (sorted.length === 0) return;
    this._renderLeaderboardFromArray(sorted);
  }

  _showToast(actionType, user, payload) {
    if (!this.toastContainerEl) return;
    let icon = '✨';
    let actionText = '';

    switch (actionType) {
      case 'VIEWER_JOINED':
        icon = '🪷';
        actionText = `vừa bước vào Đại Hùng Bảo Điện`;
        break;
      case 'SHARE':
        icon = '🙏';
        actionText = `đã chia sẻ buổi lễ đến muôn nơi!`;
        break;
      case 'NIEM_PHAT':
        icon = '📿';
        actionText = `chắp tay niệm: "Nam Mô A Di Đà Phật"`;
        break;
      case 'BOW':
        icon = '🙏';
        actionText = `thành kính đảnh lễ lạy Phật`;
        break;
      case 'KNEEL':
        icon = '🧘';
        actionText = `quỳ gối trước Tam Bảo tịnh tâm`;
        break;
      case 'STAND':
        icon = '🧍';
        actionText = `đứng dậy chắp tay trang nghiêm`;
        break;
      case 'OFFER_FLOWER':
        icon = '🌸';
        actionText = `dâng đóa hoa sen tươi thắm cúng dường`;
        break;
      case 'WALK_TO_ALTAR':
        icon = '🚶';
        actionText = `tiến lên phía bàn Phật dâng lễ`;
        break;
      case 'INCENSE_1':
        icon = '🕯️';
        actionText = `thành kính dâng 1 nén tâm hương`;
        break;
      case 'INCENSE_3':
        icon = '🕯️';
        actionText = `thành kính dâng 3 nén hương Tam Bảo`;
        break;
      case 'BELL':
        icon = '🔔';
        actionText = `đã THỈNH ĐẠI HỒNG CHUNG ngân vang chánh điện!`;
        break;
      case 'CONFETTI':
        icon = '🎉';
        actionText = `cúng dường Pháo Hoa Giấy Phúc Lộc rực rỡ!`;
        break;
      case 'OFFERING_FRUIT':
        icon = '🍇';
        actionText = `dâng Mâm Hoa Quả Tươi Thắm lên bàn Phật!`;
        break;
      case 'BUDDHA_LIGHT':
      case 'PARADE_FLOAT':
      case 'THOUSAND_LANTERNS':
      case 'GOLDEN_PAGODA':
      case 'GOLDEN_LION':
      case 'GOLDEN_PHOENIX':
      case 'TIKTOK_UNIVERSE':
        icon = '🌌';
        actionText = `đại cúng dường ${payload?.giftName || 'Đại Lễ Linh Thiêng'}! Công đức vô lượng!`;
        break;
      default:
        return; // Bỏ qua nếu chỉ là mõ gõ thường
    }

    const toast = document.createElement('div');
    toast.className = 'toast-item';
    const nickname = user?.nickname || 'Phật Tử Thành Tâm';
    const avatar = user?.avatarUrl || 'https://via.placeholder.com/100';

    toast.innerHTML = `
      <img class="toast-avatar" src="${avatar}" alt="${nickname}" onerror="this.src='https://via.placeholder.com/100'" />
      <div class="toast-content">
        <span class="toast-user">${icon} ${this._escapeHtml(nickname)}</span>
        <span class="toast-action">${actionText}</span>
      </div>
    `;

    this.toastContainerEl.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 500);
    }, 4000);
  }

  _showPrayerCard(nickname, comment) {
    if (!this.prayerWallEl) return;
    const existing = this.prayerWallEl.querySelectorAll('.prayer-card');
    if (existing.length >= 3) {
      const oldest = existing[0];
      if (oldest.parentNode) oldest.parentNode.removeChild(oldest);
    }

    const card = document.createElement('div');
    card.className = 'prayer-card';
    card.innerHTML = `
      <div class="prayer-author">🙏 ${this._escapeHtml(nickname)} cầu an:</div>
      <div class="prayer-text">"${this._escapeHtml(comment)}"</div>
    `;

    this.prayerWallEl.appendChild(card);

    setTimeout(() => {
      card.style.transition = 'opacity 0.8s, transform 0.8s';
      card.style.opacity = '0';
      card.style.transform = 'translateY(-15px)';
      setTimeout(() => {
        if (card.parentNode) card.parentNode.removeChild(card);
      }, 800);
    }, 7000);
  }

  _escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  destroy() {
    window.removeEventListener('TIKTOK_ACTION', this._onTikTokAction);
    window.removeEventListener('SERVER_STATUS_UPDATE', this._onServerStatus);
    if (this.meritAnimTimer) clearInterval(this.meritAnimTimer);
  }
}

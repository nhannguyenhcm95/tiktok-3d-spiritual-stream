/**
 * HUD Manager
 * Quản lý giao diện HUD chuẩn Safe-Zone TikTok:
 * - Cập nhật Bảng Tổng Công Đức
 * - Xếp hạng Top 3 Bảng Vàng Công Đức (Leaderboard)
 * - Hiển thị Toast Notification sự kiện lớn (Nhang / Đèn / Chuông)
 * - Bức tường Lời Cầu Nguyện lung linh (Prayer Wall)
 */

export class HudManager {
  constructor() {
    this.totalMerit = 0;
    this.displayedMerit = 0;
    this.userScores = new Map(); // uniqueId -> { nickname, avatarUrl, score }

    // DOM Elements
    this.meritCounterEl = null;
    this.leaderboardListEl = null;
    this.toastContainerEl = null;
    this.prayerWallEl = null;

    this.maxPrayerCards = 3;
    this.meritAnimTimer = null;

    this._onTikTokAction = this._onTikTokAction.bind(this);
    this._onServerStatus = this._onServerStatus.bind(this);
  }

  /**
   * Khởi tạo các phần tử DOM và lắng nghe sự kiện
   */
  init() {
    this.meritCounterEl = document.getElementById('merit-counter');
    this.leaderboardListEl = document.getElementById('leaderboard-list');
    this.toastContainerEl = document.getElementById('toast-container');
    this.prayerWallEl = document.getElementById('prayer-wall');

    window.addEventListener('TIKTOK_ACTION', this._onTikTokAction);
    window.addEventListener('SERVER_STATUS_UPDATE', this._onServerStatus);

    console.log('[HudManager] HUD Overlay đã sẵn sàng.');
  }

  /**
   * Lắng nghe đồng bộ trạng thái từ Server
   */
  _onServerStatus(e) {
    const status = e.detail;
    if (status && typeof status.totalMerit === 'number' && status.totalMerit > this.totalMerit) {
      this.totalMerit = status.totalMerit;
      this._updateMeritDisplay();
    }
  }

  /**
   * Tính toán điểm công đức dựa trên actionType
   */
  _calculateMerit(actionType, payload = {}) {
    const intensity = payload.intensity || 1;
    const repeatCount = payload.repeatCount || 1;

    switch (actionType) {
      case 'WOODEN_FISH':
        return 1 * intensity;
      case 'PRAYER_TEXT':
        return 2 * intensity;
      case 'INCENSE':
        return 10 * repeatCount;
      case 'LANTERN':
        return 50 * repeatCount;
      case 'BELL':
        return 200 * repeatCount;
      default:
        return 1;
    }
  }

  /**
   * Xử lý sự kiện TikTok Action
   */
  _onTikTokAction(e) {
    const event = e.detail;
    if (!event || !event.actionType) return;

    const { actionType, user, payload } = event;
    const meritPoints = this._calculateMerit(actionType, payload);

    // 1. Cộng tổng công đức
    this.totalMerit += meritPoints;
    this._updateMeritDisplay();

    // 2. Cập nhật bảng điểm cá nhân
    if (user && user.uniqueId) {
      const existing = this.userScores.get(user.uniqueId) || {
        nickname: user.nickname || 'Thiện Nam Tín Nữ',
        avatarUrl: user.avatarUrl || 'https://via.placeholder.com/100',
        score: 0
      };
      existing.score += meritPoints;
      existing.nickname = user.nickname || existing.nickname;
      if (user.avatarUrl) existing.avatarUrl = user.avatarUrl;
      this.userScores.set(user.uniqueId, existing);

      this._renderLeaderboard();
    }

    // 3. Hiển thị Toast Notification cho các sự kiện trang trọng
    if (actionType === 'INCENSE' || actionType === 'LANTERN' || actionType === 'BELL') {
      this._showToast(actionType, user, payload);
    }

    // 4. Hiển thị Lời Cầu Nguyện lên Prayer Wall
    if (actionType === 'PRAYER_TEXT' || actionType === 'LANTERN') {
      const comment = payload?.comment || '';
      if (comment.trim().length > 0) {
        this._showPrayerCard(user?.nickname || 'Khán Giả', comment);
      }
    }
  }

  /**
   * Cập nhật hiệu ứng tăng số công đức mượt mà
   */
  _updateMeritDisplay() {
    if (!this.meritCounterEl) return;

    // Hiệu ứng scale nảy nhẹ khi có điểm mới
    this.meritCounterEl.classList.remove('bounce');
    void this.meritCounterEl.offsetWidth; // Force reflow
    this.meritCounterEl.classList.add('bounce');

    if (this.meritAnimTimer) clearInterval(this.meritAnimTimer);

    // Tăng số dần dần tới target
    this.meritAnimTimer = setInterval(() => {
      const diff = this.totalMerit - this.displayedMerit;
      if (diff <= 0) {
        this.displayedMerit = this.totalMerit;
        this.meritCounterEl.textContent = this.displayedMerit.toLocaleString('vi-VN');
        clearInterval(this.meritAnimTimer);
        this.meritAnimTimer = null;
      } else {
        const step = Math.max(1, Math.ceil(diff / 5));
        this.displayedMerit += step;
        this.meritCounterEl.textContent = this.displayedMerit.toLocaleString('vi-VN');
      }
    }, 30);
  }

  /**
   * Render Top 3 Bảng Vàng Công Đức
   */
  _renderLeaderboard() {
    if (!this.leaderboardListEl) return;

    // Sắp xếp giảm dần theo điểm
    const sorted = Array.from(this.userScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (sorted.length === 0) return;

    this.leaderboardListEl.innerHTML = '';
    sorted.forEach((item, index) => {
      const rank = index + 1;
      const row = document.createElement('div');
      row.className = `leaderboard-item rank-${rank}`;

      const avatarSrc = item.avatarUrl || 'https://via.placeholder.com/100';

      row.innerHTML = `
        <div class="leaderboard-user">
          <span class="leaderboard-rank">#${rank}</span>
          <img class="leaderboard-avatar" src="${avatarSrc}" alt="${item.nickname}" onerror="this.src='https://via.placeholder.com/100'" />
          <span class="leaderboard-name">${this._escapeHtml(item.nickname)}</span>
        </div>
        <span class="leaderboard-score">+${item.score.toLocaleString('vi-VN')}</span>
      `;
      this.leaderboardListEl.appendChild(row);
    });
  }

  /**
   * Hiển thị Toast Notification (Tự động biến mất sau 4 giây)
   */
  _showToast(actionType, user, payload) {
    if (!this.toastContainerEl) return;

    const toast = document.createElement('div');
    toast.className = 'toast-item';

    let actionText = '';
    let icon = '✨';

    if (actionType === 'INCENSE') {
      icon = '🕯️';
      const repeat = payload?.repeatCount || 1;
      actionText = `thành kính dâng ${repeat > 1 ? repeat + ' nén' : 'nén'} hương thơm`;
    } else if (actionType === 'LANTERN') {
      icon = '🏮';
      actionText = `đã thả Đèn Hoa Đăng cầu nguyện`;
    } else if (actionType === 'BELL') {
      icon = '🔔';
      actionText = `đã THỈNH ĐẠI HỒNG CHUNG ngân vang!`;
    }

    const nickname = user?.nickname || 'Mạnh Thường Quân';
    const avatar = user?.avatarUrl || 'https://via.placeholder.com/100';

    toast.innerHTML = `
      <img class="toast-avatar" src="${avatar}" alt="${nickname}" onerror="this.src='https://via.placeholder.com/100'" />
      <div class="toast-content">
        <span class="toast-user">${icon} ${this._escapeHtml(nickname)}</span>
        <span class="toast-action">${actionText}</span>
      </div>
    `;

    this.toastContainerEl.appendChild(toast);

    // Tự động mờ dần và gỡ bỏ sau 4 giây
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 500);
    }, 4000);
  }

  /**
   * Hiển thị Lời Cầu Nguyện lên Prayer Wall (Giới hạn 3 thẻ)
   */
  _showPrayerCard(nickname, comment) {
    if (!this.prayerWallEl) return;

    // Giới hạn 3 thẻ
    const existingCards = this.prayerWallEl.querySelectorAll('.prayer-card');
    if (existingCards.length >= this.maxPrayerCards) {
      const oldest = existingCards[0];
      if (oldest.parentNode) oldest.parentNode.removeChild(oldest);
    }

    const card = document.createElement('div');
    card.className = 'prayer-card';
    card.innerHTML = `
      <div class="prayer-author">
        <span>🙏</span>
        <span>${this._escapeHtml(nickname)}:</span>
      </div>
      <div class="prayer-text">"${this._escapeHtml(comment)}"</div>
    `;

    this.prayerWallEl.appendChild(card);

    // Tự động mờ và biến mất sau 8 giây
    setTimeout(() => {
      card.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      card.style.opacity = '0';
      card.style.transform = 'translateY(-15px)';
      setTimeout(() => {
        if (card.parentNode) card.parentNode.removeChild(card);
      }, 800);
    }, 8000);
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


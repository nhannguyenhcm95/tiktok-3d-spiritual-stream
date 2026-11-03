/**
 * HudManager.js - Quản lý UI HUD, Bảng Tấm Lòng Thành, Top Banner Toast
 * và Hệ Thống DOM Object Pooling cho Thẻ Tên & Bong Bóng Chat Cầu Nguyện
 * Tuân thủ chuẩn CONTRACT.md & Role 03
 */

export class HudManager {
  constructor() {
    this.labelsLayer = document.getElementById('labels-layer');
    this.topBannerToast = document.getElementById('top-banner-toast');
    this.toastText = document.getElementById('toast-text');
    this.fifthSeatInfo = document.getElementById('fifth-seat-info');
    this.chasersList = document.getElementById('chasers-list');
    this.bowCounter = document.getElementById('bow-counter');

    // Object Pooling cho Thẻ Tên (Name Tags)
    this.maxNameTags = 60;
    this.nameTagPool = [];
    this.activeNameTags = new Map(); // id -> domElement

    // Object Pooling cho Bong Bóng Chat (Speech Bubbles)
    this.maxBubbles = 25;
    this.bubblePool = [];
    this.activeBubbles = []; // mảng các bubble đang hiển thị

    this.toastTimer = null;

    this.initPools();
  }

  /**
   * Khởi tạo trước các phần tử DOM để tái sử dụng (Object Pooling chống giật lag)
   */
  initPools() {
    // 1. Tạo sẵn Pool thẻ tên
    for (let i = 0; i < this.maxNameTags; i++) {
      const tag = document.createElement('div');
      tag.className = 'name-tag';
      tag.style.display = 'none';
      tag.style.opacity = '0';
      this.labelsLayer.appendChild(tag);
      this.nameTagPool.push(tag);
    }

    // 2. Tạo sẵn Pool bong bóng chat
    for (let i = 0; i < this.maxBubbles; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'speech-bubble';
      bubble.style.display = 'none';
      bubble.style.opacity = '0';
      this.labelsLayer.appendChild(bubble);
      this.bubblePool.push(bubble);
    }
  }

  /**
   * Cập nhật vị trí thẻ tên theo danh sách toạ độ 2D từ CrowdSystem
   */
  updateAnchors(anchors) {
    if (!Array.isArray(anchors)) return;

    // Đánh dấu các tag đang dùng
    const usedIds = new Set();

    anchors.forEach((anchor) => {
      if (!anchor.visible) return;

      usedIds.add(anchor.id);
      let tag = this.activeNameTags.get(anchor.id);

      if (!tag) {
        // Lấy tag từ pool
        tag = this.nameTagPool.pop();
        if (tag) {
          tag.style.display = 'block';
          this.activeNameTags.set(anchor.id, tag);
        }
      }

      if (tag) {
        tag.textContent = anchor.nickname || 'Phật tử';
        // Phân loại style tag
        if (anchor.isSolo) {
          tag.className = 'name-tag solo-tag';
        } else if (anchor.isVip) {
          tag.className = 'name-tag vip-tag';
        } else {
          tag.className = 'name-tag';
        }

        // Định vị bằng translate3d để GPU xử lý mượt mà 60 FPS
        tag.style.transform = `translate3d(${Math.round(anchor.x)}px, ${Math.round(anchor.y)}px, 0) translate(-50%, -100%)`;
        tag.style.opacity = '1';
      }
    });

    // Thu hồi các tag không còn nằm trong khung nhìn
    for (const [id, tag] of this.activeNameTags.entries()) {
      if (!usedIds.has(id)) {
        tag.style.display = 'none';
        tag.style.opacity = '0';
        this.nameTagPool.push(tag);
        this.activeNameTags.delete(id);
      }
    }

    // Cập nhật vị trí của các bong bóng chat đang bay
    this.updateActiveBubblesPosition(anchors);
  }

  /**
   * Hiển thị bong bóng chat lời cầu nguyện nổi trên đầu nhân vật
   */
  showChatBubble(chatData) {
    const { uniqueId, nickname, comment, slotIndex, isVip } = chatData;
    if (!comment) return;

    // Lấy bubble từ pool
    let bubble = this.bubblePool.pop();
    if (!bubble) {
      // Nếu hết pool, tái sử dụng bubble cũ nhất
      const oldest = this.activeBubbles.shift();
      if (oldest) {
        bubble = oldest.element;
      }
    }

    if (!bubble) return;

    bubble.textContent = comment;
    bubble.style.display = 'block';
    bubble.style.opacity = '1';

    const bubbleRecord = {
      element: bubble,
      uniqueId,
      slotIndex,
      isVip,
      expireTime: Date.now() + 4500 // Tự biến mất sau 4.5 giây
    };

    this.activeBubbles.push(bubbleRecord);
  }

  /**
   * Cập nhật vị trí các bong bóng chat theo vị trí nhân vật tương ứng
   */
  updateActiveBubblesPosition(anchors) {
    const now = Date.now();
    const remainingBubbles = [];

    this.activeBubbles.forEach((b) => {
      if (now > b.expireTime) {
        // Hết hạn -> Thu hồi về pool
        b.element.style.display = 'none';
        b.element.style.opacity = '0';
        this.bubblePool.push(b.element);
        return;
      }

      // Tìm anchor tương ứng của nhân vật đó
      let matchedAnchor = null;
      if (b.isVip) {
        matchedAnchor = anchors.find((a) => a.isVip && a.uniqueId === b.uniqueId) || anchors[0];
      } else if (b.slotIndex !== undefined && b.slotIndex >= 0) {
        matchedAnchor = anchors.find((a) => a.slotIndex === b.slotIndex);
      } else {
        matchedAnchor = anchors.find((a) => a.uniqueId === b.uniqueId);
      }

      if (matchedAnchor && matchedAnchor.visible) {
        b.element.style.transform = `translate3d(${Math.round(matchedAnchor.x)}px, ${Math.round(matchedAnchor.y - 22)}px, 0) translate(-50%, -125%)`;
        remainingBubbles.push(b);
      } else {
        // Nếu không tìm thấy anchor hoặc nhân vật bị ẩn, tạm giấu bubble
        b.element.style.display = 'none';
        remainingBubbles.push(b);
      }
    });

    this.activeBubbles = remainingBubbles;
  }

  /**
   * Cập nhật Bảng TẤM LÒNG THÀNH góc phải trên
   */
  updateLeaderboard(payload) {
    if (!payload) return;

    // 1. Cập nhật mốc đệm cuối (Hạng 5)
    if (this.fifthSeatInfo) {
      const fifthCoins = payload.fifthSeatCoins !== undefined ? payload.fifthSeatCoins : 204;
      this.fifthSeatInfo.innerHTML = `Đệm cuối (hạng 5) có <span class="gold-coin-val">${fifthCoins}</span> xu 🪙`;
    }

    // 2. Cập nhật danh sách 4 người bám đuổi
    if (this.chasersList && Array.isArray(payload.chasers)) {
      this.chasersList.innerHTML = '';
      payload.chasers.slice(0, 4).forEach((chaser) => {
        const item = document.createElement('div');
        item.className = 'chaser-item';
        item.innerHTML = `
          <div class="chaser-main">
            <span class="chaser-rank">${chaser.rank}.</span>
            <span class="chaser-name" title="${chaser.nickname}">${chaser.nickname}</span>
            <span class="chaser-coins">${chaser.coins} 🪙</span>
          </div>
          <div class="chaser-needed">còn ${chaser.coinsNeeded} xu để lên đệm</div>
        `;
        this.chasersList.appendChild(item);
      });
    }
  }

  /**
   * Cập nhật bộ đếm Vòng lạy
   */
  updateBowCounter(count) {
    if (this.bowCounter) {
      this.bowCounter.textContent = `Vòng lạy: ${count}`;
    }
  }

  /**
   * Hiển thị Banner Thông Báo Đỉnh (Top Toast)
   */
  showTopToast(text, type = 'SHARE') {
    if (!this.topBannerToast || !this.toastText) return;

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.toastText.textContent = text;
    this.topBannerToast.classList.remove('toast-hidden');

    // Tự động ẩn sau 3.8 giây
    this.toastTimer = setTimeout(() => {
      this.topBannerToast.classList.add('toast-hidden');
    }, 3800);
  }
}

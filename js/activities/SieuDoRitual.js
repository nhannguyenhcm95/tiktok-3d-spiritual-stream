/**
 * SieuDoRitual.js - Nghi thức Niệm Phật, Xoay Tràng Hạt 108 Hạt & Đàn Tràng Siêu Độ
 * Tích hợp điều khiển tại chỗ (Click/Touch) & Tương tác quà tặng TikTok theo cấp bậc
 */

export class SieuDoRitual {
  constructor(options = {}) {
    this.audioSynth = options.audioSynth || null;
    this.playerController = options.playerController || null;
    this.vfxManager = options.vfxManager || null;
    this.templeWorld = options.templeWorld || null;
    this.onChantUpdate = options.onChantUpdate || null;

    // Trạng thái chuỗi hạt và niệm Phật
    this.beadCount = 108;
    this.currentBeadIndex = 0;
    this.totalChants = parseInt(localStorage.getItem('np_chant_count') || '0', 10);
    this.totalMerit = parseInt(localStorage.getItem('np_merit_points') || '0', 10);
    this.purifiedCount = parseInt(localStorage.getItem('np_purified_count') || '0', 10);

    this.holyPhrases = [
      'Nam Mô A Di Đà Phật',
      'Nam Mô Đại Bi Quán Thế Âm Bồ Tát',
      'Nam Mô Đại Thế Chí Bồ Tát',
      'Nam Mô Địa Tạng Vương Bồ Tát',
      'Nam Mô Bổn Sư Thích Ca Mâu Ni Phật',
      'Nguyện Tiêu Tam Chướng Trừ Phiền Não',
      'Nguyện Đắc Trí Huệ Chân Minh Liễu'
    ];

    // Bảng quy đổi cấp bậc quà tặng TikTok theo danh sách thực tế
    this.giftTiers = {
      // Nhóm 1: 1 xu (Hoa hồng, GG, Tim)
      tier1: {
        minCoins: 1,
        maxCoins: 4,
        name: 'Tiểu Tâm Hương',
        action: (sender, giftName) => this.handleGiftTier1(sender, giftName)
      },
      // Nhóm 2: 5 - 19 xu (Bắn tim, Đào, Rosa, Chú heo, Cỏ bốn lá...)
      tier2: {
        minCoins: 5,
        maxCoins: 19,
        name: 'Tam Bảo Dâng Hương',
        action: (sender, giftName) => this.handleGiftTier2(sender, giftName)
      },
      // Nhóm 3: 20 - 99 xu (Nước hoa, Hạc giấy, Vương miện nhỏ)
      tier3: {
        minCoins: 20,
        maxCoins: 99,
        name: 'Đại Hồng Chung Cầu Nguyện',
        action: (sender, giftName) => this.handleGiftTier3(sender, giftName)
      },
      // Nhóm 4: 100 - 2.998 xu (Pháo hoa giấy, Bó hoa...)
      tier4: {
        minCoins: 100,
        maxCoins: 2998,
        name: 'Vũ Hoa Cúng Phật',
        action: (sender, giftName) => this.handleGiftTier4(sender, giftName)
      },
      // Nhóm 5: 2.999 - 19.999 xu (Xe máy Gấu, Máy bay, Nhà gỗ, Ô tô thể thao)
      tier5: {
        minCoins: 2999,
        maxCoins: 19999,
        name: 'Kim Cang Bảo Đàn',
        action: (sender, giftName) => this.handleGiftTier5(sender, giftName)
      },
      // Nhóm 6: 20.000 - 99.999 xu (Lâu đài ảo, Con Sư Tử, Phượng Hoàng Lửa, Lôi Điểu)
      tier6: {
        minCoins: 20000,
        maxCoins: 99999,
        name: 'Đại Lễ Siêu Độ Chư Vong Linh',
        action: (sender, giftName) => this.handleGiftTier6(sender, giftName)
      },
      // Nhóm 7: 100.000+ xu (Vũ trụ TikTok Universe - 449.999 xu)
      tier7: {
        minCoins: 100000,
        maxCoins: 999999,
        name: 'Vạn Phật Quang Chiếu Vô Lượng',
        action: (sender, giftName) => this.handleGiftTier7(sender, giftName)
      }
    };
  }

  /**
   * Người chơi tự bấm nút [📿 Niệm Phật] trên HUD
   */
  chantOnce(customText = null) {
    this.totalChants++;
    this.totalMerit += 1;
    this.currentBeadIndex = (this.currentBeadIndex + 1) % this.beadCount;

    // Lưu LocalStorage
    this.saveState();

    // 1. Âm thanh mõ gỗ trầm bổng
    if (this.audioSynth) {
      this.audioSynth.playWoodenFish();
    }

    // 2. Chuyển động nhẹ của nhân vật
    if (this.playerController) {
      if (this.playerController.currentAction === 'IDLE') {
        this.playerController.setAnimation('BOW', 800);
      }
    }

    // 3. Hiệu ứng bay chữ vàng
    const phrase = customText || this.holyPhrases[Math.floor(Math.random() * this.holyPhrases.length)];
    this.spawnFloatingHolyText(phrase);

    // 4. Nếu đang đứng gần hoặc trong Đàn Tràng Siêu Độ -> tịnh hóa linh quang
    if (this.vfxManager) {
      // Cứ mỗi 5 lần niệm, tịnh hóa 1 đốm linh quang u tối
      if (this.totalChants % 5 === 0) {
        const purified = this.vfxManager.purifyLinhQuang();
        if (purified) {
          this.purifiedCount++;
          this.saveState();
        }
      }
    }

    // Callback báo về HUD cập nhật giao diện
    if (this.onChantUpdate) {
      this.onChantUpdate({
        totalChants: this.totalChants,
        totalMerit: this.totalMerit,
        currentBeadIndex: this.currentBeadIndex,
        purifiedCount: this.purifiedCount,
        phrase: phrase
      });
    }

    return {
      totalChants: this.totalChants,
      currentBeadIndex: this.currentBeadIndex,
      phrase: phrase
    };
  }

  /**
   * Kích hoạt nghi thức Siêu Độ tại Đàn Tràng
   */
  performSieuDoRitual() {
    if (this.audioSynth) {
      this.audioSynth.playVajraBell();
      this.audioSynth.playGreatBell();
    }

    if (this.playerController) {
      this.playerController.setAnimation('HAND_SEAL', 4000);
    }

    if (this.vfxManager) {
      const pPos = this.playerController ? this.playerController.getPosition() : { x: -22, y: 0, z: -20 };
      this.vfxManager.triggerShockwave(pPos, '#ffd700');
      
      // Tịnh hóa toàn bộ các đốm linh quang đang vãng lai
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          if (this.vfxManager) this.vfxManager.purifyLinhQuang();
        }, i * 350);
      }
    }

    this.totalMerit += 50;
    this.purifiedCount += 6;
    this.saveState();

    this.spawnFloatingHolyText('✨ Linh Quang Tịnh Hóa - Siêu Sinh Tịnh Độ ✨', '#ffd700', 36);

    if (this.onChantUpdate) {
      this.onChantUpdate({
        totalChants: this.totalChants,
        totalMerit: this.totalMerit,
        purifiedCount: this.purifiedCount,
        isRitualComplete: true
      });
    }
  }

  /**
   * Xử lý quà tặng TikTok từ Backend Socket.io
   */
  processGiftEvent(giftEvent) {
    // giftEvent = { user, giftName, diamondCount, repeatCount }
    const coins = giftEvent.diamondCount || 1;
    const sender = giftEvent.user || 'Phật Tử Ẩn Danh';
    const giftName = giftEvent.giftName || 'Tâm Hoa';

    // Tìm nhóm quà tương ứng
    for (const key of Object.keys(this.giftTiers)) {
      const tier = this.giftTiers[key];
      if (coins >= tier.minCoins && coins <= tier.maxCoins) {
        tier.action(sender, giftName);
        return;
      }
    }

    // Mặc định
    this.handleGiftTier1(sender, giftName);
  }

  // --- Chi tiết các cấp bậc Quà Tặng ---

  // Cấp 1 (1 - 4 xu: Hoa hồng, Tim, GG)
  handleGiftTier1(sender, giftName) {
    if (this.audioSynth) this.audioSynth.playWoodenFish();
    this.chantOnce();
    this.spawnFloatingHolyText(`${sender} cúng dường ${giftName} 🙏`, '#ffb3ba', 22);
  }

  // Cấp 2 (5 - 19 xu: Bắn tim, Đào, Rosa, Heo may mắn, Cỏ 4 lá)
  handleGiftTier2(sender, giftName) {
    if (this.audioSynth) {
      this.audioSynth.playSingingBowl(520);
      this.audioSynth.playWoodenFish();
    }
    if (this.vfxManager && this.playerController) {
      const pos = this.playerController.getPosition();
      this.vfxManager.spawnLotusStep(pos.x, pos.z);
    }
    this.totalMerit += 5;
    this.saveState();
    this.spawnFloatingHolyText(`${sender} thắp Tam Bảo Hương (${giftName}) 🌸`, '#ffd166', 26);
  }

  // Cấp 3 (20 - 99 xu: Nước hoa, Hạc giấy, Vương miện nhỏ)
  handleGiftTier3(sender, giftName) {
    if (this.audioSynth) {
      this.audioSynth.playGreatBell();
    }
    if (this.vfxManager && this.playerController) {
      this.vfxManager.triggerShockwave(this.playerController.getPosition(), '#06d6a0');
    }
    this.totalMerit += 20;
    this.saveState();
    this.spawnFloatingHolyText(`${sender} thỉnh Đại Hồng Chung (${giftName}) 🔔`, '#06d6a0', 28);
  }

  // Cấp 4 (100 - 2.998 xu: Pháo hoa giấy, Bó hoa)
  handleGiftTier4(sender, giftName) {
    if (this.audioSynth) {
      this.audioSynth.playSingingBowl(620);
      this.audioSynth.playGreatBell();
    }
    if (this.playerController) {
      this.playerController.setAnimation('BOW', 2000);
    }
    this.totalMerit += 100;
    this.saveState();
    this.spawnFloatingHolyText(`${sender} rải hoa cúng Phật (${giftName}) 🪷`, '#ef476f', 32);
  }

  // Cấp 5 (2.999 - 19.999 xu: Xe máy Gấu, Máy bay, Nhà gỗ, Ô tô)
  handleGiftTier5(sender, giftName) {
    if (this.audioSynth) {
      this.audioSynth.playVajraBell();
      this.audioSynth.playGreatBell();
    }
    if (this.playerController) {
      this.playerController.setAnimation('HAND_SEAL', 3500);
    }
    if (this.vfxManager) {
      const pos = this.playerController ? this.playerController.getPosition() : { x: 0, y: 0, z: 0 };
      this.vfxManager.triggerShockwave(pos, '#ffd700');
      this.vfxManager.purifyLinhQuang();
    }
    this.totalMerit += 500;
    this.purifiedCount += 3;
    this.saveState();
    this.spawnFloatingHolyText(`🌟 ĐẠI ĐÀN CẦU AN: ${sender} dâng ${giftName} 🌟`, '#ffd700', 36);
  }

  // Cấp 6 (20.000 - 99.999 xu: Lâu đài ảo, Sư Tử, Phượng Hoàng Lửa, Lôi Điểu)
  handleGiftTier6(sender, giftName) {
    if (this.audioSynth) {
      this.audioSynth.playVajraBell();
      this.audioSynth.playGreatBell();
      this.audioSynth.playChantDrone();
    }
    if (this.playerController) {
      this.playerController.setAnimation('MEDITATE', 6000);
    }
    if (this.vfxManager) {
      const pos = this.playerController ? this.playerController.getPosition() : { x: 0, y: 0, z: 0 };
      this.vfxManager.triggerShockwave(pos, '#ff9e00');
      for (let i = 0; i < 9; i++) {
        setTimeout(() => {
          if (this.vfxManager) this.vfxManager.purifyLinhQuang();
        }, i * 300);
      }
    }
    this.totalMerit += 2000;
    this.purifiedCount += 9;
    this.saveState();
    this.spawnFloatingHolyText(`👑 ĐẠI THƯỢNG CÚNG DƯỜNG: ${sender} dâng ${giftName} 👑`, '#ffb703', 42);
  }

  // Cấp 7 (100.000+ xu: Vũ trụ TikTok Universe - 449.999 xu)
  handleGiftTier7(sender, giftName) {
    if (this.audioSynth) {
      this.audioSynth.playVajraBell();
      this.audioSynth.playGreatBell();
      this.audioSynth.playChantDrone();
    }
    if (this.playerController) {
      this.playerController.setAnimation('HAND_SEAL', 8000);
    }
    if (this.vfxManager) {
      const pos = this.playerController ? this.playerController.getPosition() : { x: 0, y: 0, z: 0 };
      this.vfxManager.triggerShockwave(pos, '#ffffff');
      // Tịnh hóa toàn bộ
      for (let i = 0; i < 18; i++) {
        setTimeout(() => {
          if (this.vfxManager) this.vfxManager.purifyLinhQuang();
        }, i * 200);
      }
    }
    this.totalMerit += 10000;
    this.purifiedCount += 18;
    this.saveState();
    this.spawnFloatingHolyText(`🪐 VẠN PHẬT QUANG CHIẾU: ${sender} CÚNG DƯỜNG VŨ TRỤ TIKTOK 🪐`, '#ffffff', 48);
  }

  /**
   * Tạo hiệu ứng chữ thư pháp vàng bay lên trong DOM
   */
  spawnFloatingHolyText(text, color = '#ffd700', fontSize = 24) {
    const container = document.getElementById('floating-text-container');
    if (!container) return;

    const el = document.createElement('div');
    el.className = 'floating-holy-text';
    el.innerText = text;
    el.style.color = color;
    el.style.fontSize = `${fontSize}px`;

    // Vị trí ngẫu nhiên quanh giữa màn hình
    const offsetX = (Math.random() - 0.5) * 160;
    el.style.left = `calc(50% + ${offsetX}px)`;
    el.style.top = `60%`;

    container.appendChild(el);

    // Tự hủy sau khi hiệu ứng CSS bay lên kết thúc (khoảng 2.5s)
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2400);
  }

  saveState() {
    localStorage.setItem('np_chant_count', this.totalChants.toString());
    localStorage.setItem('np_merit_points', this.totalMerit.toString());
    localStorage.setItem('np_purified_count', this.purifiedCount.toString());
  }
}

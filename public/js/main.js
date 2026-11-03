/**
 * main.js - Entry Point & System Integrator
 * Kết nối Three.js 3D, Socket.io, HUD Layer, Audio/TTS và Debug Panel
 * Tuân thủ chuẩn CONTRACT.md & Role 04
 */

import { SceneManager } from './3d/SceneManager.js';
import { CrowdSystem } from './3d/CrowdSystem.js';
import { AltarVfxManager } from './3d/AltarVfxManager.js';
import { HudManager } from './ui/HudManager.js';
import { AudioTtsManager } from './audio/AudioTtsManager.js';

class LiveInteractiveApp {
  constructor() {
    this.container = document.getElementById('webgl-container');
    this.sceneManager = null;
    this.crowdSystem = null;
    this.altarVfx = null;
    this.hudManager = null;
    this.audioTts = null;
    this.socket = null;

    this.clock = null;
    this.lastTime = 0;

    this.init();
  }

  async init() {
    console.log('🌸 [App] Đang khởi tạo Chánh Điện Dâng Hương & Đám Đông Quỳ Lạy...');

    // 1. Kiểm tra tham số OBS Mode (?obs=true)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('obs') === 'true') {
      document.body.classList.add('obs-mode');
      console.log('📹 [App] Chế độ OBS Browser Source đã kích hoạt.');
    }

    // 2. Khởi tạo Three.js SceneManager
    this.sceneManager = new SceneManager(this.container);

    // 3. Khởi tạo CrowdSystem (50 Phật tử + 4 VIP + Solo Dâng Hương)
    this.crowdSystem = new CrowdSystem(this.sceneManager.getScene());

    // 4. Khởi tạo AltarVfxManager (Khói hương, Hào quang, Bùng sáng lư đồng)
    this.altarVfx = new AltarVfxManager(
      this.sceneManager.getScene(),
      this.sceneManager.getAltarPosition()
    );

    // 5. Khởi tạo HudManager (Thẻ tên, Bong bóng chat, Bảng Tấm Lòng Thành)
    this.hudManager = new HudManager();

    // 6. Khởi tạo AudioTtsManager (Nhạc ngũ cung, Chuông chùa, TTS Tiếng Việt)
    this.audioTts = new AudioTtsManager();

    // Lắng nghe chu kỳ lạy hoàn tất từ CrowdSystem để cập nhật HUD
    this.crowdSystem.onBowCycleCompleted = (count) => {
      this.hudManager.updateBowCounter(count);
    };

    // 7. Kết nối Socket.io lắng nghe sự kiện từ Backend
    this.setupSocketConnection();

    // 8. Thiết lập Debug Panel & UI Controls
    this.setupDebugPanel();
    this.setupAudioUnlockTriggers();

    // 9. Bắt đầu Render Loop 60 FPS
    this.startTime = performance.now();
    requestAnimationFrame((t) => this.renderLoop(t));

    console.log('✅ [App] Hệ thống đã sẵn sàng phục vụ buổi lễ!');
  }

  /**
   * Kết nối Socket.io và xử lý các sự kiện thời gian thực
   */
  setupSocketConnection() {
    if (typeof io === 'undefined') {
      console.warn('⚠️ [Socket.io] Thư viện io chưa sẵn sàng, chờ nạp lại...');
      setTimeout(() => this.setupSocketConnection(), 500);
      return;
    }

    this.socket = io();

    this.socket.on('connect', () => {
      console.log('⚡ [Socket.io] Đã kết nối thành công tới Game Server!');
      const statusEl = document.getElementById('connection-status');
      if (statusEl) statusEl.textContent = 'Trạng thái: Đã kết nối Server';
    });

    // 1. Đồng bộ đám đông & Bảng Tấm Lòng Thành
    this.socket.on('crowd_sync', (payload) => {
      this.crowdSystem.syncCrowdData(payload);
      this.hudManager.updateLeaderboard(payload);
    });

    // 2. Bong bóng chat lời cầu nguyện
    this.socket.on('chat_bubble', (chatData) => {
      this.hudManager.showChatBubble(chatData);
    });

    // 3. Hiệu ứng Spotlight Solo Dâng Hương (Khi có người tặng quà)
    this.socket.on('spotlight_incense', (giftData) => {
      console.log(`🌹 [Spotlight] Bắt đầu Solo Dâng Hương: ${giftData.nickname} (${giftData.giftName})`);

      // Kích hoạt animation bước lên thảm đỏ
      this.crowdSystem.triggerSpotlightIncense(
        giftData,
        // Callback khi nhân vật bước tới trước lư hương
        () => {
          // Lư hương bùng sáng hào quang
          this.altarVfx.triggerAltarBurst();
          // Tiếng Đại Hồng Chung ngân vang trầm hùng
          this.audioTts.playTempleBell();
          // Giọng đọc AI đọc câu chúc tiếng Việt
          if (giftData.ttsText) {
            this.audioTts.speakVietnamese(giftData.ttsText);
          }
        },
        // Callback khi kết thúc toàn bộ nghi thức dâng hương
        () => {
          console.log(`🙏 [Spotlight] Hoàn tất nghi lễ dâng hương của: ${giftData.nickname}`);
        }
      );
    });

    // 4. Banner thông báo đỉnh màn hình (Chia sẻ / Dâng hương)
    this.socket.on('top_banner', (bannerData) => {
      this.hudManager.showTopToast(bannerData.text, bannerData.type);
    });

    // 5. Cập nhật trạng thái TikTok / Auto-Mock từ Server
    this.socket.on('server_status', (status) => {
      const mockBtn = document.getElementById('btn-toggle-mock');
      if (mockBtn) {
        if (status.autoMock) {
          mockBtn.textContent = 'ĐANG BẬT';
          mockBtn.classList.add('active');
        } else {
          mockBtn.textContent = 'ĐÃ TẮT';
          mockBtn.classList.remove('active');
        }
      }

      const statusEl = document.getElementById('connection-status');
      if (statusEl) {
        statusEl.textContent = status.connected
          ? `Đang Live: @${status.tiktokUsername}`
          : 'Trạng thái: Chưa kết nối TikTok Live';
      }
    });

    this.socket.on('disconnect', () => {
      console.warn('⚠️ [Socket.io] Mất kết nối tới Game Server.');
    });
  }

  /**
   * Mở khóa AudioContext khi tương tác lần đầu
   */
  setupAudioUnlockTriggers() {
    const unlock = () => {
      this.audioTts.unlockAudio();
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });

    const soundBtn = document.getElementById('audio-unlock-btn');
    if (soundBtn) {
      soundBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.audioTts.unlockAudio();
        const isOn = this.audioTts.toggleSound();
        const icon = document.getElementById('audio-icon');
        if (icon) icon.textContent = isOn ? '🔊' : '🔇';
      });
    }
  }

  /**
   * Thiết lập Bảng Điều Khiển Debug (Phím D hoặc nút bánh răng)
   */
  setupDebugPanel() {
    const panel = document.getElementById('debug-panel');
    const toggleBtn = document.getElementById('toggle-debug-btn');
    const closeBtn = document.getElementById('close-debug-btn');

    const togglePanel = () => {
      if (panel) panel.classList.toggle('debug-hidden');
    };

    if (toggleBtn) toggleBtn.addEventListener('click', togglePanel);
    if (closeBtn) closeBtn.addEventListener('click', togglePanel);

    // Bật/tắt nhanh bằng phím 'D'
    window.addEventListener('keydown', (e) => {
      if (e.key === 'd' || e.key === 'D') {
        togglePanel();
      }
    });

    // Nút kết nối TikTok
    const btnConnect = document.getElementById('btn-connect-tiktok');
    const inputUser = document.getElementById('tiktok-user-input');
    if (btnConnect && inputUser) {
      btnConnect.addEventListener('click', async () => {
        const username = inputUser.value.trim();
        if (!username) return alert('Vui lòng nhập @username TikTok!');
        btnConnect.textContent = 'Đang nối...';
        try {
          await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tiktokUsername: username })
          });
          btnConnect.textContent = 'Đã gửi';
          setTimeout(() => (btnConnect.textContent = 'Kết Nối'), 2000);
        } catch (err) {
          alert('Lỗi gửi kết nối: ' + err.message);
          btnConnect.textContent = 'Kết Nối';
        }
      });
    }

    // Nút bật/tắt Auto-Mock
    const btnMock = document.getElementById('btn-toggle-mock');
    if (btnMock) {
      btnMock.addEventListener('click', async () => {
        const isCurrentActive = btnMock.classList.contains('active');
        const nextState = !isCurrentActive;
        try {
          await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ autoMock: nextState })
          });
        } catch (err) {
          console.error('Lỗi toggle mock:', err);
        }
      });
    }

    // Nút bật/tắt âm thanh trong panel
    const btnSound = document.getElementById('btn-toggle-sound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        this.audioTts.unlockAudio();
        const isOn = this.audioTts.toggleSound();
        btnSound.textContent = isOn ? 'ĐANG BẬT' : 'ĐÃ TẮT';
        if (isOn) btnSound.classList.add('active');
        else btnSound.classList.remove('active');
      });
    }

    // Các nút test nhanh
    const setupTestBtn = (id, type) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', () => {
          fetch(`/api/mock/${type}`, { method: 'POST' }).catch((e) => console.error(e));
        });
      }
    };

    setupTestBtn('btn-mock-chat', 'CHAT');
    setupTestBtn('btn-mock-share', 'SHARE');
    setupTestBtn('btn-mock-gift-small', 'GIFT_SMALL');
    setupTestBtn('btn-mock-gift-vip', 'GIFT_VIP');
  }

  /**
   * Render Loop mượt mà 60 FPS
   */
  renderLoop(currentTime) {
    requestAnimationFrame((t) => this.renderLoop(t));

    const delta = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;
    const elapsed = (currentTime - this.startTime) / 1000;

    // 1. Cập nhật Scene (Hào quang Phật, ánh nến lung linh)
    this.sceneManager.update(elapsed);

    // 2. Cập nhật Đám đông (Chu kỳ Quỳ Lạy 6s)
    this.crowdSystem.update(delta);

    // 3. Cập nhật Hiệu ứng (Khói hương, Hào quang bùng sáng)
    this.altarVfx.update(delta);

    // 4. Chiếu tọa độ 3D sang màn hình 2D để cập nhật Thẻ tên & Bong bóng chat
    const camera = this.sceneManager.getCamera();
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const anchors = this.crowdSystem.getProjectedAnchors(camera, w, h);
    this.hudManager.updateAnchors(anchors);

    // 5. Render Three.js Scene
    this.sceneManager.render();
  }
}

// Khởi chạy ứng dụng khi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new LiveInteractiveApp());
} else {
  new LiveInteractiveApp();
}

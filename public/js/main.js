/**
 * Main Entry Point — PHẬT ĐIỆN VẠN NGƯỜI
 * Khởi tạo SceneManager, SoundSynth, HudManager.
 * Kết nối Socket.io với TikTok Live, điều phối sự kiện tương tác
 * và tích hợp Admin Dashboard (phím D) với đầy đủ test commands & gifts.
 */

import { SceneManager } from './3d/SceneManager.js';
import { SoundSynth } from './audio/SoundSynth.js';
import { HudManager } from './ui/HudManager.js';

class App {
  constructor() {
    this.sceneManager = null;
    this.soundSynth = null;
    this.hudManager = null;
    this.socket = null;

    this.isMuted = false;
    this.isAutoMock = true;
    this.lastEventTime = Date.now();
  }

  async init() {
    console.log('[Main] Khởi động PHẬT ĐIỆN VẠN NGƯỜI 3D Live Stream...');

    // 1. Khởi tạo Three.js SceneManager
    const webglContainer = document.getElementById('webgl-container');
    this.sceneManager = new SceneManager(webglContainer);
    this.sceneManager.init();

    // 2. Khởi tạo Web Audio Synthesizer
    this.soundSynth = new SoundSynth();
    this.soundSynth.init();

    // 3. Khởi tạo HUD Manager
    this.hudManager = new HudManager(this.soundSynth);
    this.hudManager.init();

    // 4. Mở khóa Audio tự động khi có tương tác đầu tiên
    this._setupAudioAutoUnlock();

    // 5. Kết nối Socket.io
    this._initSocket();

    // 6. Admin Dashboard (phím D)
    this._setupDebugPanel();

    // 7. Anti-AFK Watchdog (chống TikTok quét phòng Live tĩnh)
    this._startAfkWatchdog();

    console.log('[Main] Hệ thống PHẬT ĐIỆN VẠN NGƯỜI đã sẵn sàng phát sóng!');
  }

  _setupAudioAutoUnlock() {
    const unlock = () => {
      if (this.soundSynth) this.soundSynth.unlockAudio();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
  }

  _initSocket() {
    if (typeof io === 'undefined') return;
    this.socket = io();

    this.socket.on('stream_event', (eventData) => {
      this.lastEventTime = Date.now();
      window.dispatchEvent(new CustomEvent('TIKTOK_ACTION', { detail: eventData }));
    });

    this.socket.on('server_status', (status) => {
      window.dispatchEvent(new CustomEvent('SERVER_STATUS_UPDATE', { detail: status }));
      this._updateStatusUI(status);
    });

    this.socket.on('reset_avatars', () => {
      window.dispatchEvent(new CustomEvent('RESET_AVATARS'));
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Đã kết nối máy chủ.');
      const statusEl = document.getElementById('debug-status-text');
      if (statusEl) statusEl.textContent = 'Server Online';
    });

    this.socket.on('disconnect', () => {
      console.warn('[Socket] Mất kết nối máy chủ.');
      const statusEl = document.getElementById('debug-status-text');
      if (statusEl) statusEl.textContent = 'Mất kết nối';
    });
  }

  _updateStatusUI(status) {
    if (!status) return;
    const statusEl = document.getElementById('debug-status-text');
    if (statusEl) {
      if (status.connected) {
        statusEl.textContent = `Live: @${status.tiktokUsername}`;
        statusEl.style.background = '#2e7d32';
      } else {
        statusEl.textContent = status.autoMock ? 'Auto-Mock (Chờ Live)' : 'Chưa kết nối';
        statusEl.style.background = status.autoMock ? '#1565c0' : '#c62828';
      }
    }
  }

  _setupDebugPanel() {
    const debugPanel = document.getElementById('debug-panel');
    const toggleDebug = () => debugPanel.classList.toggle('hidden');

    // Phím D ẩn/hiện Admin Dashboard
    window.addEventListener('keydown', (e) => {
      if (e.key === 'd' || e.key === 'D') {
        if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
        toggleDebug();
      }
    });

    const floatingBtn = document.getElementById('debug-floating-btn');
    if (floatingBtn) floatingBtn.onclick = toggleDebug;

    const closeBtn = document.getElementById('btn-close-debug');
    if (closeBtn) closeBtn.onclick = () => debugPanel.classList.add('hidden');

    // Nút kết nối TikTok Live
    const btnConnect = document.getElementById('btn-connect-tiktok');
    const inputUsername = document.getElementById('input-tiktok-username');
    if (btnConnect && inputUsername) {
      btnConnect.onclick = async () => {
        const u = inputUsername.value.trim();
        try {
          await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tiktokUsername: u })
          });
        } catch (e) {}
      };
    }

    // Nút Bật/Tắt Auto-Mock
    const btnMock = document.getElementById('btn-toggle-mock');
    if (btnMock) {
      btnMock.onclick = async () => {
        this.isAutoMock = !this.isAutoMock;
        btnMock.textContent = this.isAutoMock ? 'Auto-Mock: BẬT' : 'Auto-Mock: TẮT';
        if (this.isAutoMock) btnMock.classList.add('on');
        else btnMock.classList.remove('on');

        try {
          await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ autoMock: this.isAutoMock })
          });
        } catch (e) {}
      };
    }

    // Nút Bật/Tắt Âm thanh
    const btnAudio = document.getElementById('btn-toggle-audio');
    if (btnAudio) {
      btnAudio.onclick = () => {
        this.isMuted = !this.isMuted;
        window.dispatchEvent(new CustomEvent('AUDIO_TOGGLE', { detail: { muted: this.isMuted } }));
        btnAudio.textContent = this.isMuted ? '🔇 Đã Tắt' : '🔊 Đang Bật';
        if (this.isMuted) btnAudio.classList.remove('on');
        else btnAudio.classList.add('on');
      };
    }

    // Nút Xóa / Reset Phật tử trong điện
    const btnResetPlayers = document.getElementById('btn-reset-players');
    if (btnResetPlayers) {
      btnResetPlayers.onclick = async () => {
        try {
          await fetch('/api/players/reset', { method: 'POST' });
        } catch (e) {}
      };
    }

    // Danh sách các nút test
    const testList = [
      // 1. Khán giả
      { id: 'test-join', action: 'VIEWER_JOINED' },
      { id: 'test-share', action: 'SHARE' },

      // 2. Lệnh Comment
      { id: 'test-nammo', action: 'NIEM_PHAT' },
      { id: 'test-quy', action: 'KNEEL' },
      { id: 'test-lay', action: 'BOW' },
      { id: 'test-dung', action: 'STAND' },
      { id: 'test-cauan', action: 'PRAY' },
      { id: 'test-danghoa', action: 'OFFER_FLOWER' },
      { id: 'test-dile', action: 'WALK_TO_ALTAR' },
      { id: 'test-fish', action: 'WOODEN_FISH' },

      // 3. Cúng dường Quà tặng
      { id: 'test-1', action: 'INCENSE_1' },
      { id: 'test-5', action: 'INCENSE_3' },
      { id: 'test-10', action: 'LANTERN' },
      { id: 'test-20', action: 'OFFERING_FRUIT' },
      { id: 'test-99', action: 'BELL' },
      { id: 'test-100', action: 'CONFETTI' },
      { id: 'test-2999', action: 'PARADE_FLOAT' },
      { id: 'test-5000', action: 'BUDDHA_LIGHT' },
      { id: 'test-7000', action: 'THOUSAND_LANTERNS' },
      { id: 'test-20000', action: 'GOLDEN_PAGODA' },
      { id: 'test-29999', action: 'GOLDEN_LION' },
      { id: 'test-39999', action: 'GOLDEN_PHOENIX' },
      { id: 'test-449999', action: 'TIKTOK_UNIVERSE' }
    ];

    testList.forEach(({ id, action }) => {
      const el = document.getElementById(id);
      if (el) {
        el.onclick = async () => {
          try {
            await fetch(`/api/mock/${action}`, { method: 'POST' });
          } catch (e) {}
        };
      }
    });
  }

  _startAfkWatchdog() {
    // Nếu quá 20 giây không có ai cmt/donate, tự động kích hoạt 1 nhịp niệm Phật nhẹ
    setInterval(() => {
      const now = Date.now();
      if (now - this.lastEventTime > 20000) {
        this.lastEventTime = now;
        window.dispatchEvent(
          new CustomEvent('TIKTOK_ACTION', {
            detail: {
              id: `afk_${now}`,
              timestamp: now,
              actionType: 'NIEM_PHAT',
              user: {
                uniqueId: 'tam_linh_online',
                nickname: 'Đạo Tràng Chùa An Lạc',
                avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop'
              },
              payload: {
                comment: 'Nam Mô A Di Đà Phật 🙏'
              }
            }
          })
        );
      }
    }, 20000);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init().catch(console.error);
});

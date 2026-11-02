/**
 * Frontend Main Entry Point (ES Module)
 * Cầu nối Socket.io -> Window Event Bus, tích hợp SceneManager, HudManager, SoundSynth,
 * Debug Panel (phím D) và cơ chế Anti-AFK Watchdog chống TikTok quét Live tĩnh.
 */

import { SceneManager } from './3d/SceneManager.js';
import { HudManager } from './ui/HudManager.js';
import { SoundSynth } from './audio/SoundSynth.js';

class App {
  constructor() {
    this.socket = null;
    this.sceneManager = null;
    this.hudManager = null;
    this.soundSynth = null;

    // Trạng thái cục bộ
    this.currentTheme = 'TEMPLE';
    this.isAudioMuted = false;
    this.isAutoMock = true;
    this.lastEventTime = Date.now();
    this.afkWatchdogTimer = null;

    // DOM Elements của Debug Panel
    this.debugPanelEl = null;
    this.debugStatusTextEl = null;
    this.inputTiktokUsernameEl = null;
    this.btnConnectTiktokEl = null;
    this.btnToggleMockEl = null;
    this.btnThemeTempleEl = null;
    this.btnThemeChurchEl = null;
    this.btnToggleAudioEl = null;
    this.btnFloatingEl = null;
    this.btnCloseDebugEl = null;
  }

  /**
   * Khởi động toàn bộ ứng dụng
   */
  async init() {
    console.log('[Main] Khởi tạo ứng dụng 3D TikTok Spiritual Stream...');

    // 1. Khởi tạo các Module hệ thống
    const webglContainer = document.getElementById('webgl-container');
    this.sceneManager = new SceneManager(webglContainer);
    this.sceneManager.init();

    this.hudManager = new HudManager();
    this.hudManager.init();

    this.soundSynth = new SoundSynth();
    this.soundSynth.init();

    // 2. Mở khóa Audio tự động khi có tương tác người dùng
    this._setupAudioAutoUnlock();

    // 3. Kết nối Socket.io tới Backend
    this._initSocket();

    // 4. Thiết lập bảng điều khiển Debug Panel
    this._initDebugPanel();

    // 5. Kích hoạt Anti-AFK Watchdog
    this._startAfkWatchdog();

    console.log('[Main] Ứng dụng đã sẵn sàng 100%!');
  }

  /**
   * Tự động mở khóa Web Audio Context ngay khi có tương tác
   */
  _setupAudioAutoUnlock() {
    const unlock = () => {
      if (this.soundSynth) {
        this.soundSynth.unlockAudio();
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
  }

  /**
   * Kết nối Socket.io và chuyển tiếp dữ liệu qua Window Event Bus
   */
  _initSocket() {
    if (typeof io === 'undefined') {
      console.warn('[Socket.io] Không tìm thấy thư viện Socket.io client.');
      return;
    }

    this.socket = io();

    // Nhận sự kiện tương tác từ phòng live
    this.socket.on('stream_event', (eventData) => {
      this.lastEventTime = Date.now(); // Reset bộ đếm AFK

      // Phát sự kiện toàn cục xuống các module theo đúng CONTRACT.md
      window.dispatchEvent(
        new CustomEvent('TIKTOK_ACTION', {
          detail: eventData
        })
      );
    });

    // Nhận cập nhật trạng thái phòng live
    this.socket.on('server_status', (status) => {
      this._updateServerStatusUI(status);
      window.dispatchEvent(
        new CustomEvent('SERVER_STATUS_UPDATE', {
          detail: status
        })
      );
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Đã kết nối tới Backend server.');
      if (this.debugStatusTextEl) {
        this.debugStatusTextEl.textContent = 'Server Online';
        this.debugStatusTextEl.className = 'status-online';
      }
    });

    this.socket.on('disconnect', () => {
      console.warn('[Socket] Mất kết nối tới Backend server.');
      if (this.debugStatusTextEl) {
        this.debugStatusTextEl.textContent = 'Mất kết nối';
        this.debugStatusTextEl.className = 'status-offline';
      }
    });
  }

  /**
   * Cập nhật trạng thái hiển thị trên Debug Panel
   */
  _updateServerStatusUI(status) {
    if (!status) return;

    if (this.debugStatusTextEl) {
      if (status.connected) {
        this.debugStatusTextEl.textContent = `Live: @${status.tiktokUsername}`;
        this.debugStatusTextEl.className = 'status-online';
      } else {
        this.debugStatusTextEl.textContent = status.autoMock ? 'Auto-Mock (Chờ Live)' : 'Chưa kết nối Live';
        this.debugStatusTextEl.className = status.autoMock ? 'status-online' : 'status-offline';
      }
    }

    if (this.btnToggleMockEl && typeof status.autoMock === 'boolean') {
      this.isAutoMock = status.autoMock;
      this.btnToggleMockEl.textContent = this.isAutoMock ? 'Auto-Mock: BẬT' : 'Auto-Mock: TẮT';
      if (this.isAutoMock) {
        this.btnToggleMockEl.classList.add('on');
      } else {
        this.btnToggleMockEl.classList.remove('on');
      }
    }
  }

  /**
   * Khởi tạo và gán sự kiện cho Debug Panel
   */
  _initDebugPanel() {
    this.debugPanelEl = document.getElementById('debug-panel');
    this.debugStatusTextEl = document.getElementById('debug-status-text');
    this.inputTiktokUsernameEl = document.getElementById('input-tiktok-username');
    this.btnConnectTiktokEl = document.getElementById('btn-connect-tiktok');
    this.btnToggleMockEl = document.getElementById('btn-toggle-mock');
    this.btnThemeTempleEl = document.getElementById('btn-theme-temple');
    this.btnThemeChurchEl = document.getElementById('btn-theme-church');
    this.btnToggleAudioEl = document.getElementById('btn-toggle-audio');
    this.btnFloatingEl = document.getElementById('debug-floating-btn');
    this.btnCloseDebugEl = document.getElementById('btn-close-debug');

    // 1. Phím tắt 'D' ẩn/hiện Debug Panel
    window.addEventListener('keydown', (e) => {
      if (e.key === 'd' || e.key === 'D') {
        // Tránh kích hoạt khi đang gõ vào input
        if (e.target && e.target.tagName === 'INPUT') return;
        this.toggleDebugPanel();
      }
    });

    if (this.btnFloatingEl) {
      this.btnFloatingEl.addEventListener('click', () => this.toggleDebugPanel());
    }

    if (this.btnCloseDebugEl) {
      this.btnCloseDebugEl.addEventListener('click', () => this.toggleDebugPanel(false));
    }

    // 2. Nút kết nối TikTok
    if (this.btnConnectTiktokEl && this.inputTiktokUsernameEl) {
      this.btnConnectTiktokEl.addEventListener('click', () => {
        const username = this.inputTiktokUsernameEl.value.trim();
        this._sendConfig({ tiktokUsername: username });
      });
    }

    // 3. Nút bật/tắt Auto-Mock
    if (this.btnToggleMockEl) {
      this.btnToggleMockEl.addEventListener('click', () => {
        const nextState = !this.isAutoMock;
        this._sendConfig({ autoMock: nextState });
      });
    }

    // 4. Chuyển đổi Theme (Chùa vs Nhà Thờ)
    if (this.btnThemeTempleEl && this.btnThemeChurchEl) {
      this.btnThemeTempleEl.addEventListener('click', () => this._switchTheme('TEMPLE'));
      this.btnThemeChurchEl.addEventListener('click', () => this._switchTheme('CHURCH'));
    }

    // 5. Bật/tắt Âm thanh
    if (this.btnToggleAudioEl) {
      this.btnToggleAudioEl.addEventListener('click', () => {
        this.isAudioMuted = !this.isAudioMuted;
        window.dispatchEvent(new CustomEvent('AUDIO_TOGGLE', { detail: { muted: this.isAudioMuted } }));
        if (this.isAudioMuted) {
          this.btnToggleAudioEl.textContent = '🔇 Đã Tắt';
          this.btnToggleAudioEl.classList.add('muted');
        } else {
          this.btnToggleAudioEl.textContent = '🔊 Đang Bật';
          this.btnToggleAudioEl.classList.remove('muted');
          if (this.soundSynth) this.soundSynth.unlockAudio();
        }
      });
    }

    // 6. 5 Nút Test nhanh sự kiện
    const testButtons = [
      { id: 'btn-test-fish', action: 'WOODEN_FISH' },
      { id: 'btn-test-incense', action: 'INCENSE' },
      { id: 'btn-test-bell', action: 'BELL' },
      { id: 'btn-test-lantern', action: 'LANTERN' },
      { id: 'btn-test-prayer', action: 'PRAYER_TEXT' }
    ];

    testButtons.forEach(({ id, action }) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => {
          this._triggerMockEvent(action);
        });
      }
    });
  }

  toggleDebugPanel(forceState = null) {
    if (!this.debugPanelEl) return;
    if (typeof forceState === 'boolean') {
      if (forceState) this.debugPanelEl.classList.remove('hidden');
      else this.debugPanelEl.classList.add('hidden');
    } else {
      this.debugPanelEl.classList.toggle('hidden');
    }
  }

  _switchTheme(theme) {
    if (this.currentTheme === theme) return;
    this.currentTheme = theme;

    if (this.btnThemeTempleEl && this.btnThemeChurchEl) {
      if (theme === 'TEMPLE') {
        this.btnThemeTempleEl.classList.add('active');
        this.btnThemeChurchEl.classList.remove('active');
      } else {
        this.btnThemeChurchEl.classList.add('active');
        this.btnThemeTempleEl.classList.remove('active');
      }
    }

    window.dispatchEvent(new CustomEvent('THEME_CHANGE', { detail: { theme } }));
  }

  async _sendConfig(config) {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      console.log('[API Config Response]', data);
    } catch (err) {
      console.error('[API Config Error]', err);
    }
  }

  async _triggerMockEvent(actionType) {
    try {
      await fetch(`/api/mock/${actionType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.error('[API Mock Error]', err);
    }
  }

  /**
   * Cơ chế chống TikTok quét treo máy (Anti-AFK Watchdog)
   * Kiểm tra mỗi 15 giây: Nếu không có sự kiện nào từ server, tự động kích hoạt
   * 1 sự kiện môi trường nhẹ (chuông gió + câu chúc bình an bay lên)
   */
  _startAfkWatchdog() {
    const afkBlessings = [
      'Nguyện cầu vạn dặm bình an, thân tâm an lạc',
      'Phước đức vô lượng, vạn sự hanh thông',
      'Tâm an vạn sự an, bình an muôn lối',
      'Ơn trên che chở muôn nhà yên vui thuận hòa'
    ];

    this.afkWatchdogTimer = setInterval(() => {
      const now = Date.now();
      if (now - this.lastEventTime > 15000) {
        this.lastEventTime = now;
        const blessing = afkBlessings[Math.floor(Math.random() * afkBlessings.length)];

        // Kích hoạt sự kiện môi trường
        window.dispatchEvent(
          new CustomEvent('TIKTOK_ACTION', {
            detail: {
              id: `afk_${now}`,
              timestamp: now,
              actionType: 'PRAYER_TEXT',
              user: {
                uniqueId: 'tam_linh_online',
                nickname: 'Lan Tỏa Phước Lành',
                avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop'
              },
              payload: {
                comment: blessing,
                intensity: 1
              }
            }
          })
        );
      }
    }, 15000);
  }
}

// Khởi chạy khi tài liệu HTML đã sẵn sàng
window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init().catch((err) => {
    console.error('[App Init Error]', err);
  });
});


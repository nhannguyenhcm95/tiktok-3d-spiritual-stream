/**
 * Main Entry Point — Lên Chùa Cầu An
 * Ghép nối Three.js SceneManager, Web Audio SoundSynth, HudManager,
 * Điều khiển bàn phím/cần ảo, Tương tác Live TikTok và Debug Panel.
 */

import { SceneManager } from './3d/SceneManager.js';
import { SoundSynth } from './audio/SoundSynth.js';
import { HudManager } from './ui/HudManager.js';

class App {
  constructor() {
    this.sound = new SoundSynth();
    this.sceneManager = null;
    this.hudManager = null;
    this.socket = null;

    // Trạng thái điều khiển di chuyển
    this.keys = { forward: 0, right: 0 };
    this.joyVector = { x: 0, y: 0 };
    this.joyPointerId = null;
    this.lookPointerId = null;
    this.lastLookX = 0;
    this.lastLookY = 0;

    // 5 Trạm hoạt động tâm linh trong chùa
    this.STATIONS = [
      { id: 'incense', name: '🙏 Thắp hương cầu an', x: 0, z: 7.4, radius: 3.6 },
      { id: 'bell', name: '🔔 Thỉnh Đại Hồng Chung', x: -10.2, z: 1.5, radius: 3.8 },
      { id: 'woodenfish', name: '📿 Gõ mõ tụng kinh', x: 3.6, z: -7.2, radius: 3.8 },
      { id: 'prayer', name: '🏮 Viết lời cầu an (Bồ Đề / Hồ Sen)', x: 10.5, z: 5.5, radius: 6.5 },
      { id: 'fortune', name: '🎋 Xin quẻ đầu năm', x: -10.5, z: 12, radius: 3.8 }
    ];
    this.currentStation = null;
  }

  async init() {
    const webglContainer = document.getElementById('webgl-container');
    this.sceneManager = new SceneManager(webglContainer);
    this.sceneManager.init();

    this.sound.init();

    this.hudManager = new HudManager(this.sound, this.sceneManager);
    this.hudManager.init();

    this._setupControls();
    this._setupUIButtons();
    this._initSocket();
    this._setupDebugPanel();

    // Vòng lặp cập nhật vị trí người chơi & trạm hoạt động
    this._startGameLoop();

    console.log('[App] Lên Chùa Cầu An đã sẵn sàng!');
  }

  _setupControls() {
    // 1. Phím WASD / Mũi tên
    window.addEventListener('keydown', (e) => {
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') this.keys.forward = 1;
      if (k === 's' || e.key === 'ArrowDown') this.keys.forward = -1;
      if (k === 'a' || e.key === 'ArrowLeft') this.keys.right = -1;
      if (k === 'd' || e.key === 'ArrowRight') this.keys.right = 1;
      this.sound.unlockAudio();
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp' || k === 's' || e.key === 'ArrowDown') this.keys.forward = 0;
      if (k === 'a' || e.key === 'ArrowLeft' || k === 'd' || e.key === 'ArrowRight') this.keys.right = 0;
    });

    // 2. Cần điều khiển ảo (Virtual Joystick)
    const joyZone = document.getElementById('joystick-zone');
    const joyKnob = document.getElementById('joystick-knob');

    joyZone.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.joyPointerId = e.pointerId;
      joyZone.setPointerCapture(e.pointerId);
      this._updateJoystick(e, joyZone, joyKnob);
      this.sound.unlockAudio();
    });

    joyZone.addEventListener('pointermove', (e) => {
      if (e.pointerId === this.joyPointerId) {
        this._updateJoystick(e, joyZone, joyKnob);
      }
    });

    const resetJoy = (e) => {
      if (e.pointerId === this.joyPointerId) {
        this.joyPointerId = null;
        this.joyVector.x = 0;
        this.joyVector.y = 0;
        joyKnob.style.transform = 'translate(0px, 0px)';
      }
    };
    joyZone.addEventListener('pointerup', resetJoy);
    joyZone.addEventListener('pointercancel', resetJoy);

    // 3. Kéo màn hình để xoay góc nhìn Camera
    const domEl = this.sceneManager.renderer.domElement;
    domEl.addEventListener('pointerdown', (e) => {
      this.lookPointerId = e.pointerId;
      this.lastLookX = e.clientX;
      this.lastLookY = e.clientY;
      this.sound.unlockAudio();
    });

    window.addEventListener('pointermove', (e) => {
      if (e.pointerId === this.lookPointerId) {
        const dx = e.clientX - this.lastLookX;
        const dy = e.clientY - this.lastLookY;
        this.lastLookX = e.clientX;
        this.lastLookY = e.clientY;

        this.sceneManager.cameraYaw -= dx * 0.0065;
        this.sceneManager.cameraPitch = Math.max(0.15, Math.min(0.85, this.sceneManager.cameraPitch + dy * 0.0045));
      }
    });

    window.addEventListener('pointerup', (e) => {
      if (e.pointerId === this.lookPointerId) this.lookPointerId = null;
    });
  }

  _updateJoystick(e, joyZone, joyKnob) {
    const rect = joyZone.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const maxR = 40;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    this.joyVector.x = dx / maxR;
    this.joyVector.y = -dy / maxR;
  }

  _setupUIButtons() {
    // Nút Vào chùa
    const nameInput = document.getElementById('player-name-input');
    if (this.hudManager.userState.playerName && this.hudManager.userState.playerName !== "Khách Hành Hương") {
      nameInput.value = this.hudManager.userState.playerName;
    }

    document.getElementById('btn-enter-temple').onclick = () => {
      const val = this.hudManager.filterProfanity(nameInput.value.trim());
      if (val) {
        this.hudManager.userState.playerName = val;
        this.hudManager.saveData();
      }
      this.sound.unlockAudio();
      document.getElementById('welcome-screen').style.display = 'none';

      if (!this.hudManager.userState.tutorialSeen) {
        document.getElementById('tutorial-modal').style.display = 'flex';
      } else {
        this.hudManager.showToast(`Chào mừng ${this.hudManager.userState.playerName} đến Chùa An Lạc!`);
      }
    };

    document.getElementById('btn-close-tutorial').onclick = () => {
      this.hudManager.userState.tutorialSeen = true;
      this.hudManager.saveData();
      document.getElementById('tutorial-modal').style.display = 'none';
      this.hudManager.showToast(`Chúc ${this.hudManager.userState.playerName} có những phút giây tịnh tâm thanh thản.`);
    };

    document.getElementById('btn-notebook').onclick = () => {
      this.sound.unlockAudio();
      this.hudManager.openNotebookModal();
    };

    document.getElementById('btn-share-top').onclick = () => {
      this.sound.unlockAudio();
      this.hudManager.openShareModal();
    };

    document.getElementById('btn-audio').onclick = (e) => {
      this.sound.unlockAudio();
      const isMuted = this.sound.toggleMute();
      e.currentTarget.textContent = isMuted ? '🔇 Đã tắt tiếng' : '🔊 Âm thanh';
    };

    // Nút Hành Động khi đứng gần các trạm
    const actionBtn = document.getElementById('action-btn');
    actionBtn.onclick = () => {
      if (!this.currentStation) return;
      this.sound.unlockAudio();

      switch (this.currentStation.id) {
        case 'incense':
          this.hudManager.openIncenseActivity();
          break;
        case 'bell':
          this.hudManager.openBellActivity();
          break;
        case 'woodenfish':
          this.hudManager.openWoodenFishActivity();
          break;
        case 'prayer':
          this.hudManager.openPrayerActivity();
          break;
        case 'fortune':
          this.hudManager.openFortuneActivity();
          break;
      }
    };
  }

  _canMoveTo(nx, nz) {
    if (nx < -21 || nx > 21 || nz < -16 || nz > 31) return false;
    for (const ob of this.sceneManager.obstacles) {
      if (Math.hypot(nx - ob.x, nz - ob.z) < ob.r + 0.5) return false;
    }
    return true;
  }

  _startGameLoop() {
    let lastTime = performance.now();
    const actionBtn = document.getElementById('action-btn');

    const update = (now) => {
      requestAnimationFrame(update);
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // 1. Cập nhật di chuyển người chơi
      if (this.sceneManager && this.sceneManager.playerData) {
        const player = this.sceneManager.playerData.player;
        const playerBody = this.sceneManager.playerData.body;
        const isModalOpen = document.getElementById('activity-modal').style.display === 'flex' ||
                            document.getElementById('welcome-screen').style.display !== 'none';

        const moveF = this.keys.forward + this.joyVector.y;
        const moveR = this.keys.right + this.joyVector.x;

        if ((Math.abs(moveF) > 0.05 || Math.abs(moveR) > 0.05) && !this.sceneManager.isBowing && !isModalOpen) {
          const speed = 5.4 * dt;
          const moveAngle = Math.atan2(moveR, moveF) + this.sceneManager.cameraYaw;
          const vx = -Math.sin(moveAngle) * speed * Math.min(1, Math.hypot(moveF, moveR));
          const vz = -Math.cos(moveAngle) * speed * Math.min(1, Math.hypot(moveF, moveR));

          if (this._canMoveTo(player.position.x + vx, player.position.z)) player.position.x += vx;
          if (this._canMoveTo(player.position.x, player.position.z + vz)) player.position.z += vz;

          player.rotation.y = moveAngle + Math.PI;
          playerBody.position.y = 0.55 + Math.abs(Math.sin(now * 0.01)) * 0.06;
        }

        // 2. Kiểm tra khoảng cách tới 5 trạm hoạt động
        let nearest = null;
        let minDist = Infinity;
        for (const st of this.STATIONS) {
          const d = Math.hypot(player.position.x - st.x, player.position.z - st.z);
          if (d < st.radius && d < minDist) {
            minDist = d;
            nearest = st;
          }
        }

        if (nearest !== this.currentStation) {
          this.currentStation = nearest;
          if (this.currentStation) {
            actionBtn.textContent = this.currentStation.name;
            actionBtn.style.display = 'block';
          } else {
            actionBtn.style.display = 'none';
          }
        }
      }
    };
    requestAnimationFrame(update);
  }

  _initSocket() {
    if (typeof io === 'undefined') return;
    this.socket = io();

    this.socket.on('stream_event', (eventData) => {
      window.dispatchEvent(new CustomEvent('TIKTOK_ACTION', { detail: eventData }));
    });

    this.socket.on('server_status', (status) => {
      const statusEl = document.getElementById('debug-status-text');
      if (statusEl) {
        statusEl.textContent = status.connected ? `Live: @${status.tiktokUsername}` : (status.autoMock ? 'Auto-Mock (Chờ Live)' : 'Offline');
      }
    });
  }

  _setupDebugPanel() {
    const debugPanel = document.getElementById('debug-panel');
    const toggleDebug = () => debugPanel.classList.toggle('hidden');

    window.addEventListener('keydown', (e) => {
      if (e.key === 'd' || e.key === 'D') {
        if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
        toggleDebug();
      }
    });

    document.getElementById('debug-floating-btn').onclick = toggleDebug;
    document.getElementById('btn-close-debug').onclick = () => debugPanel.classList.add('hidden');

    // Nút kết nối TikTok
    document.getElementById('btn-connect-tiktok').onclick = async () => {
      const u = document.getElementById('input-tiktok-username').value.trim();
      try {
        await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tiktokUsername: u })
        });
      } catch (e) {}
    };

    // Nút bật/tắt Auto-Mock
    let isMock = true;
    const btnMock = document.getElementById('btn-toggle-mock');
    btnMock.onclick = async () => {
      isMock = !isMock;
      btnMock.textContent = isMock ? 'Auto-Mock: BẬT' : 'Auto-Mock: TẮT';
      try {
        await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ autoMock: isMock })
        });
      } catch (e) {}
    };

    // Bảng nút test donate theo bảng giá TikTok
    const testList = [
      { id: 'test-bow', action: 'BOW' },
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
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init().catch(console.error);
});

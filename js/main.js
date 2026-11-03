/**
 * main.js - Nhạc trưởng điều khiển toàn bộ Web Game 3D
 * "Niệm Phật Cầu An & Đạo Tràng Siêu Độ - Chùa An Lạc 3D"
 */

import * as THREE from 'three';
import { TempleWorld } from './world/TempleWorld.js';
import { EnvironmentVfx } from './world/EnvironmentVfx.js';
import { CollisionSystem } from './world/CollisionSystem.js';
import { PlayerController } from './entities/PlayerController.js';
import { AiPilgrimsManager } from './entities/AiPilgrimsManager.js';
import { HandSealSystem } from './activities/HandSealSystem.js';
import { SieuDoRitual } from './activities/SieuDoRitual.js';
import { TempleActivities } from './activities/TempleActivities.js';
import { WebAudioSynth } from './utils/WebAudioSynth.js';
import { ShareCardExporter } from './utils/ShareCardExporter.js';

class GameApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();

    // Biến trạng thái
    this.playerName = localStorage.getItem('np_devotee_name') || 'Diệu Tâm';
    this.currentZone = null;
    this.isAudioMuted = false;
    this.isGameStarted = false;

    // Khởi tạo thành phần
    this.initThree();
    this.initSystems();
    this.initUIBindings();
    this.initJoystick();
    this.initSocketIO();

    // Bắt đầu vòng lặp game
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    // Xử lý co giãn màn hình
    window.addEventListener('resize', () => this.onWindowResize());
  }

  initThree() {
    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      350
    );
    this.camera.position.set(0, 5, 12);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
  }

  initSystems() {
    // 1. Hệ thống Va Chạm
    this.collisionSystem = new CollisionSystem();

    // 2. Thế giới Chùa Việt 3D
    this.templeWorld = new TempleWorld(this.scene);
    // Nạp toàn bộ collider vào hệ thống va chạm
    const colliders = this.templeWorld.getColliders();
    this.collisionSystem.addColliders(colliders);

    // 3. Hiệu ứng Môi trường VFX
    this.vfxManager = new EnvironmentVfx(this.scene, this.camera);

    // 4. Nhân vật Người chơi (Hỗ trợ GLTFLoader fallback Procedural Rig)
    this.playerController = new PlayerController(this.scene, this.camera, this.collisionSystem, {
      vfxManager: this.vfxManager,
      devoteeName: this.playerName
    });

    // 5. Khách hành hương AI (45 người bằng InstancedMesh)
    this.aiPilgrims = new AiPilgrimsManager(this.scene, { count: 45 });

    // 6. Tổng hợp Âm Thanh Thuần Web Audio API
    this.audioSynth = new WebAudioSynth();

    // 7. Xuất Thiệp Dọc 1080x1350
    this.shareExporter = new ShareCardExporter();

    // 8. Hệ thống Kết Ấn Thủ Ấn Canvas
    const sealCanvas = document.getElementById('handseal-canvas');
    this.handSealSystem = new HandSealSystem(sealCanvas, {
      audioSynth: this.audioSynth,
      playerController: this.playerController,
      vfxManager: this.vfxManager,
      onComplete: (seal) => {
        this.showToast(`✨ Kết Ấn Thành Tựu: ${seal.name}! Đã hồi hướng công đức.`);
        setTimeout(() => {
          this.closeModal('modal-handseal');
          this.handSealSystem.close();
        }, 1800);
      }
    });

    // 9. Nghi thức Niệm Phật & Siêu Độ
    this.sieuDoRitual = new SieuDoRitual({
      audioSynth: this.audioSynth,
      playerController: this.playerController,
      vfxManager: this.vfxManager,
      templeWorld: this.templeWorld,
      onChantUpdate: (data) => {
        this.updateHUDStats(data.totalChants, data.totalMerit);
      }
    });

    // 10. 5 Hoạt động Tâm Linh Cầu An
    this.templeActivities = new TempleActivities({
      audioSynth: this.audioSynth,
      playerController: this.playerController,
      vfxManager: this.vfxManager,
      templeWorld: this.templeWorld,
      onStateChange: (state) => {
        if (state.totalMerit) {
          const chant = parseInt(localStorage.getItem('np_chant_count') || '0', 10);
          this.updateHUDStats(chant, state.totalMerit);
        }
      }
    });

    // Cập nhật chỉ số hiển thị ban đầu
    const initialChant = parseInt(localStorage.getItem('np_chant_count') || '0', 10);
    const initialMerit = parseInt(localStorage.getItem('np_merit_points') || '0', 10);
    this.updateHUDStats(initialChant, initialMerit);
    document.getElementById('hud-player-name').innerText = this.playerName;
  }

  initUIBindings() {
    // 1. Modal Welcome & Bắt đầu
    const btnStart = document.getElementById('btn-start-game');
    const inputName = document.getElementById('input-welcome-name');
    const robeItems = document.querySelectorAll('.radio-pill-item[data-robe]');

    robeItems.forEach(item => {
      item.addEventListener('click', () => {
        robeItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });

    btnStart.addEventListener('click', () => {
      const name = inputName.value.trim() || 'Diệu Tâm';
      this.playerName = name;
      localStorage.setItem('np_devotee_name', name);
      document.getElementById('hud-player-name').innerText = name;

      // Cập nhật tên trên đầu nhân vật 3D
      if (this.playerController) {
        this.playerController.setDevoteeName(name);
      }

      // Khởi động Web Audio API
      this.audioSynth.init();
      this.audioSynth.startAmbient();

      this.closeModal('modal-welcome');
      this.isGameStarted = true;
      this.showToast(`Chào mừng ${name} đến với Chùa An Lạc 🙏`);
    });

    // 2. Nút Niệm Phật góc phải dưới
    const btnChant = document.getElementById('btn-chant-once');
    btnChant.addEventListener('click', () => {
      this.sieuDoRitual.chantOnce();
    });

    // 3. Nút Kết Ấn
    const btnOpenSeal = document.getElementById('btn-open-seal');
    btnOpenSeal.addEventListener('click', () => {
      this.openModal('modal-handseal');
      this.handSealSystem.open(0);
    });

    document.getElementById('btn-close-handseal').addEventListener('click', () => {
      this.closeModal('modal-handseal');
      this.handSealSystem.close();
    });

    // Các tab chọn loại Thủ Ấn
    const sealTabs = document.querySelectorAll('#seal-tabs .tab-btn');
    sealTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        sealTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const idx = parseInt(tab.dataset.seal, 10);
        this.handSealSystem.setSealIndex(idx);
        const seal = this.handSealSystem.seals[idx];
        document.getElementById('seal-display-name').innerText = seal.name;
        document.getElementById('seal-display-meaning').innerText = seal.meaning;
      });
    });

    // 4. Nút Hành Động [🙏]
    const btnInteract = document.getElementById('btn-interact');
    btnInteract.addEventListener('click', () => {
      if (this.currentZone) {
        this.handleZoneInteraction(this.currentZone);
      }
    });

    // 5. Âm thanh Bật/Tắt
    const btnAudio = document.getElementById('btn-audio-toggle');
    const audioIcon = document.getElementById('audio-icon');
    btnAudio.addEventListener('click', () => {
      this.isAudioMuted = !this.isAudioMuted;
      this.audioSynth.setMuted(this.isAudioMuted);
      audioIcon.innerText = this.isAudioMuted ? '🔇' : '🔊';
      this.showToast(this.isAudioMuted ? 'Đã tắt tiếng' : 'Đã mở tiếng thiền');
    });

    // 6. Sổ Công Đức
    document.getElementById('btn-open-merit').addEventListener('click', () => {
      this.populateMeritScroll();
      this.openModal('modal-merit');
    });
    document.getElementById('btn-close-merit').addEventListener('click', () => {
      this.closeModal('modal-merit');
    });

    // Xuất Thiệp Dọc 1080x1350
    const exportHandler = () => {
      this.shareExporter.exportCard({
        devoteeName: this.playerName,
        chantCount: parseInt(localStorage.getItem('np_chant_count') || '0', 10),
        meritPoints: parseInt(localStorage.getItem('np_merit_points') || '0', 10),
        tamAnScore: parseInt(localStorage.getItem('np_tam_an_score') || '0', 10)
      });
      this.showToast('🧧 Đã xuất thiệp chúc bình an!');
    };
    document.getElementById('btn-open-share').addEventListener('click', exportHandler);
    document.getElementById('btn-export-share-card').addEventListener('click', exportHandler);

    // 7. Modal Thắp Hương
    document.getElementById('btn-close-incense').addEventListener('click', () => this.closeModal('modal-incense'));
    const incensePills = document.querySelectorAll('#modal-incense .radio-pill-item');
    let selectedSticks = 3;
    incensePills.forEach(p => {
      p.addEventListener('click', () => {
        incensePills.forEach(i => i.classList.remove('active'));
        p.classList.add('active');
        selectedSticks = parseInt(p.dataset.sticks, 10);
      });
    });
    document.getElementById('btn-confirm-incense').addEventListener('click', () => {
      const res = this.templeActivities.lightIncense(selectedSticks, this.playerName);
      this.showToast(`🔥 ${res.message}`);
      this.closeModal('modal-incense');
    });

    // 8. Modal Thỉnh Chuông
    document.getElementById('btn-close-bell').addEventListener('click', () => {
      this.closeModal('modal-bell');
      this.templeActivities.stopBellMiniGame();
    });
    document.getElementById('btn-strike-bell').addEventListener('click', () => {
      const res = this.templeActivities.strikeBell();
      if (res) {
        document.getElementById('bell-rating-result').innerText = `${res.rating} (+${res.meritBonus} Công Đức)`;
        this.showToast(`🔔 Thỉnh chuông: ${res.rating}`);
      }
    });

    // 9. Modal Gõ Mõ 30s
    document.getElementById('btn-close-woodenfish').addEventListener('click', () => {
      this.closeModal('modal-woodenfish');
      this.templeActivities.finishWoodenFishSession();
    });
    document.getElementById('mo-tap-btn').addEventListener('click', () => {
      const res = this.templeActivities.tapWoodenFish();
      document.getElementById('mo-rating-text').innerText = res.rating;
      document.getElementById('mo-score-display').innerText = res.score;
    });

    // 10. Modal Viết Lời Cầu An
    document.getElementById('btn-close-prayer').addEventListener('click', () => this.closeModal('modal-prayer'));
    const prayerPills = document.querySelectorAll('#modal-prayer .radio-pill-item');
    let prayerType = 'BODE';
    prayerPills.forEach(p => {
      p.addEventListener('click', () => {
        prayerPills.forEach(i => i.classList.remove('active'));
        p.classList.add('active');
        prayerType = p.dataset.ptype;
      });
    });
    document.getElementById('btn-submit-prayer').addEventListener('click', () => {
      const sender = document.getElementById('prayer-sender').value.trim() || this.playerName;
      const content = document.getElementById('prayer-content').value.trim();
      if (!content) {
        this.showToast('Vui lòng ghi lời ước nguyện cầu an!');
        return;
      }
      this.templeActivities.submitPrayer({
        sender: sender,
        content: content,
        type: prayerType
      });
      this.showToast(prayerType === 'HOSEN' ? '🪷 Đã thả hoa đăng cầu an xuống hồ sen!' : '🌳 Đã treo dải lụa đỏ lên Cây Bồ Đề!');
      document.getElementById('prayer-content').value = '';
      this.closeModal('modal-prayer');
    });

    // 11. Modal Xin Quẻ Đầu Năm
    document.getElementById('btn-close-fortune').addEventListener('click', () => this.closeModal('modal-fortune'));
    const fortuneTube = document.getElementById('fortune-tube');
    const btnDrawFortune = document.getElementById('btn-draw-fortune');
    const fortuneCard = document.getElementById('fortune-result-card');

    const handleDrawFortune = () => {
      fortuneTube.classList.add('shaking');
      setTimeout(() => {
        fortuneTube.classList.remove('shaking');
        const q = this.templeActivities.drawFortuneStick();
        document.getElementById('fortune-title').innerText = q.title;
        document.getElementById('fortune-poem').innerText = q.poem;
        document.getElementById('fortune-meaning').innerText = q.meaning;
        fortuneCard.style.display = 'flex';
        this.showToast(`🎋 Bạn đã xin được: ${q.title}`);
      }, 900);
    };
    fortuneTube.addEventListener('click', handleDrawFortune);
    btnDrawFortune.addEventListener('click', handleDrawFortune);
  }

  initJoystick() {
    const zone = document.getElementById('joystick-zone');
    const thumb = document.getElementById('joystick-thumb');
    let touchId = null;
    let startX = 0;
    let startY = 0;
    const maxRadius = 45;

    const handleStart = (clientX, clientY, identifier) => {
      touchId = identifier;
      const rect = zone.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
      updateJoystick(clientX, clientY);
    };

    const updateJoystick = (clientX, clientY) => {
      let dx = clientX - startX;
      let dy = clientY - startY;
      const dist = Math.hypot(dx, dy);

      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }

      thumb.style.transform = `translate(${dx}px, ${dy}px)`;
      // Gửi input chuẩn hóa [-1, 1] đến PlayerController
      const normX = dx / maxRadius;
      const normY = dy / maxRadius;
      if (this.playerController) {
        this.playerController.setJoystickInput(normX, normY);
      }
    };

    const handleEnd = () => {
      touchId = null;
      thumb.style.transform = 'translate(0px, 0px)';
      if (this.playerController) {
        this.playerController.setJoystickInput(0, 0);
      }
    };

    zone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (touchId === null && e.changedTouches.length > 0) {
        const t = e.changedTouches[0];
        handleStart(t.clientX, t.clientY, t.identifier);
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (touchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === touchId) {
          updateJoystick(t.clientX, t.clientY);
          break;
        }
      }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
      if (touchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          handleEnd();
          break;
        }
      }
    });

    // Chuột trên PC giả lập Joystick
    let isMouseDown = false;
    zone.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      const rect = zone.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
      updateJoystick(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      if (isMouseDown) {
        updateJoystick(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mouseup', () => {
      if (isMouseDown) {
        isMouseDown = false;
        handleEnd();
      }
    });
  }

  initSocketIO() {
    if (typeof io !== 'undefined') {
      try {
        const socket = io();
        socket.on('connect', () => {
          console.log('✅ Đã kết nối tương tác TikTok Live Interactive qua WebSocket');
        });

        // 1. Quà tặng TikTok (Gift Event)
        socket.on('tiktok:gift', (giftData) => {
          console.log('🎁 Nhận quà tặng TikTok:', giftData);
          if (this.sieuDoRitual) {
            this.sieuDoRitual.processGiftEvent(giftData);
          }
        });

        // 2. Bình luận TikTok (Comment Event)
        socket.on('tiktok:chat', (chatData) => {
          const text = (chatData.comment || '').toLowerCase();
          if (text.includes('a di đà phật') || text.includes('di da phat') || text.includes('lạy phật') || text.includes('cầu an')) {
            if (this.sieuDoRitual) {
              this.sieuDoRitual.chantOnce(`${chatData.user}: ${chatData.comment}`);
            }
          }
        });

        // 3. Lượt Thả Tim TikTok (Like Event)
        socket.on('tiktok:like', (likeData) => {
          if (this.vfxManager && this.playerController) {
            const p = this.playerController.getPosition();
            this.vfxManager.spawnLotusStep(p.x + (Math.random() - 0.5) * 4, p.z + (Math.random() - 0.5) * 4);
          }
        });

        // 4. Sự kiện tổng hợp Stream Event (từ EventQueue của backend)
        socket.on('stream_event', (event) => {
          if (!event) return;
          const user = event.user?.nickname || 'Phật Tử';
          const p = event.payload || {};

          if (p.diamondCount > 0 || p.giftName || event.actionType.startsWith('INCENSE') || event.actionType.startsWith('GOLDEN') || ['BELL', 'CONFETTI', 'LANTERN', 'OFFERING_FRUIT', 'PARADE_FLOAT', 'BUDDHA_LIGHT', 'THOUSAND_LANTERNS', 'TIKTOK_UNIVERSE'].includes(event.actionType)) {
            if (this.sieuDoRitual) {
              this.sieuDoRitual.processGiftEvent({
                user: user,
                giftName: p.giftName || event.actionType,
                diamondCount: p.diamondCount || p.totalCoins || 10,
                repeatCount: p.repeatCount || 1
              });
            }
          } else if (p.comment || event.actionType === 'NIEM_PHAT' || event.actionType === 'BOW') {
            if (this.sieuDoRitual) {
              this.sieuDoRitual.chantOnce(`${user}: ${p.comment || 'Nam Mô A Di Đà Phật 🙏'}`);
            }
          }
        });
      } catch (err) {
        console.log('Chạy chế độ Offline (không kết nối socket):', err);
      }
    }
  }

  checkInteractionZones() {
    if (!this.playerController || !this.templeWorld) return;
    const pPos = this.playerController.getPosition();
    const zones = this.templeWorld.interactionZones;

    let matchedZone = null;
    let minDist = 9999;

    for (const zone of zones) {
      const dist = Math.hypot(pPos.x - zone.position.x, pPos.z - zone.position.z);
      if (dist <= zone.radius) {
        if (dist < minDist) {
          minDist = dist;
          matchedZone = zone;
        }
      }
    }

    const btnInteract = document.getElementById('btn-interact');
    const prompt = document.getElementById('interaction-prompt');
    const interactText = document.getElementById('interact-text');
    const interactIcon = document.getElementById('interact-icon');

    if (matchedZone) {
      this.currentZone = matchedZone;
      btnInteract.classList.add('active');
      btnInteract.removeAttribute('disabled');
      interactText.innerText = matchedZone.label;
      interactIcon.innerText = matchedZone.icon;

      prompt.innerText = `Đến gần [${matchedZone.name}] - Nhấn [${matchedZone.label}]`;
      prompt.classList.add('show');
    } else {
      this.currentZone = null;
      btnInteract.classList.remove('active');
      btnInteract.setAttribute('disabled', 'true');
      interactText.innerText = 'Hành Động';
      interactIcon.innerText = '🙏';
      prompt.classList.remove('show');
    }
  }

  handleZoneInteraction(zone) {
    switch (zone.id) {
      case 'LU_HUONG':
        this.openModal('modal-incense');
        break;
      case 'GAC_CHUONG':
        this.openModal('modal-bell');
        this.templeActivities.startBellMiniGame(document.getElementById('bell-hit-ring'));
        break;
      case 'CHINH_DIEN':
        this.openModal('modal-woodenfish');
        this.templeActivities.startWoodenFishSession(
          (timeLeft, score) => {
            document.getElementById('mo-time-display').innerText = `${timeLeft}s`;
            document.getElementById('mo-score-display').innerText = score;
          },
          (result) => {
            document.getElementById('mo-rating-text').innerText = `Hoàn thành! ${result.evaluation}`;
            this.showToast(`Hoàn tất 30s Gõ Mõ: Tâm An đạt ${result.score}/100!`);
          }
        );
        break;
      case 'DAN_TRANG':
        // Nghi thức Siêu Độ Đàn Tràng
        this.sieuDoRitual.performSieuDoRitual();
        this.showToast('🌟 Đã khởi phát nghi thức Siêu Độ tại Đàn Tràng Linh Quang!');
        break;
      case 'CAY_BO_DE':
      case 'HO_SEN':
        this.openModal('modal-prayer');
        break;
      case 'BAN_QUE':
        this.openModal('modal-fortune');
        break;
      default:
        break;
    }
  }

  populateMeritScroll() {
    const chant = localStorage.getItem('np_chant_count') || '0';
    const incense = localStorage.getItem('np_incense_count') || '0';
    const tamAn = localStorage.getItem('np_tam_an_score') || '0';
    const purified = localStorage.getItem('np_purified_count') || '0';

    document.getElementById('scroll-devotee-name').innerText = this.playerName;
    document.getElementById('scroll-chant-count').innerText = `${chant} biến`;
    document.getElementById('scroll-incense-count').innerText = `${incense} nén`;
    document.getElementById('scroll-taman-score').innerText = `${tamAn}/100`;
    document.getElementById('scroll-purified-count').innerText = `${purified} vị`;
  }

  updateHUDStats(chants, merit) {
    document.getElementById('stat-chant-count').innerText = chants;
    document.getElementById('stat-merit-points').innerText = merit;
  }

  openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('open');
  }

  closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('open');
  }

  showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.innerText = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if (this.handSealSystem && this.handSealSystem.isOpen) {
      this.handSealSystem.resizeCanvas();
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // 1. Cập nhật Player & Camera
    if (this.playerController) {
      this.playerController.update(delta);
    }

    // 2. Cập nhật Hiệu ứng VFX Môi trường
    if (this.vfxManager) {
      const pPos = this.playerController ? this.playerController.getPosition() : { x: 0, y: 0, z: 0 };
      this.vfxManager.update(delta, pPos);
    }

    // 3. Cập nhật Thế giới Chùa 3D (Hào quang, hoa sen trôi)
    if (this.templeWorld) {
      this.templeWorld.update(delta);
    }

    // 4. Cập nhật 45 khách hành hương AI
    if (this.aiPilgrims) {
      const pPos = this.playerController ? this.playerController.getPosition() : { x: 0, y: 0, z: 0 };
      this.aiPilgrims.update(delta, pPos);
    }

    // 5. Kiểm tra vùng tương tác Proximity
    this.checkInteractionZones();

    // 6. Render
    this.renderer.render(this.scene, this.camera);
  }
}

// Khởi chạy Game khi DOM sẵn sàng
window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new GameApp();
});

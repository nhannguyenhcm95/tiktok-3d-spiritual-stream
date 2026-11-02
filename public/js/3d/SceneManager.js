/**
 * Scene Manager (Three.js / GSAP)
 * Quản lý khởi tạo WebGL Renderer, Scene, Camera tỷ lệ dọc 9:16,
 * Camera Sway chống quét AFK, chuyển đổi Theme (Chùa vs Nhà thờ),
 * và điều phối các tương tác 3D mượt mà qua Window Event Bus.
 */

import * as THREE from 'three';
import gsap from 'gsap';
import {
  createAltarGroup,
  createTempleThemeGroup,
  createChurchThemeGroup,
  createWoodenFishGroup,
  createBellGroup,
  createIncenseOrCandle,
  createSkyLantern
} from './ProceduralAssets.js';
import { VfxManager, disposeHierarchy } from './VfxManager.js';

export class SceneManager {
  /**
   * @param {HTMLElement} containerEl Thẻ DOM chứa canvas (#webgl-container)
   */
  constructor(containerEl) {
    this.container = containerEl || document.body;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Các thành phần cảnh 3D
    this.altarData = null;
    this.templeData = null;
    this.churchData = null;
    this.woodenFishData = null;
    this.bellData = null;
    this.vfx = null;

    // Ánh sáng toàn cảnh
    this.ambientLight = null;
    this.bellFlashLight = null;

    // Theme hiện tại: 'TEMPLE' hoặc 'CHURCH'
    this.currentTheme = 'TEMPLE';

    // Camera Sway & Shake
    this.baseCameraPos = new THREE.Vector3(0, 0.45, 3.4);
    this.cameraLookAt = new THREE.Vector3(0, 0.25, 0);
    this.shakeIntensity = 0;

    // Biến cờ animation gõ mõ và đánh chuông để tránh xung đột
    this.isHittingFish = false;
    this.isRingingBell = false;

    // Bindings
    this._onWindowResize = this._onWindowResize.bind(this);
    this._onTikTokAction = this._onTikTokAction.bind(this);
    this._onThemeChange = this._onThemeChange.bind(this);
    this._animate = this._animate.bind(this);
  }

  /**
   * Khởi tạo toàn bộ không gian 3D
   */
  init() {
    this._initThree();
    this._initLights();
    this._initSceneObjects();
    this._setupEventListeners();

    // Bắt đầu vòng lặp render
    this._animate();
    console.log('[SceneManager] Không gian 3D đã sẵn sàng.');
  }

  _initThree() {
    // 1. Scene & Sương mù huyền ảo
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x120c08, 0.085); // Sương mù vàng đồng trầm mặc

    // 2. Camera 9:16 Low-angle view
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const aspect = width / height;

    this.camera = new THREE.PerspectiveCamera(54, aspect, 0.1, 100);
    this.camera.position.copy(this.baseCameraPos);
    this.camera.lookAt(this.cameraLookAt);

    // 3. WebGL Renderer tối ưu cho OBS
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Gắn canvas vào DOM
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);
  }

  _initLights() {
    // Ánh sáng môi trường dịu nhẹ
    this.ambientLight = new THREE.AmbientLight(0xffecd2, 0.7);
    this.scene.add(this.ambientLight);

    // Ánh sáng chiếu chính diện từ trên cao
    const mainDirLight = new THREE.DirectionalLight(0xffddaa, 1.3);
    mainDirLight.position.set(1.5, 4.5, 3.0);
    mainDirLight.castShadow = true;
    mainDirLight.shadow.mapSize.width = 1024;
    mainDirLight.shadow.mapSize.height = 1024;
    this.scene.add(mainDirLight);

    // Đèn chớp sáng khi thỉnh Đại Hồng Chung
    this.bellFlashLight = new THREE.PointLight(0xffea88, 0, 10);
    this.bellFlashLight.position.set(-1.15, 1.2, 0.5);
    this.scene.add(this.bellFlashLight);
  }

  _initSceneObjects() {
    // 1. Bàn thờ chính & Lư hương
    this.altarData = createAltarGroup();
    this.scene.add(this.altarData.group);

    // 2. Chủ đề Chùa (TEMPLE)
    this.templeData = createTempleThemeGroup();
    this.scene.add(this.templeData.group);

    // 3. Chủ đề Nhà Thờ (CHURCH) - Khởi tạo ẩn trước
    this.churchData = createChurchThemeGroup();
    this.churchData.group.visible = false;
    this.scene.add(this.churchData.group);

    // 4. Bộ Mõ Gỗ ở góc phải tiền cảnh
    this.woodenFishData = createWoodenFishGroup();
    this.scene.add(this.woodenFishData.group);

    // 5. Đại Hồng Chung ở góc trái tiền cảnh
    this.bellData = createBellGroup();
    this.scene.add(this.bellData.group);

    // 6. Quản lý hạt & hiệu ứng VFX
    this.vfx = new VfxManager(this.scene);
  }

  _setupEventListeners() {
    window.addEventListener('resize', this._onWindowResize);
    window.addEventListener('TIKTOK_ACTION', this._onTikTokAction);
    window.addEventListener('THEME_CHANGE', this._onThemeChange);
  }

  _onWindowResize() {
    if (!this.container || !this.camera || !this.renderer) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Chuyển đổi chủ đề giữa Chùa (TEMPLE) và Nhà Thờ (CHURCH)
   * @param {string} theme 'TEMPLE' | 'CHURCH'
   */
  setTheme(theme) {
    if (theme !== 'TEMPLE' && theme !== 'CHURCH') return;
    if (this.currentTheme === theme) return;

    this.currentTheme = theme;
    const isTemple = theme === 'TEMPLE';

    // Chuyển đổi hiển thị mô hình
    if (this.templeData && this.churchData) {
      this.templeData.group.visible = isTemple;
      this.churchData.group.visible = !isTemple;
    }

    // Đổi màu không khí sương mù và ánh sáng
    if (isTemple) {
      gsap.to(this.scene.fog.color, { r: 0.07, g: 0.047, b: 0.03, duration: 1.2 });
      gsap.to(this.ambientLight.color, { r: 1.0, g: 0.92, b: 0.82, duration: 1.2 });
    } else {
      gsap.to(this.scene.fog.color, { r: 0.04, g: 0.06, b: 0.09, duration: 1.2 });
      gsap.to(this.ambientLight.color, { r: 0.88, g: 0.94, b: 1.0, duration: 1.2 });
    }
  }

  _onThemeChange(e) {
    const theme = e.detail?.theme;
    if (theme) {
      this.setTheme(theme);
    }
  }

  /**
   * Xử lý sự kiện TikTok Action từ Window Event Bus
   */
  _onTikTokAction(e) {
    const event = e.detail;
    if (!event || !event.actionType) return;

    const { actionType, user, payload } = event;

    switch (actionType) {
      case 'WOODEN_FISH':
        this._animateWoodenFish(payload?.intensity || 1);
        break;

      case 'INCENSE':
        this._spawnIncense(user?.nickname || 'Khán Giả', payload?.repeatCount || 1);
        break;

      case 'BELL':
        this._ringBell();
        break;

      case 'LANTERN':
        this._launchSkyLantern(user?.nickname || 'Khán Giả', payload?.comment || '');
        break;

      case 'PRAYER_TEXT':
        // Lời cầu nguyện cũng thắp 1 ngọn nến nhỏ hoặc thả hoa đăng nhẹ
        this._launchSkyLantern(user?.nickname || 'Khán Giả', payload?.comment || '');
        break;
    }
  }

  /**
   * 1. Hiệu ứng gõ mõ: Dùi đập xuống cực nhanh (0.08s) -> mõ co giãn nảy nhẹ -> kích hoạt sóng âm
   */
  _animateWoodenFish(intensity = 1) {
    if (!this.woodenFishData) return;
    const { fishMesh, strikerPivot } = this.woodenFishData;

    // Animation xoay dùi đập vào mõ
    gsap.killTweensOf(strikerPivot.rotation);
    gsap.to(strikerPivot.rotation, {
      z: -0.15, // Đập xuống mặt mõ
      x: 0.35,
      duration: 0.07,
      ease: 'power2.in',
      onComplete: () => {
        // Nảy dùi trở lại vị trí cũ
        gsap.to(strikerPivot.rotation, {
          z: -0.65,
          x: 0.2,
          duration: 0.18,
          ease: 'power1.out'
        });

        // Mõ nảy nhẹ (Elastic Bounce)
        gsap.killTweensOf(fishMesh.scale);
        fishMesh.scale.set(1.08, 0.68, 1.15);
        gsap.to(fishMesh.scale, {
          x: 1.0,
          y: 0.75,
          z: 1.1,
          duration: 0.28,
          ease: 'elastic.out(1.2, 0.3)'
        });

        // Kích hoạt sóng âm và chữ bay lên
        const worldPos = new THREE.Vector3();
        fishMesh.getWorldPosition(worldPos);
        this.vfx.triggerWoodenFishVfx(worldPos, intensity);
      }
    });
  }

  /**
   * 2. Hiệu ứng thắp nhang / ngọn nến dâng cúng
   */
  _spawnIncense(nickname, repeatCount = 1) {
    const isTemple = this.currentTheme === 'TEMPLE';
    const item = createIncenseOrCandle(nickname, this.currentTheme);

    // Xác định vị trí cắm vào lư hương (nếu Chùa) hoặc xếp trên bàn (nếu Nhà thờ)
    const angle = Math.random() * Math.PI * 2;
    const radius = isTemple ? Math.random() * 0.35 : 0.6 + Math.random() * 0.6;
    const targetX = isTemple ? Math.cos(angle) * radius : (Math.random() - 0.5) * 2.2;
    const targetZ = isTemple ? 0.25 + Math.sin(angle) * radius : -0.1 + (Math.random() - 0.5) * 0.4;
    const targetY = isTemple ? 0.05 : -0.3;

    // Bắt đầu từ trên cao bay xuống cắm vào vị trí
    item.position.set(targetX, targetY + 1.6, targetZ);
    item.scale.set(0.1, 0.1, 0.1);
    this.scene.add(item);

    gsap.to(item.position, {
      y: targetY,
      duration: 0.75,
      ease: 'power2.out'
    });

    gsap.to(item.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.75,
      ease: 'back.out(1.5)',
      onComplete: () => {
        // Tăng khói hương
        this.vfx.boostSmoke();
        this.vfx.registerIncense(item);
      }
    });
  }

  /**
   * 3. Hiệu ứng thỉnh Đại Hồng Chung: Kéo chày lùi lại -> đâm mạnh -> chuông rung lắc -> Camera Shake
   */
  _ringBell() {
    if (this.isRingingBell || !this.bellData) return;
    this.isRingingBell = true;

    const { bellPivot, strikerGroup } = this.bellData;

    // Kéo chày gỗ lùi ra sau
    gsap.to(strikerGroup.position, {
      z: 0.95,
      duration: 0.45,
      ease: 'power1.inOut',
      onComplete: () => {
        // Đâm mạnh vào chuông
        gsap.to(strikerGroup.position, {
          z: 0.46, // Điểm va chạm
          duration: 0.14,
          ease: 'power3.in',
          onComplete: () => {
            // Chày bật ngược lại
            gsap.to(strikerGroup.position, {
              z: 0.65,
              duration: 0.6,
              ease: 'power1.out'
            });

            // Chuông rung lắc dao động tắt dần
            gsap.fromTo(
              bellPivot.rotation,
              { z: 0.16 },
              {
                z: 0,
                duration: 3.5,
                ease: 'elastic.out(1.8, 0.18)',
                onComplete: () => {
                  this.isRingingBell = false;
                }
              }
            );

            // Bùng sáng ánh vàng PointLight
            if (this.bellFlashLight) {
              gsap.fromTo(
                this.bellFlashLight,
                { intensity: 5.5 },
                { intensity: 0, duration: 1.8, ease: 'power2.out' }
              );
            }

            // Kích hoạt Camera Shake nhẹ tạo uy lực tâm linh
            this.shakeIntensity = 0.08;
            gsap.to(this, {
              shakeIntensity: 0,
              duration: 1.2,
              ease: 'power2.out'
            });
          }
        });
      }
    });
  }

  /**
   * 4. Hiệu ứng thả Đèn Hoa Đăng bay lên bầu trời đêm
   */
  _launchSkyLantern(nickname, comment) {
    const lantern = createSkyLantern(nickname, comment);
    // Vị trí xuất phát từ góc dưới màn hình
    const startX = (Math.random() - 0.5) * 1.8;
    lantern.position.set(startX, -1.2, 0.8 + Math.random() * 0.4);
    lantern.scale.set(0.1, 0.1, 0.1);
    this.scene.add(lantern);

    // Xuất hiện và bay từ từ lên cao
    gsap.to(lantern.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 1.0,
      ease: 'power1.out'
    });

    const targetY = 3.6 + Math.random() * 0.8;
    const targetX = startX + (Math.random() - 0.5) * 1.2;
    const driftZ = -1.5 - Math.random() * 1.5;

    gsap.to(lantern.position, {
      y: targetY,
      x: targetX,
      z: driftZ,
      duration: 16.0,
      ease: 'power1.out',
      onComplete: () => {
        this.scene.remove(lantern);
        disposeHierarchy(lantern);
      }
    });

    // Lắc lư nhẹ nhàng khi bay
    gsap.to(lantern.rotation, {
      z: (Math.random() - 0.5) * 0.25,
      y: Math.PI * 2,
      duration: 12.0,
      repeat: -1,
      ease: 'sine.inOut'
    });

    this.vfx.registerLantern(lantern);
  }

  /**
   * Vòng lặp render chính (60 FPS) kết hợp Camera Sway chống AFK
   */
  _animate() {
    requestAnimationFrame(this._animate);

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // 1. Camera Sway chống quét AFK của TikTok Live (lắc lư nhẹ như nhịp thở)
    const swayX = Math.sin(elapsed * 0.45) * 0.06;
    const swayY = Math.cos(elapsed * 0.35) * 0.04;

    // Cộng thêm Camera Shake nếu có sự kiện thỉnh chuông
    const shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity;
    const shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity;

    this.camera.position.x = this.baseCameraPos.x + swayX + shakeOffsetX;
    this.camera.position.y = this.baseCameraPos.y + swayY + shakeOffsetY;
    this.camera.lookAt(this.cameraLookAt);

    // 2. Vòng hào quang Phật luôn xoay chậm huyền ảo
    if (this.templeData && this.templeData.haloGroup && this.templeData.group.visible) {
      this.templeData.haloGroup.rotation.z = elapsed * 0.2;
    }

    // 3. Cập nhật hệ thống hạt VFX (khói hương, bụi vàng)
    if (this.vfx) {
      this.vfx.update(delta, elapsed);
    }

    // 4. Render cảnh
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Dọn dẹp tài nguyên khi tắt module
   */
  destroy() {
    window.removeEventListener('resize', this._onWindowResize);
    window.removeEventListener('TIKTOK_ACTION', this._onTikTokAction);
    window.removeEventListener('THEME_CHANGE', this._onThemeChange);

    if (this.vfx) this.vfx.destroy();
    if (this.scene) disposeHierarchy(this.scene);
    if (this.renderer) {
      this.renderer.dispose();
      this.container.innerHTML = '';
    }
  }
}


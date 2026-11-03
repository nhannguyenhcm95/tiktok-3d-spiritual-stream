/**
 * Scene Manager — Đại Hùng Bảo Điện Chùa An Lạc 3D
 * Góc nhìn tịnh tâm từ bên trong chánh điện hướng lên Đức Phật Thích Ca,
 * Đạo tràng Phật tử ngồi thiền định tụng kinh, Camera Cinematic điều phối
 * 100% tự động theo comment và cúng dường từ luồng Live TikTok.
 */

import * as THREE from 'three';
import gsap from 'gsap';
import {
  buildTempleInterior,
  buildBuddhaAltar,
  buildWoodenFishAltar,
  buildBellAltar,
  buildSanghaCongregation,
  buildDevoteeAvatar
} from './ProceduralAssets.js';
import { VfxManager, disposeHierarchy } from './VfxManager.js';

export class SceneManager {
  constructor(containerEl) {
    this.container = containerEl || document.body;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Các thành phần trong Chánh Điện
    this.interior = null;
    this.altarData = null;
    this.woodenFishData = null;
    this.bellData = null;
    this.sanghaData = null;
    this.devoteeData = null;
    this.vfx = null;

    // Ánh sáng toàn cảnh
    this.ambientLight = null;
    this.mainSpotLight = null;

    // Camera vị trí ngồi tịnh tâm trong chánh điện
    this.baseCamPos = new THREE.Vector3(0, 1.25, 4.2);
    this.camLookAt = new THREE.Vector3(0, 2.5, -5.2); // Hướng nhìn lên Kim Thân Đức Phật
    this.shakeIntensity = 0;
    this.isBowing = false;

    // Bindings
    this._onWindowResize = this._onWindowResize.bind(this);
    this._onTikTokAction = this._onTikTokAction.bind(this);
    this._animate = this._animate.bind(this);
  }

  init() {
    this._initThree();
    this._initLights();
    this._initChanhDien();
    this._setupEventListeners();

    this._animate();
    console.log('[SceneManager] Đại Hùng Bảo Điện 3D đã sẵn sàng.');
  }

  _initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x160a06);
    this.scene.fog = new THREE.FogExp2(0x160a06, 0.045); // Sương khói trầm hương huyền ảo

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // Camera 9:16 Low-angle trang nghiêm từ vị trí người ngồi tụng kinh
    this.camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 80);
    this.camera.position.copy(this.baseCamPos);
    this.camera.lookAt(this.camLookAt);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);
  }

  _initLights() {
    this.ambientLight = new THREE.AmbientLight(0xffe2b8, 0.7);
    this.scene.add(this.ambientLight);

    // Ánh đèn vàng ấm chiếu rọi Kim Thân Đức Phật từ trên trần chánh điện
    this.mainSpotLight = new THREE.SpotLight(0xffd56b, 2.8, 18, Math.PI / 4, 0.4);
    this.mainSpotLight.position.set(0, 9.5, -0.5);
    this.mainSpotLight.target.position.set(0, 3.5, -5.2);
    this.mainSpotLight.castShadow = true;
    this.scene.add(this.mainSpotLight);
    this.scene.add(this.mainSpotLight.target);
  }

  _initChanhDien() {
    // 1. Tòa nhà Chánh Điện rộng lớn
    this.interior = buildTempleInterior();
    this.scene.add(this.interior);

    // 2. Ban Thờ Chính & Tượng Phật Thích Ca mạ vàng
    this.altarData = buildBuddhaAltar();
    this.scene.add(this.altarData.group);

    // 3. Bộ Mõ Gỗ ở góc phải bàn thờ
    this.woodenFishData = buildWoodenFishAltar();
    this.scene.add(this.woodenFishData.group);

    // 4. Đại Hồng Chung ở góc trái
    this.bellData = buildBellAltar();
    this.scene.add(this.bellData.group);

    // 5. Đạo tràng Phật tử ngồi kiết già tụng kinh trong điện
    this.sanghaData = buildSanghaCongregation(18);
    this.scene.add(this.sanghaData.group);

    // 6. Nhân vật đại diện người dâng lễ / vái lạy
    this.devoteeData = buildDevoteeAvatar();
    this.scene.add(this.devoteeData.devotee);

    // 7. Hệ thống hạt khói hương & bụi vàng
    this.vfx = new VfxManager(this.scene);

    // Cắm sẵn một số nén hương đỏ đang cháy trong lư
    for (let i = 0; i < 9; i++) {
      this._addStickToCenser((Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.7);
    }
  }

  _addStickToCenser(dx = 0, dz = 0) {
    if (!this.altarData || !this.altarData.incenseSticks) return;
    const stick = new THREE.Group();
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.65, 6),
      new THREE.MeshBasicMaterial({ color: 0xb52418 })
    );
    stem.position.y = 0.32;
    const ember = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xff3b00 })
    );
    ember.position.y = 0.65;
    stick.add(stem, ember);
    stick.position.set(dx, 0, dz);
    stick.rotation.x = (Math.random() - 0.5) * 0.1;
    stick.rotation.z = (Math.random() - 0.5) * 0.1;
    this.altarData.incenseSticks.add(stick);
  }

  _setupEventListeners() {
    window.addEventListener('resize', this._onWindowResize);
    window.addEventListener('TIKTOK_ACTION', this._onTikTokAction);
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
   * Đạo tràng và nhân vật cùng vái lạy đồng điệu trang nghiêm
   */
  triggerBowCongregation() {
    if (this.isBowing) return;
    this.isBowing = true;

    // Cúi mình nhân vật đại diện
    if (this.devoteeData) {
      gsap.to(this.devoteeData.devotee.rotation, {
        x: 0.35,
        duration: 0.6,
        yoyo: true,
        repeat: 1,
        ease: 'power1.inOut'
      });
    }

    // Toàn bộ Đạo tràng Phật tử cùng nghiêng mình vái lạy
    if (this.sanghaData && this.sanghaData.sanghaMembers) {
      this.sanghaData.sanghaMembers.forEach((monk, idx) => {
        gsap.to(monk.rotation, {
          x: 0.28,
          duration: 0.55,
          delay: (idx % 3) * 0.05,
          yoyo: true,
          repeat: 1,
          ease: 'power1.inOut'
        });
      });
    }

    // Camera zoom nhẹ lên bàn Phật trang nghiêm
    gsap.to(this.camera.position, {
      z: 3.5,
      y: 1.15,
      duration: 0.7,
      yoyo: true,
      repeat: 1,
      ease: 'power1.inOut',
      onComplete: () => {
        this.isBowing = false;
      }
    });

    // Mõ gõ nhẹ kèm theo
    this.tapWoodenFish();
  }

  /**
   * Gõ mõ tụng kinh ("Cốc!")
   */
  tapWoodenFish() {
    if (!this.woodenFishData) return;
    const { fishMesh, strikerPivot } = this.woodenFishData;

    // Animation dùi đập vào mõ
    gsap.killTweensOf(strikerPivot.rotation);
    gsap.to(strikerPivot.rotation, {
      z: -0.15,
      duration: 0.07,
      ease: 'power2.in',
      onComplete: () => {
        gsap.to(strikerPivot.rotation, { z: -0.65, duration: 0.16, ease: 'power1.out' });

        // Mõ nảy nhẹ
        gsap.fromTo(fishMesh.scale, { x: 1.25, y: 0.7, z: 1.15 }, { x: 1.15, y: 0.8, z: 1.05, duration: 0.25, ease: 'elastic.out(1.2, 0.3)' });

        const worldPos = new THREE.Vector3();
        fishMesh.getWorldPosition(worldPos);
        this.vfx.triggerWoodenFishVfx(worldPos);
      }
    });
  }

  /**
   * Thỉnh Đại Hồng Chung ngân vang rền khắp chánh điện
   */
  ringBell() {
    if (!this.bellData) return;
    const { bellPivot, strikerGroup } = this.bellData;

    // Chày gỗ đâm mạnh vào chuông
    gsap.to(strikerGroup.position, {
      z: 0.42,
      duration: 0.18,
      ease: 'power3.in',
      onComplete: () => {
        gsap.to(strikerGroup.position, { z: 0.7, duration: 0.45, ease: 'power1.out' });

        // Chuông rung lắc dao động
        gsap.fromTo(bellPivot.rotation, { z: 0.18 }, { z: 0, duration: 4.5, ease: 'elastic.out(1.8, 0.18)' });

        // Camera Shake nhẹ
        this.shakeIntensity = 0.09;
        gsap.to(this, { shakeIntensity: 0, duration: 1.4, ease: 'power2.out' });
      }
    });
  }

  /**
   * Thắp nén tâm hương cắm vào lư đồng
   */
  addIncense(count = 1) {
    for (let i = 0; i < count; i++) {
      this._addStickToCenser((Math.random() - 0.5) * 0.65, (Math.random() - 0.5) * 0.65);
    }
    this.vfx.boostSmoke();

    // Zoom nhẹ vào lư hương
    gsap.to(this.camera.position, {
      z: 2.8,
      y: 0.95,
      duration: 0.9,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut'
    });

    if (this.devoteeData) {
      gsap.to(this.devoteeData.devotee.rotation, {
        x: 0.35,
        duration: 0.6,
        yoyo: true,
        repeat: 1,
        ease: 'power1.inOut'
      });
    }
  }

  /**
   * Xử lý tương tác từ luồng Live TikTok
   */
  _onTikTokAction(e) {
    const data = e.detail;
    if (!data || !data.actionType) return;

    switch (data.actionType) {
      case 'BOW':
        this.triggerBowCongregation();
        break;

      case 'WOODEN_FISH':
        this.tapWoodenFish();
        break;

      case 'INCENSE_1':
        this.addIncense(1);
        break;

      case 'INCENSE_3':
        this.addIncense(3);
        break;

      case 'BELL':
        this.ringBell();
        break;

      case 'CONFETTI':
        this.vfx.triggerConfetti();
        break;

      case 'BUDDHA_LIGHT':
      case 'PARADE_FLOAT':
      case 'THOUSAND_LANTERNS':
      case 'GOLDEN_PAGODA':
      case 'GOLDEN_LION':
      case 'GOLDEN_PHOENIX':
        this.vfx.triggerBuddhaLight(this.altarData.buddhaLight, this.altarData.haloGroup);
        this.vfx.triggerConfetti();
        break;

      case 'TIKTOK_UNIVERSE':
        this.vfx.triggerBuddhaLight(this.altarData.buddhaLight, this.altarData.haloGroup);
        this.vfx.triggerConfetti();
        this.ringBell();
        this.addIncense(5);
        break;
    }
  }

  /**
   * Vòng lặp render chính (60 FPS) kết hợp Camera Sway chống AFK
   */
  _animate() {
    requestAnimationFrame(this._animate);

    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.getElapsedTime();

    // 1. Camera Swaying (Nhịp thở tịnh tâm nhẹ nhàng chống TikTok quét Live tĩnh)
    const swayX = Math.sin(elapsed * 0.35) * 0.06;
    const swayY = Math.cos(elapsed * 0.28) * 0.04;

    const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
    const shakeY = (Math.random() - 0.5) * this.shakeIntensity;

    this.camera.position.x = this.baseCamPos.x + swayX + shakeX;
    this.camera.position.y = this.baseCamPos.y + swayY + shakeY;
    this.camera.lookAt(this.camLookAt);

    // 2. Vòng hào quang Phật luôn xoay chậm huyền ảo
    if (this.altarData && this.altarData.haloGroup) {
      this.altarData.haloGroup.rotation.z = elapsed * 0.16;
    }

    // 3. Cập nhật khói hương và bụi vàng
    if (this.vfx) {
      this.vfx.update(dt, elapsed);
    }

    // 4. Render
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    window.removeEventListener('resize', this._onWindowResize);
    window.removeEventListener('TIKTOK_ACTION', this._onTikTokAction);
    if (this.vfx) this.vfx.destroy();
    if (this.scene) disposeHierarchy(this.scene);
    if (this.renderer) this.renderer.dispose();
  }
}

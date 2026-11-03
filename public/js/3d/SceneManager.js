/**
 * Scene Manager — Chùa An Lạc 3D
 * Quản lý Cảnh quan Chùa Việt, Hoàng hôn chuyển đêm, 48 Khách AI,
 * Nhân vật áo lam vái lạy, Camera Cinematic và các tương tác Live TikTok.
 */

import * as THREE from 'three';
import gsap from 'gsap';
import {
  MAT,
  buildTamQuanGate,
  buildMainCenser,
  createIncenseStick,
  buildMainHall,
  buildBellTower,
  buildBodhiTree,
  createSilkRibbon,
  buildLotusPond,
  createLotusLantern,
  buildFortuneStation,
  buildLanternRows,
  buildPlayerChibi,
  createSacredGiftVisual
} from './ProceduralAssets.js';
import { VfxManager, disposeHierarchy } from './VfxManager.js';

export class SceneManager {
  constructor(containerEl) {
    this.container = containerEl || document.body;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Các thành phần chùa
    this.censerData = null;
    this.hallData = null;
    this.bellData = null;
    this.treeData = null;
    this.pondData = null;
    this.boothData = null;
    this.lanternData = null;
    this.playerData = null;
    this.vfx = null;

    // Danh sách hoa đăng & dải lụa
    this.pondLanterns = [];
    this.bodhiRibbons = [];

    // Khách AI InstancedMesh
    this.AI_COUNT = 48;
    this.aiPilgrims = [];
    this.aiBodyMesh = null;
    this.aiHeadMesh = null;
    this.aiDummy = new THREE.Object3D();

    // Camera & Điều khiển
    this.cameraYaw = 0;
    this.cameraPitch = 0.36;
    this.camTargetPos = new THREE.Vector3();
    this.camLookAtPos = new THREE.Vector3();
    this.isCinematicZoom = false;
    this.isBowing = false;
    this.isLiveMode = true; // Chế độ live camera lia mượt mà

    // Vật cản chống đi xuyên tường
    this.obstacles = [];

    // Bindings
    this._onWindowResize = this._onWindowResize.bind(this);
    this._onTikTokAction = this._onTikTokAction.bind(this);
    this._animate = this._animate.bind(this);
  }

  init() {
    this._initThree();
    this._initEnvironment();
    this._initChuaAnLac();
    this._initAiPilgrims();
    this._initPlayer();
    this._setupEventListeners();

    this._animate();
    console.log('[SceneManager] Không gian Chùa An Lạc 3D đã sẵn sàng.');
  }

  _initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x28151f);
    this.scene.fog = new THREE.FogExp2(0x28151f, 0.014);

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 160);
    this.camera.position.set(0, 5.5, 29);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);
  }

  _initEnvironment() {
    // Ánh sáng hoàng hôn chuyển dần sang đêm
    this.hemiLight = new THREE.HemisphereLight(0xffb478, 0x331d14, 0.85);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xff9b52, 0.95);
    this.dirLight.position.set(-22, 28, 18);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.set(1024, 1024);
    this.scene.add(this.dirLight);

    // Sân lát gạch Bát Tràng đỏ cổ
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#7c3622'; ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#572213'; ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 60, 60); ctx.strokeRect(66, 2, 60, 60);
    ctx.strokeRect(2, 66, 60, 60); ctx.strokeRect(66, 66, 60, 60);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(36, 36);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(76, 76), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.88 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const outerGrass = new THREE.Mesh(new THREE.PlaneGeometry(180, 180), new THREE.MeshStandardMaterial({ color: 0x1c2b19, roughness: 0.95 }));
    outerGrass.rotation.x = -Math.PI / 2;
    outerGrass.position.y = -0.05;
    this.scene.add(outerGrass);
  }

  _addObstacle(x, z, r) {
    this.obstacles.push({ x, z, r });
  }

  _initChuaAnLac() {
    // 1. Cổng Tam Quan
    const gate = buildTamQuanGate();
    this.scene.add(gate);
    [-7.5, -2.8, 2.8, 7.5].forEach(px => this._addObstacle(px, 26, 0.95));

    // 2. Lư Hương Đồng lớn
    this.censerData = buildMainCenser();
    this.scene.add(this.censerData.censer);
    this._addObstacle(0, 5, 2.1);
    for (let i = 0; i < 12; i++) {
      const stick = createIncenseStick((Math.random() - 0.5) * 1.1, (Math.random() - 0.5) * 1.1);
      this.censerData.incenseSticks.add(stick);
    }

    // 3. Đại Hùng Bảo Điện & Tượng Phật
    this.hallData = buildMainHall();
    this.scene.add(this.hallData.hall);
    this._addObstacle(0, -14.8, 4.8);
    this._addObstacle(-6.5, -13, 3.2);
    this._addObstacle(6.5, -13, 3.2);

    // 4. Gác Chuông & Đại Hồng Chung
    this.bellData = buildBellTower();
    this.scene.add(this.bellData.tower);
    this._addObstacle(-13, 1, 3.1);

    // 5. Cây Bồ Đề Cổ Thụ
    this.treeData = buildBodhiTree();
    this.scene.add(this.treeData.tree);
    this._addObstacle(13, -1, 3.2);
    for (let i = 0; i < 24; i++) {
      const rib = createSilkRibbon();
      this.treeData.ribbonsGroup.add(rib);
      this.bodhiRibbons.push(rib);
    }

    // 6. Hồ Sen Nhỏ
    this.pondData = buildLotusPond();
    this.scene.add(this.pondData.pond);
    this._addObstacle(13, 12, 4.9);
    for (let i = 0; i < 10; i++) {
      const lantern = createLotusLantern(13, 12);
      this.scene.add(lantern);
      this.pondLanterns.push(lantern);
    }

    // 7. Bàn Xin Quẻ
    this.boothData = buildFortuneStation();
    this.scene.add(this.boothData.booth);
    this._addObstacle(-13, 12, 1.8);

    // 8. Hàng Đèn Lồng Đỏ
    this.lanternData = buildLanternRows();
    this.scene.add(this.lanternData.group);

    // 9. VFX Manager
    this.vfx = new VfxManager(this.scene);
  }

  _initAiPilgrims() {
    this.aiBodyMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.28, 0.38, 0.98, 8), new THREE.MeshStandardMaterial({ roughness: 0.8 }), this.AI_COUNT);
    this.aiHeadMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.29, 10, 10), new THREE.MeshStandardMaterial({ color: 0xffdab8, roughness: 0.7 }), this.AI_COUNT);
    this.aiBodyMesh.castShadow = true;
    this.scene.add(this.aiBodyMesh, this.aiHeadMesh);

    const robePalette = [0x6f8596, 0xa87c56, 0x8c4a58, 0x5c7a67, 0xd4b67c, 0x7b6d8d, 0xc97b63];
    const WAYPOINTS = [
      { x: 0, z: 8.2 },     // Trước lư hương
      { x: -2.5, z: -5.5 }, // Trước chính điện
      { x: 2.5, z: -5.5 },  // Trước chính điện
      { x: -10, z: 2.5 },   // Gần gác chuông
      { x: 9.5, z: -1 },    // Gốc bồ đề
      { x: 8.5, z: 12 },    // Hồ sen
      { x: -10, z: 12 },    // Bàn xin quẻ
      { x: 0, z: 22 }       // Cổng tam quan
    ];

    for (let i = 0; i < this.AI_COUNT; i++) {
      const scale = i % 6 === 0 ? 0.68 : (i % 5 === 0 ? 0.92 : 1.0);
      const wp = WAYPOINTS[i % WAYPOINTS.length];
      const x = wp.x + (Math.random() - 0.5) * 6;
      const z = wp.z + (Math.random() - 0.5) * 6;
      const target = WAYPOINTS[Math.floor(Math.random() * WAYPOINTS.length)];

      this.aiPilgrims.push({
        x, z,
        tx: target.x + (Math.random() - 0.5) * 3.5,
        tz: target.z + (Math.random() - 0.5) * 3.5,
        scale,
        speed: (1.15 + Math.random() * 0.7) * (scale < 0.8 ? 1.15 : 0.9),
        waitTimer: Math.random() * 4,
        rotY: Math.random() * Math.PI * 2,
        phase: Math.random() * 10
      });

      this.aiBodyMesh.setColorAt(i, new THREE.Color(robePalette[i % robePalette.length]));
    }
    this.aiBodyMesh.instanceColor.needsUpdate = true;
  }

  _initPlayer() {
    this.playerData = buildPlayerChibi();
    this.scene.add(this.playerData.player);
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
   * Động tác nhân vật chắp tay vái lạy trang nghiêm
   */
  triggerPlayerBow() {
    if (!this.playerData) return;
    const { leftArm, rightArm } = this.playerData;

    this.isBowing = true;
    gsap.killTweensOf(leftArm.position);
    gsap.killTweensOf(rightArm.position);

    // Chắp hai tay trước ngực
    gsap.to(leftArm.position, { x: -0.16, y: 0.85, z: 0.32, duration: 0.3 });
    gsap.to(leftArm.rotation, { x: 0.8, y: 0, z: 0.4, duration: 0.3 });
    gsap.to(rightArm.position, { x: 0.16, y: 0.85, z: 0.32, duration: 0.3 });
    gsap.to(rightArm.rotation, { x: 0.8, y: 0, z: -0.4, duration: 0.3 });

    // Cúi người vái lạy
    gsap.to(this.playerData.player.rotation, {
      x: 0.28,
      duration: 0.5,
      yoyo: true,
      repeat: 1,
      ease: 'power1.inOut',
      onComplete: () => {
        // Trở về thế đứng thường
        gsap.to(leftArm.position, { x: -0.36, y: 0.78, z: 0.12, duration: 0.3 });
        gsap.to(leftArm.rotation, { x: 0, y: 0, z: -0.25, duration: 0.3 });
        gsap.to(rightArm.position, { x: 0.36, y: 0.78, z: 0.12, duration: 0.3 });
        gsap.to(rightArm.rotation, { x: 0, y: 0, z: 0.25, duration: 0.3 });
        this.isBowing = false;
      }
    });
  }

  /**
   * Cinematic Zoom: Phóng máy quay lại gần người chơi khi có tương tác quan trọng
   */
  triggerCinematicZoom() {
    this.isCinematicZoom = true;
    clearTimeout(this._zoomTimer);
    this._zoomTimer = setTimeout(() => {
      this.isCinematicZoom = false;
    }, 3200);
  }

  /**
   * Thỉnh Đại Hồng Chung rung chấn
   */
  ringBell() {
    if (!this.bellData) return;
    const { bellMesh, striker } = this.bellData;

    // Chày gỗ đâm mạnh vào chuông
    gsap.to(striker.position, {
      x: 0.75,
      duration: 0.18,
      ease: 'power2.in',
      yoyo: true,
      repeat: 1
    });

    // Chuông rung lắc dao động
    gsap.fromTo(bellMesh.rotation, { z: 0.2 }, { z: 0, duration: 4.0, ease: 'elastic.out(1.6, 0.2)' });

    // Hiệu ứng rung màn hình nhẹ
    document.body.classList.remove('shake-screen');
    void document.body.offsetWidth;
    document.body.classList.add('shake-screen');
  }

  /**
   * Gõ mõ tụng kinh
   */
  tapWoodenFish() {
    if (!this.hallData || !this.hallData.woodenFishMesh) return;
    const fish = this.hallData.woodenFishMesh;
    gsap.fromTo(fish.scale, { x: 1.35, y: 0.65, z: 1.2 }, { x: 1.15, y: 0.85, z: 1.0, duration: 0.2, ease: 'elastic.out(1.2, 0.3)' });

    const worldPos = new THREE.Vector3();
    fish.getWorldPosition(worldPos);
    this.vfx.triggerWoodenFishRing(worldPos);
  }

  /**
   * Cắm nén hương vào lư
   */
  addIncense(count = 1) {
    if (!this.censerData) return;
    for (let i = 0; i < count; i++) {
      const stick = createIncenseStick((Math.random() - 0.5) * 1.0, (Math.random() - 0.5) * 1.0);
      this.censerData.incenseSticks.add(stick);
    }
    this.triggerPlayerBow();
  }

  /**
   * Thả đèn hoa đăng
   */
  dropLotusLantern() {
    const l = createLotusLantern(13, 12);
    this.scene.add(l);
    this.pondLanterns.push(l);
  }

  /**
   * Treo dải lụa đỏ
   */
  hangSilkRibbon() {
    if (!this.treeData) return;
    const r = createSilkRibbon();
    this.treeData.ribbonsGroup.add(r);
    this.bodhiRibbons.push(r);
  }

  /**
   * Xử lý tương tác từ TikTok
   */
  _onTikTokAction(e) {
    const data = e.detail;
    if (!data || !data.actionType) return;

    const action = data.actionType;
    const user = data.user?.nickname || 'Khán giả';

    switch (action) {
      case 'BOW':
        this.triggerPlayerBow();
        this.triggerCinematicZoom();
        break;

      case 'WOODEN_FISH':
        this.tapWoodenFish();
        break;

      case 'INCENSE_1':
        this.addIncense(1);
        this.triggerCinematicZoom();
        break;

      case 'INCENSE_3':
        this.addIncense(3);
        this.triggerCinematicZoom();
        break;

      case 'LANTERN':
        this.dropLotusLantern();
        this.hangSilkRibbon();
        break;

      case 'OFFERING_FRUIT':
        const fruit = createSacredGiftVisual('OFFERING_FRUIT', user);
        this.scene.add(fruit);
        break;

      case 'BELL':
        this.ringBell();
        this.triggerCinematicZoom();
        break;

      case 'CONFETTI':
        this.vfx.triggerConfetti();
        break;

      case 'PARADE_FLOAT':
        const floatObj = createSacredGiftVisual('PARADE_FLOAT', user);
        this.scene.add(floatObj);
        break;

      case 'BUDDHA_LIGHT':
        this.vfx.triggerBuddhaLight(this.hallData.buddhaLight, this.hallData.halo);
        break;

      case 'THOUSAND_LANTERNS':
        for (let i = 0; i < 15; i++) {
          this.dropLotusLantern();
        }
        break;

      case 'GOLDEN_PAGODA':
        const pagoda = createSacredGiftVisual('GOLDEN_PAGODA', user);
        this.scene.add(pagoda);
        break;

      case 'GOLDEN_LION':
        const lion = createSacredGiftVisual('GOLDEN_LION', user);
        this.scene.add(lion);
        break;

      case 'GOLDEN_PHOENIX':
        const phoenix = createSacredGiftVisual('GOLDEN_PHOENIX', user);
        this.scene.add(phoenix);
        break;

      case 'TIKTOK_UNIVERSE':
        this.vfx.triggerBuddhaLight(this.hallData.buddhaLight, this.hallData.halo);
        this.vfx.triggerConfetti();
        this.ringBell();
        for (let i = 0; i < 20; i++) this.dropLotusLantern();
        break;
    }
  }

  /**
   * Vòng lặp render chính (60 FPS)
   */
  _animate() {
    requestAnimationFrame(this._animate);

    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.getElapsedTime();

    // 1. Chuyển cảnh mượt Hoàng Hôn sang Đêm
    const dayNight = (Math.sin(elapsed * 0.04 - Math.PI / 4) + 1) * 0.5;
    const sunsetSky = new THREE.Color(0x3a1c28);
    const nightSky = new THREE.Color(0x0c0e1c);
    this.scene.background.lerpColors(sunsetSky, nightSky, dayNight);
    this.scene.fog.color.copy(this.scene.background);
    this.hemiLight.intensity = 0.85 - dayNight * 0.35;
    this.dirLight.intensity = 0.95 - dayNight * 0.45;

    // 2. Camera Sway & Follow
    if (this.playerData) {
      const p = this.playerData.player.position;

      if (this.isCinematicZoom) {
        // Cận cảnh nhân vật khi vái lạy / thắp hương
        const zoomDist = 2.8;
        const targetX = p.x + Math.sin(this.cameraYaw) * zoomDist;
        const targetZ = p.z + Math.cos(this.cameraYaw) * zoomDist;
        const targetY = p.y + 1.35;
        this.camTargetPos.set(targetX, targetY, targetZ);
        this.camLookAtPos.set(p.x, p.y + 1.15, p.z);
      } else {
        // Góc nhìn bao quát dạo chùa (kết hợp sway nhẹ chống TikTok quét AFK)
        const camDist = 6.4;
        const sway = Math.sin(elapsed * 0.35) * 0.25;
        const targetX = p.x + Math.sin(this.cameraYaw + sway) * camDist * Math.cos(this.cameraPitch);
        const targetZ = p.z + Math.cos(this.cameraYaw + sway) * camDist * Math.cos(this.cameraPitch);
        const targetY = p.y + 1.8 + Math.sin(this.cameraPitch) * camDist;
        this.camTargetPos.set(targetX, targetY, targetZ);
        this.camLookAtPos.set(p.x, p.y + 1.35, p.z);
      }

      this.camera.position.lerp(this.camTargetPos, 0.1);
      this.camera.lookAt(this.camLookAtPos);
    }

    // 3. Cập nhật 48 khách AI InstancedMesh
    if (this.aiBodyMesh && this.aiHeadMesh) {
      const WAYPOINTS = [
        { x: 0, z: 8.2 }, { x: -2.5, z: -5.5 }, { x: 2.5, z: -5.5 },
        { x: -10, z: 2.5 }, { x: 9.5, z: -1 }, { x: 8.5, z: 12 },
        { x: -10, z: 12 }, { x: 0, z: 22 }
      ];

      for (let i = 0; i < this.AI_COUNT; i++) {
        const p = this.aiPilgrims[i];
        if (p.waitTimer > 0) {
          p.waitTimer -= dt;
        } else {
          const dx = p.tx - p.x;
          const dz = p.tz - p.z;
          const dist = Math.hypot(dx, dz);
          if (dist < 0.4) {
            p.waitTimer = 2.5 + Math.random() * 4.5;
            const nextWp = WAYPOINTS[Math.floor(Math.random() * WAYPOINTS.length)];
            p.tx = nextWp.x + (Math.random() - 0.5) * 4.5;
            p.tz = nextWp.z + (Math.random() - 0.5) * 4.5;
          } else {
            p.x += (dx / dist) * p.speed * dt;
            p.z += (dz / dist) * p.speed * dt;
            p.rotY = Math.atan2(dx, dz);
          }
        }

        const bob = p.waitTimer > 0 ? 0 : Math.abs(Math.sin(elapsed * 7 + p.phase)) * 0.05;
        this.aiDummy.position.set(p.x, (0.49 * p.scale) + bob, p.z);
        this.aiDummy.rotation.set(0, p.rotY, 0);
        this.aiDummy.scale.set(p.scale, p.scale, p.scale);
        this.aiDummy.updateMatrix();
        this.aiBodyMesh.setMatrixAt(i, this.aiDummy.matrix);

        this.aiDummy.position.set(p.x, (1.22 * p.scale) + bob, p.z);
        this.aiDummy.updateMatrix();
        this.aiHeadMesh.setMatrixAt(i, this.aiDummy.matrix);
      }
      this.aiBodyMesh.instanceMatrix.needsUpdate = true;
      this.aiHeadMesh.instanceMatrix.needsUpdate = true;
    }

    // 4. Cập nhật đèn hoa đăng trôi hồ
    this.pondLanterns.forEach(l => {
      l.userData.angle += dt * l.userData.speed;
      l.position.x = l.userData.baseX + Math.cos(l.userData.angle) * l.userData.radius;
      l.position.z = l.userData.baseZ + Math.sin(l.userData.angle) * l.userData.radius;
    });

    // 5. Dải lụa đỏ đung đưa trong gió
    this.bodhiRibbons.forEach(r => {
      r.rotation.z = r.userData.baseRotZ + Math.sin(elapsed * 2.2 + r.userData.phase) * 0.14;
    });

    // 6. Đèn lồng đỏ đu đưa
    if (this.lanternData && this.lanternData.lanterns) {
      this.lanternData.lanterns.forEach(lm => {
        lm.position.x = lm.userData.baseX + Math.sin(elapsed * 1.8 + lm.userData.phase) * 0.04;
      });
    }

    // 7. Cập nhật hạt khói, đom đóm VFX
    if (this.vfx) {
      this.vfx.update(dt, elapsed);
    }

    // 8. Render
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

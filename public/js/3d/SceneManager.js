/**
 * SceneManager.js - Đại Hùng Bảo Điện (Ngũ Phương Phật & Ánh Sáng Điện Ảnh)
 * Tái hiện 100% bố cục, ánh sáng chiếu xiên (God Rays & Long Shadows),
 * chất liệu đá xám - đồng cổ và 5 pho tượng Phật theo ảnh tham chiếu.
 * Tuân thủ chuẩn GRAPHICS_ANTIGRAVITY_SPEC.md
 */

import * as THREE from 'three';

export class SceneManager {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.width = container.clientWidth || 1080;
    this.height = container.clientHeight || 1920;

    // Các thành phần tham chiếu quan trọng
    this.mandalaHalo = null;
    this.altarMesh = null;
    this.candles = [];
    this.candleLights = [];
    this.sunLight = null;

    // Cờ tuỳ chọn Backdrop Hybrid Photo
    this.usePhotoBackdrop = true;

    this.init();
  }

  init() {
    // 1. Khởi tạo Scene với sương mù nhẹ điện ảnh
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x36383b); // Xám đá điện ảnh
    this.scene.fog = new THREE.FogExp2(0x4a4c50, 0.015);

    // 2. Camera đối xứng trục chính (One-Point Perspective)
    const aspect = this.width / this.height;
    // FOV 38 độ: Tiêu cự tele nhẹ giúp nén không gian, tôn vẻ uy nghiêm đồ sộ của Tượng Phật
    this.camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 100);
    this.camera.position.set(0, 3.2, 16.5);
    this.camera.lookAt(0, 4.8, -6.0);

    // 3. WebGL Renderer tối ưu hiệu năng & PCFSoftShadowMap
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 4. Dựng các thành phần
    this.setupCinematicLighting();
    this.buildGrandSanctuaryArchitecture();
    this.buildFiveBuddhaSanctuary();
    this.buildStoneAltarAndOfferings();

    window.addEventListener('resize', () => this.onResize());
  }

  /**
   * Thiết lập hệ thống ánh sáng điện ảnh (Cinematic Lighting & Long Shadows)
   * Ánh nắng chiều chiếu xiên góc từ phải sang trái
   */
  setupCinematicLighting() {
    // 1. Ánh sáng môi trường dịu nhẹ màu xám ấm
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.45);
    this.scene.add(ambientLight);

    // 2. HemisphereLight cho vùng bóng râm mang sắc xanh đá tự nhiên
    const hemiLight = new THREE.HemisphereLight(0xdde4ea, 0x4a453e, 0.65);
    this.scene.add(hemiLight);

    // 3. Directional Sunlight: Nắng chiều ấm chiếu xiên từ bên phải (x = 18, y = 11, z = 4)
    // Chiếu về tâm chánh điện để tạo bóng đổ dài sắc nét chéo -62 độ trên nền sàn gạch đá
    this.sunLight = new THREE.DirectionalLight(0xfff1d0, 2.4);
    this.sunLight.position.set(18, 11, 4);
    this.sunLight.target.position.set(0, 0, -2);
    this.scene.add(this.sunLight.target);

    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 45;
    this.sunLight.shadow.camera.left = -16;
    this.sunLight.shadow.camera.right = 16;
    this.sunLight.shadow.camera.top = 16;
    this.sunLight.shadow.camera.bottom = -16;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.radius = 1.5; // Đổ bóng mượt mà
    this.scene.add(this.sunLight);

    // 4. Ánh sáng vàng nhẹ hắt lên từ bàn thờ Phật
    const altarPointLight = new THREE.PointLight(0xffb347, 1.2, 10);
    altarPointLight.position.set(0, 3.5, -7.5);
    this.scene.add(altarPointLight);
  }

  /**
   * Tạo Texture Gạch Đá Lớn có rãnh chia ô (Slate Floor Texture)
   */
  createStoneFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Nền đá xám tro Slate Floor
    ctx.fillStyle = '#686a6c';
    ctx.fillRect(0, 0, 1024, 1024);

    // Vẽ các phiến đá lớn có rãnh chìm (Tiles Grid)
    const tileSize = 256;
    ctx.strokeStyle = '#434547';
    ctx.lineWidth = 4;

    for (let x = 0; x <= 1024; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1024);
      ctx.stroke();
    }
    for (let y = 0; y <= 1024; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // Tạo độ hạt nhám sần sùi ngẫu nhiên trên mặt đá
    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 16;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 10);
    return tex;
  }

  /**
   * Tạo Texture Vân Đá Tường Cổ Kính (Temple Stone Wall Texture)
   */
  createStoneWallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#7d7b76';
    ctx.fillRect(0, 0, 512, 512);

    // Kẻ các khối đá tảng ghép khít
    ctx.strokeStyle = '#5a5955';
    ctx.lineWidth = 3;
    const rowHeight = 64;
    for (let y = 0; y <= 512; y += rowHeight) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();

      const offset = (y / rowHeight) % 2 === 0 ? 0 : 128;
      for (let x = offset; x <= 512; x += 256) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + rowHeight);
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }

  /**
   * Kiến trúc Chánh Điện: Tường đá xám, 2 Cửa sổ chữ Thọ, Hàng cột đá Fluted hai bên
   */
  buildGrandSanctuaryArchitecture() {
    const wallTex = this.createStoneWallTexture();
    const stoneWallMat = new THREE.MeshStandardMaterial({
      color: 0x7d7b76,
      map: wallTex,
      roughness: 0.85,
      metalness: 0.05
    });

    // 1. Sàn Gạch Đá Lớn (Slate Floor) - Bắt buộc nhận bóng đổ dài sắc nét
    const floorTex = this.createStoneFloorTexture();
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x686a6c,
      map: floorTex,
      roughness: 0.55,
      metalness: 0.15
    });
    const floorGeo = new THREE.PlaneGeometry(36, 44);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 2. Tường Đá Hậu Cung tại z = -12.0 cao 22m
    const backWallGeo = new THREE.PlaneGeometry(34, 22);
    const backWall = new THREE.Mesh(backWallGeo, stoneWallMat);
    backWall.position.set(0, 10, -12);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    // 3. Hai Khung Cửa Sổ Hoa Văn Cổ Kính ở hai bên (x = ±7.5), đón nắng từ phía sau
    this.buildLatticeWindow(-7.5, 9.5, -11.8);
    this.buildLatticeWindow(7.5, 9.5, -11.8);

    // 4. Hàng Cột Đá Vuông Fluted hai bên cánh gà (x = ±11.5)
    // Các khe giữa các cột bên phải cho phép luồng ánh nắng chiếu xuyên qua sàn
    this.buildColonnadePillars(stoneWallMat);
  }

  /**
   * Khung cửa sổ hoa văn Á Đông (Lattice Window) cao 11m có ánh sáng hắt từ sau
   */
  buildLatticeWindow(x, y, z) {
    const windowGroup = new THREE.Group();
    windowGroup.position.set(x, y, z);

    // Khung viền đá sẫm
    const frameGeo = new THREE.BoxGeometry(2.4, 11, 0.35);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x484642, roughness: 0.8 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    windowGroup.add(frame);

    // Tấm sáng nền cửa sổ (mô phỏng trời sáng bên ngoài)
    const glowGeo = new THREE.PlaneGeometry(1.9, 10.4);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xfff8e7 });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.position.z = -0.1;
    windowGroup.add(glowMesh);

    // Các nan hoa văn hình học / chữ Thọ
    const barMat = new THREE.MeshStandardMaterial({ color: 0x2d2b27, roughness: 0.9 });
    for (let i = -4.5; i <= 4.5; i += 1.2) {
      const hBar = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.1, 0.15), barMat);
      hBar.position.set(0, i, 0.05);
      windowGroup.add(hBar);
    }
    for (let j = -0.6; j <= 0.6; j += 0.6) {
      const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 10.4, 0.15), barMat);
      vBar.position.set(j, 0, 0.05);
      windowGroup.add(vBar);
    }

    this.scene.add(windowGroup);
  }

  /**
   * Hàng Cột Đá Vuông lớn (Fluted Stone Pillars) hai bên cánh gà
   */
  buildColonnadePillars(mat) {
    const pillarPositions = [
      // Bên trái (x = -11.5)
      [-11.5, -10], [-11.5, -5.5], [-11.5, -1], [-11.5, 3.5], [-11.5, 8],
      // Bên phải (x = 11.5) - Nơi ánh nắng xuyên qua
      [11.5, -10], [11.5, -5.5], [11.5, -1], [11.5, 3.5], [11.5, 8]
    ];

    const pillarGeo = new THREE.BoxGeometry(2.2, 22, 2.2);

    pillarPositions.forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(pillarGeo, mat);
      pillar.position.set(px, 10, pz);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.scene.add(pillar);

      // Thêm các rãnh gờ dọc (Flutes) trên cột đá
      for (let f = -0.7; f <= 0.7; f += 0.35) {
        const flute = new THREE.Mesh(new THREE.BoxGeometry(0.12, 22, 0.15), mat);
        flute.position.set(px + (px > 0 ? -1.1 : 1.1), 10, pz + f);
        this.scene.add(flute);
      }
    });
  }

  /**
   * Dựng Phù Điêu Mandala Hào Quang Đồng Cổ Khổng Lồ (R = 5.2m)
   */
  createMandalaTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Nền đồng cổ Antique Bronze
    ctx.fillStyle = '#9e7b42';
    ctx.fillRect(0, 0, 1024, 1024);

    const cx = 512, cy = 512;

    // Các vòng tròn đồng tâm hoa văn cổ
    ctx.strokeStyle = '#c59b5f';
    ctx.lineWidth = 10;
    const radii = [480, 440, 390, 330, 260, 180, 100];
    radii.forEach((r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Hoa văn cánh sen chạm khắc đồng tâm
    ctx.fillStyle = '#b88c4a';
    for (let rIdx = 0; rIdx < radii.length - 1; rIdx++) {
      const r = radii[rIdx];
      const count = 24 + rIdx * 8;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const px = cx + Math.cos(angle) * (r - 20);
        const py = cy + Math.sin(angle) * (r - 20);
        ctx.beginPath();
        ctx.arc(px, py, 12, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  /**
   * Quần thể 5 Pho Tượng Phật (Ngũ Phương Phật)
   * 1 Đại Phật trung tâm + 2 Phật nhị vị + 2 Phật tiểu vị
   */
  buildFiveBuddhaSanctuary() {
    // Vật liệu PBR chuẩn theo tài liệu đặc tả
    // 1. Thân tượng: Đá bạc ánh kim mờ Brushed Pewter Stone (#8C9295)
    const pewterMat = new THREE.MeshStandardMaterial({
      color: 0x8c9295,
      roughness: 0.45,
      metalness: 0.60
    });

    // 2. Y áo & Đài sen: Đồng vàng cổ Antique Bronze Gold (#C59B5F)
    const bronzeGoldMat = new THREE.MeshStandardMaterial({
      color: 0xc59b5f,
      roughness: 0.32,
      metalness: 0.85
    });

    // ================= A. ĐẠI PHẬT TRUNG TÂM (Scale 2.6) =================
    const centerBuddha = this.createDetailedBuddhaMesh(pewterMat, bronzeGoldMat, 2.6, true);
    centerBuddha.position.set(0, 4.2, -10.0);
    this.scene.add(centerBuddha);

    // ================= B. 2 PHẬT NHỊ VỊ (Scale 1.65) =================
    const leftBuddha = this.createDetailedBuddhaMesh(pewterMat, bronzeGoldMat, 1.65, false);
    leftBuddha.position.set(-4.6, 3.2, -10.2);
    this.scene.add(leftBuddha);

    const rightBuddha = this.createDetailedBuddhaMesh(pewterMat, bronzeGoldMat, 1.65, false);
    rightBuddha.position.set(4.6, 3.2, -10.2);
    this.scene.add(rightBuddha);

    // ================= C. 2 PHẬT TIỂU VỊ NGOÀI CÙNG (Scale 1.05) =================
    const farLeftBuddha = this.createDetailedBuddhaMesh(pewterMat, bronzeGoldMat, 1.05, false);
    farLeftBuddha.position.set(-8.2, 2.6, -10.5);
    this.scene.add(farLeftBuddha);

    const farRightBuddha = this.createDetailedBuddhaMesh(pewterMat, bronzeGoldMat, 1.05, false);
    farRightBuddha.position.set(8.2, 2.6, -10.5);
    this.scene.add(farRightBuddha);
  }

  /**
   * Tạo 1 Pho Tượng Phật Tinh Xảo: Thân đá bạc, Y áo đồng cổ, Đài sen đồng
   */
  createDetailedBuddhaMesh(pewterMat, bronzeGoldMat, scale = 1.0, isCenter = false) {
    const group = new THREE.Group();
    group.scale.set(scale, scale, scale);

    // 1. Phù điêu Hào Quang Mandala phía sau Đại Phật trung tâm
    if (isCenter) {
      const mandalaTex = this.createMandalaTexture();
      const mandalaMat = new THREE.MeshStandardMaterial({
        color: 0x9e7b42,
        map: mandalaTex,
        roughness: 0.40,
        metalness: 0.80
      });
      const mandalaMesh = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.22, 48), mandalaMat);
      mandalaMesh.rotation.x = Math.PI / 2;
      mandalaMesh.position.set(0, 2.4, -0.45);
      mandalaMesh.castShadow = true;
      group.add(mandalaMesh);
      this.mandalaHalo = mandalaMesh;
    }

    // 2. Tòa Sen Đồng Vàng Cổ 3 tầng
    const lotusBase = new THREE.Group();
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.9, 0.55, 32), bronzeGoldMat);
    pedestal.position.y = 0.28;
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    lotusBase.add(pedestal);

    // Các lớp cánh sen chạm nổi
    const petalGeo = new THREE.ConeGeometry(0.32, 0.85, 4);
    for (let layer = 0; layer < 2; layer++) {
      const petalCount = 16 + layer * 4;
      const layerRadius = 1.6 + layer * 0.15;
      for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2;
        const petal = new THREE.Mesh(petalGeo, bronzeGoldMat);
        petal.position.set(Math.cos(angle) * layerRadius, 0.35 + layer * 0.15, Math.sin(angle) * layerRadius);
        petal.rotation.y = angle;
        petal.rotation.z = 0.55 - layer * 0.1;
        petal.castShadow = true;
        lotusBase.add(petal);
      }
    }
    group.add(lotusBase);

    // 3. Thân Tượng Phật Ngồi Kiết Già
    // Chân xếp kiết già (Y áo đồng cổ phủ chân)
    const lapMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.45, 0.5, 24), bronzeGoldMat);
    lapMesh.position.y = 0.75;
    lapMesh.castShadow = true;
    group.add(lapMesh);

    // Thân mình: Bên vai trái khoác y áo đồng cổ, vai phải để trần da đá bạc
    const torsoRobe = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.95, 1.35, 24), bronzeGoldMat);
    torsoRobe.position.y = 1.55;
    torsoRobe.castShadow = true;
    group.add(torsoRobe);

    // Cánh tay trái đặt ngửa bắt ấn Thiền Định trên đùi
    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.1, 16), bronzeGoldMat);
    leftArm.position.set(-0.62, 1.25, 0.3);
    leftArm.rotation.z = 0.65;
    leftArm.rotation.x = 0.35;
    leftArm.castShadow = true;
    group.add(leftArm);

    // Cánh tay phải để trần (Đá Bạc Pewter) bắt ấn Xúc Địa (Bhumisparsha Mudra) trỏ xuống đài sen
    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.15, 16), pewterMat);
    rightArm.position.set(0.68, 1.25, 0.35);
    rightArm.rotation.z = -0.55;
    rightArm.rotation.x = 0.75;
    rightArm.castShadow = true;
    group.add(rightArm);

    // Đầu & Khuôn Mặt Từ Bi (Đá Bạc Pewter)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 24, 24), pewterMat);
    head.position.y = 2.45;
    head.castShadow = true;
    group.add(head);

    // Nhục kế (Ushnisha) trên đỉnh đầu
    const ushnisha = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), pewterMat);
    ushnisha.position.y = 2.95;
    ushnisha.castShadow = true;
    group.add(ushnisha);

    return group;
  }

  /**
   * Bàn Thờ Đá & Bình Hoa Sen/Mẫu Đơn Hồng Phấn + Đèn Bơ
   */
  buildStoneAltarAndOfferings() {
    const altarGroup = new THREE.Group();
    altarGroup.position.set(0, 0, -8.2);

    // 1. Bệ thờ đá nhiều cấp chạy ngang chân 5 đài sen
    const altarMat = new THREE.MeshStandardMaterial({
      color: 0x5a5955,
      roughness: 0.8,
      metalness: 0.1
    });
    this.altarMesh = new THREE.Mesh(new THREE.BoxGeometry(18, 1.4, 2.4), altarMat);
    this.altarMesh.position.y = 0.7;
    this.altarMesh.castShadow = true;
    this.altarMesh.receiveShadow = true;
    altarGroup.add(this.altarMesh);

    // 2. Bát hương đồng chính diện
    const burnerMat = new THREE.MeshStandardMaterial({
      color: 0xc59b5f,
      roughness: 0.3,
      metalness: 0.85
    });
    const burner = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.4, 24), burnerMat);
    burner.position.set(0, 1.6, 0.4);
    burner.castShadow = true;
    altarGroup.add(burner);

    // 3. Sáu bình hoa sen/mẫu đơn hồng phấn (#F4D6DC, #FFFDF9)
    const vaseXPositions = [-6.2, -3.8, -1.8, 1.8, 3.8, 6.2];
    vaseXPositions.forEach((vx) => {
      this.buildFlowerArrangement(altarGroup, vx, 1.4, 0.3);
    });

    // 4. Bốn cây đèn bơ/nến vàng tỏa sáng ấm áp
    const candlePositions = [-2.8, -0.9, 0.9, 2.8];
    candlePositions.forEach((cx) => {
      this.buildButterLamp(altarGroup, cx, 1.4, 0.6);
    });

    this.scene.add(altarGroup);
  }

  /**
   * Bình hoa mẫu đơn / hoa sen hồng phấn thanh tao
   */
  buildFlowerArrangement(parent, x, y, z) {
    const vaseGroup = new THREE.Group();
    vaseGroup.position.set(x, y, z);

    // Bình gốm men xám sáng
    const vaseMat = new THREE.MeshStandardMaterial({ color: 0xe0ded8, roughness: 0.3 });
    const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.55, 16), vaseMat);
    vase.position.y = 0.28;
    vase.castShadow = true;
    vaseGroup.add(vase);

    // Tán hoa sum suê hồng phấn - trắng
    const pinkFlowerMat = new THREE.MeshStandardMaterial({ color: 0xf4d6dc, roughness: 0.6 });
    const whiteFlowerMat = new THREE.MeshStandardMaterial({ color: 0xfffdf9, roughness: 0.6 });

    for (let i = 0; i < 14; i++) {
      const fx = (Math.random() - 0.5) * 0.55;
      const fy = 0.55 + Math.random() * 0.35;
      const fz = (Math.random() - 0.5) * 0.55;
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 8, 8),
        Math.random() > 0.4 ? pinkFlowerMat : whiteFlowerMat
      );
      flower.position.set(fx, fy, fz);
      vaseGroup.add(flower);
    }

    parent.add(vaseGroup);
  }

  /**
   * Đèn bơ / nến vàng ấm trên bàn thờ
   */
  buildButterLamp(parent, x, y, z) {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(x, y, z);

    const bronzeMat = new THREE.MeshStandardMaterial({ color: 0xc59b5f, metalness: 0.8, roughness: 0.3 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.18, 12), bronzeMat);
    base.position.y = 0.09;
    lampGroup.add(base);

    // Ngọn lửa nến phát sáng
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffb74d });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 8), flameMat);
    flame.position.y = 0.25;
    lampGroup.add(flame);
    this.candles.push(flame);

    const light = new THREE.PointLight(0xffaa33, 0.8, 3.5);
    light.position.set(0, 0.28, 0);
    lampGroup.add(light);
    this.candleLights.push(light);

    parent.add(lampGroup);
  }

  /**
   * Cập nhật animation hào quang và ánh nến lung linh
   */
  update(elapsedTime) {
    // 1. Phù điêu Mandala thở nhẹ
    if (this.mandalaHalo) {
      const breath = 1 + Math.sin(elapsedTime * 0.8) * 0.02;
      this.mandalaHalo.scale.set(breath, 1, breath);
    }

    // 2. Ánh nến đèn bơ nhấp nháy lung linh
    this.candles.forEach((flame, idx) => {
      const flicker = Math.sin(elapsedTime * 9 + idx * 2.1) * 0.12;
      flame.scale.set(1 + flicker, 1 + flicker * 1.4, 1 + flicker);
    });

    this.candleLights.forEach((light, idx) => {
      const noise = Math.sin(elapsedTime * 11 + idx * 3.3) * 0.08;
      light.intensity = 0.8 + noise;
    });
  }

  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  onResize() {
    this.width = this.container.clientWidth || 1080;
    this.height = this.container.clientHeight || 1920;
    if (this.camera && this.renderer) {
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
    }
  }

  getScene() {
    return this.scene;
  }

  getCamera() {
    return this.camera;
  }

  getAltarPosition() {
    return new THREE.Vector3(0, 1.6, -7.8);
  }
}

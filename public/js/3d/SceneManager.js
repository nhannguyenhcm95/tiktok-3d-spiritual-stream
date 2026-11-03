/**
 * SceneManager.js - Chánh Điện Hoàng Kim 2.5D/3D Layered (Chuẩn TikTok Live Stream)
 * Tuyệt đối không dùng ảnh nền tĩnh có sẵn người!
 * Dựng Chánh Điện tráng lệ: Phù điêu Mandala vàng đồng phát sáng, Tượng Phật Vàng ngồi đài sen
 * vẽ bằng Canvas Procedural High-Res sắc nét, Bàn thờ, Lư hương đồng tỏa khói,
 * 2 bình hoa sứ sum suê, Thảm Đỏ Hoa Sen chính giữa và 4 Đệm Ngồi VIP hàng đầu.
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
    this.altarGroup = null;
    this.incenseBurnerPos = new THREE.Vector3(0, 1.35, -2.8);
    this.candles = [];
    this.candleLights = [];
    this.buddhaMeshCenter = null;
    this.vipCushions = [];

    this.init();
  }

  init() {
    // 1. Scene nền màu nâu vàng hoàng kim ấm áp
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a0d05);
    this.scene.fog = new THREE.FogExp2(0x1a0d05, 0.016);

    // 2. Camera đối xứng trục chính tỷ lệ dọc 9:16 nhìn thẳng vào tượng Phật và thảm đỏ
    const aspect = this.width / this.height;
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);
    this.camera.position.set(0, 3.8, 11.5);
    this.camera.lookAt(0, 3.2, -3.2);

    // 3. WebGL Renderer tối ưu hiệu năng 60 FPS
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 4. Dựng hệ thống ánh sáng hoàng kim
    this.setupGoldenLighting();

    // 5. Dựng Kiến Trúc Chánh Điện (Vách hậu, Rèm đỏ, Cột gỗ lim)
    this.buildHallArchitecture();

    // 6. Dựng Quần Thể Tượng Phật Vàng (Vẽ bằng Canvas 2D High-Resolution Procedural Relief)
    this.buildGoldenBuddhaSanctuary();

    // 7. Dựng Bàn Thờ, Lư Hương Đồng, 2 Bình Hoa Sứ Trắng & Nến Vàng
    this.buildAltarAndVessels();

    // 8. Dựng Sàn Đá Mun, Thảm Đỏ Hoa Sen & 4 Đệm Ngồi VIP Hàng Đầu
    this.buildFloorAndLotusCarpet();

    window.addEventListener('resize', () => this.onResize());
  }

  /**
   * Thiết lập hệ thống ánh sáng hoàng kim thiêng liêng ấm áp
   */
  setupGoldenLighting() {
    // Ánh sáng môi trường vàng cam ấm
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.85);
    this.scene.add(ambientLight);

    // HemisphereLight cho bóng râm ấm sắc nâu vàng
    const hemiLight = new THREE.HemisphereLight(0xffdf99, 0x3d1d11, 0.75);
    this.scene.add(hemiLight);

    // Ánh sáng chính diện từ trên cao rọi vào tượng Phật và thảm đỏ
    const mainLight = new THREE.DirectionalLight(0xffe488, 2.2);
    mainLight.position.set(0, 14, 6);
    mainLight.target.position.set(0, 2, -3);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.bias = -0.001;
    this.scene.add(mainLight);
    this.scene.add(mainLight.target);

    // Ánh sáng từ phía sau tượng Phật tạo hiệu ứng hào quang ven viền
    const rimLight = new THREE.DirectionalLight(0xffa500, 1.6);
    rimLight.position.set(0, 8, -6);
    this.scene.add(rimLight);

    // Đèn điểm ấm tại Lư hương trung tâm
    this.altarPointLight = new THREE.PointLight(0xff9900, 2.0, 8);
    this.altarPointLight.position.set(0, 2.0, -2.8);
    this.scene.add(this.altarPointLight);
  }

  /**
   * Kiến trúc Chánh Điện: Vách hậu chạm khắc, Cột lim và Rèm nhung đỏ viền tua rua vàng
   */
  buildHallArchitecture() {
    // Vách hậu bàn thờ chạm trổ vàng ấm
    const wallGeo = new THREE.PlaneGeometry(30, 20);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x2b1307,
      roughness: 0.75,
      metalness: 0.25
    });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 9, -5.5);
    this.scene.add(backWall);

    // Hai cột gỗ lim lớn ở hai bên cánh gà
    const colGeo = new THREE.CylinderGeometry(0.65, 0.65, 20, 24);
    const colMat = new THREE.MeshStandardMaterial({
      color: 0x3a170b,
      roughness: 0.45,
      metalness: 0.15
    });
    const leftCol = new THREE.Mesh(colGeo, colMat);
    leftCol.position.set(-5.6, 9, -2.0);
    this.scene.add(leftCol);

    const rightCol = new THREE.Mesh(colGeo, colMat);
    rightCol.position.set(5.6, 9, -2.0);
    this.scene.add(rightCol);

    // Rèm nhung đỏ viền tua rua vàng hai góc trên màn hình chuẩn phong cách livestream
    const curtainMat = new THREE.MeshStandardMaterial({
      color: 0x8a1518, // Đỏ nhung hoàng gia
      roughness: 0.6,
      side: THREE.DoubleSide
    });
    const fringeMat = new THREE.MeshStandardMaterial({
      color: 0xffd700, // Vàng kim tua rua
      metalness: 0.8,
      roughness: 0.2
    });

    // Rèm trái
    const leftCurtain = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 2.4, 5.5, 16, 1, true, 0, Math.PI), curtainMat);
    leftCurtain.position.set(-4.2, 8.5, 2.5);
    leftCurtain.rotation.z = 0.35;
    this.scene.add(leftCurtain);

    // Rèm phải
    const rightCurtain = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 2.4, 5.5, 16, 1, true, 0, Math.PI), curtainMat);
    rightCurtain.position.set(4.2, 8.5, 2.5);
    rightCurtain.rotation.z = -0.35;
    this.scene.add(rightCurtain);

    // Dải tua rua treo ngang phía trên
    const swagGeo = new THREE.TorusGeometry(5.2, 0.12, 8, 32, Math.PI * 0.7);
    const swag = new THREE.Mesh(swagGeo, fringeMat);
    swag.position.set(0, 9.2, 1.8);
    swag.rotation.z = Math.PI * 0.85;
    this.scene.add(swag);
  }

  /**
   * Tạo Texture Phù Điêu Mandala Đồng Cổ Phát Sáng Bằng Canvas 2D
   */
  createMandalaTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    const cx = 512, cy = 512;

    // Nền tối trong suốt
    ctx.clearRect(0, 0, 1024, 1024);

    // Hào quang vàng phát sáng từ tâm
    const radialGlow = ctx.createRadialGradient(cx, cy, 60, cx, cy, 490);
    radialGlow.addColorStop(0, 'rgba(255, 235, 120, 0.95)');
    radialGlow.addColorStop(0.3, 'rgba(217, 155, 38, 0.85)');
    radialGlow.addColorStop(0.7, 'rgba(160, 100, 20, 0.45)');
    radialGlow.addColorStop(1, 'rgba(160, 100, 20, 0)');
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, 1024, 1024);

    // Các vòng tròn hoa văn đồng tâm
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 6;
    const rings = [460, 420, 370, 310, 240, 160, 90];
    rings.forEach((r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // 24 Cánh sen mandala chạm nổi xung quanh
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const x1 = cx + Math.cos(angle) * 320;
      const y1 = cy + Math.sin(angle) * 320;
      const x2 = cx + Math.cos(angle) * 450;
      const y2 = cy + Math.sin(angle) * 450;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(
        cx + Math.cos(angle + 0.12) * 390,
        cy + Math.sin(angle + 0.12) * 390,
        x2,
        y2
      );
      ctx.quadraticCurveTo(
        cx + Math.cos(angle - 0.12) * 390,
        cy + Math.sin(angle - 0.12) * 390,
        x1,
        y1
      );
      ctx.fillStyle = 'rgba(255, 215, 0, 0.75)';
      ctx.fill();
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  /**
   * Vẽ Tượng Phật Vàng Ngồi Đài Sen Tinh Xảo Bằng HTML5 Canvas 2D
   * (High-Resolution Procedural Relief - Không dùng hình hộp hay hình cầu thô sơ)
   */
  createBuddhaReliefTexture(isCenter = true) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 1024, 1024);
    const cx = 512;

    // 1. Tòa Sen Vàng Nhiều Tầng Cánh (Lotus Throne) ở phía dưới (y: 680 -> 940)
    const baseGradient = ctx.createLinearGradient(0, 680, 0, 940);
    baseGradient.addColorStop(0, '#ffd54f');
    baseGradient.addColorStop(0.5, '#b8860b');
    baseGradient.addColorStop(1, '#664400');

    // Tầng đế sen
    ctx.fillStyle = baseGradient;
    ctx.beginPath();
    ctx.ellipse(cx, 880, 360, 70, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff1a8';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Các cánh sen vàng nở rộ 2 lớp
    const drawPetal = (px, py, w, h, tilt) => {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(tilt);
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.quadraticCurveTo(w / 2, 0, 0, -h / 2);
      ctx.quadraticCurveTo(-w / 2, 0, 0, h / 2);
      ctx.fillStyle = '#ffcf40';
      ctx.fill();
      ctx.strokeStyle = '#fff4b8';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    };

    // Lớp cánh sen sau
    for (let i = -5; i <= 5; i++) {
      drawPetal(cx + i * 62, 820, 75, 110, (i * 8 * Math.PI) / 180);
    }
    // Lớp cánh sen trước
    for (let i = -4; i <= 4; i++) {
      drawPetal(cx + i * 68, 850, 85, 125, (i * 7 * Math.PI) / 180);
    }

    // 2. Chân Tượng Phật Ngồi Xếp Bằng Kiết Già (y: 640 -> 780)
    ctx.fillStyle = '#e6a817';
    ctx.beginPath();
    ctx.ellipse(cx, 720, 280, 80, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.stroke();

    // 3. Thân Tượng & Y Áo Cà Sa Vàng Hoàng Kim (y: 360 -> 680)
    const robeGrad = ctx.createLinearGradient(cx - 200, 360, cx + 200, 680);
    robeGrad.addColorStop(0, '#ffe066');
    robeGrad.addColorStop(0.4, '#e6a817');
    robeGrad.addColorStop(1, '#996500');

    ctx.fillStyle = robeGrad;
    ctx.beginPath();
    // Thân áo hình tháp trang nghiêm
    ctx.moveTo(cx - 160, 680);
    ctx.lineTo(cx - 130, 430); // Vai trái
    ctx.quadraticCurveTo(cx - 60, 370, cx, 380); // Cổ
    ctx.quadraticCurveTo(cx + 60, 370, cx + 130, 430); // Vai phải
    ctx.lineTo(cx + 160, 680);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Nếp gấp vải cà sa vắt chéo mềm mại từ vai trái xuống hông
    ctx.strokeStyle = '#ffe894';
    ctx.lineWidth = 6;
    for (let f = 0; f < 5; f++) {
      ctx.beginPath();
      ctx.moveTo(cx - 110 + f * 12, 440 + f * 25);
      ctx.quadraticCurveTo(cx - 30, 520 + f * 25, cx + 120 - f * 15, 620 + f * 10);
      ctx.stroke();
    }

    // Chữ VẠN (Sauvastika) vàng nổi bật giữa ngực
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.strokeRect(cx - 18, 470, 36, 36);

    // 4. Hai Cánh Tay Bắt Ấn Thiền Định trên đùi
    ctx.fillStyle = '#ffcf40';
    ctx.beginPath();
    ctx.ellipse(cx, 630, 85, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 5. Cổ, Khuôn Mặt Từ Bi & Nhục Kế (Ushnisha) (y: 180 -> 380)
    const faceGrad = ctx.createRadialGradient(cx, 280, 20, cx, 280, 110);
    faceGrad.addColorStop(0, '#fff4b8');
    faceGrad.addColorStop(0.7, '#f5c542');
    faceGrad.addColorStop(1, '#b8860b');

    // Cổ 3 ngấn cát tường
    ctx.fillStyle = faceGrad;
    ctx.fillRect(cx - 38, 340, 76, 45);

    // Khuôn mặt trái xoan phúc hậu
    ctx.beginPath();
    ctx.ellipse(cx, 275, 95, 115, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffe066';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Đôi tai dài chấm vai
    ctx.beginPath();
    ctx.ellipse(cx - 105, 285, 14, 45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx + 105, 285, 14, 45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Tóc xoắn ốc & Nhục kế đỉnh đầu
    ctx.fillStyle = '#b8860b';
    ctx.beginPath();
    ctx.arc(cx, 160, 38, 0, Math.PI * 2);
    ctx.fill();

    // Viên ngọc báu đỉnh nhục kế phát sáng
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, 135, 12, 0, Math.PI * 2);
    ctx.fill();

    // Đường nét từ bi: Chân mày cong, mắt nhắm hờ tịnh tâm, nụ cười an lạc
    ctx.strokeStyle = '#5a3805';
    ctx.lineWidth = 4;
    // Chân mày
    ctx.beginPath();
    ctx.arc(cx - 36, 255, 25, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 36, 255, 25, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();

    // Mắt khép hờ
    ctx.beginPath();
    ctx.arc(cx - 36, 275, 18, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 36, 275, 18, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Ấn đường (Bạch hào)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, 245, 6, 0, Math.PI * 2);
    ctx.fill();

    // Miệng mỉm cười hoan hỷ
    ctx.beginPath();
    ctx.arc(cx, 320, 22, 0.2, Math.PI - 0.2);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  /**
   * Dựng Quần Thể Tượng Phật Vàng (Đại Phật trung tâm + 2 tượng phụ)
   */
  buildGoldenBuddhaSanctuary() {
    const sanctuaryGroup = new THREE.Group();
    sanctuaryGroup.position.set(0, 0, -4.8);

    // 1. Phù điêu Hào Quang Mandala vàng đồng phát sáng phía sau Đại Phật
    const mandalaTex = this.createMandalaTexture();
    const mandalaMat = new THREE.MeshBasicMaterial({
      map: mandalaTex,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.mandalaHalo = new THREE.Mesh(new THREE.PlaneGeometry(9.2, 9.2), mandalaMat);
    this.mandalaHalo.position.set(0, 5.2, -0.4);
    sanctuaryGroup.add(this.mandalaHalo);

    // 2. Pho Đại Phật Trung Tâm (High-Resolution Procedural Relief Mesh)
    const centerBuddhaTex = this.createBuddhaReliefTexture(true);
    const centerBuddhaMat = new THREE.MeshStandardMaterial({
      map: centerBuddhaTex,
      transparent: true,
      alphaTest: 0.05,
      roughness: 0.35,
      metalness: 0.45,
      side: THREE.FrontSide
    });
    this.buddhaMeshCenter = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 6.4), centerBuddhaMat);
    this.buddhaMeshCenter.position.set(0, 4.4, 0);
    sanctuaryGroup.add(this.buddhaMeshCenter);

    // 3. Hai Pho Tượng Phật Nhị Vị Hai Bên
    const sideBuddhaTex = this.createBuddhaReliefTexture(false);
    const sideBuddhaMat = new THREE.MeshStandardMaterial({
      map: sideBuddhaTex,
      transparent: true,
      alphaTest: 0.05,
      roughness: 0.4,
      metalness: 0.4,
      side: THREE.FrontSide
    });

    // Tượng phụ bên trái
    const leftBuddha = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), sideBuddhaMat);
    leftBuddha.position.set(-3.8, 3.6, -0.15);
    sanctuaryGroup.add(leftBuddha);

    // Tượng phụ bên phải
    const rightBuddha = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), sideBuddhaMat);
    rightBuddha.position.set(3.8, 3.6, -0.15);
    sanctuaryGroup.add(rightBuddha);

    this.scene.add(sanctuaryGroup);
  }

  /**
   * Bàn Thờ Gỗ Chạm Trổ, Lư Hương Đồng Tỏa Khói, 2 Bình Sứ Hoa Sum Suê & Hàng Nến Vàng
   */
  buildAltarAndVessels() {
    this.altarGroup = new THREE.Group();
    this.altarGroup.position.set(0, 0, -3.2);

    // 1. Thân Bàn Thờ gỗ mun viền thếp vàng
    const altarMat = new THREE.MeshStandardMaterial({
      color: 0x4a2511, // Nâu gỗ mun
      roughness: 0.45,
      metalness: 0.25
    });
    const altarBody = new THREE.Mesh(new THREE.BoxGeometry(8.4, 1.4, 2.2), altarMat);
    altarBody.position.y = 0.7;
    altarBody.castShadow = true;
    altarBody.receiveShadow = true;
    this.altarGroup.add(altarBody);

    // Đường viền vàng thếp mặt bàn
    const goldTrim = new THREE.Mesh(
      new THREE.BoxGeometry(8.6, 0.12, 2.35),
      new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 })
    );
    goldTrim.position.y = 1.42;
    this.altarGroup.add(goldTrim);

    // 2. Lư Hương Đồng Chính Diện tỏa sáng
    const burnerGroup = new THREE.Group();
    burnerGroup.position.set(0, 1.48, 0.4);

    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0xd99b38,
      metalness: 0.85,
      roughness: 0.25
    });
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.42, 0.45, 24), bronzeMat);
    burnerGroup.add(pot);

    // Tro hương vàng cát
    const ash = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.05, 24), new THREE.MeshBasicMaterial({ color: 0x997744 }));
    ash.position.y = 0.2;
    burnerGroup.add(ash);

    // 3 Nén nhang phát sáng cắm trong lư hương
    const stickMat = new THREE.MeshBasicMaterial({ color: 0x991111 });
    const emberMat = new THREE.MeshBasicMaterial({ color: 0xff4500 });
    [-0.07, 0, 0.07].forEach((ox, idx) => {
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.5, 6), stickMat);
      stick.position.set(ox, 0.4, 0);
      burnerGroup.add(stick);

      const ember = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), emberMat);
      ember.position.set(ox, 0.65, 0);
      burnerGroup.add(ember);
    });

    this.altarGroup.add(burnerGroup);

    // 3. Hai Bình Sứ Trắng Cắm Hoa Sen / Cúc Sum Suê
    this.buildFlowerVase(-3.0, 1.48, 0);
    this.buildFlowerVase(3.0, 1.48, 0);

    // 4. Hàng Nến Vàng Lung Linh
    [-1.6, -1.0, 1.0, 1.6].forEach((cx) => {
      this.buildCandle(cx, 1.48, 0.35);
    });

    this.scene.add(this.altarGroup);
  }

  /**
   * Bình sứ cắm hoa sum suê
   */
  buildFlowerVase(x, y, z) {
    const vaseGroup = new THREE.Group();
    vaseGroup.position.set(x, y, z);

    // Thân bình sứ trắng ngọc
    const vaseMat = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.2, metalness: 0.1 });
    const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.22, 0.85, 16), vaseMat);
    vase.position.y = 0.42;
    vaseGroup.add(vase);

    // Tán hoa sen / cúc sum suê
    const flowerWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const flowerYellow = new THREE.MeshStandardMaterial({ color: 0xffd54f, roughness: 0.5 });
    const leafGreen = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.6 });

    for (let i = 0; i < 20; i++) {
      const fx = (Math.random() - 0.5) * 0.75;
      const fy = 0.85 + Math.random() * 0.55;
      const fz = (Math.random() - 0.5) * 0.75;
      const bl = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        Math.random() > 0.4 ? flowerWhite : flowerYellow
      );
      bl.position.set(fx, fy, fz);
      vaseGroup.add(bl);
    }

    for (let i = 0; i < 12; i++) {
      const lx = (Math.random() - 0.5) * 0.85;
      const ly = 0.75 + Math.random() * 0.4;
      const lz = (Math.random() - 0.5) * 0.85;
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.25, 4), leafGreen);
      leaf.position.set(lx, ly, lz);
      vaseGroup.add(leaf);
    }

    this.altarGroup.add(vaseGroup);
  }

  /**
   * Cây nến đồng có ngọn lửa phát sáng
   */
  buildCandle(x, y, z) {
    const candleGroup = new THREE.Group();
    candleGroup.position.set(x, y, z);

    const bronzeMat = new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.8, roughness: 0.2 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.18, 12), bronzeMat);
    base.position.y = 0.09;
    candleGroup.add(base);

    const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 12), new THREE.MeshStandardMaterial({ color: 0xd32f2f }));
    wax.position.y = 0.35;
    candleGroup.add(wax);

    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 8), flameMat);
    flame.position.y = 0.62;
    candleGroup.add(flame);
    this.candles.push(flame);

    const light = new THREE.PointLight(0xff9900, 0.6, 2.5);
    light.position.set(0, 0.65, 0);
    candleGroup.add(light);
    this.candleLights.push(light);

    this.altarGroup.add(candleGroup);
  }

  /**
   * Tạo CanvasTexture Thảm Đỏ Hoa Sen Chính Giữa (Nền #8b1a1a, Viền Vàng, Hoa Sen Nở Rộ)
   */
  createLotusCarpetTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');

    // Nền đỏ thẫm gấm nhung
    ctx.fillStyle = '#8b1a1a';
    ctx.fillRect(0, 0, 512, 2048);

    // Viền vàng kim 2 bên mép thảm
    ctx.fillStyle = '#f5c542';
    ctx.fillRect(16, 0, 18, 2048);
    ctx.fillRect(512 - 34, 0, 18, 2048);

    // Họa tiết hoa sen vàng nở rộ nối tiếp nhau dọc giữa thảm
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    for (let y = 90; y < 2048; y += 180) {
      this.drawCarpetLotusPattern(ctx, 256, y, 58);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  drawCarpetLotusPattern(ctx, cx, cy, radius) {
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // 8 Cánh sen vàng bung nở
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      const x1 = Math.cos(angle) * radius * 0.4;
      const y1 = Math.sin(angle) * radius * 0.4;
      const x2 = Math.cos(angle) * radius;
      const y2 = Math.sin(angle) * radius;
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(
        Math.cos(angle + 0.3) * radius * 0.9,
        Math.sin(angle + 0.3) * radius * 0.9,
        x2,
        y2
      );
      ctx.quadraticCurveTo(
        Math.cos(angle - 0.3) * radius * 0.9,
        Math.sin(angle - 0.3) * radius * 0.9,
        x1,
        y1
      );
      ctx.fillStyle = 'rgba(255, 235, 120, 0.85)';
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Sàn Đá Mun, Thảm Đỏ Hoa Sen & 4 Đệm Ngồi VIP Hàng Đầu
   */
  buildFloorAndLotusCarpet() {
    // 1. Sàn Gỗ Mun Bóng Trầm
    const floorGeo = new THREE.PlaneGeometry(32, 40);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x3d1d11, // Gỗ mun bóng
      roughness: 0.35,
      metalness: 0.15
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 2);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 2. Thảm Đỏ Hoa Sen Ở Chính Giữa (Center Red Carpet)
    const carpetTex = this.createLotusCarpetTexture();
    const carpetGeo = new THREE.PlaneGeometry(2.6, 24);
    const carpetMat = new THREE.MeshStandardMaterial({
      map: carpetTex,
      roughness: 0.75,
      metalness: 0.15
    });
    const carpet = new THREE.Mesh(carpetGeo, carpetMat);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(0, 0.02, 3.8); // Trải dài từ trước bàn thờ về đáy màn hình
    carpet.receiveShadow = true;
    this.scene.add(carpet);

    // 3. Bốn Chiếc Đệm Ngồi VIP Hàng Đầu (Tọa cụ đỏ thêu viền vàng)
    const cushionPositions = [
      { x: -2.3, z: -1.0, rank: 1 },
      { x: -1.5, z: -1.0, rank: 2 },
      { x: 1.5, z: -1.0, rank: 3 },
      { x: 2.3, z: -1.0, rank: 4 }
    ];

    const cushionGeo = new THREE.CylinderGeometry(0.42, 0.45, 0.12, 24);
    const cushionMat = new THREE.MeshStandardMaterial({
      color: 0x9b1b1e, // Đỏ tươi viền vàng
      roughness: 0.6,
      metalness: 0.1
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.85,
      roughness: 0.2
    });

    cushionPositions.forEach((pos) => {
      const cushionGroup = new THREE.Group();
      cushionGroup.position.set(pos.x, 0.06, pos.z);

      const cushion = new THREE.Mesh(cushionGeo, cushionMat);
      cushionGroup.add(cushion);

      const trim = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.02, 8, 24), goldTrimMat);
      trim.rotation.x = Math.PI / 2;
      trim.position.y = 0.055;
      cushionGroup.add(trim);

      this.scene.add(cushionGroup);
      this.vipCushions.push(cushionGroup);
    });
  }

  /**
   * Cập nhật animation hào quang và ánh nến
   */
  update(elapsedTime) {
    // 1. Phù điêu Hào Quang Mandala vàng đồng xoay nhẹ và thở
    if (this.mandalaHalo) {
      const breath = 1 + Math.sin(elapsedTime * 1.2) * 0.035;
      this.mandalaHalo.scale.set(breath, breath, 1);
      this.mandalaHalo.rotation.z = Math.sin(elapsedTime * 0.15) * 0.05;
    }

    // 2. Đại Phật trung tâm tỏa ánh sáng vàng
    if (this.buddhaMeshCenter) {
      const breath = 1 + Math.sin(elapsedTime * 1.0) * 0.015;
      this.buddhaMeshCenter.scale.set(breath, breath, 1);
    }

    // 3. Ánh nến lung linh
    this.candles.forEach((flame, idx) => {
      const flicker = Math.sin(elapsedTime * 9 + idx * 2.2) * 0.15;
      flame.scale.set(1 + flicker, 1 + flicker * 1.5, 1 + flicker);
    });

    this.candleLights.forEach((light, idx) => {
      const noise = Math.sin(elapsedTime * 12 + idx * 3.5) * 0.1;
      light.intensity = 0.6 + noise;
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
    return this.incenseBurnerPos;
  }
}

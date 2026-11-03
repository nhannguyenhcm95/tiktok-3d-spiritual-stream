/**
 * SceneManager.js - Chánh Điện Hoàng Kim 9:16
 * Thiết lập góc máy cố định đối xứng, Tượng Phật Thích Ca/A Di Đà vàng rực rỡ,
 * Bàn thờ, Lư hương đồng, Hàng nến, Bình hoa và Thảm đỏ hoa sen.
 * Tuân thủ chuẩn CONTRACT.md & Role 02
 */

import * as THREE from 'three';

export class SceneManager {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Chiều rộng, chiều cao container
    this.width = container.clientWidth || 1080;
    this.height = container.clientHeight || 1920;

    // Các thành phần tham chiếu quan trọng
    this.altarMesh = null;
    this.incenseBurner = null;
    this.buddhaHalo = null;
    this.candles = [];
    this.candleLights = [];

    this.init();
  }

  init() {
    // 1. Khởi tạo Scene với sương mù ấm Chánh Điện
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a0d05); // Nâu đen hoàng kim ấm
    this.scene.fog = new THREE.FogExp2(0x1a0d05, 0.018);

    // 2. Camera đối xứng cố định tỷ lệ 9:16 (nhìn từ sau đám đông hướng thẳng về tượng Phật)
    const aspect = this.width / this.height;
    this.camera = new THREE.PerspectiveCamera(48, aspect, 0.1, 100);
    // Đặt camera hơi cao nhìn xuống bao quát thảm đỏ và hướng lên bàn thờ Phật
    this.camera.position.set(0, 4.2, 12.5);
    this.camera.lookAt(0, 3.2, -2.5);

    // 3. WebGL Renderer tối ưu cho livestream
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

    // 4. Dựng các thành phần không gian
    this.setupLighting();
    this.buildHallArchitecture();
    this.buildBuddhaStatue();
    this.buildAltarAndVessels();
    this.buildCenterRedCarpet();

    window.addEventListener('resize', () => this.onResize());
  }

  /**
   * Thiết lập hệ thống ánh sáng hoàng kim thiêng liêng
   */
  setupLighting() {
    // Ánh sáng môi trường vàng ấm
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.85);
    this.scene.add(ambientLight);

    // Ánh sáng chính diện từ trên cao rọi vào tượng Phật
    const mainDirLight = new THREE.DirectionalLight(0xffdf88, 1.8);
    mainDirLight.position.set(0, 15, 8);
    mainDirLight.castShadow = true;
    mainDirLight.shadow.mapSize.width = 1024;
    mainDirLight.shadow.mapSize.height = 1024;
    mainDirLight.shadow.bias = -0.001;
    this.scene.add(mainDirLight);

    // Ánh sáng từ phía sau tượng Phật tạo hiệu ứng hào quang ven viền (Rim Light)
    const backRimLight = new THREE.DirectionalLight(0xffaa33, 1.4);
    backRimLight.position.set(0, 8, -6);
    this.scene.add(backRimLight);

    // Đèn điểm tỏa sáng tại Lư hương trung tâm
    this.incensePointLight = new THREE.PointLight(0xff9922, 2.0, 8);
    this.incensePointLight.position.set(0, 2.3, -1.8);
    this.scene.add(this.incensePointLight);
  }

  /**
   * Kiến trúc Chánh Điện: Sàn gỗ gụ trầm, Vách hậu chạm trổ, Cột lim và Rèm nhung đỏ viền tua rua
   */
  buildHallArchitecture() {
    // Sàn chánh điện (gỗ bóng phản chiếu ánh vàng)
    const floorGeo = new THREE.PlaneGeometry(28, 40);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x3d1d11, // Nâu gỗ mun trầm
      roughness: 0.35,
      metalness: 0.15
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Vách hậu bàn thờ chạm trổ vàng kim
    const wallGeo = new THREE.PlaneGeometry(28, 18);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x2b1307,
      roughness: 0.7,
      metalness: 0.3
    });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 8, -6);
    this.scene.add(backWall);

    // Khung hoành phi câu đối chạm khắc phía sau tượng Phật
    const frameGeo = new THREE.BoxGeometry(10, 8, 0.4);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xb87300,
      metalness: 0.7,
      roughness: 0.3
    });
    const wallFrame = new THREE.Mesh(frameGeo, frameMat);
    wallFrame.position.set(0, 6.5, -5.7);
    this.scene.add(wallFrame);

    // Hai cột gỗ lim lớn hai bên điện
    const columnGeo = new THREE.CylinderGeometry(0.55, 0.55, 18, 24);
    const columnMat = new THREE.MeshStandardMaterial({
      color: 0x421b0e,
      roughness: 0.4,
      metalness: 0.1
    });

    const leftCol = new THREE.Mesh(columnGeo, columnMat);
    leftCol.position.set(-5.5, 8, -2);
    this.scene.add(leftCol);

    const rightCol = new THREE.Mesh(columnGeo, columnMat);
    rightCol.position.set(5.5, 8, -2);
    this.scene.add(rightCol);

    // Rèm nhung đỏ viền vàng hai góc trên màn hình chuẩn như video mẫu
    this.buildCurtains();
  }

  /**
   * Tạo rèm nhung đỏ viền vàng uốn lượn hai góc trên
   */
  buildCurtains() {
    const curtainMat = new THREE.MeshStandardMaterial({
      color: 0x8a1518, // Đỏ nhung hoàng gia
      roughness: 0.6,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const fringeMat = new THREE.MeshStandardMaterial({
      color: 0xffd700, // Vàng kim tua rua
      metalness: 0.8,
      roughness: 0.2
    });

    // Rèm trái
    const leftCurtain = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 2.2, 5, 16, 1, true, 0, Math.PI), curtainMat);
    leftCurtain.position.set(-4.2, 8.5, 3);
    leftCurtain.rotation.z = 0.35;
    this.scene.add(leftCurtain);

    // Rèm phải
    const rightCurtain = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 2.2, 5, 16, 1, true, 0, Math.PI), curtainMat);
    rightCurtain.position.set(4.2, 8.5, 3);
    rightCurtain.rotation.z = -0.35;
    this.scene.add(rightCurtain);

    // Dải tua rua vàng treo ngang phía trên
    const swagGeo = new THREE.TorusGeometry(5, 0.12, 8, 32, Math.PI * 0.7);
    const swag = new THREE.Mesh(swagGeo, fringeMat);
    swag.position.set(0, 9.2, 2);
    swag.rotation.z = Math.PI * 0.85;
    this.scene.add(swag);
  }

  /**
   * Dựng Tượng Phật Hoàng Kim uy nghi trên Đài Sen Vàng
   */
  buildBuddhaStatue() {
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd54f,
      emissive: 0x996500,
      emissiveIntensity: 0.35,
      roughness: 0.25,
      metalness: 0.75
    });

    const buddhaGroup = new THREE.Group();
    buddhaGroup.position.set(0, 3.2, -4.5);

    // 1. Tòa Sen Vàng nhiều lớp cánh
    const lotusBase = new THREE.Group();
    // Bệ tròn đài sen
    const baseCyl = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 0.7, 32), goldMat);
    lotusBase.add(baseCyl);

    // Các cánh hoa sen tỏa ra xung quanh
    const petalGeo = new THREE.ConeGeometry(0.45, 1.1, 4);
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeo, goldMat);
      petal.position.set(Math.cos(angle) * 2.2, 0.4, Math.sin(angle) * 2.2);
      petal.rotation.y = angle;
      petal.rotation.z = 0.45;
      lotusBase.add(petal);
    }
    buddhaGroup.add(lotusBase);

    // 2. Thân tượng Phật ngồi kiết già (Meditating Buddha)
    // Phần chân xếp kiết già
    const lapMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.0, 0.6, 24), goldMat);
    lapMesh.position.y = 0.65;
    buddhaGroup.add(lapMesh);

    // Thân mình áo cà sa
    const torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, 1.8, 24), goldMat);
    torsoMesh.position.y = 1.7;
    buddhaGroup.add(torsoMesh);

    // Chữ Vạn (Sauvastika) vàng nổi trên ngực
    const wanGeo = new THREE.BoxGeometry(0.35, 0.35, 0.1);
    const wanMat = new THREE.MeshBasicMaterial({ color: 0xfff0aa });
    const wanMesh = new THREE.Mesh(wanGeo, wanMat);
    wanMesh.position.set(0, 1.9, 0.95);
    buddhaGroup.add(wanMesh);

    // Hai cánh tay bắt ấn Thiền Định (Dhyana Mudra)
    const armGeo = new THREE.CylinderGeometry(0.24, 0.28, 1.4, 16);
    const leftArm = new THREE.Mesh(armGeo, goldMat);
    leftArm.position.set(-0.85, 1.3, 0.35);
    leftArm.rotation.z = 0.7;
    leftArm.rotation.x = 0.4;
    buddhaGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, goldMat);
    rightArm.position.set(0.85, 1.3, 0.35);
    rightArm.rotation.z = -0.7;
    rightArm.rotation.x = 0.4;
    buddhaGroup.add(rightArm);

    // Hai bàn tay chắp ngửa đặt trên đùi
    const handsMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.4), goldMat);
    handsMesh.position.set(0, 0.95, 0.85);
    buddhaGroup.add(handsMesh);

    // Đầu tượng Phật & Búi tóc nhục kế (Ushnisha)
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 24), goldMat);
    headMesh.position.set(0, 2.9, 0);
    buddhaGroup.add(headMesh);

    const ushnishaMesh = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), goldMat);
    ushnishaMesh.position.set(0, 3.5, 0);
    buddhaGroup.add(ushnishaMesh);

    // Hai tai dài chạm vai
    const earGeo = new THREE.CapsuleGeometry(0.08, 0.35, 4, 8);
    const leftEar = new THREE.Mesh(earGeo, goldMat);
    leftEar.position.set(-0.62, 2.85, 0);
    buddhaGroup.add(leftEar);
    const rightEar = new THREE.Mesh(earGeo, goldMat);
    rightEar.position.set(0.62, 2.85, 0);
    buddhaGroup.add(rightEar);

    // 3. Vòng Hào Quang sau lưng (Halo) phát sáng dịu nhẹ
    const haloGeo = new THREE.RingGeometry(1.2, 3.2, 48);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffea77,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    this.buddhaHalo = new THREE.Mesh(haloGeo, haloMat);
    this.buddhaHalo.position.set(0, 3.1, -0.6);
    buddhaGroup.add(this.buddhaHalo);

    this.scene.add(buddhaGroup);
  }

  /**
   * Bàn thờ chạm trổ, Lư hương đồng phát sáng, 2 Bình hoa lớn và Hàng nến
   */
  buildAltarAndVessels() {
    const altarGroup = new THREE.Group();
    altarGroup.position.set(0, 0, -2.4);

    // 1. Thân Bàn Thờ gỗ mun viền thếp vàng chạm trổ
    const altarGeo = new THREE.BoxGeometry(7.2, 1.6, 2.2);
    const altarMat = new THREE.MeshStandardMaterial({
      color: 0x4a2511, // Nâu gỗ mun
      roughness: 0.4,
      metalness: 0.2
    });
    this.altarMesh = new THREE.Mesh(altarGeo, altarMat);
    this.altarMesh.position.y = 0.8;
    this.altarMesh.castShadow = true;
    this.altarMesh.receiveShadow = true;
    altarGroup.add(this.altarMesh);

    // Viền vàng trang trí mặt bàn
    const trimGeo = new THREE.BoxGeometry(7.35, 0.12, 2.35);
    const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 });
    const trim = new THREE.Mesh(trimGeo, goldTrimMat);
    trim.position.y = 1.6;
    altarGroup.add(trim);

    // 2. Lư Hương Đồng Trung Tâm tỏa sáng (Center Bronze Incense Burner)
    const burnerGroup = new THREE.Group();
    burnerGroup.position.set(0, 1.7, 0.2);

    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0xd99b38,
      emissive: 0x664400,
      emissiveIntensity: 0.4,
      metalness: 0.85,
      roughness: 0.25
    });
    // Bát lư hương phình to miệng rộng
    const potMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.4, 0.45, 24), bronzeMat);
    burnerGroup.add(potMesh);

    // Chân quỳ tai mây lư đồng
    const legGeo = new THREE.ConeGeometry(0.12, 0.25, 8);
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const leg = new THREE.Mesh(legGeo, bronzeMat);
      leg.position.set(Math.cos(angle) * 0.35, -0.25, Math.sin(angle) * 0.35);
      burnerGroup.add(leg);
    }

    // Cát vàng / tro hương trong bát lư
    const sandMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.05, 24), new THREE.MeshBasicMaterial({ color: 0xaa8844 }));
    sandMesh.position.y = 0.2;
    burnerGroup.add(sandMesh);

    this.incenseBurner = burnerGroup;
    altarGroup.add(burnerGroup);

    // 3. Hai Bình Sứ Trắng Cắm Hoa Cúc / Sen Sum Suê (như trong video mẫu)
    this.buildFlowerVase(altarGroup, -2.4, 1.65, 0);
    this.buildFlowerVase(altarGroup, 2.4, 1.65, 0);

    // 4. Hàng Nến Vàng Lung Linh Hai Bên Bàn Thờ
    const candlePositions = [
      [-1.3, 1.65, 0.3],
      [-0.8, 1.65, 0.45],
      [0.8, 1.65, 0.45],
      [1.3, 1.65, 0.3]
    ];
    candlePositions.forEach(([cx, cy, cz]) => {
      this.buildCandle(altarGroup, cx, cy, cz);
    });

    this.scene.add(altarGroup);
  }

  /**
   * Bình sứ cắm hoa sum suê
   */
  buildFlowerVase(parent, x, y, z) {
    const vaseGroup = new THREE.Group();
    vaseGroup.position.set(x, y, z);

    // Bình sứ trắng men ngọc
    const vaseMat = new THREE.MeshStandardMaterial({
      color: 0xf8f9fa,
      roughness: 0.15,
      metalness: 0.1
    });
    const vaseBody = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.75, 16), vaseMat);
    vaseBody.position.y = 0.38;
    vaseGroup.add(vaseBody);

    // Tán hoa sum suê trắng / vàng / xanh
    const flowerMatWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const flowerMatYellow = new THREE.MeshStandardMaterial({ color: 0xffeb3b, roughness: 0.5 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.6 });

    // Tạo các đóa hoa cúc nhấp nhô
    for (let i = 0; i < 18; i++) {
      const fx = (Math.random() - 0.5) * 0.7;
      const fy = 0.75 + Math.random() * 0.5;
      const fz = (Math.random() - 0.5) * 0.7;
      const isYellow = Math.random() > 0.6;
      const blossom = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        isYellow ? flowerMatYellow : flowerMatWhite
      );
      blossom.position.set(fx, fy, fz);
      vaseGroup.add(blossom);
    }

    // Các cành lá xanh điểm xuyết
    for (let i = 0; i < 10; i++) {
      const lx = (Math.random() - 0.5) * 0.8;
      const ly = 0.65 + Math.random() * 0.4;
      const lz = (Math.random() - 0.5) * 0.8;
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 4), leafMat);
      leaf.position.set(lx, ly, lz);
      leaf.rotation.x = Math.random();
      leaf.rotation.z = Math.random();
      vaseGroup.add(leaf);
    }

    parent.add(vaseGroup);
  }

  /**
   * Tạo chân nến đồng có ngọn lửa phát sáng
   */
  buildCandle(parent, x, y, z) {
    const candleGroup = new THREE.Group();
    candleGroup.position.set(x, y, z);

    // Chân nến đồng
    const holderMat = new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.8, roughness: 0.2 });
    const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 0.15, 12), holderMat);
    holder.position.y = 0.08;
    candleGroup.add(holder);

    // Thân nến sáp đỏ vàng
    const waxMat = new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.3 });
    const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.35, 12), waxMat);
    wax.position.y = 0.32;
    candleGroup.add(wax);

    // Ngọn lửa nến phát sáng
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 8), flameMat);
    flame.position.y = 0.55;
    candleGroup.add(flame);
    this.candles.push(flame);

    // Đèn điểm nhỏ mô phỏng ánh nến lung linh
    const candleLight = new THREE.PointLight(0xff9900, 0.6, 2.5);
    candleLight.position.set(0, 0.55, 0);
    candleGroup.add(candleLight);
    this.candleLights.push(candleLight);

    parent.add(candleGroup);
  }

  /**
   * Thảm đỏ hoa sen ở chính giữa (Center Red Carpet)
   * Trải dài từ đáy màn hình lên trước bàn thờ với họa tiết sen vàng
   */
  buildCenterRedCarpet() {
    const carpetLength = 22;
    const carpetWidth = 2.4;

    // Dùng Canvas 2D vẽ hoa văn hoa sen vàng kim và viền gấm hai bên
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');

    // Nền đỏ thắm gấm hoa
    ctx.fillStyle = '#8f1c1f';
    ctx.fillRect(0, 0, 512, 2048);

    // Viền vàng kim 2 bên mép thảm
    ctx.fillStyle = '#f5c542';
    ctx.fillRect(15, 0, 18, 2048);
    ctx.fillRect(512 - 33, 0, 18, 2048);

    // Họa tiết hoa sen vàng lặp lại dọc giữa thảm
    ctx.strokeStyle = '#f5c542';
    ctx.lineWidth = 4;
    for (let y = 100; y < 2048; y += 180) {
      this.drawLotusPattern(ctx, 256, y, 55);
    }

    const carpetTexture = new THREE.CanvasTexture(canvas);
    carpetTexture.wrapS = THREE.ClampToEdgeWrapping;
    carpetTexture.wrapT = THREE.RepeatWrapping;

    const carpetGeo = new THREE.PlaneGeometry(carpetWidth, carpetLength);
    const carpetMat = new THREE.MeshStandardMaterial({
      map: carpetTexture,
      roughness: 0.8,
      metalness: 0.15
    });

    const carpet = new THREE.Mesh(carpetGeo, carpetMat);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(0, 0.02, 3.5); // Nằm ngay trên sàn gỗ
    carpet.receiveShadow = true;
    this.scene.add(carpet);
  }

  /**
   * Vẽ hoa sen vàng cách điệu trên Canvas thảm
   */
  drawLotusPattern(ctx, cx, cy, radius) {
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = 'rgba(245, 197, 66, 0.9)';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // 8 cánh sen bung nở
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
      ctx.fillStyle = 'rgba(255, 225, 120, 0.85)';
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Cập nhật animation của ánh nến và hào quang Phật
   */
  update(elapsedTime) {
    // 1. Hào quang tượng Phật thở nhẹ
    if (this.buddhaHalo) {
      const scale = 1 + Math.sin(elapsedTime * 1.5) * 0.05;
      this.buddhaHalo.scale.set(scale, scale, 1);
    }

    // 2. Ngọn lửa nến nhấp nháy lung linh
    this.candles.forEach((flame, idx) => {
      const flicker = Math.sin(elapsedTime * 8 + idx * 2.3) * 0.15;
      flame.scale.set(1 + flicker, 1 + flicker * 1.5, 1 + flicker);
    });

    this.candleLights.forEach((light, idx) => {
      const noise = Math.sin(elapsedTime * 12 + idx * 3.7) * 0.1;
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
    return new THREE.Vector3(0, 1.7, -1.8);
  }
}

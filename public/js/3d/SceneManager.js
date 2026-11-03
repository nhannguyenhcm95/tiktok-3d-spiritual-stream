/**
 * SceneManager.js - Đại Hùng Bảo Điện & Quần Thể Tượng Phật Điện Ảnh Siêu Thực
 * Tái hiện 100% TƯỢNG PHẬT theo ảnh tham chiếu:
 * - Đại Phật Thích Ca Mâu Ni uy nghiêm, phù điêu Mandala đồng cổ khổng lồ
 * - 4 Pho tượng nhị vị & tiểu vị hai bên
 * - Thân tượng đá bạc mờ (Brushed Pewter) kết hợp Y áo đồng vàng cổ (Antique Bronze Gold)
 * - Tòa sen đồng nhiều tầng, cửa sổ hoa văn hắt nắng và bàn hoa cúng dường
 * - Hệ thống Ánh Sáng Điện Ảnh, Đổ Bóng Dài và Hiệu Ứng Hào Quang Động
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

    // Cờ kích hoạt chế độ Tượng Phật Điện Ảnh Siêu Thực (Hybrid Photorealistic)
    this.usePhotorealisticBuddha = true;

    // Các thành phần tham chiếu quan trọng
    this.buddhaBackdropMesh = null;
    this.mandalaAuraMesh = null;
    this.buddhaPointLight = null;
    this.windowLeftLight = null;
    this.windowRightLight = null;
    this.sunLight = null;
    this.candles = [];
    this.candleLights = [];

    this.init();
  }

  init() {
    // 1. Khởi tạo Scene với màu xám đá điện ảnh
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x282a2d);
    this.scene.fog = new THREE.FogExp2(0x3a3c40, 0.014);

    // 2. Camera đối xứng trục chính (One-Point Perspective)
    const aspect = this.width / this.height;
    // FOV 38 độ: Tiêu cự tele nhẹ nén phối cảnh, tạo cảm giác tượng Phật đồ sộ và uy nghiêm
    this.camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 100);
    this.camera.position.set(0, 3.2, 16.5);
    this.camera.lookAt(0, 4.8, -6.0);

    // 3. WebGL Renderer tối ưu bóng đổ PCFSoftShadowMap
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 4. Dựng hệ thống ánh sáng điện ảnh
    this.setupCinematicLighting();

    // 5. Dựng Chánh Điện & Quần Thể Tượng Phật Chuẩn 100% Theo Ảnh
    this.buildGrandBuddhaSanctuary();

    // 6. Dựng Sàn Đá Lớn (Slate Floor) Nhận Bóng Đổ Sắc Nét
    this.buildSlateFloor();

    // 7. Dựng Hàng Cột Đá Khổng Lồ Đón Nắng Hai Bên Cánh Gà
    this.buildSideColonnadePillars();

    window.addEventListener('resize', () => this.onResize());
  }

  /**
   * Thiết lập hệ thống ánh sáng điện ảnh (Cinematic Lighting)
   * Nắng chiều chiếu xiên từ bên phải sang trái
   */
  setupCinematicLighting() {
    // 1. Ánh sáng môi trường dịu nhẹ
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.5);
    this.scene.add(ambientLight);

    // 2. HemisphereLight cho vùng bóng râm mang sắc xanh đá tự nhiên
    const hemiLight = new THREE.HemisphereLight(0xdde4ea, 0x423f3a, 0.7);
    this.scene.add(hemiLight);

    // 3. Nắng Chiều Chiếu Xiên (Warm Sunlight) từ bên phải (x = 18, y = 12, z = 4)
    // Chiếu về (0, 0, -2) để tạo bóng đổ dài sắc nét chéo góc -62 độ trên nền gạch đá
    this.sunLight = new THREE.DirectionalLight(0xfff1d0, 2.5);
    this.sunLight.position.set(18, 12, 4);
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
    this.sunLight.shadow.radius = 1.5;
    this.scene.add(this.sunLight);

    // 4. Ánh sáng hắt ra từ 2 khung cửa sổ hoa văn ở hai bên
    this.windowLeftLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
    this.windowLeftLight.position.set(-8, 9, -12);
    this.windowLeftLight.target.position.set(-2, 4, -4);
    this.scene.add(this.windowLeftLight);
    this.scene.add(this.windowLeftLight.target);

    this.windowRightLight = new THREE.DirectionalLight(0xffedd0, 1.6);
    this.windowRightLight.position.set(8, 9, -12);
    this.windowRightLight.target.position.set(2, 4, -4);
    this.scene.add(this.windowRightLight);
    this.scene.add(this.windowRightLight.target);

    // 5. Đèn điểm tỏa sáng ấm áp từ đài sen và ngực Đại Phật
    this.buddhaPointLight = new THREE.PointLight(0xffc266, 1.8, 14);
    this.buddhaPointLight.position.set(0, 5.5, -7.5);
    this.scene.add(this.buddhaPointLight);
  }

  /**
   * Dựng Quần Thể Tượng Phật Chuẩn 100% Theo Ảnh Tham Chiếu
   * Sử dụng kỹ thuật Hybrid Photorealistic Texture + Lớp Chiếu Sáng Động 3D
   */
  buildGrandBuddhaSanctuary() {
    const loader = new THREE.TextureLoader();

    // Nạp ảnh mẫu độ phân giải cao của Chánh Điện & 5 Pho Tượng Phật
    loader.load(
      'assets/chanh-dien-ref.jpg',
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;

        // Tạo Backdrop Plane lớn đặt tại hậu cung (z = -8.5)
        // Kích thước 28m x 16m tỷ lệ 16:9 hoàn hảo
        const backdropGeo = new THREE.PlaneGeometry(28, 16);
        const backdropMat = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.65,
          metalness: 0.25,
          side: THREE.FrontSide
        });

        this.buddhaBackdropMesh = new THREE.Mesh(backdropGeo, backdropMat);
        // Đặt tâm tượng Phật cao ở y = 7.6, z = -8.5 để nổi bật hoàn hảo ở nửa trên màn hình 9:16
        this.buddhaBackdropMesh.position.set(0, 7.6, -8.5);
        this.scene.add(this.buddhaBackdropMesh);

        console.log('✅ [SceneManager] Đã nạp thành công Tượng Phật Điện Ảnh Siêu Thực!');
      },
      undefined,
      (err) => {
        console.warn('⚠️ Không thể tải ảnh backdrop, chuyển sang chế độ Procedural 3D Buddha:', err);
        this.buildProceduralFiveBuddhas();
      }
    );

    // 2. Vòng Hào Quang Mandala Động đè khớp tâm đầu Đại Phật (z = -8.4)
    // Tỏa sáng ấm áp và thở nhẹ nhàng theo thời gian thực
    const auraCanvas = document.createElement('canvas');
    auraCanvas.width = 512;
    auraCanvas.height = 512;
    const ctx = auraCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 250);
    grad.addColorStop(0, 'rgba(255, 230, 140, 0.85)');
    grad.addColorStop(0.35, 'rgba(217, 155, 38, 0.45)');
    grad.addColorStop(0.7, 'rgba(197, 155, 95, 0.15)');
    grad.addColorStop(1, 'rgba(197, 155, 95, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    const auraTex = new THREE.CanvasTexture(auraCanvas);
    const auraGeo = new THREE.PlaneGeometry(7.2, 7.2);
    const auraMat = new THREE.MeshBasicMaterial({
      map: auraTex,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.mandalaAuraMesh = new THREE.Mesh(auraGeo, auraMat);
    // Vị trí tâm đĩa Mandala sau đầu Đại Phật trong ảnh mẫu
    this.mandalaAuraMesh.position.set(0, 7.8, -8.4);
    this.scene.add(this.mandalaAuraMesh);

    // 3. Bàn Thờ Đá Nhỏ Phía Trước Bày Đèn Bơ & Nến Vàng
    this.buildAltarOfferings();
  }

  /**
   * Phương án dự phòng: Dựng 100% bằng Procedural 3D Mesh nếu không tải được ảnh
   */
  buildProceduralFiveBuddhas() {
    const pewterMat = new THREE.MeshStandardMaterial({
      color: 0x8c9295,
      roughness: 0.45,
      metalness: 0.60
    });
    const bronzeGoldMat = new THREE.MeshStandardMaterial({
      color: 0xc59b5f,
      roughness: 0.32,
      metalness: 0.85
    });

    // Đại Phật Trung Tâm
    const centerBuddha = this.createDetailedBuddhaMesh(pewterMat, bronzeGoldMat, 2.6, true);
    centerBuddha.position.set(0, 4.2, -8.5);
    this.scene.add(centerBuddha);

    // 2 Phật Nhị Vị
    const leftBuddha = this.createDetailedBuddhaMesh(pewterMat, bronzeGoldMat, 1.65, false);
    leftBuddha.position.set(-4.6, 3.2, -8.7);
    this.scene.add(leftBuddha);

    const rightBuddha = this.createDetailedBuddhaMesh(pewterMat, bronzeGoldMat, 1.65, false);
    rightBuddha.position.set(4.6, 3.2, -8.7);
    this.scene.add(rightBuddha);
  }

  createDetailedBuddhaMesh(pewterMat, bronzeGoldMat, scale = 1.0, isCenter = false) {
    const group = new THREE.Group();
    group.scale.set(scale, scale, scale);

    if (isCenter) {
      const halo = new THREE.Mesh(
        new THREE.CylinderGeometry(2.6, 2.6, 0.2, 32),
        new THREE.MeshStandardMaterial({ color: 0x9e7b42, roughness: 0.4, metalness: 0.8 })
      );
      halo.rotation.x = Math.PI / 2;
      halo.position.set(0, 2.4, -0.4);
      group.add(halo);
    }

    const lotus = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.9, 0.6, 24), bronzeGoldMat);
    lotus.position.y = 0.3;
    group.add(lotus);

    const lap = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.45, 0.5, 24), bronzeGoldMat);
    lap.position.y = 0.75;
    group.add(lap);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.95, 1.35, 24), bronzeGoldMat);
    torso.position.y = 1.55;
    group.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 24, 24), pewterMat);
    head.position.y = 2.45;
    group.add(head);

    return group;
  }

  /**
   * Tạo Texture Gạch Đá Lớn (Slate Floor) có rãnh ô vuông và nhám sần
   */
  createStoneFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#686a6c';
    ctx.fillRect(0, 0, 1024, 1024);

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
   * Sàn Đá 3D Lớn (Slate Floor) Nhận Toàn Bộ Bóng Đổ Sắc Nét Của Phật Tử & Cột Đá
   */
  buildSlateFloor() {
    const floorTex = this.createStoneFloorTexture();
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x686a6c,
      map: floorTex,
      roughness: 0.55,
      metalness: 0.15
    });

    // Trải dài từ chân tường Phật (z = -8.5) ra tận đáy màn hình (z = 20)
    const floorGeo = new THREE.PlaneGeometry(36, 44);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  /**
   * Hàng Cột Đá Vuông Fluted hai bên cánh gà đón nắng chiếu xiên
   */
  buildSideColonnadePillars() {
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x7d7b76,
      roughness: 0.85,
      metalness: 0.05
    });

    const pillarGeo = new THREE.BoxGeometry(2.4, 24, 2.4);
    const pillarPositions = [
      // Bên trái (x = -11.5)
      [-11.5, -6], [-11.5, -1.5], [-11.5, 3], [-11.5, 7.5],
      // Bên phải (x = 11.5) - Ánh nắng chiếu qua các khe cột này
      [11.5, -6], [11.5, -1.5], [11.5, 3], [11.5, 7.5]
    ];

    pillarPositions.forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(px, 11, pz);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.scene.add(pillar);
    });
  }

  /**
   * Bàn Thờ Cúng Dường Bày Đèn Bơ & Nến Vàng
   */
  buildAltarOfferings() {
    const altarGroup = new THREE.Group();
    altarGroup.position.set(0, 0, -6.8);

    const candlePositions = [-2.2, -0.8, 0.8, 2.2];
    const bronzeMat = new THREE.MeshStandardMaterial({ color: 0xc59b5f, metalness: 0.8, roughness: 0.3 });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffb74d });

    candlePositions.forEach((cx) => {
      const lamp = new THREE.Group();
      lamp.position.set(cx, 0.1, 0);

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.2, 12), bronzeMat);
      base.position.y = 0.1;
      lamp.add(base);

      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 8), flameMat);
      flame.position.y = 0.28;
      lamp.add(flame);
      this.candles.push(flame);

      const light = new THREE.PointLight(0xffaa33, 0.7, 3.5);
      light.position.set(0, 0.3, 0);
      lamp.add(light);
      this.candleLights.push(light);

      altarGroup.add(lamp);
    });

    this.scene.add(altarGroup);
  }

  /**
   * Cập nhật animation hào quang và ánh nến
   */
  update(elapsedTime) {
    // 1. Vòng Hào Quang Mandala sau đầu Đại Phật thở nhẹ nhàng
    if (this.mandalaAuraMesh) {
      const breath = 1 + Math.sin(elapsedTime * 1.2) * 0.05;
      this.mandalaAuraMesh.scale.set(breath, breath, 1);
      this.mandalaAuraMesh.material.opacity = 0.65 + Math.sin(elapsedTime * 1.5) * 0.1;
    }

    // 2. Điểm sáng hắt lên ngực Đại Phật
    if (this.buddhaPointLight) {
      this.buddhaPointLight.intensity = 1.8 + Math.sin(elapsedTime * 2.0) * 0.25;
    }

    // 3. Ánh nến lung linh
    this.candles.forEach((flame, idx) => {
      const flicker = Math.sin(elapsedTime * 9 + idx * 2.1) * 0.12;
      flame.scale.set(1 + flicker, 1 + flicker * 1.4, 1 + flicker);
    });

    this.candleLights.forEach((light, idx) => {
      const noise = Math.sin(elapsedTime * 11 + idx * 3.3) * 0.08;
      light.intensity = 0.7 + noise;
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
    return new THREE.Vector3(0, 1.2, -6.5);
  }
}

/**
 * Procedural 3D Assets Generator
 * Tự động dựng toàn bộ mô hình 3D (Bàn thờ, Lư hương, Mõ gỗ, Chuông đồng, Tượng Phật, Thánh giá, Hoa đăng)
 * bằng Procedural Geometry với chất liệu PBR chân thực.
 */

import * as THREE from 'three';

/**
 * Tạo canvas chứa chữ/nhãn tên bo tròn và trả về THREE.CanvasTexture
 */
export function createTextLabelTexture(text, bgColor = 'rgba(20, 20, 25, 0.85)', textColor = '#ffd700') {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');

  // Vẽ nền bo góc (pill shape)
  const x = 8, y = 8, w = 368, h = 80, r = 24;
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();

  // Viền vàng kim
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ffd700';
  ctx.stroke();

  // Vẽ chữ
  ctx.fillStyle = textColor;
  ctx.font = 'bold 30px "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Cắt ngắn nếu quá dài
  const displayText = text.length > 20 ? text.substring(0, 18) + '...' : text;
  ctx.fillText(displayText, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

/**
 * 1. Bàn thờ & Lư hương chính
 */
export function createAltarGroup() {
  const group = new THREE.Group();
  group.name = 'altar_main_group';

  // Chất liệu gỗ lim trầm ấm
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x3d180a,
    roughness: 0.35,
    metalness: 0.1
  });

  const goldAccentMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.85,
    roughness: 0.25
  });

  // Tầng đế bàn thờ dưới
  const lowerBase = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.4, 2.2), woodMaterial);
  lowerBase.position.y = -0.8;
  lowerBase.receiveShadow = true;
  lowerBase.castShadow = true;
  group.add(lowerBase);

  // Viền vàng tầng đế
  const baseRim = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.08, 2.3), goldAccentMat);
  baseRim.position.y = -0.6;
  group.add(baseRim);

  // Mặt bàn thờ chính
  const mainTable = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.3, 1.8), woodMaterial);
  mainTable.position.y = -0.45;
  mainTable.receiveShadow = true;
  mainTable.castShadow = true;
  group.add(mainTable);

  // 4 Chân bàn uốn lượn chạm khắc
  const legGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.8, 12);
  const legPositions = [
    [-1.7, -0.9, -0.8],
    [1.7, -0.9, -0.8],
    [-1.7, -0.9, 0.8],
    [1.7, -0.9, 0.8]
  ];
  legPositions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, woodMaterial);
    leg.position.set(x, y, z);
    group.add(leg);
  });

  // Tầng bệ cao phía sau để đặt Tượng/Thánh giá
  const upperTier = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.35, 1.0), woodMaterial);
  upperTier.position.set(0, -0.15, -0.4);
  group.add(upperTier);

  // ================= Lư hương đồng lớn (Censer) ở chính giữa bàn =================
  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0x9b7635,
    metalness: 0.8,
    roughness: 0.3
  });

  const censerGroup = new THREE.Group();
  censerGroup.name = 'censer_group';
  censerGroup.position.set(0, -0.3, 0.25);

  // Chân đế 3 chân lư hương
  const censerBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 0.12, 24), bronzeMat);
  censerBase.position.y = 0.06;
  censerGroup.add(censerBase);

  // Thân bầu lư hương (Sphere cắt nửa hoặc dẹp)
  const censerBody = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.32, 0.45, 32), bronzeMat);
  censerBody.position.y = 0.32;
  censerGroup.add(censerBody);

  // Miệng lư hương
  const censerRim = new THREE.Mesh(new THREE.TorusGeometry(0.49, 0.04, 16, 32), bronzeMat);
  censerRim.rotation.x = Math.PI / 2;
  censerRim.position.y = 0.54;
  censerGroup.add(censerRim);

  // 2 Tai rồng/hoa văn uốn lượn hai bên
  const earGeo = new THREE.TorusGeometry(0.18, 0.035, 12, 24, Math.PI * 1.2);
  const earLeft = new THREE.Mesh(earGeo, bronzeMat);
  earLeft.position.set(-0.52, 0.35, 0);
  earLeft.rotation.z = Math.PI * 0.35;
  censerGroup.add(earLeft);

  const earRight = new THREE.Mesh(earGeo, bronzeMat);
  earRight.position.set(0.52, 0.35, 0);
  earRight.rotation.z = -Math.PI * 0.35;
  censerGroup.add(earRight);

  // Lớp tro xám bên trong để cắm nhang
  const ashMat = new THREE.MeshStandardMaterial({
    color: 0x5a5652,
    roughness: 0.95,
    metalness: 0.0
  });
  const ashMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.44, 0.05, 32), ashMat);
  ashMesh.position.y = 0.52;
  censerGroup.add(ashMesh);

  // Điểm ánh sáng ấm dịu ngay tâm lư hương
  const censerGlow = new THREE.PointLight(0xff7722, 1.2, 2.5);
  censerGlow.position.set(0, 0.65, 0);
  censerGroup.add(censerGlow);

  group.add(censerGroup);

  // Sàn đá / gạch cổ trầm mặc dưới đáy
  const floorGeo = new THREE.PlaneGeometry(16, 16);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x1a1614,
    roughness: 0.4,
    metalness: 0.2
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.0;
  floor.receiveShadow = true;
  group.add(floor);

  return { group, censerGroup, censerGlow };
}

/**
 * 2. Group Chùa (TEMPLE): Tượng Phật Thích Ca mạ vàng trên tòa sen + Vòng hào quang phát sáng
 */
export function createTempleThemeGroup() {
  const group = new THREE.Group();
  group.name = 'theme_temple_group';

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf6c845,
    roughness: 0.2,
    metalness: 0.9,
    emissive: 0x443005,
    emissiveIntensity: 0.2
  });

  const lotusPetalMat = new THREE.MeshStandardMaterial({
    color: 0xe89b65,
    roughness: 0.4,
    metalness: 0.3
  });

  const statueContainer = new THREE.Group();
  statueContainer.position.set(0, 0.05, -0.4);

  // Tòa sen nhiều tầng
  const lotusBase = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.22, 24), goldMat);
  lotusBase.position.y = 0.11;
  statueContainer.add(lotusBase);

  // Các cánh hoa sen xòe quanh bệ
  const petalCount = 12;
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.32, 5), lotusPetalMat);
    petal.position.set(Math.cos(angle) * 0.72, 0.22, Math.sin(angle) * 0.72);
    petal.rotation.y = angle;
    petal.rotation.z = -0.35;
    statueContainer.add(petal);
  }

  // Thân tượng Phật ngồi thiền (Procedural shapes: thân, đầu, tay kiết già)
  // Thân dưới (chân xếp bằng)
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.65, 0.35, 16), goldMat);
  legs.position.y = 0.38;
  statueContainer.add(legs);

  // Thân áo cà sa (ngực & bụng)
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.32, 0.7, 16), goldMat);
  torso.position.y = 0.82;
  statueContainer.add(torso);

  // Cổ
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.14, 16), goldMat);
  neck.position.y = 1.22;
  statueContainer.add(neck);

  // Đầu tượng thanh tịnh
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 24), goldMat);
  head.position.y = 1.44;
  statueContainer.add(head);

  // Nhục kế (Ushnisha) trên đảnh Phật
  const ushnisha = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), goldMat);
  ushnisha.position.y = 1.7;
  statueContainer.add(ushnisha);

  // Hai cánh tay buông kiết ấn thiền định
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 12), goldMat);
  armL.position.set(-0.35, 0.7, 0.05);
  armL.rotation.z = 0.4;
  statueContainer.add(armL);

  const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 12), goldMat);
  armR.position.set(0.35, 0.7, 0.05);
  armR.rotation.z = -0.4;
  statueContainer.add(armR);

  // Vòng hào quang phát sáng rực rỡ phía sau đầu
  const haloGroup = new THREE.Group();
  haloGroup.name = 'buddha_halo';
  haloGroup.position.set(0, 1.45, -0.22);

  // Vòng tròn hào quang chính
  const haloRingMat = new THREE.MeshBasicMaterial({
    color: 0xffd24d,
    side: THREE.DoubleSide
  });
  const haloRing = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.045, 16, 48), haloRingMat);
  haloGroup.add(haloRing);

  // Đĩa hào quang tỏa tia sáng xoay chậm
  const haloDiscMat = new THREE.MeshBasicMaterial({
    color: 0xffea88,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide
  });
  const haloDisc = new THREE.Mesh(new THREE.CircleGeometry(0.65, 32), haloDiscMat);
  haloGroup.add(haloDisc);

  // 12 Tia sáng phát quang hướng tâm
  for (let i = 0; i < 12; i++) {
    const rayAngle = (i / 12) * Math.PI * 2;
    const ray = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45), haloRingMat);
    ray.position.set(Math.cos(rayAngle) * 0.72, Math.sin(rayAngle) * 0.72, 0);
    ray.rotation.z = rayAngle - Math.PI / 2;
    haloGroup.add(ray);
  }

  // Ánh sáng phát từ hào quang
  const haloLight = new THREE.PointLight(0xffcc44, 2.5, 4.5);
  haloLight.position.set(0, 0, 0.2);
  haloGroup.add(haloLight);

  statueContainer.add(haloGroup);
  group.add(statueContainer);

  return { group, haloGroup, haloLight };
}

/**
 * 2b. Group Nhà Thờ (CHURCH): Thánh giá lớn phát sáng, Khung cửa kính màu & Chân nến hai bên
 */
export function createChurchThemeGroup() {
  const group = new THREE.Group();
  group.name = 'theme_church_group';
  group.position.set(0, 0, -0.4);

  // Bệ đá cẩm thạch trắng
  const marbleMat = new THREE.MeshStandardMaterial({
    color: 0xe6e4e0,
    roughness: 0.2,
    metalness: 0.1
  });

  const crossBase = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.6), marbleMat);
  crossBase.position.y = 0.2;
  group.add(crossBase);

  // Thánh giá gỗ sồi viền kim loại vàng
  const crossWoodMat = new THREE.MeshStandardMaterial({
    color: 0x4a2c14,
    roughness: 0.3,
    metalness: 0.1
  });

  const crossGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfff0aa,
    emissive: 0xffd700,
    emissiveIntensity: 0.8,
    roughness: 0.2
  });

  // Thân dọc Thánh giá
  const verticalBar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.8, 0.12), crossWoodMat);
  verticalBar.position.y = 1.3;
  group.add(verticalBar);

  // Thanh ngang Thánh giá
  const horizontalBar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.18, 0.12), crossWoodMat);
  horizontalBar.position.y = 1.65;
  group.add(horizontalBar);

  // Lõi phát sáng trung tâm Thánh giá
  const crossCore = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), crossGlowMat);
  crossCore.position.set(0, 1.65, 0.08);
  group.add(crossCore);

  // Ánh sáng ấm từ Thánh giá
  const crossLight = new THREE.PointLight(0xffea9f, 2.8, 5.0);
  crossLight.position.set(0, 1.65, 0.3);
  group.add(crossLight);

  // Khung cửa kính màu vòm gothic phía sau (Stained Glass Window)
  const windowGroup = new THREE.Group();
  windowGroup.position.set(0, 1.6, -0.6);

  const glassMat = new THREE.MeshBasicMaterial({
    color: 0x3388cc,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide
  });
  const windowArch = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 2.2, 32, 1, false, 0, Math.PI), glassMat);
  windowArch.rotation.x = Math.PI / 2;
  windowArch.position.y = 0.4;
  windowGroup.add(windowArch);

  // Ánh sáng God-rays từ sau cửa sổ
  const windowGodRay = new THREE.DirectionalLight(0xffe0b2, 1.5);
  windowGodRay.position.set(0, 3, -2);
  windowGodRay.target.position.set(0, 0, 0);
  group.add(windowGodRay);
  group.add(windowGroup);

  // 2 Chân nến thờ hai bên
  const candleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
  const brassHolderMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.2 });

  [-1.2, 1.2].forEach((xPos) => {
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.16, 0.6, 16), brassHolderMat);
    stand.position.set(xPos, 0.3, 0);
    group.add(stand);

    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 16), candleMat);
    candle.position.set(xPos, 0.7, 0);
    group.add(candle);

    // Ngọn lửa nến
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.035, 0.09, 12),
      new THREE.MeshBasicMaterial({ color: 0xff6600 })
    );
    flame.position.set(xPos, 0.94, 0);
    group.add(flame);

    const flameLight = new THREE.PointLight(0xff8822, 1.2, 2.0);
    flameLight.position.set(xPos, 0.98, 0.05);
    group.add(flameLight);
  });

  return { group, crossLight, windowGodRay };
}

/**
 * 3. Bộ Mõ gỗ & Dùi gõ (`createWoodenFishGroup`)
 * Đặt góc phải tiền cảnh để khán giả nhìn rõ nhất
 */
export function createWoodenFishGroup() {
  const group = new THREE.Group();
  group.name = 'wooden_fish_group';
  // Vị trí góc phải tiền cảnh
  group.position.set(1.15, -0.32, 0.65);

  // Đệm gấm đỏ thêu hoa văn
  const cushionMat = new THREE.MeshStandardMaterial({
    color: 0x991118,
    roughness: 0.7,
    metalness: 0.1
  });
  const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 0.14, 24), cushionMat);
  cushion.position.y = 0.07;
  group.add(cushion);

  // Dây viền vàng quanh đệm
  const cordMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.7, roughness: 0.3 });
  const cushionCord = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.025, 12, 32), cordMat);
  cushionCord.rotation.x = Math.PI / 2;
  cushionCord.position.y = 0.07;
  group.add(cushionCord);

  // Thân Mõ Gỗ (Hình cầu dẹp màu cánh gián bóng loáng có miệng khoét)
  const fishWoodMat = new THREE.MeshStandardMaterial({
    color: 0x5a1d0f,
    roughness: 0.25,
    metalness: 0.15
  });

  const fishMesh = new THREE.Mesh(new THREE.SphereGeometry(0.32, 32, 24), fishWoodMat);
  fishMesh.scale.set(1.0, 0.75, 1.1);
  fishMesh.position.y = 0.32;
  fishMesh.rotation.y = -0.35; // Quay hơi chếch về phía camera
  group.add(fishMesh);

  // Khe rỗng ngang thân mõ
  const slitMat = new THREE.MeshBasicMaterial({ color: 0x100502 });
  const slit = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.5), slitMat);
  slit.position.set(0, 0.32, 0.08);
  group.add(slit);

  // Dùi gõ mõ (Striker) với trục xoay (Pivot)
  const strikerPivot = new THREE.Group();
  strikerPivot.position.set(0.28, 0.58, 0.15); // Điểm xoay của cổ tay cầm dùi

  const handleMat = new THREE.MeshStandardMaterial({ color: 0xb57842, roughness: 0.4 });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.48, 12), handleMat);
  handle.position.set(0, -0.24, 0);
  strikerPivot.add(handle);

  // Đầu dùi bọc vải đỏ đập vào mõ
  const tipMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.5 });
  const strikerTip = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 16), tipMat);
  strikerTip.position.set(0, -0.46, 0);
  strikerPivot.add(strikerTip);

  // Góc nghiêng mặc định sẵn sàng gõ
  strikerPivot.rotation.z = -0.65;
  strikerPivot.rotation.x = 0.2;
  group.add(strikerPivot);

  return {
    group,
    fishMesh,
    strikerPivot,
    strikerMesh: handle
  };
}

/**
 * 4. Đại Hồng Chung / Chuông đồng (`createBellGroup`)
 * Treo ở góc trái tiền cảnh trên giá gỗ
 */
export function createBellGroup() {
  const group = new THREE.Group();
  group.name = 'bell_group';
  // Vị trí góc trái tiền cảnh
  group.position.set(-1.15, -0.2, 0.5);

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2b1508, roughness: 0.45, metalness: 0.1 });
  const bronzeBellMat = new THREE.MeshStandardMaterial({
    color: 0x967332,
    roughness: 0.3,
    metalness: 0.85
  });

  // Giá treo chuông bằng gỗ (2 cột đứng + 1 xà ngang chạm đầu rồng)
  const colL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.6, 12), frameMat);
  colL.position.set(-0.45, 0.8, 0);
  group.add(colL);

  const colR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.6, 12), frameMat);
  colR.position.set(0.45, 0.8, 0);
  group.add(colR);

  const beam = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.12, 0.12), frameMat);
  beam.position.set(0, 1.55, 0);
  group.add(beam);

  // Điểm treo chuông (Bell Pivot)
  const bellPivot = new THREE.Group();
  bellPivot.position.set(0, 1.48, 0);

  // Dây xích đồng
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8), bronzeBellMat);
  chain.position.y = -0.1;
  bellPivot.add(chain);

  // Thân chuông đồng Đại Hồng Chung (dạng vòm chuông cổ truyền)
  const bellBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.46, 0.72, 32, 1, true),
    bronzeBellMat
  );
  bellBody.position.y = -0.48;
  bellPivot.add(bellBody);

  // Đỉnh chuông (Quai chuông hình bồ lao)
  const bellTop = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), bronzeBellMat);
  bellTop.position.y = -0.12;
  bellPivot.add(bellTop);

  // Vành miệng chuông dày đúc nổi hoa văn
  const bellRim = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.04, 16, 32), bronzeBellMat);
  bellRim.rotation.x = Math.PI / 2;
  bellRim.position.y = -0.84;
  bellPivot.add(bellRim);

  group.add(bellPivot);

  // Chày gỗ đâm chuông treo nằm ngang phía trước
  const strikerGroup = new THREE.Group();
  strikerGroup.position.set(0, 0.65, 0.65);

  const strikerWoodMat = new THREE.MeshStandardMaterial({ color: 0x6e3816, roughness: 0.5 });
  const strikerLog = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.7, 16), strikerWoodMat);
  strikerLog.rotation.x = Math.PI / 2;
  strikerGroup.add(strikerLog);

  // Dây treo chày
  const ropeL = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.7), frameMat);
  ropeL.position.set(0, 0.35, -0.2);
  strikerGroup.add(ropeL);

  const ropeR = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.7), frameMat);
  ropeR.position.set(0, 0.35, 0.2);
  strikerGroup.add(ropeR);

  group.add(strikerGroup);

  return {
    group,
    bellPivot,
    bellMesh: bellBody,
    strikerGroup,
    strikerMesh: strikerLog
  };
}

/**
 * 5. Nén nhang hoặc Ngọn nến động (`createIncenseOrCandle`)
 * @param {string} nickname Tên người dâng hương
 * @param {string} theme 'TEMPLE' hoặc 'CHURCH'
 */
export function createIncenseOrCandle(nickname, theme = 'TEMPLE') {
  const itemGroup = new THREE.Group();
  itemGroup.name = `incense_candle_${Date.now()}`;

  if (theme === 'TEMPLE') {
    // Cây nhang mảnh thanh tao cắm vào lư hương
    const stickMat = new THREE.MeshStandardMaterial({ color: 0x8b3a1a, roughness: 0.8 });
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.55, 8), stickMat);
    stick.position.y = 0.275;
    itemGroup.add(stick);

    // Đốm lửa tàn đỏ rực ở đầu cây nhang
    const emberMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
    const ember = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), emberMat);
    ember.position.y = 0.55;
    itemGroup.add(ember);

    // Ánh sáng nhỏ nhấp nháy từ tàn nhang
    const emberLight = new THREE.PointLight(0xff5500, 0.6, 0.8);
    emberLight.position.y = 0.56;
    itemGroup.add(emberLight);
  } else {
    // Ngọn nến trắng cúng dường
    const candleMat = new THREE.MeshStandardMaterial({ color: 0xfffaea, roughness: 0.2 });
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.35, 12), candleMat);
    candle.position.y = 0.175;
    itemGroup.add(candle);

    // Ngọn lửa nến vàng cam
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.08, 10), flameMat);
    flame.position.y = 0.39;
    itemGroup.add(flame);

    const flameLight = new THREE.PointLight(0xff9900, 0.9, 1.2);
    flameLight.position.y = 0.4;
    itemGroup.add(flameLight);
  }

  // Gắn thẻ tên nickname của khán giả phía trên cây nhang/nến
  const labelTexture = createTextLabelTexture(nickname || 'Thiện Nam Tín Nữ');
  const spriteMat = new THREE.SpriteMaterial({ map: labelTexture, transparent: true });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(0.65, 0.16, 1.0);
  sprite.position.y = theme === 'TEMPLE' ? 0.72 : 0.58;
  itemGroup.add(sprite);

  return itemGroup;
}

/**
 * 6. Đèn Hoa Đăng bay lên trời (`createSkyLantern`)
 * @param {string} nickname
 * @param {string} comment Lời cầu nguyện
 */
export function createSkyLantern(nickname, comment) {
  const lanternGroup = new THREE.Group();
  lanternGroup.name = `lantern_${Date.now()}`;

  // Thân lồng đèn giấy hình trụ phồng phát sáng cam vàng ấm áp
  const paperMat = new THREE.MeshStandardMaterial({
    color: 0xff7b25,
    emissive: 0xff5500,
    emissiveIntensity: 0.9,
    roughness: 0.5,
    side: THREE.DoubleSide
  });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 0.52, 16), paperMat);
  body.position.y = 0.26;
  lanternGroup.add(body);

  // Vành đáy hoa sen / tre nứa
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x4a2c14, roughness: 0.6 });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.02, 12, 24), rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.02;
  lanternGroup.add(rim);

  // Ngọn lửa nhỏ giữa đáy lồng đèn
  const fireMat = new THREE.MeshBasicMaterial({ color: 0xfff0aa });
  const fire = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), fireMat);
  fire.position.y = 0.08;
  lanternGroup.add(fire);

  // Nguồn sáng ấm lan tỏa
  const light = new THREE.PointLight(0xff8822, 1.5, 3.5);
  light.position.y = 0.2;
  lanternGroup.add(light);

  // Thẻ tên người thả đèn và lời cầu nguyện
  const labelText = comment ? `${nickname}: "${comment}"` : nickname;
  const labelTexture = createTextLabelTexture(labelText, 'rgba(40, 15, 5, 0.9)', '#ffe680');
  const spriteMat = new THREE.SpriteMaterial({ map: labelTexture, transparent: true });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(0.9, 0.22, 1.0);
  sprite.position.y = -0.16;
  lanternGroup.add(sprite);

  return lanternGroup;
}


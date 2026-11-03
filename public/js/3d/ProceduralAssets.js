/**
 * Procedural 3D Assets Generator — Đại Hùng Bảo Điện Chùa An Lạc
 * Dựng nội thất Chánh Điện nguy nga trang nghiêm: Tượng Phật Thích Ca mạ vàng,
 * Ban thờ, Lư hương đồng lớn, Bộ Mõ gỗ, Đại Hồng Chung, và Đạo tràng Phật tử ngồi tụng kinh.
 */

import * as THREE from 'three';

export const MAT = {
  woodLim: new THREE.MeshStandardMaterial({ color: 0x3d1709, roughness: 0.35, metalness: 0.1 }),
  woodPillar: new THREE.MeshStandardMaterial({ color: 0x5a180d, roughness: 0.4 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xf5c342, metalness: 0.85, roughness: 0.22, emissive: 0x332000, emissiveIntensity: 0.2 }),
  goldTrim: new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 }),
  bronze: new THREE.MeshStandardMaterial({ color: 0x8f6a32, metalness: 0.8, roughness: 0.3 }),
  stone: new THREE.MeshStandardMaterial({ color: 0x6e6862, roughness: 0.85 }),
  wallWarm: new THREE.MeshStandardMaterial({ color: 0xd29d4c, roughness: 0.8 }),
  cushionRed: new THREE.MeshStandardMaterial({ color: 0x9e1a14, roughness: 0.7 }),
  lotusPink: new THREE.MeshStandardMaterial({ color: 0xe87a90, roughness: 0.45 }),
  aoLam: new THREE.MeshStandardMaterial({ color: 0x687f94, roughness: 0.7 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xffdab8, roughness: 0.6 })
};

/**
 * 1. Không gian Đại Hùng Bảo Điện (Nền gạch, Cột gỗ lim, Trần gỗ chạm khắc)
 */
export function buildTempleInterior() {
  const group = new THREE.Group();

  // Nền chánh điện lát gạch bóng trầm ấm
  const floorGeo = new THREE.PlaneGeometry(24, 28);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x241109, roughness: 0.35, metalness: 0.15 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.0;
  floor.receiveShadow = true;
  group.add(floor);

  // Thảm gấm đỏ chính giữa điện dẫn lên bàn Phật
  const carpet = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 22),
    new THREE.MeshStandardMaterial({ color: 0x821410, roughness: 0.85 })
  );
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, -0.99, 1);
  carpet.receiveShadow = true;
  group.add(carpet);

  // Tường hậu phía sau tượng Phật
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(22, 12, 0.6), MAT.wallWarm);
  backWall.position.set(0, 5, -8.5);
  group.add(backWall);

  // Tường hai bên chánh điện
  [-11, 11].forEach(wx => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 12, 28), MAT.wallWarm);
    wall.position.set(wx, 5, 4);
    group.add(wall);
  });

  // 4 Cột gỗ lim đỏ lớn nâng đỡ chánh điện
  const pillarPositions = [
    [-5.5, -4], [5.5, -4],
    [-5.5, 4], [5.5, 4]
  ];
  pillarPositions.forEach(([px, pz]) => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 12, 16), MAT.woodPillar);
    col.position.set(px, 5, pz);
    col.castShadow = true;
    group.add(col);

    // Chân cột đá tảng
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 0.6, 12), MAT.stone);
    base.position.set(px, -0.7, pz);
    group.add(base);
  });

  // Xà ngang gỗ lim chạm khắc viền vàng
  const beamFront = new THREE.Mesh(new THREE.BoxGeometry(12, 0.6, 0.8), MAT.woodLim);
  beamFront.position.set(0, 8.5, 4);
  const beamBack = new THREE.Mesh(new THREE.BoxGeometry(12, 0.6, 0.8), MAT.woodLim);
  beamBack.position.set(0, 8.5, -4);
  group.add(beamFront, beamBack);

  // Biển hoành phi chữ Quốc ngữ "ĐẠI HÙNG BẢO ĐIỆN" treo trên cao
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#42140a'; ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 10; ctx.strokeRect(8, 8, 496, 112);
  ctx.fillStyle = '#ffd700'; ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('ĐẠI HÙNG BẢO ĐIỆN', 256, 66);
  const signTex = new THREE.CanvasTexture(canvas);
  const signMesh = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.1, 0.15), new THREE.MeshBasicMaterial({ map: signTex }));
  signMesh.position.set(0, 8.2, -3.5);
  group.add(signMesh);

  return group;
}

/**
 * 2. Ban Thờ Chính & Kim Thân Đức Phật Thích Ca Tọa Thiền
 */
export function buildBuddhaAltar() {
  const group = new THREE.Group();
  group.position.set(0, -0.5, -5.2);

  // Bàn thờ gỗ lim tam cấp
  const tier1 = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.5, 2.8), MAT.woodLim);
  tier1.position.y = 0.25;
  tier1.receiveShadow = true;
  group.add(tier1);

  const tier2 = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.5, 2.0), MAT.woodLim);
  tier2.position.set(0, 0.75, -0.3);
  group.add(tier2);

  const tier3 = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.5, 1.6), MAT.woodLim);
  tier3.position.set(0, 1.25, -0.5);
  group.add(tier3);

  // Viền vàng chạm khắc các mép bàn thờ
  const rim1 = new THREE.Mesh(new THREE.BoxGeometry(6.9, 0.08, 2.9), MAT.goldTrim);
  rim1.position.y = 0.5;
  group.add(rim1);

  // Tòa Sen Hồng Nở Rộ
  const lotusBase = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.35, 0.55, 20), MAT.lotusPink);
  lotusBase.position.set(0, 1.75, -0.5);
  group.add(lotusBase);

  // Cánh hoa sen bao quanh bệ
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.5, 5), MAT.lotusPink);
    petal.position.set(Math.cos(angle) * 1.55, 1.9, -0.5 + Math.sin(angle) * 1.55);
    petal.rotation.y = angle;
    petal.rotation.z = -0.35;
    group.add(petal);
  }

  // KIM THÂN ĐỨC PHẬT THÍCH CA MẠ VÀNG
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.35, 0.7, 16), MAT.gold);
  legs.position.set(0, 2.35, -0.5);
  group.add(legs);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 1.0, 1.55, 16), MAT.gold);
  torso.position.set(0, 3.4, -0.5);
  group.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 18, 18), MAT.gold);
  head.position.set(0, 4.55, -0.5);
  group.add(head);

  const ushnisha = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), MAT.gold);
  ushnisha.position.set(0, 5.12, -0.5);
  group.add(ushnisha);

  // Hai cánh tay kiết ấn thiền định
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 8), MAT.gold);
  armL.position.set(-0.65, 3.1, -0.4);
  armL.rotation.z = 0.45;
  const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 8), MAT.gold);
  armR.position.set(0.65, 3.1, -0.4);
  armR.rotation.z = -0.45;
  group.add(armL, armR);

  // VÒNG HÀO QUANG PHẬT (Phát sáng vàng rực rỡ)
  const haloGroup = new THREE.Group();
  haloGroup.position.set(0, 4.55, -1.05);

  const haloRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.65, 0.08, 16, 48),
    new THREE.MeshBasicMaterial({ color: 0xffe27a })
  );
  haloGroup.add(haloRing);

  const haloDisc = new THREE.Mesh(
    new THREE.CircleGeometry(1.58, 32),
    new THREE.MeshBasicMaterial({ color: 0xffeb99, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
  );
  haloGroup.add(haloDisc);

  // 16 Tia sáng hào quang phát quang
  for (let i = 0; i < 16; i++) {
    const rayAngle = (i / 16) * Math.PI * 2;
    const ray = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8), new THREE.MeshBasicMaterial({ color: 0xffdf70 }));
    ray.position.set(Math.cos(rayAngle) * 1.85, Math.sin(rayAngle) * 1.85, 0);
    ray.rotation.z = rayAngle - Math.PI / 2;
    haloGroup.add(ray);
  }

  const buddhaLight = new THREE.PointLight(0xffd56b, 2.5, 12);
  buddhaLight.position.set(0, 0, 0.8);
  haloGroup.add(buddhaLight);

  group.add(haloGroup);

  // ================= LƯ HƯƠNG ĐỒNG LỚN Ở CHÍNH GIỮA BÀN THỜ =================
  const censerGroup = new THREE.Group();
  censerGroup.position.set(0, 0.5, 0.7);

  const censerBase = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 0.2, 16), MAT.bronze);
  censerBase.position.y = 0.1;
  censerGroup.add(censerBase);

  const censerBody = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.5, 0.65, 24), MAT.bronze);
  censerBody.position.y = 0.45;
  censerGroup.add(censerBody);

  const censerRim = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.05, 12, 32), MAT.bronze);
  censerRim.rotation.x = Math.PI / 2;
  censerRim.position.y = 0.78;
  censerGroup.add(censerRim);

  [-0.8, 0.8].forEach(ex => {
    const ear = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.05, 8, 16), MAT.bronze);
    ear.position.set(ex, 0.5, 0);
    censerGroup.add(ear);
  });

  const ash = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.08, 24), new THREE.MeshStandardMaterial({ color: 0x9a938a }));
  ash.position.y = 0.75;
  censerGroup.add(ash);

  const censerGlow = new THREE.PointLight(0xff6611, 1.4, 3.5);
  censerGlow.position.set(0, 1.0, 0);
  censerGroup.add(censerGlow);

  const incenseSticks = new THREE.Group();
  incenseSticks.position.set(0, 0.76, 0);
  censerGroup.add(incenseSticks);

  group.add(censerGroup);

  // 2 Đèn hoa sen phát sáng hai bên bàn thờ
  [-2.2, 2.2].forEach(lx => {
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.8, 12), MAT.bronze);
    lamp.position.set(lx, 0.9, 0.2);
    const lotusLamp = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.35, 8), MAT.lotusPink);
    lotusLamp.position.set(lx, 1.4, 0.2);
    const light = new THREE.PointLight(0xffa834, 1.1, 4.0);
    light.position.set(lx, 1.6, 0.2);
    group.add(lamp, lotusLamp, light);
  });

  return { group, haloGroup, buddhaLight, censerGroup, incenseSticks };
}

/**
 * 3. Bộ Mõ Gỗ & Dùi Gõ (Đặt ở góc phải bàn thờ)
 */
export function buildWoodenFishAltar() {
  const group = new THREE.Group();
  group.position.set(2.2, 0.1, -3.8);

  const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.52, 0.16, 20), MAT.cushionRed);
  cushion.position.y = 0.08;
  group.add(cushion);

  const fishMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 24, 18),
    new THREE.MeshStandardMaterial({ color: 0x6e2412, roughness: 0.25, metalness: 0.15 })
  );
  fishMesh.scale.set(1.15, 0.8, 1.05);
  fishMesh.position.y = 0.36;
  group.add(fishMesh);

  // Trục dùi gỗ gõ mõ
  const strikerPivot = new THREE.Group();
  strikerPivot.position.set(0.32, 0.65, 0.15);

  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.5, 8), MAT.woodLim);
  handle.position.set(0, -0.25, 0);
  strikerPivot.add(handle);

  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), MAT.cushionRed);
  tip.position.set(0, -0.48, 0);
  strikerPivot.add(tip);

  strikerPivot.rotation.z = -0.65;
  strikerPivot.rotation.x = 0.2;
  group.add(strikerPivot);

  return { group, fishMesh, strikerPivot };
}

/**
 * 4. Đại Hồng Chung (Đặt ở góc trái chánh điện)
 */
export function buildBellAltar() {
  const group = new THREE.Group();
  group.position.set(-2.4, 0.2, -3.8);

  const standColL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.8, 10), MAT.woodPillar);
  standColL.position.set(-0.55, 0.9, 0);
  const standColR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.8, 10), MAT.woodPillar);
  standColR.position.set(0.55, 0.9, 0);
  const beam = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.14, 0.14), MAT.woodPillar);
  beam.position.set(0, 1.75, 0);
  group.add(standColL, standColR, beam);

  const bellPivot = new THREE.Group();
  bellPivot.position.set(0, 1.68, 0);

  const bellMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.5, 0.8, 24, 1, true), MAT.bronze);
  bellMesh.position.y = -0.52;
  bellPivot.add(bellMesh);

  const bellTop = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), MAT.bronze);
  bellTop.position.y = -0.12;
  bellPivot.add(bellTop);
  group.add(bellPivot);

  // Chày gỗ đâm chuông
  const strikerGroup = new THREE.Group();
  strikerGroup.position.set(0, 0.85, 0.7);
  const strikerLog = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.75, 12), MAT.woodLim);
  strikerLog.rotation.x = Math.PI / 2;
  strikerGroup.add(strikerLog);
  group.add(strikerGroup);

  return { group, bellPivot, bellMesh, strikerGroup };
}

/**
 * 5. Đạo Tràng Phật Tử Ngồi Thiền & Bồ Đoàn Trong Điện
 */
export function buildSanghaCongregation(count = 18) {
  const group = new THREE.Group();
  const sanghaMembers = [];

  // 3 hàng ghế bồ đoàn (mỗi hàng 6 người ngồi kiết già chắp tay tụng kinh)
  const rows = [
    { z: -1.2, count: 6, spacing: 1.1 },
    { z: 0.8, count: 6, spacing: 1.2 },
    { z: 2.8, count: 6, spacing: 1.3 }
  ];

  rows.forEach((row) => {
    const startX = -((row.count - 1) * row.spacing) / 2;
    for (let i = 0; i < row.count; i++) {
      // Để lối đi ở giữa
      if (i === 2 || i === 3) continue;

      const x = startX + i * row.spacing;
      const z = row.z;

      // Đệm bồ đoàn tròn màu đỏ
      const bodhiCushion = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.38, 0.12, 16),
        MAT.cushionRed
      );
      bodhiCushion.position.set(x, -0.94, z);
      group.add(bodhiCushion);

      // Thân Phật tử ngồi kiết già
      const monk = new THREE.Group();
      monk.position.set(x, -0.88, z);

      const monkLegs = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.34, 0.28, 10), MAT.aoLam);
      monkLegs.position.y = 0.14;
      monk.add(monkLegs);

      const monkTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.55, 10), MAT.aoLam);
      monkTorso.position.y = 0.48;
      monk.add(monkTorso);

      const monkHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), MAT.skin);
      monkHead.position.y = 0.85;
      monk.add(monkHead);

      // Hai tay chắp trước ngực
      const monkArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.28), MAT.aoLam);
      monkArmL.position.set(-0.1, 0.48, 0.15);
      monkArmL.rotation.set(0.6, 0, 0.35);
      const monkArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.28), MAT.aoLam);
      monkArmR.position.set(0.1, 0.48, 0.15);
      monkArmR.rotation.set(0.6, 0, -0.35);
      monk.add(monkArmL, monkArmR);

      group.add(monk);
      sanghaMembers.push(monk);
    }
  });

  return { group, sanghaMembers };
}

/**
 * 6. Nhân vật Đại Diện Người Dâng Lễ (Tiến lên thắp hương / vái lạy)
 */
export function buildDevoteeAvatar() {
  const devotee = new THREE.Group();
  devotee.position.set(0, -0.88, 1.2); // Đứng trước lư hương

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 0.95, 12), MAT.aoLam);
  body.position.y = 0.48;
  devotee.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 14), MAT.skin);
  head.position.y = 1.15;
  devotee.add(head);

  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.45), MAT.aoLam);
  armL.position.set(-0.16, 0.72, 0.22);
  armL.rotation.set(0.7, 0, 0.35);

  const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.45), MAT.aoLam);
  armR.position.set(0.16, 0.72, 0.22);
  armR.rotation.set(0.7, 0, -0.35);
  devotee.add(armL, armR);

  return { devotee, body, head, armL, armR };
}

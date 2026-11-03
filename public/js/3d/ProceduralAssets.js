/**
 * Procedural 3D Assets Generator — Chùa An Lạc
 * Toàn bộ hình khối dựng 100% bằng Three.js Procedural Geometry (Low-poly, màu ấm),
 * không tải ảnh hay mô hình từ bên ngoài.
 */

import * as THREE from 'three';

// Bảng vật liệu dùng chung
export const MAT = {
  brick: new THREE.MeshStandardMaterial({ color: 0x8f432b, roughness: 0.9 }),
  stone: new THREE.MeshStandardMaterial({ color: 0x767069, roughness: 0.85 }),
  woodRed: new THREE.MeshStandardMaterial({ color: 0x7b2016, roughness: 0.65 }),
  woodDark: new THREE.MeshStandardMaterial({ color: 0x3c2113, roughness: 0.75 }),
  roofTile: new THREE.MeshStandardMaterial({ color: 0xa8321e, roughness: 0.6 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xf4c44e, metalness: 0.65, roughness: 0.25, emissive: 0x3a2400 }),
  bronze: new THREE.MeshStandardMaterial({ color: 0x5c4628, metalness: 0.7, roughness: 0.35 }),
  wallYellow: new THREE.MeshStandardMaterial({ color: 0xd9a14a, roughness: 0.8 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x3b6e38, roughness: 0.8 }),
  lanternRed: new THREE.MeshBasicMaterial({ color: 0xff3b1f }),
  silkRed: new THREE.MeshBasicMaterial({ color: 0xe62222, side: THREE.DoubleSide }),
  water: new THREE.MeshStandardMaterial({ color: 0x1d4e56, roughness: 0.25, metalness: 0.2 })
};

/**
 * Tạo biển chữ Quốc ngữ bằng HTML5 Canvas 2D
 */
export function createSignboard(text, width = 4.2, height = 1.0, bg = '#3a180c', border = '#f2c14e') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = border;
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 496, 112);
  ctx.fillStyle = '#ffd978';
  ctx.font = 'bold 44px -apple-system, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 66);

  const tex = new THREE.CanvasTexture(canvas);
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.18),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  return mesh;
}

/**
 * Dựng mái cong truyền thống chùa Việt kèm 4 đầu đao cong vút
 */
export function createCurvedRoof(w, d, h, yOffset) {
  const group = new THREE.Group();
  const maxDim = Math.max(w, d);
  const baseRoof = new THREE.Mesh(new THREE.ConeGeometry(maxDim * 0.72, h, 4), MAT.roofTile);
  baseRoof.rotation.y = Math.PI / 4;
  baseRoof.scale.set(w / maxDim, 1, d / maxDim);
  baseRoof.castShadow = true;
  group.add(baseRoof);

  const corners = [[-w/2, -d/2], [w/2, -d/2], [-w/2, d/2], [w/2, d/2]];
  corners.forEach(([cx, cz]) => {
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.9, 5), MAT.roofTile);
    tip.position.set(cx * 0.95, -h * 0.25, cz * 0.95);
    tip.rotation.z = cx > 0 ? -0.35 : 0.35;
    tip.rotation.x = cz > 0 ? 0.35 : -0.35;
    group.add(tip);
  });
  group.position.y = yOffset;
  return group;
}

/**
 * 1. Cổng Tam Quan Chùa An Lạc (z = 26)
 */
export function buildTamQuanGate() {
  const gate = new THREE.Group();
  gate.position.set(0, 0, 26);

  const pillarX = [-7.5, -2.8, 2.8, 7.5];
  pillarX.forEach(px => {
    const col = new THREE.Mesh(new THREE.BoxGeometry(1.2, 6.2, 1.2), MAT.wallYellow);
    col.position.set(px, 3.1, 0);
    col.castShadow = true;
    gate.add(col);
  });

  const centerBeam = new THREE.Mesh(new THREE.BoxGeometry(6.8, 1.1, 1.5), MAT.woodRed);
  centerBeam.position.set(0, 5.8, 0);
  gate.add(centerBeam);
  gate.add(createCurvedRoof(7.8, 3.2, 2.2, 7.2));

  const leftRoof = createCurvedRoof(5.4, 2.6, 1.6, 5.8);
  leftRoof.position.x = -5.2;
  gate.add(leftRoof);

  const rightRoof = createCurvedRoof(5.4, 2.6, 1.6, 5.8);
  rightRoof.position.x = 5.2;
  gate.add(rightRoof);

  const sign = createSignboard("CHÙA AN LẠC", 4.6, 1.05);
  sign.position.set(0, 5.8, 0.82);
  gate.add(sign);

  // Tường bao hai bên
  const wallL = new THREE.Mesh(new THREE.BoxGeometry(18, 2.6, 0.6), MAT.wallYellow);
  wallL.position.set(-16.5, 1.3, 0);
  gate.add(wallL);
  const wallR = new THREE.Mesh(new THREE.BoxGeometry(18, 2.6, 0.6), MAT.wallYellow);
  wallR.position.set(16.5, 1.3, 0);
  gate.add(wallR);

  return gate;
}

/**
 * 2. Lư Hương Đồng Lớn Giữa Sân (0, 0, 5)
 */
export function buildMainCenser() {
  const censer = new THREE.Group();
  censer.position.set(0, 0, 5);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2.0, 0.45, 12), MAT.stone);
  base.position.y = 0.22;
  censer.add(base);

  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.05, 1.5, 16), MAT.bronze);
  body.position.y = 1.25;
  body.castShadow = true;
  censer.add(body);

  const ash = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.22, 0.2, 16), new THREE.MeshStandardMaterial({ color: 0xb8afa3 }));
  ash.position.y = 1.92;
  censer.add(ash);

  [-1.45, 1.45].forEach(ox => {
    const ear = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.09, 8, 16), MAT.bronze);
    ear.position.set(ox, 1.45, 0);
    censer.add(ear);
  });

  const censerLight = new THREE.PointLight(0xff7722, 1.4, 9);
  censerLight.position.set(0, 2.6, 0);
  censer.add(censerLight);

  const incenseSticks = new THREE.Group();
  incenseSticks.position.set(0, 2.0, 0);
  censer.add(incenseSticks);

  return { censer, incenseSticks, censerLight };
}

/**
 * Nén hương cắm vào lư hương
 */
export function createIncenseStick(dx = 0, dz = 0, scale = 1.0) {
  const stick = new THREE.Group();
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02 * scale, 0.02 * scale, 0.75 * scale, 6),
    new THREE.MeshBasicMaterial({ color: 0xb8291d })
  );
  stem.position.y = 0.37 * scale;
  stick.add(stem);

  const tip = new THREE.Mesh(
    new THREE.SphereGeometry(0.04 * scale, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0xff4500 })
  );
  tip.position.y = 0.76 * scale;
  stick.add(tip);

  stick.position.set(dx, 0, dz);
  stick.rotation.x = (Math.random() - 0.5) * 0.12;
  stick.rotation.z = (Math.random() - 0.5) * 0.12;
  return stick;
}

/**
 * 3. Đại Hùng Bảo Điện, Tượng Phật Thích Ca & Bàn Gõ Mõ
 */
export function buildMainHall() {
  const hall = new THREE.Group();
  hall.position.set(0, 0, -13);

  const platform = new THREE.Mesh(new THREE.BoxGeometry(18, 1.0, 12), MAT.stone);
  platform.position.y = 0.5;
  platform.receiveShadow = true;
  hall.add(platform);

  const steps = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.5, 1.8), MAT.stone);
  steps.position.set(0, 0.25, 6.5);
  hall.add(steps);

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(16.4, 5.5, 0.6), MAT.wallYellow);
  backWall.position.set(0, 3.5, -5.2);
  hall.add(backWall);

  [-8.0, 8.0].forEach(wx => {
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 5.5, 10.8), MAT.wallYellow);
    sideWall.position.set(wx, 3.5, 0);
    hall.add(sideWall);
  });

  [-7.5, -4.2, 4.2, 7.5].forEach(px => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 5.5, 10), MAT.woodRed);
    col.position.set(px, 3.5, 5.2);
    col.castShadow = true;
    hall.add(col);
  });

  hall.add(createCurvedRoof(20.5, 14.5, 3.2, 7.2));
  hall.add(createCurvedRoof(15.5, 10.5, 2.6, 9.6));

  const hallSign = createSignboard("ĐẠI HÙNG BẢO ĐIỆN", 5.2, 1.0);
  hallSign.position.set(0, 6.1, 5.5);
  hall.add(hallSign);

  // Tượng Phật ngồi thiền tòa sen
  const buddhaGroup = new THREE.Group();
  buddhaGroup.position.set(0, 1.0, -2.2);

  const altar = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.4, 2.8), MAT.woodRed);
  altar.position.y = 0.7;
  buddhaGroup.add(altar);

  const lotusBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.45, 1.1, 0.55, 16),
    new THREE.MeshStandardMaterial({ color: 0xe87a90, roughness: 0.5 })
  );
  lotusBase.position.y = 1.65;
  buddhaGroup.add(lotusBase);

  const legs = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.25, 0.65, 14), MAT.gold);
  legs.position.y = 2.2;
  buddhaGroup.add(legs);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.95, 1.45, 14), MAT.gold);
  torso.position.y = 3.15;
  buddhaGroup.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.52, 16, 16), MAT.gold);
  head.position.y = 4.25;
  buddhaGroup.add(head);

  const ushnisha = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), MAT.gold);
  ushnisha.position.y = 4.78;
  buddhaGroup.add(ushnisha);

  // Vòng hào quang phát sáng
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(1.25, 1.65, 32),
    new THREE.MeshBasicMaterial({ color: 0xffe27a, side: THREE.DoubleSide })
  );
  halo.position.set(0, 3.85, -0.55);
  buddhaGroup.add(halo);

  const buddhaLight = new THREE.PointLight(0xffd269, 2.2, 16);
  buddhaLight.position.set(0, 4.2, 1.5);
  buddhaGroup.add(buddhaLight);

  hall.add(buddhaGroup);

  // Bàn gõ mõ tụng kinh
  const moTable = new THREE.Group();
  moTable.position.set(3.8, 1.0, 4.2);
  const tableBox = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 1.1), MAT.woodDark);
  tableBox.position.y = 0.35;
  moTable.add(tableBox);

  const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.14, 0.7), new THREE.MeshStandardMaterial({ color: 0xb02117 }));
  cushion.position.y = 0.77;
  moTable.add(cushion);

  const woodenFishMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0x8f4719, roughness: 0.4 })
  );
  woodenFishMesh.scale.set(1.15, 0.85, 1.0);
  woodenFishMesh.position.y = 0.98;
  moTable.add(woodenFishMesh);
  hall.add(moTable);

  return { hall, woodenFishMesh, buddhaLight, halo };
}

/**
 * 4. Gác Chuông & Quả Đại Hồng Chung (-13, 0, 1)
 */
export function buildBellTower() {
  const tower = new THREE.Group();
  tower.position.set(-13, 0, 1);

  const base = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.9, 6.2), MAT.stone);
  base.position.y = 0.45;
  tower.add(base);

  [[-2.4, -2.4], [2.4, -2.4], [-2.4, 2.4], [2.4, 2.4]].forEach(([cx, cz]) => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 4.6, 10), MAT.woodRed);
    col.position.set(cx, 3.1, cz);
    tower.add(col);
  });

  tower.add(createCurvedRoof(7.6, 7.6, 2.5, 6.1));

  const bellMesh = new THREE.Group();
  bellMesh.position.set(0, 4.6, 0);
  const bellBody = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.92, 1.85, 16), MAT.bronze);
  bellBody.position.y = -1.1;
  bellBody.castShadow = true;
  bellMesh.add(bellBody);
  tower.add(bellMesh);

  const striker = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 8), MAT.woodDark);
  striker.rotation.z = Math.PI / 2;
  striker.position.set(1.3, 3.3, 0);
  tower.add(striker);

  const sign = createSignboard("GÁC CHUÔNG", 3.0, 0.72);
  sign.position.set(0, 4.9, 2.6);
  tower.add(sign);

  const light = new THREE.PointLight(0xffaa44, 1.2, 10);
  light.position.set(0, 4.2, 1.5);
  tower.add(light);

  return { tower, bellMesh, striker };
}

/**
 * 5. Cây Bồ Đề Cổ Thụ (13, 0, -1)
 */
export function buildBodhiTree() {
  const tree = new THREE.Group();
  tree.position.set(13, 0, -1);

  const curb = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.55, 16), MAT.stone);
  curb.position.y = 0.27;
  tree.add(curb);

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.45, 5.2, 10), MAT.woodDark);
  trunk.position.y = 2.6;
  trunk.castShadow = true;
  tree.add(trunk);

  const foliagePositions = [
    [0, 6.4, 0, 3.6], [-2.2, 5.3, 1.2, 2.5], [2.2, 5.4, -1.0, 2.5],
    [-1.6, 5.5, -1.8, 2.4], [1.8, 5.2, 1.8, 2.5], [0, 7.8, 0, 2.6]
  ];
  foliagePositions.forEach(([fx, fy, fz, r]) => {
    const leafBall = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), MAT.leaf);
    leafBall.position.set(fx, fy, fz);
    leafBall.castShadow = true;
    tree.add(leafBall);
  });

  const treeLight = new THREE.PointLight(0xffae52, 1.4, 12);
  treeLight.position.set(0, 4.2, 0);
  tree.add(treeLight);

  const ribbonsGroup = new THREE.Group();
  tree.add(ribbonsGroup);

  return { tree, ribbonsGroup };
}

export function createSilkRibbon() {
  const angle = Math.random() * Math.PI * 2;
  const radius = 1.6 + Math.random() * 2.1;
  const rx = Math.cos(angle) * radius;
  const rz = Math.sin(angle) * radius;
  const ry = 3.5 + Math.random() * 1.4;

  const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.95), MAT.silkRed);
  ribbon.position.set(rx, ry, rz);
  ribbon.userData = { phase: Math.random() * Math.PI * 2, baseRotZ: (Math.random() - 0.5) * 0.2 };
  return ribbon;
}

/**
 * 6. Hồ Sen Nhỏ & Đèn Hoa Đăng (13, 0, 12)
 */
export function buildLotusPond() {
  const pond = new THREE.Group();
  pond.position.set(13, 0, 12);

  const border = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 5.0, 0.45, 24), MAT.stone);
  border.position.y = 0.22;
  pond.add(border);

  const water = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.4, 0.36, 24), MAT.water);
  water.position.y = 0.23;
  pond.add(water);

  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + Math.random() * 0.4;
    const r = 1.0 + Math.random() * 2.7;
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.03, 12),
      new THREE.MeshStandardMaterial({ color: 0x2e6f36 })
    );
    pad.position.set(Math.cos(a) * r, 0.43, Math.sin(a) * r);
    pond.add(pad);

    if (i % 2 === 0) {
      const flower = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 0.28, 7),
        new THREE.MeshStandardMaterial({ color: 0xff8da6, emissive: 0x331018 })
      );
      flower.position.set(pad.position.x, 0.56, pad.position.z);
      pond.add(flower);
    }
  }

  const pondLight = new THREE.PointLight(0xffbb66, 1.3, 11);
  pondLight.position.set(0, 1.8, 0);
  pond.add(pondLight);

  return { pond };
}

export function createLotusLantern(baseX = 13, baseZ = 12) {
  const lantern = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.16, 0.08, 8),
    new THREE.MeshBasicMaterial({ color: 0xff6b8b })
  );
  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffe484 })
  );
  flame.position.y = 0.09;
  lantern.add(base, flame);

  const angle = Math.random() * Math.PI * 2;
  const radius = 0.5 + Math.random() * 3.2;
  lantern.position.set(baseX + Math.cos(angle) * radius, 0.45, baseZ + Math.sin(angle) * radius);
  lantern.userData = { angle, radius, speed: 0.12 + Math.random() * 0.15, baseX, baseZ };
  return lantern;
}

/**
 * 7. Bàn Xin Quẻ Đầu Năm (-13, 0, 12)
 */
export function buildFortuneStation() {
  const booth = new THREE.Group();
  booth.position.set(-13, 0, 12);

  const table = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.0, 1.6), MAT.woodRed);
  table.position.y = 0.5;
  table.castShadow = true;
  booth.add(table);

  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.22, 0.65, 12),
    new THREE.MeshStandardMaterial({ color: 0xb8251a })
  );
  tube.position.set(0, 1.32, 0);
  booth.add(tube);

  for (let i = 0; i < 8; i++) {
    const stick = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.35, 0.02),
      new THREE.MeshBasicMaterial({ color: 0xf6d28b })
    );
    stick.position.set((Math.random() - 0.5) * 0.2, 1.68, (Math.random() - 0.5) * 0.2);
    booth.add(stick);
  }

  const umbrellaPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.6, 8), MAT.woodDark);
  umbrellaPole.position.set(0, 1.8, -0.5);
  booth.add(umbrellaPole);
  booth.add(createCurvedRoof(3.8, 3.2, 1.2, 3.8));

  const sign = createSignboard("XIN QUẺ ĐẦU NĂM", 2.8, 0.65);
  sign.position.set(0, 3.1, 1.1);
  booth.add(sign);

  return { booth, tube };
}

/**
 * 8. Hàng Đèn Lồng Đỏ Dọc Sân
 */
export function buildLanternRows() {
  const group = new THREE.Group();
  const lanterns = [];
  const zCoords = [-4, 3, 10, 17, 23];
  const xSides = [-5.8, 5.8];

  zCoords.forEach(z => {
    xSides.forEach(x => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.6, 8), MAT.woodDark);
      post.position.set(x, 1.8, z);
      group.add(post);

      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), MAT.lanternRed);
      lantern.scale.y = 1.25;
      lantern.position.set(x, 3.4, z);
      lantern.userData = { phase: Math.random() * Math.PI * 2, baseX: x };
      group.add(lantern);
      lanterns.push(lantern);
    });
  });

  return { group, lanterns };
}

/**
 * 9. Nhân vật Chibi Áo Lam (Người chơi)
 */
export function buildPlayerChibi() {
  const player = new THREE.Group();
  player.position.set(0, 0, 21);

  const aoLamMat = new THREE.MeshStandardMaterial({ color: 0x6f8596, roughness: 0.75 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdab8, roughness: 0.6 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x1d1614, roughness: 0.8 });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.44, 1.05, 12), aoLamMat);
  body.position.y = 0.55;
  body.castShadow = true;
  player.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 14), skinMat);
  head.position.y = 1.38;
  head.castShadow = true;
  player.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), hairMat);
  hair.position.y = 1.42;
  hair.rotation.x = -0.15;
  player.add(hair);

  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.52, 8), aoLamMat);
  leftArm.position.set(-0.36, 0.78, 0.12);
  leftArm.rotation.z = -0.25;

  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.52, 8), aoLamMat);
  rightArm.position.set(0.36, 0.78, 0.12);
  rightArm.rotation.z = 0.25;
  player.add(leftArm, rightArm);

  return { player, body, head, leftArm, rightArm };
}

/**
 * 10. Tạo các vật phẩm cúng dường linh thiêng khi nổ quà donate lớn
 */
export function createSacredGiftVisual(actionType, userNickname = '') {
  const group = new THREE.Group();

  if (actionType === 'OFFERING_FRUIT') {
    // Mâm ngũ quả dâng bàn Phật
    const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 0.1, 16), MAT.gold);
    group.add(tray);
    for (let i = 0; i < 5; i++) {
      const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xff4422 : 0xffaa00 }));
      fruit.position.set(Math.cos(i * 1.25) * 0.25, 0.16, Math.sin(i * 1.25) * 0.25);
      group.add(fruit);
    }
    group.position.set(0, 1.9, -11.5);
  } else if (actionType === 'PARADE_FLOAT') {
    // Cộ hoa rước lễ quanh sân
    const floatBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 3.2), MAT.woodRed);
    const canopy = createCurvedRoof(2.8, 3.6, 1.2, 1.8);
    group.add(floatBase, canopy);
    group.position.set(0, 0.3, 10);
  } else if (actionType === 'GOLDEN_PAGODA') {
    // Bảo tháp Phật Quang 7 tầng
    for (let tier = 0; tier < 5; tier++) {
      const w = 2.4 - tier * 0.35;
      const roof = createCurvedRoof(w, w, 0.8, tier * 1.1 + 0.8);
      const floor = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, 0.8, w * 0.7), MAT.gold);
      floor.position.y = tier * 1.1 + 0.4;
      group.add(roof, floor);
    }
    group.position.set(0, 0, 0);
  } else if (actionType === 'GOLDEN_LION') {
    // Kim Sư Tử hộ pháp uy dũng
    const lionBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 2.0), MAT.gold);
    lionBody.position.y = 1.0;
    const lionHead = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12), MAT.gold);
    lionHead.position.set(0, 1.8, 0.9);
    group.add(lionBody, lionHead);
    group.position.set(0, 0, 6.5);
  } else if (actionType === 'GOLDEN_PHOENIX') {
    // Kim Phượng Hoàng bay lượn
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.8, 8), MAT.gold);
    body.rotation.x = Math.PI / 2;
    const wingL = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.8), MAT.gold);
    wingL.position.set(-1.1, 0, 0);
    const wingR = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.8), MAT.gold);
    wingR.position.set(1.1, 0, 0);
    group.add(body, wingL, wingR);
    group.position.set(0, 7.5, 0);
  }

  return group;
}

/**
 * TempleWorld.js — Không gian Chùa Cổ Việt Nam 3D (80x80m)
 * Dựng Cổng Tam Quan "CHÙA AN LẠC", Sân gạch cổ, Lư Hương Đại Đồng,
 * Đại Hùng Bảo Điện, Gác Chuông, Đàn Tràng Siêu Độ, Cây Bồ Đề, Hồ Sen & Bàn Xin Quẻ.
 */

import * as THREE from 'three';

export class TempleWorld {
  constructor(scene, collisionSystem) {
    this.scene = scene;
    this.collision = collisionSystem;
    this.zones = [];

    // Vật liệu dùng chung (Zero-Lag Material reuse)
    this.mat = {
      brick: new THREE.MeshStandardMaterial({ color: 0x8a3324, roughness: 0.75, metalness: 0.05 }), // Gạch tàu đỏ sẫm
      woodPillar: new THREE.MeshStandardMaterial({ color: 0x5a180d, roughness: 0.4 }), // Gỗ lim đỏ sẫm
      woodLim: new THREE.MeshStandardMaterial({ color: 0x3d1709, roughness: 0.35 }),
      roofTile: new THREE.MeshStandardMaterial({ color: 0xb53526, roughness: 0.55 }), // Ngói đỏ cong
      gold: new THREE.MeshStandardMaterial({ color: 0xf5c342, metalness: 0.85, roughness: 0.22, emissive: 0x332000, emissiveIntensity: 0.25 }),
      bronze: new THREE.MeshStandardMaterial({ color: 0x8f6a32, metalness: 0.8, roughness: 0.3 }),
      stone: new THREE.MeshStandardMaterial({ color: 0x756e66, roughness: 0.85 }),
      water: new THREE.MeshStandardMaterial({ color: 0x1a4552, roughness: 0.15, metalness: 0.6, transparent: true, opacity: 0.82 }),
      lotusPink: new THREE.MeshStandardMaterial({ color: 0xf06292, roughness: 0.4 }),
      leafGreen: new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.7 })
    };

    this.buddhaHalo = null;
    this.altarIncenseGroup = null;
    this.censerIncenseGroup = null;
    this.bodhiSilkGroup = new THREE.Group();
    this.lakeLanternsGroup = new THREE.Group();

    this.scene.add(this.bodhiSilkGroup);
    this.scene.add(this.lakeLanternsGroup);
  }

  build() {
    this._buildGroundAndWalls();
    this._buildTamQuanGate();
    this._buildMainHall();
    this._buildGreatCenser();
    this._buildBellTower();
    this._buildSieuDoAltar();
    this._buildBodhiTree();
    this._buildLotusLake();
    this._buildFortuneTable();
    this._buildLanternCorridor();

    this._registerInteractionZones();
  }

  _buildGroundAndWalls() {
    // Sân gạch chùa 80x80m
    const groundGeo = new THREE.PlaneGeometry(80, 80);
    const ground = new THREE.Mesh(groundGeo, this.mat.brick);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Tường bao quanh chùa
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xd9ba8b, roughness: 0.85 });
    const wallH = 3.6;

    // Tường Bắc (z = -39)
    const wallN = new THREE.Mesh(new THREE.BoxGeometry(80, wallH, 1.2), wallMat);
    wallN.position.set(0, wallH / 2, -39.4);
    this.scene.add(wallN);
    this.collision.addBoxCollider(-40, 40, -40, -38.5, 'Wall_North');

    // Tường Tây (x = -39)
    const wallW = new THREE.Mesh(new THREE.BoxGeometry(1.2, wallH, 80), wallMat);
    wallW.position.set(-39.4, wallH / 2, 0);
    this.scene.add(wallW);
    this.collision.addBoxCollider(-40, -38.5, -40, 40, 'Wall_West');

    // Tường Đông (x = 39)
    const wallE = new THREE.Mesh(new THREE.BoxGeometry(1.2, wallH, 80), wallMat);
    wallE.position.set(39.4, wallH / 2, 0);
    this.scene.add(wallE);
    this.collision.addBoxCollider(38.5, 40, -40, 40, 'Wall_East');

    // Tường Nam hai bên Cổng Tam Quan
    const wallS1 = new THREE.Mesh(new THREE.BoxGeometry(32, wallH, 1.2), wallMat);
    wallS1.position.set(-24, wallH / 2, 39.4);
    const wallS2 = new THREE.Mesh(new THREE.BoxGeometry(32, wallH, 1.2), wallMat);
    wallS2.position.set(24, wallH / 2, 39.4);
    this.scene.add(wallS1, wallS2);
    this.collision.addBoxCollider(-40, -8, 38.5, 40, 'Wall_South_Left');
    this.collision.addBoxCollider(8, 40, 38.5, 40, 'Wall_South_Right');
  }

  /**
   * 1. CỔNG TAM QUAN (Phía Nam, z = 36) — 3 lối vào, bảng tên "CHÙA AN LẠC"
   */
  _buildTamQuanGate() {
    const group = new THREE.Group();
    group.position.set(0, 0, 36.5);

    // 4 Cột trụ cổng chính và cổng phụ
    const pX = [-6.5, -2.5, 2.5, 6.5];
    pX.forEach((px) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(1.0, 6.5, 1.0), this.mat.stone);
      col.position.set(px, 3.25, 0);
      col.castShadow = true;
      group.add(col);
      this.collision.addBoxCollider(px - 0.7, px + 0.7, 35.8, 37.2, 'GatePillar');
    });

    // Mái ngói cong 2 tầng chồng diêm
    const roofMain = new THREE.Mesh(new THREE.ConeGeometry(5.8, 2.2, 4), this.mat.roofTile);
    roofMain.rotation.y = Math.PI / 4;
    roofMain.position.set(0, 7.6, 0);
    const roofLeft = new THREE.Mesh(new THREE.ConeGeometry(3.6, 1.6, 4), this.mat.roofTile);
    roofLeft.rotation.y = Math.PI / 4;
    roofLeft.position.set(-4.5, 6.2, 0);
    const roofRight = new THREE.Mesh(new THREE.ConeGeometry(3.6, 1.6, 4), this.mat.roofTile);
    roofRight.rotation.y = Math.PI / 4;
    roofRight.position.set(4.5, 6.2, 0);
    group.add(roofMain, roofLeft, roofRight);

    // Biển tên CHÙA AN LẠC bằng chữ Quốc ngữ
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#3a110a'; ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 8; ctx.strokeRect(6, 6, 500, 116);
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 44px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('CHÙA AN LẠC', 256, 64);
    const signTex = new THREE.CanvasTexture(canvas);

    const sign = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.05, 0.15), new THREE.MeshBasicMaterial({ map: signTex }));
    sign.position.set(0, 5.7, 0.55);
    group.add(sign);

    this.scene.add(group);
  }

  /**
   * 2. ĐẠI HÙNG BẢO ĐIỆN (Chính Điện phía Bắc, z = -18)
   */
  _buildMainHall() {
    const hall = new THREE.Group();
    hall.position.set(0, 0, -18);

    // Bệ đá tam cấp
    const base = new THREE.Mesh(new THREE.BoxGeometry(22, 1.2, 16), this.mat.stone);
    base.position.set(0, 0.6, 0);
    base.receiveShadow = true;
    hall.add(base);
    this.collision.addBoxCollider(-11.2, 11.2, -26.2, -10.2, 'MainHall_Base');

    // Cột gỗ lim đỏ nâng đỡ mái
    const colCoords = [
      [-9, -6], [-3, -6], [3, -6], [9, -6],
      [-9, 6], [-3, 6], [3, 6], [9, 6]
    ];
    colCoords.forEach(([cx, cz]) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.45, 7.5, 16), this.mat.woodPillar);
      col.position.set(cx, 4.2, cz);
      col.castShadow = true;
      hall.add(col);
    });

    // Mái ngói cong 2 tầng
    const lowerRoof = new THREE.Mesh(new THREE.BoxGeometry(24, 0.8, 18), this.mat.roofTile);
    lowerRoof.position.set(0, 7.8, 0);
    const upperRoof = new THREE.Mesh(new THREE.ConeGeometry(13, 4.2, 4), this.mat.roofTile);
    upperRoof.rotation.y = Math.PI / 4;
    upperRoof.position.set(0, 10.6, 0);
    hall.add(lowerRoof, upperRoof);

    // TƯỢNG PHẬT A DI ĐÀ / THÍCH CA MẠ VÀNG
    const buddhaGroup = new THREE.Group();
    buddhaGroup.position.set(0, 1.2, -2.5);

    // Bàn thờ gỗ lim tam cấp
    const altar = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.4, 3.2), this.mat.woodLim);
    altar.position.set(0, 0.7, 0);
    buddhaGroup.add(altar);

    // Tòa sen vàng
    const lotus = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.3, 0.6, 18), this.mat.lotusPink);
    lotus.position.set(0, 1.7, 0);
    buddhaGroup.add(lotus);

    // Thân tượng Phật ngồi kiết già mạ vàng
    const legs = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 0.7, 16), this.mat.gold);
    legs.position.set(0, 2.3, 0);
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.95, 1.5, 16), this.mat.gold);
    torso.position.set(0, 3.35, 0);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 18, 18), this.mat.gold);
    head.position.set(0, 4.5, 0);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), this.mat.gold);
    hair.position.set(0, 5.05, 0);

    buddhaGroup.add(legs, torso, head, hair);

    // Hào quang tròn sau đầu xoay chậm
    this.buddhaHalo = new THREE.Group();
    this.buddhaHalo.position.set(0, 4.5, -0.6);
    const haloDisc = new THREE.Mesh(
      new THREE.CircleGeometry(1.65, 32),
      new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
    );
    this.buddhaHalo.add(haloDisc);
    const haloLight = new THREE.PointLight(0xffd56b, 3.0, 14);
    haloLight.position.set(0, 0, 0.8);
    this.buddhaHalo.add(haloLight);
    buddhaGroup.add(this.buddhaHalo);

    // Bàn Mõ Gỗ & Chuông Gia Trì góc phải bàn thờ
    const bellPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.7, 12), this.mat.woodLim);
    bellPillar.position.set(2.4, 1.75, 0.6);
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), this.mat.bronze);
    bowl.position.set(2.4, 2.1, 0.6);
    bowl.rotation.x = Math.PI;

    const fishPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.7, 12), this.mat.woodLim);
    fishPillar.position.set(-2.4, 1.75, 0.6);
    const fishMesh = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 12), this.mat.woodLim);
    fishMesh.position.set(-2.4, 2.15, 0.6);
    fishMesh.scale.set(1.15, 0.8, 1.05);

    buddhaGroup.add(bellPillar, bowl, fishPillar, fishMesh);

    hall.add(buddhaGroup);
    this.scene.add(hall);
  }

  /**
   * 3. LƯ HƯƠNG ĐẠI ĐỒNG (Giữa sân, x = 0, z = 8)
   */
  _buildGreatCenser() {
    const group = new THREE.Group();
    group.position.set(0, 0, 8);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, 0.35, 16), this.mat.bronze);
    base.position.y = 0.18;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.85, 1.0, 24), this.mat.bronze);
    body.position.y = 0.85;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.08, 12, 32), this.mat.bronze);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 1.35;

    // 2 Tai rồng uốn lượn
    [-1.35, 1.35].forEach((ex) => {
      const ear = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.08, 8, 16), this.mat.bronze);
      ear.position.set(ex, 0.9, 0);
      group.add(ear);
    });

    const ash = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.12, 24), new THREE.MeshStandardMaterial({ color: 0x827a72 }));
    ash.position.y = 1.32;

    this.censerIncenseGroup = new THREE.Group();
    this.censerIncenseGroup.position.set(0, 1.36, 0);

    // Cắm sẵn 9 nén hương đỏ
    for (let i = 0; i < 9; i++) {
      this._addStick(this.censerIncenseGroup, (Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.9);
    }

    group.add(base, body, rim, ash, this.censerIncenseGroup);
    this.scene.add(group);

    this.collision.addCircleCollider(0, 8, 1.5, 'GreatCenser');
  }

  _addStick(group, dx = 0, dz = 0) {
    const stick = new THREE.Group();
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.75, 6),
      new THREE.MeshBasicMaterial({ color: 0xb52418 })
    );
    stem.position.y = 0.37;
    const ember = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xff3b00 })
    );
    ember.position.y = 0.75;
    stick.add(stem, ember);
    stick.position.set(dx, 0, dz);
    group.add(stick);
  }

  /**
   * 4. GÁC CHUÔNG (Phía Tây, x = -20, z = 4) — Đại Hồng Chung đồng & Chày gỗ
   */
  _buildBellTower() {
    const tower = new THREE.Group();
    tower.position.set(-20, 0, 4);

    // Bệ đá
    const base = new THREE.Mesh(new THREE.BoxGeometry(7, 0.8, 7), this.mat.stone);
    base.position.y = 0.4;
    tower.add(base);

    // 4 Cột gỗ
    [[-2.6, -2.6], [-2.6, 2.6], [2.6, -2.6], [2.6, 2.6]].forEach(([cx, cz]) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 6.5, 12), this.mat.woodPillar);
      col.position.set(cx, 3.65, cz);
      tower.add(col);
    });

    // Mái ngói cong gác chuông
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.4, 4), this.mat.roofTile);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(0, 7.6, 0);
    tower.add(roof);

    // ĐẠI HỒNG CHUNG BẰNG ĐỒNG
    const bellGroup = new THREE.Group();
    bellGroup.position.set(0, 4.2, 0);

    const bellMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 1.25, 2.2, 24, 1, true), this.mat.bronze);
    const bellTop = new THREE.Mesh(new THREE.SphereGeometry(0.66, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), this.mat.bronze);
    bellTop.position.y = 1.1;
    bellGroup.add(bellMesh, bellTop);

    // Chày gỗ đánh chuông
    const striker = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.2, 10), this.mat.woodLim);
    striker.rotation.x = Math.PI / 2;
    striker.position.set(0, -0.2, 1.2);
    bellGroup.add(striker);

    tower.add(bellGroup);
    this.scene.add(tower);

    this.collision.addBoxCollider(-23.8, -16.2, 0.2, 7.8, 'BellTower');
  }

  /**
   * 5. ĐÀN TRÀNG SIÊU ĐỘ (Góc Tây Bắc, x = -18, z = -18)
   */
  _buildSieuDoAltar() {
    const altar = new THREE.Group();
    altar.position.set(-18, 0, -18);

    // Bệ đá tròn chạm khắc hoa sen bát giác
    const base1 = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 5.2, 0.6, 8), this.mat.stone);
    base1.position.y = 0.3;
    const base2 = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.2, 0.5, 8), this.mat.stone);
    base2.position.y = 0.85;

    // Đài hoa sen tâm linh ở giữa đàn tràng
    const lotusCenter = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.1, 0.5, 16), this.mat.lotusPink);
    lotusCenter.position.y = 1.35;
    altar.add(base1, base2, lotusCenter);

    // 4 Cột trụ đá linh đăng xung quanh
    [[-3.2, 0], [3.2, 0], [0, -3.2], [0, 3.2]].forEach(([px, pz]) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 2.4, 8), this.mat.stone);
      col.position.set(px, 1.2, pz);
      const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 0.45), this.mat.bronze);
      lantern.position.set(px, 2.4, pz);
      const light = new THREE.PointLight(0xffeb99, 1.2, 4.5);
      light.position.set(px, 2.5, pz);
      altar.add(col, lantern, light);
    });

    this.scene.add(altar);
    this.collision.addCircleCollider(-18, -18, 3.8, 'SieuDoAltar');
  }

  /**
   * 6. CÂY BỒ ĐỀ CỔ THỤ (Góc Đông Bắc, x = 18, z = -8) — Tán rộng rủ dải lụa đỏ
   */
  _buildBodhiTree() {
    const tree = new THREE.Group();
    tree.position.set(18, 0, -8);

    // Thân cây cổ thụ uốn lượn
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e1b, roughness: 0.9 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 7.5, 12), trunkMat);
    trunk.position.y = 3.75;
    tree.add(trunk);

    // Tán lá Bồ Đề xum xuê
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x245828, roughness: 0.85 });
    const c1 = new THREE.Mesh(new THREE.SphereGeometry(4.8, 12, 10), canopyMat);
    c1.position.set(0, 8.5, 0);
    const c2 = new THREE.Mesh(new THREE.SphereGeometry(3.6, 10, 8), canopyMat);
    c2.position.set(-2.5, 7.2, 1.5);
    const c3 = new THREE.Mesh(new THREE.SphereGeometry(3.6, 10, 8), canopyMat);
    c3.position.set(2.5, 7.2, -1.5);
    tree.add(c1, c2, c3);

    // Cắm sẵn các dải lụa đỏ cầu an
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const dist = 2.2 + Math.random() * 2.2;
      const silk = new THREE.Mesh(
        new THREE.PlaneGeometry(0.18, 1.6),
        new THREE.MeshStandardMaterial({ color: 0xd32f2f, side: THREE.DoubleSide })
      );
      silk.position.set(Math.cos(angle) * dist, 5.5 + Math.random() * 0.8, Math.sin(angle) * dist);
      silk.rotation.y = angle;
      this.bodhiSilkGroup.add(silk);
    }

    this.scene.add(tree);
    this.collision.addCircleCollider(18, -8, 2.2, 'BodhiTree');
  }

  addSilkToTree(text) {
    const silk = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 2.0),
      new THREE.MeshStandardMaterial({ color: 0xff1744, side: THREE.DoubleSide, emissive: 0x550000 })
    );
    const angle = Math.random() * Math.PI * 2;
    const dist = 2.2 + Math.random() * 1.8;
    silk.position.set(18 + Math.cos(angle) * dist, 5.2, -8 + Math.sin(angle) * dist);
    silk.rotation.y = angle;
    this.bodhiSilkGroup.add(silk);
  }

  /**
   * 7. HỒ SEN BÁN NGUYỆT (Góc Đông Nam, x = 20, z = 14)
   */
  _buildLotusLake() {
    const lake = new THREE.Group();
    lake.position.set(20, 0, 14);

    // Bờ hồ đá hình tròn
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.6, 0.45, 28, 1, true), this.mat.stone);
    rim.position.y = 0.22;
    lake.add(rim);

    // Mặt nước trong xanh phản chiếu
    const water = new THREE.Mesh(new THREE.CircleGeometry(7.1, 28), this.mat.water);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.15;
    lake.add(water);

    // Lá sen & Hoa sen hồng
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const dist = 1.8 + Math.random() * 4.2;
      const lx = Math.cos(angle) * dist;
      const lz = Math.sin(angle) * dist;

      // Lá sen
      const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.55 + Math.random() * 0.3, 10), this.mat.leafGreen);
      leaf.rotation.x = -Math.PI / 2;
      leaf.position.set(lx, 0.16, lz);
      lake.add(leaf);

      // Hoa sen
      if (i % 2 === 0) {
        const flower = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 6), this.mat.lotusPink);
        flower.position.set(lx, 0.32, lz);
        lake.add(flower);
      }
    }

    // Đèn hoa đăng trôi sẵn
    for (let i = 0; i < 6; i++) {
      this.addLanternToLake((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
    }

    this.scene.add(lake);
    this.collision.addCircleCollider(20, 14, 7.2, 'LotusLake');
  }

  addLanternToLake(dx = 0, dz = 0) {
    const lantern = new THREE.Group();
    lantern.position.set(20 + dx, 0.18, 14 + dz);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.08, 8), this.mat.gold);
    const petal = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.32, 6), this.mat.lotusPink);
    petal.position.y = 0.16;
    const light = new THREE.PointLight(0xffa726, 1.2, 2.5);
    light.position.y = 0.3;

    lantern.add(base, petal, light);
    this.lakeLanternsGroup.add(lantern);
  }

  /**
   * 8. BÀN XIN QUẺ ĐẦU NĂM (Góc Tây Nam, x = -14, z = 18)
   */
  _buildFortuneTable() {
    const tableGroup = new THREE.Group();
    tableGroup.position.set(-14, 0, 18);

    const table = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 1.4), this.mat.woodLim);
    table.position.y = 0.45;
    table.receiveShadow = true;
    tableGroup.add(table);

    // Ống xăm tre
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.55, 12), this.mat.gold);
    cup.position.set(0, 1.15, 0);
    tableGroup.add(cup);

    // Đèn dầu ấm
    const oilLamp = new THREE.PointLight(0xffb74d, 1.1, 3.5);
    oilLamp.position.set(0, 1.4, 0);
    tableGroup.add(oilLamp);

    this.scene.add(tableGroup);
    this.collision.addBoxCollider(-15.4, -12.6, 17.1, 18.9, 'FortuneTable');
  }

  /**
   * 9. HÀNG ĐÈN LỒNG ĐỎ DỌC LỐI ĐI CHÍNH
   */
  _buildLanternCorridor() {
    const zCoords = [30, 24, 18, 12, 4, -2, -8];
    const xCoords = [-3.8, 3.8];

    xCoords.forEach((x) => {
      zCoords.forEach((z) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.8, 8), this.mat.woodLim);
        post.position.set(x, 1.9, z);

        const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), new THREE.MeshStandardMaterial({
          color: 0xd32f2f,
          emissive: 0xff3d00,
          emissiveIntensity: 0.65,
          roughness: 0.3
        }));
        lantern.position.set(x, 3.6, z);

        const light = new THREE.PointLight(0xff6d00, 1.1, 5.0);
        light.position.set(x, 3.6, z);

        this.scene.add(post, lantern, light);
      });
    });
  }

  /**
   * Đăng ký các vùng tương tác (Zones)
   */
  _registerInteractionZones() {
    this.zones = [
      { id: 'ZONE_CENSER', name: 'Thắp Hương', x: 0, z: 8, radius: 3.5, icon: '🕯️' },
      { id: 'ZONE_BELL', name: 'Thỉnh Chuông', x: -20, z: 4, radius: 3.8, icon: '🔔' },
      { id: 'ZONE_ALTAR', name: 'Gõ Mõ & Tụng Kinh', x: 0, z: -14, radius: 5.5, icon: '🪵' },
      { id: 'ZONE_SIEU_DO', name: 'Đàn Tràng Siêu Độ', x: -18, z: -18, radius: 5.0, icon: '✨' },
      { id: 'ZONE_BODHI_TREE', name: 'Treo Lụa Cầu An', x: 18, z: -8, radius: 4.8, icon: '📜' },
      { id: 'ZONE_LOTUS_LAKE', name: 'Thả Đèn Hoa Đăng', x: 20, z: 14, radius: 5.5, icon: '🪷' },
      { id: 'ZONE_FORTUNE', name: 'Xin Quẻ Đầu Năm', x: -14, z: 18, radius: 3.2, icon: '🍀' }
    ];
  }

  /**
   * Kiểm tra người chơi đang đứng trong vùng tương tác nào
   */
  checkInteractionZone(playerPos) {
    if (!playerPos) return null;
    for (let i = 0; i < this.zones.length; i++) {
      const z = this.zones[i];
      const dx = playerPos.x - z.x;
      const dz = playerPos.z - z.z;
      const distSq = dx * dx + dz * dz;
      if (distSq < z.radius * z.radius) {
        return z;
      }
    }
    return null;
  }

  update(elapsed) {
    // Hào quang Phật xoay chậm
    if (this.buddhaHalo) {
      this.buddhaHalo.rotation.z = elapsed * 0.15;
    }
    // Dải lụa đỏ bồ đề đung đưa trong gió
    if (this.bodhiSilkGroup) {
      const silkCount = this.bodhiSilkGroup.children.length;
      for (let i = 0; i < silkCount; i++) {
        const silk = this.bodhiSilkGroup.children[i];
        silk.rotation.z = Math.sin(elapsed * 1.8 + i) * 0.12;
      }
    }
    // Đèn hoa đăng dập dềnh trên mặt nước hồ sen
    if (this.lakeLanternsGroup) {
      const lanternCount = this.lakeLanternsGroup.children.length;
      for (let i = 0; i < lanternCount; i++) {
        const l = this.lakeLanternsGroup.children[i];
        l.position.y = 0.18 + Math.sin(elapsed * 1.6 + i) * 0.025;
      }
    }
  }
}

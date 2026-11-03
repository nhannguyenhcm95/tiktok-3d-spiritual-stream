/**
 * CrowdSystem.js - Đội Hình 64 Phật Tử Áo Xám Quỳ Hai Bên & Vị Sư Áo Vàng Chủ Lễ
 * Tái hiện 100% hình thể quỳ lạy, lộ bàn chân phía sau, vạt áo lệch vai,
 * đổ bóng dài sắc nét trên sàn đá và đồng bộ chu kỳ Quỳ Lạy 7 giây.
 * Tuân thủ chuẩn GRAPHICS_ANTIGRAVITY_SPEC.md
 */

import * as THREE from 'three';

export class CrowdSystem {
  constructor(scene) {
    this.scene = scene;

    this.crowdGroup = new THREE.Group();
    this.scene.add(this.crowdGroup);

    // Bảng màu chuẩn tài liệu đặc tả
    this.colors = {
      GREY_ROBE: 0x54595e,     // Áo tràng xám tro vải thô (#54595E)
      SAFFRON_ROBE: 0xd99b26,  // Y Ca-sa vàng nghệ Saffron (#D99B26)
      SKIN: 0xd8a984,          // Da ấm tự nhiên (#D8A984)
      FEET: 0xcfa07a,          // Lòng bàn chân (#CFA07A)
      BELT: 0x3d4145           // Đai lưng vải thắt eo
    };

    // Danh sách nhân vật
    this.vipCharacters = [];     // 4 VIP hàng đầu
    this.crowdCharacters = [];   // 60 Phật tử hai bên
    this.masterMonk = null;      // Vị Sư Chủ Lễ áo vàng trung tâm

    // Nhân vật Solo Dâng Hương khi có quà tặng
    this.soloCharacter = null;
    this.isSpotlightActive = false;

    // Chu kỳ quỳ lạy đồng bộ (7.0 giây / vòng)
    this.bowCycleDuration = 7.0;
    this.bowCycleTimer = 0;
    this.bowCounter = 1;
    this.onBowCycleCompleted = null;

    // Vector tạm chiếu tọa độ 2D
    this._tempVec = new THREE.Vector3();

    this.init();
  }

  init() {
    this.buildMasterMonk();
    this.buildKneelingCrowdGrid();
    this.buildSoloCharacter();
  }

  /**
   * Vị Sư Chủ Lễ Áo Vàng Đứng Trung Tâm (z = -5.2)
   * Quay lưng lại camera, hướng mặt thành kính về Đại Phật
   */
  buildMasterMonk() {
    const monkGroup = new THREE.Group();
    monkGroup.position.set(0, 0, -5.2);

    const saffronMat = new THREE.MeshStandardMaterial({
      color: this.colors.SAFFRON_ROBE,
      roughness: 0.75,
      metalness: 0.10
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: this.colors.SKIN,
      roughness: 0.65,
      metalness: 0.05
    });

    // 1. Thân áo Ca-sa vàng dài chấm gót
    const robeGeo = new THREE.CylinderGeometry(0.24, 0.38, 1.45, 16);
    const robeMesh = new THREE.Mesh(robeGeo, saffronMat);
    robeMesh.position.y = 0.725;
    robeMesh.castShadow = true;
    robeMesh.receiveShadow = true;
    monkGroup.add(robeMesh);

    // Dải y Ca-sa vắt chéo từ vai trái xuống hông
    const sashGeo = new THREE.BoxGeometry(0.12, 1.4, 0.48);
    const sashMesh = new THREE.Mesh(sashGeo, saffronMat);
    sashMesh.position.set(-0.06, 0.75, 0.02);
    sashMesh.rotation.z = -0.15;
    sashMesh.castShadow = true;
    monkGroup.add(sashMesh);

    // 2. Đầu tròn trang nghiêm
    const headGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.y = 1.58;
    headMesh.castShadow = true;
    monkGroup.add(headMesh);

    // 3. Hai cánh tay chắp trước ngực
    const armGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.45, 8);
    const leftArm = new THREE.Mesh(armGeo, saffronMat);
    leftArm.position.set(-0.24, 1.25, 0.12);
    leftArm.rotation.z = 0.4;
    leftArm.rotation.x = -0.7;
    leftArm.castShadow = true;
    monkGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, saffronMat);
    rightArm.position.set(0.24, 1.25, 0.12);
    rightArm.rotation.z = -0.4;
    rightArm.rotation.x = -0.7;
    rightArm.castShadow = true;
    monkGroup.add(rightArm);

    this.masterMonk = monkGroup;
    this.crowdGroup.add(monkGroup);
  }

  /**
   * Đội Hình 64 Phật Tử Áo Xám Quỳ Hai Bên (Left & Right Kneeling Grid)
   * Để trống lối đi trung tâm rộng 2.4m
   */
  buildKneelingCrowdGrid() {
    // Vật liệu chung
    const greyRobeMat = new THREE.MeshStandardMaterial({
      color: this.colors.GREY_ROBE,
      roughness: 0.88,
      metalness: 0.02,
      transparent: true,
      opacity: 1.0
    });

    const skinMat = new THREE.MeshStandardMaterial({
      color: this.colors.SKIN,
      roughness: 0.65,
      metalness: 0.05,
      transparent: true,
      opacity: 1.0
    });

    const feetMat = new THREE.MeshStandardMaterial({
      color: this.colors.FEET,
      roughness: 0.75,
      transparent: true,
      opacity: 1.0
    });

    const beltMat = new THREE.MeshStandardMaterial({
      color: this.colors.BELT,
      roughness: 0.8,
      transparent: true,
      opacity: 1.0
    });

    // 4 Cột x 8 Hàng ở mỗi bên cánh gà
    const cols = 4;
    const rows = 8;
    let personIdx = 0;

    for (let r = 0; r < rows; r++) {
      const zPos = -3.5 + r * 1.45; // Trải dọc từ trước bàn Phật về đáy màn hình

      for (let c = 0; c < cols; c++) {
        // Cánh Trái (x từ -1.6 ra ngoài -5.8)
        const leftX = -1.6 - c * 1.35;
        // Cánh Phải (x từ +1.6 ra ngoài +5.8)
        const rightX = 1.6 + c * 1.35;

        // Xếp vị trí 2 bên
        const positions = [
          { x: leftX, z: zPos, side: 'LEFT' },
          { x: rightX, z: zPos, side: 'RIGHT' }
        ];

        positions.forEach((pos) => {
          const isVipSeat = r === 0 && c < 2; // 4 ghế VIP ở hàng đầu tiên
          const char = this.createKneelingFigureMesh(greyRobeMat, skinMat, feetMat, beltMat, isVipSeat);
          char.group.position.set(pos.x, 0, pos.z);

          if (isVipSeat) {
            const vipRank = this.vipCharacters.length + 1;
            char.rank = vipRank;
            char.nickname = `${vipRank}. Thí Chủ VIP`;
            char.uniqueId = `vip_${vipRank}`;
            char.isVip = true;
            this.vipCharacters.push(char);
          } else {
            char.slotIndex = personIdx;
            char.nickname = `Phật Tử ${personIdx + 1}`;
            char.uniqueId = `crowd_${personIdx + 1}`;
            char.isVip = false;
            this.crowdCharacters.push(char);
            personIdx++;
          }

          this.crowdGroup.add(char.group);
        });
      }
    }
  }

  /**
   * Tạo Hình 1 Phật Tử Quỳ Lạy Chi Tiết (Anatomical Kneeling Figure)
   * Lộ rõ hai bàn chân dựng đứng phía sau gót, vạt áo lệch vai
   */
  createKneelingFigureMesh(robeMat, skinMat, feetMat, beltMat, isVip = false) {
    const group = new THREE.Group();

    // 1. Phần chân quỳ gập sát sàn & Bắp vạt áo phủ đùi
    const lapGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.26, 14);
    const lapMesh = new THREE.Mesh(lapGeo, robeMat);
    lapMesh.position.y = 0.13;
    lapMesh.castShadow = true;
    lapMesh.receiveShadow = true;
    group.add(lapMesh);

    // 2. Hai Lòng Bàn Chân Lộ Phía Sau (Đúng tư thế quỳ truyền thống trong ảnh mẫu)
    const footGeo = new THREE.CapsuleGeometry(0.045, 0.11, 4, 8);
    // Bàn chân trái
    const leftFoot = new THREE.Mesh(footGeo, feetMat);
    leftFoot.position.set(-0.11, 0.08, 0.22);
    leftFoot.rotation.x = Math.PI / 2;
    leftFoot.castShadow = true;
    group.add(leftFoot);

    // Bàn chân phải
    const rightFoot = new THREE.Mesh(footGeo, feetMat);
    rightFoot.position.set(0.11, 0.08, 0.22);
    rightFoot.rotation.x = Math.PI / 2;
    rightFoot.castShadow = true;
    group.add(rightFoot);

    // 3. Khớp Thân Mình (Torso Pivot) gập lạy
    const torsoPivot = new THREE.Group();
    torsoPivot.position.set(0, 0.24, 0);

    // Thân trên áo tràng xám tro
    const torsoGeo = new THREE.CylinderGeometry(0.18, 0.23, 0.48, 14);
    const torso = new THREE.Mesh(torsoGeo, robeMat);
    torso.position.y = 0.24;
    torso.castShadow = true;
    torso.receiveShadow = true;
    torsoPivot.add(torso);

    // Đai lưng vải thắt gọn ở eo
    const beltGeo = new THREE.CylinderGeometry(0.235, 0.235, 0.07, 14);
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.y = 0.06;
    belt.castShadow = true;
    torsoPivot.add(belt);

    // Vạt áo lệch vai: Vai phải để trần da ấm
    const rightShoulderSkin = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 12), skinMat);
    rightShoulderSkin.position.set(0.17, 0.42, 0);
    rightShoulderSkin.castShadow = true;
    torsoPivot.add(rightShoulderSkin);

    // 4. Khớp Đầu (Head Pivot) đặt trên cổ
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.49, 0);

    const headGeo = new THREE.SphereGeometry(0.165, 14, 14);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 0.12;
    head.castShadow = true;
    headPivot.add(head);

    // Hai tai nhỏ hai bên đầu
    const earGeo = new THREE.CapsuleGeometry(0.025, 0.06, 4, 6);
    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.position.set(-0.165, 0.12, 0);
    headPivot.add(leftEar);
    const rightEar = new THREE.Mesh(earGeo, skinMat);
    rightEar.position.set(0.165, 0.12, 0);
    headPivot.add(rightEar);

    torsoPivot.add(headPivot);

    // 5. Hai Cánh Tay Chắp Trước Ngực (Anjali Mudra)
    const armGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.35, 8);

    // Cánh tay trái khoác áo tràng xám
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.18, 0.42, 0);
    const leftArm = new THREE.Mesh(armGeo, robeMat);
    leftArm.position.y = -0.15;
    leftArm.castShadow = true;
    leftArmPivot.add(leftArm);
    leftArmPivot.rotation.z = 0.35;
    leftArmPivot.rotation.x = -0.68;
    torsoPivot.add(leftArmPivot);

    // Cánh tay phải màu da để trần
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.18, 0.42, 0);
    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.y = -0.15;
    rightArm.castShadow = true;
    rightArmPivot.add(rightArm);
    rightArmPivot.rotation.z = -0.35;
    rightArmPivot.rotation.x = -0.68;
    torsoPivot.add(rightArmPivot);

    group.add(torsoPivot);

    return {
      group,
      torsoPivot,
      headPivot,
      leftArmPivot,
      rightArmPivot,
      materials: [robeMat, skinMat, feetMat, beltMat]
    };
  }

  /**
   * Tạo Nhân Vật Solo Dâng Hương Khoác Y Áo Vàng
   */
  buildSoloCharacter() {
    const saffronMat = new THREE.MeshStandardMaterial({
      color: this.colors.SAFFRON_ROBE,
      roughness: 0.75,
      metalness: 0.10,
      transparent: true,
      opacity: 1.0
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: this.colors.SKIN,
      roughness: 0.65,
      transparent: true,
      opacity: 1.0
    });
    const feetMat = new THREE.MeshStandardMaterial({ color: this.colors.FEET, transparent: true, opacity: 1.0 });
    const beltMat = new THREE.MeshStandardMaterial({ color: 0xb87300, transparent: true, opacity: 1.0 });

    this.soloCharacter = this.createKneelingFigureMesh(saffronMat, skinMat, feetMat, beltMat, true);
    this.soloCharacter.group.position.set(0, -10, 0);
    this.soloCharacter.group.visible = false;
    this.scene.add(this.soloCharacter.group);
  }

  /**
   * Đồng bộ dữ liệu người dùng từ socket `crowd_sync`
   */
  syncCrowdData(payload) {
    if (!payload) return;

    if (Array.isArray(payload.vipSeats)) {
      payload.vipSeats.slice(0, 4).forEach((vip, idx) => {
        if (this.vipCharacters[idx]) {
          this.vipCharacters[idx].nickname = `${vip.rank}. ${vip.nickname}`;
          this.vipCharacters[idx].uniqueId = vip.uniqueId;
        }
      });
    }

    if (Array.isArray(payload.crowdMembers)) {
      payload.crowdMembers.forEach((member) => {
        const slot = member.slotIndex;
        if (slot >= 0 && slot < this.crowdCharacters.length) {
          this.crowdCharacters[slot].nickname = member.nickname;
          this.crowdCharacters[slot].uniqueId = member.uniqueId;
        }
      });
    }
  }

  /**
   * Đồng bộ chu kỳ Quỳ Lạy 7.0 giây / vòng
   */
  updateBowingCycle(delta) {
    if (this.isSpotlightActive) return;

    this.bowCycleTimer += delta;
    if (this.bowCycleTimer >= this.bowCycleDuration) {
      this.bowCycleTimer -= this.bowCycleDuration;
      this.bowCounter++;
      if (typeof this.onBowCycleCompleted === 'function') {
        this.onBowCycleCompleted(this.bowCounter);
      }
    }

    const t = this.bowCycleTimer;
    let bendAngle = 0;
    let headAngle = 0;

    if (t < 2.0) {
      // Giai đoạn 1 (0.0s -> 2.0s): Quỳ tịnh tâm chắp tay, thở nhẹ
      bendAngle = 0.05 + Math.sin(t * Math.PI) * 0.02;
      headAngle = 0.08;
    } else if (t < 3.5) {
      // Giai đoạn 2 (2.0s -> 3.5s): Cúi lạy sát đất / Ngũ thể đầu địa
      const progress = (t - 2.0) / 1.5;
      const ease = Math.sin((progress * Math.PI) / 2);
      bendAngle = ease * 1.15; // Gập lưng sâu 66 độ
      headAngle = ease * 0.75;
    } else if (t < 5.0) {
      // Giai đoạn 3 (3.5s -> 5.0s): Giữ tư thế chí thành sát đất
      bendAngle = 1.15;
      headAngle = 0.75;
    } else {
      // Giai đoạn 4 (5.0s -> 7.0s): Thu mình nâng thân ngồi dậy
      const progress = (t - 5.0) / 2.0;
      const ease = 1 - Math.sin((progress * Math.PI) / 2);
      bendAngle = ease * 1.15;
      headAngle = ease * 0.75;
    }

    // Áp dụng cho toàn bộ nhân vật
    const allChars = [...this.vipCharacters, ...this.crowdCharacters];
    for (let i = 0; i < allChars.length; i++) {
      const c = allChars[i];
      const offset = (i % 6) * 0.015;
      c.torsoPivot.rotation.x = Math.max(0, bendAngle - offset);
      c.headPivot.rotation.x = Math.max(0, headAngle - offset);
    }
  }

  /**
   * Kích hoạt Hiệu ứng "Spotlight Solo Dâng Hương"
   */
  triggerSpotlightIncense(giftData, onStepAltar, onComplete) {
    if (this.isSpotlightActive) return;
    this.isSpotlightActive = true;

    const { nickname, giftName } = giftData;
    this.soloCharacter.nickname = `${nickname} 🌹`;
    this.soloCharacter.giftName = giftName;

    // Bước 1: Fade-out toàn bộ 64 Phật tử hai bên và Vị Sư áo vàng (0.45s)
    this.fadeCrowd(0, 0.45, () => {
      // Bước 2: Nhân vật Solo xuất hiện ở cuối lối đi trung tâm
      this.soloCharacter.group.visible = true;
      this.soloCharacter.group.position.set(0, 0, 10.5);
      this.soloCharacter.torsoPivot.rotation.x = 0;
      this.soloCharacter.headPivot.rotation.x = 0;
      this.setSoloOpacity(1.0);

      // Bước 3: Bước đi trang nghiêm trên lối đi giữa tiến lên trước đài sen (z = -5.0) trong 1.9s
      const startZ = 10.5;
      const targetZ = -5.0;
      const walkDuration = 1.9;
      let walkElapsed = 0;

      const walkInterval = setInterval(() => {
        walkElapsed += 0.03;
        const p = Math.min(1.0, walkElapsed / walkDuration);
        this.soloCharacter.group.position.z = startZ + (targetZ - startZ) * p;
        this.soloCharacter.group.position.y = Math.sin(p * Math.PI * 10) * 0.05;

        if (p >= 1.0) {
          clearInterval(walkInterval);
          this.soloCharacter.group.position.y = 0;

          // Báo hiệu tới bàn thờ để bùng sáng hào quang + chuông + TTS
          if (typeof onStepAltar === 'function') {
            onStepAltar();
          }

          // Bước 4: Chắp tay và Quỳ Lạy Sâu trước Tam Bảo (2.4s)
          this.animateSoloBow(() => {
            // Bước 5: Mờ dần Solo và Hiện lại Đám Đông (4.7s)
            this.fadeSolo(0, 0.4, () => {
              this.soloCharacter.group.visible = false;
              this.fadeCrowd(1, 0.45, () => {
                this.isSpotlightActive = false;
                if (typeof onComplete === 'function') {
                  onComplete();
                }
              });
            });
          });
        }
      }, 30);
    });
  }

  animateSoloBow(onDone) {
    let bowElapsed = 0;
    const duration = 2.4;
    const interval = setInterval(() => {
      bowElapsed += 0.03;
      const p = bowElapsed / duration;

      if (p < 0.4) {
        const ease = Math.sin((p / 0.4) * (Math.PI / 2));
        this.soloCharacter.torsoPivot.rotation.x = ease * 1.35;
        this.soloCharacter.headPivot.rotation.x = ease * 0.85;
      } else if (p < 0.75) {
        this.soloCharacter.torsoPivot.rotation.x = 1.35;
        this.soloCharacter.headPivot.rotation.x = 0.85;
      } else if (p <= 1.0) {
        const ease = 1 - Math.sin(((p - 0.75) / 0.25) * (Math.PI / 2));
        this.soloCharacter.torsoPivot.rotation.x = ease * 1.35;
        this.soloCharacter.headPivot.rotation.x = ease * 0.85;
      } else {
        clearInterval(interval);
        if (typeof onDone === 'function') onDone();
      }
    }, 30);
  }

  fadeCrowd(targetOpacity, durationSec, callback) {
    const allChars = [...this.vipCharacters, ...this.crowdCharacters];
    let elapsed = 0;
    const startOpacity = allChars[0].materials[0].opacity;
    const totalSteps = (durationSec * 1000) / 25;

    const timer = setInterval(() => {
      elapsed++;
      const p = Math.min(1.0, elapsed / totalSteps);
      const curOpacity = startOpacity + (targetOpacity - startOpacity) * p;

      allChars.forEach((c) => {
        c.materials.forEach((m) => {
          m.opacity = curOpacity;
        });
      });

      if (this.masterMonk) {
        this.masterMonk.children.forEach((mesh) => {
          if (mesh.material) {
            mesh.material.transparent = true;
            mesh.material.opacity = curOpacity;
          }
        });
      }

      if (p >= 1.0) {
        clearInterval(timer);
        if (typeof callback === 'function') callback();
      }
    }, 25);
  }

  setSoloOpacity(opacity) {
    if (this.soloCharacter) {
      this.soloCharacter.materials.forEach((m) => {
        m.opacity = opacity;
      });
    }
  }

  fadeSolo(targetOpacity, durationSec, callback) {
    let elapsed = 0;
    const startOpacity = this.soloCharacter.materials[0].opacity;
    const totalSteps = (durationSec * 1000) / 25;

    const timer = setInterval(() => {
      elapsed++;
      const p = Math.min(1.0, elapsed / totalSteps);
      this.setSoloOpacity(startOpacity + (targetOpacity - startOpacity) * p);

      if (p >= 1.0) {
        clearInterval(timer);
        if (typeof callback === 'function') callback();
      }
    }, 25);
  }

  /**
   * Chiếu tọa độ 3D lên màn hình 2D cho HUD
   */
  getProjectedAnchors(camera, screenWidth, screenHeight) {
    const anchors = [];

    if (this.isSpotlightActive && this.soloCharacter && this.soloCharacter.group.visible) {
      this._tempVec.set(0, 0.8, 0);
      this.soloCharacter.group.localToWorld(this._tempVec);
      this._tempVec.project(camera);

      const x = ((this._tempVec.x + 1) * screenWidth) / 2;
      const y = ((-this._tempVec.y + 1) * screenHeight) / 2;

      anchors.push({
        id: 'solo',
        uniqueId: this.soloCharacter.uniqueId || 'solo',
        nickname: this.soloCharacter.nickname,
        x,
        y,
        isSolo: true,
        visible: this._tempVec.z < 1.0
      });
      return anchors;
    }

    // 1. VIP Seats
    this.vipCharacters.forEach((vip, idx) => {
      this._tempVec.set(0, 0.78, 0);
      vip.group.localToWorld(this._tempVec);
      this._tempVec.project(camera);

      const x = ((this._tempVec.x + 1) * screenWidth) / 2;
      const y = ((-this._tempVec.y + 1) * screenHeight) / 2;

      anchors.push({
        id: `vip_${idx}`,
        uniqueId: vip.uniqueId,
        nickname: vip.nickname,
        x,
        y,
        isVip: true,
        visible: this._tempVec.z < 1.0
      });
    });

    // 2. Crowd Members
    this.crowdCharacters.forEach((crowd, idx) => {
      this._tempVec.set(0, 0.72, 0);
      crowd.group.localToWorld(this._tempVec);
      this._tempVec.project(camera);

      const x = ((this._tempVec.x + 1) * screenWidth) / 2;
      const y = ((-this._tempVec.y + 1) * screenHeight) / 2;

      anchors.push({
        id: `crowd_${idx}`,
        uniqueId: crowd.uniqueId,
        slotIndex: idx,
        nickname: crowd.nickname,
        x,
        y,
        isVip: false,
        visible: this._tempVec.z < 1.0
      });
    });

    return anchors;
  }

  update(delta) {
    this.updateBowingCycle(delta);
  }
}

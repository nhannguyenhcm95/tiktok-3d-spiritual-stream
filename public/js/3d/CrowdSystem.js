/**
 * CrowdSystem.js - Hệ thống 50 Phật tử + 4 Đệm VIP + Spotlight Solo Dâng Hương
 * Dựng hình nhân vật 3D Chibi Đa Khớp nhìn từ sau lưng, đồng bộ chu kỳ Quỳ Lạy,
 * và điều phối hiệu ứng Solo bước lên Thảm Đỏ hoa sen.
 * Tuân thủ chuẩn CONTRACT.md & Role 02
 */

import * as THREE from 'three';

export class CrowdSystem {
  constructor(scene) {
    this.scene = scene;

    // Nhóm chứa toàn bộ đám đông và đệm VIP để điều khiển fade-out / fade-in
    this.crowdGroup = new THREE.Group();
    this.scene.add(this.crowdGroup);

    // Bảng màu 4 kiểu áo Phật tử chuẩn video mẫu
    this.robeColors = {
      GREY: 0x8fa0b5,       // Áo lam / xám thanh nhã
      WHITE: 0xf5f5fa,      // Áo dài trắng thanh khiết
      BROWN: 0x6d4c41,      // Áo tràng nâu trầm tịnh tâm
      MONK_YELLOW: 0xe68a00 // Áo cà sa vàng cam của tiểu sư thầy
    };

    // Danh sách 4 nhân vật VIP và 44 nhân vật đám đông
    this.vipCharacters = [];
    this.crowdCharacters = [];

    // Tọa cụ đệm ngồi VIP
    this.vipCushions = [];

    // Nhân vật Solo Dâng Hương khi có quà tặng
    this.soloCharacter = null;
    this.isSpotlightActive = false;

    // Quản lý chu kỳ quỳ lạy đồng bộ (Bowing Cycle)
    this.bowCycleDuration = 6.0; // 6 giây một chu kỳ lạy
    this.bowCycleTimer = 0;
    this.bowCounter = 1;
    this.onBowCycleCompleted = null;

    // Object Pooling Vector để chiếu tọa độ lên màn hình 2D
    this._tempVec = new THREE.Vector3();

    this.init();
  }

  init() {
    this.buildVipCushionsAndCharacters();
    this.buildCrowdCharacters();
    this.buildSoloCharacter();
  }

  /**
   * Tạo 4 Đệm ngồi VIP (Tọa cụ đỏ viền vàng) đặt hàng đầu trước bàn thờ
   */
  buildVipCushionsAndCharacters() {
    // 4 vị trí đệm hàng đầu: 2 bên trái thảm đỏ, 2 bên phải thảm đỏ
    const vipPositions = [
      { x: -2.3, z: -0.4, rank: 1, label: '1. Hoàng Quân', robe: 'WHITE' },
      { x: -1.4, z: -0.4, rank: 2, label: '2. thu.tr', robe: 'GREY' },
      { x: 1.4, z: -0.4, rank: 3, label: '3. kjen', robe: 'BROWN' },
      { x: 2.3, z: -0.4, rank: 4, label: '4. xìn gói cuối', robe: 'WHITE' }
    ];

    const cushionGeo = new THREE.CylinderGeometry(0.38, 0.42, 0.12, 24);
    const cushionMat = new THREE.MeshStandardMaterial({
      color: 0x9b1b1e, // Đỏ tươi viền vàng
      roughness: 0.6,
      metalness: 0.1,
      transparent: true,
      opacity: 1.0
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 1.0
    });

    vipPositions.forEach((pos, idx) => {
      // 1. Đệm ngồi
      const cushionGroup = new THREE.Group();
      cushionGroup.position.set(pos.x, 0.06, pos.z);

      const cushionMesh = new THREE.Mesh(cushionGeo, cushionMat.clone());
      cushionGroup.add(cushionMesh);

      const trimMesh = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.02, 8, 24), goldTrimMat.clone());
      trimMesh.rotation.x = Math.PI / 2;
      trimMesh.position.y = 0.05;
      cushionGroup.add(trimMesh);

      this.crowdGroup.add(cushionGroup);
      this.vipCushions.push(cushionGroup);

      // 2. Nhân vật VIP
      const char = this.createPilgrimMesh(pos.robe, true);
      char.group.position.set(pos.x, 0.12, pos.z);
      char.rank = pos.rank;
      char.nickname = pos.label;
      char.uniqueId = `vip_${idx + 1}`;
      char.isVip = true;

      this.crowdGroup.add(char.group);
      this.vipCharacters.push(char);
    });
  }

  /**
   * Tạo 44 Phật tử đám đông xếp hàng hai bên cánh gà
   */
  buildCrowdCharacters() {
    // 22 người bên cánh trái, 22 người bên cánh phải
    const rows = 11;
    let slotIdx = 0;

    for (let r = 0; r < rows; r++) {
      const zPos = 1.0 + r * 0.95; // Trải dài dọc từ trước bàn thờ về phía đáy màn hình

      // Cánh trái: 2 vị trí mỗi hàng (x = -1.6 và -2.6)
      const leftPositions = [
        { x: -1.6 - (r % 2) * 0.2, z: zPos },
        { x: -2.6 - ((r + 1) % 2) * 0.2, z: zPos + 0.1 }
      ];

      // Cánh phải: 2 vị trí mỗi hàng (x = 1.6 và 2.6)
      const rightPositions = [
        { x: 1.6 + (r % 2) * 0.2, z: zPos },
        { x: 2.6 + ((r + 1) % 2) * 0.2, z: zPos + 0.1 }
      ];

      [...leftPositions, ...rightPositions].forEach((pos) => {
        if (slotIdx < 44) {
          const robeKeys = Object.keys(this.robeColors);
          const robeType = robeKeys[slotIdx % robeKeys.length];
          const char = this.createPilgrimMesh(robeType, false);
          char.group.position.set(pos.x, 0, pos.z);
          char.slotIndex = slotIdx;
          char.nickname = `Phật Tử ${slotIdx + 1}`;
          char.uniqueId = `crowd_${slotIdx + 1}`;
          char.isVip = false;

          this.crowdGroup.add(char.group);
          this.crowdCharacters.push(char);
          slotIdx++;
        }
      });
    }
  }

  /**
   * Dựng hình 1 Nhân vật 3D Chibi Đa Khớp nhìn từ sau lưng
   */
  createPilgrimMesh(robeType = 'GREY', isVip = false) {
    const group = new THREE.Group();
    const colorHex = this.robeColors[robeType] || this.robeColors.GREY;

    // Vật liệu áo có thể thay đổi opacity khi làm mờ đám đông
    const robeMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.5,
      metalness: 0.1,
      transparent: true,
      opacity: 1.0
    });

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xffd1b3, // Da ấm
      roughness: 0.6,
      transparent: true,
      opacity: 1.0
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a, // Tóc đen
      roughness: 0.7,
      transparent: true,
      opacity: 1.0
    });

    // 1. Bồ đoàn / Tọa cụ nhỏ dưới chân
    const matGeo = new THREE.CylinderGeometry(0.3, 0.32, 0.06, 16);
    const matMat = new THREE.MeshStandardMaterial({
      color: isVip ? 0x9b1b1e : 0x795548,
      roughness: 0.8,
      transparent: true,
      opacity: 1.0
    });
    const seatPad = new THREE.Mesh(matGeo, matMat);
    seatPad.position.y = 0.03;
    group.add(seatPad);

    // 2. Chân quỳ gối (Kneeling Base)
    const baseGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.22, 16);
    const kneelingBase = new THREE.Mesh(baseGeo, robeMat);
    kneelingBase.position.y = 0.14;
    group.add(kneelingBase);

    // 3. Khớp thân mình (Torso Pivot)
    const torsoPivot = new THREE.Group();
    torsoPivot.position.set(0, 0.22, 0);

    const torsoGeo = new THREE.CylinderGeometry(0.18, 0.25, 0.45, 16);
    const torso = new THREE.Mesh(torsoGeo, robeMat);
    torso.position.y = 0.225;
    torsoPivot.add(torso);

    // 4. Khớp đầu (Head Pivot) đặt trên cổ
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.46, 0);

    const headGeo = new THREE.SphereGeometry(0.17, 16, 16);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 0.12;
    headPivot.add(head);

    // Tóc búi cao cho áo trắng / áo lam; đầu trọc thanh tịnh cho sư thầy
    if (robeType !== 'MONK_YELLOW') {
      const bunGeo = new THREE.SphereGeometry(0.08, 12, 12);
      const hairBun = new THREE.Mesh(bunGeo, hairMat);
      hairBun.position.set(0, 0.28, -0.06);
      headPivot.add(hairBun);

      // Trâm cài tóc vàng cho trang nghiêm
      const pinGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.22, 6);
      const pinMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.rotation.z = Math.PI / 2;
      pin.position.set(0, 0.28, -0.06);
      headPivot.add(pin);
    }

    torsoPivot.add(headPivot);

    // 5. Cánh tay trái & phải chắp trước ngực
    const armGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.32, 8);
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.19, 0.38, 0);
    const leftArm = new THREE.Mesh(armGeo, robeMat);
    leftArm.position.y = -0.14;
    leftArmPivot.add(leftArm);
    leftArmPivot.rotation.z = 0.35;
    leftArmPivot.rotation.x = -0.65; // Hướng ra trước ngực chắp tay
    torsoPivot.add(leftArmPivot);

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.19, 0.38, 0);
    const rightArm = new THREE.Mesh(armGeo, robeMat);
    rightArm.position.y = -0.14;
    rightArmPivot.add(rightArm);
    rightArmPivot.rotation.z = -0.35;
    rightArmPivot.rotation.x = -0.65;
    torsoPivot.add(rightArmPivot);

    group.add(torsoPivot);

    // Lưu các bộ phận để animate
    return {
      group,
      torsoPivot,
      headPivot,
      leftArmPivot,
      rightArmPivot,
      materials: [robeMat, skinMat, hairMat, matMat],
      robeType
    };
  }

  /**
   * Tạo Nhân vật Solo Dâng Hương (sẽ bước đi trên Thảm Đỏ)
   */
  buildSoloCharacter() {
    this.soloCharacter = this.createPilgrimMesh('WHITE', true);
    this.soloCharacter.group.position.set(0, -10, 0); // Giấu tạm dưới sàn
    this.soloCharacter.group.visible = false;
    this.scene.add(this.soloCharacter.group);
  }

  /**
   * Đồng bộ dữ liệu người dùng từ socket `crowd_sync`
   */
  syncCrowdData(payload) {
    if (!payload) return;

    // 1. Cập nhật VIP Seats (Top 4 đệm đầu)
    if (Array.isArray(payload.vipSeats)) {
      payload.vipSeats.slice(0, 4).forEach((vip, idx) => {
        if (this.vipCharacters[idx]) {
          this.vipCharacters[idx].nickname = `${vip.rank}. ${vip.nickname}`;
          this.vipCharacters[idx].uniqueId = vip.uniqueId;
          this.updateCharacterRobe(this.vipCharacters[idx], vip.robeType);
        }
      });
    }

    // 2. Cập nhật Đám đông
    if (Array.isArray(payload.crowdMembers)) {
      payload.crowdMembers.forEach((member) => {
        const slot = member.slotIndex;
        if (slot >= 0 && slot < this.crowdCharacters.length) {
          this.crowdCharacters[slot].nickname = member.nickname;
          this.crowdCharacters[slot].uniqueId = member.uniqueId;
          this.updateCharacterRobe(this.crowdCharacters[slot], member.robeType);
        }
      });
    }
  }

  /**
   * Cập nhật màu áo cho nhân vật
   */
  updateCharacterRobe(character, newRobeType) {
    if (!character || !newRobeType || character.robeType === newRobeType) return;
    const colorHex = this.robeColors[newRobeType] || this.robeColors.GREY;
    character.materials[0].color.setHex(colorHex);
    character.robeType = newRobeType;
  }

  /**
   * Đồng bộ chu kỳ Quỳ Lạy của toàn bộ đám đông (6 giây/vòng)
   */
  updateBowingCycle(delta) {
    if (this.isSpotlightActive) return; // Khi đang có Spotlight Solo thì đám đông đã bị ẩn mờ

    this.bowCycleTimer += delta;
    if (this.bowCycleTimer >= this.bowCycleDuration) {
      this.bowCycleTimer -= this.bowCycleDuration;
      this.bowCounter++;
      if (typeof this.onBowCycleCompleted === 'function') {
        this.onBowCycleCompleted(this.bowCounter);
      }
    }

    const t = this.bowCycleTimer;
    let bendAngle = 0; // Độ gập lưng cúi lạy
    let headAngle = 0; // Độ cúi đầu

    if (t < 1.2) {
      // Đứng/Ngồi thẳng lưng, hai tay chắp lễ trước ngực
      bendAngle = 0;
      headAngle = 0.1;
    } else if (t < 2.8) {
      // Quỳ xuống, gập thân và cúi đầu sát đất (Lạy Phật)
      const progress = (t - 1.2) / 1.6;
      const ease = Math.sin((progress * Math.PI) / 2);
      bendAngle = ease * 1.15; // Gập lưng 65 độ
      headAngle = ease * 0.7;  // Cúi đầu sát đất
    } else if (t < 4.2) {
      // Giữ tư thế lạy trang nghiêm sát đất
      bendAngle = 1.15;
      headAngle = 0.7;
    } else {
      // Nâng người ngồi dậy về tư thế chắp tay
      const progress = (t - 4.2) / 1.8;
      const ease = 1 - Math.sin((progress * Math.PI) / 2);
      bendAngle = ease * 1.15;
      headAngle = ease * 0.7;
    }

    // Áp dụng góc lạy cho toàn bộ nhân vật VIP và Đám đông
    const allChars = [...this.vipCharacters, ...this.crowdCharacters];
    for (let i = 0; i < allChars.length; i++) {
      const c = allChars[i];
      // Thêm chút độ lệch pha nhỏ (offset) giữa các hàng để tạo nhịp thở tự nhiên như dòng sóng
      const offset = (i % 5) * 0.02;
      c.torsoPivot.rotation.x = Math.max(0, bendAngle - offset);
      c.headPivot.rotation.x = Math.max(0, headAngle - offset);
    }
  }

  /**
   * Kích hoạt Hiệu ứng "Spotlight Solo Dâng Hương"
   * Khi có người tặng quà dâng hương
   */
  triggerSpotlightIncense(giftData, onStepAltar, onComplete) {
    if (this.isSpotlightActive) return;
    this.isSpotlightActive = true;

    const { nickname, giftName, robeType = 'WHITE' } = giftData;

    // Cập nhật trang phục & tên cho nhân vật Solo
    this.updateCharacterRobe(this.soloCharacter, robeType);
    this.soloCharacter.nickname = `${nickname} 🌹`;
    this.soloCharacter.giftName = giftName;

    // Bước 1: Fade-out toàn bộ 44 đám đông + 4 VIP (0.45 giây)
    this.fadeCrowd(0, 0.45, () => {
      // Bước 2: Xuất hiện Nhân vật Solo ở cuối Thảm Đỏ
      this.soloCharacter.group.visible = true;
      this.soloCharacter.group.position.set(0, 0, 9.8); // Vị trí cuối thảm đỏ gần camera
      this.soloCharacter.torsoPivot.rotation.x = 0;
      this.soloCharacter.headPivot.rotation.x = 0;
      this.setSoloOpacity(1.0);

      // Bước 3: Bước đi trang nghiêm trên Thảm Đỏ tiến lên trước Lư Hương (1.8s)
      const startZ = 9.8;
      const targetZ = 0.15; // Dừng lại ngay trước lư hương
      const walkDuration = 1.8;
      let walkElapsed = 0;

      const walkInterval = setInterval(() => {
        walkElapsed += 0.03;
        const p = Math.min(1.0, walkElapsed / walkDuration);
        // Bước đi nhấp nhô nhẹ
        this.soloCharacter.group.position.z = startZ + (targetZ - startZ) * p;
        this.soloCharacter.group.position.y = Math.sin(p * Math.PI * 8) * 0.05;

        if (p >= 1.0) {
          clearInterval(walkInterval);
          this.soloCharacter.group.position.y = 0;

          // Báo hiệu tới bàn thờ để kích hoạt chuông + khói hương + TTS
          if (typeof onStepAltar === 'function') {
            onStepAltar();
          }

          // Bước 4: Chắp tay và Quỳ Lạy sâu trước Lư Hương (2.2s)
          this.animateSoloBow(() => {
            // Bước 5: Mờ dần nhân vật Solo và Fade-in đám đông trở lại (4.6s kết thúc)
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

  /**
   * Động tác quỳ lạy sâu của nhân vật Solo trước bàn thờ
   */
  animateSoloBow(onDone) {
    let bowElapsed = 0;
    const duration = 2.2;
    const interval = setInterval(() => {
      bowElapsed += 0.03;
      const p = bowElapsed / duration;

      if (p < 0.4) {
        // Gập người lạy sát đất
        const ease = Math.sin((p / 0.4) * (Math.PI / 2));
        this.soloCharacter.torsoPivot.rotation.x = ease * 1.35;
        this.soloCharacter.headPivot.rotation.x = ease * 0.85;
      } else if (p < 0.75) {
        // Giữ tư thế đảnh lễ thành kính
        this.soloCharacter.torsoPivot.rotation.x = 1.35;
        this.soloCharacter.headPivot.rotation.x = 0.85;
      } else if (p <= 1.0) {
        // Ngồi dậy tịnh tâm
        const ease = 1 - Math.sin(((p - 0.75) / 0.25) * (Math.PI / 2));
        this.soloCharacter.torsoPivot.rotation.x = ease * 1.35;
        this.soloCharacter.headPivot.rotation.x = ease * 0.85;
      } else {
        clearInterval(interval);
        if (typeof onDone === 'function') {
          onDone();
        }
      }
    }, 30);
  }

  /**
   * Làm mờ dần / hiện rõ đám đông
   */
  fadeCrowd(targetOpacity, durationSec, callback) {
    const allChars = [...this.vipCharacters, ...this.crowdCharacters];
    let elapsed = 0;
    const startOpacity = allChars[0].materials[0].opacity;
    const intervalTime = 25;
    const totalSteps = (durationSec * 1000) / intervalTime;

    const fadeTimer = setInterval(() => {
      elapsed++;
      const p = Math.min(1.0, elapsed / totalSteps);
      const curOpacity = startOpacity + (targetOpacity - startOpacity) * p;

      allChars.forEach((c) => {
        c.materials.forEach((m) => {
          m.opacity = curOpacity;
        });
      });

      this.vipCushions.forEach((cushion) => {
        cushion.children.forEach((mesh) => {
          if (mesh.material) mesh.material.opacity = curOpacity;
        });
      });

      if (p >= 1.0) {
        clearInterval(fadeTimer);
        if (typeof callback === 'function') callback();
      }
    }, intervalTime);
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
   * Chiếu tọa độ 3D của đầu nhân vật lên tọa độ màn hình 2D
   * để HudManager gắn NameTag và SpeechBubble chuẩn xác mà không cần canvas sprite
   */
  getProjectedAnchors(camera, screenWidth, screenHeight) {
    const anchors = [];

    // Nếu đang có Spotlight Solo: Chỉ trả về vị trí của nhân vật Solo
    if (this.isSpotlightActive && this.soloCharacter && this.soloCharacter.group.visible) {
      this._tempVec.set(0, 0.8, 0); // Vị trí đỉnh đầu nhân vật
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

    // Khi ở chế độ bình thường: Trả về tọa độ 4 VIP và 44 Đám đông
    // 1. VIP Seats
    this.vipCharacters.forEach((vip, idx) => {
      this._tempVec.set(0, 0.8, 0);
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
      this._tempVec.set(0, 0.75, 0);
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

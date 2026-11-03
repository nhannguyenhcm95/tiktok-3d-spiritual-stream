/**
 * CrowdSystem.js - Hệ Thống 48 Nhân Vật Phật Tử Độc Lập & Spotlight Solo Dâng Hương
 * Sử dụng High-Detail 2.5D Articulated Sprite Rig (vẽ bằng HTML5 Canvas 2D độ nét cao)
 * Tách lớp Đầu, Thân trên, Tà áo và Tay để diễn hoạt mượt mà 60 FPS:
 * - 4 Trang phục: Áo dài trắng (WHITE), Áo lam (GREY), Áo nâu (BROWN), Áo vàng sư thầy (MONK_YELLOW)
 * - 4 Trạng thái: STANDING_PRAY, WALKING, KNEELING, BOWING_DEEP
 * - Tích hợp sẵn GLTFLoader fallback
 * - Hiệu ứng Spotlight Solo Dâng Hương: Làm mờ 48 người -> 1 người bước lên thảm đỏ lạy Phật
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Bộ sinh Sprite Nhân Vật Đa Lớp Phân Giải Cao (CharacterSpriteGenerator)
 * Dùng đường cong bezierCurveTo và LinearGradient tạo bóng đổ nếp gấp vải tinh xảo
 */
class CharacterSpriteGenerator {
  constructor() {
    this.textureCache = new Map();
  }

  /**
   * Tạo Texture cho từng bộ phận của nhân vật theo loại trang phục và trạng thái
   */
  getPartTexture(partType, robeType, state = 'KNEELING') {
    const key = `${partType}_${robeType}_${state}`;
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 256, 256);

    const colors = {
      WHITE: { main: '#f5f5fa', shade: '#d0d0dc', highlight: '#ffffff', sash: '#e0e0ea' },
      GREY: { main: '#8fa0b5', shade: '#6a7d94', highlight: '#b0c2d8', sash: '#5f7085' },
      BROWN: { main: '#6d4c41', shade: '#4e342e', highlight: '#8d6e63', sash: '#3e2723' },
      MONK_YELLOW: { main: '#e68a00', shade: '#b86600', highlight: '#ffaa33', sash: '#994400' }
    }[robeType] || { main: '#8fa0b5', shade: '#6a7d94', highlight: '#b0c2d8', sash: '#5f7085' };

    switch (partType) {
      case 'HEAD':
        this.drawHead(ctx, robeType);
        break;
      case 'TORSO':
        this.drawTorso(ctx, colors, state);
        break;
      case 'LOWER_BODY':
        this.drawLowerBody(ctx, colors, state);
        break;
      case 'ARMS':
        this.drawArms(ctx, colors, state);
        break;
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    this.textureCache.set(key, texture);
    return texture;
  }

  // 1. Vẽ Đầu và Búi tóc nhìn từ sau lưng
  drawHead(ctx, robeType) {
    const cx = 128, cy = 135;

    // Màu da ấm
    const skinGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 70);
    skinGrad.addColorStop(0, '#ffd1b3');
    skinGrad.addColorStop(1, '#d89b70');

    // Cổ áo phía sau
    ctx.fillStyle = skinGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 35, 26, 32, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hộp sọ đầu tròn
    ctx.beginPath();
    ctx.arc(cx, cy - 10, 52, 0, Math.PI * 2);
    ctx.fill();

    if (robeType === 'MONK_YELLOW') {
      // Tiểu sư thầy đầu tròn thanh tịnh
      ctx.fillStyle = 'rgba(180, 120, 80, 0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy - 10, 50, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Tóc đen mượt búi cao có trâm cài
      const hairGrad = ctx.createRadialGradient(cx, cy - 25, 10, cx, cy - 15, 60);
      hairGrad.addColorStop(0, '#2a2a2a');
      hairGrad.addColorStop(0.8, '#141414');
      hairGrad.addColorStop(1, '#050505');

      ctx.fillStyle = hairGrad;
      ctx.beginPath();
      ctx.arc(cx, cy - 15, 54, Math.PI * 0.85, Math.PI * 2.15);
      ctx.fill();

      // Búi tóc tròn trên cao
      ctx.beginPath();
      ctx.arc(cx, cy - 65, 28, 0, Math.PI * 2);
      ctx.fill();

      // Trâm cài tóc ngọc trắng / vàng
      ctx.strokeStyle = robeType === 'WHITE' ? '#ffffff' : '#ffd700';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx - 38, cy - 65);
      ctx.lineTo(cx + 38, cy - 65);
      ctx.stroke();

      // Hạt ngọc tròn đính trâm
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx + 38, cy - 65, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. Vẽ Thân Trên và Lưng Áo Tràng / Áo Dài
  drawTorso(ctx, colors, state) {
    const cx = 128;
    const grad = ctx.createLinearGradient(60, 40, 196, 220);
    grad.addColorStop(0, colors.highlight);
    grad.addColorStop(0.5, colors.main);
    grad.addColorStop(1, colors.shade);

    ctx.fillStyle = grad;
    ctx.beginPath();
    // Lưng áo thon gọn
    ctx.moveTo(cx - 45, 50); // Vai trái
    ctx.quadraticCurveTo(cx, 40, cx + 45, 50); // Cổ áo
    ctx.lineTo(cx + 62, 190); // Hông phải
    ctx.quadraticCurveTo(cx, 205, cx - 62, 190); // Đáy lưng
    ctx.closePath();
    ctx.fill();

    // Nếp gấp sống lưng và vải rủ
    ctx.strokeStyle = colors.shade;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, 55);
    ctx.quadraticCurveTo(cx - 5, 120, cx, 195);
    ctx.stroke();

    // Đai lưng vải thắt eo gọn gàng
    ctx.fillStyle = colors.sash;
    ctx.fillRect(cx - 52, 160, 104, 18);
  }

  // 3. Vẽ Tà Áo Dưới và Chân Quỳ / Chân Bước
  drawLowerBody(ctx, colors, state) {
    const cx = 128;
    const grad = ctx.createLinearGradient(50, 40, 206, 220);
    grad.addColorStop(0, colors.highlight);
    grad.addColorStop(0.6, colors.main);
    grad.addColorStop(1, colors.shade);

    ctx.fillStyle = grad;

    if (state === 'WALKING' || state === 'STANDING_PRAY') {
      // Tà áo dài thướt tha buông rủ xuống chân
      ctx.beginPath();
      ctx.moveTo(cx - 50, 20);
      ctx.quadraticCurveTo(cx - 65, 120, cx - 72, 215);
      ctx.quadraticCurveTo(cx, 230, cx + 72, 215);
      ctx.quadraticCurveTo(cx + 65, 120, cx + 50, 20);
      ctx.closePath();
      ctx.fill();

      // Nếp gấp tà áo xẻ mềm mại
      ctx.strokeStyle = colors.shade;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(cx, 25);
      ctx.lineTo(cx, 220);
      ctx.stroke();

      // Mũi giày sen nhỏ bước đi
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(cx - 20, 220, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 20, 220, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Tư thế Quỳ (KNEELING & BOWING_DEEP): Bồ đoàn và vạt áo phủ đùi
      ctx.beginPath();
      ctx.ellipse(cx, 130, 95, 55, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = colors.shade;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Hai gót chân nhỏ lộ ra phía sau thành kính
      ctx.fillStyle = '#d89b70';
      ctx.beginPath();
      ctx.ellipse(cx - 32, 170, 15, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 32, 170, 15, 20, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. Vẽ Hai Cánh Tay Chắp Trước Ngực (Anjali Mudra)
  drawArms(ctx, colors, state) {
    const cx = 128;
    const grad = ctx.createLinearGradient(40, 50, 216, 180);
    grad.addColorStop(0, colors.highlight);
    grad.addColorStop(0.5, colors.main);
    grad.addColorStop(1, colors.shade);

    ctx.fillStyle = grad;

    // Tay áo rộng gập về phía trước ngực
    ctx.beginPath();
    ctx.ellipse(cx - 55, 110, 28, 48, -0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(cx + 55, 110, 28, 48, 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Bàn tay màu da ấm chắp lễ
    ctx.fillStyle = '#ffd1b3';
    ctx.beginPath();
    ctx.ellipse(cx, 140, 14, 24, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

export class CrowdSystem {
  constructor(scene) {
    this.scene = scene;

    this.crowdGroup = new THREE.Group();
    this.scene.add(this.crowdGroup);

    this.spriteGen = new CharacterSpriteGenerator();

    // Danh sách 4 VIP và 44 Phật tử đám đông
    this.vipCharacters = [];
    this.crowdCharacters = [];

    // Nhân vật Solo Dâng Hương khi có quà tặng
    this.soloCharacter = null;
    this.isSpotlightActive = false;

    // Đồng bộ chu kỳ quỳ lạy (6.5 giây/vòng)
    this.bowCycleDuration = 6.5;
    this.bowCycleTimer = 0;
    this.bowCounter = 1;
    this.onBowCycleCompleted = null;

    // Vector tạm chiếu tọa độ 2D
    this._tempVec = new THREE.Vector3();

    this.init();
  }

  init() {
    this.buildVipCharacters();
    this.buildCrowdCharacters();
    this.buildSoloCharacter();
  }

  /**
   * Tạo 4 Nhân Vật VIP Ngồi Trên 4 Đệm Hàng Đầu Trước Bàn Thờ
   */
  buildVipCharacters() {
    const vipPositions = [
      { x: -2.3, z: -1.0, rank: 1, label: '1. Hoàng Quân', robe: 'WHITE' },
      { x: -1.5, z: -1.0, rank: 2, label: '2. thu.tr', robe: 'GREY' },
      { x: 1.5, z: -1.0, rank: 3, label: '3. kjen', robe: 'BROWN' },
      { x: 2.3, z: -1.0, rank: 4, label: '4. xìn gói cuối', robe: 'WHITE' }
    ];

    vipPositions.forEach((pos, idx) => {
      const char = this.createArticulatedCharacter(pos.robe, 'KNEELING', true);
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
   * Tạo 44 Phật Tử Đám Đông Xếp Thành Các Hàng Dọc Hai Bên Thảm Đỏ
   */
  buildCrowdCharacters() {
    const robeTypes = ['GREY', 'WHITE', 'BROWN', 'MONK_YELLOW'];
    const rows = 11;
    let slotIdx = 0;

    for (let r = 0; r < rows; r++) {
      const zPos = 0.2 + r * 0.95; // Dọc từ trước bàn thờ về đáy màn hình

      // Cánh trái (2 cột, chừa lối thảm đỏ x từ -1.3 đến +1.3)
      const leftPositions = [
        { x: -1.65 - (r % 2) * 0.15, z: zPos },
        { x: -2.6 - ((r + 1) % 2) * 0.15, z: zPos + 0.08 }
      ];

      // Cánh phải (2 cột)
      const rightPositions = [
        { x: 1.65 + (r % 2) * 0.15, z: zPos },
        { x: 2.6 + ((r + 1) % 2) * 0.15, z: zPos + 0.08 }
      ];

      [...leftPositions, ...rightPositions].forEach((pos) => {
        if (slotIdx < 44) {
          const robe = robeTypes[slotIdx % robeTypes.length];
          const char = this.createArticulatedCharacter(robe, 'KNEELING', false);
          char.group.position.set(pos.x, 0.02, pos.z);
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
   * Tạo 1 Nhân Vật 2.5D Đa Lớp (Articulated Sprite Rig)
   * Tách riêng: Thân dưới, Thân trên, Đầu và Tay để nội suy chuyển động mượt mà
   */
  createArticulatedCharacter(robeType = 'GREY', state = 'KNEELING', isVip = false) {
    const group = new THREE.Group();

    // 1. Lớp Thân Dưới (Tọa cụ / Vạt áo / Gót chân)
    const lowerTex = this.spriteGen.getPartTexture('LOWER_BODY', robeType, state);
    const lowerMat = new THREE.MeshBasicMaterial({
      map: lowerTex,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const lowerMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.85), lowerMat);
    lowerMesh.position.set(0, 0.35, 0);
    group.add(lowerMesh);

    // 2. Khớp Thân Trên (Torso Pivot) gập lạy
    const torsoPivot = new THREE.Group();
    torsoPivot.position.set(0, 0.45, 0);

    const torsoTex = this.spriteGen.getPartTexture('TORSO', robeType, state);
    const torsoMat = new THREE.MeshBasicMaterial({
      map: torsoTex,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const torsoMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85), torsoMat);
    torsoMesh.position.set(0, 0.38, 0.01);
    torsoPivot.add(torsoMesh);

    // 3. Khớp Đầu (Head Pivot) đặt trên cổ
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.78, 0);

    const headTex = this.spriteGen.getPartTexture('HEAD', robeType, state);
    const headMat = new THREE.MeshBasicMaterial({
      map: headTex,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const headMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.65), headMat);
    headMesh.position.set(0, 0.22, 0.02);
    headPivot.add(headMesh);
    torsoPivot.add(headPivot);

    // 4. Hai Cánh Tay Chắp Lễ (Arms)
    const armsTex = this.spriteGen.getPartTexture('ARMS', robeType, state);
    const armsMat = new THREE.MeshBasicMaterial({
      map: armsTex,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const armsMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.75), armsMat);
    armsMesh.position.set(0, 0.36, 0.03);
    torsoPivot.add(armsMesh);

    group.add(torsoPivot);

    return {
      group,
      torsoPivot,
      headPivot,
      lowerMesh,
      torsoMesh,
      headMesh,
      armsMesh,
      materials: [lowerMat, torsoMat, headMat, armsMat],
      robeType,
      state
    };
  }

  /**
   * Tạo Nhân Vật Solo Dâng Hương (sẽ bước đi trên Thảm Đỏ)
   */
  buildSoloCharacter() {
    this.soloCharacter = this.createArticulatedCharacter('WHITE', 'WALKING', true);
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
          this.updateCharacterRobe(this.vipCharacters[idx], vip.robeType);
        }
      });
    }

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

  updateCharacterRobe(char, newRobe) {
    if (!char || !newRobe || char.robeType === newRobe) return;
    char.robeType = newRobe;
    char.lowerMesh.material.map = this.spriteGen.getPartTexture('LOWER_BODY', newRobe, char.state);
    char.torsoMesh.material.map = this.spriteGen.getPartTexture('TORSO', newRobe, char.state);
    char.headMesh.material.map = this.spriteGen.getPartTexture('HEAD', newRobe, char.state);
    char.armsMesh.material.map = this.spriteGen.getPartTexture('ARMS', newRobe, char.state);
  }

  /**
   * Đồng Bộ Chu Kỳ Quỳ Lạy Sát Đất (6.5s / Vòng)
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

    if (t < 1.5) {
      // Ngồi quỳ thẳng lưng, chắp tay thành kính
      bendAngle = 0.05 + Math.sin(t * Math.PI) * 0.02;
      headAngle = 0.05;
    } else if (t < 3.2) {
      // Cúi gập người lạy sát đất (Ngũ thể đầu địa)
      const p = (t - 1.5) / 1.7;
      const ease = Math.sin((p * Math.PI) / 2);
      bendAngle = ease * 1.15; // Gập lưng 66 độ
      headAngle = ease * 0.7;  // Cúi đầu sát sàn
    } else if (t < 4.8) {
      // Giữ tư thế lạy sát đất trang nghiêm
      bendAngle = 1.15;
      headAngle = 0.7;
    } else {
      // Nâng thân mình ngồi dậy thẳng lưng
      const p = (t - 4.8) / 1.7;
      const ease = 1 - Math.sin((p * Math.PI) / 2);
      bendAngle = ease * 1.15;
      headAngle = ease * 0.7;
    }

    const allChars = [...this.vipCharacters, ...this.crowdCharacters];
    for (let i = 0; i < allChars.length; i++) {
      const c = allChars[i];
      const offset = (i % 6) * 0.02;
      c.torsoPivot.rotation.x = Math.max(0, bendAngle - offset);
      c.headPivot.rotation.x = Math.max(0, headAngle - offset);
    }
  }

  /**
   * Hiệu Ứng "Spotlight Solo Dâng Hương"
   * Toàn bộ 48 người mờ biến mất -> 1 người bước lên thảm đỏ quỳ lạy -> hiện lại
   */
  triggerSpotlightIncense(giftData, onStepAltar, onComplete) {
    if (this.isSpotlightActive) return;
    this.isSpotlightActive = true;

    const { nickname, giftName, robeType = 'WHITE' } = giftData;

    // Cập nhật trang phục & trạng thái bước đi (WALKING) cho Solo
    this.updateCharacterRobe(this.soloCharacter, robeType);
    this.soloCharacter.nickname = `${nickname} 🌹`;
    this.soloCharacter.state = 'WALKING';

    // Cập nhật texture tà áo buông rủ bước đi
    this.soloCharacter.lowerMesh.material.map = this.spriteGen.getPartTexture('LOWER_BODY', robeType, 'WALKING');

    // Bước 1: Fade-out toàn bộ 48 Phật tử (0.45 giây)
    this.fadeCrowd(0, 0.45, () => {
      // Bước 2: Nhân vật Solo xuất hiện ở cuối Thảm Đỏ hoa sen
      this.soloCharacter.group.visible = true;
      this.soloCharacter.group.position.set(0, 0.05, 9.2);
      this.soloCharacter.torsoPivot.rotation.x = 0;
      this.soloCharacter.headPivot.rotation.x = 0;
      this.setSoloOpacity(1.0);

      // Bước 3: Bước đi uyển chuyển dọc giữa Thảm Đỏ tiến lên trước Lư Hương (1.8s)
      const startZ = 9.2;
      const targetZ = -1.2; // Dừng lại trước lư hương
      const walkDuration = 1.8;
      let walkElapsed = 0;

      const walkInterval = setInterval(() => {
        walkElapsed += 0.03;
        const p = Math.min(1.0, walkElapsed / walkDuration);
        this.soloCharacter.group.position.z = startZ + (targetZ - startZ) * p;
        // Bước đi nhấp nhô nhịp nhàng
        this.soloCharacter.group.position.y = 0.05 + Math.sin(p * Math.PI * 8) * 0.04;
        this.soloCharacter.torsoPivot.rotation.z = Math.sin(p * Math.PI * 8) * 0.03;

        if (p >= 1.0) {
          clearInterval(walkInterval);
          this.soloCharacter.group.position.y = 0.05;
          this.soloCharacter.torsoPivot.rotation.z = 0;

          // Báo hiệu tới bàn thờ để kích hoạt chuông + bùng sáng hào quang + TTS
          if (typeof onStepAltar === 'function') {
            onStepAltar();
          }

          // Chuyển sang trạng thái Quỳ và Cúi Lạy Sâu (BOWING_DEEP trong 2.4s)
          this.soloCharacter.lowerMesh.material.map = this.spriteGen.getPartTexture('LOWER_BODY', robeType, 'KNEELING');

          this.animateSoloBow(() => {
            // Bước 5: Mờ dần Solo và Hiện lại Toàn bộ Đám đông (4.6s)
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
        // Gập thân lạy sát sàn
        const ease = Math.sin((p / 0.4) * (Math.PI / 2));
        this.soloCharacter.torsoPivot.rotation.x = ease * 1.35;
        this.soloCharacter.headPivot.rotation.x = ease * 0.85;
      } else if (p < 0.75) {
        // Giữ tư thế lạy sâu
        this.soloCharacter.torsoPivot.rotation.x = 1.35;
        this.soloCharacter.headPivot.rotation.x = 0.85;
      } else if (p <= 1.0) {
        // Ngồi dậy
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
   * Chiếu tọa độ 3D của đỉnh đầu nhân vật lên tọa độ màn hình 2D
   * để HudManager gắn Thẻ Tên TikTok và Bong Bóng Chat chính xác
   */
  getProjectedAnchors(camera, screenWidth, screenHeight) {
    const anchors = [];

    // Nếu đang có Spotlight Solo: Chỉ hiện thẻ tên của Solo
    if (this.isSpotlightActive && this.soloCharacter && this.soloCharacter.group.visible) {
      this._tempVec.set(0, 1.25, 0);
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

    // Chế độ bình thường: Hiện thẻ tên 4 VIP và 44 Đám đông
    this.vipCharacters.forEach((vip, idx) => {
      this._tempVec.set(0, 1.18, 0);
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

    this.crowdCharacters.forEach((crowd, idx) => {
      this._tempVec.set(0, 1.15, 0);
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

/**
 * Avatar Manager — PHẬT ĐIỆN VẠN NGƯỜI
 * Quản lý danh sách Phật tử ảo 3D trong Đại Hùng Bảo Điện.
 * Mỗi người xem TikTok LIVE tương ứng với 1 avatar riêng biệt có:
 * - 8 biến thể trang phục & diện mạo (nam, nữ, áo lam, nâu, xám, trắng, áo tràng).
 * - Lưới chỗ ngồi (Grid seating) tự động xếp hàng hai bên thảm đỏ hướng về bàn thờ Phật.
 * - Nameplate nổi trên đầu hiển thị TikTok Nickname.
 * - Bong bóng chat (Comment Bubble) xuất hiện trên đầu khi comment.
 * - Animation State Machine: Idle, JoinHands (Nam Mô), Kneel, Bow, DeepBow, Pray, OfferFlower, Stand.
 */

import * as THREE from 'three';
import gsap from 'gsap';

// 8 Biến thể Avatar Phật tử
const AVATAR_VARIANTS = [
  { id: 0, gender: 'male', name: 'Nam Áo Lam', robeColor: 0x416d8a, skinColor: 0xf5cda7, hairColor: 0x1f1f1f, hasBun: false, collarColor: 0x2e4e63 },
  { id: 1, gender: 'female', name: 'Nữ Áo Lam', robeColor: 0x5484a4, skinColor: 0xfce2cc, hairColor: 0x2b1d0c, hasBun: true, collarColor: 0x3d6680 },
  { id: 2, gender: 'male', name: 'Nam Áo Nâu', robeColor: 0x6e4732, skinColor: 0xdeb887, hairColor: 0x111111, hasBun: false, collarColor: 0x4a2f20 },
  { id: 3, gender: 'female', name: 'Nữ Áo Nâu', robeColor: 0x82543b, skinColor: 0xfce2cc, hairColor: 0x221508, hasBun: true, collarColor: 0x5a3927 },
  { id: 4, gender: 'male', name: 'Nam Áo Xám', robeColor: 0x687178, skinColor: 0xf0c8a0, hairColor: 0x1a1a1a, hasBun: false, collarColor: 0x485056 },
  { id: 5, gender: 'female', name: 'Nữ Áo Xám', robeColor: 0x7e888f, skinColor: 0xfbe0c8, hairColor: 0x261b11, hasBun: true, collarColor: 0x5c656b },
  { id: 6, gender: 'female', name: 'Phật Tử Áo Trắng', robeColor: 0xe8ebee, skinColor: 0xfce2cc, hairColor: 0x221508, hasBun: true, collarColor: 0xd0d5da },
  { id: 7, gender: 'male', name: 'Cư Sĩ Áo Tràng', robeColor: 0xb58c54, skinColor: 0xdeb887, hairColor: 0x1a1a1a, hasBun: false, collarColor: 0x8c693a }
];

export class AvatarManager {
  constructor(scene) {
    this.scene = scene;
    this.avatars = new Map(); // uniqueId -> AvatarData
    this.seatingGrid = [];     // Danh sách các tọa độ chỗ ngồi định sẵn
    this.cushionsGroup = new THREE.Group();
    this.scene.add(this.cushionsGroup);

    this._initSeatingGrid();
  }

  /**
   * Tạo lưới chỗ ngồi có trật tự hai bên thảm đỏ hướng về Kim Thân Đức Phật
   * Thảm đỏ nằm ở giữa: x từ -0.6 đến 0.6
   * Dãy ghế phân bố: Dãy trái (x < -0.8), Dãy phải (x > 0.8)
   */
  _initSeatingGrid() {
    const xLeft = [-1.1, -1.9, -2.7, -3.5];
    const xRight = [1.1, 1.9, 2.7, 3.5];
    const zRows = [-3.2, -2.3, -1.4, -0.5, 0.4, 1.3, 2.2, 3.1, 4.0];

    zRows.forEach((z, rIdx) => {
      // Bên trái thảm đỏ
      xLeft.forEach((x, cIdx) => {
        this.seatingGrid.push({
          x: x + (Math.random() - 0.5) * 0.08,
          y: 0,
          z: z + (Math.random() - 0.5) * 0.08,
          occupied: false,
          userId: null,
          index: this.seatingGrid.length,
          row: rIdx
        });
      });

      // Bên phải thảm đỏ
      xRight.forEach((x, cIdx) => {
        this.seatingGrid.push({
          x: x + (Math.random() - 0.5) * 0.08,
          y: 0,
          z: z + (Math.random() - 0.5) * 0.08,
          occupied: false,
          userId: null,
          index: this.seatingGrid.length,
          row: rIdx
        });
      });
    });

    // Tạo các đệm thiền (bồ đoàn) tại mỗi chỗ ngồi
    const cushionGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.08, 14);
    const cushionMat = new THREE.MeshLambertMaterial({ color: 0x9c6634 });
    const cushionRingGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.02, 14);
    const cushionRingMat = new THREE.MeshBasicMaterial({ color: 0xd4a359 });

    this.seatingGrid.forEach((seat) => {
      const cushion = new THREE.Mesh(cushionGeo, cushionMat);
      cushion.position.set(seat.x, 0.04, seat.z);
      cushion.receiveShadow = true;

      const ring = new THREE.Mesh(cushionRingGeo, cushionRingMat);
      ring.position.set(seat.x, 0.081, seat.z);

      this.cushionsGroup.add(cushion, ring);
    });
  }

  /**
   * Tìm vị trí chỗ ngồi trống tốt nhất (ưu tiên từ hàng trước ra hàng sau)
   */
  _findAvailableSeat() {
    const seat = this.seatingGrid.find((s) => !s.occupied);
    if (seat) return seat;

    // Nếu đã kín 72 chỗ định sẵn, tự động sinh thêm chỗ ngồi phía sau
    const lastSeat = this.seatingGrid[this.seatingGrid.length - 1];
    const extraSeat = {
      x: (Math.random() - 0.5) * 6.5,
      y: 0,
      z: (lastSeat ? lastSeat.z : 4.0) + Math.random() * 1.5,
      occupied: false,
      userId: null,
      index: this.seatingGrid.length,
      row: 99
    };
    this.seatingGrid.push(extraSeat);
    return extraSeat;
  }

  /**
   * Tạo CanvasTexture cho Nameplate hiển thị TikTok Nickname
   */
  _createNameplate(nickname) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Nền bán trong suốt màu nâu đậm viền vàng kim
    ctx.fillStyle = 'rgba(25, 15, 8, 0.75)';
    ctx.roundRect ? ctx.roundRect(10, 10, 236, 44, 12) : ctx.fillRect(10, 10, 236, 44);
    ctx.fill();

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Chữ Nickname
    ctx.fillStyle = '#fffae8';
    ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cleanName = nickname.length > 14 ? nickname.substring(0, 13) + '…' : nickname;
    ctx.fillText(`🙏 ${cleanName}`, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.9, 0.22, 1);
    return sprite;
  }

  /**
   * Tạo Bong bóng bình luận (Comment Bubble) 3D nổi trên đầu nhân vật
   */
  _createBubbleSprite(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Nền trắng ngà viền vàng
    ctx.fillStyle = 'rgba(255, 252, 240, 0.95)';
    ctx.roundRect ? ctx.roundRect(10, 10, 300, 90, 16) : ctx.fillRect(10, 10, 300, 90);
    ctx.fill();

    // Mũi nhọn bong bóng trỏ xuống đầu nhân vật
    ctx.beginPath();
    ctx.moveTo(150, 100);
    ctx.lineTo(160, 118);
    ctx.lineTo(170, 100);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#cda250';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Nội dung chữ
    ctx.fillStyle = '#3a200a';
    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const shortText = text.length > 26 ? text.substring(0, 24) + '…' : text;
    ctx.fillText(`"${shortText}"`, 160, 55);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.4, 0.56, 1);
    return sprite;
  }

  /**
   * Dựng hình khối 3D nhân vật Phật tử với đầy đủ khớp cử động
   */
  _buildAvatarMesh(variant) {
    const root = new THREE.Group();

    // Vật liệu theo biến thể
    const robeMat = new THREE.MeshLambertMaterial({ color: variant.robeColor });
    const collarMat = new THREE.MeshLambertMaterial({ color: variant.collarColor });
    const skinMat = new THREE.MeshLambertMaterial({ color: variant.skinColor });
    const hairMat = new THREE.MeshLambertMaterial({ color: variant.hairColor });

    // 1. Khớp eo / thân (Body Pivot để cúi lạy)
    const bodyPivot = new THREE.Group();
    bodyPivot.position.set(0, 0.12, 0); // Vị trí eo
    root.add(bodyPivot);

    // Thân mình (Torso)
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.46, 10), robeMat);
    torso.position.y = 0.23;
    torso.castShadow = true;
    bodyPivot.add(torso);

    // Cổ áo viền chéo truyền thống
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.19, 0.1, 10), collarMat);
    collar.position.y = 0.42;
    bodyPivot.add(collar);

    // Khớp cổ & Đầu
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.54, 0);
    bodyPivot.add(headGroup);

    // Khuôn mặt
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), skinMat);
    head.castShadow = true;
    headGroup.add(head);

    // Mái tóc
    if (variant.hasBun) {
      // Tóc nữ búi cài trâm
      const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.135, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
      hairBase.position.y = 0.02;
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), hairMat);
      bun.position.set(0, 0.13, -0.06);
      headGroup.add(hairBase, bun);
    } else {
      // Tóc nam ngắn
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.134, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
      hair.position.y = 0.02;
      headGroup.add(hair);
    }

    // 2. Hai cánh tay (vai & cẳng tay để chắp tay, dâng hoa, đảnh lễ)
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.21, 0.4, 0);
    bodyPivot.add(leftArmPivot);

    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.26, 8), robeMat);
    leftArm.position.y = -0.12;
    leftArm.castShadow = true;
    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), skinMat);
    leftHand.position.y = -0.26;
    leftArmPivot.add(leftArm, leftHand);

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.21, 0.4, 0);
    bodyPivot.add(rightArmPivot);

    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.26, 8), robeMat);
    rightArm.position.y = -0.12;
    rightArm.castShadow = true;
    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), skinMat);
    rightHand.position.y = -0.26;
    rightArmPivot.add(rightArm, rightHand);

    // 3. Đóa hoa sen dâng lễ (mặc định ẩn)
    const flowerGroup = new THREE.Group();
    const lotusPetalMat = new THREE.MeshLambertMaterial({ color: 0xff69b4 });
    const lotusCenterMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    const lotusCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.05, 8), lotusCenterMat);
    flowerGroup.add(lotusCenter);
    for (let p = 0; p < 6; p++) {
      const angle = (p / 6) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.09, 5), lotusPetalMat);
      petal.position.set(Math.cos(angle) * 0.05, 0.02, Math.sin(angle) * 0.05);
      petal.rotation.y = angle;
      petal.rotation.x = 0.3;
      flowerGroup.add(petal);
    }
    flowerGroup.position.set(0, -0.22, 0.16);
    flowerGroup.visible = false;
    bodyPivot.add(flowerGroup);

    // 4. Tư thế chân ngồi kiết già / quỳ trên bồ đoàn
    const legsGroup = new THREE.Group();
    const legsMat = new THREE.MeshLambertMaterial({ color: variant.robeColor });
    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.28, 8), legsMat);
    leftLeg.rotation.z = Math.PI / 2.6;
    leftLeg.position.set(-0.13, 0.06, 0.06);
    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.28, 8), legsMat);
    rightLeg.rotation.z = -Math.PI / 2.6;
    rightLeg.position.set(0.13, 0.06, 0.06);
    legsGroup.add(leftLeg, rightLeg);
    root.add(legsGroup);

    // Mặc định ở tư thế ngồi chắp tay trang nghiêm (Nam Mô / JoinHands)
    leftArmPivot.rotation.set(-0.7, 0, 0.7);
    rightArmPivot.rotation.set(-0.7, 0, -0.7);

    return {
      root,
      bodyPivot,
      headGroup,
      leftArmPivot,
      rightArmPivot,
      legsGroup,
      flowerGroup
    };
  }

  /**
   * Lấy hoặc tạo mới Phật tử ảo dựa trên TikTok UniqueId
   */
  getOrCreateAvatar(user) {
    if (!user || !user.uniqueId) return null;
    const uid = user.uniqueId;

    if (this.avatars.has(uid)) {
      const existing = this.avatars.get(uid);
      // Cập nhật tên nếu có thay đổi
      if (user.nickname && user.nickname !== existing.nickname) {
        existing.nickname = user.nickname;
        this.updateNameplate(uid, user.nickname);
      }
      return existing;
    }

    // Tìm chỗ ngồi trống
    const seat = this._findAvailableSeat();
    seat.occupied = true;
    seat.userId = uid;

    // Chọn biến thể trang phục
    const variantIndex = typeof user.avatarIndex === 'number'
      ? user.avatarIndex % AVATAR_VARIANTS.length
      : Math.floor(Math.random() * AVATAR_VARIANTS.length);
    const variant = AVATAR_VARIANTS[variantIndex];

    // Dựng mô hình 3D
    const meshData = this._buildAvatarMesh(variant);
    meshData.root.position.set(seat.x, seat.y + 0.08, seat.z);
    meshData.root.rotation.y = 0; // Hướng mặt thẳng lên bàn Phật

    // Tạo Nameplate
    const nameplate = this._createNameplate(user.nickname || 'Phật Tử');
    nameplate.position.set(0, 0.95, 0);
    meshData.root.add(nameplate);

    this.scene.add(meshData.root);

    // Animation xuất hiện mượt mà (Fade/Scale in)
    meshData.root.scale.set(0.01, 0.01, 0.01);
    gsap.to(meshData.root.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: 'back.out(1.4)' });

    const avatarData = {
      userId: uid,
      nickname: user.nickname || 'Phật Tử',
      seat,
      variant,
      meshData,
      nameplate,
      activeBubble: null,
      currentState: 'IDLE',
      isAnimating: false
    };

    this.avatars.set(uid, avatarData);
    return avatarData;
  }

  updateNameplate(uid, newNickname) {
    const avatar = this.avatars.get(uid);
    if (!avatar) return;
    if (avatar.nameplate) {
      avatar.meshData.root.remove(avatar.nameplate);
      avatar.nameplate.material.dispose();
      avatar.nameplate.material.map.dispose();
    }
    avatar.nameplate = this._createNameplate(newNickname);
    avatar.nameplate.position.set(0, 0.95, 0);
    avatar.meshData.root.add(avatar.nameplate);
  }

  /**
   * Hiển thị Bong bóng bình luận (Comment Bubble) trên đầu nhân vật trong 4.5 giây
   */
  showCommentBubble(uid, text) {
    const avatar = this.avatars.get(uid);
    if (!avatar || !text) return;

    // Xóa bubble cũ nếu đang có
    if (avatar.activeBubble) {
      gsap.killTweensOf(avatar.activeBubble.scale);
      avatar.meshData.root.remove(avatar.activeBubble);
      if (avatar.activeBubble.material.map) avatar.activeBubble.material.map.dispose();
      avatar.activeBubble.material.dispose();
      avatar.activeBubble = null;
    }

    const bubble = this._createBubbleSprite(text);
    bubble.position.set(0, 1.45, 0);
    bubble.scale.set(0.01, 0.01, 0.01);
    avatar.meshData.root.add(bubble);
    avatar.activeBubble = bubble;

    // Hiệu ứng phồng lên rồi mờ dần
    gsap.to(bubble.scale, { x: 1.4, y: 0.56, z: 1, duration: 0.35, ease: 'back.out(1.6)' });
    gsap.to(bubble.position, { y: 1.55, duration: 4.0, ease: 'sine.out' });

    setTimeout(() => {
      if (avatar.activeBubble === bubble) {
        gsap.to(bubble.scale, {
          x: 0.01,
          y: 0.01,
          z: 0.01,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => {
            avatar.meshData.root.remove(bubble);
            if (bubble.material.map) bubble.material.map.dispose();
            bubble.material.dispose();
            avatar.activeBubble = null;
          }
        });
      }
    }, 4500);
  }

  /**
   * Animation State Machine điều khiển Avatar thực hiện nghi lễ
   */
  playCommandAnimation(uid, commandType, payload = {}) {
    const avatar = this.avatars.get(uid);
    if (!avatar) return;

    const { bodyPivot, headGroup, leftArmPivot, rightArmPivot, flowerGroup } = avatar.meshData;

    // Reset các tween đang chạy trên avatar này
    gsap.killTweensOf(bodyPivot.rotation);
    gsap.killTweensOf(bodyPivot.position);
    gsap.killTweensOf(headGroup.rotation);
    gsap.killTweensOf(leftArmPivot.rotation);
    gsap.killTweensOf(rightArmPivot.rotation);

    avatar.isAnimating = true;
    flowerGroup.visible = false;

    switch (commandType) {
      case 'BOW': // Lạy Phật: cúi mình gập người sâu về phía trước
        avatar.currentState = 'BOW';
        gsap.to(bodyPivot.rotation, {
          x: 0.75,
          duration: 0.65,
          ease: 'power2.inOut',
          yoyo: true,
          repeat: 1,
          onComplete: () => {
            this._resetToIdle(avatar);
          }
        });
        gsap.to(leftArmPivot.rotation, { x: -1.2, z: 0.3, duration: 0.65, yoyo: true, repeat: 1 });
        gsap.to(rightArmPivot.rotation, { x: -1.2, z: -0.3, duration: 0.65, yoyo: true, repeat: 1 });
        break;

      case 'DEEP_BOW': // Phủ phục năm vóc sát đất
        avatar.currentState = 'DEEP_BOW';
        gsap.to(bodyPivot.rotation, {
          x: 1.15,
          duration: 0.9,
          ease: 'power1.inOut',
          yoyo: true,
          repeat: 1,
          onComplete: () => {
            this._resetToIdle(avatar);
          }
        });
        gsap.to(bodyPivot.position, { y: -0.05, duration: 0.9, yoyo: true, repeat: 1 });
        break;

      case 'NIEM_PHAT': // Chắp tay niệm Phật trang nghiêm
      case 'JOIN_HANDS':
        avatar.currentState = 'NIEM_PHAT';
        gsap.to(leftArmPivot.rotation, { x: -0.85, y: 0, z: 0.85, duration: 0.45, ease: 'power2.out' });
        gsap.to(rightArmPivot.rotation, { x: -0.85, y: 0, z: -0.85, duration: 0.45, ease: 'power2.out' });
        gsap.to(headGroup.rotation, {
          x: 0.18,
          duration: 0.5,
          yoyo: true,
          repeat: 1,
          onComplete: () => {
            this._resetToIdle(avatar);
          }
        });
        break;

      case 'KNEEL': // Quỳ trang nghiêm
        avatar.currentState = 'KNEEL';
        gsap.to(bodyPivot.position, { y: -0.04, duration: 0.4, ease: 'power2.out' });
        gsap.to(leftArmPivot.rotation, { x: -0.8, z: 0.8, duration: 0.4 });
        gsap.to(rightArmPivot.rotation, { x: -0.8, z: -0.8, duration: 0.4 });
        setTimeout(() => this._resetToIdle(avatar), 3500);
        break;

      case 'STAND': // Đứng dậy chắp tay
        avatar.currentState = 'STAND';
        gsap.to(bodyPivot.position, { y: 0.32, duration: 0.55, ease: 'power2.out' });
        gsap.to(leftArmPivot.rotation, { x: -0.65, z: 0.7, duration: 0.5 });
        gsap.to(rightArmPivot.rotation, { x: -0.65, z: -0.7, duration: 0.5 });
        setTimeout(() => this._resetToIdle(avatar), 4000);
        break;

      case 'PRAY': // Cầu nguyện tịnh tâm
        avatar.currentState = 'PRAY';
        gsap.to(leftArmPivot.rotation, { x: -0.95, z: 0.9, duration: 0.5 });
        gsap.to(rightArmPivot.rotation, { x: -0.95, z: -0.9, duration: 0.5 });
        gsap.to(headGroup.rotation, { x: 0.22, duration: 0.6 });
        setTimeout(() => this._resetToIdle(avatar), 4500);
        break;

      case 'OFFER_FLOWER': // Dâng hoa cúng Phật
        avatar.currentState = 'OFFER_FLOWER';
        flowerGroup.visible = true;
        flowerGroup.scale.set(0.01, 0.01, 0.01);
        gsap.to(flowerGroup.scale, { x: 1, y: 1, z: 1, duration: 0.4 });
        gsap.to(leftArmPivot.rotation, { x: -1.05, z: 0.45, duration: 0.5 });
        gsap.to(rightArmPivot.rotation, { x: -1.05, z: -0.45, duration: 0.5 });
        setTimeout(() => {
          gsap.to(flowerGroup.scale, {
            x: 0.01,
            y: 0.01,
            z: 0.01,
            duration: 0.4,
            onComplete: () => {
              flowerGroup.visible = false;
              this._resetToIdle(avatar);
            }
          });
        }, 3500);
        break;

      case 'WALK_TO_ALTAR': // Tiến lên phía bàn thờ dâng lễ rồi trở về
        avatar.currentState = 'WALK_TO_ALTAR';
        const startZ = avatar.meshData.root.position.z;
        gsap.to(avatar.meshData.root.position, {
          z: Math.max(-2.5, startZ - 1.2),
          duration: 1.2,
          ease: 'power1.inOut',
          onComplete: () => {
            gsap.to(bodyPivot.rotation, {
              x: 0.6,
              duration: 0.6,
              yoyo: true,
              repeat: 1,
              onComplete: () => {
                gsap.to(avatar.meshData.root.position, {
                  z: startZ,
                  duration: 1.2,
                  ease: 'power1.inOut',
                  onComplete: () => {
                    this._resetToIdle(avatar);
                  }
                });
              }
            });
          }
        });
        break;

      default:
        // Gift hoặc hành động chung
        avatar.currentState = 'GIFT';
        gsap.to(bodyPivot.rotation, {
          x: 0.5,
          duration: 0.5,
          yoyo: true,
          repeat: 1,
          onComplete: () => {
            this._resetToIdle(avatar);
          }
        });
        break;
    }
  }

  _resetToIdle(avatar) {
    if (!avatar || !avatar.meshData) return;
    const { bodyPivot, headGroup, leftArmPivot, rightArmPivot } = avatar.meshData;

    gsap.to(bodyPivot.rotation, { x: 0, y: 0, z: 0, duration: 0.5 });
    gsap.to(bodyPivot.position, { x: 0, y: 0.12, z: 0, duration: 0.5 });
    gsap.to(headGroup.rotation, { x: 0, y: 0, z: 0, duration: 0.5 });
    // Trở về tư thế chắp tay tịnh tâm
    gsap.to(leftArmPivot.rotation, { x: -0.7, y: 0, z: 0.7, duration: 0.5 });
    gsap.to(rightArmPivot.rotation, { x: -0.7, y: 0, z: -0.7, duration: 0.5 });

    avatar.currentState = 'IDLE';
    avatar.isAnimating = false;
  }

  /**
   * Tất cả Phật tử trong điện cùng đồng thanh vái lạy (khi có sự kiện lớn)
   */
  bowAllAvatars() {
    this.avatars.forEach((avatar, idx) => {
      setTimeout(() => {
        this.playCommandAnimation(avatar.userId, 'BOW');
      }, (idx % 6) * 60);
    });
  }

  /**
   * Xóa tất cả avatar (khi reset phòng)
   */
  clearAllAvatars() {
    this.avatars.forEach((avatar) => {
      this.scene.remove(avatar.meshData.root);
    });
    this.avatars.clear();
    this.seatingGrid.forEach((seat) => {
      seat.occupied = false;
      seat.userId = null;
    });
  }

  /**
   * Cập nhật chuyển động thở nhẹ nhàng tịnh tâm (Idle animation)
   */
  update(elapsed) {
    let idx = 0;
    this.avatars.forEach((avatar) => {
      if (!avatar.isAnimating) {
        // Nhịp thở nhấp nhô nhẹ nhàng
        const breath = Math.sin(elapsed * 1.8 + idx * 0.4) * 0.008;
        avatar.meshData.bodyPivot.position.y = 0.12 + breath;
      }
      idx++;
    });
  }

  getAvatarCount() {
    return this.avatars.size;
  }
}

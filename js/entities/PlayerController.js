/**
 * PlayerController.js — Điều khiển Nhân vật 3D Nhập vai Góc nhìn thứ 3
 * Tích hợp sẵn GLTFLoader chờ nạp model Tripo 3D (`./assets/models/player.glb`),
 * đồng thời có sẵn Hàm dựng Nhân vật Đa Khớp (Articulated Rig) mặc áo lam/áo tràng
 * hoạt động mượt mà ngay lập tức khi chưa có file .glb!
 *
 * Đầy đủ Animations:
 * - IDLE: Đứng chắp tay búp sen trang nghiêm, nhịp thở nhẹ.
 * - WALK: Đi bộ vung tay chân + "Bộ Bộ Sinh Liên" nở hoa sen vàng dưới chân.
 * - BOW: Cúi mình đảnh lễ lạy Phật 45 độ.
 * - MEDITATE: Ngồi kiết già tịnh tâm niệm Phật.
 * - HAND_SEAL: Múa tay kết ấn xoay vòng linh quang.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from 'gsap';

export class PlayerController {
  constructor(scene, camera, collisionSystem, environmentVfxOrOptions) {
    this.scene = scene;
    this.camera = camera;
    this.collision = collisionSystem;

    // Hỗ trợ cả 2 dạng: truyền instance vfx hoặc truyền options object
    if (environmentVfxOrOptions && environmentVfxOrOptions.vfxManager) {
      this.vfx = environmentVfxOrOptions.vfxManager;
      this.playerName = environmentVfxOrOptions.devoteeName || 'Phật Tử Hữu Duyên';
    } else {
      this.vfx = environmentVfxOrOptions;
      this.playerName = 'Phật Tử Hữu Duyên';
    }

    // Cấu hình Model
    this.modelConfig = {
      playerGlbUrl: './assets/models/player.glb',
      useProceduralFallback: true
    };

    this.root = new THREE.Group();
    this.scene.add(this.root);

    // Vị trí xuất phát ở sân chùa gần Cổng Tam Quan
    this.root.position.set(0, 0, 26);

    this.isGlbLoaded = false;
    this.mixer = null;
    this.glbActions = {};

    // Khớp xương cho Procedural Character
    this.proceduralParts = null;

    // Trạng thái Animation
    this.currentState = 'IDLE';
    this.isLockedAction = false; // Khi đang lạy hoặc kết ấn

    // Vận tốc & di chuyển
    this.velocity = new THREE.Vector3();
    this.moveSpeed = 4.8;
    this.rotationSpeed = 10.0;
    this.stepDistanceCounter = 0;

    // Camera follow & Orbit
    this.cameraOffset = new THREE.Vector3(0, 2.4, 5.2);
    this.cameraLookOffset = new THREE.Vector3(0, 1.4, 0);
    this.orbitAngles = { theta: 0, phi: 0.35 };
    this.isOrbiting = false;
    this.previousPointer = { x: 0, y: 0 };

    // Input state
    this.inputVector = new THREE.Vector2(0, 0);
    this.keyboardKeys = {
      forward: false,
      backward: false,
      left: false,
      right: false
    };

    this.nameplate = null;

    // Khởi tạo ngay lập tức
    this.init(this.playerName);
  }
    this.previousPointer = { x: 0, y: 0 };

    // Input state
    this.inputVector = new THREE.Vector2(0, 0);
    this.keyboardKeys = {
      forward: false,
      backward: false,
      left: false,
      right: false
    };

    this.nameplate = null;
  }

  init(playerName = 'Phật Tử Hữu Duyên') {
    this.playerName = playerName;
    this._tryLoadGlbModel();
    this._setupInputListeners();
  }

  /**
   * Thử nạp file player.glb từ Tripo 3D; nếu chưa có thì kích hoạt Procedural Rig
   */
  _tryLoadGlbModel() {
    const loader = new GLTFLoader();
    loader.load(
      this.modelConfig.playerGlbUrl,
      (gltf) => {
        console.log('[PlayerController] Nạp thành công model Tripo 3D (.glb)!');
        this.isGlbLoaded = true;
        const model = gltf.scene;
        model.scale.set(1.2, 1.2, 1.2);
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        this.root.add(model);

        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach((clip) => {
            this.glbActions[clip.name.toUpperCase()] = this.mixer.clipAction(clip);
          });
        }
        this._createNameplate();
      },
      undefined,
      (err) => {
        console.log('[PlayerController] Chưa có file .glb, kích hoạt Nhân vật 3D Đa Khớp chất lượng cao.');
        this._buildProceduralCharacter();
        this._createNameplate();
      }
    );
  }

  /**
   * Dựng Nhân vật 3D Đa Khớp (Articulated Rig) mặc áo lam/áo tràng
   */
  _buildProceduralCharacter() {
    const parts = {};
    const group = new THREE.Group();

    // Vật liệu áo lam & da & tóc
    const robeMat = new THREE.MeshStandardMaterial({ color: 0x4a7c9f, roughness: 0.65 });
    const collarMat = new THREE.MeshStandardMaterial({ color: 0x33566e, roughness: 0.6 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfde3cf, roughness: 0.5 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.8 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd54f, metalness: 0.8, roughness: 0.25 });

    // 1. Khớp Thân Dưới (Pelvis / Waist Pivot để cúi lạy)
    const bodyPivot = new THREE.Group();
    bodyPivot.position.set(0, 0.72, 0);
    group.add(bodyPivot);
    parts.bodyPivot = bodyPivot;

    // Thân áo lam hình trụ chữ A
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 0.65, 12), robeMat);
    torso.position.y = 0.32;
    torso.castShadow = true;
    bodyPivot.add(torso);

    // Cổ áo viền chéo
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.25, 0.12, 12), collarMat);
    collar.position.y = 0.58;
    bodyPivot.add(collar);

    // Thắt lưng đai vàng
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.08, 12), goldMat);
    belt.position.y = 0.12;
    bodyPivot.add(belt);

    // 2. Đầu & Khuôn mặt từ bi
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.82, 0);
    bodyPivot.add(headGroup);
    parts.headGroup = headGroup;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 14), skinMat);
    head.castShadow = true;
    headGroup.add(head);

    // Mái tóc búi hoặc nón tu sĩ
    const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.225, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
    hairBase.position.y = 0.04;
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), hairMat);
    bun.position.set(0, 0.22, -0.08);
    headGroup.add(hairBase, bun);

    // Vòng hào quang nhỏ sau gáy phát sáng khi kết ấn
    const haloMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.03, 12, 24),
      new THREE.MeshBasicMaterial({ color: 0xffeb3b, transparent: true, opacity: 0.75 })
    );
    haloMesh.position.set(0, 0.05, -0.22);
    headGroup.add(haloMesh);
    parts.haloMesh = haloMesh;

    // 3. Hai cánh tay (Khớp vai + bàn tay)
    const armL = new THREE.Group();
    armL.position.set(-0.32, 0.55, 0);
    bodyPivot.add(armL);
    parts.leftArm = armL;

    const sleeveL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.42, 8), robeMat);
    sleeveL.position.y = -0.18;
    sleeveL.castShadow = true;
    const handL = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), skinMat);
    handL.position.y = -0.4;
    armL.add(sleeveL, handL);

    const armR = new THREE.Group();
    armR.position.set(0.32, 0.55, 0);
    bodyPivot.add(armR);
    parts.rightArm = armR;

    const sleeveR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.42, 8), robeMat);
    sleeveR.position.y = -0.18;
    sleeveR.castShadow = true;
    const handR = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), skinMat);
    handR.position.y = -0.4;
    armR.add(sleeveR, handR);

    // Chuỗi tràng hạt 18 hạt trên tay
    const beadRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.025, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.5 })
    );
    beadRing.position.set(0, -0.38, 0.08);
    armL.add(beadRing);

    // 4. Hai chân (Khớp háng + bàn chân bước đi)
    const legL = new THREE.Group();
    legL.position.set(-0.14, 0.65, 0);
    group.add(legL);
    parts.leftLeg = legL;

    const pantsL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.65, 8), robeMat);
    pantsL.position.y = -0.32;
    const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.24), collarMat);
    shoeL.position.set(0, -0.65, 0.04);
    legL.add(pantsL, shoeL);

    const legR = new THREE.Group();
    legR.position.set(0.14, 0.65, 0);
    group.add(legR);
    parts.rightLeg = legR;

    const pantsR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.65, 8), robeMat);
    pantsR.position.y = -0.32;
    const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.24), collarMat);
    shoeR.position.set(0, -0.65, 0.04);
    legR.add(pantsR, shoeR);

    // Tư thế mặc định: IDLE đứng chắp hai tay trước ngực
    armL.rotation.set(-0.85, 0, 0.85);
    armR.rotation.set(-0.85, 0, -0.85);

    this.proceduralParts = parts;
    this.root.add(group);
  }

  _createNameplate() {
    if (this.nameplate) this.root.remove(this.nameplate);

    const canvas = document.createElement('canvas');
    canvas.width = 320; canvas.height = 72;
    const ctx = canvas.getContext('2d');

    // Nền gấm viền vàng
    ctx.fillStyle = 'rgba(25, 12, 8, 0.8)';
    ctx.roundRect ? ctx.roundRect(8, 8, 304, 56, 12) : ctx.fillRect(8, 8, 304, 56);
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#fff8eb';
    ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🙏 ${this.playerName}`, 160, 36);

    const tex = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
    this.nameplate = new THREE.Sprite(spriteMat);
    this.nameplate.scale.set(1.4, 0.32, 1);
    this.nameplate.position.set(0, 2.1, 0);
    this.root.add(this.nameplate);
  }

  updatePlayerName(newName) {
    this.playerName = newName;
    this._createNameplate();
  }

  _setupInputListeners() {
    // Bàn phím WASD
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keyboardKeys.forward = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keyboardKeys.backward = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keyboardKeys.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keyboardKeys.right = true;
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keyboardKeys.forward = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keyboardKeys.backward = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keyboardKeys.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keyboardKeys.right = false;
    });

    // Orbit Camera xoay quanh nhân vật bằng chuột / vuốt ngón tay
    window.addEventListener('pointerdown', (e) => {
      if (e.target.closest('#virtual-joystick') || e.target.closest('.hud-btn') || e.target.closest('.modal-content')) return;
      this.isOrbiting = true;
      this.previousPointer.x = e.clientX;
      this.previousPointer.y = e.clientY;
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isOrbiting) return;
      const dx = e.clientX - this.previousPointer.x;
      const dy = e.clientY - this.previousPointer.y;
      this.previousPointer.x = e.clientX;
      this.previousPointer.y = e.clientY;

      this.orbitAngles.theta -= dx * 0.005;
      this.orbitAngles.phi = Math.max(0.12, Math.min(1.15, this.orbitAngles.phi + dy * 0.005));
    });

    window.addEventListener('pointerup', () => {
      this.isOrbiting = false;
    });
  }

  /**
   * Cập nhật từ Virtual Joystick
   */
  handleJoystickInput(x, y) {
    this.inputVector.set(x, y);
  }

  /**
   * Chuyển đổi trạng thái Animation
   */
  setAnimation(state) {
    if (this.isLockedAction && state !== 'IDLE') return;
    if (this.currentState === state) return;

    this.currentState = state;

    if (this.isGlbLoaded && this.glbActions[state]) {
      Object.values(this.glbActions).forEach(a => a.fadeOut(0.2));
      this.glbActions[state].reset().fadeIn(0.2).play();
    } else if (this.proceduralParts) {
      this._applyProceduralAnimation(state);
    }
  }

  _applyProceduralAnimation(state) {
    const { bodyPivot, headGroup, leftArm, rightArm, leftLeg, rightLeg, haloMesh } = this.proceduralParts;

    gsap.killTweensOf(bodyPivot.rotation);
    gsap.killTweensOf(bodyPivot.position);
    gsap.killTweensOf(leftArm.rotation);
    gsap.killTweensOf(rightArm.rotation);
    gsap.killTweensOf(leftLeg.rotation);
    gsap.killTweensOf(rightLeg.rotation);

    switch (state) {
      case 'IDLE':
        gsap.to(bodyPivot.rotation, { x: 0, y: 0, z: 0, duration: 0.3 });
        gsap.to(bodyPivot.position, { y: 0.72, duration: 0.3 });
        gsap.to(leftArm.rotation, { x: -0.85, y: 0, z: 0.85, duration: 0.3 });
        gsap.to(rightArm.rotation, { x: -0.85, y: 0, z: -0.85, duration: 0.3 });
        gsap.to(leftLeg.rotation, { x: 0, duration: 0.3 });
        gsap.to(rightLeg.rotation, { x: 0, duration: 0.3 });
        break;

      case 'BOW': // Cúi lạy Phật 45 độ
        this.isLockedAction = true;
        gsap.to(bodyPivot.rotation, {
          x: 0.75,
          duration: 0.65,
          yoyo: true,
          repeat: 1,
          ease: 'power1.inOut',
          onComplete: () => {
            this.isLockedAction = false;
            this.setAnimation('IDLE');
          }
        });
        gsap.to(leftArm.rotation, { x: -1.25, z: 0.25, duration: 0.65, yoyo: true, repeat: 1 });
        gsap.to(rightArm.rotation, { x: -1.25, z: -0.25, duration: 0.65, yoyo: true, repeat: 1 });
        break;

      case 'MEDITATE': // Ngồi kiết già tịnh tọa
        this.isLockedAction = true;
        gsap.to(bodyPivot.position, { y: 0.28, duration: 0.6 });
        gsap.to(leftArm.rotation, { x: -0.65, z: 0.65, duration: 0.6 });
        gsap.to(rightArm.rotation, { x: -0.65, z: -0.65, duration: 0.6 });
        gsap.to(leftLeg.rotation, { x: Math.PI / 2.5, z: 0.4, duration: 0.6 });
        gsap.to(rightLeg.rotation, { x: Math.PI / 2.5, z: -0.4, duration: 0.6 });
        break;

      case 'HAND_SEAL': // Múa tay Kết Ấn linh quang
        this.isLockedAction = true;
        gsap.to(leftArm.rotation, { x: -1.1, y: 0.5, z: 0.4, duration: 0.4, yoyo: true, repeat: 3 });
        gsap.to(rightArm.rotation, { x: -1.1, y: -0.5, z: -0.4, duration: 0.4, yoyo: true, repeat: 3 });
        gsap.to(haloMesh.scale, { x: 2.2, y: 2.2, z: 2.2, duration: 0.8, yoyo: true, repeat: 1 });
        setTimeout(() => {
          this.isLockedAction = false;
          this.setAnimation('IDLE');
        }, 1600);
        break;
    }
  }

  /**
   * Cập nhật chuyển động mỗi frame (60 FPS)
   */
  update(dt, elapsed) {
    if (this.mixer) this.mixer.update(dt);

    this.elapsedTime = (this.elapsedTime || 0) + (dt || 0.016);
    const time = elapsed !== undefined ? elapsed : this.elapsedTime;

    // 1. Tính toán vector di chuyển từ phím & joystick
    let moveX = this.inputVector.x;
    let moveZ = this.inputVector.y;

    if (this.keyboardKeys.forward) moveZ -= 1;
    if (this.keyboardKeys.backward) moveZ += 1;
    if (this.keyboardKeys.left) moveX -= 1;
    if (this.keyboardKeys.right) moveX += 1;

    const moveInput = new THREE.Vector2(moveX, moveZ);
    const isMoving = moveInput.lengthSq() > 0.04 && !this.isLockedAction;

    if (isMoving) {
      moveInput.normalize();

      // Hướng di chuyển theo góc quay của Camera
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.orbitAngles.theta);
      const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.orbitAngles.theta);

      const targetMove = new THREE.Vector3()
        .addScaledVector(right, moveInput.x)
        .addScaledVector(forward, -moveInput.y)
        .normalize()
        .multiplyScalar(this.moveSpeed * dt);

      // Thử nghiệm di chuyển & Giải quyết va chạm
      const nextPos = this.root.position.clone().add(targetMove);
      const resolvedPos = this.collision.resolveCollision(this.root.position, nextPos, 0.45);
      this.root.position.copy(resolvedPos);

      // Xoay hướng mặt nhân vật theo hướng di chuyển
      const targetAngle = Math.atan2(targetMove.x, targetMove.z);
      const currentAngle = this.root.rotation.y;
      this.root.rotation.y = THREE.MathUtils.lerp(currentAngle, targetAngle, dt * this.rotationSpeed);

      this.setAnimation('WALK');

      // Hoạt ảnh bước đi vung tay chân thủ công nếu dùng Procedural
      if (this.proceduralParts) {
        const stepCycle = time * 11.0;
        this.proceduralParts.leftLeg.rotation.x = Math.sin(stepCycle) * 0.55;
        this.proceduralParts.rightLeg.rotation.x = -Math.sin(stepCycle) * 0.55;
        this.proceduralParts.leftArm.rotation.x = -Math.sin(stepCycle) * 0.45 - 0.4;
        this.proceduralParts.rightArm.rotation.x = Math.sin(stepCycle) * 0.45 - 0.4;
        this.proceduralParts.bodyPivot.position.y = 0.72 + Math.abs(Math.sin(stepCycle)) * 0.04;
      }

      // "Bộ Bộ Sinh Liên" — Mỗi bước 0.65m nở một đóa sen vàng
      this.stepDistanceCounter += targetMove.length();
      if (this.stepDistanceCounter > 0.65) {
        this.stepDistanceCounter = 0;
        if (this.vfx) this.vfx.spawnFootprintLotus(this.root.position);
      }
    } else {
      if (!this.isLockedAction && this.currentState === 'WALK') {
        this.setAnimation('IDLE');
      }

      // Nhịp thở tịnh tâm nhẹ nhàng khi IDLE
      if (this.proceduralParts && this.currentState === 'IDLE') {
        this.proceduralParts.bodyPivot.position.y = 0.72 + Math.sin(time * 2.2) * 0.008;
      }
    }

    // 2. Camera bám mượt mà sau lưng nhân vật (Third-Person Follow Lerp)
    const camDist = 5.4;
    const camX = this.root.position.x + Math.sin(this.orbitAngles.theta) * Math.cos(this.orbitAngles.phi) * camDist;
    const camY = this.root.position.y + Math.sin(this.orbitAngles.phi) * camDist + 1.2;
    const camZ = this.root.position.z + Math.cos(this.orbitAngles.theta) * Math.cos(this.orbitAngles.phi) * camDist;

    this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.12);
    this.camera.lookAt(this.root.position.clone().add(this.cameraLookOffset));
  }

  getPosition() {
    return this.root.position;
  }

  setJoystickInput(x, y) {
    this.inputVector.set(x, y);
  }

  setDevoteeName(name) {
    this.playerName = name || 'Phật Tử';
    if (this.nameplate && this.nameplate.parent) {
      this.root.remove(this.nameplate);
      this._createNameplate();
    }
  }
}


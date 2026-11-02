/**
 * VFX Manager (Three.js / GSAP)
 * Quản lý Hạt khói hương (Smoke Particles), Hạt bụi vàng lơ lửng (Ambient Dust),
 * Sóng âm gõ mõ (Shockwave Ring), Chữ "+1 Công Đức" bay lên (Merit Sprite),
 * và cơ chế dọn dẹp bộ nhớ đệ quy (Anti-Memory Leak).
 */

import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Hàm giải phóng đệ quy tài nguyên WebGL để tránh Memory Leak trong OBS 24/7
 * @param {THREE.Object3D} obj
 */
export function disposeHierarchy(obj) {
  if (!obj) return;
  obj.traverse((child) => {
    if (child.isMesh || child.isPoints || child.isSprite) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => disposeMaterial(mat));
        } else {
          disposeMaterial(child.material);
        }
      }
    }
  });
}

function disposeMaterial(mat) {
  if (!mat) return;
  // Giải phóng texture nếu có
  ['map', 'lightMap', 'bumpMap', 'normalMap', 'specularMap', 'envMap', 'alphaMap', 'roughnessMap', 'metalnessMap'].forEach((prop) => {
    if (mat[prop] && typeof mat[prop].dispose === 'function') {
      mat[prop].dispose();
    }
  });
  mat.dispose();
}

/**
 * Tạo canvas texture hình tròn mềm (Soft circular glow) cho hạt khói và bụi
 */
function createCircleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 240, 210, 0.6)');
  gradient.addColorStop(0.8, 'rgba(200, 180, 150, 0.15)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Tạo Sprite chữ "+1 Công Đức" hoặc "+N Công Đức"
 */
function createMeritTextTexture(text = '+1 Công Đức') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#fff8cc';
  ctx.font = 'bold 32px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

export class VfxManager {
  constructor(scene) {
    this.scene = scene;
    this.circleTexture = createCircleTexture();

    // 1. Hệ thống khói hương
    this.smokeParticles = null;
    this.smokePositions = null;
    this.smokeVelocities = null;
    this.smokeMaxCount = 120;
    this.smokeOrigin = new THREE.Vector3(0, 0.25, 0.25); // Đỉnh lư hương
    this.smokeIntensity = 1.0;

    // 2. Bụi vàng không gian (Ambient Dust)
    this.dustParticles = null;
    this.dustCount = 150;

    // 3. Quản lý danh sách đối tượng có vòng đời (Nhang / Đèn) để chống tràn RAM
    this.incenseList = [];
    this.maxIncense = 30; // Giới hạn tối đa 30 cây nhang/nến trên bàn thờ
    this.lanternList = [];
    this.maxLanterns = 15; // Giới hạn tối đa 15 đèn hoa đăng trên trời

    this._initSmokeSystem();
    this._initAmbientDust();
  }

  /**
   * Khởi tạo hệ thống hạt khói hương bằng THREE.Points
   */
  _initSmokeSystem() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.smokeMaxCount * 3);
    const alphas = new Float32Array(this.smokeMaxCount);
    const scales = new Float32Array(this.smokeMaxCount);
    this.smokeVelocities = [];

    for (let i = 0; i < this.smokeMaxCount; i++) {
      // Khởi tạo ngẫu nhiên vị trí quanh đỉnh lư hương
      positions[i * 3 + 0] = this.smokeOrigin.x + (Math.random() - 0.5) * 0.15;
      positions[i * 3 + 1] = this.smokeOrigin.y + Math.random() * 1.8;
      positions[i * 3 + 2] = this.smokeOrigin.z + (Math.random() - 0.5) * 0.15;

      alphas[i] = 0.05 + Math.random() * 0.35;
      scales[i] = 0.15 + Math.random() * 0.2;

      this.smokeVelocities.push({
        vx: (Math.random() - 0.5) * 0.04,
        vy: 0.12 + Math.random() * 0.15,
        vz: (Math.random() - 0.5) * 0.04,
        phase: Math.random() * Math.PI * 2
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.smokePositions = geometry.attributes.position;

    const material = new THREE.PointsMaterial({
      size: 0.25,
      map: this.circleTexture,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.NormalBlending,
      color: 0xdedede
    });

    this.smokeParticles = new THREE.Points(geometry, material);
    this.smokeParticles.renderOrder = 5;
    this.scene.add(this.smokeParticles);
  }

  /**
   * Khởi tạo 150 hạt bụi vàng lơ lửng khắp không gian 9:16
   */
  _initAmbientDust() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.dustCount * 3);
    this.dustSpeeds = [];

    for (let i = 0; i < this.dustCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 5.0; // Trục X
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6.0; // Trục Y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3.5; // Trục Z

      this.dustSpeeds.push({
        vy: 0.02 + Math.random() * 0.03,
        phase: Math.random() * Math.PI * 2
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.dustPositions = geometry.attributes.position;

    const material = new THREE.PointsMaterial({
      size: 0.08,
      map: this.circleTexture,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: 0xffd700 // Vàng kim lung linh
    });

    this.dustParticles = new THREE.Points(geometry, material);
    this.dustParticles.renderOrder = 6;
    this.scene.add(this.dustParticles);
  }

  /**
   * Kích hoạt hiệu ứng Gõ Mõ:
   * 1. Vòng sóng âm vàng kim (Shockwave Ring) lan rộng trên mặt bàn
   * 2. Chữ "+1 Công Đức" bay vút lên cao rồi biến mất
   * @param {THREE.Vector3} position Vị trí mõ gỗ
   * @param {number} intensity Độ mạnh của tương tác
   */
  triggerWoodenFishVfx(position, intensity = 1) {
    if (!position) return;

    // 1. Vòng sóng âm vàng kim (Ring Shockwave)
    const ringGeo = new THREE.RingGeometry(0.1, 0.16, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(position);
    ring.position.y += 0.02; // Ngay dưới đế mõ
    this.scene.add(ring);

    gsap.to(ring.scale, {
      x: 3.2,
      y: 3.2,
      z: 3.2,
      duration: 0.55,
      ease: 'power2.out'
    });

    gsap.to(ringMat, {
      opacity: 0,
      duration: 0.55,
      ease: 'power2.out',
      onComplete: () => {
        this.scene.remove(ring);
        ringGeo.dispose();
        ringMat.dispose();
      }
    });

    // 2. Chữ "+1 Công Đức" bay lên
    const textLabel = intensity > 1 ? `+${intensity} Công Đức` : '+1 Công Đức';
    const textTex = createMeritTextTexture(textLabel);
    const spriteMat = new THREE.SpriteMaterial({
      map: textTex,
      transparent: true,
      opacity: 1
    });
    const textSprite = new THREE.Sprite(spriteMat);
    textSprite.scale.set(0.75, 0.22, 1);
    textSprite.position.set(position.x, position.y + 0.35, position.z);
    this.scene.add(textSprite);

    gsap.to(textSprite.position, {
      y: position.y + 1.1,
      duration: 0.85,
      ease: 'power1.out'
    });

    gsap.to(spriteMat, {
      opacity: 0,
      duration: 0.85,
      delay: 0.2,
      ease: 'power1.in',
      onComplete: () => {
        this.scene.remove(textSprite);
        textTex.dispose();
        spriteMat.dispose();
      }
    });
  }

  /**
   * Tăng cường độ khói hương khi có nhiều người thắp nhang
   */
  boostSmoke() {
    this.smokeIntensity = Math.min(this.smokeIntensity + 0.5, 3.0);
    gsap.to(this, {
      smokeIntensity: 1.0,
      duration: 8.0,
      ease: 'power2.in'
    });
  }

  /**
   * Thêm nén nhang / nến vào danh sách quản lý bộ nhớ chống rò rỉ RAM (Anti-Memory Leak)
   * @param {THREE.Group} itemGroup
   */
  registerIncense(itemGroup) {
    this.incenseList.push({
      mesh: itemGroup,
      createdAt: Date.now()
    });

    // Nếu quá giới hạn 30 cây, dỡ bỏ cây cũ nhất
    if (this.incenseList.length > this.maxIncense) {
      const oldest = this.incenseList.shift();
      this._removeAndDisposeItem(oldest.mesh);
    }
  }

  /**
   * Thêm đèn hoa đăng vào danh sách quản lý
   * @param {THREE.Group} lanternGroup
   */
  registerLantern(lanternGroup) {
    this.lanternList.push({
      mesh: lanternGroup,
      createdAt: Date.now()
    });

    // Nếu quá 15 đèn, dỡ bỏ đèn cũ nhất
    if (this.lanternList.length > this.maxLanterns) {
      const oldest = this.lanternList.shift();
      this._removeAndDisposeItem(oldest.mesh);
    }
  }

  _removeAndDisposeItem(obj) {
    if (!obj) return;
    this.scene.remove(obj);
    disposeHierarchy(obj);
  }

  /**
   * Cập nhật chuyển động hạt khói, bụi vàng và dọn dẹp các vật thể quá 35 giây
   * @param {number} delta Thời gian trôi qua mỗi khung hình
   * @param {number} elapsed Tổng thời gian chạy
   */
  update(delta, elapsed) {
    // 1. Cập nhật khói hương
    if (this.smokePositions && this.smokeVelocities) {
      const pos = this.smokePositions.array;
      const count = this.smokeMaxCount;

      for (let i = 0; i < count; i++) {
        const vel = this.smokeVelocities[i];
        const idx = i * 3;

        // Bay lên theo trục Y
        pos[idx + 1] += vel.vy * delta * this.smokeIntensity;

        // Uốn lượn hình sin mềm mại
        pos[idx + 0] += Math.sin(elapsed * 1.5 + vel.phase) * 0.003;
        pos[idx + 2] += Math.cos(elapsed * 1.2 + vel.phase) * 0.002;

        // Khi hạt lên quá cao (> 2.3m), tái sinh lại ở đỉnh lư hương
        if (pos[idx + 1] > 2.3) {
          pos[idx + 0] = this.smokeOrigin.x + (Math.random() - 0.5) * 0.18;
          pos[idx + 1] = this.smokeOrigin.y + (Math.random() - 0.5) * 0.05;
          pos[idx + 2] = this.smokeOrigin.z + (Math.random() - 0.5) * 0.18;
        }
      }
      this.smokePositions.needsUpdate = true;
    }

    // 2. Cập nhật bụi vàng lơ lửng
    if (this.dustPositions && this.dustSpeeds) {
      const pos = this.dustPositions.array;
      for (let i = 0; i < this.dustCount; i++) {
        const speed = this.dustSpeeds[i];
        const idx = i * 3;

        pos[idx + 1] += speed.vy * delta;
        pos[idx + 0] += Math.sin(elapsed * 0.8 + speed.phase) * 0.001;

        if (pos[idx + 1] > 3.0) {
          pos[idx + 1] = -2.5;
        }
      }
      this.dustPositions.needsUpdate = true;
    }

    // 3. Tự động kiểm tra dọn dẹp nhang/đèn quá thời gian 35 giây để chống tràn RAM
    const now = Date.now();
    for (let i = this.incenseList.length - 1; i >= 0; i--) {
      const item = this.incenseList[i];
      if (now - item.createdAt > 35000) {
        this.incenseList.splice(i, 1);
        this._removeAndDisposeItem(item.mesh);
      }
    }

    for (let i = this.lanternList.length - 1; i >= 0; i--) {
      const item = this.lanternList[i];
      if (now - item.createdAt > 35000) {
        this.lanternList.splice(i, 1);
        this._removeAndDisposeItem(item.mesh);
      }
    }
  }

  /**
   * Dọn dẹp toàn bộ hệ thống VFX khi tắt trang
   */
  destroy() {
    if (this.smokeParticles) {
      this.scene.remove(this.smokeParticles);
      disposeHierarchy(this.smokeParticles);
    }
    if (this.dustParticles) {
      this.scene.remove(this.dustParticles);
      disposeHierarchy(this.dustParticles);
    }
    this.incenseList.forEach((item) => this._removeAndDisposeItem(item.mesh));
    this.lanternList.forEach((item) => this._removeAndDisposeItem(item.mesh));
    this.incenseList = [];
    this.lanternList = [];
    if (this.circleTexture) this.circleTexture.dispose();
  }
}


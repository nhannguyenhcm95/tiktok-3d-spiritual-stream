/**
 * VFX Manager — Chùa An Lạc
 * Quản lý Khói hương, Đom đóm đêm, Cánh hoa sen rơi,
 * Sóng âm gõ mõ, Pháo hoa giấy vàng kim, Phật Quang bùng sáng và Vũ Trụ Phật Pháp.
 */

import * as THREE from 'three';
import gsap from 'gsap';

export function disposeHierarchy(obj) {
  if (!obj) return;
  obj.traverse((child) => {
    if (child.isMesh || child.isPoints || child.isSprite) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
  });
}

function createCircleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.3, 'rgba(255, 230, 160, 0.7)');
  grad.addColorStop(0.8, 'rgba(210, 150, 70, 0.2)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

export class VfxManager {
  constructor(scene) {
    this.scene = scene;
    this.circleTex = createCircleTexture();

    // 1. Khói hương lư đồng
    this.smokePoints = null;
    this.smokeGeo = null;
    this.smokeCount = 65;

    // 2. Đom đóm & Cánh hoa vàng
    this.ambientPoints = null;
    this.ambientGeo = null;
    this.ambientCount = 110;

    // 3. Quản lý dọn dẹp các hiệu ứng ngắn hạn
    this.activeEffects = [];

    this._initSmoke();
    this._initAmbientParticles();
  }

  _initSmoke() {
    this.smokeGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.smokeCount * 3);
    for (let i = 0; i < this.smokeCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 0.9;
      pos[i * 3 + 1] = 2.1 + Math.random() * 4.5;
      pos[i * 3 + 2] = 5.0 + (Math.random() - 0.5) * 0.9;
    }
    this.smokeGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xe8dfd5,
      size: 0.38,
      map: this.circleTex,
      transparent: true,
      opacity: 0.4,
      depthWrite: false
    });
    this.smokePoints = new THREE.Points(this.smokeGeo, mat);
    this.scene.add(this.smokePoints);
  }

  _initAmbientParticles() {
    this.ambientGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.ambientCount * 3);
    for (let i = 0; i < this.ambientCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 38;
      pos[i * 3 + 1] = 0.6 + Math.random() * 9;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 44;
    }
    this.ambientGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffe47a,
      size: 0.22,
      map: this.circleTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.ambientPoints = new THREE.Points(this.ambientGeo, mat);
    this.scene.add(this.ambientPoints);
  }

  /**
   * Sóng âm mõ gỗ lan tỏa
   */
  triggerWoodenFishRing(position) {
    const ringGeo = new THREE.RingGeometry(0.12, 0.22, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(position || new THREE.Vector3(3.8, 1.98, -8.8));
    this.scene.add(ring);

    gsap.to(ring.scale, { x: 3.5, y: 3.5, z: 3.5, duration: 0.45, ease: 'power2.out' });
    gsap.to(ringMat, {
      opacity: 0,
      duration: 0.45,
      ease: 'power2.out',
      onComplete: () => {
        this.scene.remove(ring);
        ringGeo.dispose();
        ringMat.dispose();
      }
    });
  }

  /**
   * Pháo hoa giấy vàng kim cúng dường (100 xu)
   */
  triggerConfetti() {
    const count = 90;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vels = [];

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 1] = 3.5 + Math.random() * 2;
      pos[i * 3 + 2] = 5 + (Math.random() - 0.5) * 6;
      vels.push({
        vx: (Math.random() - 0.5) * 4,
        vy: 3 + Math.random() * 4,
        vz: (Math.random() - 0.5) * 4
      });
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffe066,
      size: 0.28,
      transparent: true,
      opacity: 1
    });
    const pts = new THREE.Points(geo, mat);
    this.scene.add(pts);

    gsap.to(mat, {
      opacity: 0,
      duration: 2.5,
      ease: 'power2.out',
      onComplete: () => {
        this.scene.remove(pts);
        geo.dispose();
        mat.dispose();
      }
    });
  }

  /**
   * Phật Quang Phổ Chiếu (Hào quang Kim Thân bừng sáng + Mưa sen vàng)
   */
  triggerBuddhaLight(buddhaLight, halo) {
    if (buddhaLight) {
      gsap.fromTo(buddhaLight, { intensity: 5.5 }, { intensity: 2.2, duration: 4.0, ease: 'power2.out' });
    }
    if (halo) {
      gsap.fromTo(halo.scale, { x: 2.2, y: 2.2, z: 2.2 }, { x: 1, y: 1, z: 1, duration: 3.5, ease: 'elastic.out(1, 0.4)' });
    }
  }

  update(dt, elapsed) {
    // 1. Cập nhật khói hương
    if (this.smokeGeo) {
      const pos = this.smokeGeo.attributes.position.array;
      for (let i = 0; i < this.smokeCount; i++) {
        pos[i * 3 + 1] += dt * 0.82;
        pos[i * 3 + 0] += Math.sin(elapsed * 1.5 + i) * 0.004;
        if (pos[i * 3 + 1] > 6.8) {
          pos[i * 3 + 0] = (Math.random() - 0.5) * 0.8;
          pos[i * 3 + 1] = 2.1;
          pos[i * 3 + 2] = 5.0 + (Math.random() - 0.5) * 0.8;
        }
      }
      this.smokeGeo.attributes.position.needsUpdate = true;
    }

    // 2. Cập nhật đom đóm vàng
    if (this.ambientGeo) {
      const aPos = this.ambientGeo.attributes.position.array;
      for (let i = 0; i < this.ambientCount; i++) {
        aPos[i * 3 + 1] -= dt * 0.28;
        aPos[i * 3 + 0] += Math.sin(elapsed + i) * 0.006;
        if (aPos[i * 3 + 1] < 0.3) aPos[i * 3 + 1] = 8.5;
      }
      this.ambientGeo.attributes.position.needsUpdate = true;
    }
  }

  destroy() {
    if (this.smokePoints) {
      this.scene.remove(this.smokePoints);
      disposeHierarchy(this.smokePoints);
    }
    if (this.ambientPoints) {
      this.scene.remove(this.ambientPoints);
      disposeHierarchy(this.ambientPoints);
    }
    if (this.circleTex) this.circleTex.dispose();
  }
}

/**
 * VFX Manager — Đại Hùng Bảo Điện Chùa An Lạc
 * Quản lý Khói hương nghi ngút từ lư đồng, Bụi vàng lơ lửng, Sóng âm mõ,
 * Chữ "+1 Công Đức" bay lên, Pháo hoa giấy vàng kim và Phật Quang bừng sáng.
 */

import * as THREE from 'three';
import gsap from 'gsap';

export function disposeHierarchy(obj) {
  if (!obj) return;
  obj.traverse((child) => {
    if (child.isMesh || child.isPoints || child.isSprite) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((mat) => mat.dispose());
        else child.material.dispose();
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

function createMeritTextTexture(text = '+1 Công Đức') {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 10;
  ctx.fillStyle = '#fff8cc';
  ctx.font = 'bold 30px "Segoe UI", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 32);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

export class VfxManager {
  constructor(scene) {
    this.scene = scene;
    this.circleTex = createCircleTexture();

    // 1. Khói hương lư đồng chánh điện
    this.smokePoints = null;
    this.smokePositions = null;
    this.smokeCount = 80;
    this.smokeOrigin = new THREE.Vector3(0, 0.8, -4.5);
    this.smokeIntensity = 1.0;

    // 2. Bụi vàng không gian Chánh Điện
    this.dustPoints = null;
    this.dustPositions = null;
    this.dustCount = 130;

    this._initSmoke();
    this._initDust();
  }

  _initSmoke() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.smokeCount * 3);
    this.smokeVels = [];

    for (let i = 0; i < this.smokeCount; i++) {
      pos[i * 3 + 0] = this.smokeOrigin.x + (Math.random() - 0.5) * 0.35;
      pos[i * 3 + 1] = this.smokeOrigin.y + Math.random() * 2.5;
      pos[i * 3 + 2] = this.smokeOrigin.z + (Math.random() - 0.5) * 0.35;

      this.smokeVels.push({
        vy: 0.16 + Math.random() * 0.18,
        phase: Math.random() * Math.PI * 2
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.smokePositions = geo.attributes.position;

    const mat = new THREE.PointsMaterial({
      color: 0xe0d6cc,
      size: 0.35,
      map: this.circleTex,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });

    this.smokePoints = new THREE.Points(geo, mat);
    this.scene.add(this.smokePoints);
  }

  _initDust() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.dustCount * 3);
    this.dustSpeeds = [];

    for (let i = 0; i < this.dustCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = -0.5 + Math.random() * 9;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;

      this.dustSpeeds.push({
        vy: 0.04 + Math.random() * 0.05,
        phase: Math.random() * Math.PI * 2
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.dustPositions = geo.attributes.position;

    const mat = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.14,
      map: this.circleTex,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.dustPoints = new THREE.Points(geo, mat);
    this.scene.add(this.dustPoints);
  }

  triggerWoodenFishVfx(position, merit = 1) {
    if (!position) return;

    // Vòng sóng âm vàng kim lan rộng
    const ringGeo = new THREE.RingGeometry(0.12, 0.22, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd700, side: THREE.DoubleSide, transparent: true, opacity: 0.95 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(position);
    ring.position.y += 0.05;
    this.scene.add(ring);

    gsap.to(ring.scale, { x: 3.2, y: 3.2, z: 3.2, duration: 0.45, ease: 'power2.out' });
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

    // Chữ +Công Đức bay lên
    const textLabel = merit > 1 ? `+${merit} Công Đức` : '+1 Công Đức';
    const textTex = createMeritTextTexture(textLabel);
    const spriteMat = new THREE.SpriteMaterial({ map: textTex, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.7, 0.2, 1);
    sprite.position.set(position.x, position.y + 0.4, position.z);
    this.scene.add(sprite);

    gsap.to(sprite.position, { y: position.y + 1.2, duration: 0.85, ease: 'power1.out' });
    gsap.to(spriteMat, {
      opacity: 0,
      duration: 0.85,
      delay: 0.2,
      onComplete: () => {
        this.scene.remove(sprite);
        textTex.dispose();
        spriteMat.dispose();
      }
    });
  }

  boostSmoke() {
    this.smokeIntensity = 2.5;
    gsap.to(this, { smokeIntensity: 1.0, duration: 6.0, ease: 'power2.in' });
  }

  triggerConfetti() {
    const count = 90;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = 2.5 + Math.random() * 4;
      pos[i * 3 + 2] = -3 + (Math.random() - 0.5) * 8;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffea70, size: 0.28, transparent: true, opacity: 1 });
    const pts = new THREE.Points(geo, mat);
    this.scene.add(pts);

    gsap.to(mat, {
      opacity: 0,
      duration: 2.2,
      ease: 'power2.out',
      onComplete: () => {
        this.scene.remove(pts);
        geo.dispose();
        mat.dispose();
      }
    });
  }

  triggerBuddhaLight(buddhaLight, haloGroup) {
    if (buddhaLight) {
      gsap.fromTo(buddhaLight, { intensity: 6.0 }, { intensity: 2.5, duration: 3.5, ease: 'power2.out' });
    }
    if (haloGroup) {
      gsap.fromTo(haloGroup.scale, { x: 2.0, y: 2.0, z: 2.0 }, { x: 1, y: 1, z: 1, duration: 3.0, ease: 'elastic.out(1, 0.4)' });
    }
  }

  update(dt, elapsed) {
    if (this.smokePositions && this.smokeVels) {
      const pos = this.smokePositions.array;
      for (let i = 0; i < this.smokeCount; i++) {
        const vel = this.smokeVels[i];
        const idx = i * 3;
        pos[idx + 1] += vel.vy * dt * this.smokeIntensity;
        pos[idx + 0] += Math.sin(elapsed * 1.6 + vel.phase) * 0.003;
        pos[idx + 2] += Math.cos(elapsed * 1.3 + vel.phase) * 0.002;
        if (pos[idx + 1] > 4.8) {
          pos[idx + 0] = this.smokeOrigin.x + (Math.random() - 0.5) * 0.35;
          pos[idx + 1] = this.smokeOrigin.y + (Math.random() - 0.5) * 0.1;
          pos[idx + 2] = this.smokeOrigin.z + (Math.random() - 0.5) * 0.35;
        }
      }
      this.smokePositions.needsUpdate = true;
    }

    if (this.dustPositions && this.dustSpeeds) {
      const pos = this.dustPositions.array;
      for (let i = 0; i < this.dustCount; i++) {
        const sp = this.dustSpeeds[i];
        const idx = i * 3;
        pos[idx + 1] += sp.vy * dt;
        pos[idx + 0] += Math.sin(elapsed * 0.8 + sp.phase) * 0.002;
        if (pos[idx + 1] > 8.0) pos[idx + 1] = -0.5;
      }
      this.dustPositions.needsUpdate = true;
    }
  }

  destroy() {
    if (this.smokePoints) {
      this.scene.remove(this.smokePoints);
      disposeHierarchy(this.smokePoints);
    }
    if (this.dustPoints) {
      this.scene.remove(this.dustPoints);
      disposeHierarchy(this.dustPoints);
    }
    if (this.circleTex) this.circleTex.dispose();
  }
}

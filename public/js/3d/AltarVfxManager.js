/**
 * AltarVfxManager.js - Quản lý Hiệu Ứng Hào Quang, Khói Hương & Lư Hương Bùng Sáng
 * Tuân thủ chuẩn CONTRACT.md & Role 02
 */

import * as THREE from 'three';

export class AltarVfxManager {
  constructor(scene, altarPosition) {
    this.scene = scene;
    this.altarPosition = altarPosition || new THREE.Vector3(0, 1.7, -1.8);

    // Hệ thống hạt khói hương bốc lên từ lư đồng
    this.smokeParticleCount = 120;
    this.smokePoints = null;
    this.smokePositions = null;
    this.smokeVelocities = [];

    // Hệ thống hạt hào quang vàng kim khi dâng hương
    this.burstParticleCount = 80;
    this.burstPoints = null;
    this.burstPositions = null;
    this.burstVelocities = [];
    this.isBurstActive = false;
    this.burstTimer = 0;

    // 3 nén nhang cắm trên lư hương
    this.incenseSticksGroup = new THREE.Group();
    this.scene.add(this.incenseSticksGroup);

    this.init();
  }

  init() {
    this.buildSmokeParticles();
    this.buildBurstParticles();
    this.buildIncenseSticks();
  }

  /**
   * Tạo các hạt khói hương bay lên từ bát lư đồng
   */
  buildSmokeParticles() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.smokeParticleCount * 3);

    for (let i = 0; i < this.smokeParticleCount; i++) {
      // Vị trí xuất phát từ miệng bát hương
      positions[i * 3 + 0] = this.altarPosition.x + (Math.random() - 0.5) * 0.25;
      positions[i * 3 + 1] = this.altarPosition.y + 0.2 + Math.random() * 2.5;
      positions[i * 3 + 2] = this.altarPosition.z + (Math.random() - 0.5) * 0.25;

      this.smokeVelocities.push({
        vy: 0.008 + Math.random() * 0.008,
        vx: (Math.random() - 0.5) * 0.003,
        vz: (Math.random() - 0.5) * 0.003,
        life: Math.random()
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.smokePositions = positions;

    // Vẽ texture hạt khói mềm mại bằng canvas
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, 'rgba(240, 230, 210, 0.6)');
    grad.addColorStop(0.5, 'rgba(200, 190, 180, 0.2)');
    grad.addColorStop(1, 'rgba(200, 190, 180, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const smokeTex = new THREE.CanvasTexture(canvas);

    const mat = new THREE.PointsMaterial({
      size: 0.25,
      map: smokeTex,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    this.smokePoints = new THREE.Points(geo, mat);
    this.scene.add(this.smokePoints);
  }

  /**
   * Tạo 3 nén nhang phát sáng cắm vào lư đồng
   */
  buildIncenseSticks() {
    this.incenseSticksGroup.position.copy(this.altarPosition);
    this.incenseSticksGroup.position.y += 0.2;

    const stickMat = new THREE.MeshBasicMaterial({ color: 0x992222 }); // Tăm nhang đỏ
    const emberMat = new THREE.MeshBasicMaterial({ color: 0xff4500 }); // Đốm than đỏ hồng

    const stickGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.45, 6);
    const emberGeo = new THREE.SphereGeometry(0.015, 6, 6);

    const offsets = [
      { x: 0, z: 0, tilt: 0 },
      { x: -0.06, z: 0.02, tilt: -0.08 },
      { x: 0.06, z: 0.02, tilt: 0.08 }
    ];

    offsets.forEach((off) => {
      const stick = new THREE.Mesh(stickGeo, stickMat);
      stick.position.set(off.x, 0.22, off.z);
      stick.rotation.z = off.tilt;

      const ember = new THREE.Mesh(emberGeo, emberMat);
      ember.position.set(off.x, 0.45, off.z);

      this.incenseSticksGroup.add(stick);
      this.incenseSticksGroup.add(ember);
    });
  }

  /**
   * Tạo hệ thống hạt bùng sáng hào quang vàng khi dâng hương
   */
  buildBurstParticles() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.burstParticleCount * 3);

    for (let i = 0; i < this.burstParticleCount; i++) {
      positions[i * 3 + 0] = this.altarPosition.x;
      positions[i * 3 + 1] = this.altarPosition.y + 0.3;
      positions[i * 3 + 2] = this.altarPosition.z;

      this.burstVelocities.push({
        vx: (Math.random() - 0.5) * 0.05,
        vy: 0.02 + Math.random() * 0.06,
        vz: (Math.random() - 0.5) * 0.05,
        alpha: 0
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.burstPositions = positions;

    // Hạt ánh sáng vàng kim lấp lánh
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 28);
    grad.addColorStop(0, 'rgba(255, 235, 120, 1.0)');
    grad.addColorStop(0.4, 'rgba(255, 180, 50, 0.8)');
    grad.addColorStop(1, 'rgba(255, 150, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const burstTex = new THREE.CanvasTexture(canvas);

    const mat = new THREE.PointsMaterial({
      size: 0.35,
      map: burstTex,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.burstPoints = new THREE.Points(geo, mat);
    this.scene.add(this.burstPoints);
  }

  /**
   * Kích hoạt hiệu ứng Lư Hương Bùng Sáng khi nhân vật Solo quỳ lạy
   */
  triggerAltarBurst() {
    this.isBurstActive = true;
    this.burstTimer = 2.4; // Tỏa sáng trong 2.4s

    // Reset lại vị trí các hạt vàng tỏa ra từ bát hương
    for (let i = 0; i < this.burstParticleCount; i++) {
      this.burstPositions[i * 3 + 0] = this.altarPosition.x + (Math.random() - 0.5) * 0.2;
      this.burstPositions[i * 3 + 1] = this.altarPosition.y + 0.3;
      this.burstPositions[i * 3 + 2] = this.altarPosition.z + (Math.random() - 0.5) * 0.2;

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.015 + Math.random() * 0.035;
      this.burstVelocities[i] = {
        vx: Math.cos(angle) * speed,
        vy: 0.02 + Math.random() * 0.04,
        vz: Math.sin(angle) * speed,
        alpha: 1.0
      };
    }

    if (this.burstPoints && this.burstPoints.material) {
      this.burstPoints.material.opacity = 0.95;
    }
  }

  /**
   * Cập nhật chuyển động hạt mỗi frame
   */
  update(delta) {
    // 1. Cập nhật khói hương bay uốn lượn
    if (this.smokePositions && this.smokePoints) {
      for (let i = 0; i < this.smokeParticleCount; i++) {
        const vel = this.smokeVelocities[i];
        this.smokePositions[i * 3 + 1] += vel.vy;
        this.smokePositions[i * 3 + 0] += Math.sin(this.smokePositions[i * 3 + 1] * 4) * 0.002;

        // Reset hạt khi bay quá cao
        if (this.smokePositions[i * 3 + 1] > this.altarPosition.y + 3.2) {
          this.smokePositions[i * 3 + 0] = this.altarPosition.x + (Math.random() - 0.5) * 0.2;
          this.smokePositions[i * 3 + 1] = this.altarPosition.y + 0.2;
          this.smokePositions[i * 3 + 2] = this.altarPosition.z + (Math.random() - 0.5) * 0.2;
        }
      }
      this.smokePoints.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Cập nhật hạt bùng sáng hào quang vàng khi có Solo dâng hương
    if (this.isBurstActive && this.burstPositions && this.burstPoints) {
      this.burstTimer -= delta;
      for (let i = 0; i < this.burstParticleCount; i++) {
        const vel = this.burstVelocities[i];
        this.burstPositions[i * 3 + 0] += vel.vx;
        this.burstPositions[i * 3 + 1] += vel.vy;
        this.burstPositions[i * 3 + 2] += vel.vz;
      }
      this.burstPoints.geometry.attributes.position.needsUpdate = true;

      if (this.burstTimer <= 0) {
        this.isBurstActive = false;
        this.burstPoints.material.opacity = 0;
      } else if (this.burstTimer < 0.6) {
        this.burstPoints.material.opacity = this.burstTimer / 0.6;
      }
    }
  }
}

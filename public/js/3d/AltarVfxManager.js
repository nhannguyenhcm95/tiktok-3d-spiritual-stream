/**
 * AltarVfxManager.js - Quản lý Khói Hương Lư Đồng, Hào Quang Bùng Sáng & Hạt Kim Tuyến
 * Khớp chuẩn tọa độ bàn thờ Chánh Điện mới (0, 1.48, -2.8)
 */

import * as THREE from 'three';

export class AltarVfxManager {
  constructor(scene, altarPosition) {
    this.scene = scene;
    this.altarPosition = altarPosition || new THREE.Vector3(0, 1.48, -2.8);

    // Hệ thống hạt khói hương bốc lên từ lư đồng
    this.smokeCount = 100;
    this.smokePoints = null;
    this.smokePositions = null;
    this.smokeVelocities = [];

    // Hào quang bùng sáng khi dâng hương
    this.burstCount = 90;
    this.burstPoints = null;
    this.burstPositions = null;
    this.burstVelocities = [];
    this.isBurstActive = false;
    this.burstTimer = 0;

    this.init();
  }

  init() {
    this.buildIncenseSmoke();
    this.buildAltarBurstParticles();
  }

  /**
   * Tạo hạt khói hương bay lên từ miệng bát lư đồng
   */
  buildIncenseSmoke() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.smokeCount * 3);

    for (let i = 0; i < this.smokeCount; i++) {
      positions[i * 3 + 0] = this.altarPosition.x + (Math.random() - 0.5) * 0.22;
      positions[i * 3 + 1] = this.altarPosition.y + 0.3 + Math.random() * 2.8;
      positions[i * 3 + 2] = this.altarPosition.z + 0.4 + (Math.random() - 0.5) * 0.22;

      this.smokeVelocities.push({
        vy: 0.007 + Math.random() * 0.008,
        drift: (Math.random() - 0.5) * 0.003
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.smokePositions = positions;

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, 'rgba(240, 235, 225, 0.55)');
    grad.addColorStop(0.5, 'rgba(210, 205, 195, 0.2)');
    grad.addColorStop(1, 'rgba(210, 205, 195, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const mat = new THREE.PointsMaterial({
      size: 0.26,
      map: new THREE.CanvasTexture(canvas),
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });

    this.smokePoints = new THREE.Points(geo, mat);
    this.scene.add(this.smokePoints);
  }

  /**
   * Tạo hạt bùng sáng hào quang vàng kim khi dâng hương
   */
  buildAltarBurstParticles() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.burstCount * 3);

    for (let i = 0; i < this.burstCount; i++) {
      positions[i * 3 + 0] = this.altarPosition.x;
      positions[i * 3 + 1] = this.altarPosition.y + 0.4;
      positions[i * 3 + 2] = this.altarPosition.z + 0.4;

      this.burstVelocities.push({
        vx: 0,
        vy: 0,
        vz: 0
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.burstPositions = positions;

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 28);
    grad.addColorStop(0, 'rgba(255, 235, 120, 1.0)');
    grad.addColorStop(0.4, 'rgba(245, 197, 66, 0.85)');
    grad.addColorStop(1, 'rgba(245, 197, 66, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const mat = new THREE.PointsMaterial({
      size: 0.4,
      map: new THREE.CanvasTexture(canvas),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.burstPoints = new THREE.Points(geo, mat);
    this.scene.add(this.burstPoints);
  }

  /**
   * Kích hoạt hiệu ứng bùng sáng khi nhân vật Solo quỳ lạy trước lư hương
   */
  triggerAltarBurst() {
    this.isBurstActive = true;
    this.burstTimer = 2.4;

    for (let i = 0; i < this.burstCount; i++) {
      this.burstPositions[i * 3 + 0] = this.altarPosition.x;
      this.burstPositions[i * 3 + 1] = this.altarPosition.y + 0.4;
      this.burstPositions[i * 3 + 2] = this.altarPosition.z + 0.4;

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.02 + Math.random() * 0.04;
      this.burstVelocities[i] = {
        vx: Math.cos(angle) * speed,
        vy: 0.025 + Math.random() * 0.045,
        vz: Math.sin(angle) * speed
      };
    }

    if (this.burstPoints && this.burstPoints.material) {
      this.burstPoints.material.opacity = 0.95;
    }
  }

  update(delta) {
    // 1. Cập nhật khói hương
    if (this.smokePositions && this.smokePoints) {
      for (let i = 0; i < this.smokeCount; i++) {
        const vel = this.smokeVelocities[i];
        this.smokePositions[i * 3 + 1] += vel.vy;
        this.smokePositions[i * 3 + 0] += Math.sin(this.smokePositions[i * 3 + 1] * 3.5) * 0.002;

        if (this.smokePositions[i * 3 + 1] > this.altarPosition.y + 3.5) {
          this.smokePositions[i * 3 + 0] = this.altarPosition.x + (Math.random() - 0.5) * 0.22;
          this.smokePositions[i * 3 + 1] = this.altarPosition.y + 0.3;
          this.smokePositions[i * 3 + 2] = this.altarPosition.z + 0.4 + (Math.random() - 0.5) * 0.22;
        }
      }
      this.smokePoints.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Cập nhật hạt bùng sáng
    if (this.isBurstActive && this.burstPositions && this.burstPoints) {
      this.burstTimer -= delta;
      for (let i = 0; i < this.burstCount; i++) {
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

/**
 * AltarVfxManager.js - Quản lý Hiệu Ứng Tia Nắng Điện Ảnh (God Rays),
 * Bụi Nắng Lung Linh, Khói Trầm Hương & Hào Quang Bùng Sáng
 * Tuân thủ chuẩn GRAPHICS_ANTIGRAVITY_SPEC.md
 */

import * as THREE from 'three';

export class AltarVfxManager {
  constructor(scene, altarPosition) {
    this.scene = scene;
    this.altarPosition = altarPosition || new THREE.Vector3(0, 1.6, -7.8);

    // 1. Hệ thống Luồng Tia Nắng Chiếu Xiên (Volumetric God Rays)
    this.godRaysGroup = new THREE.Group();
    this.scene.add(this.godRaysGroup);

    // 2. Hệ thống Hạt Bụi Nắng (Sun Motes)
    this.moteCount = 100;
    this.motePoints = null;
    this.motePositions = null;
    this.moteVelocities = [];

    // 3. Hệ thống Khói Trầm Hương uốn lượn
    this.smokeCount = 80;
    this.smokePoints = null;
    this.smokePositions = null;
    this.smokeVelocities = [];

    // 4. Hào quang bùng sáng khi Dâng Hương
    this.burstCount = 90;
    this.burstPoints = null;
    this.burstPositions = null;
    this.burstVelocities = [];
    this.isBurstActive = false;
    this.burstTimer = 0;

    this.init();
  }

  init() {
    this.buildCinematicGodRays();
    this.buildSunMotes();
    this.buildIncenseSmoke();
    this.buildAltarBurstParticles();
  }

  /**
   * Tạo Các Dải Tia Sáng Xiên (Volumetric God Rays / Light Shafts)
   * Chiếu từ hàng cột bên phải (x = 11.5) xiên xuống sàn đá
   */
  buildCinematicGodRays() {
    // Vẽ texture dải nắng gradient mềm mại
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 256, 512);
    grad.addColorStop(0, 'rgba(255, 241, 208, 0.45)');
    grad.addColorStop(0.3, 'rgba(255, 235, 180, 0.25)');
    grad.addColorStop(0.7, 'rgba(255, 220, 150, 0.1)');
    grad.addColorStop(1, 'rgba(255, 220, 150, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 512);

    const rayTex = new THREE.CanvasTexture(canvas);

    const rayMat = new THREE.MeshBasicMaterial({
      map: rayTex,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    // 3 Dải sáng lớn chiếu qua các khe cột bên phải
    const rayZPositions = [-4.0, 0.5, 5.0];
    rayZPositions.forEach((rz) => {
      const rayGeo = new THREE.PlaneGeometry(8, 24);
      const rayMesh = new THREE.Mesh(rayGeo, rayMat);
      rayMesh.position.set(7.5, 8.5, rz);
      // Nghiêng theo phương ánh nắng chiều
      rayMesh.rotation.y = 0.35;
      rayMesh.rotation.z = 0.68;
      this.godRaysGroup.add(rayMesh);
    });
  }

  /**
   * Hạt Bụi Nắng Vàng Lơ Lửng Trong Không Gian (Sun Motes)
   */
  buildSunMotes() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.moteCount * 3);

    for (let i = 0; i < this.moteCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = 0.5 + Math.random() * 8.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

      this.moteVelocities.push({
        vx: (Math.random() - 0.5) * 0.003,
        vy: (Math.random() - 0.5) * 0.003,
        vz: (Math.random() - 0.5) * 0.003
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.motePositions = positions;

    // Texture bụi sáng
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 14);
    grad.addColorStop(0, 'rgba(255, 245, 210, 0.95)');
    grad.addColorStop(0.5, 'rgba(255, 225, 160, 0.4)');
    grad.addColorStop(1, 'rgba(255, 225, 160, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const mat = new THREE.PointsMaterial({
      size: 0.18,
      map: new THREE.CanvasTexture(canvas),
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.motePoints = new THREE.Points(geo, mat);
    this.scene.add(this.motePoints);
  }

  /**
   * Khói Trầm Hương Bay Lên Từ Lư Đồng
   */
  buildIncenseSmoke() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.smokeCount * 3);

    for (let i = 0; i < this.smokeCount; i++) {
      positions[i * 3 + 0] = this.altarPosition.x + (Math.random() - 0.5) * 0.25;
      positions[i * 3 + 1] = this.altarPosition.y + 0.3 + Math.random() * 2.8;
      positions[i * 3 + 2] = this.altarPosition.z + 0.4 + (Math.random() - 0.5) * 0.25;

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
    grad.addColorStop(0, 'rgba(235, 230, 220, 0.5)');
    grad.addColorStop(0.5, 'rgba(200, 195, 185, 0.18)');
    grad.addColorStop(1, 'rgba(200, 195, 185, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const mat = new THREE.PointsMaterial({
      size: 0.28,
      map: new THREE.CanvasTexture(canvas),
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });

    this.smokePoints = new THREE.Points(geo, mat);
    this.scene.add(this.smokePoints);
  }

  /**
   * Hào Quang Vàng Kim Bùng Sáng Khi Dâng Hương
   */
  buildAltarBurstParticles() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.burstCount * 3);

    for (let i = 0; i < this.burstCount; i++) {
      positions[i * 3 + 0] = this.altarPosition.x;
      positions[i * 3 + 1] = this.altarPosition.y + 0.5;
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
    grad.addColorStop(0.4, 'rgba(217, 155, 38, 0.85)');
    grad.addColorStop(1, 'rgba(217, 155, 38, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const mat = new THREE.PointsMaterial({
      size: 0.45,
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
   * Kích hoạt bùng sáng hào quang khi dâng hương
   */
  triggerAltarBurst() {
    this.isBurstActive = true;
    this.burstTimer = 2.5;

    for (let i = 0; i < this.burstCount; i++) {
      this.burstPositions[i * 3 + 0] = this.altarPosition.x;
      this.burstPositions[i * 3 + 1] = this.altarPosition.y + 0.5;
      this.burstPositions[i * 3 + 2] = this.altarPosition.z + 0.4;

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.02 + Math.random() * 0.045;
      this.burstVelocities[i] = {
        vx: Math.cos(angle) * speed,
        vy: 0.02 + Math.random() * 0.05,
        vz: Math.sin(angle) * speed
      };
    }

    if (this.burstPoints && this.burstPoints.material) {
      this.burstPoints.material.opacity = 0.95;
    }
  }

  update(delta) {
    // 1. Cập nhật bụi nắng lơ lửng
    if (this.motePositions && this.motePoints) {
      for (let i = 0; i < this.moteCount; i++) {
        const vel = this.moteVelocities[i];
        this.motePositions[i * 3 + 0] += vel.vx;
        this.motePositions[i * 3 + 1] += vel.vy;
        this.motePositions[i * 3 + 2] += vel.vz;

        if (this.motePositions[i * 3 + 1] > 9.0) this.motePositions[i * 3 + 1] = 0.5;
        if (this.motePositions[i * 3 + 1] < 0.5) this.motePositions[i * 3 + 1] = 9.0;
      }
      this.motePoints.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Cập nhật khói hương
    if (this.smokePositions && this.smokePoints) {
      for (let i = 0; i < this.smokeCount; i++) {
        const vel = this.smokeVelocities[i];
        this.smokePositions[i * 3 + 1] += vel.vy;
        this.smokePositions[i * 3 + 0] += Math.sin(this.smokePositions[i * 3 + 1] * 3.5) * 0.002;

        if (this.smokePositions[i * 3 + 1] > this.altarPosition.y + 3.8) {
          this.smokePositions[i * 3 + 0] = this.altarPosition.x + (Math.random() - 0.5) * 0.25;
          this.smokePositions[i * 3 + 1] = this.altarPosition.y + 0.3;
          this.smokePositions[i * 3 + 2] = this.altarPosition.z + 0.4 + (Math.random() - 0.5) * 0.25;
        }
      }
      this.smokePoints.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Cập nhật hạt bùng sáng
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

/**
 * EnvironmentVfx.js — Hiệu ứng Môi Trường Sống Động
 * - Chu kỳ Hoàng hôn sang Đêm trăng thanh tịnh
 * - Khói hương nghi ngút uốn lượn
 * - Đom đóm & Bụi vàng tâm linh
 * - "Bộ Bộ Sinh Liên": Mỗi bước chân nở hoa sen vàng phát sáng
 * - Linh quang Đàn Tràng Siêu Độ & Cột sáng Phật Quang
 * - Sóng xung kích linh quang (Shockwave Ring) khi Kết Ấn
 */

import * as THREE from 'three';

const gsap = (typeof window !== 'undefined' && window.gsap) ? window.gsap : { to: (t, p) => { if(p && p.onComplete) p.onComplete(); }, killTweensOf: () => {} };

export class EnvironmentVfx {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    // Quản lý đài sen dưới chân
    this.activeLotuses = [];
    this.lotusPool = [];

    // Linh quang Đàn Tràng Siêu Độ
    this.spiritOrbs = [];
    this.spiritGroup = new THREE.Group();
    this.scene.add(this.spiritGroup);

    // Hệ thống hạt khói hương
    this.smokePoints = null;
    this.smokePositions = [];
    this.smokeLifetimes = [];
    this.smokeOrigin = new THREE.Vector3(0, 1.2, 0); // Lư hương giữa sân

    // Đom đóm & bụi vàng
    this.fireflies = null;

    // Cột sáng siêu độ
    this.beamMesh = null;

    this._initSmoke();
    this._initFireflies();
    this._initSpiritOrbs();
    this._initAscensionBeam();
  }

  _initSmoke() {
    const count = 140;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const alphas = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 1] = Math.random() * 4.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
      this.smokeLifetimes.push(Math.random());
      alphas[i] = Math.random() * 0.45;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    // Canvas hạt khói mờ
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(240, 235, 225, 0.9)');
    grad.addColorStop(0.4, 'rgba(200, 190, 180, 0.4)');
    grad.addColorStop(1, 'rgba(200, 190, 180, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(canvas);

    const mat = new THREE.PointsMaterial({
      size: 0.85,
      map: tex,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    this.smokePoints = new THREE.Points(geo, mat);
    this.smokePoints.position.set(0, 1.35, 0); // Đặt trên miệng Lư Hương giữa sân
    this.scene.add(this.smokePoints);
  }

  _initFireflies() {
    const count = 130;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 65;
      pos[i * 3 + 1] = 0.5 + Math.random() * 4.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 65;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 235, 120, 1)');
    grad.addColorStop(0.3, 'rgba(255, 215, 0, 0.6)');
    grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    const tex = new THREE.CanvasTexture(canvas);

    const mat = new THREE.PointsMaterial({
      size: 0.6,
      map: tex,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.fireflies = new THREE.Points(geo, mat);
    this.scene.add(this.fireflies);
  }

  /**
   * Khởi tạo 18 đốm linh quang u uất quanh Đàn Tràng Siêu Độ (Tọa độ X: -18, Z: -18)
   */
  _initSpiritOrbs() {
    const center = new THREE.Vector3(-18, 0.8, -18);
    const orbGeo = new THREE.SphereGeometry(0.18, 12, 12);

    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const dist = 1.8 + Math.random() * 3.5;
      const mat = new THREE.MeshBasicMaterial({
        color: 0x4a758c, // Màu xanh lam tím mờ u tối lúc chưa siêu độ
        transparent: true,
        opacity: 0.7
      });

      const orb = new THREE.Mesh(orbGeo, mat);
      orb.position.set(
        center.x + Math.cos(angle) * dist,
        center.y + Math.random() * 1.5,
        center.z + Math.sin(angle) * dist
      );

      const light = new THREE.PointLight(0x4a758c, 0.8, 3.5);
      orb.add(light);

      this.spiritOrbs.push({
        mesh: orb,
        light,
        basePos: orb.position.clone(),
        phase: Math.random() * Math.PI * 2,
        isPurified: false
      });
      this.spiritGroup.add(orb);
    }
  }

  /**
   * Cột sáng Phật Quang từ trời chiếu xuống Đàn Tràng Siêu Độ
   */
  _initAscensionBeam() {
    const beamGeo = new THREE.CylinderGeometry(2.4, 3.5, 36, 24, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffdf70,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.beamMesh = new THREE.Mesh(beamGeo, beamMat);
    this.beamMesh.position.set(-18, 18, -18);
    this.scene.add(this.beamMesh);
  }

  /**
   * "Bộ Bộ Sinh Liên" — Mỗi bước chân nở đóa sen vàng phát sáng
   */
  spawnLotusStep(x, z) {
    this.spawnFootprintLotus({ x, z });
  }

  spawnFootprintLotus(pos) {
    let lotus = this.lotusPool.pop();
    if (!lotus) {
      lotus = this._createLotusMesh();
    }

    lotus.position.set(pos.x, 0.04, pos.z);
    lotus.scale.set(0.1, 0.1, 0.1);
    lotus.rotation.y = Math.random() * Math.PI * 2;
    lotus.visible = true;
    this.scene.add(lotus);
    this.activeLotuses.push({ mesh: lotus, life: 1.0 });

    // Hiệu ứng búp sen nở xòe cánh rồi phát sáng
    gsap.to(lotus.scale, { x: 1, y: 1, z: 1, duration: 0.35, ease: 'back.out(1.8)' });
  }

  _createLotusMesh() {
    const group = new THREE.Group();
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xffd54f,
      emissive: 0xffa000,
      emissiveIntensity: 0.6,
      roughness: 0.3
    });
    const centerMat = new THREE.MeshBasicMaterial({ color: 0xfff9c4 });

    // Nhụy sen
    const center = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.05, 8), centerMat);
    group.add(center);

    // 8 Cánh hoa sen vàng
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 5), petalMat);
      petal.position.set(Math.cos(angle) * 0.1, 0.04, Math.sin(angle) * 0.1);
      petal.rotation.y = angle;
      petal.rotation.z = -0.45;
      group.add(petal);
    }

    const light = new THREE.PointLight(0xffb300, 0.9, 1.8);
    light.position.y = 0.15;
    group.add(light);

    return group;
  }

  /**
   * Siêu Độ Linh Quang — Tịnh hóa các đốm u uất thành hoa sen vàng bay lên mây trời
   */
  purifyLinhQuang() {
    // 1. Cột sáng Phật Quang bừng chiếu
    gsap.killTweensOf(this.beamMesh.material);
    gsap.to(this.beamMesh.material, { opacity: 0.65, duration: 0.5, ease: 'power2.out', yoyo: true, repeat: 1 });

    // 2. Từng đốm linh quang đổi sang vàng kim rực rỡ và bay vút lên trời
    this.spiritOrbs.forEach((item, idx) => {
      setTimeout(() => {
        item.isPurified = true;
        item.mesh.material.color.setHex(0xffeb3b);
        item.light.color.setHex(0xffd700);
        item.light.intensity = 2.5;

        gsap.to(item.mesh.position, {
          y: 28,
          x: item.mesh.position.x + (Math.random() - 0.5) * 4,
          z: item.mesh.position.z + (Math.random() - 0.5) * 4,
          duration: 3.2,
          ease: 'power2.in',
          onComplete: () => {
            // Hồi sinh đốm linh quang mới sau 6 giây
            setTimeout(() => {
              item.mesh.position.copy(item.basePos);
              item.mesh.material.color.setHex(0x4a758c);
              item.light.color.setHex(0x4a758c);
              item.light.intensity = 0.8;
              item.isPurified = false;
            }, 6000);
          }
        });
      }, idx * 80);
    });
  }

  /**
   * Sóng xung kích Linh Quang (Shockwave Ring) quét rộng mặt sân khi Kết Ấn
   */
  triggerShockwave(pos) {
    const ringGeo = new THREE.RingGeometry(0.2, 0.8, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, 0.08, pos.z);
    this.scene.add(ring);

    gsap.to(ring.scale, {
      x: 28,
      y: 28,
      z: 28,
      duration: 1.4,
      ease: 'power2.out',
      onComplete: () => {
        this.scene.remove(ring);
        ringGeo.dispose();
        ringMat.dispose();
      }
    });

    gsap.to(ringMat, {
      opacity: 0,
      duration: 1.4,
      ease: 'power2.in'
    });
  }

  /**
   * Cập nhật chuyển động hoạt cảnh mỗi khung hình
   */
  update(dt, elapsedOrPos, playerPos) {
    this.elapsedTime = (this.elapsedTime || 0) + (dt || 0.016);
    const time = (typeof elapsedOrPos === 'number') ? elapsedOrPos : this.elapsedTime;

    // 1. Cập nhật khói hương bốc lên
    if (this.smokePoints) {
      const posAttr = this.smokePoints.geometry.attributes.position;
      const count = posAttr.count;
      for (let i = 0; i < count; i++) {
        let y = posAttr.getY(i) + dt * 0.9;
        let x = posAttr.getX(i) + Math.sin(time * 1.5 + i) * 0.008;
        let z = posAttr.getZ(i) + Math.cos(time * 1.2 + i) * 0.008;

        if (y > 5.5) {
          y = 0.1;
          x = (Math.random() - 0.5) * 0.35;
          z = (Math.random() - 0.5) * 0.35;
        }
        posAttr.setXYZ(i, x, y, z);
      }
      posAttr.needsUpdate = true;
    }

    // 2. Cập nhật đom đóm dập dờn
    if (this.fireflies) {
      const posAttr = this.fireflies.geometry.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        let y = posAttr.getY(i) + Math.sin(time * 2.0 + i) * 0.004;
        let x = posAttr.getX(i) + Math.cos(time * 1.4 + i) * 0.005;
        posAttr.setY(i, y);
        posAttr.setX(i, x);
      }
      posAttr.needsUpdate = true;
    }

    // 3. Cập nhật linh quang u uất đung đưa
    this.spiritOrbs.forEach((item) => {
      if (!item.isPurified) {
        item.mesh.position.y = item.basePos.y + Math.sin(time * 2.2 + item.phase) * 0.22;
        item.mesh.position.x = item.basePos.x + Math.cos(time * 1.4 + item.phase) * 0.14;
      }
    });

    // 4. Cập nhật cánh sen "Bộ Bộ Sinh Liên" mờ dần
    for (let i = this.activeLotuses.length - 1; i >= 0; i--) {
      const item = this.activeLotuses[i];
      item.life -= dt * 0.45; // Tồn tại khoảng 2.2 giây

      if (item.life <= 0) {
        this.scene.remove(item.mesh);
        item.mesh.visible = false;
        this.lotusPool.push(item.mesh);
        this.activeLotuses.splice(i, 1);
      } else {
        item.mesh.scale.multiplyScalar(0.992);
      }
    }
  }
}


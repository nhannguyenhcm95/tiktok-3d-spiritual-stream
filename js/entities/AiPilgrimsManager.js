/**
 * AiPilgrimsManager.js — Quản lý 45 Khách Hành Hương AI
 * Tối ưu Zero-Lag bằng THREE.InstancedMesh (Chỉ 2 Draw Calls cho toàn bộ đám đông).
 * Định kỳ xuất hiện bong bóng chữ Niệm Phật & Cầu An nhẹ nhàng.
 */

import * as THREE from 'three';

export class AiPilgrimsManager {
  constructor(scene) {
    this.scene = scene;
    this.count = 45;

    this.bodyMesh = null;
    this.headMesh = null;
    this.pilgrimData = [];

    // Bong bóng suy nghĩ nổi trên đầu
    this.bubbleSprite = null;
    this.bubbleTimer = 0;

    this.phrases = [
      'Nam Mô A Di Đà Phật 🙏',
      'Cầu mong cha mẹ sống đời an vui',
      'Tâm an vạn sự an, phước lành sinh sôi',
      'Cầu gia đạo bình yên, vạn sự hanh thông',
      'Nguyện tiêu tam chướng trừ phiền não',
      'Cầu cho con cái chăm ngoan hiếu thảo',
      'Phúc lạc tràn đầy muôn nơi',
      'Tịnh tâm niệm Phật, lòng nhẹ như mây'
    ];
  }

  init() {
    this._buildInstancedPilgrims();
    this._initThoughtBubble();
  }

  _buildInstancedPilgrims() {
    const bodyGeo = new THREE.CylinderGeometry(0.22, 0.32, 0.95, 10);
    const headGeo = new THREE.SphereGeometry(0.2, 12, 10);

    const bodyMat = new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.05 });
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfce2cc, roughness: 0.5 });

    this.bodyMesh = new THREE.InstancedMesh(bodyGeo, bodyMat, this.count);
    this.headMesh = new THREE.InstancedMesh(headGeo, headMat, this.count);

    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;

    // Màu áo Phật tử: Áo lam, áo nâu, áo xám, áo trắng
    const colors = [
      new THREE.Color(0x4a7c9f), // Áo lam
      new THREE.Color(0x6e4732), // Áo nâu
      new THREE.Color(0x687178), // Áo xám
      new THREE.Color(0xdadfe3)  // Áo trắng
    ];

    const dummy = new THREE.Object3D();

    for (let i = 0; i < this.count; i++) {
      let x, z;
      if (i < 15) {
        // 15 người đứng chắp tay chiêm bái trước Chính Điện
        x = (Math.random() - 0.5) * 14;
        z = -7 + (Math.random() - 0.5) * 5;
      } else if (i < 25) {
        // 10 người đứng quanh Lư Hương giữa sân
        const angle = Math.random() * Math.PI * 2;
        const dist = 3.2 + Math.random() * 2.8;
        x = Math.cos(angle) * dist;
        z = 8 + Math.sin(angle) * dist;
      } else if (i < 35) {
        // 10 người ngắm hoa sen quanh Hồ Sen
        const angle = Math.random() * Math.PI * 2;
        const dist = 8.2 + Math.random() * 2.5;
        x = 20 + Math.cos(angle) * dist;
        z = 14 + Math.sin(angle) * dist;
      } else {
        // 10 người đứng chiêm bái Cây Bồ Đề
        const angle = Math.random() * Math.PI * 2;
        const dist = 3.8 + Math.random() * 3.5;
        x = 18 + Math.cos(angle) * dist;
        z = -8 + Math.sin(angle) * dist;
      }

      const rotY = Math.atan2(-x, -18 - z); // Hướng mặt về Chính Điện

      // Thân mình
      dummy.position.set(x, 0.48, z);
      dummy.rotation.set(0, rotY + (Math.random() - 0.5) * 0.4, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      this.bodyMesh.setMatrixAt(i, dummy.matrix);
      this.bodyMesh.setColorAt(i, colors[i % colors.length]);

      // Đầu
      dummy.position.set(x, 1.08, z);
      dummy.updateMatrix();
      this.headMesh.setMatrixAt(i, dummy.matrix);

      this.pilgrimData.push({
        baseX: x,
        baseZ: z,
        rotY,
        phase: Math.random() * Math.PI * 2
      });
    }

    this.bodyMesh.instanceMatrix.needsUpdate = true;
    if (this.bodyMesh.instanceColor) this.bodyMesh.instanceColor.needsUpdate = true;
    this.headMesh.instanceMatrix.needsUpdate = true;

    this.scene.add(this.bodyMesh, this.headMesh);
  }

  _initThoughtBubble() {
    const canvas = document.createElement('canvas');
    canvas.width = 360; canvas.height = 96;
    const ctx = canvas.getContext('2d');
    this.bubbleCanvas = canvas;
    this.bubbleCtx = ctx;

    this.bubbleTex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: this.bubbleTex, depthTest: false, transparent: true });
    this.bubbleSprite = new THREE.Sprite(mat);
    this.bubbleSprite.scale.set(2.4, 0.64, 1);
    this.bubbleSprite.visible = false;
    this.scene.add(this.bubbleSprite);
  }

  showRandomThoughtBubble() {
    if (!this.bubbleSprite || this.pilgrimData.length === 0) return;

    const pilgrim = this.pilgrimData[Math.floor(Math.random() * this.pilgrimData.length)];
    const text = this.phrases[Math.floor(Math.random() * this.phrases.length)];

    const ctx = this.bubbleCtx;
    ctx.clearRect(0, 0, 360, 96);

    // Vẽ bong bóng màu trắng ngà viền vàng
    ctx.fillStyle = 'rgba(255, 252, 242, 0.95)';
    ctx.roundRect ? ctx.roundRect(10, 8, 340, 68, 16) : ctx.fillRect(10, 8, 340, 68);
    ctx.fill();

    // Mũi nhọn bong bóng
    ctx.beginPath();
    ctx.moveTo(170, 76);
    ctx.lineTo(180, 92);
    ctx.lineTo(190, 76);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#cda250';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#3a200a';
    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 180, 42);

    this.bubbleTex.needsUpdate = true;
    this.bubbleSprite.position.set(pilgrim.baseX, 1.85, pilgrim.baseZ);
    this.bubbleSprite.visible = true;

    setTimeout(() => {
      if (this.bubbleSprite) this.bubbleSprite.visible = false;
    }, 4500);
  }

  update(dt, elapsed) {
    this.bubbleTimer += dt;
    if (this.bubbleTimer > 7.5) {
      this.bubbleTimer = 0;
      this.showRandomThoughtBubble();
    }
  }
}

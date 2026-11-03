/**
 * CollisionSystem.js — Hệ thống kiểm tra & phản hồi va chạm 3D
 * Chống nhân vật đi xuyên tường, cột trụ, tượng Phật, lư hương và hồ sen.
 * Cung cấp cơ chế trượt tường (Wall-slide) mượt mà không bị khựng hay kẹt góc.
 */

import * as THREE from 'three';

export class CollisionSystem {
  constructor() {
    this.boxColliders = [];
    this.circleColliders = [];
    this.bounds = { minX: -37.5, maxX: 37.5, minZ: -37.5, maxZ: 37.5 };
  }

  addBoxCollider(minX, maxX, minZ, maxZ, name = 'box') {
    this.boxColliders.push({ minX, maxX, minZ, maxZ, name });
  }

  addCircleCollider(x, z, radius, name = 'circle') {
    this.circleColliders.push({ x, z, radius, name });
  }

  addColliders(colliders) {
    if (!Array.isArray(colliders)) return;
    colliders.forEach(c => {
      if (c.type === 'box') {
        this.addBoxCollider(c.minX, c.maxX, c.minZ, c.maxZ, c.name);
      } else if (c.type === 'circle') {
        this.addCircleCollider(c.x, c.z, c.radius, c.name);
      }
    });
  }

  checkMove(currPos, nextPos, radius = 0.42) {
    return this.resolveCollision(currPos, nextPos, radius);
  }

  /**
   * Giải quyết va chạm với cơ chế trượt (sliding response)
   */
  resolveCollision(currPos, nextPos, radius = 0.42) {
    let targetX = nextPos.x;
    let targetZ = nextPos.z;

    // 1. Giới hạn tường bao chùa
    targetX = Math.max(this.bounds.minX + radius, Math.min(this.bounds.maxX - radius, targetX));
    targetZ = Math.max(this.bounds.minZ + radius, Math.min(this.bounds.maxZ - radius, targetZ));

    // 2. Thử nghiệm di chuyển trục X trước
    let testPosX = { x: targetX, z: currPos.z };
    if (this._checkBlocked(testPosX.x, testPosX.z, radius)) {
      targetX = currPos.x; // Không đi được theo X, chặn lại
    }

    // 3. Thử nghiệm di chuyển trục Z
    let testPosZ = { x: targetX, z: targetZ };
    if (this._checkBlocked(testPosZ.x, testPosZ.z, radius)) {
      targetZ = currPos.z; // Không đi được theo Z, chặn lại
    }

    return new THREE.Vector3(targetX, nextPos.y, targetZ);
  }

  _checkBlocked(px, pz, radius) {
    // Kiểm tra hộp chữ nhật (AABB)
    for (let i = 0; i < this.boxColliders.length; i++) {
      const b = this.boxColliders[i];
      if (
        px + radius > b.minX &&
        px - radius < b.maxX &&
        pz + radius > b.minZ &&
        pz - radius < b.maxZ
      ) {
        return true;
      }
    }

    // Kiểm tra hình tròn (Circle)
    for (let i = 0; i < this.circleColliders.length; i++) {
      const c = this.circleColliders[i];
      const dx = px - c.x;
      const dz = pz - c.z;
      const distSq = dx * dx + dz * dz;
      const minDist = radius + c.radius;
      if (distSq < minDist * minDist) {
        return true;
      }
    }

    return false;
  }
}


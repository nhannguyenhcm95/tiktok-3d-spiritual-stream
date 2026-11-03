/**
 * Leaderboard & Cushion Engine for TikTok Live Buddhist Hall
 * Tuân thủ chuẩn CONTRACT.md & UNITY_BLENDER_CODE_SCAFFOLD.md
 */

class LeaderboardEngine {
  constructor() {
    this.users = new Map();
    this.slotOccupants = new Array(64).fill(null);
    this.initDefaultUsers();
  }

  initDefaultUsers() {
    const defaultVips = [
      { uniqueId: 'u1', nickname: 'Hoàng Quân', coins: 520, robeType: 'WHITE' },
      { uniqueId: 'u2', nickname: 'thu.tr', coins: 380, robeType: 'GREY' },
      { uniqueId: 'u3', nickname: 'kjen', coins: 290, robeType: 'BROWN' },
      { uniqueId: 'u4', nickname: 'xìn gói cuối', coins: 240, robeType: 'WHITE' },
      { uniqueId: 'u5', nickname: 'Minh Tâm', coins: 204, robeType: 'MONK_YELLOW' }
    ];

    const defaultChasers = [
      { uniqueId: 'u6', nickname: "Von'S Tea", coins: 158, robeType: 'GREY' },
      { uniqueId: 'u7', nickname: 'Joon', coins: 150, robeType: 'WHITE' },
      { uniqueId: 'u8', nickname: 'Mạnh Trần', coins: 138, robeType: 'BROWN' },
      { uniqueId: 'u9', nickname: 'Viviannetran', coins: 136, robeType: 'WHITE' }
    ];

    defaultVips.forEach((u) => {
      this.users.set(u.uniqueId, { ...u, slotIndex: -1, lastActive: Date.now() });
    });

    defaultChasers.forEach((u) => {
      this.users.set(u.uniqueId, { ...u, slotIndex: -1, lastActive: Date.now() });
    });

    const crowdNames = [
      'Nguyễn Thịnh', 'Thúy Đỉ', '24th2', 'Nhân skay', 'An Nhiên', 'Diệu Hoa',
      'Tịnh Tâm', 'Phúc An', 'Tuệ Lâm', 'Thiện Nhân', 'Văn Hùng', 'Lan Anh',
      'Minh Khang', 'Hồng Ngọc', 'Bảo Vy', 'Đức Huy', 'Quỳnh Như', 'Thanh Tùng',
      'Thảo My', 'Trần Long', 'Cẩm Ly', 'Phương Nam', 'Khánh Linh', 'Tường Vy',
      'Thanh Nhã', 'Ngọc Mai', 'Vĩnh Hưng', 'Thế Anh', 'Hương Giang', 'Bảo Nam',
      'Mỹ Duyên', 'Quốc Bảo', 'Ánh Tuyết', 'Hữu Thắng', 'Kim Oanh', 'Hải Đăng',
      'Tuyết Mai', 'Hoàng Bách', 'Trâm Anh', 'Gia Huy', 'Thùy Chi', 'Nhật Minh',
      'Thu Hà', 'Đăng Khoa'
    ];

    crowdNames.forEach((name, idx) => {
      if (idx < 64) {
        const uid = `crowd_${idx + 1}`;
        this.users.set(uid, {
          uniqueId: uid,
          nickname: name,
          coins: Math.max(0, 50 - idx),
          robeType: 'GREY',
          slotIndex: idx,
          lastActive: Date.now()
        });
        this.slotOccupants[idx] = uid;
      }
    });
  }

  addOrUpdateUser(userData, coinsToAdd = 0) {
    const { uniqueId, nickname, robeType } = userData;
    let user = this.users.get(uniqueId);
    if (!user) {
      user = {
        uniqueId,
        nickname: nickname || 'Phật Tử',
        coins: 0,
        robeType: robeType || 'GREY',
        slotIndex: -1,
        lastActive: Date.now()
      };
      this.users.set(uniqueId, user);
    } else {
      if (nickname) user.nickname = nickname;
      user.lastActive = Date.now();
    }

    if (coinsToAdd > 0) {
      user.coins += coinsToAdd;
    }
    return user;
  }

  touchUser(uniqueId, nickname) {
    let user = this.users.get(uniqueId);
    if (!user) {
      user = this.addOrUpdateUser({ uniqueId, nickname }, 0);
    } else {
      user.lastActive = Date.now();
      if (nickname) user.nickname = nickname;
    }
    return user;
  }

  getSortedUsers() {
    return Array.from(this.users.values()).sort((a, b) => b.coins - a.coins || b.lastActive - a.lastActive);
  }

  getCrowdSyncPayload() {
    const sorted = this.getSortedUsers();
    const vipSeats = [];
    for (let i = 0; i < 5; i++) {
      const u = sorted[i];
      if (u) {
        vipSeats.push({
          rank: i + 1,
          uniqueId: u.uniqueId,
          nickname: u.nickname,
          coins: u.coins,
          robeType: u.robeType
        });
      } else {
        vipSeats.push({
          rank: i + 1,
          uniqueId: `default_vip_${i + 1}`,
          nickname: `Đại Thí Chủ ${i + 1}`,
          coins: Math.max(50, 300 - i * 40),
          robeType: 'GREY'
        });
      }
    }

    const fifthSeatCoins = vipSeats[4] ? vipSeats[4].coins : 50;
    const chasers = [];
    for (let i = 5; i < Math.min(sorted.length, 9); i++) {
      const u = sorted[i];
      const coinsNeeded = Math.max(1, fifthSeatCoins - u.coins + 1);
      chasers.push({
        rank: i + 1,
        nickname: u.nickname,
        coins: u.coins,
        coinsNeeded
      });
    }

    const crowdMembers = [];
    for (let slot = 0; slot < 64; slot++) {
      const occupantId = this.slotOccupants[slot];
      if (occupantId && this.users.has(occupantId)) {
        const u = this.users.get(occupantId);
        crowdMembers.push({
          uniqueId: u.uniqueId,
          nickname: u.nickname,
          robeType: u.robeType,
          slotIndex: slot
        });
      } else {
        crowdMembers.push({
          uniqueId: `slot_user_${slot}`,
          nickname: `Phật Tử ${slot + 1}`,
          robeType: 'GREY',
          slotIndex: slot
        });
      }
    }

    return {
      vipSeats,
      fifthSeatCoins,
      chasers,
      crowdMembers
    };
  }
}

module.exports = new LeaderboardEngine();

/**
 * Leaderboard & VIP Cushion Engine
 * Quản lý điểm xu, 5 Đệm VIP hàng đầu, Danh sách bám đuổi & Đám đông 48 Phật tử
 * Tuân thủ chuẩn CONTRACT.md
 */

const ROBE_TYPES = ['GREY', 'WHITE', 'BROWN', 'MONK_YELLOW'];

class LeaderboardEngine {
  constructor() {
    // Map lưu trữ toàn bộ người dùng: uniqueId -> UserRecord
    this.users = new Map();
    // Danh sách 48 vị trí ghế trong đám đông (slotIndex: 0..47)
    // slotOccupants[slotIndex] = uniqueId hoặc null
    this.slotOccupants = new Array(48).fill(null);
    this.initDefaultUsers();
  }

  /**
   * Khởi tạo sẵn danh sách mặc định sinh động như trong video mẫu
   */
  initDefaultUsers() {
    // 5 vị trí VIP mặc định ban đầu
    const defaultVips = [
      { uniqueId: 'u1', nickname: 'Hoàng Quân', coins: 520, robeType: 'WHITE' },
      { uniqueId: 'u2', nickname: 'thu.tr', coins: 380, robeType: 'GREY' },
      { uniqueId: 'u3', nickname: 'kjen', coins: 290, robeType: 'BROWN' },
      { uniqueId: 'u4', nickname: 'xìn gói cuối', coins: 240, robeType: 'WHITE' },
      { uniqueId: 'u5', nickname: 'Minh Tâm', coins: 204, robeType: 'MONK_YELLOW' }
    ];

    // Người bám đuổi
    const defaultChasers = [
      { uniqueId: 'u6', nickname: "Von'S Tea", coins: 158, robeType: 'GREY' },
      { uniqueId: 'u7', nickname: 'Joon', coins: 150, robeType: 'WHITE' },
      { uniqueId: 'u8', nickname: 'Mạnh Trần', coins: 138, robeType: 'BROWN' },
      { uniqueId: 'u9', nickname: 'Viviannetran', coins: 136, robeType: 'WHITE' },
      { uniqueId: 'u10', nickname: 'Xoài Non', coins: 120, robeType: 'GREY' },
      { uniqueId: 'u11', nickname: 'Bé Bự', coins: 110, robeType: 'MONK_YELLOW' }
    ];

    // Phật tử đám đông
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

    // Nạp VIP
    defaultVips.forEach((u) => {
      this.users.set(u.uniqueId, {
        uniqueId: u.uniqueId,
        nickname: u.nickname,
        coins: u.coins,
        robeType: u.robeType,
        slotIndex: -1, // VIP ngồi đệm trước bàn thờ
        lastActive: Date.now()
      });
    });

    // Nạp Chasers
    defaultChasers.forEach((u) => {
      this.users.set(u.uniqueId, {
        uniqueId: u.uniqueId,
        nickname: u.nickname,
        coins: u.coins,
        robeType: u.robeType,
        slotIndex: -1,
        lastActive: Date.now()
      });
    });

    // Nạp đám đông vào các ô slot
    crowdNames.forEach((name, idx) => {
      if (idx < 48) {
        const uid = `crowd_${idx + 1}`;
        const robe = ROBE_TYPES[idx % ROBE_TYPES.length];
        this.users.set(uid, {
          uniqueId: uid,
          nickname: name,
          coins: Math.max(0, 50 - idx),
          robeType: robe,
          slotIndex: idx,
          lastActive: Date.now()
        });
        this.slotOccupants[idx] = uid;
      }
    });
  }

  /**
   * Cấp phát vị trí slot trống cho thành viên đám đông
   */
  allocateSlot(uniqueId) {
    // Nếu user đã có slot hợp lệ
    const user = this.users.get(uniqueId);
    if (user && user.slotIndex >= 0 && user.slotIndex < 48) {
      if (this.slotOccupants[user.slotIndex] === uniqueId) {
        return user.slotIndex;
      }
    }

    // Tìm slot trống đầu tiên
    for (let i = 0; i < 48; i++) {
      if (!this.slotOccupants[i]) {
        this.slotOccupants[i] = uniqueId;
        return i;
      }
    }

    // Nếu hết slot, thay thế slot có người ít hoạt động nhất (LRU)
    let oldestTime = Infinity;
    let oldestSlot = 0;
    for (let i = 0; i < 48; i++) {
      const occupantId = this.slotOccupants[i];
      const occupant = this.users.get(occupantId);
      const lastActive = occupant ? occupant.lastActive : 0;
      if (lastActive < oldestTime) {
        oldestTime = lastActive;
        oldestSlot = i;
      }
    }

    const prevOccupant = this.users.get(this.slotOccupants[oldestSlot]);
    if (prevOccupant) {
      prevOccupant.slotIndex = -1;
    }
    this.slotOccupants[oldestSlot] = uniqueId;
    return oldestSlot;
  }

  /**
   * Thêm hoặc cập nhật người dùng khi tương tác / tặng quà
   */
  addOrUpdateUser(userData, coinsToAdd = 0) {
    const { uniqueId, nickname, robeType } = userData;
    let user = this.users.get(uniqueId);

    if (!user) {
      const randomRobe = robeType || ROBE_TYPES[Math.floor(Math.random() * ROBE_TYPES.length)];
      user = {
        uniqueId,
        nickname: nickname || 'Phật Tử',
        coins: 0,
        robeType: randomRobe,
        slotIndex: -1,
        lastActive: Date.now()
      };
      this.users.set(uniqueId, user);
    } else {
      if (nickname) user.nickname = nickname;
      if (robeType) user.robeType = robeType;
      user.lastActive = Date.now();
    }

    if (coinsToAdd > 0) {
      user.coins += coinsToAdd;
    }

    return user;
  }

  /**
   * Cập nhật thời gian hoạt động của user và đảm bảo có slot
   */
  touchUser(uniqueId, nickname) {
    let user = this.users.get(uniqueId);
    if (!user) {
      user = this.addOrUpdateUser({ uniqueId, nickname }, 0);
    } else {
      user.lastActive = Date.now();
      if (nickname) user.nickname = nickname;
    }

    // Nếu không phải VIP (top 5) và chưa có slot thì cấp slot
    const sorted = this.getSortedUsers();
    const rank = sorted.findIndex((u) => u.uniqueId === uniqueId) + 1;
    if (rank > 5 && (user.slotIndex < 0 || user.slotIndex >= 48)) {
      user.slotIndex = this.allocateSlot(uniqueId);
    }
    return user;
  }

  /**
   * Lấy danh sách sắp xếp theo số xu giảm dần
   */
  getSortedUsers() {
    return Array.from(this.users.values()).sort((a, b) => {
      if (b.coins !== a.coins) {
        return b.coins - a.coins;
      }
      return b.lastActive - a.lastActive;
    });
  }

  /**
   * Tạo gói dữ liệu chuẩn `crowd_sync` theo CONTRACT.md
   */
  getCrowdSyncPayload() {
    const sorted = this.getSortedUsers();

    // Top 5 đệm VIP hàng đầu
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
          robeType: ROBE_TYPES[i % ROBE_TYPES.length]
        });
      }
    }

    // Mốc chuẩn đệm cuối (Hạng 5)
    const fifthSeatCoins = vipSeats[4] ? vipSeats[4].coins : 50;

    // Danh sách 4 người bám đuổi (Hạng 6 đến Hạng 9)
    const chasers = [];
    for (let i = 5; i < Math.min(sorted.length, 9); i++) {
      const u = sorted[i];
      const coinsNeeded = Math.max(1, fifthSeatCoins - u.coins + 1);
      chasers.push({
        rank: i + 1,
        uniqueId: u.uniqueId,
        nickname: u.nickname,
        coins: u.coins,
        coinsNeeded
      });
    }

    // Nếu chưa đủ 4 chasers, tạo placeholder bám đuổi sinh động
    const defaultChaserNames = ["Von'S Tea", 'Joon', 'Mạnh Trần', 'Viviannetran'];
    while (chasers.length < 4) {
      const rank = chasers.length + 6;
      const fakeCoins = Math.max(10, fifthSeatCoins - (chasers.length + 1) * 15);
      const coinsNeeded = Math.max(1, fifthSeatCoins - fakeCoins + 1);
      chasers.push({
        rank,
        uniqueId: `default_chaser_${rank}`,
        nickname: defaultChaserNames[chasers.length] || `Phật Tử ${rank}`,
        coins: fakeCoins,
        coinsNeeded
      });
    }

    // Danh sách 48 thành viên đám đông
    const crowdMembers = [];
    for (let slot = 0; slot < 48; slot++) {
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
        // Tạo thành viên lấp đầy vị trí để luôn đông đủ 48 người
        const defaultName = `Phật Tử ${slot + 1}`;
        const defaultRobe = ROBE_TYPES[slot % ROBE_TYPES.length];
        crowdMembers.push({
          uniqueId: `slot_user_${slot}`,
          nickname: defaultName,
          robeType: defaultRobe,
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

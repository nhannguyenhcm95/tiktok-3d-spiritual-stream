/**
 * Express & Socket.io Server Entry Point — PHẬT ĐIỆN VẠN NGƯỜI
 * 3D TikTok Interactive Spiritual Live Stream
 */

require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const eventQueue = require('./eventQueue');
const tiktokConnector = require('./tiktokConnector');
const mockSimulator = require('./mockSimulator');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;
const INITIAL_TIKTOK_USERNAME = process.env.TIKTOK_USERNAME || '';
const AUTO_MOCK_INIT = process.env.AUTO_MOCK !== 'false';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Khởi tạo EventQueue với Socket.io
eventQueue.init(io);

/**
 * Lấy đối tượng trạng thái phòng live chuẩn theo CONTRACT.md & PHẬT ĐIỆN VẠN NGƯỜI
 */
function getServerStatus() {
  const tiktokStatus = tiktokConnector.getStatus();
  const queueStats = eventQueue.getStats();
  return {
    connected: tiktokStatus.connected,
    tiktokUsername: tiktokStatus.tiktokUsername,
    autoMock: mockSimulator.isEnabled(),
    totalMerit: eventQueue.getTotalMerit(),
    totalUsers: queueStats.totalUsers,
    leaderboard: eventQueue.getLeaderboard(10)
  };
}

/**
 * Phát trạng thái tới toàn bộ client
 */
function broadcastStatus() {
  io.emit('server_status', getServerStatus());
}

// Lắng nghe trạng thái TikTok thay đổi
tiktokConnector.onStatusChange(() => {
  broadcastStatus();
});

// Định kỳ phát server_status mỗi 3 giây để đồng bộ
setInterval(() => {
  broadcastStatus();
}, 3000);

// ================= Socket.io Events =================
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client kết nối: ${socket.id}`);
  socket.emit('server_status', getServerStatus());

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client ngắt kết nối: ${socket.id}`);
  });
});

// ================= REST APIs =================

// 1. GET /api/status - Trạng thái hệ thống & Bảng TÂM LÒNG THÀNH
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    data: getServerStatus(),
    queue: eventQueue.getStats()
  });
});

// 2. GET /api/players - Danh sách toàn bộ Phật tử trong điện
app.get('/api/players', (req, res) => {
  res.json({
    success: true,
    players: eventQueue.getAllUsers()
  });
});

// 3. POST /api/players/reset - Xóa danh sách người chơi để làm mới
app.post('/api/players/reset', (req, res) => {
  eventQueue.resetUsers();
  broadcastStatus();
  io.emit('reset_avatars', { timestamp: Date.now() });
  res.json({ success: true, message: 'Đã xóa toàn bộ nhân vật' });
});

// 4. GET /api/config/commands - Lấy cấu hình command mapping hiện tại
app.get('/api/config/commands', (req, res) => {
  res.json({ success: true, data: eventQueue.getCommandConfig() });
});

// 5. POST /api/config/commands - Cập nhật cấu hình command mapping
app.post('/api/config/commands', (req, res) => {
  if (req.body && typeof req.body === 'object') {
    eventQueue.updateCommandConfig(req.body);
    return res.json({ success: true, message: 'Đã cập nhật cấu hình lệnh', data: eventQueue.getCommandConfig() });
  }
  res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
});

// 6. GET /api/config/gifts - Lấy cấu hình gift mapping hiện tại
app.get('/api/config/gifts', (req, res) => {
  res.json({ success: true, data: eventQueue.getGiftConfig() });
});

// 7. POST /api/config/gifts - Cập nhật cấu hình gift mapping
app.post('/api/config/gifts', (req, res) => {
  if (req.body && typeof req.body === 'object') {
    eventQueue.updateGiftConfig(req.body);
    return res.json({ success: true, message: 'Đã cập nhật cấu hình quà tặng', data: eventQueue.getGiftConfig() });
  }
  res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
});

// 8. GET /api/stats - Thống kê chi tiết phiên LIVE
app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    session: {
      activePlayers: eventQueue.getAllUsers().length,
      queue: eventQueue.getStats(),
      serverStatus: getServerStatus()
    }
  });
});

// 9. POST /api/config - Cấu hình kênh TikTok và chế độ Auto-Mock
app.post('/api/config', async (req, res) => {
  const { tiktokUsername, autoMock } = req.body;
  let message = [];

  // Bật/tắt Auto-Mock
  if (typeof autoMock === 'boolean') {
    if (autoMock) {
      mockSimulator.start();
      message.push('Đã bật Auto-Mock');
    } else {
      mockSimulator.stop();
      message.push('Đã tắt Auto-Mock');
    }
  }

  // Kết nối/ngắt kết nối TikTok
  if (typeof tiktokUsername === 'string') {
    const trimmed = tiktokUsername.trim();
    if (trimmed === '') {
      await tiktokConnector.disconnectTikTok();
      message.push('Đã ngắt kết nối TikTok');
    } else {
      message.push(`Đang kết nối tới @${trimmed}`);
      tiktokConnector.connectToTikTok(trimmed).catch((err) => {
        console.error('[API Config] Lỗi kết nối TikTok:', err.message);
      });
    }
  }

  broadcastStatus();

  res.json({
    success: true,
    message: message.join(', ') || 'Cấu hình đã được lưu',
    data: getServerStatus()
  });
});

// 10. POST /api/mock/:actionType - Bắn sự kiện test trực tiếp từ Admin Dashboard
app.post('/api/mock/:actionType', (req, res) => {
  const { actionType } = req.params;
  const validTypes = [
    'VIEWER_JOINED', 'SHARE',
    'CHANT', 'NIEM_PHAT', 'KNEEL', 'BOW', 'STAND', 'PRAY', 'OFFER_INCENSE', 'OFFER_FLOWER', 'WALK_TO_ALTAR',
    'WOODEN_FISH', 'PRAYER_TEXT', 'COMMENT_CHAT',
    'INCENSE_1', 'INCENSE_3', 'LANTERN', 'OFFERING_FRUIT',
    'BELL', 'CONFETTI', 'PARADE_FLOAT', 'BUDDHA_LIGHT',
    'THOUSAND_LANTERNS', 'GOLDEN_PAGODA', 'GOLDEN_LION',
    'GOLDEN_PHOENIX', 'TIKTOK_UNIVERSE'
  ];

  if (!validTypes.includes(actionType)) {
    return res.status(400).json({
      success: false,
      message: `Loại hành động không hợp lệ. Cho phép: ${validTypes.join(', ')}`
    });
  }

  const { user, payload } = req.body || {};
  const event = mockSimulator.triggerManual(actionType, user, payload);

  res.json({
    success: true,
    message: `Đã kích hoạt sự kiện ${actionType}`,
    event
  });
});

// Khởi chạy server
server.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(` PHẬT ĐIỆN VẠN NGƯỜI — 3D TikTok Live Stream`);
  console.log(` Cổng: http://localhost:${PORT}`);
  console.log(` Chế độ AUTO_MOCK: ${AUTO_MOCK_INIT ? 'BẬT (ON)' : 'TẮT (OFF)'}`);
  console.log(`====================================================`);

  // Tự động kết nối kênh TikTok từ .env nếu có
  if (INITIAL_TIKTOK_USERNAME) {
    console.log(`[Init] Tự động kết nối tới kênh @${INITIAL_TIKTOK_USERNAME}...`);
    tiktokConnector.connectToTikTok(INITIAL_TIKTOK_USERNAME).catch(() => {});
  }

  // Tự động kích hoạt mock nếu bật
  if (AUTO_MOCK_INIT) {
    mockSimulator.start();
  }
});

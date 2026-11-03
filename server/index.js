/**
 * Express & Socket.io Server Entry Point
 * 3D TikTok Interactive Spiritual Stream
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
 * Hàm lấy đối tượng trạng thái phòng live chuẩn theo CONTRACT.md
 */
function getServerStatus() {
  const tiktokStatus = tiktokConnector.getStatus();
  return {
    connected: tiktokStatus.connected,
    tiktokUsername: tiktokStatus.tiktokUsername,
    autoMock: mockSimulator.isEnabled(),
    totalMerit: eventQueue.getTotalMerit()
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

// Định kỳ phát server_status mỗi 3 giây để đồng bộ tổng công đức
setInterval(() => {
  broadcastStatus();
}, 3000);

// ================= Socket.io Events =================
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client kết nối: ${socket.id}`);
  // Gửi ngay trạng thái phòng khi client vừa kết nối
  socket.emit('server_status', getServerStatus());

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client ngắt kết nối: ${socket.id}`);
  });
});

// ================= REST APIs =================

// 1. GET /api/status - Trả về trạng thái hiện tại
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    data: getServerStatus(),
    queue: eventQueue.getStats()
  });
});

// 2. POST /api/config - Cấu hình kênh TikTok và chế độ Auto-Mock
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
      message.push(`Đang chuyển kết nối tới @${trimmed}`);
      // Thực hiện kết nối trong background
      tiktokConnector.connectToTikTok(trimmed).catch((err) => {
        console.error('[API Config] Lỗi khi kết nối TikTok:', err.message);
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

// 3. POST /api/mock/:actionType - Bắn sự kiện test trực tiếp từ Debug Panel
app.post('/api/mock/:actionType', (req, res) => {
  const { actionType } = req.params;
  const validTypes = [
    'BOW', 'WOODEN_FISH', 'PRAYER_TEXT',
    'INCENSE_1', 'INCENSE_3', 'LANTERN', 'OFFERING_FRUIT',
    'BELL', 'CONFETTI', 'PARADE_FLOAT', 'BUDDHA_LIGHT',
    'THOUSAND_LANTERNS', 'GOLDEN_PAGODA', 'GOLDEN_LION',
    'GOLDEN_PHOENIX', 'TIKTOK_UNIVERSE', 'INCENSE'
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
  console.log(` 3D Spiritual Live Stream Server is running!`);
  console.log(` Cổng: http://localhost:${PORT}`);
  console.log(` Chế độ AUTO_MOCK: ${AUTO_MOCK_INIT ? 'BẬT (ON)' : 'TẮT (OFF)'}`);
  console.log(`====================================================`);

  // Tự động bật Auto-Mock nếu được chỉ định
  if (AUTO_MOCK_INIT) {
    mockSimulator.start();
  }

  // Tự động kết nối TikTok nếu có username
  if (INITIAL_TIKTOK_USERNAME) {
    console.log(`[Init] Tự động kết nối kênh TikTok: @${INITIAL_TIKTOK_USERNAME}`);
    tiktokConnector.connectToTikTok(INITIAL_TIKTOK_USERNAME);
  }
});


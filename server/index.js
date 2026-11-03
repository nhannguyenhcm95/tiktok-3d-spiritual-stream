/**
 * Express & Socket.io Server Entry Point
 * TikTok Live Interactive Buddhist Hall (Chánh Điện Dâng Hương & Đám Đông Quỳ Lạy)
 * Tuân thủ chuẩn CONTRACT.md
 */

require('dotenv').config();
const path = require('path');
const http = require('http');
const https = require('https');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const leaderboardEngine = require('./leaderboardEngine');
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

const PORT = parseInt(process.env.PORT || '3000', 10);
const INITIAL_TIKTOK_USERNAME = process.env.TIKTOK_USERNAME || '';
const AUTO_MOCK_INIT = process.env.AUTO_MOCK !== 'false';

// Middleware
app.use(cors());
app.use(express.json());

// Phục vụ thư mục public/ làm giao diện web chính (9:16 Chánh Điện Hoàng Kim)
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// Fallback phục vụ assets nếu có
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));

// Khởi tạo EventQueue & TikTokConnector & MockSimulator với Socket.io
eventQueue.init(io);
tiktokConnector.init(io, INITIAL_TIKTOK_USERNAME);
mockSimulator.init(io, AUTO_MOCK_INIT);

/**
 * Socket.io Connection
 */
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client đã kết nối: ${socket.id}`);

  // Gửi trạng thái và danh sách nhân vật/VIP ngay khi client vừa mở
  socket.emit('crowd_sync', leaderboardEngine.getCrowdSyncPayload());
  socket.emit('server_status', {
    connected: tiktokConnector.getStatus().connected,
    tiktokUsername: tiktokConnector.getStatus().tiktokUsername,
    autoMock: mockSimulator.isEnabled()
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client ngắt kết nối: ${socket.id}`);
  });
});

/**
 * REST APIs
 */

// 1. GET /api/status - Trạng thái hệ thống & Bảng Tấm Lòng Thành
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    data: {
      tiktok: tiktokConnector.getStatus(),
      autoMock: mockSimulator.isEnabled(),
      leaderboard: leaderboardEngine.getCrowdSyncPayload(),
      queue: eventQueue.getStats()
    }
  });
});

// 2. POST /api/config - Cấu hình TikTok Live & Auto-Mock
app.post('/api/config', async (req, res) => {
  try {
    const { tiktokUsername, autoMock } = req.body;

    if (typeof autoMock === 'boolean') {
      if (autoMock) mockSimulator.start();
      else mockSimulator.stop();
    }

    if (typeof tiktokUsername === 'string') {
      await tiktokConnector.connect(tiktokUsername);
    }

    const newStatus = {
      connected: tiktokConnector.getStatus().connected,
      tiktokUsername: tiktokConnector.getStatus().tiktokUsername,
      autoMock: mockSimulator.isEnabled()
    };

    io.emit('server_status', newStatus);
    res.json({ success: true, data: newStatus });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. POST /api/mock/:type - Kích hoạt nhanh các sự kiện test từ Debug Panel
app.post('/api/mock/:type', (req, res) => {
  const { type } = req.params;
  try {
    mockSimulator.triggerTest(type.toUpperCase());
    res.json({ success: true, message: `Đã kích hoạt mock test: ${type}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. GET /api/tts - Proxy chuyển văn bản tiếng Việt sang audio stream (Google TTS)
app.get('/api/tts', (req, res) => {
  const text = req.query.text;
  if (!text) {
    return res.status(400).send('Thiếu tham số text');
  }

  const encodedText = encodeURIComponent(text.slice(0, 200));
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodedText}`;

  https.get(
    ttsUrl,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://translate.google.com/'
      }
    },
    (stream) => {
      if (stream.statusCode !== 200) {
        return res.status(502).send('Lỗi khi tải luồng TTS từ dịch vụ');
      }
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      stream.pipe(res);
    }
  ).on('error', (err) => {
    console.error('[TTS Proxy] Lỗi tải audio:', err.message);
    res.status(500).send('Không thể phát sinh giọng đọc TTS');
  });
});

// Catch-all route chuyển về index.html của public
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Bắt lỗi Server & EADDRINUSE
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Cổng ${PORT} đang bị chiếm dụng bởi tiến trình khác!`);
    console.error(`Vui lòng giải phóng cổng ${PORT} hoặc đổi PORT trong .env rồi thử lại.\n`);
  } else {
    console.error('Server error:', err);
  }
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🌸 PHẬT ĐIỆN VẠN NGƯỜI — TIKTOK LIVE INTERACTIVE 3D 🌸`);
  console.log(`🏛️  Chánh Điện Dâng Hương & Đám Đông Quỳ Lạy`);
  console.log(`🚀 Đang chạy tại: http://localhost:${PORT}`);
  console.log(`📱 Chế độ OBS:   http://localhost:${PORT}?obs=true`);
  console.log(`⚡ Auto-Mock:    ${mockSimulator.isEnabled() ? 'BẬT' : 'TẮT'}`);
  console.log(`======================================================\n`);
});

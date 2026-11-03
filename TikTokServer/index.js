/**
 * TikTokServer Entry Point
 * WebSocket Server (ws://localhost:8080) cho Unity C# & REST API /api/tts
 * Tuân thủ chuẩn UNITY_BLENDER_CODE_SCAFFOLD.md
 */

require('dotenv').config();
const http = require('http');
const https = require('https');
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');

const leaderboardEngine = require('./leaderboardEngine');
const mockSimulator = require('./mockSimulator');
const tiktokConnector = require('./tiktokConnector');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 8080;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Set();

function broadcast(eventType, data) {
  const message = JSON.stringify({ type: eventType, data });
  clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
}

// Khởi tạo TikTok Connector và Mock Simulator
tiktokConnector.init(broadcast, process.env.TIKTOK_USERNAME || '');
mockSimulator.init(broadcast, true);

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('[WebSocket Server] Unity/Web client kết nối. Tổng clients:', clients.size);

  // Gửi trạng thái ban đầu cho Unity
  ws.send(JSON.stringify({
    type: 'crowd_sync',
    data: leaderboardEngine.getCrowdSyncPayload()
  }));

  ws.on('close', () => {
    clients.delete(ws);
    console.log('[WebSocket Server] Client ngắt kết nối. Còn lại:', clients.size);
  });
});

// REST API Proxy Google TTS tiếng Việt cho Unity AudioSource
app.get('/api/tts', (req, res) => {
  const text = req.query.text;
  if (!text) return res.status(400).send('Missing text parameter');

  const encoded = encodeURIComponent(text.slice(0, 200));
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encoded}`;

  https.get(
    ttsUrl,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Referer: 'https://translate.google.com/'
      }
    },
    (stream) => {
      if (stream.statusCode !== 200) {
        return res.status(502).send('Error fetching TTS stream');
      }
      res.setHeader('Content-Type', 'audio/mpeg');
      stream.pipe(res);
    }
  ).on('error', (err) => {
    res.status(500).send(err.message);
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'ONLINE',
    wsPort: PORT,
    activeClients: clients.size,
    leaderboard: leaderboardEngine.getCrowdSyncPayload()
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🏛️ TIKTOK LIVE INTERACTIVE SERVER FOR UNITY & BLENDER`);
  console.log(`📡 WebSocket URL: ws://localhost:${PORT}`);
  console.log(`🎙️ TTS API URL:   http://localhost:${PORT}/api/tts?text=...`);
  console.log(`======================================================\n`);
});

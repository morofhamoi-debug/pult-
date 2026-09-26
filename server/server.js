import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { TVManager } from './tv/TVManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = process.env.PORT || 3000;

// Раздача PWA-статики
app.use(express.static(path.join(__dirname, '../')));

// Менеджер телевизоров
const tvManager = new TVManager();

// WebSocket
wss.on('connection', (ws) => {
  console.log('[WS] Client connected');

  // Отправляем текущее состояние
  ws.send(JSON.stringify({
    type: 'state',
    payload: {
      backend: true,
      devices: tvManager.discoveredDevices
    }
  }));

  ws.on('message', async (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch (_) {
      ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid JSON' } }));
      return;
    }
    await handleMessage(ws, msg);
  });

  ws.on('close', () => {
    console.log('[WS] Client disconnected');
  });
});

async function handleMessage(ws, msg) {
  const { type, payload } = msg;

  try {
    switch (type) {
      case 'scan:start': {
        ws.send(JSON.stringify({ type: 'scan:progress', payload: { message: 'Поиск…' } }));
        try {
          const devices = await tvManager.discover();
          if (devices.length === 0) {
            ws.send(JSON.stringify({ type: 'scan:empty' }));
          } else {
            ws.send(JSON.stringify({ type: 'scan:result', payload: { devices } }));
          }
        } catch (e) {
          ws.send(JSON.stringify({ type: 'scan:error', payload: { message: 'Ошибка поиска устройств' } }));
        }
        break;
      }

      case 'scan:stop': {
        tvManager.stopDiscovery();
        ws.send(JSON.stringify({ type: 'scan:stopped' }));
        break;
      }

      case 'device:connect': {
        const device = tvManager.discoveredDevices.find((d) => d.id === payload.deviceId);
        if (!device) {
          ws.send(JSON.stringify({ type: 'device:error', payload: { message: 'Устройство не найдено' } }));
          break;
        }
        try {
          await tvManager.connect(device.id);
          ws.send(JSON.stringify({
            type: 'device:connected',
            payload: { device: { ...device, connected: true } }
          }));
        } catch (e) {
          ws.send(JSON.stringify({
            type: 'device:error',
            payload: { message: e.message || 'Не удалось подключиться' }
          }));
        }
        break;
      }

      case 'tv:key': {
        try {
          await tvManager.sendKey(payload.key);
          // Если это громкость — запрашиваем обновлённое значение
          if (['VOLUP', 'VOLDOWN', 'MUTE'].includes(payload.key)) {
            const vol = await tvManager.getVolume();
            if (vol !== null) {
              ws.send(JSON.stringify({ type: 'tv:volume', payload: { volume: vol, muted: tvManager.isMuted } }));
            }
          }
        } catch (e) {
          ws.send(JSON.stringify({ type: 'tv:error', payload: { message: e.message } }));
        }
        break;
      }

      case 'tv:getInputs': {
        try {
          const inputs = await tvManager.getInputs();
          ws.send(JSON.stringify({ type: 'tv:inputs', payload: { inputs } }));
        } catch (e) {
          ws.send(JSON.stringify({ type: 'tv:inputs', payload: { inputs: [] } }));
        }
        break;
      }

      case 'tv:setInput': {
        try {
          await tvManager.setInput(payload.input);
        } catch (e) {
          ws.send(JSON.stringify({ type: 'tv:error', payload: { message: e.message } }));
        }
        break;
      }

      case 'tv:getApps': {
        try {
          const apps = await tvManager.getApps();
          ws.send(JSON.stringify({ type: 'tv:apps', payload: { apps } }));
        } catch (e) {
          ws.send(JSON.stringify({ type: 'tv:apps', payload: { apps: [] } }));
        }
        break;
      }

      case 'app:launch': {
        try {
          await tvManager.launchApp(payload.appId);
        } catch (e) {
          ws.send(JSON.stringify({ type: 'tv:error', payload: { message: e.message } }));
        }
        break;
      }

      case 'tv:text': {
        try {
          await tvManager.sendText(payload.text);
        } catch (e) {
          ws.send(JSON.stringify({ type: 'tv:error', payload: { message: e.message } }));
        }
        break;
      }

      case 'diagnostics:ping': {
        const t0 = Date.now();
        try {
          await tvManager.ping();
          ws.send(JSON.stringify({ type: 'diagnostics:pong', payload: { latency: Date.now() - t0 } }));
        } catch (_) {
          ws.send(JSON.stringify({ type: 'diagnostics:pong', payload: { latency: -1 } }));
        }
        break;
      }
    }
  } catch (e) {
    console.error('[WS] Handler error:', e);
    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Внутренняя ошибка сервера' } }));
  }
}

// Периодическая рассылка состояния
setInterval(() => {
  const state = tvManager.getState();
  const msg = JSON.stringify({ type: 'state:update', payload: state });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(msg);
  });
}, 2000);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[VEXA Gateway] Running on http://0.0.0.0:${PORT}`);
  console.log(`[VEXA Gateway] WebSocket: ws://0.0.0.0:${PORT}/ws`);
  console.log(`[VEXA Gateway] PWA: http://<your-ip>:${PORT}`);
});

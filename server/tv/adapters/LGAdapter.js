import { TVAdapter } from './TVAdapter.js';
import WebSocket from 'ws';

// SSAP-команды LG
const LG_KEYS = {
  POWER: 'POWER',
  VOLUP: 'VOLUMEUP',
  VOLDOWN: 'VOLUMEDOWN',
  MUTE: 'MUTE',
  UP: 'UP',
  DOWN: 'DOWN',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  ENTER: 'ENTER',
  HOME: 'HOME',
  BACK: 'BACK',
  MENU: 'MENU',
  EXIT: 'EXIT',
  SOURCE: 'INPUT_HUB',
  CHUP: 'CHANNELUP',
  CHDOWN: 'CHANNELDOWN',
  PLAY: 'PLAY',
  PAUSE: 'PAUSE',
  STOP: 'STOP',
  REWIND: 'REWIND',
  FORWARD: 'FASTFORWARD',
  DIGIT_0: '0', DIGIT_1: '1', DIGIT_2: '2', DIGIT_3: '3', DIGIT_4: '4',
  DIGIT_5: '5', DIGIT_6: '6', DIGIT_7: '7', DIGIT_8: '8', DIGIT_9: '9'
};

export class LGAdapter extends TVAdapter {
  constructor(device) {
    super(device);
    this.ws = null;
    this.connected = false;
    this.clientKey = null;
    this.requestId = 0;
    this.pendingRequests = new Map();
  }

  async connect() {
    // LG webOS использует WebSocket на порту 3000 (ws://)
    const url = `ws://${this.device.ip}:3000`;

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url, {
        handshakeTimeout: 10000
      });

      const timeout = setTimeout(() => {
        this.ws?.terminate();
        reject(new Error('Таймаут подключения к LG TV. Проверьте, что ТВ включён.'));
      }, 12000);

      this.ws.on('open', () => {
        clearTimeout(timeout);
        this.connected = true;
        // Отправляем handshake
        this.ws.send(JSON.stringify({
          id: ++this.requestId,
          type: 'register',
          payload: {
            forcePairing: false,
            pairingType: 'PROMPT',
            manifest: {
              manifestVersion: 1,
              appVersion: '1.1',
              signed: {
                created: '20240101',
                appId: 'com.vexa.remote',
                vendorId: 'com.vexa',
                localizedAppNames: { '': 'VEXA Remote' },
                localizedVendorNames: { '': 'VEXA' },
                permissions: ['TEST_SECURE', 'CONTROL_INPUT_TEXT', 'CONTROL_MOUSE_AND_KEYBOARD', 'READ_INSTALLED_APPS', 'READ_LGE_SDX', 'READ_NOTIFICATIONS', 'SEARCH', 'WRITE_SETTINGS', 'WRITE_NOTIFICATION_ALERT', 'CONTROL_POWER', 'READ_CURRENT_CHANNEL', 'READ_RUNNING_APPS', 'READ_UPDATE_INFO', 'UPDATE_FROM_REMOTE_APP', 'READ_TV_CURRENT_TIME'],
                serial: '2f930e2d2cfe083771f68e4fe7bb07'
              }
            }
          }
        }));
      });

      this.ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'registered') {
            this.clientKey = msg.payload['client-key'];
            resolve(true);
          }
          if (msg.id && this.pendingRequests.has(msg.id)) {
            const { resolve: res, reject: rej } = this.pendingRequests.get(msg.id);
            this.pendingRequests.delete(msg.id);
            if (msg.type === 'error') rej(new Error(msg.error));
            else res(msg.payload);
          }
        } catch (_) { /* ignore */ }
      });

      this.ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(new Error('Ошибка соединения с LG TV: ' + err.message));
      });

      this.ws.on('close', () => { this.connected = false; });
    });
  }

  async disconnect() {
    if (this.ws) { this.ws.close(); this.ws = null; }
    this.connected = false;
  }

  sendRequest(type, uri, payload = {}) {
    return new Promise((resolve, reject) => {
      if (!this.ws || !this.connected) { reject(new Error('Нет соединения с LG TV')); return; }
      const id = ++this.requestId;
      this.pendingRequests.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, type, uri, payload }));
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Таймаут запроса к LG TV'));
        }
      }, 8000);
    });
  }

  async sendKey(key) {
    // LG использует button input socket на том же WebSocket
    const lgKey = LG_KEYS[key] || key;
    await this.sendRequest('request', 'ssap://com.webos.service.networkinput/sendKey', { key: lgKey });
  }

  async getVolume() {
    const res = await this.sendRequest('request', 'ssap://audio/getVolume');
    return res.volume;
  }

  async getInputs() {
    try {
      const res = await this.sendRequest('request', 'ssap://tv/getExternalInputList');
      return (res.devices || []).map((d) => ({ id: d.id, label: d.label || d.id }));
    } catch (_) {
      return [
        { id: 'HDMI_1', label: 'HDMI 1' },
        { id: 'HDMI_2', label: 'HDMI 2' },
        { id: 'HDMI_3', label: 'HDMI 3' },
        { id: 'AV_1', label: 'AV' }
      ];
    }
  }

  async setInput(input) {
    await this.sendRequest('request', 'ssap://tv/switchInput', { inputId: input });
  }

  async getApps() {
    try {
      const res = await this.sendRequest('request', 'ssap://com.webos.applicationManager/listApps');
      return (res.apps || []).map((a) => ({ id: a.id, name: a.title }));
    } catch (_) {
      return [];
    }
  }

  async launchApp(appId) {
    await this.sendRequest('request', 'ssap://system.launcher/launch', { id: appId });
  }

  async sendText(text) {
    await this.sendRequest('request', 'ssap://com.webos.service.ime/sendEnterKey');
    await this.sendRequest('request', 'ssap://com.webos.service.ime/insertText', { text, replace: 0 });
  }

  async ping() {
    if (!this.ws || !this.connected) throw new Error('Нет соединения');
    return true;
  }
}

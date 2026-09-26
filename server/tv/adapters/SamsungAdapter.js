import { TVAdapter } from './TVAdapter.js';

// Команды Samsung TV (KEY_*)
const SAMSUNG_KEYS = {
  POWER: 'KEY_POWER',
  VOLUP: 'KEY_VOLUP',
  VOLDOWN: 'KEY_VOLDOWN',
  MUTE: 'KEY_MUTE',
  UP: 'KEY_UP',
  DOWN: 'KEY_DOWN',
  LEFT: 'KEY_LEFT',
  RIGHT: 'KEY_RIGHT',
  ENTER: 'KEY_ENTER',
  HOME: 'KEY_HOME',
  BACK: 'KEY_RETURN',
  MENU: 'KEY_MENU',
  EXIT: 'KEY_EXIT',
  SOURCE: 'KEY_SOURCE',
  GUIDE: 'KEY_GUIDE',
  CHUP: 'KEY_CHUP',
  CHDOWN: 'KEY_CHDOWN',
  CHLIST: 'KEY_CH_LIST',
  DIGIT_0: 'KEY_0',
  DIGIT_1: 'KEY_1',
  DIGIT_2: 'KEY_2',
  DIGIT_3: 'KEY_3',
  DIGIT_4: 'KEY_4',
  DIGIT_5: 'KEY_5',
  DIGIT_6: 'KEY_6',
  DIGIT_7: 'KEY_7',
  DIGIT_8: 'KEY_8',
  DIGIT_9: 'KEY_9',
  PLAY: 'KEY_PLAY',
  PAUSE: 'KEY_PAUSE',
  STOP: 'KEY_STOP',
  REWIND: 'KEY_REWIND',
  FORWARD: 'KEY_FF',
  CHANNEL_UP: 'KEY_CHUP',
  CHANNEL_DOWN: 'KEY_CHDOWN'
};

export class SamsungAdapter extends TVAdapter {
  constructor(device) {
    super(device);
    this.ws = null;
    this.token = null;
    this.connected = false;
  }

  async connect() {
    // Samsung использует WebSocket на порту 8002 (wss)
    const url = `wss://${this.device.ip}:8002/api/v2/channels/samsung.remote.control?name=${btoa('VEXA Remote')}`;

    return new Promise((resolve, reject) => {
      const WebSocket = require('ws');
      this.ws = new WebSocket(url, {
        rejectUnauthorized: false, // Samsung использует самоподписанный сертификат
        handshakeTimeout: 10000
      });

      const timeout = setTimeout(() => {
        this.ws?.terminate();
        reject(new Error('Таймаут подключения к Samsung TV. Проверьте, что ТВ включён и находится в той же сети.'));
      }, 12000);

      this.ws.on('open', () => {
        clearTimeout(timeout);
        this.connected = true;
        // Отправляем запрос на pairing
        this.ws.send(JSON.stringify({
          method: 'ms.channel.emit',
          params: {
            event: 'ed.installedApp.get',
            to: 'host'
          }
        }));
      });

      this.ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          // Ответ на pairing содержит токен
          if (msg.data && msg.data.token) {
            this.token = msg.data.token;
            resolve(true);
          }
          // Если ТВ уже спарен, подключение считается успешным
          if (msg.event === 'ms.channel.connect') {
            resolve(true);
          }
        } catch (_) { /* ignore */ }
      });

      this.ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(new Error('Ошибка соединения с Samsung TV: ' + err.message));
      });

      this.ws.on('close', () => {
        this.connected = false;
      });

      // Если ответа нет, но соединение открылось — считаем успехом
      setTimeout(() => {
        if (this.connected) resolve(true);
      }, 5000);
    });
  }

  async disconnect() {
    if (this.ws) { this.ws.close(); this.ws = null; }
    this.connected = false;
  }

  async sendKey(key) {
    if (!this.ws || !this.connected) throw new Error('Нет соединения с Samsung TV');
    const samsungKey = SAMSUNG_KEYS[key] || key;
    this.ws.send(JSON.stringify({
      method: 'ms.remote.control',
      params: {
        Cmd: 'Click',
        DataOfCmd: samsungKey,
        Option: 'false',
        TypeOfRemote: 'SendRemoteKey'
      }
    }));
  }

  async getVolume() {
    // Samsung не возвращает громкость через WebSocket напрямую.
    // Можно попробовать REST API на порту 8002.
    return null;
  }

  async getInputs() {
    // REST API: http://IP:8002/api/v2/... 
    // Упрощённо — возвращаем стандартные источники
    return [
      { id: 'TV', label: 'TV' },
      { id: 'HDMI1', label: 'HDMI 1' },
      { id: 'HDMI2', label: 'HDMI 2' },
      { id: 'HDMI3', label: 'HDMI 3' },
      { id: 'AV', label: 'AV' },
      { id: 'USB', label: 'USB' }
    ];
  }

  async setInput(input) {
    await this.sendKey(input === 'TV' ? 'KEY_TV' : `KEY_${input}`);
  }

  async getApps() {
    return [
      { id: 'youtube', name: 'YouTube' },
      { id: 'netflix', name: 'Netflix' },
      { id: 'prime', name: 'Prime Video' }
    ];
  }

  async launchApp(appId) {
    // Запуск приложения через SmartThings API требует токена.
    // Упрощённо: отправляем KEY_HOME и пользователь выбирает вручную.
    throw new Error('Запуск приложений на Samsung TV требует SmartThings API-токена. Эта функция не поддерживается в текущей реализации.');
  }

  async sendText(text) {
    throw new Error('Samsung TV не поддерживает ввод текста через WebSocket API.');
  }

  async ping() {
    if (!this.ws || !this.connected) throw new Error('Нет соединения');
    return true;
  }
}

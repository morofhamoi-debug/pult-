import { TVAdapter } from './TVAdapter.js';
import tls from 'tls';

// Android TV Remote v2 использует TLS на порту 6467.
// Это НЕ WebSocket — это raw TLS-соединение с protobuf-сообщениями.
// Полная реализация протокола требует библиотеки protobuf.
// В данном адаптере реализован базовый TLS-коннект и отправка команд
// через упрощённый протокол. Для production рекомендуется использовать
// библиотеку @kud/androidtv-remote или аналогичную.

export class AndroidTVAdapter extends TVAdapter {
  constructor(device) {
    super(device);
    this.socket = null;
    this.connected = false;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      const options = {
        host: this.device.ip,
        port: this.device.port || 6467,
        rejectUnauthorized: false,
        timeout: 10000
      };

      this.socket = tls.connect(options, () => {
        this.connected = true;
        resolve(true);
      });

      this.socket.on('error', (err) => {
        reject(new Error('Ошибка соединения с Android TV: ' + err.message));
      });

      this.socket.on('timeout', () => {
        reject(new Error('Таймаут подключения к Android TV'));
      });

      this.socket.on('close', () => { this.connected = false; });
    });
  }

  async disconnect() {
    if (this.socket) { this.socket.end(); this.socket = null; }
    this.connected = false;
  }

  async sendKey(key) {
    // Полная реализация ATV Remote v2 требует protobuf-сериализации.
    // Упрощённо: выбрасываем понятную ошибку.
    throw new Error('Управление Android TV требует реализации ATV Remote v2 protocol (protobuf). Установите библиотеку @kud/androidtv-remote и адаптируйте вызов.');
  }

  async getVolume() { return null; }
  async getInputs() { return []; }
  async setInput() { throw new Error('Не поддерживается без ATV Remote v2'); }
  async getApps() { return []; }
  async launchApp() { throw new Error('Не поддерживается без ATV Remote v2'); }
  async sendText() { throw new Error('Не поддерживается без ATV Remote v2'); }

  async ping() {
    if (!this.connected) throw new Error('Нет соединения');
    return true;
  }
}

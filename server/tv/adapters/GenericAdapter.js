import { TVAdapter } from './TVAdapter.js';

export class GenericAdapter extends TVAdapter {
  constructor(device) {
    super(device);
    this.connected = false;
  }

  async connect() {
    // Для Generic TV пробуем простой HTTP-пинг
    const fetch = (await import('node-fetch')).default;
    try {
      const res = await fetch(`http://${this.device.ip}`, { timeout: 5000 });
      this.connected = res.ok;
      if (!res.ok) throw new Error('Устройство не отвечает');
    } catch (e) {
      throw new Error('Не удалось подключиться к устройству. Возможно, оно не поддерживает управление по Wi-Fi.');
    }
  }

  async disconnect() { this.connected = false; }
  async sendKey() { throw new Error('Эта функция не поддерживается вашим телевизором'); }
  async getVolume() { return null; }
  async getInputs() { return []; }
  async setInput() { throw new Error('Не поддерживается'); }
  async getApps() { return []; }
  async launchApp() { throw new Error('Не поддерживается'); }
  async sendText() { throw new Error('Не поддерживается'); }
  async ping() { return this.connected; }
}

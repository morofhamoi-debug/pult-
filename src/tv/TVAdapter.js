// Базовый класс адаптера телевизора.
// Все адаптеры работают на backend-шлюзе.
// Frontend получает состояние через WebSocket и отправляет команды.

export class TVAdapter {
  constructor(device) {
    this.device = device;
    this.connected = false;
    this.capabilities = {
      power: false,
      volume: false,
      mute: false,
      navigation: false,
      digits: false,
      channels: false,
      media: false,
      inputs: false,
      apps: false,
      textInput: false,
      wakeOnLan: false
    };
  }

  async connect() { throw new Error('Not implemented'); }
  async disconnect() { throw new Error('Not implemented'); }
  async sendKey(key) { throw new Error('Not implemented'); }
  async setVolume(level) { throw new Error('Not implemented'); }
  async mute() { throw new Error('Not implemented'); }
  async getVolume() { throw new Error('Not implemented'); }
  async getInputs() { throw new Error('Not implemented'); }
  async setInput(input) { throw new Error('Not implemented'); }
  async getApps() { throw new Error('Not implemented'); }
  async launchApp(appId) { throw new Error('Not implemented'); }
  async sendText(text) { throw new Error('Not implemented'); }
}

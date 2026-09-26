// Базовый класс адаптера для backend
export class TVAdapter {
  constructor(device) {
    this.device = device;
    this.connected = false;
  }

  async connect() { throw new Error('Not implemented'); }
  async disconnect() { throw new Error('Not implemented'); }
  async sendKey(key) { throw new Error('Not implemented'); }
  async getVolume() { throw new Error('Not implemented'); }
  async getInputs() { throw new Error('Not implemented'); }
  async setInput(input) { throw new Error('Not implemented'); }
  async getApps() { throw new Error('Not implemented'); }
  async launchApp(appId) { throw new Error('Not implemented'); }
  async sendText(text) { throw new Error('Not implemented'); }
  async ping() { throw new Error('Not implemented'); }
}

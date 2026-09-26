import { TVAdapter } from './TVAdapter.js';

export class SamsungAdapter extends TVAdapter {
  constructor(device) {
    super(device);
    this.capabilities = {
      power: true,
      volume: true,
      mute: true,
      navigation: true,
      digits: true,
      channels: true,
      media: true,
      inputs: true,
      apps: true,
      textInput: false, // Samsung не поддерживает text input через WebSocket
      wakeOnLan: true   // Только если ТВ был включён хотя бы раз и поддерживает WoL
    };
  }

  static get brand() { return 'Samsung'; }
  static get discoveryMethod() { return 'SSDP'; }
  static get protocol() { return 'WebSocket (wss://IP:8002)'; }
  static get pairingNote() {
    return 'При первом подключении на экране ТВ появится запрос разрешения. Нажмите «Разрешить».';
  }
}

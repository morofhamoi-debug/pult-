import { TVAdapter } from './TVAdapter.js';

export class LGAdapter extends TVAdapter {
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
      textInput: true,  // LG поддерживает ввод текста через SSAP
      wakeOnLan: true
    };
  }

  static get brand() { return 'LG'; }
  static get discoveryMethod() { return 'SSDP'; }
  static get protocol() { return 'SSAP WebSocket (ws://IP:3000)'; }
  static get pairingNote() {
    return 'При первом подключении на экране ТВ появится запрос разрешения. Нажмите «Принять».';
  }
}

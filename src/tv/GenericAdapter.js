import { TVAdapter } from './TVAdapter.js';

export class GenericAdapter extends TVAdapter {
  constructor(device) {
    super(device);
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

  static get brand() { return 'Универсальный'; }
  static get discoveryMethod() { return 'UPnP'; }
  static get protocol() { return 'REST / UPnP'; }
  static get pairingNote() {
    return 'Данный телевизор может не поддерживать управление по Wi-Fi. Проверьте документацию производителя.';
  }
}

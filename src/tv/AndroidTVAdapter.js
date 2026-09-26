import { TVAdapter } from './TVAdapter.js';

export class AndroidTVAdapter extends TVAdapter {
  constructor(device) {
    super(device);
    this.capabilities = {
      power: true,
      volume: true,
      mute: true,
      navigation: true,
      digits: true,
      channels: false, // Android TV не имеет классических каналов
      media: true,
      inputs: true,
      apps: true,
      textInput: true, // Через remote service v2
      wakeOnLan: false
    };
  }

  static get brand() { return 'Android TV'; }
  static get discoveryMethod() { return 'mDNS (_androidtvremote2._tcp)'; }
  static get protocol() { return 'TLS :6467 (ATV Remote v2)'; }
  static get pairingNote() {
    return 'На экране ТВ появится 6-значный код. Введите его в приложении.';
  }
}

import { SamsungAdapter } from './adapters/SamsungAdapter.js';
import { LGAdapter } from './adapters/LGAdapter.js';
import { AndroidTVAdapter } from './adapters/AndroidTVAdapter.js';
import { GenericAdapter } from './adapters/GenericAdapter.js';
import { discoverSSDP } from './discovery/ssdp.js';
import { discoverMDNS } from './discovery/mdns.js';

const ADAPTER_MAP = {
  samsung: SamsungAdapter,
  lg: LGAdapter,
  androidtv: AndroidTVAdapter,
  googletv: AndroidTVAdapter,
  generic: GenericAdapter
};

export class TVManager {
  constructor() {
    this.discoveredDevices = [];
    this.activeAdapter = null;
    this.activeDevice = null;
    this.isMuted = false;
  }

  async discover() {
    this.discoveredDevices = [];

    // SSDP — Samsung, LG, UPnP-устройства
    try {
      const ssdpDevices = await discoverSSDP(5000);
      ssdpDevices.forEach((d) => {
        if (!this.discoveredDevices.find((x) => x.ip === d.ip)) {
          this.discoveredDevices.push(d);
        }
      });
    } catch (_) { /* SSDP может быть недоступен */ }

    // mDNS — Android TV / Google TV
    try {
      const mdnsDevices = await discoverMDNS(5000);
      mdnsDevices.forEach((d) => {
        if (!this.discoveredDevices.find((x) => x.ip === d.ip)) {
          this.discoveredDevices.push(d);
        }
      });
    } catch (_) { /* mDNS может быть недоступен */ }

    return this.discoveredDevices;
  }

  stopDiscovery() {
    // Прерывание сканирования реализуется через флаг в discover-функциях
    // (упрощённо: сбрасываем массив)
  }

  async connect(deviceId) {
    const device = this.discoveredDevices.find((d) => d.id === deviceId);
    if (!device) throw new Error('Устройство не найдено');

    const AdapterClass = ADAPTER_MAP[device.brand] || GenericAdapter;
    const adapter = new AdapterClass(device);

    try {
      await adapter.connect();
      this.activeAdapter = adapter;
      this.activeDevice = device;
      return true;
    } catch (e) {
      throw new Error(e.message || 'Ошибка подключения к телевизору');
    }
  }

  async sendKey(key) {
    if (!this.activeAdapter) throw new Error('Нет активного подключения');
    return this.activeAdapter.sendKey(key);
  }

  async getVolume() {
    if (!this.activeAdapter) return null;
    try {
      return await this.activeAdapter.getVolume();
    } catch (_) {
      return null;
    }
  }

  async getInputs() {
    if (!this.activeAdapter) throw new Error('Нет активного подключения');
    return this.activeAdapter.getInputs();
  }

  async setInput(input) {
    if (!this.activeAdapter) throw new Error('Нет активного подключения');
    return this.activeAdapter.setInput(input);
  }

  async getApps() {
    if (!this.activeAdapter) throw new Error('Нет активного подключения');
    return this.activeAdapter.getApps();
  }

  async launchApp(appId) {
    if (!this.activeAdapter) throw new Error('Нет активного подключения');
    return this.activeAdapter.launchApp(appId);
  }

  async sendText(text) {
    if (!this.activeAdapter) throw new Error('Нет активного подключения');
    return this.activeAdapter.sendText(text);
  }

  async ping() {
    if (!this.activeAdapter) throw new Error('Нет подключения');
    return this.activeAdapter.ping();
  }

  getState() {
    return {
      connected: !!this.activeAdapter,
      device: this.activeDevice ? { id: this.activeDevice.id, name: this.activeDevice.name, brand: this.activeDevice.brand } : null,
      muted: this.isMuted
    };
  }
}

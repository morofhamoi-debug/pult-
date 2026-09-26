// Центральное хранилище состояния приложения
export const State = {
  screen: 'welcome',           // welcome | scanning | devices | connecting | remote | settings | diagnostics
  devices: [],                 // обнаруженные устройства
  selectedDevice: null,        // выбранное устройство
  connectedDevice: null,       // подключённое устройство
  connectionStatus: 'disconnected', // disconnected | connecting | connected | error
  volume: null,
  muted: false,
  theme: 'system',             // system | light | dark | oled
  vibration: true,
  autoConnect: true,
  language: 'ru',
  knownDevices: [],            // сохранённые устройства
  diagnostics: {
    wifi: null,
    https: null,
    pwa: null,
    localNetworkApi: null,
    backend: null,
    tvApi: null,
    tvFound: null,
    latency: null
  },
  gestureMode: false,
  error: null
};

const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setState(patch) {
  Object.assign(State, patch);
  listeners.forEach((fn) => fn(State));
}

export function loadPersistedState() {
  try {
    const raw = localStorage.getItem('vexa_state');
    if (raw) {
      const saved = JSON.parse(raw);
      State.theme = saved.theme || 'system';
      State.vibration = saved.vibration !== false;
      State.autoConnect = saved.autoConnect !== false;
      State.language = saved.language || 'ru';
      State.knownDevices = saved.knownDevices || [];
    }
  } catch (_) { /* ignore */ }
}

export function persistState() {
  const data = {
    theme: State.theme,
    vibration: State.vibration,
    autoConnect: State.autoConnect,
    language: State.language,
    knownDevices: State.knownDevices.map((d) => ({
      id: d.id,
      name: d.name,
      brand: d.brand,
      ip: d.ip,
      model: d.model,
      lastConnected: d.lastConnected
    }))
  };
  localStorage.setItem('vexa_state', JSON.stringify(data));
}

export function addKnownDevice(device) {
  const exists = State.knownDevices.find((d) => d.id === device.id);
  if (exists) {
    Object.assign(exists, { ...device, lastConnected: Date.now() });
  } else {
    State.knownDevices.push({ ...device, lastConnected: Date.now() });
  }
  persistState();
}

export function removeKnownDevice(id) {
  State.knownDevices = State.knownDevices.filter((d) => d.id !== id);
  persistState();
}

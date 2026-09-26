import { State, subscribe, setState, loadPersistedState, persistState, addKnownDevice } from './state.js';
import { registerRoute, navigate } from './router.js';
import { renderWelcome, renderScanning, renderDeviceList, renderConnecting, showToast } from './ui/devices.js';
import { renderRemote } from './ui/remote.js';
import { renderSettings, applyTheme } from './ui/settings.js';
import { renderDiagnostics } from './ui/diagnostics.js';

// --- Инициализация ---
loadPersistedState();
applyTheme(State.theme);

// Регистрация маршрутов
registerRoute('welcome', renderWelcome);
registerRoute('scanning', renderScanning);
registerRoute('devices', renderDeviceList);
registerRoute('connecting', renderConnecting);
registerRoute('remote', renderRemote);
registerRoute('settings', renderSettings);
registerRoute('diagnostics', renderDiagnostics);

// --- Подключение к локальному шлюзу ---
// Адрес шлюза можно задать через localStorage или query-параметр.
// По умолчанию — текущий хост (если PWA отдаётся с того же компьютера).
const GATEWAY_URL = localStorage.getItem('vexa_gateway_url') || window.location.origin.replace(/^http/, 'ws');
window._vexaGatewayUrl = GATEWAY_URL;

let reconnectTimer = null;
let ws = null;

function connectToGateway() {
  try {
    ws = new WebSocket(`${GATEWAY_URL}/ws`);
  } catch (e) {
    showToast('Не удалось подключиться к локальному шлюзу. Убедитесь, что backend запущен.');
    return;
  }

  window._vexaWs = ws;

  ws.onopen = () => {
    console.log('[VEXA] Gateway connected');
    setState({ diagnostics: { ...State.diagnostics, backend: true } });
    clearTimeout(reconnectTimer);

    // Автоподключение к последнему устройству
    if (State.autoConnect && State.knownDevices.length > 0) {
      const last = State.knownDevices[State.knownDevices.length - 1];
      setState({ selectedDevice: last });
      ws.send(JSON.stringify({
        type: 'device:connect',
        payload: { deviceId: last.id, ip: last.ip, brand: last.brand }
      }));
    }
  };

  ws.onmessage = (event) => {
    let msg;
    try { msg = JSON.parse(event.data); } catch (_) { return; }
    handleGatewayMessage(msg);
  };

  ws.onclose = () => {
    console.warn('[VEXA] Gateway disconnected');
    setState({ diagnostics: { ...State.diagnostics, backend: false } });
    setState({ connectionStatus: 'disconnected' });
    // Переподключение через 3 секунды
    reconnectTimer = setTimeout(connectToGateway, 3000);
  };

  ws.onerror = () => {
    // onclose сработает следом
  };
}

function handleGatewayMessage(msg) {
  switch (msg.type) {
    case 'scan:result':
      setState({ devices: msg.payload.devices });
      if (State.screen === 'scanning') navigate('devices');
      break;

    case 'scan:empty':
      setState({ devices: [] });
      if (State.screen === 'scanning') navigate('devices');
      break;

    case 'scan:error':
      showToast(msg.payload.message || 'Ошибка поиска');
      if (State.screen === 'scanning') navigate('devices');
      break;

    case 'device:connected':
      setState({
        connectionStatus: 'connected',
        connectedDevice: msg.payload.device,
        selectedDevice: msg.payload.device
      });
      addKnownDevice(msg.payload.device);
      if (State.screen === 'connecting') {
        navigate('remote');
        showToast(`Телевизор подключён: ${msg.payload.device.name || msg.payload.device.brand}`);
      }
      break;

    case 'device:error':
      showToast(msg.payload.message || 'Не удалось подключиться к телевизору');
      setState({ connectionStatus: 'error' });
      if (State.screen === 'connecting') navigate('devices');
      break;

    case 'tv:volume':
      setState({ volume: msg.payload.volume, muted: msg.payload.muted });
      updateVolumeUI(msg.payload.volume);
      break;

    case 'tv:inputs':
      updateInputsList(msg.payload.inputs);
      break;

    case 'tv:apps':
      updateAppsList(msg.payload.apps);
      break;

    case 'tv:disconnected':
      setState({ connectionStatus: 'disconnected' });
      showToast('Соединение с телевизором потеряно');
      break;

    case 'tv:error':
      showToast(msg.payload.message || 'Функция не поддерживается вашим телевизором');
      break;
  }
}

function updateVolumeUI(volume) {
  const bar = document.getElementById('volume-bar');
  const display = document.getElementById('volume-display');
  if (bar) bar.style.width = `${volume}%`;
  if (display) display.textContent = `Volume ${volume}`;
}

function updateInputsList(inputs) {
  const list = document.getElementById('inputs-list');
  if (!list) return;
  if (!inputs || inputs.length === 0) {
    list.innerHTML = '<p class="overlay-hint">Телевизор не сообщил доступные источники.</p>';
    return;
  }
  list.innerHTML = inputs.map((inp) => `
    <button class="input-item" data-input="${inp.id}">
      ${inp.label || inp.id}
    </button>
  `).join('');
  list.querySelectorAll('.input-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (window._vexaWs) {
        window._vexaWs.send(JSON.stringify({ type: 'tv:setInput', payload: { input: btn.dataset.input } }));
      }
      document.getElementById('overlay-active')?.remove();
    });
  });
}

function updateAppsList(apps) {
  const list = document.getElementById('apps-list');
  if (!list) return;
  if (!apps || apps.length === 0) {
    list.innerHTML = '<p class="overlay-hint">Телевизор не сообщил список приложений.</p>';
    return;
  }
  list.innerHTML = apps.map((app) => `
    <button class="app-item" data-app="${app.id}">
      ${app.name || app.id}
    </button>
  `).join('');
  list.querySelectorAll('.app-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (window._vexaWs) {
        window._vexaWs.send(JSON.stringify({ type: 'app:launch', payload: { appId: btn.dataset.app } }));
      }
      document.getElementById('overlay-active')?.remove();
    });
  });
}

// --- Диагностика ---
function collectDiagnostics() {
  const diag = { ...State.diagnostics };
  diag.wifi = 'navigator.connection' in navigator ? (navigator.connection.type || 'unknown') : 'unknown';
  diag.https = window.location.protocol === 'https:';
  diag.pwa = window.matchMedia('(display-mode: standalone)').matches;
  diag.localNetworkApi = 'нет (требуется backend)';
  diag.backend = ws && ws.readyState === WebSocket.OPEN;
  diag.tvApi = State.connectionStatus === 'connected';
  diag.tvFound = State.devices.length > 0;
  diag.latency = null;
  setState({ diagnostics: diag });
}

// --- Запуск ---
collectDiagnostics();
navigate('welcome');
connectToGateway();

// Периодическое обновление диагностики
setInterval(collectDiagnostics, 5000);

// Регистрация Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  });
}

// Обработка кнопки «Назад» в браузере
window.addEventListener('popstate', () => {
  if (State.screen === 'settings' || State.screen === 'diagnostics') navigate('remote');
  else if (State.screen === 'remote') navigate('welcome');
});

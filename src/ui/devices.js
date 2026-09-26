import { State, setState, addKnownDevice } from '../state.js';
import { navigate } from '../router.js';

// Рендер экрана приветствия
export function renderWelcome(container) {
  container.innerHTML = `
    <div class="screen welcome-screen">
      <div class="welcome-content">
        <div class="logo-mark">
          <svg width="80" height="80" viewBox="0 0 24 24" class="logo-icon">
            <use href="#icon-tv"></use>
          </svg>
        </div>
        <h1 class="app-title">VEXA Remote</h1>
        <p class="app-subtitle">Умный пульт для вашего телевизора</p>
        <div class="welcome-note">
          <p>Подключите телевизор к той же Wi-Fi сети, что и ваш iPhone.</p>
        </div>
        <button class="btn btn-primary btn-large" id="btn-find-tv">
          <svg width="20" height="20"><use href="#icon-tv"></use></svg>
          Найти телевизор
        </button>
        ${State.knownDevices.length > 0 ? `
          <div class="known-devices-section">
            <h3>Мои телевизоры</h3>
            ${State.knownDevices.map((d) => `
              <div class="known-device-card" data-id="${d.id}">
                <svg width="24" height="24"><use href="#icon-tv"></use></svg>
                <div class="known-device-info">
                  <span class="known-device-name">${d.name || d.brand}</span>
                  <span class="known-device-ip">${d.ip}</span>
                </div>
                <button class="btn btn-small btn-ghost reconnect-btn" data-id="${d.id}">Подключиться</button>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
      <footer class="welcome-footer">
        <p class="version-text">VEXA Remote v1.0</p>
      </footer>
    </div>
  `;

  document.getElementById('btn-find-tv').addEventListener('click', () => {
    navigate('scanning');
  });

  container.querySelectorAll('.reconnect-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const device = State.knownDevices.find((d) => d.id === id);
      if (device) {
        setState({ selectedDevice: device });
        navigate('connecting');
      }
    });
  });
}

// Экран сканирования
export function renderScanning(container) {
  container.innerHTML = `
    <div class="screen scanning-screen">
      <div class="scanning-content">
        <div class="radar-container">
          <div class="radar-ring radar-ring-1"></div>
          <div class="radar-ring radar-ring-2"></div>
          <div class="radar-ring radar-ring-3"></div>
          <div class="radar-center">
            <svg width="40" height="40"><use href="#icon-tv"></use></svg>
          </div>
        </div>
        <h2 class="scanning-title">Ищем телевизоры рядом</h2>
        <p class="scanning-hint">Убедитесь, что iPhone и телевизор подключены к одной Wi-Fi сети</p>
        <div class="scanning-status" id="scan-status">Поиск через локальный шлюз…</div>
        <button class="btn btn-secondary" id="btn-stop-scan">Остановить поиск</button>
      </div>
    </div>
  `;

  const stopBtn = document.getElementById('btn-stop-scan');
  stopBtn.addEventListener('click', () => {
    if (window._vexaWs) window._vexaWs.send(JSON.stringify({ type: 'scan:stop' }));
    navigate('welcome');
  });
}

// Экран результатов поиска
export function renderDeviceList(container) {
  const devices = State.devices;

  if (devices.length === 0) {
    container.innerHTML = `
      <div class="screen devices-screen">
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="64" height="64"><use href="#icon-tv"></use></svg>
          </div>
          <h2>Телевизор не найден</h2>
          <p class="empty-hint">Проверьте, что телевизор включён и находится в той же Wi-Fi сети, что и ваш iPhone.</p>
          <div class="empty-actions">
            <button class="btn btn-primary" id="btn-retry">Повторить поиск</button>
            <button class="btn btn-ghost" id="btn-how-to">Как подключить?</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-retry').addEventListener('click', () => navigate('scanning'));
    document.getElementById('btn-how-to').addEventListener('click', () => {
      showToast('Откройте настройки роутера и убедитесь, что устройства не изолированы друг от друга (AP Isolation выключен).');
    });
    return;
  }

  container.innerHTML = `
    <div class="screen devices-screen">
      <div class="screen-header">
        <button class="btn-icon" id="btn-back-devices" aria-label="Назад">
          <svg width="22" height="22"><use href="#icon-arrow-left"></use></svg>
        </button>
        <h2>Найденные телевизоры</h2>
        <div style="width:40px"></div>
      </div>
      <div class="devices-list">
        ${devices.map((d, i) => `
          <div class="device-card" style="animation-delay:${i * 80}ms" data-id="${d.id}">
            <div class="device-card-icon">
              <svg width="28" height="28"><use href="#icon-tv"></use></svg>
            </div>
            <div class="device-card-info">
              <span class="device-card-name">${d.name || d.brand}</span>
              <span class="device-card-brand">${d.brand}</span>
              <span class="device-card-ip">${d.ip}</span>
            </div>
            <div class="device-card-status">
              <span class="status-dot status-available"></span>
              <span class="status-label">Доступен</span>
            </div>
            <button class="btn btn-small btn-primary connect-btn" data-id="${d.id}">Подключить</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  document.getElementById('btn-back-devices').addEventListener('click', () => navigate('welcome'));

  container.querySelectorAll('.connect-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const device = State.devices.find((d) => d.id === id);
      if (device) {
        setState({ selectedDevice: device });
        navigate('connecting');
      }
    });
  });
}

// Экран подключения
export function renderConnecting(container) {
  const device = State.selectedDevice;
  if (!device) { navigate('welcome'); return; }

  container.innerHTML = `
    <div class="screen connecting-screen">
      <div class="connecting-content">
        <div class="spinner-lg"></div>
        <h2>Подключение к телевизору…</h2>
        <p class="connecting-device-name">${device.name || device.brand}</p>
        <p class="connecting-note">${device.pairingNote || 'При необходимости разрешите подключение на экране телевизора.'}</p>
        <button class="btn btn-ghost" id="btn-cancel-connect">Отмена</button>
      </div>
    </div>
  `;

  document.getElementById('btn-cancel-connect').addEventListener('click', () => {
    navigate('devices');
  });

  // Отправляем команду подключения через WebSocket
  if (window._vexaWs && window._vexaWs.readyState === WebSocket.OPEN) {
    window._vexaWs.send(JSON.stringify({
      type: 'device:connect',
      payload: { deviceId: device.id, ip: device.ip, brand: device.brand }
    }));
  } else {
    showToast('Нет соединения с локальным шлюзом. Убедитесь, что backend запущен.');
    navigate('devices');
  }
}

// Вспомогательная функция toast
export function showToast(message, duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-visible'));
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

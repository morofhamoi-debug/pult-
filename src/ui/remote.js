import { State, setState, addKnownDevice } from '../state.js';
import { navigate } from '../router.js';
import { showToast } from './devices.js';

// Главный экран пульта
export function renderRemote(container) {
  const device = State.connectedDevice || State.selectedDevice;
  if (!device) { navigate('welcome'); return; }

  const connected = State.connectionStatus === 'connected';

  container.innerHTML = `
    <div class="screen remote-screen">
      <header class="remote-header">
        <button class="btn-icon" id="btn-back-remote" aria-label="Назад">
          <svg width="22" height="22"><use href="#icon-arrow-left"></use></svg>
        </button>
        <div class="remote-header-info">
          <span class="remote-device-name">${device.name || device.brand}</span>
          <span class="connection-badge ${connected ? 'connected' : 'disconnected'}">
            <span class="status-dot ${connected ? 'status-connected' : 'status-disconnected'}"></span>
            ${connected ? 'Подключено' : 'Отключено'}
          </span>
        </div>
        <button class="btn-icon" id="btn-settings-remote" aria-label="Настройки">
          <svg width="22" height="22"><use href="#icon-settings"></use></svg>
        </button>
      </header>

      <div class="remote-body">
        <!-- Power -->
        <div class="remote-section power-section">
          <button class="btn-power" id="btn-power" aria-label="Питание">
            <svg width="28" height="28"><use href="#icon-power"></use></svg>
          </button>
        </div>

        <!-- Volume -->
        <div class="remote-section volume-section">
          <div class="volume-display" id="volume-display">
            ${State.volume !== null ? `Volume ${State.volume}` : '—'}
          </div>
          <div class="volume-bar-container">
            <div class="volume-bar" id="volume-bar" style="width:${State.volume || 0}%"></div>
          </div>
          <div class="volume-controls">
            <button class="btn-round" id="btn-vol-up" aria-label="Громкость +">
              <svg width="22" height="22"><use href="#icon-volume-up"></use></svg>
            </button>
            <button class="btn-round" id="btn-mute" aria-label="Без звука">
              <svg width="22" height="22"><use href="#icon-mute"></use></svg>
            </button>
            <button class="btn-round" id="btn-vol-down" aria-label="Громкость −">
              <svg width="22" height="22"><use href="#icon-volume-down"></use></svg>
            </button>
          </div>
        </div>

        <!-- D-Pad -->
        <div class="remote-section dpad-section">
          <div class="dpad" id="dpad">
            <button class="dpad-btn dpad-up" data-key="UP" aria-label="Вверх">
              <svg width="20" height="20"><use href="#icon-arrow-up"></use></svg>
            </button>
            <button class="dpad-btn dpad-left" data-key="LEFT" aria-label="Влево">
              <svg width="20" height="20"><use href="#icon-arrow-left"></use></svg>
            </button>
            <button class="dpad-btn dpad-ok" data-key="ENTER" aria-label="OK">OK</button>
            <button class="dpad-btn dpad-right" data-key="RIGHT" aria-label="Вправо">
              <svg width="20" height="20"><use href="#icon-arrow-right"></use></svg>
            </button>
            <button class="dpad-btn dpad-down" data-key="DOWN" aria-label="Вниз">
              <svg width="20" height="20"><use href="#icon-arrow-down"></use></svg>
            </button>
          </div>
        </div>

        <!-- Navigation buttons -->
        <div class="remote-section nav-buttons-section">
          <button class="btn-nav" data-key="HOME">
            <svg width="18" height="18"><use href="#icon-home"></use></svg>
            <span>Home</span>
          </button>
          <button class="btn-nav" data-key="BACK">
            <svg width="18" height="18"><use href="#icon-back"></use></svg>
            <span>Back</span>
          </button>
          <button class="btn-nav" data-key="MENU">
            <svg width="18" height="18"><use href="#icon-settings"></use></svg>
            <span>Menu</span>
          </button>
          <button class="btn-nav" data-key="EXIT">
            <svg width="18" height="18"><use href="#icon-power"></use></svg>
            <span>Exit</span>
          </button>
        </div>

        <!-- Channel -->
        <div class="remote-section channel-section">
          <button class="btn-channel" data-key="CHUP">
            <svg width="18" height="18"><use href="#icon-channel-up"></use></svg>
            <span>CH +</span>
          </button>
          <button class="btn-channel" data-key="CHDOWN">
            <svg width="18" height="18"><use href="#icon-channel-down"></use></svg>
            <span>CH −</span>
          </button>
        </div>

        <!-- Quick actions -->
        <div class="remote-section quick-actions-section">
          <button class="btn-quick" data-action="youtube">YouTube</button>
          <button class="btn-quick" data-action="netflix">Netflix</button>
          <button class="btn-quick" data-action="input">HDMI</button>
          <button class="btn-quick" data-action="mute">Mute</button>
          <button class="btn-quick" data-action="guide">Guide</button>
        </div>

        <!-- Bottom tools -->
        <div class="remote-section tools-section">
          <button class="btn-tool" id="btn-keypad">
            <svg width="20" height="20"><use href="#icon-keyboard"></use></svg>
            <span>Цифры</span>
          </button>
          <button class="btn-tool" id="btn-media">
            <svg width="20" height="20"><use href="#icon-play"></use></svg>
            <span>Медиа</span>
          </button>
          <button class="btn-tool" id="btn-inputs">
            <svg width="20" height="20"><use href="#icon-input"></use></svg>
            <span>Источник</span>
          </button>
          <button class="btn-tool" id="btn-apps">
            <svg width="20" height="20"><use href="#icon-tv"></use></svg>
            <span>Приложения</span>
          </button>
          <button class="btn-tool" id="btn-text-input">
            <svg width="20" height="20"><use href="#icon-keyboard"></use></svg>
            <span>Текст</span>
          </button>
          <button class="btn-tool" id="btn-gesture">
            <svg width="20" height="20"><use href="#icon-gesture"></use></svg>
            <span>Жесты</span>
          </button>
        </div>
      </div>

      <!-- Overlay для подключения -->
      ${!connected ? `
        <div class="reconnect-overlay">
          <p>Соединение с телевизором потеряно</p>
          <button class="btn btn-primary" id="btn-reconnect">Переподключиться</button>
        </div>
      ` : ''}
    </div>
  `;

  // --- Обработчики ---
  document.getElementById('btn-back-remote').addEventListener('click', () => navigate('welcome'));
  document.getElementById('btn-settings-remote').addEventListener('click', () => navigate('settings'));

  // Power
  document.getElementById('btn-power').addEventListener('click', () => {
    haptic();
    sendCommand('KEY_POWER');
  });

  // Volume
  document.getElementById('btn-vol-up').addEventListener('click', () => { haptic(); sendCommand('VOLUP'); });
  document.getElementById('btn-vol-down').addEventListener('click', () => { haptic(); sendCommand('VOLDOWN'); });
  document.getElementById('btn-mute').addEventListener('click', () => { haptic(); sendCommand('MUTE'); });

  // D-Pad
  container.querySelectorAll('.dpad-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      haptic();
      sendCommand(btn.dataset.key);
    });
  });

  // Nav buttons
  container.querySelectorAll('.btn-nav').forEach((btn) => {
    btn.addEventListener('click', () => {
      haptic();
      sendCommand(btn.dataset.key);
    });
  });

  // Channel
  container.querySelectorAll('.btn-channel').forEach((btn) => {
    btn.addEventListener('click', () => {
      haptic();
      sendCommand(btn.dataset.key);
    });
  });

  // Quick actions
  container.querySelectorAll('.btn-quick').forEach((btn) => {
    btn.addEventListener('click', () => {
      haptic();
      const action = btn.dataset.action;
      const map = {
        youtube: { type: 'app:launch', payload: { appId: 'youtube' } },
        netflix: { type: 'app:launch', payload: { appId: 'netflix' } },
        input: { type: 'tv:key', payload: { key: 'SOURCE' } },
        mute: { type: 'tv:key', payload: { key: 'MUTE' } },
        guide: { type: 'tv:key', payload: { key: 'GUIDE' } }
      };
      if (map[action]) sendRaw(map[action]);
    });
  });

  // Tools
  document.getElementById('btn-keypad').addEventListener('click', () => openOverlay('keypad'));
  document.getElementById('btn-media').addEventListener('click', () => openOverlay('media'));
  document.getElementById('btn-inputs').addEventListener('click', () => openOverlay('inputs'));
  document.getElementById('btn-apps').addEventListener('click', () => openOverlay('apps'));
  document.getElementById('btn-text-input').addEventListener('click', () => openOverlay('text'));
  document.getElementById('btn-gesture').addEventListener('click', () => {
    setState({ gestureMode: true });
    openOverlay('gesture');
  });

  // Reconnect
  const reconnectBtn = document.getElementById('btn-reconnect');
  if (reconnectBtn) {
    reconnectBtn.addEventListener('click', () => {
      setState({ connectionStatus: 'connecting' });
      if (window._vexaWs && window._vexaWs.readyState === WebSocket.OPEN) {
        window._vexaWs.send(JSON.stringify({
          type: 'device:connect',
          payload: { deviceId: device.id, ip: device.ip, brand: device.brand }
        }));
      }
    });
  }
}

// --- Вспомогательные ---

function sendCommand(key) {
  if (!window._vexaWs || window._vexaWs.readyState !== WebSocket.OPEN) {
    showToast('Нет соединения с шлюзом');
    return;
  }
  window._vexaWs.send(JSON.stringify({
    type: 'tv:key',
    payload: { key }
  }));
}

function sendRaw(msg) {
  if (!window._vexaWs || window._vexaWs.readyState !== WebSocket.OPEN) {
    showToast('Нет соединения с шлюзом');
    return;
  }
  window._vexaWs.send(JSON.stringify(msg));
}

function haptic() {
  if (State.vibration && navigator.vibrate) navigator.vibrate(10);
}

// Оверлеи (цифры, медиа, источники, приложения, текст, жесты)
function openOverlay(type) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.id = 'overlay-active';

  let content = '';
  switch (type) {
    case 'keypad':
      content = renderKeypad();
      break;
    case 'media':
      content = renderMedia();
      break;
    case 'inputs':
      content = renderInputs();
      break;
    case 'apps':
      content = renderApps();
      break;
    case 'text':
      content = renderTextInput();
      break;
    case 'gesture':
      content = renderGesture();
      break;
  }

  overlay.innerHTML = `
    <div class="overlay-backdrop"></div>
    <div class="overlay-panel">
      <div class="overlay-handle"></div>
      ${content}
    </div>
  `;

  overlay.querySelector('.overlay-backdrop').addEventListener('click', () => {
    overlay.remove();
  });

  document.getElementById('app').appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('overlay-visible'));

  bindOverlayEvents(overlay, type);
}

function renderKeypad() {
  return `
    <div class="overlay-content keypad-content">
      <h3>Цифровая клавиатура</h3>
      <div class="keypad-grid">
        ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="keypad-btn" data-key="DIGIT_${n}">${n}</button>`).join('')}
        <button class="keypad-btn keypad-wide" data-key="DIGIT_0">0</button>
      </div>
      <div class="keypad-actions">
        <button class="btn btn-secondary" data-key="CHUP">CH +</button>
        <button class="btn btn-secondary" data-key="CHDOWN">CH −</button>
      </div>
    </div>
  `;
}

function renderMedia() {
  return `
    <div class="overlay-content media-content">
      <h3>Медиа</h3>
      <div class="media-grid">
        <button class="media-btn" data-key="REWIND"><svg width="24" height="24"><use href="#icon-rewind"></use></svg></button>
        <button class="media-btn" data-key="PLAY"><svg width="24" height="24"><use href="#icon-play"></use></svg></button>
        <button class="media-btn" data-key="PAUSE"><svg width="24" height="24"><use href="#icon-pause"></use></svg></button>
        <button class="media-btn" data-key="STOP"><svg width="24" height="24"><use href="#icon-stop"></use></svg></button>
        <button class="media-btn" data-key="FORWARD"><svg width="24" height="24"><use href="#icon-forward"></use></svg></button>
      </div>
    </div>
  `;
}

function renderInputs() {
  // Источники запрашиваются у TV через backend; показываем заглушку
  return `
    <div class="overlay-content inputs-content">
      <h3>Источник сигнала</h3>
      <div class="inputs-list" id="inputs-list">
        <p class="overlay-hint">Запрос списка источников…</p>
      </div>
    </div>
  `;
}

function renderApps() {
  return `
    <div class="overlay-content apps-content">
      <h3>Приложения</h3>
      <div class="apps-list" id="apps-list">
        <p class="overlay-hint">Запрос списка приложений…</p>
      </div>
    </div>
  `;
}

function renderTextInput() {
  return `
    <div class="overlay-content text-content">
      <h3>Введите текст</h3>
      <input type="text" class="text-input-field" id="text-input-field" placeholder="Поиск на телевизоре" />
      <button class="btn btn-primary" id="btn-send-text">Отправить</button>
      <p class="overlay-hint">Текст будет отправлен на телевизор, если его API поддерживает ввод.</p>
    </div>
  `;
}

function renderGesture() {
  return `
    <div class="overlay-content gesture-content" id="gesture-area">
      <h3>Управление жестами</h3>
      <div class="gesture-pad" id="gesture-pad">
        <p class="gesture-hint">Свайп для навигации<br>Тап — OK<br>Двойной тап — Home</p>
      </div>
    </div>
  `;
}

function bindOverlayEvents(overlay, type) {
  // Keypad
  overlay.querySelectorAll('[data-key]').forEach((btn) => {
    btn.addEventListener('click', () => {
      haptic();
      sendCommand(btn.dataset.key);
    });
  });

  // Text input
  const sendTextBtn = overlay.querySelector('#btn-send-text');
  if (sendTextBtn) {
    sendTextBtn.addEventListener('click', () => {
      const input = overlay.querySelector('#text-input-field');
      const text = input.value.trim();
      if (!text) return;
      sendRaw({ type: 'tv:text', payload: { text } });
      input.value = '';
      showToast('Текст отправлен');
    });
  }

  // Gesture pad
  const gesturePad = overlay.querySelector('#gesture-pad');
  if (gesturePad) {
    let startX = 0, startY = 0, startTime = 0;
    let lastTap = 0;

    gesturePad.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
    }, { passive: true });

    gesturePad.addEventListener('touchend', (e) => {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      const dt = Date.now() - startTime;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 15 && dt < 300) {
        // Тап
        const now = Date.now();
        if (now - lastTap < 300) {
          haptic();
          sendCommand('HOME');
        } else {
          haptic();
          sendCommand('ENTER');
        }
        lastTap = now;
        return;
      }

      if (dist > 40) {
        haptic();
        if (Math.abs(dx) > Math.abs(dy)) {
          sendCommand(dx > 0 ? 'RIGHT' : 'LEFT');
        } else {
          sendCommand(dy > 0 ? 'DOWN' : 'UP');
        }
      }
    }, { passive: true });
  }

  // Запрос источников/приложений
  if (type === 'inputs' && window._vexaWs) {
    window._vexaWs.send(JSON.stringify({ type: 'tv:getInputs' }));
  }
  if (type === 'apps' && window._vexaWs) {
    window._vexaWs.send(JSON.stringify({ type: 'tv:getApps' }));
  }
}

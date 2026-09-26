import { State, setState, persistState, removeKnownDevice } from '../state.js';
import { navigate } from '../router.js';
import { showToast } from './devices.js';

export function renderSettings(container) {
  container.innerHTML = `
    <div class="screen settings-screen">
      <div class="screen-header">
        <button class="btn-icon" id="btn-back-settings" aria-label="Назад">
          <svg width="22" height="22"><use href="#icon-arrow-left"></use></svg>
        </button>
        <h2>Настройки</h2>
        <div style="width:40px"></div>
      </div>

      <div class="settings-list">
        <!-- Подключение -->
        <div class="settings-group">
          <h3 class="settings-group-title">Подключение</h3>
          <div class="settings-item">
            <span>Адрес шлюза</span>
            <span class="settings-value" id="gateway-url">${window._vexaGatewayUrl || 'не указан'}</span>
          </div>
          <div class="settings-item">
            <span>Статус backend</span>
            <span class="settings-value ${State.diagnostics.backend ? 'text-success' : 'text-danger'}">
              ${State.diagnostics.backend ? 'Подключён' : 'Не подключён'}
            </span>
          </div>
        </div>

        <!-- Телевизоры -->
        <div class="settings-group">
          <h3 class="settings-group-title">Мои телевизоры</h3>
          ${State.knownDevices.length === 0 ? '<p class="settings-empty">Нет сохранённых телевизоров</p>' : ''}
          ${State.knownDevices.map((d) => `
            <div class="settings-item">
              <div class="settings-device-info">
                <span>${d.name || d.brand}</span>
                <span class="settings-device-ip">${d.ip}</span>
              </div>
              <button class="btn btn-small btn-danger remove-device-btn" data-id="${d.id}">Удалить</button>
            </div>
          `).join('')}
        </div>

        <!-- Вибрация -->
        <div class="settings-group">
          <h3 class="settings-group-title">Вибрация</h3>
          <div class="settings-item">
            <span>Виброотклик при нажатии</span>
            <label class="toggle">
              <input type="checkbox" id="toggle-vibration" ${State.vibration ? 'checked' : ''} />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- Тема -->
        <div class="settings-group">
          <h3 class="settings-group-title">Тема</h3>
          <div class="theme-options">
            ${['system', 'light', 'dark', 'oled'].map((t) => `
              <button class="theme-option ${State.theme === t ? 'active' : ''}" data-theme="${t}">
                ${t === 'system' ? 'Системная' : t === 'light' ? 'Светлая' : t === 'dark' ? 'Тёмная' : 'OLED Black'}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Автоподключение -->
        <div class="settings-group">
          <h3 class="settings-group-title">Автоподключение</h3>
          <div class="settings-item">
            <span>Подключаться к последнему телевизору</span>
            <label class="toggle">
              <input type="checkbox" id="toggle-autoconnect" ${State.autoConnect ? 'checked' : ''} />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- Язык -->
        <div class="settings-group">
          <h3 class="settings-group-title">Язык</h3>
          <div class="settings-item">
            <span>Русский</span>
            <span class="settings-value">✓</span>
          </div>
        </div>

        <!-- Диагностика -->
        <div class="settings-group">
          <h3 class="settings-group-title">Диагностика</h3>
          <button class="settings-link" id="btn-diagnostics">Диагностика подключения</button>
        </div>

        <!-- О приложении -->
        <div class="settings-group">
          <h3 class="settings-group-title">О приложении</h3>
          <div class="settings-item">
            <span>Версия</span>
            <span class="settings-value">1.0.0</span>
          </div>
          <div class="settings-item">
            <span>PWA</span>
            <span class="settings-value">${State.diagnostics.pwa ? '✓ Установлено' : '— Браузер'}</span>
          </div>
        </div>

        <!-- Очистка -->
        <div class="settings-group">
          <button class="btn btn-danger btn-full" id="btn-clear-all">Очистить сохранённые устройства</button>
        </div>
      </div>
    </div>
  `;

  // Обработчики
  document.getElementById('btn-back-settings').addEventListener('click', () => navigate('remote'));

  container.querySelectorAll('.remove-device-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      removeKnownDevice(btn.dataset.id);
      renderSettings(container);
      showToast('Устройство удалено');
    });
  });

  document.getElementById('toggle-vibration').addEventListener('change', (e) => {
    setState({ vibration: e.target.checked });
    persistState();
  });

  document.getElementById('toggle-autoconnect').addEventListener('change', (e) => {
    setState({ autoConnect: e.target.checked });
    persistState();
  });

  container.querySelectorAll('.theme-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      setState({ theme });
      persistState();
      applyTheme(theme);
      container.querySelectorAll('.theme-option').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.getElementById('btn-diagnostics').addEventListener('click', () => navigate('diagnostics'));

  document.getElementById('btn-clear-all').addEventListener('click', () => {
    if (confirm('Удалить все сохранённые телевизоры?')) {
      State.knownDevices = [];
      persistState();
      renderSettings(container);
      showToast('Все устройства удалены');
    }
  });
}

export function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.remove('theme-light', 'theme-dark', 'theme-oled');
  if (theme === 'light') root.classList.add('theme-light');
  else if (theme === 'dark') root.classList.add('theme-dark');
  else if (theme === 'oled') root.classList.add('theme-oled');
  // system — удаляем все классы, используются prefers-color-scheme
}

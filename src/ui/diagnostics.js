import { State } from '../state.js';
import { navigate } from '../router.js';

export function renderDiagnostics(container) {
  const d = State.diagnostics;

  const item = (label, value, ok) => `
    <div class="diagnostic-item">
      <span class="diagnostic-label">${label}</span>
      <span class="diagnostic-value ${ok === true ? 'text-success' : ok === false ? 'text-danger' : ''}">
        ${value}
      </span>
    </div>
  `;

  container.innerHTML = `
    <div class="screen diagnostics-screen">
      <div class="screen-header">
        <button class="btn-icon" id="btn-back-diag" aria-label="Назад">
          <svg width="22" height="22"><use href="#icon-arrow-left"></use></svg>
        </button>
        <h2>Диагностика</h2>
        <div style="width:40px"></div>
      </div>
      <div class="diagnostics-list">
        ${item('Wi-Fi доступен', d.wifi !== 'none' ? '✓' : '✗', d.wifi !== 'none')}
        ${item('HTTPS', d.https ? '✓' : '✗ (используйте HTTPS для PWA)', d.https)}
        ${item('PWA (standalone)', d.pwa ? '✓' : '✗ (откройте как приложение)', d.pwa)}
        ${item('Local Network API', d.localNetworkApi, null)}
        ${item('Backend подключён', d.backend ? '✓' : '✗', d.backend)}
        ${item('TV API подключён', d.tvApi ? '✓' : '✗', d.tvApi)}
        ${item('Телевизор найден', d.tvFound ? '✓' : '✗', d.tvFound)}
        ${item('Latency', d.latency ? `${d.latency} ms` : '—', null)}
      </div>
      <div class="diagnostics-note">
        <p>Обычный браузер не может напрямую сканировать локальную сеть и открывать TCP/TLS-соединения к телевизору. Все сетевые операции выполняет локальный Node.js‑шлюз.</p>
      </div>
    </div>
  `;

  document.getElementById('btn-back-diag').addEventListener('click', () => navigate('settings'));
}

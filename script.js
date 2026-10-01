// ==== ЗАПРЕТ ЗУМА НА iOS ====
let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, { passive: false });

document.addEventListener('gesturestart', function(e) { e.preventDefault(); });
document.addEventListener('gesturechange', function(e) { e.preventDefault(); });
document.addEventListener('gestureend', function(e) { e.preventDefault(); });

// ==== УПРАВЛЕНИЕ УСТРОЙСТВАМИ ====
let devices = JSON.parse(localStorage.getItem('tvDevices')) || [];
let currentDevice = JSON.parse(localStorage.getItem('currentDevice')) || null;
let authToken = localStorage.getItem('tvToken') || '';
let ws = null;

const deviceNameEl = document.getElementById('deviceName');
const modal = document.getElementById('deviceModal');
const addBtn = document.getElementById('addDeviceBtn');
const saveBtn = document.getElementById('saveDeviceBtn');
const cancelBtn = document.getElementById('cancelBtn');
const ipInput = document.getElementById('ipInput');
const nameInput = document.getElementById('nameInput');

// Открыть модальное окно
addBtn.addEventListener('click', () => {
    modal.classList.add('active');
    ipInput.value = '';
    nameInput.value = '';
    const list = document.getElementById('foundDevices');
    const status = document.getElementById('discoverStatus');
    if (list) list.innerHTML = '';
    if (status) status.style.display = 'none';
});

// Закрыть
cancelBtn.addEventListener('click', () => {
    modal.classList.remove('active');
});

// Сохранить устройство
saveBtn.addEventListener('click', () => {
    const ip = ipInput.value.trim();
    const name = nameInput.value.trim();
    
    if (!ip || !name) {
        alert('Заполни оба поля!');
        return;
    }

    devices.push({ ip, name });
    localStorage.setItem('tvDevices', JSON.stringify(devices));
    
    if (devices.length === 1) {
        selectDevice(0);
    }
    
    modal.classList.remove('active');
    renderDeviceList();
});

function selectDevice(index) {
    currentDevice = devices[index];
    localStorage.setItem('currentDevice', JSON.stringify(currentDevice));
    deviceNameEl.textContent = currentDevice.name;
    connectToTV();
}

function renderDeviceList() {
    if (currentDevice) {
        deviceNameEl.textContent = currentDevice.name;
    } else if (devices.length > 0) {
        selectDevice(0);
    } else {
        deviceNameEl.textContent = 'Нет устройств';
    }
}

// ==== ПОИСК ТЕЛЕВИЗОРОВ В СЕТИ ====
const discoverBtn = document.getElementById('discoverBtn');
if (discoverBtn) {
    discoverBtn.addEventListener('click', async () => {
        const status = document.getElementById('discoverStatus');
        const list = document.getElementById('foundDevices');
        status.style.display = 'block';
        status.textContent = '🔍 Сканирую сеть... (до 20 секунд)';
        list.innerHTML = '';
        
        try {
            const res = await fetch('/api/discover');
            const found = await res.json();
            status.style.display = 'none';
            
            if (found.length === 0) {
                status.style.display = 'block';
                status.textContent = '❌ Телевизоры не найдены. Введи IP вручную.';
            } else {
                found.forEach(d => {
                    const btn = document.createElement('button');
                    btn.className = 'found-device';
                    btn.textContent = '📺 ' + d.name + ' — ' + d.ip;
                    btn.addEventListener('click', () => {
                        ipInput.value = d.ip;
                        nameInput.value = d.name;
                    });
                    list.appendChild(btn);
                });
            }
        } catch (e) {
            status.style.display = 'block';
            status.textContent = '⚠️ Ошибка. Введи IP вручную.';
        }
    });
}

// ==== WEBSOCKET ====
function connectToTV() {
    if (!currentDevice) return;
    
    if (ws) ws.close();

    const TV_IP = currentDevice.ip;
    const APP_NAME = btoa('MyRemote');
    const protocol = authToken ? 'wss' : 'ws';
    const port = authToken ? 8002 : 8001;
    const url = protocol + '://' + TV_IP + ':' + port + '/api/v2/channels/samsung.remote.control?name=' + APP_NAME + (authToken ? '&token=' + authToken : '');

    console.log('Подключаюсь к:', url);
    ws = new WebSocket(url);

    ws.onopen = () => console.log('✅ Подключено!');
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.data && data.data.token) {
            authToken = data.data.token;
            localStorage.setItem('tvToken', authToken);
            console.log('🔑 Токен сохранён');
        }
    };

    ws.onerror = (err) => console.error('❌ Ошибка:', err);
    ws.onclose = () => console.log('🔌 Закрыто');
}

function sendKey(keyCode) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert('Нет соединения с телевизором!');
        return;
    }

    const payload = {
        method: 'ms.remote.control',
        params: {
            Cmd: 'Click',
            DataOfCmd: keyCode,
            Option: 'false',
            TypeOfRemote: 'SendRemoteKey'
        }
    };
    ws.send(JSON.stringify(payload));
}

// ==== КНОПКИ ПУЛЬТА ====
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const key = btn.dataset.key;
        if (key) {
            console.log('Нажата:', key);
            sendKey(key);
        }
    });
});

// ==== ИНИЦИАЛИЗАЦИЯ ====
renderDeviceList();
if (currentDevice) {
    connectToTV();
}

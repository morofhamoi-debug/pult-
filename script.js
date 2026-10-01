// ==== Управление устройствами ====
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

// Открыть модалку
addBtn.addEventListener('click', () => {
    modal.classList.add('active');
    ipInput.value = '';
    nameInput.value = '';
});

// Закрыть модалку
cancelBtn.addEventListener('click', () => {
    modal.classList.remove('active');
});

// Сохранить устройство
saveBtn.addEventListener('click', () => {
    const ip = ipInput.value.trim();
    const name = nameInput.value.trim();
    
    if (!ip || !name) {
        alert('Пожалуйста, заполните оба поля!');
        return;
    }

    const newDevice = { ip, name };
    devices.push(newDevice);
    localStorage.setItem('tvDevices', JSON.stringify(devices));
    
    // Если это первое устройство, делаем его активным
    if (devices.length === 1) {
        selectDevice(0);
    }
    
    modal.classList.remove('active');
    renderDeviceList();
});

// Выбор устройства (упрощенно, пока просто берем первое или последнее)
function selectDevice(index) {
    currentDevice = devices[index];
    localStorage.setItem('currentDevice', JSON.stringify(currentDevice));
    deviceNameEl.textContent = currentDevice.name;
    connectToTV();
}

// Обновить список устройств в хедере
function renderDeviceList() {
    if (currentDevice) {
        deviceNameEl.textContent = currentDevice.name;
    } else if (devices.length > 0) {
        selectDevice(0);
    } else {
        deviceNameEl.textContent = 'Нет устройств';
    }
}

// ==== WebSocket логика ====
function connectToTV() {
    if (!currentDevice) return;
    
    if (ws) {
        ws.close();
    }

    const TV_IP = currentDevice.ip;
    const APP_NAME = btoa('MyRemote');
    const protocol = authToken ? 'wss' : 'ws';
    const port = authToken ? 8002 : 8001;
    const url = `${protocol}://${TV_IP}:${port}/api/v2/channels/samsung.remote.control?name=${APP_NAME}${authToken ? '&token=' + authToken : ''}`;

    console.log('Подключение к:', url);
    ws = new WebSocket(url);

    ws.onopen = () => {
        console.log('✅ Подключено к телевизору!');
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.data && data.data.token) {
            authToken = data.data.token;
            localStorage.setItem('tvToken', authToken);
            console.log('🔑 Токен сохранён');
        }
    };

    ws.onerror = (err) => {
        console.error('❌ Ошибка WebSocket:', err);
    };

    ws.onclose = () => {
        console.log('🔌 Соединение закрыто');
    };
}

function sendKey(keyCode) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert('Нет соединения с телевизором! Убедись, что IP верный и сервер запущен.');
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

// ==== Обработка нажатий на SVG кнопки ====
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const key = btn.dataset.key;
        if (key) {
            console.log('Нажата кнопка:', key);
            sendKey(key);
        }
    });
});

// ==== Инициализация ====
renderDeviceList();
if (currentDevice) {
    connectToTV();
}

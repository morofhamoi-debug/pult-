// Автоматически подставляем сохраненный IP при открытии страницы
window.onload = function() {
    const savedIp = localStorage.getItem('tv_ip');
    if (savedIp) {
        document.getElementById('tv-ip').value = savedIp;
    }
};

function saveIp() {
    const ip = document.getElementById('tv-ip').value.trim();
    if (ip) {
        localStorage.setItem('tv_ip', ip);
        alert('IP успешно сохранен!');
    } else {
        alert('Введите корректный IP!');
    }
}

function sendKey(action) {
    const ip = document.getElementById('tv-ip').value.trim();
    
    if (!ip) {
        alert('Сначала введи и сохрани IP-адрес телевизора!');
        return;
    }

    // URL для отправки команд (зависит от того, как телевизор принимает запросы)
    const url = `http://${ip}:8080/command?action=${action}`;

    console.log(`Отправка: ${action} на ${url}`);

    // Отправка запроса по локальной сети Wi-Fi
    fetch(url, {
        method: 'GET',
        mode: 'no-cors' // важно, чтобы браузер не ругался на локальную сеть
    })
    .catch(error => {
        console.error('Ошибка:', error);
    });
}

function sendKey(action) {
    const ipInput = document.getElementById('tv-ip').value.trim();
    
    if (!ipInput) {
        alert('Пожалуйста, введи IP-адрес телевизора!');
        return;
    }

    // Пример формирования URL для отправки запроса на телевизор
    // (Порты и пути могут отличаться в зависимости от модели телевизора)
    const url = `http://${ipInput}:8080/command?action=${action}`;

    console.log(`Отправка команды "${action}" на адрес: ${url}`);

    // Отправляем запрос через сеть Wi-Fi
    fetch(url, {
        method: 'GET',
        mode: 'no-cors' // важно для локальной сети, чтобы браузер не блокировал запрос
    })
    .then(() => {
        console.log('Команда успешно отправлена');
    })
    .catch(error => {
        console.error('Ошибка отправки:', error);
    });
}

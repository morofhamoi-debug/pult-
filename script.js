// При загрузке страницы сразу ищем телевизоры в сети
window.onload = function() {
    scanNetwork();
};

function scanNetwork() {
    const select = document.getElementById('tv-select');
    select.innerHTML = '<option>Идет сканирование сети...</option>';

    fetch('/scan')
        .then(response => response.json())
        .then(data => {
            select.innerHTML = '';
            if (data.tvs && data.tvs.length > 0) {
                data.tvs.forEach(tv => {
                    let option = document.createElement('option');
                    option.value = tv.ip;
                    option.textContent = `${tv.name} (${tv.ip})`;
                    select.appendChild(option);
                });
            } else {
                let option = document.createElement('option');
                option.value = "";
                option.textContent = "Телевизоры не найдены";
                select.appendChild(option);
            }
        })
        .catch(err => {
            console.error('Ошибка сканирования:', err);
            select.innerHTML = '<option>Ошибка поиска</option>';
        });
}

function sendKey(action) {
    const select = document.getElementById('tv-select');
    const ip = select.value;

    if (!ip) {
        alert('Сначала выбери телевизор из списка!');
        return;
    }

    fetch(`/control?ip=${ip}&action=${action}`)
        .then(res => res.json())
        .then(data => {
            console.log('Ответ:', data);
        })
        .catch(err => console.error('Ошибка отправки:', err));
}

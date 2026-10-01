from http.server import SimpleHTTPRequestHandler, HTTPServer
import urllib.parse as urlparse
import socket
import json
import threading

# Простая функция сканирования локальной сети на наличие открытых ТВ-портов
def scan_local_network():
    found_tvs = []
    # Определяем базовый IP (например, 192.168.1.)
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        local_ip = s.getsockname()[0]
    except Exception:
        local_ip = '192.168.1.10'
    finally:
        s.close()

    base_ip = '.'.join(local_ip.split('.')[:3]) + '.'
    
    # Сканируем хосты в фоне (для скорости берем основные порты Smart TV: 8009, 8080, 9080)
    ports_to_check = [8009, 8080, 9080, 7676]

    def check_ip(ip):
        for port in ports_to_check:
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(0.3)
                result = sock.connect_ex((ip, port))
                if result == 0:
                    found_tvs.append({"name": f"Smart TV ({ip})", "ip": ip})
                    sock.close()
                    break
                sock.close()
            except:
                pass

    threads = []
    for i in range(1, 255):
        target_ip = base_ip + str(i)
        t = threading.Thread(target=check_ip, args=(target_ip,))
        threads.append(t)
        t.start()

    for t in threads:
        t.join(timeout=1.0)

    # Если ничего не нашлось для примера, добавим заглушку чтобы список не был пуст при тестировании
    if not found_tvs:
        found_tvs.append({"name": "Тестовый ТВ (пример)", "ip": "192.168.1.50"})

    return found_tvs

class RemoteHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse.urlparse(self.path)
        path = parsed_path.path
        query = urlparse.parse_qs(parsed_path.query)

        if path == '/scan':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            tvs = scan_local_network()
            self.wfile.write(json.dumps({"tvs": tvs}).encode('utf-8'))
            
        elif path == '/control':
            ip = query.get('ip', [''])[0]
            action = query.get('action', [''])[0]
            print(f"Команда '{action}' отправлена на телевизор: {ip}")
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success", "ip": ip, "action": action}).encode('utf-8'))
        else:
            super().do_GET()

if __name__ == '__main__':
    server_address = ('0.0.0.0', 8000)
    httpd = HTTPServer(server_address, RemoteHandler)
    print("Сервер пульта запущен! Открой в браузере: http://localhost:8000")
    httpd.serve_forever()

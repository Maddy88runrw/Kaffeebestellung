# Umschalten zwischen lokalem und Remote-Server

Dieses Skript ermöglicht es, schnell zwischen lokalem und Remote-Server für die Kaffeebestellung-App zu wechseln.

## Remote-Server verwenden:
```javascript
const API_URL = 'https://kaffeebestellung-server-node.onrender.com';
```

## Lokalen Server verwenden:
```javascript
const API_URL = 'http://localhost:3000';
```

Dies sollte in der `index.html` auf Zeile ~334 geändert werden.

## Warum werden Telegram-Nachrichten gesendet?

Die Bestellungen wurden bisher an den Remote-Server (`https://kaffeebestellung-server-node.onrender.com`) gesendet, der offenbar einen funktionierenden Telegram-Bot hat. Unser lokaler Server mit dem deaktivierten Bot wurde gar nicht für die Bestellungen verwendet.

Wenn Sie keine Telegram-Nachrichten erhalten möchten, haben Sie folgende Möglichkeiten:

1. Verwenden Sie den lokalen Server, bei dem der Bot deaktiviert ist (aktuelle Einstellung)
2. Ändern Sie die API_URL zurück zum Remote-Server, wenn Sie Telegram-Benachrichtigungen wünschen

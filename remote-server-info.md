# Kaffeebestellung mit Remote-Server

## Aktuelle Konfiguration

Die Kaffeebestellung-App ist derzeit so konfiguriert, dass sie den **Remote-Server** mit Telegram-Benachrichtigungen verwendet:

```javascript
const API_URL = 'https://kaffeebestellung-server-node.onrender.com';
```

## Vorteile der Remote-Konfiguration

- **Immer verfügbar**: Der Server läuft rund um die Uhr in der Cloud
- **Telegram-Benachrichtigungen**: Neue Bestellungen werden sofort an Telegram gesendet
- **Keine lokale Installation**: Kein Node.js oder andere Abhängigkeiten auf Ihrem Computer erforderlich

## Lokalen Server verwenden

Falls Sie den lokalen Server ohne Telegram-Benachrichtigungen verwenden möchten:

1. Öffnen Sie die `index.html` in einem Text-Editor
2. Ändern Sie die Zeile mit dem API_URL zu:
   ```javascript
   const API_URL = 'http://localhost:3000';
   ```
3. Speichern Sie die Datei
4. Starten Sie den lokalen Server mit der `start-server.bat`

## Server-Status überprüfen

Sie können den Status des Remote-Servers jederzeit überprüfen unter:
https://kaffeebestellung-server-node.onrender.com/health

## Fehlerbehandlung

Die App verfügt über einen Offline-Modus, falls der Server nicht erreichbar sein sollte. In diesem Fall werden Bestellungen lokal gespeichert und können später synchronisiert werden, wenn der Server wieder verfügbar ist.

# Kaffeebestellung App

Diese Anwendung ermöglicht es Benutzern, Kaffeebestellungen aufzugeben und zu verwalten. Die App kann auch Benachrichtigungen zu neuen Bestellungen über Telegram senden.

## So verwenden Sie die App

### Option 1: Lokal öffnen
Öffnen Sie einfach die Datei `index.html` in einem Browser. Die App verbindet sich automatisch mit dem Remote-Server auf Render.com.

### Option 2: Über GitHub Pages (empfohlen)
Die App ist bereits über GitHub Pages verfügbar: [https://maddy88runrw.github.io/Kaffeebestellung/](https://maddy88runrw.github.io/Kaffeebestellung/)

Für weitere Informationen zur GitHub Pages Konfiguration, siehe [github-pages-anleitung.md](github-pages-anleitung.md).

## Funktionen

- Kaffeebestellungen für verschiedene Gäste aufgeben
- Auswahl verschiedener Kaffeesorten (Cappuccino, Latte Macchiato, usw.)
- Option für Hafermilch und entkoffeinierten Kaffee
- Übersicht aller aktuellen Bestellungen
- Echtzeit-Benachrichtigungen über Telegram

## Fehlerbehebung

Die App wurde aktualisiert, um den Fehler "The message port closed before a response was received" zu beheben. 
Diese Fehlermeldung trat auf, wenn die App versuchte, mit dem Server zu kommunizieren.

### Implementierte Lösungen:

1. **Fix.js**: Eine JavaScript-Datei, die die fehlerhafte Kommunikation zwischen Frontend und Backend behebt.
2. **Verbesserte Server-Implementierung**: Eine robustere Version des Servers mit besserer Fehlerbehandlung.
3. **Offline-Modus**: Die App kann nun auch ohne Serververbindung funktionieren.

## Anleitung zur Verwendung

### Frontend starten:
- Öffnen Sie die `index.html` in einem Browser.

### Server starten:
- Führen Sie die Datei `start-server.bat` aus, um den Server zu starten.
- Oder navigieren Sie im Terminal zum Verzeichnis `bot-server` und führen Sie `node server.js` aus.

### Telegram-Bot konfigurieren (optional):
- Folgen Sie der Anleitung in `telegram-bot-anleitung.md`, um einen Telegram-Bot zu erstellen.
- Tragen Sie den Token und Ihre Chat-ID in die `.env`-Datei im `bot-server`-Verzeichnis ein.
- Ersetzen Sie den Wert `TELEGRAM_BOT_TOKEN=disabled` mit Ihrem echten Bot-Token.

## Fehlersuche

### "Message port closed" Fehler:
1. Öffnen Sie die Seite im Inkognito-Modus
2. Deaktivieren Sie Browser-Erweiterungen, die mit Netzwerkanfragen interferieren könnten
3. Lesen Sie die ausführliche Anleitung in `fix-anleitung.html`

### GitHub Pages spezifische Probleme:
1. Prüfen Sie die Server-Verbindung über den Status-Badge unten rechts
2. Bei CORS-Fehlern prüfen Sie die Browser-Konsole (F12)
3. Verwenden Sie die optimierte GitHub Pages Version (`github-pages-version.html`)
4. Bei anhaltenden Problemen sehen Sie in [github-pages-anleitung.md](github-pages-anleitung.md) nach

## Entwickelt mit

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Benachrichtigungen: Telegram Bot API

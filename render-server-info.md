# Render-Server-Deployment-Anleitung

Diese Anleitung hilft dir dabei, den Kaffeebestellungs-Server auf Render.com zu deployen und die node-fetch-Abhängigkeit korrekt einzurichten.

## Schritt 1: Render.com-Account einrichten

1. Falls noch nicht geschehen, registriere dich auf [Render.com](https://render.com/).
2. Logge dich in deinen Account ein.

## Schritt 2: Neuen Web-Service erstellen

1. Klicke auf dem Dashboard auf "New" und wähle "Web Service".
2. Verbinde dein GitHub-Repository mit Render, falls noch nicht geschehen.
3. Wähle das Repository "Kaffeebestellung" aus.

## Schritt 3: Konfiguriere den Web-Service

Verwende die folgenden Einstellungen:

- **Name**: `kaffeebestellung-server-node` (oder einen anderen Namen deiner Wahl)
- **Region**: Wähle die Region, die dir am nächsten ist
- **Branch**: `main`
- **Runtime**: `Node`
- **Build Command**: `cd bot-server && npm install`
- **Start Command**: `cd bot-server && node server-fix.js` (beachte die Verwendung von server-fix.js!)
- **Instance Type**: Free ($0/month)

## Schritt 4: Umgebungsvariablen konfigurieren

Klicke auf "Advanced" und füge folgende Umgebungsvariablen hinzu:

- `TELEGRAM_BOT_TOKEN`: Dein Telegram-Bot-Token (oder "disabled", wenn du den Bot nicht verwenden möchtest)
- `TELEGRAM_CHAT_ID`: Deine Telegram-Chat-ID
- `PORT`: 3000 (oder einen anderen Port deiner Wahl)

## Schritt 5: Deployment starten

1. Klicke auf "Create Web Service".
2. Warte, bis das Deployment abgeschlossen ist.
3. Überprüfe die Logs, um sicherzustellen, dass der Server erfolgreich gestartet wurde und die node-fetch-Abhängigkeit korrekt geladen wird.

## Fehlerbehebung

Wenn weiterhin Probleme mit dem "node-fetch" auftreten:

1. Überprüfe die Render-Logs auf spezifische Fehler
2. Stelle sicher, dass die Datei `server-fix.js` in deinem Repository ist und tatsächlich verwendet wird
3. Führe im Render-Dashboard manuell einen Redeploy durch:
   - Gehe zu deinem Web Service
   - Klicke auf "Manual Deploy" > "Deploy latest commit"

## Links zur Service-Konfiguration

Nachdem dein Service deployed wurde, notiere dir die URL, die Render für deinen Service generiert hat (z.B. `https://kaffeebestellung-server-node.onrender.com`). Diese URL benötigst du für die Konfiguration der Frontend-Anwendung.

---

Bei weiteren Fragen oder Problemen kannst du die [Render-Dokumentation](https://render.com/docs) konsultieren oder den Render-Support kontaktieren.

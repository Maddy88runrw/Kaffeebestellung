# Anleitung zur Einrichtung des Telegram-Bots

Um Benachrichtigungen über neue Kaffeebestellungen per Telegram zu erhalten, müssen Sie einen Bot erstellen und die Verbindungsdaten in der Konfiguration hinterlegen.

## Telegram-Bot erstellen

1. Öffnen Sie Telegram und suchen Sie nach "@BotFather"
2. Starten Sie ein Gespräch mit BotFather durch Klicken auf "Start"
3. Senden Sie den Befehl `/newbot`
4. Folgen Sie den Anweisungen:
   - Geben Sie einen Namen für Ihren Bot ein (z.B. "KaffeebestellungBot")
   - Geben Sie einen Nutzernamen für Ihren Bot ein, der mit "bot" enden muss (z.B. "meine_kaffeebestellung_bot")
5. Nach erfolgreicher Erstellung erhalten Sie ein **Token** (es sieht aus wie "123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11")
6. **WICHTIG**: Bewahren Sie dieses Token sicher auf, es ist der Zugriffsschlüssel zu Ihrem Bot!

## Chat-ID finden

1. Starten Sie ein Gespräch mit Ihrem neu erstellten Bot
2. Senden Sie eine beliebige Nachricht an Ihren Bot
3. Öffnen Sie in einem Browser: `https://api.telegram.org/bot<IHR_TOKEN>/getUpdates`
   (Ersetzen Sie `<IHR_TOKEN>` mit dem Token, das Sie von BotFather erhalten haben)
4. In der Antwort finden Sie eine JSON-Struktur, die ein Feld `chat` mit einem Feld `id` enthält
5. Diese Nummer ist Ihre Chat-ID (z.B. "123456789")

## Konfiguration in der Anwendung

1. Öffnen Sie die Datei `.env` im Verzeichnis `bot-server`
2. Ersetzen Sie den Wert für `TELEGRAM_BOT_TOKEN` mit Ihrem Token:
   ```
   TELEGRAM_BOT_TOKEN=123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
   ```
3. Ersetzen Sie den Wert für `TELEGRAM_CHAT_ID` mit Ihrer Chat-ID:
   ```
   TELEGRAM_CHAT_ID=123456789
   ```
4. Speichern Sie die Datei
5. Starten Sie den Server neu durch Ausführen der `start-server.bat` Datei

## Testen

1. Öffnen Sie die `index.html` in einem Browser
2. Geben Sie eine neue Kaffeebestellung auf
3. Sie sollten eine Benachrichtigung in Ihrem Telegram-Chat erhalten!

## Fehlersuche

- Wenn keine Nachrichten ankommen, prüfen Sie die Konsole des Servers auf Fehlermeldungen
- Stellen Sie sicher, dass sowohl Token als auch Chat-ID korrekt sind
- Prüfen Sie, ob Sie tatsächlich ein Gespräch mit Ihrem Bot gestartet haben
- Versuchen Sie, den Server neu zu starten, nachdem Sie Änderungen an der `.env` Datei vorgenommen haben

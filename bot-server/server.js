require('dotenv').config();
const express = require('express');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use((req, res, next) => {
    // Manuelles CORS-Setup für maximale Kompatibilität
    res.header('Access-Control-Allow-Origin', '*'); // Erlaubt Zugriff von überall
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Max-Age', '86400'); // 24 Stunden
    
    // OPTIONS requests sofort beantworten
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// CORS für komplexere Szenarien
app.use(cors({
    origin: '*', // Erlaubt Zugriff von überall
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
    credentials: false, // Auf false gesetzt für bessere Browser-Kompatibilität
    preflightContinue: false,
    optionsSuccessStatus: 204
}));
app.use(express.json());

// Telegram Bot Konfiguration mit Polling (nachdem alle anderen Instanzen gestoppt wurden)
let bot;
let botInitialized = false;

// Funktion zum Validieren des Bot-Tokens
async function validateBotToken(token) {
    // Prüfe zunächst, ob ein Token überhaupt vorhanden ist
    if (!token || token.trim() === '' || token === 'your_telegram_bot_token_here') {
        console.log('Kein gültiger Bot-Token konfiguriert');
        return false;
    }
    
    // Prüfe das Format - ein gültiger Token sollte keine "-" enthalten
    if (token.indexOf('-') !== -1) {
        console.log('Bot-Token hat ungültiges Format');
        return false;
    }
    
    try {
        // Erstelle temporären Bot ohne Polling, um Token zu validieren
        const tempBot = new TelegramBot(token, { polling: false });
        
        // Versuche, Bot-Info zu erhalten
        const me = await tempBot.getMe();
        console.log('Bot-Token validiert für:', me.username);
        return true;
    } catch (error) {
        console.error('Bot-Token-Validierung fehlgeschlagen:', error.message);
        return false;
    }
}

// Initialisiere den Bot mit Fehlerbehandlung
async function initializeBot() {
    try {
        // Prüfe zuerst, ob der Token gültig ist
        const isTokenValid = await validateBotToken(process.env.TELEGRAM_BOT_TOKEN);
        
        if (!isTokenValid) {
            console.error('Ungültiger Bot-Token. Bot wird im Offline-Modus gestartet.');
            bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN || 'invalid-token', { polling: false });
            botInitialized = false;
            return;
        }
        
        // Wenn Token gültig ist, starte mit Polling
        bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
            polling: {
                interval: 300,
                autoStart: true,
                params: {
                    timeout: 10
                }
            }
        });
        botInitialized = true;
        console.log('Telegram Bot erfolgreich initialisiert mit Polling');
    } catch (error) {
        console.error('Fehler bei der Telegram Bot Initialisierung:', error.message);
        // Fallback-Modus ohne Polling, nur für API-Betrieb
        bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN || 'invalid-token', { polling: false });
        botInitialized = false;
        console.log('Telegram Bot im Offline-Modus (Fallback)');
    }
}

// Bot initialisieren, aber den Server nicht blockieren
(async function() {
    await initializeBot();
})();

// Verbesserte Fehlerbehandlung für Telegram Bot
bot.on('error', (error) => {
    console.log('Telegram Bot Fehler:', error.message);
    // Versuche, den Bot nach kritischen Fehlern neu zu starten
    if (error.code === 'EFATAL') {
        console.log('Kritischer Bot-Fehler. Versuche Neustart...');
        setTimeout(() => {
            try {
                bot.stopPolling();
                setTimeout(() => {
                    bot.startPolling();
                }, 2000);
            } catch (e) {
                console.error('Fehler beim Neustart:', e.message);
            }
        }, 5000);
    }
});

bot.on('polling_error', (error) => {
    console.log('Polling Fehler:', error.message);
    // Bei 409-Fehler nicht automatisch neustarten, um Konflikte zu vermeiden
    if (error.code !== 409) {
        console.log('Nicht-kritischer Polling-Fehler. Weiterer Betrieb möglich.');
    }
});

// Callback Handler für Telegram "Erledigt"-Buttons
bot.on('callback_query', async (callbackQuery) => {
    try {
        // Sicherheitsprüfung: Stellen Sie sicher, dass alle benötigten Daten vorhanden sind
        if (!callbackQuery || !callbackQuery.data) {
            console.error('Callback Query ohne Daten erhalten');
            return;
        }
        
        // Prüfen, ob message vorhanden ist
        if (!callbackQuery.message) {
            console.error('Callback Query ohne Message erhalten');
            return;
        }
        
        const data = callbackQuery.data;
        const chatId = callbackQuery.message.chat.id;
        const messageId = callbackQuery.message.message_id;

        if (data.startsWith('complete_')) {
            const parts = data.split('_');
            const guest = parts[1];
            const coffee = parts[2];
            
            // Finde und entferne die Bestellung
            const index = orders.findIndex(o => o.guest === guest && o.coffee === coffee);
            
            if (index !== -1) {
                orders.splice(index, 1);
                
                // Bearbeite die ursprüngliche Nachricht
                await bot.editMessageText(
                    `✅ ${callbackQuery.message.text}\n\n🟢 ERLEDIGT`, 
                    {
                        chat_id: chatId,
                        message_id: messageId,
                        parse_mode: 'HTML'
                    }
                );
                
                // Sende Status-Update
                const orderCounts = {
                    cappuccino: orders.filter(o => o.coffee === 'cappuccino').length,
                    lattemacchiato: orders.filter(o => o.coffee === 'lattemacchiato').length,
                    americano: orders.filter(o => o.coffee === 'americano').length,
                    espresso: orders.filter(o => o.coffee === 'espresso').length
                };

                const statusInfo = `📊 Aktuelle offene Bestellungen:\n` +
                    `Cappuccino: ${orderCounts.cappuccino}\n` +
                    `Latte Macchiato: ${orderCounts.lattemacchiato}\n` +
                    `Americano: ${orderCounts.americano}\n` +
                    `Espresso: ${orderCounts.espresso}`;

                await bot.sendMessage(chatId, statusInfo, {
                    parse_mode: 'HTML'
                });
                
                // Bestätige den Callback
                await bot.answerCallbackQuery(callbackQuery.id, {
                    text: 'Bestellung als erledigt markiert!',
                    show_alert: false
                });
            } else {
                await bot.answerCallbackQuery(callbackQuery.id, {
                    text: 'Bestellung nicht gefunden',
                    show_alert: true
                });
            }
        }
    } catch (error) {
        console.error('Fehler beim Verarbeiten des Callbacks:', error);
        try {
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: 'Fehler beim Verarbeiten',
                show_alert: true
            });
        } catch (e) {
            console.error('Fehler beim Senden der Callback-Antwort:', e);
        }
    }
});

// Express Route für die Startseite
app.get('/', (req, res) => {
    res.send('Kaffeebestellung Bot Server läuft');
});

// Speichere die Bestellungen im Speicher
let orders = [];

// Express Route für neue Bestellungen
app.post('/order', async (req, res) => {
    try {
        const order = req.body;
        
        // Validierung der Bestelldaten
        if (!order.guest || !order.coffee || !order.coffeeName) {
            return res.status(400).json({ 
                success: false, 
                error: 'Unvollständige Bestelldaten' 
            });
        }
        
        // Bestellung speichern
        orders.push(order);
        
        let message = `🆕 Neue Bestellung!\n👤 ${order.guest}  ☕️ ${order.coffeeName}`;
        if (order.decaf || order.oatMilk) {
            if (order.decaf) message += '\n    - Entkoffeiniert';
            if (order.oatMilk) message += '\n    - Hafermilch';
        }

                // Optional: Versuch, Telegram-Nachricht zu senden (wenn konfiguriert)
                // Dieser Block wird übersprungen, wenn der Bot nicht korrekt konfiguriert ist
                try {
                    if (botInitialized && process.env.TELEGRAM_CHAT_ID && 
                        process.env.TELEGRAM_BOT_TOKEN && 
                        process.env.TELEGRAM_BOT_TOKEN.indexOf('-') === -1) { // Prüft auf gültiges Token-Format
                        
                        console.log(`Versuche Telegram-Nachricht an ${process.env.TELEGRAM_CHAT_ID} zu senden`);
                        
                        await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, message, {
                            parse_mode: 'HTML',
                            reply_markup: {
                                inline_keyboard: [[
                                    { text: '✅ Erledigt', callback_data: `complete_${order.guest}_${order.coffee}` }
                                ]]
                            }
                        });
                        console.log(`Telegram-Nachricht für Bestellung von ${order.guest} gesendet`);
                    } else {
                        console.log('Telegram-Bot nicht korrekt konfiguriert, Nachricht übersprungen');
                    }
                } catch (telegramError) {
                    console.error('Telegram-Fehler:', telegramError.message);
                    // Bestellung trotzdem akzeptieren, auch wenn Telegram fehlschlägt
                }        // Erfolgreiche Antwort, auch wenn Telegram fehlschlägt
        res.json({ success: true });
    } catch (error) {
        console.error('Fehler beim Verarbeiten der Bestellung:', error);
        // Kritischer Fehler bei der Bestellungsverarbeitung
        res.status(500).json({ success: false, error: 'Serverfehler bei der Verarbeitung' });
    }
});

// Express Route für den Status
app.get('/status', (req, res) => {
    const orderCounts = {
        cappuccino: orders.filter(o => o.coffee === 'cappuccino').length,
        lattemacchiato: orders.filter(o => o.coffee === 'lattemacchiato').length,
        americano: orders.filter(o => o.coffee === 'americano').length,
        espresso: orders.filter(o => o.coffee === 'espresso').length
    };
    
    res.json({ 
        orders,
        counts: orderCounts,
        serverStatus: {
            botActive: botInitialized,
            uptime: process.uptime(),
            memory: process.memoryUsage().heapUsed / 1024 / 1024,
            timestamp: new Date().toISOString()
        }
    });
});

// Neue Route für Healthcheck
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        botActive: botInitialized,
        timestamp: new Date().toISOString()
    });
});

// Express Route zum Löschen einer Bestellung
app.delete('/order/:guest/:coffee', async (req, res) => {
    try {
        const { guest, coffee } = req.params;
        const index = orders.findIndex(o => o.guest === guest && o.coffee === coffee);
        
        if (index !== -1) {
            orders.splice(index, 1);
            
            // Berechne Bestellstatistiken
            const orderCounts = {
                cappuccino: orders.filter(o => o.coffee === 'cappuccino').length,
                lattemacchiato: orders.filter(o => o.coffee === 'lattemacchiato').length,
                americano: orders.filter(o => o.coffee === 'americano').length,
                espresso: orders.filter(o => o.coffee === 'espresso').length
            };

            const statusInfo = `📊 Aktuelle offene Bestellungen:\n` +
                `Cappuccino: ${orderCounts.cappuccino}\n` +
                `Latte Macchiato: ${orderCounts.lattemacchiato}\n` +
                `Americano: ${orderCounts.americano}\n` +
                `Espresso: ${orderCounts.espresso}`;

            // Optional: Versuch, Telegram-Nachricht zu senden (wenn konfiguriert)
            try {
                if (botInitialized && process.env.TELEGRAM_CHAT_ID && 
                    process.env.TELEGRAM_BOT_TOKEN && 
                    process.env.TELEGRAM_BOT_TOKEN.indexOf('-') === -1) {
                    
                    await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, statusInfo, {
                        parse_mode: 'HTML'
                    });
                    console.log('Status-Update an Telegram gesendet');
                } else {
                    console.log('Telegram-Bot nicht konfiguriert, Status-Update übersprungen');
                }
            } catch (telegramError) {
                console.error('Fehler beim Senden des Status-Updates:', telegramError.message);
                // Weitermachen, auch wenn Telegram fehlschlägt
            }
            
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, error: 'Bestellung nicht gefunden' });
        }
    } catch (error) {
        console.error('Fehler beim Löschen der Bestellung:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Server starten
const server = app.listen(port, () => {
    console.log(`Server läuft auf Port ${port}`);
    console.log(`Bot-Status: ${botInitialized ? 'Aktiv' : 'Eingeschränkt'}`);
    console.log(`Umgebung: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Server-URL: ${process.env.NODE_ENV === 'production' ? 'https://kaffeebestellung-server-node.onrender.com' : `http://localhost:${port}`}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM Signal erhalten, Server wird heruntergefahren');
    server.close(() => {
        console.log('Server wurde sauber beendet');
        process.exit(0);
    });
});

// Unerwartete Fehler abfangen
process.on('uncaughtException', (error) => {
    console.error('Unerwarteter Fehler:', error);
    // Server weiterlaufen lassen trotz Fehler
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'https://maddy88runrw.github.io',
        'https://maddy88runrw.github.io/Kaffeebestellung'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Telegram Bot Konfiguration mit Polling (nachdem alle anderen Instanzen gestoppt wurden)
let bot;
let botInitialized = false;

try {
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
    console.log('Telegram Bot initialisiert mit Polling');
} catch (error) {
    console.error('Fehler bei der Telegram Bot Initialisierung:', error.message);
    // Fallback-Modus ohne Polling, nur für API-Betrieb
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
    console.log('Telegram Bot im Fallback-Modus ohne Polling');
}

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

        // Sende Telegram Nachricht mit "Erledigt"-Button, falls Bot initialisiert
        if (botInitialized) {
            try {
                await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, message, {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '✅ Erledigt', callback_data: `complete_${order.guest}_${order.coffee}` }
                        ]]
                    }
                });
                console.log(`Telegram-Nachricht für Bestellung von ${order.guest} gesendet`);
            } catch (telegramError) {
                console.error('Telegram-Fehler:', telegramError.message);
                // Bestellung trotzdem akzeptieren, auch wenn Telegram fehlschlägt
            }
        } else {
            console.log('Bot nicht initialisiert, Telegram-Nachricht übersprungen');
        }

        // Erfolgreiche Antwort, auch wenn Telegram fehlschlägt
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
            
            // Sende Status-Update an Telegram
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

            await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, statusInfo, {
                parse_mode: 'HTML'
            });
            
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

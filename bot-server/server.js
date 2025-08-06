require('dotenv').config();
const express = require('express');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());

// Telegram Bot Konfiguration mit Polling (nachdem alle anderen Instanzen gestoppt wurden)
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
bot.setWebHook(`${process.env.WEBHOOK_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}`);

// Fehlerbehandlung für Telegram Bot
bot.on('error', (error) => {
    console.log('Telegram Bot Fehler:', error.message);
});

console.log('Telegram Bot initialisiert mit Webhook');
// Express Route für Telegram Webhook
app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
    if (!req.body) {
        console.error('Webhook-Daten sind leer oder undefined');
        return res.status(400).send('Bad Request: Keine Daten empfangen');
    }
    console.log('Webhook-Daten:', req.body); // Debugging-Code
    bot.processUpdate(req.body);
    res.sendStatus(200);
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
        orders.push(order);
        
        let message = `🆕 Neue Bestellung!\n👤 ${order.guest}  ☕️ ${order.coffeeName}`;
        if (order.decaf || order.oatMilk) {
            if (order.decaf) message += '\n    - Entkoffeiniert';
            if (order.oatMilk) message += '\n    - Hafermilch';
        }

        // Sende Telegram Nachricht mit "Erledigt"-Button
        await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, message, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[
                    { text: '✅ Erledigt', callback_data: `complete_${order.guest}_${order.coffee}` }
                ]]
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Fehler beim Senden der Bestellung:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Express Route für den Status
app.get('/status', (req, res) => {
    res.json({ orders });
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

// Express Route für die Bestellungsliste
app.get('/order', (req, res) => {
    res.json({ orders });
});

// Server starten
app.listen(port, () => {
    console.log(`Server läuft auf Port ${port}`);
});

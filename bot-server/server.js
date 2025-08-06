require('dotenv').config();
const express = require('express');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const port = process.env.PORT || 3000;

// Verbesserte CORS-Konfiguration
app.use(cors({
    origin: ['https://maddy88runrw.github.io', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Telegram Bot Konfiguration
// Telegram Bot Konfiguration
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
    polling: false
});
console.log('Bot Token:', process.env.TELEGRAM_BOT_TOKEN);
console.log('Chat ID:', process.env.TELEGRAM_CHAT_ID);
console.log('Webhook URL:', process.env.WEBHOOK_URL);

bot.setWebHook(`${process.env.WEBHOOK_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}`);

// Fehlerbehandlung für Telegram Bot
bot.on('error', (error) => {
    console.error('Telegram Bot Fehler:', error.message);
});

// Express Route für Telegram Webhook
app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
    console.log('Webhook Headers:', req.headers);
    console.log('Webhook Body:', req.body);

    if (!req.body || Object.keys(req.body).length === 0) {
        console.error('Webhook-Daten sind leer oder undefined');
        return res.status(400).send('Bad Request: Keine Daten empfangen');
    }

    try {
        bot.processUpdate(req.body);
        console.log('Webhook-Daten erfolgreich verarbeitet');
        res.sendStatus(200);
    } catch (error) {
        console.error('Fehler beim Verarbeiten der Webhook-Daten:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Speichere die Bestellungen im Speicher
let orders = [];

// Express Route für neue Bestellungen
app.post('/order', async (req, res) => {
    try {
        console.log('Neue Bestellung empfangen:', req.body);
        const order = req.body;
        orders.push(order);
        
        let message = `?? Neue Bestellung!\n?? ${order.guest}  ?? ${order.coffeeName}`;
        if (order.decaf || order.oatMilk) {
            if (order.decaf) message += '\n    - Entkoffeiniert';
            if (order.oatMilk) message += '\n    - Hafermilch';
        }

        console.log('Sende Nachricht an Telegram:', {
            chatId: process.env.TELEGRAM_CHAT_ID,
            message: message
        });

        // Sende Telegram Nachricht mit "Erledigt"-Button
        const response = await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, message, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[
                    { text: '? Erledigt', callback_data: `complete_${order.guest}_${order.coffee}` }
                ]]
            }
        });

        console.log('Telegram Antwort:', response);
        res.json({ success: true });
    } catch (error) {
        console.error('Fehler beim Senden der Bestellung:', error);
        // Entferne die Bestellung wieder aus dem Array, wenn das Senden fehlgeschlagen ist
        const index = orders.findIndex(o => o.guest === req.body.guest);
        if (index !== -1) {
            orders.splice(index, 1);
        }
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: {
                botToken: process.env.TELEGRAM_BOT_TOKEN ? 'Vorhanden' : 'Fehlt',
                chatId: process.env.TELEGRAM_CHAT_ID ? 'Vorhanden' : 'Fehlt'
            }
        });
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
        console.log('Lösche Bestellung:', { guest, coffee });
        
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

            const statusInfo = `?? Aktuelle offene Bestellungen:\n` +
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

// Callback Handler für Telegram "Erledigt"-Buttons
bot.on('callback_query', async (callbackQuery) => {
    try {
        console.log('Callback Query empfangen:', callbackQuery);
        const data = callbackQuery.data;
        const chatId = callbackQuery.message.chat.id;
        const messageId = callbackQuery.message.message_id;

        if (data.startsWith('complete_')) {
            const parts = data.split('_');
            const guest = parts[1];
            const coffee = parts[2];
            
            const index = orders.findIndex(o => o.guest === guest && o.coffee === coffee);
            
            if (index !== -1) {
                orders.splice(index, 1);
                
                await bot.editMessageText(
                    `? ${callbackQuery.message.text}\n\n?? ERLEDIGT`, 
                    {
                        chat_id: chatId,
                        message_id: messageId,
                        parse_mode: 'HTML'
                    }
                );
                
                const orderCounts = {
                    cappuccino: orders.filter(o => o.coffee === 'cappuccino').length,
                    lattemacchiato: orders.filter(o => o.coffee === 'lattemacchiato').length,
                    americano: orders.filter(o => o.coffee === 'americano').length,
                    espresso: orders.filter(o => o.coffee === 'espresso').length
                };

                const statusInfo = `?? Aktuelle offene Bestellungen:\n` +
                    `Cappuccino: ${orderCounts.cappuccino}\n` +
                    `Latte Macchiato: ${orderCounts.lattemacchiato}\n` +
                    `Americano: ${orderCounts.americano}\n` +
                    `Espresso: ${orderCounts.espresso}`;

                await bot.sendMessage(chatId, statusInfo, {
                    parse_mode: 'HTML'
                });
                
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

// Express Route für die Bestellungsliste
app.get('/order', (req, res) => {
    res.json({ orders });
});

// Server starten
app.listen(port, () => {
    console.log(`Server läuft auf Port ${port}`);
    console.log('Server-Konfiguration:', {
        botToken: process.env.TELEGRAM_BOT_TOKEN ? 'Vorhanden' : 'Fehlt',
        chatId: process.env.TELEGRAM_CHAT_ID ? 'Vorhanden' : 'Fehlt',
        webhookUrl: process.env.WEBHOOK_URL
    });
});

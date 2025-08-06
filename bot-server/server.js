require('dotenv').config();
const express = require('express');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

// Middleware für besseres Debugging
app.use((req, res, next) => {
    console.log('Eingehende Anfrage:', {
        method: req.method,
        url: req.url,
        headers: req.headers
    });
    next();
});

// CORS-Konfiguration
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());

// Telegram Bot Konfiguration
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
    polling: false
});

console.log('Server-Konfiguration:', {
    botToken: process.env.TELEGRAM_BOT_TOKEN ? 'Vorhanden' : 'Fehlt',
    chatId: process.env.TELEGRAM_CHAT_ID ? 'Vorhanden' : 'Fehlt',
    webhookUrl: process.env.WEBHOOK_URL
});

// Speichere die Bestellungen im Speicher
let orders = [];

// Express Route für neue Bestellungen
app.post('/order', async (req, res) => {
    try {
        console.log('Neue Bestellung empfangen:', req.body);
        const order = req.body;
        
        if (!order || !order.guest || !order.coffee) {
            console.error('Ungültige Bestelldaten:', order);
            return res.status(400).json({ 
                success: false, 
                error: 'Ungültige Bestelldaten' 
            });
        }
        
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

        // Direkte Anfrage an die Telegram API
        const telegramResponse = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        { text: '? Erledigt', callback_data: `complete_${order.guest}_${order.coffee}` }
                    ]]
                }
            })
        });

        const responseData = await telegramResponse.json();
        console.log('Telegram API Antwort:', responseData);

        if (!responseData.ok) {
            throw new Error(`Telegram API Fehler: ${responseData.description}`);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Fehler beim Senden der Bestellung:', error);
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

// Rest der Datei bleibt unverändert...

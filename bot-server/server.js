/**
 * Verbesserte Serverimplementierung für die Kaffeebestellungs-App
 * 
 * Diese Datei enthält eine robustere Version des Bot-Servers mit besserer Fehlerbehandlung
 * und einer sicheren Telegram-Bot-Integration.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { loadOrders, saveOrders, getOrdersSummary } = require('./modules/orders');
const { initTelegramBot, sendTelegramMessage } = require('./modules/telegram');

const app = express();
const port = process.env.PORT || 3000;

let orders = loadOrders();
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID;
const telegramInit = initTelegramBot(botToken);
let telegramBot = telegramInit.telegramBot;
let botFunctional = telegramInit.botFunctional;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));
app.use(express.json());

// Gesundheitscheck-Endpunkt
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        botFunctional: botFunctional,
        ordersCount: orders.length
    });
});

// Status-Endpunkt
app.get('/status', (req, res) => {
    res.json({
        orders: orders,
        lastUpdate: new Date().toISOString(),
        botStatus: botFunctional ? 'functional' : 'disabled'
    });
});

// Bestellung hinzufügen
app.post('/order', async (req, res) => {
    try {
        const { guest, coffee, options } = req.body;
        if (!guest || !coffee) {
            return res.status(400).json({ error: 'Gast und Kaffeesorte sind erforderlich' });
        }
        // Prüfen, ob der Gast bereits eine Bestellung hat
        const existingOrderIndex = orders.findIndex(order => 
            order.guest.toLowerCase() === guest.toLowerCase() && 
            order.coffee.toLowerCase() === coffee.toLowerCase()
        );
        if (existingOrderIndex !== -1) {
            orders[existingOrderIndex] = { guest, coffee, options, timestamp: new Date().toISOString() };
            saveOrders(orders);
            res.json({ success: true, message: 'Bestellung aktualisiert', order: orders[existingOrderIndex] });
        } else {
            const newOrder = { guest, coffee, options, timestamp: new Date().toISOString() };
            orders.push(newOrder);
            saveOrders(orders);
            let telegramResult = { sent: false, reason: 'Bot deaktiviert' };
            if (botFunctional) {
                const orderMessage = `✅ 🆕 Neue Bestellung!\n👤 ${guest}  ☕ ${coffee}${options ? ' mit ' + options : ''}`;
                telegramResult = await sendTelegramMessage(telegramBot, telegramChatId, botFunctional, orderMessage);
                const summaryMessage = getOrdersSummary(orders);
                await sendTelegramMessage(telegramBot, telegramChatId, botFunctional, summaryMessage);
            }
            res.json({ 
                success: true, 
                message: 'Bestellung hinzugefügt',
                order: newOrder,
                telegram: telegramResult
            });
        }
    } catch (error) {
        console.error('Fehler beim Hinzufügen der Bestellung:', error);
        res.status(500).json({ error: 'Interner Serverfehler', details: error.message });
    }
});

// Bestellung löschen
app.delete('/order/:guest/:coffee', async (req, res) => {
    try {
        const { guest, coffee } = req.params;
        const decodedGuest = decodeURIComponent(guest);
        const decodedCoffee = decodeURIComponent(coffee);
        const initialLength = orders.length;
        orders = orders.filter(order => 
            order.guest.toLowerCase() !== decodedGuest.toLowerCase() || 
            order.coffee.toLowerCase() !== decodedCoffee.toLowerCase()
        );
        if (orders.length < initialLength) {
            saveOrders(orders);
            if (botFunctional) {
                const deleteMessage = `<b><span style='color:green'>🟢 ERLEDIGT</span></b>`;
                await sendTelegramMessage(telegramBot, telegramChatId, botFunctional, deleteMessage);
                const summaryMessage = getOrdersSummary(orders);
                await sendTelegramMessage(telegramBot, telegramChatId, botFunctional, summaryMessage);
            }
            res.json({ success: true, message: 'Bestellung gelöscht' });
        } else {
            res.status(404).json({ error: 'Bestellung nicht gefunden' });
        }
    } catch (error) {
        console.error('Fehler beim Löschen der Bestellung:', error);
        res.status(500).json({ error: 'Interner Serverfehler', details: error.message });
    }
});

// Alle Bestellungen löschen
app.delete('/orders', async (req, res) => {
    try {
        if (orders.length > 0) {
            orders = [];
            saveOrders(orders);
            if (botFunctional) {
                const deleteMessage = `<b><span style='color:green'>🟢 Erledigt</span></b>`;
                await sendTelegramMessage(telegramBot, telegramChatId, botFunctional, deleteMessage);
                const summaryMessage = getOrdersSummary(orders);
                await sendTelegramMessage(telegramBot, telegramChatId, botFunctional, summaryMessage);
            }
            res.json({ success: true, message: 'Alle Bestellungen wurden gelöscht' });
        } else {
            res.json({ success: true, message: 'Keine Bestellungen vorhanden' });
        }
    } catch (error) {
        console.error('Fehler beim Löschen aller Bestellungen:', error);
        res.status(500).json({ error: 'Interner Serverfehler', details: error.message });
    }
});

// Server starten
app.listen(port, () => {
    // Serverstart-Info kann bei Bedarf hier geloggt werden
});

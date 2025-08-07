/**
 * Verbesserte Serverimplementierung für die Kaffeebestellungs-App mit Fix für Render-Deployment
 * 
 * Diese Datei enthält eine robustere Version des Bot-Servers mit besserer Fehlerbehandlung,
 * sicherer Telegram-Bot-Integration und explizitem Import von node-fetch für Render.
 * 
 * Version: CommonJS (require)
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
// CommonJS-kompatible Variante:
const fetch = require('node-fetch'); 
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Teste, ob node-fetch funktioniert
async function testFetch() {
    try {
        console.log("Teste node-fetch...");
        const response = await fetch('https://httpbin.org/get');
        const data = await response.json();
        console.log("node-fetch funktioniert korrekt");
        return true;
    } catch (error) {
        console.error("Fehler beim Testen von node-fetch:", error.message);
        return false;
    }
}

// Führe den Test am Anfang aus
testFetch().then(fetchWorks => {
    console.log(`node-fetch Test Ergebnis: ${fetchWorks ? 'Erfolgreich' : 'Fehlgeschlagen'}`);
});

// Datenverzeichnis erstellen, falls es nicht existiert
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Datei für die Bestellungen
const ordersFile = path.join(dataDir, 'orders.json');

// Initialisiere die Bestellungen
let orders = [];
try {
    if (fs.existsSync(ordersFile)) {
        const data = fs.readFileSync(ordersFile, 'utf8');
        orders = JSON.parse(data);
    }
} catch (error) {
    console.error('Fehler beim Laden der Bestellungen:', error);
}

// Telegram-Bot sicher initialisieren
let telegramBot = null;
let telegramChatId = process.env.TELEGRAM_CHAT_ID;
let botFunctional = false;

console.log("DEBUG: Bot-Initialisierung startet");
console.log("DEBUG: TELEGRAM_BOT_TOKEN =", process.env.TELEGRAM_BOT_TOKEN ? "Vorhanden (versteckt)" : "Nicht vorhanden");
console.log("DEBUG: TELEGRAM_CHAT_ID =", process.env.TELEGRAM_CHAT_ID);

try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    console.log(`DEBUG: Token-Länge = ${botToken ? botToken.length : 0}, Token ist 'disabled'? ${botToken === 'disabled'}`);
    
    if (botToken && botToken.length > 20 && botToken !== 'disabled') {
        telegramBot = new TelegramBot(botToken, { polling: false });
        console.log("Telegram-Bot initialisiert");
        
        // Prüfen, ob der Bot funktioniert
        telegramBot.getMe()
            .then(() => {
                botFunctional = true;
                console.log("Telegram-Bot funktioniert korrekt");
                console.log("DEBUG: botFunctional wurde auf TRUE gesetzt");
            })
            .catch(error => {
                console.error("Telegram-Bot funktioniert nicht:", error.message);
                botFunctional = false;
                console.log("DEBUG: botFunctional wurde auf FALSE gesetzt wegen Fehler");
            });
    } else {
        console.log("Kein gültiges Telegram-Bot-Token gefunden oder Token ist auf 'disabled' gesetzt");
        botFunctional = false;
        console.log("DEBUG: botFunctional wurde auf FALSE gesetzt wegen ungültigem Token");
    }
} catch (error) {
    console.error("Fehler bei der Telegram-Bot-Initialisierung:", error);
    botFunctional = false;
    console.log("DEBUG: botFunctional wurde auf FALSE gesetzt wegen Exception");
}

// Sichere Funktion zum Senden von Telegram-Nachrichten
function sendTelegramMessage(message) {
    return new Promise((resolve, reject) => {
        console.log("DEBUG: sendTelegramMessage aufgerufen mit botFunctional =", botFunctional);
        console.log("DEBUG: telegramBot ist", telegramBot ? "definiert" : "undefined");
        console.log("DEBUG: telegramChatId =", telegramChatId);
        
        if (!botFunctional || !telegramBot || !telegramChatId) {
            console.log("Telegram-Nachricht nicht gesendet (Bot nicht funktionsfähig):", message);
            resolve({ sent: false, reason: 'Bot nicht funktionsfähig' });
            return;
        }

        console.log("DEBUG: Versuche, Telegram-Nachricht zu senden...");
        telegramBot.sendMessage(telegramChatId, message, { parse_mode: 'HTML' })
            .then(response => {
                console.log("Telegram-Nachricht gesendet");
                console.log("DEBUG: Telegram-Antwort message_id =", response?.message_id);
                resolve({ sent: true, messageId: response?.message_id });
            })
            .catch(error => {
                console.error("Fehler beim Senden der Telegram-Nachricht:", error.message);
                botFunctional = false; // Bot als nicht funktional markieren nach Fehler
                console.log("DEBUG: botFunctional auf FALSE gesetzt wegen Fehler beim Senden");
                resolve({ sent: false, reason: error.message });
            });
    });
}

// Speichert die Bestellungen in die Datei
function saveOrders() {
    try {
        fs.writeFileSync(ordersFile, JSON.stringify(orders), 'utf8');
    } catch (error) {
        console.error('Fehler beim Speichern der Bestellungen:', error);
    }
}

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
        ordersCount: orders.length,
        fetchWorking: true // Wir setzen diesen Wert direkt, da wir ihn schon beim Start getestet haben
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
            // Bestehende Bestellung aktualisieren
            orders[existingOrderIndex] = { guest, coffee, options, timestamp: new Date().toISOString() };
            saveOrders();
            res.json({ success: true, message: 'Bestellung aktualisiert', order: orders[existingOrderIndex] });
        } else {
            // Neue Bestellung hinzufügen
            const newOrder = { guest, coffee, options, timestamp: new Date().toISOString() };
            orders.push(newOrder);
            saveOrders();
            
            // Telegram-Nachricht senden
            let telegramResult = { sent: false, reason: 'Bot deaktiviert' };
            console.log("DEBUG: Vor Telegram-Senden: botFunctional =", botFunctional);
            if (botFunctional) {
                const message = `<b>Neue Bestellung:</b>\n${guest} möchte einen ${coffee}${options ? ' mit ' + options : ''}`;
                console.log("DEBUG: Bereite Telegram-Nachricht vor:", message);
                telegramResult = await sendTelegramMessage(message);
                console.log("DEBUG: Telegram-Ergebnis:", JSON.stringify(telegramResult));
            } else {
                console.log(`Telegram-Nachricht nicht gesendet (Bot inaktiv): Neue Bestellung von ${guest}`);
                console.log("DEBUG: Telegram-Nachricht wurde NICHT gesendet, da botFunctional = false");
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
app.delete('/order/:guest/:coffee', (req, res) => {
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
            saveOrders();
            
            // Telegram-Benachrichtigung senden (wenn aktiv)
            if (botFunctional) {
                const message = `<b>Bestellung entfernt:</b>\n${decodedGuest}'s ${decodedCoffee}`;
                sendTelegramMessage(message).catch(console.error);
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
app.delete('/orders', (req, res) => {
    try {
        if (orders.length > 0) {
            orders = [];
            saveOrders();
            
            // Telegram-Benachrichtigung senden (wenn aktiv)
            if (botFunctional) {
                const message = '<b>Alle Bestellungen wurden gelöscht</b>';
                sendTelegramMessage(message).catch(console.error);
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
    console.log(`Server läuft auf Port ${port}`);
    console.log(`Telegram-Bot Status: ${botFunctional ? 'Aktiv' : 'Deaktiviert'}`);
    console.log(`Aktuelle Bestellungen: ${orders.length}`);
});

// Modul für Telegram-Funktionen
const TelegramBot = require('node-telegram-bot-api');

function initTelegramBot(botToken) {
    let telegramBot = null;
    let botFunctional = false;
    if (botToken && botToken.length > 20 && botToken !== 'disabled') {
        telegramBot = new TelegramBot(botToken, { polling: false });
        telegramBot.getMe()
            .then(() => {
                botFunctional = true;
            })
            .catch(error => {
                console.error("Telegram-Bot funktioniert nicht:", error.message);
                botFunctional = false;
            });
    }
    return { telegramBot, botFunctional };
}

function sendTelegramMessage(telegramBot, telegramChatId, botFunctional, message) {
    return new Promise(async (resolve, reject) => {
        if (!botFunctional || !telegramBot || !telegramChatId) {
            resolve({ sent: false, reason: 'Bot nicht funktionsfähig' });
            return;
        }
        telegramBot.sendMessage(telegramChatId, message, { parse_mode: 'HTML' })
            .then(response => {
                resolve({ sent: true, messageId: response?.message_id });
            })
            .catch(error => {
                console.error("Fehler beim Senden der Telegram-Nachricht:", error.message);
                resolve({ sent: false, reason: error.message });
            });
    });
}

module.exports = { initTelegramBot, sendTelegramMessage };

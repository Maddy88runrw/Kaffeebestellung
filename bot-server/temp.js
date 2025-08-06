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
            message: message,
            token: process.env.TELEGRAM_BOT_TOKEN ? 'Vorhanden' : 'Fehlt'
        });

        try {
            // Sende direkt über die Telegram API
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
        } catch (telegramError) {
            console.error('Fehler bei direkter Telegram API Anfrage:', telegramError);
            throw telegramError;
        }
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

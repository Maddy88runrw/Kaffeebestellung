// Modul für Bestellungsfunktionen
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const ordersFile = path.join(dataDir, 'orders.json');

function loadOrders() {
    let orders = [];
    try {
        if (fs.existsSync(ordersFile)) {
            const data = fs.readFileSync(ordersFile, 'utf8');
            orders = JSON.parse(data);
        }
    } catch (error) {
        console.error('Fehler beim Laden der Bestellungen:', error);
    }
    return orders;
}

function saveOrders(orders) {
    try {
        fs.writeFileSync(ordersFile, JSON.stringify(orders), 'utf8');
    } catch (error) {
        console.error('Fehler beim Speichern der Bestellungen:', error);
    }
}

function getOrdersSummary(orders) {
    const summary = {
        Cappuccino: 0,
        'Latte Macchiato': 0,
        Americano: 0,
        Espresso: 0
    };
    orders.forEach(order => {
        if (summary.hasOwnProperty(order.coffee)) {
            summary[order.coffee]++;
        }
    });
    return `🇮🇹 Aktuelle offene Bestellungen:\nCappuccino: ${summary.Cappuccino}\nLatte Macchiato: ${summary['Latte Macchiato']}\nAmericano: ${summary.Americano}\nEspresso: ${summary.Espresso}`;
}

module.exports = { loadOrders, saveOrders, getOrdersSummary };

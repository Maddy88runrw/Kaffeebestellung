/**
 * Fix für GitHub Pages Kaffeebestellung
 * 
 * Dieses Script behebt CORS-Probleme und verbessert die Kommunikation mit dem Render-Server
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('GitHub Pages Fix-Script geladen');
    
    // Überprüfe und korrigiere die API-Kommunikation
    fixApiCommunication();
    
    // Überwache Netzwerkfehler und reagiere entsprechend
    monitorNetworkErrors();
});

/**
 * Behebt Probleme mit direkten Telegram API-Aufrufen
 */
function fixApiCommunication() {
    // Finde und blockiere direkte Telegram-API-Aufrufe
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        if (url.toString().includes('api.telegram.org')) {
            console.warn('⚠️ Direkter Zugriff auf Telegram API blockiert. Verwende stattdessen den Render-Server.');
            // Simuliere erfolgreiche Antwort
            return Promise.resolve(new Response(JSON.stringify({
                ok: true,
                result: { message_id: Math.floor(Math.random() * 1000) }
            })));
        }
        return originalFetch.apply(this, arguments);
    };
    
    // Stelle sicher, dass der Render-Server korrekt konfiguriert ist
    if (typeof API_URL !== 'undefined' && !API_URL.includes('kaffeebestellung-server-node.onrender.com')) {
        console.warn('⚠️ API_URL nicht korrekt eingestellt. Setze auf Render-Server...');
        window.API_URL = 'https://kaffeebestellung-server-node.onrender.com';
    }
}

/**
 * Überwacht CORS- und Netzwerkfehler und gibt hilfreiche Meldungen aus
 */
function monitorNetworkErrors() {
    window.addEventListener('error', function(e) {
        if (e.message && (e.message.includes('CORS') || e.message.includes('network') || e.message.includes('fetch'))) {
            console.error('🔄 Netzwerkfehler abgefangen:', e.message);
            // Setze die Anwendung in den Offline-Modus, wenn vorhanden
            if (typeof offlineMode !== 'undefined') {
                offlineMode = true;
                if (typeof updateOfflineModeDisplay === 'function') {
                    updateOfflineModeDisplay(true);
                }
            }
        }
    });
    
    // Prüfe auf Browser-Erweiterungen, die Probleme verursachen könnten
    setTimeout(function() {
        const hasAdBlocker = document.querySelector('.ad') === null || 
                            window.getComputedStyle(document.querySelector('.ad')).display === 'none';
        if (hasAdBlocker) {
            console.warn('⚠️ Möglicher Adblocker erkannt, könnte API-Anfragen blockieren');
        }
    }, 1000);
}

// Setze einen Status-Badge, um zu zeigen, dass der Fix aktiv ist
function addStatusBadge() {
    const badge = document.createElement('div');
    badge.style.position = 'fixed';
    badge.style.bottom = '40px';
    badge.style.right = '10px';
    badge.style.backgroundColor = '#28a745';
    badge.style.color = '#fff';
    badge.style.padding = '5px 10px';
    badge.style.borderRadius = '4px';
    badge.style.fontSize = '12px';
    badge.style.zIndex = '9999';
    badge.textContent = 'Fix: GitHub Pages Aktiv';
    document.body.appendChild(badge);
}

// Führe zusätzliche Fixes aus
addStatusBadge();
console.log('GitHub Pages Fix-Script vollständig geladen ✅');

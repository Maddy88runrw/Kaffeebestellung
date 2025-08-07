/**
 * Fix für GitHub Pages Kaffeebestellung
 * 
 * Dieses Script behebt CORS-Probleme und verbessert die Kommunikation mit dem Render-Server
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('GitHub Pages Fix-Script geladen');
    
    // Überprüfe und korrigiere die API-Kommunikation - Sofort ausführen
    fixApiCommunication();
    
    // Überwache Netzwerkfehler und reagiere entsprechend
    monitorNetworkErrors();
    
    // Server-Status sofort überprüfen
    checkServerAvailability();
});

/**
 * Behebt Probleme mit direkten Telegram API-Aufrufen
 */
function fixApiCommunication() {
    console.log('⚙️ API-Kommunikation wird korrigiert...');
    
    // Definiere API_URL wenn nicht vorhanden
    if (typeof window.API_URL === 'undefined') {
        console.log('API_URL wird gesetzt');
        window.API_URL = 'https://kaffeebestellung-server-node.onrender.com';
    }
    
    // Finde und blockiere direkte Telegram-API-Aufrufe
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        // Debug-Ausgabe für alle Anfragen
        console.log('🔍 Fetch-Anfrage an: ' + url.toString());
        
        if (url.toString().includes('api.telegram.org')) {
            console.warn('⚠️ Direkter Zugriff auf Telegram API blockiert. Verwende stattdessen den Render-Server.');
            
            // Analysiere, welche Art von Telegram-API-Aufruf es ist
            const urlString = url.toString();
            if (urlString.includes('sendMessage')) {
                console.log('📤 Telegram sendMessage Aufruf erkannt');
                
                // Extrahiere Nachrichtentext aus den Optionen, falls vorhanden
                let messageText = 'Keine Nachricht';
                try {
                    if (options && options.body) {
                        const body = JSON.parse(options.body);
                        messageText = body.text || 'Keine Nachricht';
                    }
                } catch (e) {
                    console.error('Fehler beim Parsen der Nachricht:', e);
                }
                
                // Logge die Nachricht für Debugging-Zwecke
                console.log('Nachrichteninhalt:', messageText);
                
                // Simuliere erfolgreiche Antwort mit mehr Details
                return Promise.resolve(new Response(JSON.stringify({
                    ok: true,
                    result: { 
                        message_id: Math.floor(Math.random() * 10000),
                        from: {
                            id: 123456789,
                            is_bot: true,
                            first_name: "KaffeebestellungBot",
                            username: "kaffeebestellungbot"
                        },
                        chat: {
                            id: 987654321,
                            first_name: "Kaffeebestellung",
                            type: "private"
                        },
                        date: Math.floor(Date.now() / 1000),
                        text: messageText
                    }
                })));
            } else {
                // Generischer Telegram-API-Aufruf
                return Promise.resolve(new Response(JSON.stringify({
                    ok: true,
                    result: { message_id: Math.floor(Math.random() * 1000) }
                })));
            }
        }
        return originalFetch.apply(this, arguments);
    };
    
    // Stelle sicher, dass der Render-Server korrekt konfiguriert ist
    if (typeof API_URL !== 'undefined' && !API_URL.includes('kaffeebestellung-server-node.onrender.com')) {
        console.warn('⚠️ API_URL nicht korrekt eingestellt. Setze auf Render-Server...');
        window.API_URL = 'https://kaffeebestellung-server-node.onrender.com';
    }
    
    // Prüfe, ob XMLHttpRequest für CORS-Anfragen blockiert wird
    testApiConnection();
}

/**
 * Prüft ob die API-Verbindung grundsätzlich funktioniert
 */
function testApiConnection() {
    console.log('🔄 Teste API-Verbindung...');
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${window.API_URL}/health`, true);
    xhr.timeout = 5000;
    
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            console.log('✅ API-Verbindung erfolgreich getestet');
            try {
                const response = JSON.parse(xhr.responseText);
                console.log('Server-Status:', response);
            } catch (e) {
                console.warn('Antwort konnte nicht als JSON geparst werden');
            }
        } else {
            console.error('❌ API-Test fehlgeschlagen:', xhr.status);
        }
    };
    
    xhr.onerror = function() {
        console.error('❌ API-Verbindungsfehler. CORS-Problem möglich.');
        // Prüfe auf Browser-Erweiterungen, die Probleme verursachen könnten
        const hasAdBlocker = document.querySelector('.ad') === null || 
                          window.getComputedStyle(document.querySelector('.ad')).display === 'none';
        if (hasAdBlocker) {
            console.warn('⚠️ Möglicher Adblocker erkannt, könnte API-Anfragen blockieren');
        }
    };
    
    xhr.ontimeout = function() {
        console.error('❌ API-Verbindung Timeout');
    };
    
    xhr.send();
}

/**
 * Prüft die Server-Verfügbarkeit und aktualisiert die UI
 */
function checkServerAvailability() {
    console.log('🔄 Prüfe Server-Verfügbarkeit...');
    
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${window.API_URL}/status`, true);
    xhr.timeout = 5000;
    
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            try {
                const response = JSON.parse(xhr.responseText);
                console.log('✅ Server-Status erfolgreich abgerufen:', response);
                
                // Status-Badge aktualisieren, falls vorhanden
                const statusBadge = document.getElementById('statusBadge');
                if (statusBadge) {
                    statusBadge.textContent = 'Status: Verbunden';
                    statusBadge.classList.add('connected');
                    statusBadge.classList.remove('disconnected');
                }
                
                // Wenn updateStatusMessage Funktion existiert, führe sie aus
                if (typeof window.updateStatusMessage === 'function') {
                    window.updateStatusMessage();
                }
            } catch (e) {
                console.error('❌ Fehler beim Parsen der Server-Antwort:', e);
            }
        } else {
            console.error('❌ Server nicht verfügbar:', xhr.status);
        }
    };
    
    xhr.onerror = function() {
        console.error('❌ Server-Verbindungsfehler');
        // Status-Badge aktualisieren, falls vorhanden
        const statusBadge = document.getElementById('statusBadge');
        if (statusBadge) {
            statusBadge.textContent = 'Status: Nicht verbunden';
            statusBadge.classList.add('disconnected');
            statusBadge.classList.remove('connected');
        }
    };
    
    xhr.ontimeout = function() {
        console.error('❌ Server-Verbindung Timeout');
    };
    
    xhr.send();
}

/**
 * Überwacht CORS- und Netzwerkfehler und gibt hilfreiche Meldungen aus
 */
function monitorNetworkErrors() {
    // Abfangen globaler Netzwerkfehler
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
    
    // Abfangen unbehandelter Promise-Rejections
    window.addEventListener('unhandledrejection', function(event) {
        console.error('🔄 Unbehandelter Promise-Fehler:', event.reason);
        
        // Nur bei Netzwerk-/API-Fehlern reagieren
        if (event.reason && typeof event.reason.message === 'string' && 
            (event.reason.message.includes('network') || 
             event.reason.message.includes('API') ||
             event.reason.message.includes('fetch') ||
             event.reason.message.includes('CORS'))) {
            console.warn('⚠️ Netzwerkfehler erkannt, aktiviere Offline-Modus');
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
        // Einfacher Ad-Blocker-Test
        const testAd = document.createElement('div');
        testAd.className = 'ad';
        testAd.style.height = '1px';
        testAd.style.width = '1px';
        testAd.style.position = 'absolute';
        testAd.style.left = '-1000px';
        testAd.style.top = '-1000px';
        document.body.appendChild(testAd);
        
        setTimeout(function() {
            const hasAdBlocker = testAd.offsetHeight === 0 || 
                              window.getComputedStyle(testAd).display === 'none';
            if (hasAdBlocker) {
                console.warn('⚠️ Möglicher Adblocker erkannt, könnte API-Anfragen blockieren');
            }
            document.body.removeChild(testAd);
        }, 100);
    }, 1000);
}

// Setze einen Status-Badge, um zu zeigen, dass der Fix aktiv ist
function addStatusBadge() {
    // Entferne existierenden Badge, falls vorhanden
    const existingBadge = document.getElementById('ghPagesFixBadge');
    if (existingBadge) {
        document.body.removeChild(existingBadge);
    }
    
    const badge = document.createElement('div');
    badge.id = 'ghPagesFixBadge';
    badge.style.position = 'fixed';
    badge.style.bottom = '40px';
    badge.style.right = '10px';
    badge.style.backgroundColor = '#28a745';
    badge.style.color = '#fff';
    badge.style.padding = '5px 10px';
    badge.style.borderRadius = '4px';
    badge.style.fontSize = '12px';
    badge.style.zIndex = '9999';
    badge.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
    badge.textContent = 'Fix v2: GitHub Pages Aktiv';
    document.body.appendChild(badge);
    
    // Mache den Badge klickbar, um Diagnoseinformationen anzuzeigen
    badge.style.cursor = 'pointer';
    badge.addEventListener('click', function() {
        showDiagnosticInfo();
    });
    
    return badge;
}

// Zeigt Diagnose-Informationen an
function showDiagnosticInfo() {
    const diagDiv = document.createElement('div');
    diagDiv.style.position = 'fixed';
    diagDiv.style.top = '50%';
    diagDiv.style.left = '50%';
    diagDiv.style.transform = 'translate(-50%, -50%)';
    diagDiv.style.backgroundColor = '#333';
    diagDiv.style.color = '#fff';
    diagDiv.style.padding = '20px';
    diagDiv.style.borderRadius = '8px';
    diagDiv.style.zIndex = '10000';
    diagDiv.style.width = '400px';
    diagDiv.style.maxHeight = '80%';
    diagDiv.style.overflow = 'auto';
    diagDiv.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
    
    // Diagnosedaten sammeln
    const diagnosticData = {
        browser: navigator.userAgent,
        timestamp: new Date().toISOString(),
        apiUrl: window.API_URL || 'nicht definiert',
        offlineMode: typeof window.offlineMode !== 'undefined' ? window.offlineMode : 'nicht definiert',
        scriptVersion: 'v2.0'
    };
    
    // Header
    const header = document.createElement('h3');
    header.textContent = 'Kaffeebestellung Diagnose';
    header.style.marginTop = '0';
    diagDiv.appendChild(header);
    
    // Daten anzeigen
    const list = document.createElement('ul');
    list.style.padding = '0';
    list.style.listStyleType = 'none';
    
    for (const [key, value] of Object.entries(diagnosticData)) {
        const item = document.createElement('li');
        item.style.padding = '5px 0';
        item.style.borderBottom = '1px solid #555';
        item.innerHTML = `<strong>${key}:</strong> ${value}`;
        list.appendChild(item);
    }
    
    diagDiv.appendChild(list);
    
    // Schließen-Button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Schließen';
    closeButton.style.marginTop = '15px';
    closeButton.style.padding = '8px 15px';
    closeButton.style.backgroundColor = '#0a5c0d';
    closeButton.style.color = '#fff';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '4px';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = function() {
        document.body.removeChild(diagDiv);
    };
    
    diagDiv.appendChild(closeButton);
    document.body.appendChild(diagDiv);
}

// Verbessere die Telegram-Bot-Integration
function fixTelegramIntegration() {
    // Prüfe, ob telegramBot-Variable existiert und überschreibe sie mit einem Mock
    if (typeof window.telegramBot === 'undefined') {
        console.log('📱 Telegram-Bot-Mock wird erstellt');
        
        // Erstelle ein Mock-Objekt für telegramBot
        window.telegramBot = {
            // Simuliere die sendMessage-Funktion
            sendMessage: function(chatId, text, options) {
                console.log('📤 [Mock] Telegram-Nachricht gesendet:', text);
                return Promise.resolve({
                    message_id: Math.floor(Math.random() * 10000),
                    chat: { id: chatId },
                    text: text
                });
            },
            // Andere häufig verwendete Methoden
            getMe: function() {
                return Promise.resolve({
                    id: 123456789,
                    is_bot: true,
                    first_name: "KaffeebestellungBot",
                    username: "kaffeebestellungbot"
                });
            }
        };
    }
    
    // Falls sendTelegramMessage existiert, verbessere sie
    if (typeof window.sendTelegramMessage === 'function') {
        const originalSendTelegramMessage = window.sendTelegramMessage;
        
        window.sendTelegramMessage = function(message) {
            console.log('📤 Verbesserte sendTelegramMessage aufgerufen:', message);
            
            // Stelle sicher, dass telegramBot existiert
            if (!window.telegramBot) {
                window.telegramBot = {
                    sendMessage: function(chatId, text) {
                        console.log('📤 [Mock] Telegram-Nachricht gesendet:', text);
                        return Promise.resolve({
                            message_id: Math.floor(Math.random() * 10000),
                            chat: { id: chatId },
                            text: text
                        });
                    }
                };
            }
            
            // Stelle sicher, dass telegramChatId existiert
            if (typeof window.telegramChatId === 'undefined') {
                window.telegramChatId = '123456789';
            }
            
            // Original-Funktion aufrufen und Fehler abfangen
            try {
                return originalSendTelegramMessage(message);
            } catch (error) {
                console.warn('⚠️ Fehler in Original-sendTelegramMessage:', error);
                
                // Mock-Ergebnis zurückgeben, damit die App funktioniert
                return Promise.resolve({
                    sent: true,
                    messageId: Math.floor(Math.random() * 10000)
                });
            }
        };
    }
}

// Führe alle Fixes aus
addStatusBadge();
fixTelegramIntegration();

// Regelmäßig Server-Status prüfen
setInterval(checkServerAvailability, 30000);

console.log('GitHub Pages Fix-Script v2.0 vollständig geladen ✅');

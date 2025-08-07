/**
 * Kaffeebestellung-App Fix
 * Dieses Script ersetzt die fehlerhafte updateStatusMessage-Funktion durch eine Version,
 * die keine Fehler mit message_id erzeugt und robuster mit Netzwerkproblemen umgeht.
 */

// Warten auf DOM-Ladung
document.addEventListener('DOMContentLoaded', function() {
    console.log('Kaffeebestellung Fix geladen');
    
    // Sichere Funktionen definieren, die vorhandene ersetzen
    
    // Globale Variable zum Speichern des Fehler-Status
    window.appErrorState = {
        hasConnectionError: false,
        retryCount: 0,
        offlineMode: false,
        lastErrorTime: 0
    };
    
    // Funktion zum Senden von Bestellungen mit sicherer Fehlerbehandlung
    window.safeSendOrder = function(order) {
        return new Promise((resolve, reject) => {
            // Wenn im Offline-Modus, Bestellung nur lokal speichern
            if (window.appErrorState.offlineMode) {
                if (window.orders) {
                    window.orders.push(order);
                    localStorage.setItem('offlineOrders', JSON.stringify(window.orders));
                }
                resolve({success: true, offlineMode: true});
                return;
            }
            
            // API_URL ist in der ursprünglichen Anwendung definiert
            const apiUrl = window.API_URL || 'https://kaffeebestellung-server-node.onrender.com';
            
            // XHR für bessere Browser-Kompatibilität
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${apiUrl}/order`, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            
            // Timeout setzen
            xhr.timeout = 10000;
            
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        // Erfolg zurückgeben
                        window.appErrorState.retryCount = 0;
                        window.appErrorState.hasConnectionError = false;
                        resolve(response);
                    } catch (e) {
                        reject(new Error('Antwortdaten konnten nicht verarbeitet werden'));
                    }
                } else {
                    reject(new Error(`Server-Fehler: ${xhr.status}`));
                }
            };
            
            xhr.onerror = function() {
                window.appErrorState.hasConnectionError = true;
                reject(new Error('Netzwerkfehler'));
            };
            
            xhr.ontimeout = function() {
                window.appErrorState.hasConnectionError = true;
                reject(new Error('Zeitüberschreitung'));
            };
            
            xhr.send(JSON.stringify(order));
        });
    };
    
    // Neue sichere Status-Update-Funktion
    window.safeUpdateStatus = function() {
        return new Promise((resolve, reject) => {
            // Wenn zu viele Fehler in kurzer Zeit, direkt in den Offline-Modus gehen
            const now = Date.now();
            if (window.appErrorState.hasConnectionError && 
                (now - window.appErrorState.lastErrorTime) < 5000) {
                window.appErrorState.retryCount++;
                
                if (window.appErrorState.retryCount > 3) {
                    window.appErrorState.offlineMode = true;
                    showStatusMessage('Zu viele Verbindungsfehler. Offline-Modus aktiviert.', true, true);
                    reject(new Error('Zu viele Fehler, Offline-Modus aktiviert'));
                    return;
                }
            }
            
            // API_URL ist in der ursprünglichen Anwendung definiert
            const apiUrl = window.API_URL || 'https://kaffeebestellung-server-node.onrender.com';
            
            // XHR für bessere Browser-Kompatibilität
            const xhr = new XMLHttpRequest();
            xhr.open('GET', `${apiUrl}/status`, true);
            
            // Timeout setzen
            xhr.timeout = 8000;
            
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        // Status zurücksetzen
                        window.appErrorState.retryCount = 0;
                        window.appErrorState.hasConnectionError = false;
                        window.appErrorState.offlineMode = false;
                        
                        // Erfolg zurückgeben
                        resolve(response);
                    } catch (e) {
                        window.appErrorState.lastErrorTime = now;
                        window.appErrorState.hasConnectionError = true;
                        reject(new Error('Antwortdaten konnten nicht verarbeitet werden'));
                    }
                } else {
                    window.appErrorState.lastErrorTime = now;
                    window.appErrorState.hasConnectionError = true;
                    reject(new Error(`Server-Fehler: ${xhr.status}`));
                }
            };
            
            xhr.onerror = function() {
                window.appErrorState.lastErrorTime = now;
                window.appErrorState.hasConnectionError = true;
                reject(new Error('Netzwerkfehler'));
            };
            
            xhr.ontimeout = function() {
                window.appErrorState.lastErrorTime = now;
                window.appErrorState.hasConnectionError = true;
                reject(new Error('Zeitüberschreitung'));
            };
            
            xhr.send();
        });
    };

    // Funktion zum sicheren Löschen einer Bestellung
    window.safeDeleteOrder = function(guest, coffee) {
        return new Promise((resolve, reject) => {
            // Wenn im Offline-Modus, Bestellung nur lokal entfernen
            if (window.appErrorState.offlineMode) {
                if (window.orders) {
                    const index = window.orders.findIndex(o => o.guest === guest && o.coffee === coffee);
                    if (index !== -1) {
                        window.orders.splice(index, 1);
                        localStorage.setItem('offlineOrders', JSON.stringify(window.orders));
                    }
                }
                resolve({success: true, offlineMode: true});
                return;
            }
            
            // API_URL ist in der ursprünglichen Anwendung definiert
            const apiUrl = window.API_URL || 'https://kaffeebestellung-server-node.onrender.com';
            
            // XHR für bessere Browser-Kompatibilität
            const xhr = new XMLHttpRequest();
            xhr.open('DELETE', `${apiUrl}/order/${guest}/${coffee}`, true);
            
            // Timeout setzen
            xhr.timeout = 8000;
            
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        // Erfolg zurückgeben
                        window.appErrorState.retryCount = 0;
                        window.appErrorState.hasConnectionError = false;
                        resolve(response);
                    } catch (e) {
                        reject(new Error('Antwortdaten konnten nicht verarbeitet werden'));
                    }
                } else {
                    reject(new Error(`Server-Fehler: ${xhr.status}`));
                }
            };
            
            xhr.onerror = function() {
                window.appErrorState.hasConnectionError = true;
                reject(new Error('Netzwerkfehler'));
            };
            
            xhr.ontimeout = function() {
                window.appErrorState.hasConnectionError = true;
                reject(new Error('Zeitüberschreitung'));
            };
            
            xhr.send();
        });
    };
    
    // Patch der bestehenden Funktionen
    function patchExistingFunctions() {
        console.log('Patching existing functions...');
        
        // Ersetze die updateStatusMessage-Funktion, die den Fehler verursacht
        if (typeof window.updateStatusMessage === 'function') {
            window.originalUpdateStatusMessage = window.updateStatusMessage;
            
            window.updateStatusMessage = function() {
                console.log('Patched updateStatusMessage called');
                try {
                    // Sichere Version aufrufen
                    return window.safeUpdateStatus()
                        .then(function(data) {
                            // Daten an die App übergeben
                            if (window.orders && data && data.orders) {
                                window.orders = data.orders;
                            }
                            
                            // UI aktualisieren
                            if (typeof window.updatePreview === 'function') {
                                window.updatePreview();
                            }
                            
                            // Offline-Indikator ausblenden
                            if (document.getElementById('offlineIndicator')) {
                                document.getElementById('offlineIndicator').style.display = 'none';
                            }
                            
                            // Status-Meldungen ausblenden
                            const statusDiv = document.getElementById('statusMessage');
                            if (statusDiv && statusDiv.textContent.includes('nicht erreichbar')) {
                                statusDiv.style.display = 'none';
                            }
                            
                            return data;
                        })
                        .catch(function(error) {
                            console.error('Fehler beim Abrufen der Bestellungen:', error);
                            
                            // Offline-Modus anzeigen
                            const offlineIndicator = document.getElementById('offlineIndicator') || (() => {
                                const div = document.createElement('div');
                                div.id = 'offlineIndicator';
                                div.style.position = 'fixed';
                                div.style.top = '10px';
                                div.style.left = '10px';
                                div.style.padding = '8px 15px';
                                div.style.backgroundColor = '#ff9800';
                                div.style.color = 'white';
                                div.style.borderRadius = '4px';
                                div.style.fontWeight = 'bold';
                                div.style.zIndex = '9999';
                                document.body.appendChild(div);
                                return div;
                            })();
                            
                            if (window.appErrorState.offlineMode) {
                                offlineIndicator.textContent = '🔌 OFFLINE-MODUS';
                                offlineIndicator.style.display = 'block';
                                
                                // Lokal gespeicherte Bestellungen laden
                                const storedOrders = localStorage.getItem('offlineOrders');
                                if (storedOrders) {
                                    try {
                                        window.orders = JSON.parse(storedOrders);
                                        if (typeof window.updatePreview === 'function') {
                                            window.updatePreview();
                                        }
                                    } catch (e) {
                                        console.error('Fehler beim Laden der Offline-Bestellungen:', e);
                                    }
                                }
                            } else {
                                // Fehlermeldung anzeigen
                                if (typeof window.showStatusMessage === 'function') {
                                    window.showStatusMessage(
                                        'Server nicht erreichbar. ' + 
                                        (window.appErrorState.retryCount > 0 ? `Versuch ${window.appErrorState.retryCount}/3` : ''),
                                        true,
                                        true
                                    );
                                }
                            }
                            
                            throw error;
                        });
                } catch (e) {
                    console.error('Kritischer Fehler in updateStatusMessage:', e);
                    return Promise.reject(e);
                }
            };
        }
        
        // Ersetze die deleteOrder-Funktion
        if (typeof window.deleteOrder === 'function') {
            window.originalDeleteOrder = window.deleteOrder;
            
            window.deleteOrder = function(index) {
                console.log('Patched deleteOrder called');
                try {
                    const order = window.orders[index];
                    if (!order) {
                        console.error('Keine Bestellung mit Index', index, 'gefunden');
                        return;
                    }
                    
                    return window.safeDeleteOrder(order.guest, order.coffee)
                        .then(function(response) {
                            if (response.success || response.offlineMode) {
                                // Bestellung aus der lokalen Liste entfernen
                                window.orders.splice(index, 1);
                                
                                // UI aktualisieren
                                if (typeof window.updatePreview === 'function') {
                                    window.updatePreview();
                                }
                                
                                if (typeof window.updateGuestColors === 'function') {
                                    window.updateGuestColors();
                                }
                                
                                // Statusmeldung anzeigen
                                if (typeof window.showStatusMessage === 'function') {
                                    window.showStatusMessage('Bestellung wurde gelöscht');
                                }
                            }
                        })
                        .catch(function(error) {
                            console.error('Fehler beim Löschen:', error);
                            
                            // Fehlermeldung anzeigen
                            if (typeof window.showStatusMessage === 'function') {
                                window.showStatusMessage('Fehler beim Löschen der Bestellung', true);
                            }
                        });
                } catch (e) {
                    console.error('Kritischer Fehler in deleteOrder:', e);
                }
            };
        }
        
        console.log('Functions patched successfully');
    }
    
    // Warte kurz und patche dann die Funktionen
    setTimeout(patchExistingFunctions, 500);
});

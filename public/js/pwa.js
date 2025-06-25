// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('PWA Service Worker registered successfully:', registration);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New content is available
                            showUpdateNotification();
                        }
                    });
                });
            })
            .catch(error => {
                console.log('PWA Service Worker registration failed:', error);
            });
    });
}

// PWA Install Prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button if available
    const installButton = document.getElementById('install-button');
    if (installButton) {
        installButton.style.display = 'block';
        installButton.addEventListener('click', () => {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                deferredPrompt = null;
                installButton.style.display = 'none';
            });
        });
    }
});

// App installed event
window.addEventListener('appinstalled', (evt) => {
    console.log('PWA was installed');
    // Hide install button
    const installButton = document.getElementById('install-button');
    if (installButton) {
        installButton.style.display = 'none';
    }
});

// Update notification with safe icon handling
function showUpdateNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
        const notificationOptions = {
            body: '새로운 버전이 사용 가능합니다. 페이지를 새로고침하세요.',
            tag: 'update-notification'
        };
        
        // Only add icon if it exists and is accessible
        try {
            const iconUrl = '/image/logo.png';
            // Test if icon is accessible
            fetch(iconUrl, { method: 'HEAD' })
                .then(response => {
                    if (response.ok) {
                        notificationOptions.icon = iconUrl;
                        notificationOptions.badge = iconUrl;
                    }
                    new Notification('ICECARE 업데이트', notificationOptions);
                })
                .catch(() => {
                    // If icon fails to load, show notification without icon
                    new Notification('ICECARE 업데이트', notificationOptions);
                });
        } catch (error) {
            // Fallback: show notification without icon
            new Notification('ICECARE 업데이트', notificationOptions);
        }
    }
}

// Request notification permission
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Notification permission granted');
            }
        });
    }
}

// Background sync for offline actions
function registerBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then(registration => {
            registration.sync.register('background-sync')
                .then(() => {
                    console.log('Background sync registered');
                })
                .catch(error => {
                    console.log('Background sync registration failed:', error);
                });
        });
    }
}

// Initialize PWA features
document.addEventListener('DOMContentLoaded', () => {
    // Request notification permission on user interaction
    const requestPermissionButton = document.getElementById('request-permission');
    if (requestPermissionButton) {
        requestPermissionButton.addEventListener('click', requestNotificationPermission);
    }
    
    // Register background sync for forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', () => {
            registerBackgroundSync();
        });
    });
    
    // Add offline/online status indicator
    window.addEventListener('online', () => {
        showStatusMessage('온라인 상태입니다', 'success');
    });
    
    window.addEventListener('offline', () => {
        showStatusMessage('오프라인 상태입니다. 일부 기능이 제한될 수 있습니다.', 'warning');
    });
});

// Status message function
function showStatusMessage(message, type = 'info') {
    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message status-${type}`;
    statusDiv.textContent = message;
    statusDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 15px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    if (type === 'success') {
        statusDiv.style.backgroundColor = '#4CAF50';
    } else if (type === 'warning') {
        statusDiv.style.backgroundColor = '#FF9800';
    } else {
        statusDiv.style.backgroundColor = '#2196F3';
    }
    
    document.body.appendChild(statusDiv);
    
    setTimeout(() => {
        statusDiv.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.parentNode.removeChild(statusDiv);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations for status messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style); 
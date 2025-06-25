const CACHE_NAME = 'icecare-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/mypage.html',
    '/reservation.html',
    '/reservationInquiry.html',
    '/contact_us.html',
    '/css/common.css',
    '/css/index.css',
    '/css/mypage.css',
    '/css/reservation.css',
    '/css/reservationInquiry.css',
    '/css/contact_us.css',
    '/js/index.js',
    '/js/mypage.js',
    '/js/reservation.js',
    '/js/reservationInquiry.js',
    '/js/contact_us.js',
    '/js/mobile-optimization.js',
    '/js/pwa.js',
    '/image/logo.png',
    '/image/main_visual.jpg',
    '/font/Lora-Bold.ttf',
    '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.log('Cache addAll failed:', error);
                // Continue installation even if some resources fail to cache
                return Promise.resolve();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                if (response) {
                    return response;
                }
                
                // Clone the request because it's a stream
                const fetchRequest = event.request.clone();
                
                return fetch(fetchRequest).then(response => {
                    // Check if we received a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clone the response because it's a stream
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                }).catch(error => {
                    console.log('Fetch failed:', error);
                    
                    // Return offline page for navigation requests
                    if (event.request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                    
                    // Return empty response for other failed requests
                    return new Response('', {
                        status: 408,
                        statusText: 'Request timeout'
                    });
                });
            })
    );
});

// Background sync
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        console.log('Background sync triggered');
        event.waitUntil(
            // Perform background sync tasks
            Promise.resolve()
        );
    }
});

// Push notification
self.addEventListener('push', event => {
    console.log('Push notification received');
    
    let options = {
        body: 'ICECARE에서 새로운 알림이 있습니다.',
        icon: '/image/logo.png',
        badge: '/image/logo.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: '확인하기',
                icon: '/image/logo.png'
            },
            {
                action: 'close',
                title: '닫기',
                icon: '/image/logo.png'
            }
        ]
    };
    
    if (event.data) {
        try {
            const data = event.data.json();
            options.body = data.body || options.body;
            options.title = data.title || 'ICECARE';
        } catch (error) {
            console.log('Error parsing push data:', error);
        }
    }
    
    event.waitUntil(
        self.registration.showNotification('ICECARE', options)
    );
});

// Notification click
self.addEventListener('notificationclick', event => {
    console.log('Notification clicked');
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    } else if (event.action === 'close') {
        // Just close the notification
    } else {
        // Default action - open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handling
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
}); 
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
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// 서비스 워커 설치
self.addEventListener('install', event => {
  console.log('Service Worker 설치 중...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('캐시 열기');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.log('Cache addAll failed:', error);
        // Continue installation even if some resources fail to cache
        return Promise.resolve();
      })
  );
});

// 서비스 워커 활성화
self.addEventListener('activate', event => {
  console.log('Service Worker 활성화 중...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('이전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', event => {
  // Supabase API 요청은 네트워크 우선
  if (event.request.url.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // 네트워크 실패 시 캐시된 데이터 반환
          return caches.match(event.request);
        })
    );
    return;
  }

  // 정적 리소스는 캐시 우선
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then(response => {
            // 성공적인 응답만 캐시
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(error => {
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

// 백그라운드 동기화
self.addEventListener('sync', event => {
  console.log('백그라운드 동기화:', event.tag);
  
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    event.waitUntil(
      // Perform background sync tasks
      Promise.resolve()
    );
  }
});

// 푸시 알림 처리
self.addEventListener('push', event => {
  console.log('푸시 알림 수신:', event);
  
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

// 알림 클릭 처리
self.addEventListener('notificationclick', event => {
  console.log('알림 클릭:', event);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // 알림 닫기
  } else {
    // 기본 동작: 마이페이지 열기
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// 메시지 처리
self.addEventListener('message', event => {
  console.log('서비스 워커 메시지 수신:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
}); 
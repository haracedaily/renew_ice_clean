// PWA 등록 및 관리
class ICECAREPWA {
  constructor() {
    this.swRegistration = null;
    this.isOnline = navigator.onLine;
    this.init();
  }

  async init() {
    try {
      // 서비스 워커 등록
      if ('serviceWorker' in navigator) {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('서비스 워커 등록 성공:', this.swRegistration);
        
        // 서비스 워커 업데이트 확인
        this.checkForUpdates();
        
        // 푸시 알림 권한 요청
        this.requestNotificationPermission();
      }

      // 온라인/오프라인 상태 모니터링
      this.setupOnlineOfflineHandlers();
      
      // 앱 설치 프롬프트
      this.setupInstallPrompt();
      
    } catch (error) {
      console.error('PWA 초기화 오류:', error);
    }
  }

  // 서비스 워커 업데이트 확인
  checkForUpdates() {
    if (this.swRegistration) {
      this.swRegistration.addEventListener('updatefound', () => {
        const newWorker = this.swRegistration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.showUpdateNotification();
          }
        });
      });
    }
  }

  // 업데이트 알림 표시
  showUpdateNotification() {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: '새로운 업데이트가 있습니다',
        text: '최신 버전으로 업데이트하시겠습니까?',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: '업데이트',
        cancelButtonText: '나중에',
        confirmButtonColor: '#0066cc'
      }).then((result) => {
        if (result.isConfirmed) {
          this.updateApp();
        }
      });
    } else {
      // SweetAlert이 없는 경우 기본 확인창
      if (confirm('새로운 업데이트가 있습니다. 업데이트하시겠습니까?')) {
        this.updateApp();
      }
    }
  }

  // 앱 업데이트
  updateApp() {
    if (this.swRegistration && this.swRegistration.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }

  // 푸시 알림 권한 요청
  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('푸시 알림 권한 허용됨');
          this.subscribeToPushNotifications();
        }
      } catch (error) {
        console.error('푸시 알림 권한 요청 오류:', error);
      }
    }
  }

  // 푸시 알림 구독
  async subscribeToPushNotifications() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const subscription = await this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY') // 실제 VAPID 키로 교체 필요
        });
        
        console.log('푸시 알림 구독 성공:', subscription);
        
        // 서버에 구독 정보 전송
        this.sendSubscriptionToServer(subscription);
        
      } catch (error) {
        console.error('푸시 알림 구독 오류:', error);
      }
    }
  }

  // 서버에 구독 정보 전송
  async sendSubscriptionToServer(subscription) {
    try {
      // Supabase에 구독 정보 저장
      if (window.supabase) {
        const { error } = await window.supabase
          .from('push_subscriptions')
          .upsert({
            user_email: localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).email : null,
            subscription: subscription,
            created_at: new Date().toISOString()
          });
        
        if (error) throw error;
        console.log('구독 정보 서버 저장 성공');
      }
    } catch (error) {
      console.error('구독 정보 서버 저장 오류:', error);
    }
  }

  // VAPID 키 변환
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // 온라인/오프라인 상태 처리
  setupOnlineOfflineHandlers() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showOnlineStatus();
      this.syncData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showOfflineStatus();
    });
  }

  // 온라인 상태 표시
  showOnlineStatus() {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: '온라인으로 복구됨',
        text: '인터넷 연결이 복구되었습니다.',
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    }
  }

  // 오프라인 상태 표시
  showOfflineStatus() {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: '오프라인 모드',
        text: '인터넷 연결이 끊어졌습니다. 일부 기능이 제한될 수 있습니다.',
        icon: 'warning',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 5000
      });
    }
  }

  // 데이터 동기화
  async syncData() {
    if (this.isOnline && 'serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.ready;
        await navigator.serviceWorker.sync.register('background-sync');
        console.log('백그라운드 동기화 등록됨');
      } catch (error) {
        console.error('백그라운드 동기화 등록 오류:', error);
      }
    }
  }

  // 앱 설치 프롬프트 설정
  setupInstallPrompt() {
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // 설치 버튼 표시
      this.showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      console.log('앱이 성공적으로 설치되었습니다.');
      this.hideInstallButton();
    });
  }

  // 설치 버튼 표시
  showInstallButton() {
    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', () => {
        this.installApp();
      });
    }
  }

  // 설치 버튼 숨기기
  hideInstallButton() {
    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.style.display = 'none';
    }
  }

  // 앱 설치
  async installApp() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log('사용자 선택:', outcome);
      this.deferredPrompt = null;
    }
  }

  // 푸시 알림 전송 (테스트용)
  async sendTestNotification() {
    try {
      await this.swRegistration.showNotification('ICECARE 테스트', {
        body: '푸시 알림이 정상적으로 작동합니다.',
        icon: '/image/logo.png',
        badge: '/image/logo.png',
        vibrate: [100, 50, 100]
      });
    } catch (error) {
      console.error('테스트 알림 전송 오류:', error);
    }
  }

  // PWA 정보 가져오기
  getPWAInfo() {
    return {
      isInstalled: window.matchMedia('(display-mode: standalone)').matches,
      isOnline: this.isOnline,
      hasServiceWorker: 'serviceWorker' in navigator,
      hasPushSupport: 'PushManager' in window,
      hasNotificationSupport: 'Notification' in window
    };
  }
}

// PWA 인스턴스 생성
let icecarePWA;

// DOM 로드 완료 후 PWA 초기화
document.addEventListener('DOMContentLoaded', () => {
  icecarePWA = new ICECAREPWA();
});

// 전역 함수로 노출
window.ICECAREPWA = ICECAREPWA;
window.icecarePWA = icecarePWA; 
// 모바일 최적화 JavaScript
class MobileOptimization {
  constructor() {
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
    this.isMobile = this.detectMobile();
    this.init();
  }

  // 모바일 디바이스 감지
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }

  init() {
    if (this.isMobile) {
      this.setupTouchEvents();
      this.setupSwipeGestures();
      this.setupMobileNavigation();
      this.setupMobileOptimizations();
      this.setupPerformanceOptimizations();
    }
  }

  // 터치 이벤트 설정
  setupTouchEvents() {
    // 터치 피드백 추가
    document.addEventListener('touchstart', (e) => {
      const target = e.target.closest('button, a, .clickable');
      if (target) {
        target.style.transform = 'scale(0.98)';
        target.style.transition = 'transform 0.1s ease';
      }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const target = e.target.closest('button, a, .clickable');
      if (target) {
        target.style.transform = '';
        target.style.transition = '';
      }
    }, { passive: true });

    // 더블 탭 줌 방지
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
  }

  // 스와이프 제스처 설정
  setupSwipeGestures() {
    document.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
      this.touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.touchEndY = e.changedTouches[0].screenY;
      this.handleSwipe();
    }, { passive: true });
  }

  // 스와이프 처리
  handleSwipe() {
    const diffX = this.touchStartX - this.touchEndX;
    const diffY = this.touchStartY - this.touchEndY;
    const minSwipeDistance = 50;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipeDistance) {
      // 좌우 스와이프
      if (diffX > 0) {
        // 왼쪽으로 스와이프
        this.handleLeftSwipe();
      } else {
        // 오른쪽으로 스와이프
        this.handleRightSwipe();
      }
    } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > minSwipeDistance) {
      // 상하 스와이프
      if (diffY > 0) {
        // 위로 스와이프
        this.handleUpSwipe();
      } else {
        // 아래로 스와이프
        this.handleDownSwipe();
      }
    }
  }

  // 왼쪽 스와이프 처리
  handleLeftSwipe() {
    // 모달 닫기 또는 뒤로 가기
    const modal = document.querySelector('.modal.active, .popup.active');
    if (modal) {
      this.closeModal(modal);
    }
  }

  // 오른쪽 스와이프 처리
  handleRightSwipe() {
    // 사이드 메뉴 열기
    const sideMenu = document.querySelector('.side-menu');
    if (sideMenu) {
      this.openSideMenu(sideMenu);
    }
  }

  // 위로 스와이프 처리
  handleUpSwipe() {
    // 새로고침 또는 위로 스크롤
    if (window.scrollY === 0) {
      this.refreshPage();
    }
  }

  // 아래로 스와이프 처리
  handleDownSwipe() {
    // 모바일 네비게이션 토글
    this.toggleMobileNavigation();
  }

  // 모바일 네비게이션 설정
  setupMobileNavigation() {
    // 모바일 네비게이션 생성
    const mobileNav = document.createElement('nav');
    mobileNav.className = 'mobile-nav';
    mobileNav.innerHTML = `
      <a href="/" class="nav-item ${window.location.pathname === '/' ? 'active' : ''}">
        <img src="/image/gnb_home.png" alt="홈">
        <span>홈</span>
      </a>
      <a href="/contact_us.html" class="nav-item ${window.location.pathname.includes('contact_us') ? 'active' : ''}">
        <img src="/image/knowledge.png" alt="공지사항">
        <span>공지사항</span>
      </a>
      <a href="#" class="nav-item" onclick="goToReservation()">
        <img src="/image/reserve.png" alt="예약">
        <span>예약</span>
      </a>
      <a href="/mypage.html" class="nav-item ${window.location.pathname.includes('mypage') ? 'active' : ''}">
        <img src="/image/mypage.png" alt="마이페이지">
        <span>마이</span>
      </a>
    `;

    // 모바일에서만 네비게이션 표시
    if (window.innerWidth <= 768) {
      document.body.appendChild(mobileNav);
      document.body.classList.add('mobile-layout');
    }

    // 화면 크기 변경 시 네비게이션 토글
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 768 && !document.querySelector('.mobile-nav')) {
        document.body.appendChild(mobileNav);
        document.body.classList.add('mobile-layout');
      } else if (window.innerWidth > 768 && document.querySelector('.mobile-nav')) {
        document.querySelector('.mobile-nav').remove();
        document.body.classList.remove('mobile-layout');
      }
    });
  }

  // 모바일 네비게이션 토글
  toggleMobileNavigation() {
    const mobileNav = document.querySelector('.mobile-nav');
    if (mobileNav) {
      mobileNav.classList.toggle('hidden');
    }
  }

  // 모바일 최적화 설정
  setupMobileOptimizations() {
    // 뷰포트 설정
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }

    // 터치 액션 설정
    document.body.style.touchAction = 'manipulation';

    // 스크롤 성능 최적화
    document.body.style.webkitOverflowScrolling = 'touch';

    // 폼 요소 최적화
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        if (window.innerWidth <= 768) {
          input.style.fontSize = '16px';
        }
      });

      input.addEventListener('blur', () => {
        if (window.innerWidth <= 768) {
          input.style.fontSize = '';
        }
      });
    });

    // 이미지 지연 로딩
    this.setupLazyLoading();
  }

  // 이미지 지연 로딩 설정
  setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => {
      imageObserver.observe(img);
    });
  }

  // 성능 최적화 설정
  setupPerformanceOptimizations() {
    // GPU 가속 활성화
    const elements = document.querySelectorAll('.card, .reservation-card, .modal');
    elements.forEach(el => {
      el.classList.add('gpu-accelerated');
    });

    // 스크롤 성능 향상
    const scrollContainers = document.querySelectorAll('.scroll-container, .reservations-list');
    scrollContainers.forEach(container => {
      container.classList.add('smooth-scroll');
    });

    // 애니메이션 최적화
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.body.classList.add('mobile-reduce-motion');
    }
  }

  // 모달 닫기
  closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // 사이드 메뉴 열기
  openSideMenu(sideMenu) {
    sideMenu.classList.add('active');
  }

  // 페이지 새로고침
  refreshPage() {
    window.location.reload();
  }

  // 모바일 상태 확인
  isMobileDevice() {
    return this.isMobile;
  }

  // 터치 이벤트 정보 가져오기
  getTouchInfo() {
    return {
      isMobile: this.isMobile,
      touchStartX: this.touchStartX,
      touchStartY: this.touchStartY,
      touchEndX: this.touchEndX,
      touchEndY: this.touchEndY
    };
  }
}

// 모바일 최적화 인스턴스 생성
let mobileOptimization;

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', () => {
  mobileOptimization = new MobileOptimization();
});

// 전역 함수로 노출
window.MobileOptimization = MobileOptimization;
window.mobileOptimization = mobileOptimization; 
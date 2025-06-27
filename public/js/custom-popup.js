// 커스텀 팝업 시스템
class CustomPopup {
    constructor() {
        this.overlay = null;
        this.popup = null;
        this.resolve = null;
        this.reject = null;
    }

    // 팝업 생성
    createPopup(options = {}) {
        const {
            type = 'info',
            title = '',
            message = '',
            subtitle = '',
            icon = '',
            buttons = [],
            showClose = true,
            autoClose = false,
            autoCloseTime = 3000
        } = options;

        // 아이콘 설정
        const iconMap = {
            success: 'fas fa-check',
            error: 'fas fa-times',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle',
            question: 'fas fa-question-circle'
        };

        const iconClass = icon || iconMap[type] || iconMap.info;

        // 버튼 HTML 생성
        const buttonsHtml = buttons.length > 0 ? `
            <div class="custom-popup-buttons">
                ${buttons.map(btn => `
                    <button class="custom-popup-btn ${btn.class || 'custom-popup-btn-primary'}" 
                            data-action="${btn.action || 'close'}">
                        ${btn.text}
                    </button>
                `).join('')}
            </div>
        ` : '';

        // 팝업 HTML 생성
        const popupHtml = `
            <div class="custom-popup-overlay" id="custom-popup-overlay">
                <div class="custom-popup ${type}">
                    ${showClose ? '<button class="custom-popup-close" onclick="customPopup.close()">&times;</button>' : ''}
                    <div class="custom-popup-header">
                        <div class="custom-popup-icon">
                            <i class="${iconClass}"></i>
                        </div>
                        <h3 class="custom-popup-title">${title}</h3>
                        ${subtitle ? `<p class="custom-popup-subtitle">${subtitle}</p>` : ''}
                    </div>
                    <div class="custom-popup-content">
                        <p class="custom-popup-message">${message}</p>
                    </div>
                    ${buttonsHtml}
                </div>
            </div>
        `;

        // 기존 팝업 제거
        this.removePopup();

        // 새 팝업 추가
        document.body.insertAdjacentHTML('beforeend', popupHtml);
        
        this.overlay = document.getElementById('custom-popup-overlay');
        this.popup = this.overlay.querySelector('.custom-popup');

        // 버튼 이벤트 설정
        this.setupButtonEvents();

        // 자동 닫기 설정
        if (autoClose) {
            setTimeout(() => {
                this.close();
            }, autoCloseTime);
        }

        // 애니메이션 시작
        setTimeout(() => {
            this.overlay.classList.add('show');
        }, 10);

        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    // 버튼 이벤트 설정
    setupButtonEvents() {
        const buttons = this.popup.querySelectorAll('.custom-popup-btn');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = button.getAttribute('data-action');
                this.handleButtonAction(action);
            });
        });
    }

    // 버튼 액션 처리
    handleButtonAction(action) {
        switch (action) {
            case 'confirm':
                this.resolve(true);
                break;
            case 'cancel':
                this.resolve(false);
                break;
            case 'close':
            default:
                this.resolve(null);
                break;
        }
        this.close();
    }

    // 팝업 닫기
    close() {
        if (this.overlay) {
            this.overlay.classList.remove('show');
            setTimeout(() => {
                this.removePopup();
            }, 300);
        }
    }

    // 팝업 제거
    removePopup() {
        const existingOverlay = document.getElementById('custom-popup-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        this.overlay = null;
        this.popup = null;
    }

    // 성공 팝업
    success(title, message, options = {}) {
        return this.createPopup({
            type: 'success',
            title,
            message,
            ...options
        });
    }

    // 에러 팝업
    error(title, message, options = {}) {
        return this.createPopup({
            type: 'error',
            title,
            message,
            ...options
        });
    }

    // 경고 팝업
    warning(title, message, options = {}) {
        return this.createPopup({
            type: 'warning',
            title,
            message,
            ...options
        });
    }

    // 정보 팝업
    info(title, message, options = {}) {
        return this.createPopup({
            type: 'info',
            title,
            message,
            ...options
        });
    }

    // 질문 팝업
    question(title, message, options = {}) {
        return this.createPopup({
            type: 'question',
            title,
            message,
            buttons: [
                {
                    text: '확인',
                    action: 'confirm',
                    class: 'custom-popup-btn-success'
                },
                {
                    text: '취소',
                    action: 'cancel',
                    class: 'custom-popup-btn-secondary'
                }
            ],
            ...options
        });
    }

    // 확인 팝업
    confirm(title, message, options = {}) {
        return this.createPopup({
            type: 'question',
            title,
            message,
            buttons: [
                {
                    text: '확인',
                    action: 'confirm',
                    class: 'custom-popup-btn-danger'
                },
                {
                    text: '취소',
                    action: 'cancel',
                    class: 'custom-popup-btn-secondary'
                }
            ],
            ...options
        });
    }

    // 알림 팝업 (자동 닫기)
    alert(title, message, options = {}) {
        return this.createPopup({
            type: 'info',
            title,
            message,
            autoClose: true,
            autoCloseTime: 3000,
            ...options
        });
    }
}

// 토스트 알림 시스템
class CustomToast {
    constructor() {
        this.toasts = [];
    }

    // 토스트 생성
    createToast(type, title, message, duration = 4000) {
        const iconMap = {
            success: 'fas fa-check',
            error: 'fas fa-times',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        const toastHtml = `
            <div class="custom-toast ${type}" id="toast-${Date.now()}">
                <div class="custom-toast-icon">
                    <i class="${iconMap[type] || iconMap.info}"></i>
                </div>
                <div class="custom-toast-content">
                    <div class="custom-toast-title">${title}</div>
                    <div class="custom-toast-message">${message}</div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', toastHtml);
        
        const toast = document.querySelector(`#toast-${Date.now()}`);
        this.toasts.push(toast);

        // 애니메이션 시작
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // 자동 제거
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);

        return toast;
    }

    // 토스트 제거
    removeToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            const index = this.toasts.indexOf(toast);
            if (index > -1) {
                this.toasts.splice(index, 1);
            }
        }, 300);
    }

    // 성공 토스트
    success(title, message, duration) {
        return this.createToast('success', title, message, duration);
    }

    // 에러 토스트
    error(title, message, duration) {
        return this.createToast('error', title, message, duration);
    }

    // 경고 토스트
    warning(title, message, duration) {
        return this.createToast('warning', title, message, duration);
    }

    // 정보 토스트
    info(title, message, duration) {
        return this.createToast('info', title, message, duration);
    }
}

// 전역 인스턴스 생성
const customPopup = new CustomPopup();
const customToast = new CustomToast();

// 기존 alert 함수 오버라이드 (선택적)
function overrideAlert() {
    const originalAlert = window.alert;
    window.alert = function(message) {
        return customPopup.alert('알림', message);
    };
}

// 기존 confirm 함수 오버라이드 (선택적)
function overrideConfirm() {
    const originalConfirm = window.confirm;
    window.confirm = function(message) {
        return customPopup.confirm('확인', message);
    };
}

// 팝업 스타일 로드 확인
function ensurePopupStyles() {
    if (!document.querySelector('link[href*="custom-popup.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = './css/custom-popup.css';
        document.head.appendChild(link);
    }
}

// 페이지 로드 시 스타일 확인
document.addEventListener('DOMContentLoaded', function() {
    ensurePopupStyles();
});

// 전역 함수로 노출
window.customPopup = customPopup;
window.customToast = customToast;
window.overrideAlert = overrideAlert;
window.overrideConfirm = overrideConfirm; 
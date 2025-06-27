// 커스텀 팝업 시스템
class CustomPopup {
    constructor() {
        this.createPopupContainer();
        this.createToastContainer();
    }

    // 팝업 컨테이너 생성
    createPopupContainer() {
        const overlay = document.createElement('div');
        overlay.className = 'custom-popup-overlay';
        overlay.id = 'custom-popup-overlay';
        
        const popup = document.createElement('div');
        popup.className = 'custom-popup';
        popup.id = 'custom-popup';
        
        overlay.appendChild(popup);
        document.body.appendChild(overlay);
        
        // 오버레이 클릭 시 팝업 닫기
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
            }
        });
    }

    // 토스트 컨테이너 생성
    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'custom-toast-container';
        container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000;';
        document.body.appendChild(container);
    }

    // 팝업 표시
    show(options = {}) {
        const {
            title = '',
            message = '',
            icon = '',
            type = 'info',
            showCancelButton = false,
            confirmButtonText = '확인',
            cancelButtonText = '취소',
            confirmButtonColor = 'primary',
            onConfirm = null,
            onCancel = null,
            html = null
        } = options;

        const overlay = document.getElementById('custom-popup-overlay');
        const popup = document.getElementById('custom-popup');

        // 아이콘 HTML
        let iconHtml = '';
        if (icon) {
            iconHtml = `<div class="custom-popup-icon ${type}">${icon}</div>`;
        }

        // 버튼 HTML
        let buttonsHtml = '';
        if (showCancelButton) {
            buttonsHtml = `
                <button class="custom-popup-btn custom-popup-btn-secondary" id="custom-popup-cancel">${cancelButtonText}</button>
                <button class="custom-popup-btn custom-popup-btn-${confirmButtonColor}" id="custom-popup-confirm">${confirmButtonText}</button>
            `;
        } else {
            buttonsHtml = `<button class="custom-popup-btn custom-popup-btn-${confirmButtonColor}" id="custom-popup-confirm">${confirmButtonText}</button>`;
        }

        // 팝업 내용 설정
        popup.innerHTML = `
            <div class="custom-popup-header">
                <h3 class="custom-popup-title">${title}</h3>
                <button class="custom-popup-close" id="custom-popup-close">&times;</button>
            </div>
            <div class="custom-popup-content">
                ${iconHtml}
                ${html || `<p class="custom-popup-message">${message}</p>`}
            </div>
            <div class="custom-popup-buttons">
                ${buttonsHtml}
            </div>
        `;

        // 이벤트 리스너 추가
        const closeBtn = document.getElementById('custom-popup-close');
        const confirmBtn = document.getElementById('custom-popup-confirm');
        const cancelBtn = document.getElementById('custom-popup-cancel');

        closeBtn.addEventListener('click', () => this.close());
        confirmBtn.addEventListener('click', () => {
            if (onConfirm) onConfirm();
            this.close();
        });

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (onCancel) onCancel();
                this.close();
            });
        }

        // 팝업 표시
        overlay.classList.add('show');

        // Promise 반환
        return new Promise((resolve) => {
            this.resolvePromise = resolve;
            
            // 확인 버튼 클릭 시
            confirmBtn.addEventListener('click', () => {
                resolve({ isConfirmed: true, isDismissed: false });
            }, { once: true });

            // 취소 버튼 클릭 시
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    resolve({ isConfirmed: false, isDismissed: true });
                }, { once: true });
            }

            // 닫기 버튼 클릭 시
            closeBtn.addEventListener('click', () => {
                resolve({ isConfirmed: false, isDismissed: true });
            }, { once: true });

            // 오버레이 클릭 시
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    resolve({ isConfirmed: false, isDismissed: true });
                }
            }, { once: true });
        });
    }

    // 팝업 닫기
    close() {
        const overlay = document.getElementById('custom-popup-overlay');
        overlay.classList.remove('show');
        
        if (this.resolvePromise) {
            this.resolvePromise({ isConfirmed: false, isDismissed: true });
        }
    }

    // 토스트 메시지 표시
    showToast(options = {}) {
        const {
            title = '',
            message = '',
            type = 'info',
            timer = 3000,
            position = 'top-end'
        } = options;

        const container = document.getElementById('custom-toast-container');
        const toast = document.createElement('div');
        toast.className = `custom-toast ${type}`;
        
        toast.innerHTML = `
            <div class="custom-toast-title">${title}</div>
            <div class="custom-toast-message">${message}</div>
        `;

        container.appendChild(toast);

        // 애니메이션을 위한 지연
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // 자동 제거
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, timer);

        return toast;
    }

    // 미리 정의된 팝업 메서드들
    fire(options) {
        return this.show(options);
    }

    // 성공 팝업
    success(title, message) {
        return this.show({
            title,
            message,
            icon: '✓',
            type: 'success',
            confirmButtonColor: 'success'
        });
    }

    // 오류 팝업
    error(title, message) {
        return this.show({
            title,
            message,
            icon: '✕',
            type: 'error',
            confirmButtonColor: 'danger'
        });
    }

    // 경고 팝업
    warning(title, message) {
        return this.show({
            title,
            message,
            icon: '⚠',
            type: 'warning',
            confirmButtonColor: 'danger'
        });
    }

    // 정보 팝업
    info(title, message) {
        return this.show({
            title,
            message,
            icon: 'ℹ',
            type: 'info',
            confirmButtonColor: 'primary'
        });
    }

    // 질문 팝업
    question(title, message) {
        return this.show({
            title,
            message,
            icon: '?',
            type: 'question',
            showCancelButton: true,
            confirmButtonColor: 'danger'
        });
    }
}

// 전역 팝업 인스턴스 생성
window.CustomPopup = new CustomPopup();

// SweetAlert 호환성을 위한 래퍼
window.Swal = {
    fire: (options) => {
        if (typeof options === 'string') {
            return window.CustomPopup.fire({ message: options });
        }
        return window.CustomPopup.fire(options);
    },
    
    success: (title, message) => window.CustomPopup.success(title, message),
    error: (title, message) => window.CustomPopup.error(title, message),
    warning: (title, message) => window.CustomPopup.warning(title, message),
    info: (title, message) => window.CustomPopup.info(title, message),
    question: (title, message) => window.CustomPopup.question(title, message),
    
    showValidationMessage: (message) => {
        console.warn('showValidationMessage is not implemented in custom popup');
    }
}; 
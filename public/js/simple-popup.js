// 간단한 팝업 시스템
class SimplePopup {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        // DOM이 준비되지 않은 경우 대기
        if (!document.body) {
            setTimeout(() => this.init(), 100);
            return;
        }

        // 스타일 추가
        this.addStyles();
        this.isInitialized = true;
    }

    addStyles() {
        if (document.getElementById('simple-popup-styles')) return;

        const style = document.createElement('style');
        style.id = 'simple-popup-styles';
        style.textContent = `
            .simple-popup-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .simple-popup-overlay.show {
                opacity: 1;
                visibility: visible;
            }
            
            .simple-popup {
                background: white;
                border-radius: 12px;
                padding: 30px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                transform: scale(0.7);
                transition: transform 0.3s ease;
                position: relative;
            }
            
            .simple-popup-overlay.show .simple-popup {
                transform: scale(1);
            }
            
            .simple-popup-close {
                position: absolute;
                top: 15px;
                right: 20px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .simple-popup-close:hover {
                color: #333;
            }
            
            .simple-popup-header {
                text-align: center;
                margin-bottom: 20px;
            }
            
            .simple-popup-icon {
                font-size: 48px;
                margin-bottom: 15px;
            }
            
            .simple-popup-title {
                font-size: 20px;
                font-weight: bold;
                margin: 0 0 10px 0;
                color: #333;
            }
            
            .simple-popup-message {
                font-size: 16px;
                line-height: 1.5;
                color: #666;
                margin: 0;
                text-align: center;
            }
            
            .simple-popup-buttons {
                display: flex;
                gap: 10px;
                justify-content: center;
                margin-top: 25px;
            }
            
            .simple-popup-btn {
                padding: 12px 24px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                min-width: 80px;
            }
            
            .simple-popup-btn-primary {
                background: #0066CC;
                color: white;
            }
            
            .simple-popup-btn-primary:hover {
                background: #0052a3;
            }
            
            .simple-popup-btn-secondary {
                background: #f0f0f0;
                color: #333;
            }
            
            .simple-popup-btn-secondary:hover {
                background: #e0e0e0;
            }
            
            .simple-popup-btn-danger {
                background: #dc3545;
                color: white;
            }
            
            .simple-popup-btn-danger:hover {
                background: #c82333;
            }
            
            .simple-popup.success .simple-popup-icon {
                color: #28a745;
            }
            
            .simple-popup.error .simple-popup-icon {
                color: #dc3545;
            }
            
            .simple-popup.warning .simple-popup-icon {
                color: #ffc107;
            }
            
            .simple-popup.info .simple-popup-icon {
                color: #17a2b8;
            }
            
            .simple-popup.question .simple-popup-icon {
                color: #6c757d;
            }
        `;
        document.head.appendChild(style);
    }

    show(options = {}) {
        return new Promise((resolve) => {
            if (!this.isInitialized) {
                setTimeout(() => this.show(options).then(resolve), 100);
                return;
            }

            const {
                type = 'info',
                title = '',
                message = '',
                buttons = [],
                autoClose = false,
                autoCloseTime = 3000
            } = options;

            // 아이콘 설정
            const iconMap = {
                success: '✓',
                error: '✕',
                warning: '⚠',
                info: 'ℹ',
                question: '?'
            };

            const icon = iconMap[type] || iconMap.info;

            // 버튼 HTML 생성
            const buttonsHtml = buttons.length > 0 ? `
                <div class="simple-popup-buttons">
                    ${buttons.map(btn => `
                        <button class="simple-popup-btn ${btn.class || 'simple-popup-btn-primary'}" 
                                data-action="${btn.action || 'close'}">
                            ${btn.text}
                        </button>
                    `).join('')}
                </div>
            ` : '';

            // 팝업 HTML 생성
            const popupHtml = `
                <div class="simple-popup-overlay" id="simple-popup-overlay">
                    <div class="simple-popup ${type}">
                        <button class="simple-popup-close" onclick="window.simplePopup.close()">&times;</button>
                        <div class="simple-popup-header">
                            <div class="simple-popup-icon">${icon}</div>
                            <h3 class="simple-popup-title">${title}</h3>
                        </div>
                        <div class="simple-popup-message">${message}</div>
                        ${buttonsHtml}
                    </div>
                </div>
            `;

            // 기존 팝업 제거
            this.remove();

            // 새 팝업 추가
            document.body.insertAdjacentHTML('beforeend', popupHtml);
            
            const overlay = document.getElementById('simple-popup-overlay');
            const popup = overlay.querySelector('.simple-popup');

            // 버튼 이벤트 설정
            const popupButtons = popup.querySelectorAll('.simple-popup-btn');
            popupButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const action = button.getAttribute('data-action');
                    this.handleButtonAction(action, resolve);
                });
            });

            // 자동 닫기 설정
            if (autoClose) {
                setTimeout(() => {
                    this.close();
                    resolve(null);
                }, autoCloseTime);
            }

            // 애니메이션 시작
            setTimeout(() => {
                overlay.classList.add('show');
            }, 10);

            this.currentResolve = resolve;
        });
    }

    handleButtonAction(action, resolve) {
        switch (action) {
            case 'confirm':
                resolve(true);
                break;
            case 'cancel':
                resolve(false);
                break;
            case 'close':
            default:
                resolve(null);
                break;
        }
        this.close();
    }

    close() {
        const overlay = document.getElementById('simple-popup-overlay');
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => {
                this.remove();
            }, 300);
        }
    }

    remove() {
        const existingOverlay = document.getElementById('simple-popup-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
    }

    // 편의 메서드들
    success(title, message, options = {}) {
        return this.show({
            type: 'success',
            title,
            message,
            ...options
        });
    }

    error(title, message, options = {}) {
        return this.show({
            type: 'error',
            title,
            message,
            ...options
        });
    }

    warning(title, message, options = {}) {
        return this.show({
            type: 'warning',
            title,
            message,
            ...options
        });
    }

    info(title, message, options = {}) {
        return this.show({
            type: 'info',
            title,
            message,
            ...options
        });
    }

    confirm(title, message, options = {}) {
        return this.show({
            type: 'question',
            title,
            message,
            buttons: [
                {
                    text: '확인',
                    action: 'confirm',
                    class: 'simple-popup-btn-danger'
                },
                {
                    text: '취소',
                    action: 'cancel',
                    class: 'simple-popup-btn-secondary'
                }
            ],
            ...options
        });
    }

    alert(title, message, options = {}) {
        return this.show({
            type: 'info',
            title,
            message,
            autoClose: true,
            autoCloseTime: 3000,
            ...options
        });
    }
}

// 전역 인스턴스 생성
let simplePopup = null;

// DOM 로딩 후 초기화
document.addEventListener('DOMContentLoaded', function() {
    simplePopup = new SimplePopup();
    window.simplePopup = simplePopup;
});

// 전역 함수로 노출 (DOM 로딩 전에도 사용 가능하도록)
window.simplePopup = window.simplePopup || {
    show: () => Promise.resolve(null),
    success: () => Promise.resolve(null),
    error: () => Promise.resolve(null),
    warning: () => Promise.resolve(null),
    info: () => Promise.resolve(null),
    confirm: () => Promise.resolve(null),
    alert: () => Promise.resolve(null),
    close: () => {}
}; 
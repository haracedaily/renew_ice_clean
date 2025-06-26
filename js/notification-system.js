// 알림 시스템 (중복 선언 방지)
if (typeof window.NotificationSystem === 'undefined') {
    window.NotificationSystem = class NotificationSystem {
        constructor() {
            this.container = null;
            this.notifications = [];
            this.subscription = null; // 실시간 구독 참조 저장
            this.isMonitoring = false; // 모니터링 상태 추적
            this.init();
        }

        init() {
            // 알림 컨테이너 생성
            this.createContainer();
            
            // 예약 페이지가 아닌 경우에만 실시간 모니터링 시작
            if (!window.location.pathname.includes('reservation.html')) {
                this.startReservationMonitoring();
            }
        }

        createContainer() {
            this.container = document.createElement('div');
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        }

        // 알림 표시
        show(title, message, type = 'info', duration = 5000) {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            
            const icon = this.getIconForType(type);
            
            // success 타입일 때 아이콘 색상을 HTML에 직접 포함
            const iconStyle = type === 'success' ? 'style="color:#0066cc"' : '';
            
            notification.innerHTML = `
                <div class="notification-header">
                    <h4 class="notification-title">
                        <i class="fas ${icon} notification-icon" ${iconStyle}></i>
                        ${title}
                    </h4>
                    <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <p class="notification-message">${message}</p>
            `;

            if (type === 'success') {
                notification.style.background = '#e6f0fa';
                notification.style.color = '#0066cc';
            }

            this.container.appendChild(notification);

            // 애니메이션 효과
            setTimeout(() => {
                notification.classList.add('show');
            }, 100);

            // 자동 제거
            if (duration > 0) {
                setTimeout(() => {
                    this.hide(notification);
                }, duration);
            }

            return notification;
        }

        // 알림 숨기기
        hide(notification) {
            notification.classList.add('hide');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }

        // 타입별 아이콘 반환
        getIconForType(type) {
            const icons = {
                success: 'fa-check-circle',
                warning: 'fa-exclamation-triangle',
                info: 'fa-info-circle',
                error: 'fa-times-circle'
            };
            return icons[type] || icons.info;
        }

        // 예약 상태별 알림 메시지
        getReservationNotification(state, reservationData = {}) {
            const notifications = {
                1: {
                    title: '신규예약 완료',
                    message: '신규예약이 완료되었습니다.',
                    type: 'success'
                },
                2: {
                    title: '결제대기',
                    message: '결제를 완료해주세요.',
                    type: 'warning'
                },
                3: {
                    title: '결제완료',
                    message: '결제가 완료되었습니다. 곧 기사님이 배정될 예정입니다.',
                    type: 'info'
                },
                4: {
                    title: '기사배정',
                    message: '담당 기사님이 배정되었습니다.',
                    type: 'info'
                },
                5: {
                    title: '청소완료',
                    message: '청소가 완료되었습니다. 아이스케어를 이용해주셔서 감사합니다.',
                    type: 'success'
                },
                6: {
                    title: '예약취소',
                    message: '예약취소가 완료되었습니다.',
                    type: 'info'
                }
            };

            return notifications[state] || {
                title: '예약 상태 변경',
                message: '예약 상태가 변경되었습니다.',
                type: 'info'
            };
        }

        // 예약 상태 변경 감지 및 알림
        async startReservationMonitoring() {
            if (!window.currentUser || !window.currentUser.email) {
                return;
            }

            // 이미 모니터링 중이면 중복 실행 방지
            if (this.isMonitoring) {
                console.log('이미 예약 모니터링이 실행 중입니다.');
                return;
            }

            this.isMonitoring = true;
            console.log('예약 모니터링 시작');

            // 기존 구독이 있다면 해제
            if (this.subscription) {
                this.subscription.unsubscribe();
            }

            // 실시간 구독 설정
            this.subscription = supabase
                .channel('reservation_changes')
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'reservation',
                    filter: `user_email=eq.${window.currentUser.email}`
                }, (payload) => {
                    this.handleReservationChange(payload);
                })
                .subscribe();

            // 주기적 상태 확인 (백업)
            setInterval(() => {
                this.checkReservationStatus();
            }, 30000); // 30초마다 확인
        }

        // 예약 상태 변경 처리
        handleReservationChange(payload) {
            const reservation = payload.new;
            const oldState = payload.old?.state;
            const newState = reservation.state;

            // 상태가 실제로 변경된 경우에만 알림
            if (oldState !== newState) {
                const notification = this.getReservationNotification(newState, reservation);
                this.show(notification.title, notification.message, notification.type);
            }
        }

        // 예약 상태 주기적 확인
        async checkReservationStatus() {
            if (!window.currentUser || !window.currentUser.email) {
                return;
            }

            try {
                const { data: reservations, error } = await supabase
                    .from('reservation')
                    .select('res_no, state, updated_at')
                    .eq('user_email', window.currentUser.email)
                    .order('updated_at', { ascending: false })
                    .limit(5);

                if (error) {
                    console.error('예약 상태 확인 오류:', error);
                    return;
                }

                // 최근 업데이트된 예약 확인
                reservations.forEach(reservation => {
                    const lastCheck = localStorage.getItem(`reservation_${reservation.res_no}_last_state`);
                    if (lastCheck !== reservation.state.toString()) {
                        // 상태가 변경된 경우 알림
                        const notification = this.getReservationNotification(reservation.state, reservation);
                        this.show(notification.title, notification.message, notification.type);
                        
                        // 마지막 상태 저장
                        localStorage.setItem(`reservation_${reservation.res_no}_last_state`, reservation.state.toString());
                    }
                });

            } catch (error) {
                console.error('예약 상태 확인 중 오류:', error);
            }
        }

        // 수동 알림 표시 (다른 페이지에서 사용)
        static showNotification(title, message, type = 'info', duration = 5000) {
            if (!window.notificationSystem) {
                window.notificationSystem = new NotificationSystem();
            }
            return window.notificationSystem.show(title, message, type, duration);
        }
    }
}

// 페이지 로드 시 알림 시스템 초기화
document.addEventListener('DOMContentLoaded', function() {
    window.notificationSystem = new NotificationSystem();
});

// 전역 함수로 노출
window.showNotification = NotificationSystem.showNotification; 
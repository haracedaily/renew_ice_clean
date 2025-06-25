console.log('예약 JavaScript 파일 로드됨');

// 전역 변수로 폼 제출 상태 관리
let isSubmitting = false;
let lastInsertTime = 0; // 마지막 삽입 시간 추적
let formSubmissionCount = 0; // 폼 제출 횟수 추적
let eventListenerAttached = false; // 이벤트 리스너 중복 바인딩 방지
let insertCount = 0; // 삽입 실행 횟수 추적

// Supabase 클라이언트 생성 (중복 선언 방지)
if (typeof window.SUPABASE_URL === 'undefined') {
    window.SUPABASE_URL = 'https://wqetnltlnsvjidubewia.supabase.co';
    window.SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxZXRubHRsbnN2amlkdWJld2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NzI5NDksImV4cCI6MjA1ODM0ODk0OX0.-Jw0jqyq93rA7t194Kq4_umPoTci8Eqx9j-oCwoZc6k';
}

// Supabase 클라이언트가 없거나 제대로 초기화되지 않은 경우에만 생성
if (!window.supabase || typeof window.supabase.from !== 'function') {
    if (typeof supabase !== 'undefined') {
        window.supabase = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
        console.log('Supabase 클라이언트 재초기화됨');
    } else {
        console.error('Supabase 라이브러리가 로드되지 않았습니다.');
    }
}

// 예약자 자동입력 (로그인정보 있을때)
function autofillReservationUser() {
    const user = localStorage.getItem('mypageUser');
    if (!user) {
        console.log('로그인 정보가 없습니다.');
        return;
    }
    
    try {
        const userInfo = JSON.parse(user);
        console.log('사용자 정보:', userInfo);
        
        // 이름 필드 자동 입력
        const nameField = document.getElementById('name');
        if (nameField && userInfo.name) {
            nameField.value = userInfo.name;
            nameField.readOnly = true; // 읽기 전용으로 설정
            nameField.style.backgroundColor = '#f8f9fa';
            console.log('이름 자동 입력:', userInfo.name);
        }
        
        // 전화번호 필드 자동 입력
        const phoneField = document.getElementById('phone');
        if (phoneField && userInfo.phone) {
            phoneField.value = userInfo.phone;
            phoneField.readOnly = true; // 읽기 전용으로 설정
            phoneField.style.backgroundColor = '#f8f9fa';
            console.log('전화번호 자동 입력:', userInfo.phone);
        }
        
        // 이메일 필드 자동 입력
        const emailField = document.getElementById('email');
        if (emailField && userInfo.email) {
            emailField.value = userInfo.email;
            emailField.readOnly = true; // 읽기 전용으로 설정
            emailField.style.backgroundColor = '#f8f9fa';
            console.log('이메일 자동 입력:', userInfo.email);
        }
        
        // 로그인 정보 표시
        showLoginInfo();
        
    } catch (e) {
        console.error('사용자 정보 파싱 오류:', e);
    }
}

// 로그인 정보 표시
function showLoginInfo() {
    const user = localStorage.getItem('mypageUser');
    if (!user) return;
    
    try {
        const userInfo = JSON.parse(user);
        
        // 기존 login-info 요소가 있다면 제거
        const existingLoginInfo = document.querySelector('.login-info');
        if (existingLoginInfo) {
            existingLoginInfo.remove();
        }
        
        const loginInfoDiv = document.createElement('div');
        loginInfoDiv.className = 'login-info';
        loginInfoDiv.innerHTML = `
            <div class="login-info-content">
                <i class="fas fa-user-check"></i>
                <span>로그인된 사용자: ${userInfo.name || userInfo.email}</span>
            </div>
        `;
        
        // 폼 상단에 로그인 정보 표시
        const form = document.getElementById('reservation-form');
        if (form) {
            form.insertBefore(loginInfoDiv, form.firstChild);
        }
    } catch (e) {
        console.error('로그인 정보 표시 오류:', e);
    }
}

// 전화번호 포맷팅
function formatPhone(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 3 && value.length <= 7) {
        value = `${value.slice(0, 3)}-${value.slice(3)}`;
    } else if (value.length > 7) {
        value = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
    }
    input.value = value;
}

// 개인정보 상세보기 토글
function setupPrivacyDetail() {
    const privacyBtn = document.querySelector('.privacy-detail-btn');
    const privacyDetails = document.getElementById('privacy-details');
    
    if (privacyBtn && privacyDetails) {
        privacyBtn.addEventListener('click', () => {
            const isVisible = privacyDetails.style.display === 'block';
            privacyDetails.style.display = isVisible ? 'none' : 'block';
        });
    }
}

// 폼 제출 처리
function setupFormSubmission() {
    const form = document.getElementById('reservation-form');
    
    if (form && !eventListenerAttached) {
        console.log('폼 제출 이벤트 리스너 설정 시작...');
        
        // 이벤트 리스너 중복 바인딩 방지
        eventListenerAttached = true;
        
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // 고유 제출 ID 생성
            const submissionId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            formSubmissionCount++;
            
            console.log(`=== 예약 제출 시작 (ID: ${submissionId}, 횟수: ${formSubmissionCount}) ===`);
            console.log('스택 트레이스:', new Error().stack);
            
            // 전역 중복 제출 방지
            if (isSubmitting) {
                console.log(`[${submissionId}] 이미 제출 중입니다. 중복 제출 방지됨.`);
                return;
            }
            
            // 중복 제출 방지
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn && submitBtn.disabled) {
                console.log(`[${submissionId}] 제출 버튼이 이미 비활성화되어 있습니다.`);
                return;
            }
            
            // 전역 상태 설정
            isSubmitting = true;
            
            // 제출 버튼 완전 비활성화
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = '예약 중...';
                submitBtn.style.opacity = '0.5';
                submitBtn.style.cursor = 'not-allowed';
                submitBtn.style.pointerEvents = 'none';
                submitBtn.style.backgroundColor = '#ccc';
                submitBtn.style.color = '#666';
            }
            
            // 폼 전체 비활성화
            const formInputs = form.querySelectorAll('input, textarea, select, button');
            formInputs.forEach(input => {
                if (input !== submitBtn) {
                    input.disabled = true;
                    input.style.opacity = '0.5';
                    input.style.cursor = 'not-allowed';
                }
            });
            
            console.log(`[${submissionId}] 폼 제출 시작 - 완전 비활성화됨`);
            
            // 데이터 수집
            const formData = {
                name: document.getElementById('name').value || '',
                phone: document.getElementById('phone').value || '',
                email: document.getElementById('email').value || '',
                date: document.getElementById('reservation-date').value || '',
                time: document.querySelector('input[name="reservation-time"]:checked')?.value || '',
                postcode: document.getElementById('postcode').value || '',
                address: document.getElementById('address').value || '',
                detailAddress: document.getElementById('detailAddress').value || '',
                modelname: document.getElementById('modelname').value || '',
                specialRequest: document.getElementById('specialRequest').value || ''
            };
            
            console.log(`[${submissionId}] 수집된 데이터:`, formData);
            
            // Supabase에 저장
            try {
                // 데이터 유효성 검사
                if (!formData.date || !formData.time || !formData.email) {
                    console.log(`[${submissionId}] 유효성 검사 실패`);
                    Swal.fire({
                        icon: 'error',
                        title: '입력 오류',
                        text: '날짜, 시간, 이메일은 필수 입력 항목입니다.',
                    });
                    return;
                }

                const reservationData = {
                    date: formData.date,
                    time: formData.time,
                    addr: `${formData.postcode} ${formData.address} ${formData.detailAddress}`.trim(),
                    model: formData.modelname,
                    remark: formData.specialRequest,
                    agree: 1,
                    user_email: formData.email, // email 대신 user_email 사용
                    state: 1, // 신규예약(1)
                    price: 0 // 서비스금액 0으로 저장
                };
                
                console.log(`[${submissionId}] Supabase 저장 데이터:`, reservationData);
                console.log(`[${submissionId}] Supabase 클라이언트:`, window.supabase);
                
                // 마지막 삽입 시간 확인 (추가 보호)
                const currentTime = new Date().getTime();
                if (currentTime - lastInsertTime < 10000) {
                    console.warn(`[${submissionId}] 10초 이내에 이미 삽입이 시도되었습니다. 중복 삽입 방지.`);
                    Swal.fire({
                        icon: 'warning',
                        title: '중복 삽입 방지',
                        text: '잠시 후 다시 시도해주세요.',
                    });
                    return;
                }
                
                // 삽입 전 최종 중복 확인
                console.log(`[${submissionId}] 삽입 전 최종 중복 확인...`);
                const { data: finalCheck, error: finalCheckError } = await window.supabase
                    .from('reservation')
                    .select('res_no, created_at')
                    .eq('user_email', formData.email)
                    .eq('date', formData.date)
                    .eq('time', formData.time)
                    .order('created_at', { ascending: false })
                    .limit(1);
                
                if (!finalCheckError && finalCheck && finalCheck.length > 0) {
                    const lastReservationTime = new Date(finalCheck[0].created_at).getTime();
                    const timeSinceLastReservation = currentTime - lastReservationTime;
                    
                    console.log(`[${submissionId}] 최근 예약 시간:`, new Date(lastReservationTime));
                    console.log(`[${submissionId}] 시간 차이:`, timeSinceLastReservation, '밀리초');
                    
                    if (timeSinceLastReservation < 60000) { // 1분 이내
                        console.warn(`[${submissionId}] 1분 이내에 동일한 예약이 존재합니다. 삽입 중단.`);
                        Swal.fire({
                            icon: 'warning',
                            title: '중복 예약 감지',
                            text: '동일한 예약이 이미 존재합니다.',
                        });
                        return;
                    }
                }
                
                lastInsertTime = currentTime;
                console.log(`[${submissionId}] 예약 삽입 시작...`);
                const insertStartTime = new Date().getTime();
                
                // 삽입 전 예약 개수 확인
                const { count: beforeCount } = await window.supabase
                    .from('reservation')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_email', formData.email);
                
                console.log(`[${submissionId}] 삽입 전 총 예약 개수:`, beforeCount);
                
                const { data, error } = await window.supabase
                    .from('reservation') // ice_res 대신 reservation 테이블 사용
                    .insert([reservationData])
                    .select();
                
                const insertEndTime = new Date().getTime();
                console.log(`[${submissionId}] 삽입 완료 시간:`, insertEndTime - insertStartTime, '밀리초');
                
                if (error) {
                    console.error(`[${submissionId}] Supabase 에러 상세:`, error);
                    console.error(`[${submissionId}] 에러 코드:`, error.code);
                    console.error(`[${submissionId}] 에러 메시지:`, error.message);
                    console.error(`[${submissionId}] 에러 세부사항:`, error.details);
                    
                    // RLS 정책 오류인 경우 특별 처리
                    if (error.code === '42501' || error.message.includes('permission')) {
                        Swal.fire({
                            icon: 'error',
                            title: '권한 오류',
                            text: '예약 저장 권한이 없습니다. 관리자에게 문의하세요.',
                        });
                    } else if (error.code === '42P01') {
                        Swal.fire({
                            icon: 'error',
                            title: '테이블 오류',
                            text: 'reservation 테이블이 존재하지 않습니다. 관리자에게 문의하세요.',
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: '예약 실패',
                            text: `예약 저장 중 오류가 발생했습니다: ${error.message}`,
                        });
                    }
                } else {
                    console.log(`[${submissionId}] 예약 성공:`, data);
                    console.log(`[${submissionId}] 삽입된 예약 개수:`, data.length);
                    
                    // 삽입 후 예약 개수 확인
                    const { count: afterCount } = await window.supabase
                        .from('reservation')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_email', formData.email);
                    
                    console.log(`[${submissionId}] 삽입 후 총 예약 개수:`, afterCount);
                    console.log(`[${submissionId}] 예약 개수 증가:`, afterCount - beforeCount);
                    
                    if (afterCount - beforeCount > 1) {
                        console.error(`[${submissionId}] 경고: 예상보다 많은 예약이 생성되었습니다!`);
                        console.error(`[${submissionId}] 예상: 1개, 실제: ${afterCount - beforeCount}개`);
                    }
                    
                    // 삽입 후 즉시 확인
                    if (data && data.length > 0) {
                        console.log(`[${submissionId}] 삽입된 예약 ID:`, data[0].res_no);
                        
                        // 삽입 후 중복 확인
                        const { data: verifyData, error: verifyError } = await window.supabase
                            .from('reservation')
                            .select('res_no, date, time, user_email, created_at')
                            .eq('user_email', formData.email)
                            .eq('date', formData.date)
                            .eq('time', formData.time)
                            .order('created_at', { ascending: false });
                        
                        if (!verifyError && verifyData) {
                            console.log(`[${submissionId}] 삽입 후 예약 데이터:`, verifyData);
                            if (verifyData.length > 1) {
                                console.warn(`[${submissionId}] 중복 예약이 생성되었습니다!`);
                                console.warn(`[${submissionId}] 총 예약 개수:`, verifyData.length);
                                
                                // 중복 예약 삭제 시도
                                if (verifyData.length > 1) {
                                    const duplicateIds = verifyData.slice(1).map(r => r.res_no);
                                    console.log(`[${submissionId}] 중복 예약 삭제 시도:`, duplicateIds);
                                    
                                    const { error: deleteError } = await window.supabase
                                        .from('reservation')
                                        .delete()
                                        .in('res_no', duplicateIds);
                                    
                                    if (deleteError) {
                                        console.error(`[${submissionId}] 중복 예약 삭제 실패:`, deleteError);
                                    } else {
                                        console.log(`[${submissionId}] 중복 예약 삭제 완료`);
                                    }
                                }
                            }
                        }
                    }
                    
                    // 알림 시스템을 통한 알림 표시
                    if (window.showNotification) {
                        window.showNotification('신규예약 완료', '신규예약이 완료되었습니다.', 'success');
                    }
                    
                    Swal.fire({
                        title: '예약이 완료되었습니다!',
                        icon: 'success',
                        text: '예약이 성공적으로 저장되었습니다.',
                        confirmButtonText: '확인',
                        confirmButtonColor: '#0066cc',
                        customClass: {
                            icon: 'swal2-icon-success-custom',
                            popup: 'swal2-popup-custom'
                        }
                    }).then(() => {
                        // 마이페이지로 이동
                        window.location.href = 'mypage.html';
                    });
                }
            } catch (err) {
                console.error(`[${submissionId}] 예약 처리 중 오류:`, err);
                Swal.fire({
                    icon: 'error',
                    title: '예약 실패',
                    text: `예약 처리 중 오류가 발생했습니다: ${err.message}`,
                });
            } finally {
                // 전역 상태 복원
                isSubmitting = false;
                
                // 제출 버튼 상태 복원
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = '예약하기';
                    submitBtn.style.opacity = '1';
                    submitBtn.style.cursor = 'pointer';
                    submitBtn.style.pointerEvents = 'auto';
                    submitBtn.style.backgroundColor = '#0066cc';
                    submitBtn.style.color = 'white';
                }
                
                // 폼 전체 복원
                formInputs.forEach(input => {
                    if (input !== submitBtn) {
                        input.disabled = false;
                        input.style.opacity = '1';
                        input.style.cursor = 'auto';
                    }
                });
                
                console.log(`[${submissionId}] 예약 제출 완료 - 상태 복원됨`);
            }
        });
        
        console.log('폼 제출 이벤트 리스너 설정 완료');
    } else if (eventListenerAttached) {
        console.log('이벤트 리스너가 이미 설정되어 있습니다. 중복 설정 방지됨.');
    } else {
        console.error('reservation-form을 찾을 수 없습니다.');
    }
}

// 전화번호 입력 이벤트
function setupPhoneFormatting() {
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            formatPhone(this);
        });
    }
}

// 페이지 로드 시 초기화
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM 로드 완료, 초기화 시작');
    console.log('현재 이벤트 리스너 상태:', eventListenerAttached);
    
    // 자동 입력
    autofillReservationUser();
    
    // 개인정보 상세보기
    setupPrivacyDetail();
    
    // 폼 제출 처리
    setupFormSubmission();
    
    // 전화번호 포맷팅
    setupPhoneFormatting();
    
    console.log('초기화 완료');
});

// 페이지 로드 완료 후 추가 확인
window.addEventListener('load', () => {
    console.log('페이지 로드 완료, 이벤트 리스너 상태 확인');
    console.log('이벤트 리스너 바인딩 상태:', eventListenerAttached);
    
    // 폼이 존재하는지 확인
    const form = document.getElementById('reservation-form');
    if (form) {
        console.log('reservation-form 존재 확인됨');
        console.log('폼의 이벤트 리스너 개수:', form.onclick ? 'onclick 있음' : 'onclick 없음');
    } else {
        console.error('reservation-form을 찾을 수 없음');
    }
});

console.log('예약 JavaScript 파일 로드 완료');

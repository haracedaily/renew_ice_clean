console.log('예약 JavaScript 파일 로드됨');

// Supabase 클라이언트 생성
const SUPABASE_URL = 'https://wqetnltlnsvjidubewia.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxZXRubHRsbnN2amlkdWJld2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NzI5NDksImV4cCI6MjA1ODM0ODk0OX0.-Jw0jqyq93rA7t194Kq4_umPoTci8Eqx9j-oCwoZc6k';
if (!window.supabase) {
    window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
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
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            console.log('폼 제출 시작');
            
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
                specialRequest: document.getElementById('specialR').value || ''
            };
            
            console.log('수집된 데이터:', formData);
            
            // Supabase에 저장
            try {
                // 데이터 유효성 검사
                if (!formData.date || !formData.time || !formData.email) {
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
                    state: 0,
                    price: '50000'
                };
                
                console.log('Supabase 저장 데이터:', reservationData);
                console.log('Supabase 클라이언트:', window.supabase);
                
                const { data, error } = await window.supabase
                    .from('reservation') // ice_res 대신 reservation 테이블 사용
                    .insert([reservationData])
                    .select();
                
                if (error) {
                    console.error('Supabase 에러 상세:', error);
                    console.error('에러 코드:', error.code);
                    console.error('에러 메시지:', error.message);
                    console.error('에러 세부사항:', error.details);
                    
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
                    console.log('예약 성공:', data);
                    Swal.fire({
                        title: '예약이 완료되었습니다!',
                        icon: 'success',
                        text: '예약이 성공적으로 저장되었습니다.',
                        confirmButtonText: '확인'
                    }).then(() => {
                        // 폼 초기화
                        form.reset();
                        location.reload();
                    });
                }
            } catch (err) {
                console.error('예약 처리 중 오류:', err);
                Swal.fire({
                    icon: 'error',
                    title: '예약 실패',
                    text: `예약 처리 중 오류가 발생했습니다: ${err.message}`,
                });
            }
        });
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

console.log('예약 JavaScript 파일 로드 완료');

const $PdetailBtn = document.querySelector('.privacy-detail-btn');
const $Pdetail = document.querySelector('.privacy-details');
const $agreeInput = document.querySelector('#privacy');
const $Gobtn = document.querySelector('.gobtn');
const $Step01 = document.querySelector('.step01');
const $Step02 = document.querySelector('.step02');
const $name = document.getElementById('name');
const $email = document.getElementById('email');
const $phone = document.getElementById('phone');

// 페이지 로드 시 로그인한 사용자 정보 자동 입력
function autofillUserInfo() {
    const user = localStorage.getItem('mypageUser');
    if (user) {
        try {
            const userInfo = JSON.parse(user);
            console.log('로그인된 사용자 정보:', userInfo);
            
            if (userInfo.name) {
                $name.value = userInfo.name;
                $name.readOnly = true;
                $name.style.backgroundColor = '#f8f9fa';
            }
            
            if (userInfo.phone) {
                $phone.value = userInfo.phone;
                $phone.readOnly = true;
                $phone.style.backgroundColor = '#f8f9fa';
            }
            
            if (userInfo.email) {
                $email.value = userInfo.email;
                $email.readOnly = true;
                $email.style.backgroundColor = '#f8f9fa';
            }
            
            // 개인정보 동의 자동 체크
            $agreeInput.checked = true;
            
            // 로그인 정보 표시
            showLoginInfo();
            
        } catch (e) {
            console.error('사용자 정보 파싱 오류:', e);
        }
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
        const container = document.getElementById('container');
        if (container) {
            container.insertBefore(loginInfoDiv, container.firstChild);
        }
    } catch (e) {
        console.error('로그인 정보 표시 오류:', e);
    }
}

// 개인정보제공 동의 [보기] 버튼
$PdetailBtn.addEventListener('click', () => {
    const isVisible = $Pdetail.style.display === 'block';
    $Pdetail.style.display = isVisible ? 'none' : 'block';
});

// 예약확인 버튼
$Gobtn.addEventListener('click', async function () {
    if (!$name.value) {
        Swal.fire({ icon: 'error', text: '이름을 입력하세요.' });
        return;
    }
    if (!$phone.value) {
        Swal.fire({ icon: 'error', text: '연락처를 입력하세요.' });
        return;
    }
    if (!$email.value) {
        Swal.fire({ icon: 'error', text: 'email 입력하세요.' });
        return;
    }
    if (!$agreeInput.checked) {
        Swal.fire({ icon: 'error', text: '개인정보 제공에 동의하셔야 합니다.' });
        return;
    }

    const phoneRegex = /^\d{3}-\d{3,4}-\d{4}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const phone = $phone.value;
    const email = $email.value;

    // 전화번호 유효성 검사
    if (!phoneRegex.test(phone)) {
        Swal.fire({
            icon: 'error',
            html: `유효한 전화번호 형식이 아닙니다.<br> ex) 010-1234-5678`
        });
        return;
    }

    // 이메일 유효성 검사
    if (!emailRegex.test(email)) {
        Swal.fire({
            icon: 'error',
            html: '유효한 이메일 형식이 아닙니다.<br> ex) example@domain.com'
        });
        return;
    }

    $Step01.style.display = 'none';
    $Step02.classList.remove('hidden2');
    const $Qtxt = document.querySelector('.Q-txt');
    $Qtxt.innerHTML = '예약 정보를 확인하세요';

    console.log('Supabase 쿼리 시작:', { name: $name.value, email: $email.value, phone: $phone.value });
    
    // reservation 테이블에서 조회
    const { data, error } = await window.supabase
        .from('reservation')
        .select('*')
        .eq('user_email', $email.value)
        .order('date', { ascending: false });

    if (error) {
        console.error('Supabase 조회 오류:', error);
        Swal.fire({ icon: 'error', text: '예약 조회 중 오류가 발생했습니다.' });
        return;
    }

    console.log('조회된 데이터:', data);

    let row = '';
    if (data && data.length > 0) {
        // 모든 예약 내역을 표시
        const reservations = data.map(reservation => {
            const statusText = reservation.state === 0 ? '예약대기' : 
                             reservation.state === 1 ? '예약확정' : 
                             reservation.state === 2 ? '서비스완료' : '취소됨';
            
            return `
                <div class="reservation-item" style="border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; border-radius: 8px;">
                    <h3 style="color: #0066cc; margin-bottom: 15px;">예약 번호: ${reservation.res_no}</h3>
                    <p><strong>예약 날짜:</strong> ${reservation.date}</p>
                    <p><strong>예약 시간:</strong> ${reservation.time}</p>
                    <p><strong>서비스 주소:</strong> ${reservation.addr}</p>
                    <p><strong>제빙기 모델:</strong> ${reservation.model || '미지정'}</p>
                    <p><strong>특별 요청사항:</strong> ${reservation.remark || '없음'}</p>
                    <p><strong>예약 상태:</strong> <span style="color: ${reservation.state === 0 ? '#ff6b6b' : reservation.state === 1 ? '#51cf66' : '#868e96'}">${statusText}</span></p>
                    <p><strong>서비스 금액:</strong> ${reservation.price ? reservation.price + '원' : '미정'}</p>
                </div>
            `;
        }).join('');
        
        row = `
            <div class="view">
                <h2 style="margin-bottom: 20px; color: #333;">예약 내역 (${data.length}건)</h2>
                ${reservations}
            </div>
            <div class="button-container" style="margin-top: 20px;">
                <button class="done-btn" onclick="location.href='./reservationInquiry.html'">확인</button>
            </div>
        `;
    } else {
        $Qtxt.innerHTML = '예약 정보 없음';
        row = `
            <div class="view" style="margin-top: 2rem">
                <p class="none-txt"><strong>입력하신 정보로 등록된 예약이 없습니다.<br/>확인 후 다시 시도해 주세요.</strong></p>
            </div>
            <div class="button-container" style="margin-top: 20px;">
                <button class="done-btn" onclick="location.href='./reservationInquiry.html'">확인</button>
            </div>
        `;
    }
    $Step02.innerHTML = row;
});

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('예약조회 페이지 로드됨');
    autofillUserInfo();
});
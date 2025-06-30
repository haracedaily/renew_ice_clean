// === DOM 요소 ===
const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const mypageSection = document.getElementById('mypage-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const logoutBtn = document.getElementById('logout-btn');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const refreshBtn = document.getElementById('refresh-reservations');
const reservationsList = document.getElementById('reservations-list');
const profileForm = document.getElementById('profile-form');
const filterBtns = document.querySelectorAll('.filter-btn');

let currentUser = null;
let allReservations = []; // 모든 예약 데이터 저장
let currentFilter = 'all'; // 현재 필터 상태

// ===== 페이지 로드시 처리 =====
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    setupProfileForm();
    setupRegisterForm();
    setupMobileOptimization();
    setupPhoneFormatting();
    setupAddressSearch();
    setupFilterButtons();
});

// === 전화번호 자동 하이픈 설정 ===
function setupPhoneFormatting() {
    const phoneInputs = document.querySelectorAll('input[type="tel"], #register-phone, #profile-phone');
    
    phoneInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/[^0-9]/g, '');
            
            if (value.length <= 3) {
                e.target.value = value;
            } else if (value.length <= 7) {
                e.target.value = value.slice(0, 3) + '-' + value.slice(3);
            } else {
                e.target.value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
            }
        });
    });
}

// === 주소 검색 설정 ===
function setupAddressSearch() {
    const addressSearchBtns = document.querySelectorAll('.address-search-btn');
    
    addressSearchBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            searchAddress(this);
        });
    });
}

// === 주소 검색 함수 ===
function searchAddress(buttonElement) {
    new daum.Postcode({
        oncomplete: function(data) {
            // 팝업에서 검색결과 항목을 클릭했을때 실행할 코드를 작성하는 부분입니다.
            // 예제를 참고하여 각주 항목을 분석하여 구성하시면 됩니다.
            
            // 도로명 주소의 노출 규칙에 따라 주소를 표시합니다.
            // 내려오는 변수가 값이 없는 경우엔 공백('')값을 가지므로, 이를 참고하여 분기 한다.
            var roadAddr = data.roadAddress; // 도로명 주소 변수
            var jibunAddr = data.jibunAddress; // 지번 주소 변수
            
            // 버튼의 부모 요소에서 관련 입력 필드들을 찾습니다
            const postcodeGroup = buttonElement.closest('.postcode-group');
            const formGroup = postcodeGroup.closest('.form-group');
            
            // 우편번호와 주소 정보를 해당 필드에 넣는다.
            const postcodeInput = formGroup.querySelector('input[placeholder*="우편번호"], #register-postcode, #profile-postcode');
            const addressInput = formGroup.parentElement.querySelector('input[placeholder*="주소"], #register-address, #profile-address');
            const detailInput = formGroup.parentElement.querySelector('input[placeholder*="상세주소"], #register-detail-address, #profile-detail-address');
            
            if (postcodeInput) postcodeInput.value = data.zonecode;
            if (addressInput) addressInput.value = roadAddr || jibunAddr;
            if (detailInput) detailInput.focus();
        }
    }).open();
}

// === 로그인 상태 체크 ===
function checkLoginStatus() {
    const savedUser = localStorage.getItem('mypageUser');
    const userInfo = localStorage.getItem('userInfo');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMypage();
        loadUserReservations();
        loadUserProfile();
        localStorage.setItem('userInfo', JSON.stringify(currentUser));
        localStorage.setItem('isLoggedIn', 'true');
    } else if (userInfo && isLoggedIn) {
        currentUser = JSON.parse(userInfo);
        showMypage();
        loadUserReservations();
        loadUserProfile();
        localStorage.setItem('mypageUser', JSON.stringify(currentUser));
    } else {
        showLogin();
    }
}

// === 로그인 ===
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        Swal.fire({ icon: 'error', title: '입력 오류', text: '이메일과 비밀번호를 모두 입력해주세요.' });
        return;
    }

    try {
        // customer 테이블에서 직접 로그인
        const { data, error } = await supabase
            .from('customer')
            .select('*')
            .eq('email', email)
            .single();

        if (error) {
            console.error('로그인 조회 오류:', error);
            if (error.code === 'PGRST116') {
                Swal.fire({ icon: 'error', title: '로그인 실패', text: '이메일 또는 비밀번호가 올바르지 않습니다.' });
            } else {
                Swal.fire({ icon: 'error', title: '로그인 실패', text: '로그인 중 오류가 발생했습니다. 관리자에게 문의하세요.' });
            }
            return;
        }

        if (!data) {
            Swal.fire({ icon: 'error', title: '로그인 실패', text: '이메일 또는 비밀번호가 올바르지 않습니다.' });
            return;
        }

        // 비밀번호 검증
        let isPasswordValid = false;
        
        try {
            isPasswordValid = await verifyPassword(password, data.password);
            
            // 평문 비밀번호인 경우 자동 마이그레이션
            if (!isPasswordValid && data.password === password) {
                console.log('평문 비밀번호 감지, 자동 마이그레이션 시작');
                const migrationSuccess = await migratePlainPassword(data.email, password);
                if (migrationSuccess) {
                    console.log('비밀번호 마이그레이션 완료');
                    isPasswordValid = true; // 마이그레이션 후 로그인 허용
                } else {
                    console.warn('비밀번호 마이그레이션 실패');
                }
            }
        } catch (error) {
            console.error('비밀번호 검증 중 오류:', error);
            Swal.fire({ icon: 'error', title: '로그인 실패', text: '비밀번호 검증 중 오류가 발생했습니다.' });
            return;
        }
        
        if (!isPasswordValid) {
            Swal.fire({ icon: 'error', title: '로그인 실패', text: '이메일 또는 비밀번호가 올바르지 않습니다.' });
            return;
        }

        currentUser = {
            res_no: data.res_no,
            email: data.email,
            name: data.name,
            phone: data.phone || '',
            addr: data.addr || '',
            password: data.password || '',
            img_url: data.img_url || '',
            state: data.state || ''
        };

        localStorage.setItem('mypageUser', JSON.stringify(currentUser));
        localStorage.setItem('userInfo', JSON.stringify(currentUser));
        localStorage.setItem('isLoggedIn', 'true');

        showMypage();
        loadUserReservations();
        loadUserProfile();

        Swal.fire({ 
            icon: 'success', 
            title: '로그인 성공!', 
            text: '마이페이지로 이동합니다.',
            customClass: {
                icon: 'swal2-icon-custom'
            }
        });
    } catch (error) {
        console.error('로그인 오류:', error);
        Swal.fire({ icon: 'error', title: '로그인 실패', text: '로그인 중 오류가 발생했습니다.' });
    }
});

// === 회원가입 ===
async function registerUser(email, password, name, phone, addr) {
    try {
        // 1단계: 이메일 중복 체크
        console.log('이메일 중복 체크 시작:', email);
        const { data: existingUser, error: checkError } = await supabase
            .from('customer')
            .select('email')
            .eq('email', email)
            .single();

        if (existingUser) {
            throw new Error('이미 가입된 이메일입니다. 다른 이메일을 사용해주세요.');
        }

        // 2단계: 비밀번호 해시
        let passwordHash;
        
        try {
            passwordHash = await hashPassword(password);
            console.log('비밀번호 해시 완료');
        } catch (error) {
            console.error('비밀번호 해시 중 오류:', error);
            throw new Error('비밀번호 처리 중 오류가 발생했습니다.');
        }

        // 3단계: customer 테이블에 데이터 삽입
        const customerData = {
            email: email,
            password: passwordHash,
            name: name,
            phone: phone || '',
            addr: addr || ''
        };

        console.log('customer 테이블에 데이터 삽입 시도:', customerData);
        
        const { data: result, error: insertError } = await supabase
            .from('customer')
            .insert([customerData])
            .select();

        if (insertError) {
            console.error('customer 테이블 삽입 오류:', insertError);
            
            // 409 오류 (중복) 처리
            if (insertError.code === '23505' || insertError.message.includes('duplicate')) {
                throw new Error('이미 가입된 이메일입니다. 다른 이메일을 사용해주세요.');
            }
            
            // 406 오류 (RLS 정책) 처리
            if (insertError.code === '406' || insertError.message.includes('406')) {
                throw new Error('데이터베이스 접근 권한 문제가 발생했습니다. 관리자에게 문의해주세요.');
            }
            
            // 기타 오류
            throw new Error(`회원가입 중 오류가 발생했습니다: ${insertError.message}`);
        }

        console.log('회원가입 성공:', result);
        return { success: true, data: result[0] };
        
    } catch (error) {
        console.error('회원가입 오류:', error);
        
        // 구체적인 오류 메시지 표시
        let errorMessage = '회원가입 중 오류가 발생했습니다.';
        
        if (error.message) {
            if (error.message.includes('이미 가입된')) {
                errorMessage = error.message;
            } else if (error.message.includes('데이터베이스 접근')) {
                errorMessage = error.message;
            } else if (error.message.includes('회원가입 중 오류')) {
                errorMessage = error.message;
            } else if (error.message.includes('409')) {
                errorMessage = '이미 가입된 이메일입니다. 다른 이메일을 사용해주세요.';
            } else if (error.message.includes('406')) {
                errorMessage = '데이터베이스 접근 권한 문제가 발생했습니다. 관리자에게 문의해주세요.';
            } else {
                errorMessage = error.message;
            }
        }
        
        Swal.fire({
            icon: 'error',
            title: '회원가입 실패',
            text: errorMessage,
            confirmButtonText: '확인'
        });
    }
}

// 회원가입 폼 이벤트
function setupRegisterForm() {
    // 실시간 이메일 중복 체크
    const emailInput = document.getElementById('register-email');
    let emailCheckTimeout;
    
    emailInput.addEventListener('input', function() {
        clearTimeout(emailCheckTimeout);
        const email = this.value.trim();
        
        // 이메일 상태 표시 초기화
        removeEmailStatus();
        
        if (email && isValidEmail(email)) {
            emailCheckTimeout = setTimeout(() => {
                checkEmailDuplicate(email);
            }, 500); // 0.5초 후 체크
        }
    });
    
    // 실시간 연락처 중복 체크
    const phoneInput = document.getElementById('register-phone');
    let phoneCheckTimeout;
    
    phoneInput.addEventListener('input', function() {
        clearTimeout(phoneCheckTimeout);
        const phone = this.value.trim();
        
        // 연락처 상태 표시 초기화
        removePhoneStatus();
        
        if (phone && isValidPhone(phone)) {
            phoneCheckTimeout = setTimeout(() => {
                checkPhoneDuplicate(phone);
            }, 500); // 0.5초 후 체크
        }
    });
    
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const name = document.getElementById('register-name').value;
        const phone = document.getElementById('register-phone').value;
        const addr = document.getElementById('register-address').value;
        
        if (!email || !password || !name) {
            Swal.fire({
                icon: 'error',
                title: '입력 오류',
                text: '이메일, 비밀번호, 이름은 필수 항목입니다.',
            });
            return;
        }
        
        // 중복 체크 상태 확인
        const emailStatus = emailInput.classList.contains('email-duplicate');
        const phoneStatus = phoneInput.classList.contains('phone-duplicate');
        
        if (emailStatus) {
            Swal.fire({
                icon: 'error',
                title: '중복 오류',
                text: '이미 등록된 이메일입니다.',
            });
            return;
        }
        
        if (phoneStatus) {
            Swal.fire({
                icon: 'error',
                title: '중복 오류',
                text: '이미 등록된 연락처입니다.',
            });
            return;
        }
        
        try {
            const result = await registerUser(email, password, name, phone, addr);
            if (result.success) {
                currentUser = {
                    res_no: result.data.res_no,
                    email: email,
                    name: name,
                    phone: phone,
                    addr: addr,
                    password: password,
                    img_url: result.data.img_url || '',
                    state: result.data.state || ''
                };
                localStorage.setItem('mypageUser', JSON.stringify(currentUser));
                localStorage.setItem('userInfo', JSON.stringify(currentUser));
                localStorage.setItem('isLoggedIn', 'true');
                showMypage();
                loadUserReservations();
                Swal.fire({
                    icon: 'success',
                    title: '회원가입 성공!',
                    text: '자동으로 로그인되었습니다.',
                });
            }
        } catch (error) {
            console.error('회원가입 오류:', error);
            Swal.fire({
                icon: 'error',
                title: '회원가입 실패',
                text: error.message || '회원가입 중 오류가 발생했습니다.',
            });
        }
    });
}

// 이메일 중복 체크 함수
async function checkEmailDuplicate(email) {
    try {
        const { data, error } = await supabase
            .from('customer')
            .select('email')
            .eq('email', email)
            .single();
            
        if (error && error.code === 'PGRST116') {
            // 사용자를 찾을 수 없음 = 중복 아님
            showEmailAvailable();
        } else if (data) {
            // 사용자 존재 = 중복
            showEmailDuplicate();
        }
    } catch (error) {
        console.error('이메일 중복 체크 오류:', error);
    }
}

// 연락처 중복 체크 함수
async function checkPhoneDuplicate(phone) {
    try {
        const { data, error } = await supabase
            .from('customer')
            .select('phone')
            .eq('phone', phone)
            .single();
            
        if (error && error.code === 'PGRST116') {
            // 사용자를 찾을 수 없음 = 중복 아님
            showPhoneAvailable();
        } else if (data) {
            // 사용자 존재 = 중복
            showPhoneDuplicate();
        }
    } catch (error) {
        console.error('연락처 중복 체크 오류:', error);
    }
}

// 이메일 사용 가능 표시
function showEmailAvailable() {
    const emailInput = document.getElementById('register-email');
    emailInput.classList.remove('email-duplicate');
    emailInput.classList.add('email-available');
    
    // 상태 메시지 표시
    showStatusMessage('register-email', '사용 가능한 이메일입니다.', 'available');
}

// 이메일 중복 표시
function showEmailDuplicate() {
    const emailInput = document.getElementById('register-email');
    emailInput.classList.remove('email-available');
    emailInput.classList.add('email-duplicate');
    
    // 상태 메시지 표시
    showStatusMessage('register-email', '이미 등록된 이메일입니다.', 'duplicate');
}

// 연락처 사용 가능 표시
function showPhoneAvailable() {
    const phoneInput = document.getElementById('register-phone');
    phoneInput.classList.remove('phone-duplicate');
    phoneInput.classList.add('phone-available');
    
    // 상태 메시지 표시
    showStatusMessage('register-phone', '사용 가능한 연락처입니다.', 'available');
}

// 연락처 중복 표시
function showPhoneDuplicate() {
    const phoneInput = document.getElementById('register-phone');
    phoneInput.classList.remove('phone-available');
    phoneInput.classList.add('phone-duplicate');
    
    // 상태 메시지 표시
    showStatusMessage('register-phone', '이미 등록된 연락처입니다.', 'duplicate');
}

// 상태 메시지 표시
function showStatusMessage(inputId, message, type) {
    const input = document.getElementById(inputId);
    const formGroup = input.closest('.form-group');
    
    // 기존 상태 메시지 제거
    const existingStatus = formGroup.querySelector('.status-message');
    if (existingStatus) {
        existingStatus.remove();
    }
    
    // 새 상태 메시지 생성
    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message ${type}`;
    statusDiv.textContent = message;
    statusDiv.style.cssText = `
        font-size: 12px;
        margin-top: 4px;
        padding: 4px 8px;
        border-radius: 4px;
        ${type === 'available' ? 'color: #28a745; background: #d4edda;' : 'color: #dc3545; background: #f8d7da;'}
    `;
    
    formGroup.appendChild(statusDiv);
}

// 이메일 상태 제거
function removeEmailStatus() {
    const emailInput = document.getElementById('register-email');
    emailInput.classList.remove('email-available', 'email-duplicate');
    
    const formGroup = emailInput.closest('.form-group');
    const statusMessage = formGroup.querySelector('.status-message');
    if (statusMessage) {
        statusMessage.remove();
    }
}

// 연락처 상태 제거
function removePhoneStatus() {
    const phoneInput = document.getElementById('register-phone');
    phoneInput.classList.remove('phone-available', 'phone-duplicate');
    
    const formGroup = phoneInput.closest('.form-group');
    const statusMessage = formGroup.querySelector('.status-message');
    if (statusMessage) {
        statusMessage.remove();
    }
}

// 이메일 유효성 검사
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 연락처 유효성 검사
function isValidPhone(phone) {
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    return phoneRegex.test(phone);
}

// 사용자 프로필 표시 함수
function displayUserProfile(user) {
    if (!user) return;
    
    try {
        // 사용자 정보 표시
        document.getElementById('user-name').textContent = user.name || '사용자님';
        document.getElementById('user-email').textContent = user.email || 'user@example.com';
        
        // 프로필 폼에 정보 채우기
        document.getElementById('profile-name').value = user.name || '';
        document.getElementById('profile-phone').value = user.phone || '';
        document.getElementById('profile-email').value = user.email || '';
        document.getElementById('profile-email').readOnly = true;
        document.getElementById('profile-address').value = user.addr || '';
        
        console.log('프로필 정보 표시 완료:', user);
    } catch (error) {
        console.error('프로필 표시 오류:', error);
    }
}

// 사용자 프로필 로드 (강화된 버전)
async function loadUserProfile() {
    if (!currentUser) {
        console.log('currentUser가 없어서 프로필 로드를 건너뜁니다.');
        return;
    }
    
    try {
        console.log('프로필 로드 시작:', currentUser.email);
        
        // 회원가입 직후인지 확인 (res_no가 없으면 새로 가입한 사용자)
        if (!currentUser.res_no) {
            console.log('새로 가입한 사용자이므로 로컬 데이터를 사용합니다.');
            displayUserProfile(currentUser);
            return;
        }
        
        // 방법 1: 기본 쿼리 시도
        let { data, error } = await supabase
            .from('customer')
            .select('*')
            .eq('email', currentUser.email)
            .single();

        // 방법 2: 첫 번째 방법이 실패하면 다른 방법 시도
        if (error) {
            console.log('첫 번째 방법 실패, 두 번째 방법 시도:', error);
            
            // 406 오류인 경우 즉시 로컬 데이터 사용
            if (error.code === '406' || error.message.includes('406')) {
                console.log('406 오류 발생, 로컬 데이터를 사용합니다.');
                displayUserProfile(currentUser);
                return;
            }
            
            // RLS 문제일 수 있으므로 다른 접근 방법 시도
            const { data: data2, error: error2 } = await supabase
                .from('customer')
                .select('*')
                .eq('email', currentUser.email)
                .limit(1);

            if (error2) {
                console.log('두 번째 방법도 실패:', error2);
                
                // 406 오류인 경우 로컬 데이터 사용
                if (error2.code === '406' || error2.message.includes('406')) {
                    console.log('406 오류 발생, 로컬 데이터를 사용합니다.');
                    displayUserProfile(currentUser);
                    return;
                }
                
                throw error2;
            }
            
            if (data2 && data2.length > 0) {
                data = data2[0];
                error = null;
            } else {
                throw { code: 'PGRST116', message: '사용자를 찾을 수 없습니다.' };
            }
        }

        if (data) {
            console.log('데이터베이스에서 프로필 정보 로드 성공:', data);
            
            // 데이터베이스 정보로 currentUser 업데이트
            currentUser = {
                ...currentUser,
                name: data.name || currentUser.name,
                phone: data.phone || currentUser.phone,
                addr: data.addr || currentUser.addr,
                res_no: data.res_no || currentUser.res_no,
                img_url: data.img_url || currentUser.img_url,
                state: data.state || currentUser.state
            };
            
            // 로컬 스토리지 업데이트
            localStorage.setItem('mypageUser', JSON.stringify(currentUser));
            localStorage.setItem('userInfo', JSON.stringify(currentUser));
            
            // 프로필 표시
            displayUserProfile(currentUser);
        } else {
            console.log('데이터가 없어서 로컬 데이터로 표시합니다.');
            displayUserProfile(currentUser);
        }
    } catch (error) {
        console.error('프로필 로드 중 예외 발생:', error);
        
        // 406 오류인 경우 로컬 데이터 사용
        if (error.code === '406' || (error.message && error.message.includes('406'))) {
            console.log('406 오류로 로컬 데이터를 사용합니다.');
            displayUserProfile(currentUser);
            return;
        }
        
        // PGRST116 오류인 경우 (사용자를 찾을 수 없음)
        if (error.code === 'PGRST116') {
            console.log('사용자를 찾을 수 없어서 로컬 데이터를 사용합니다.');
            displayUserProfile(currentUser);
            return;
        }
        
        // 기타 오류인 경우도 로컬 데이터 사용
        console.log('기타 오류로 로컬 데이터를 사용합니다.');
        displayUserProfile(currentUser);
    }
}

// 데이터베이스에 사용자 생성
async function createUserInDatabase(user) {
    try {
        console.log('데이터베이스에 사용자 생성 시도:', user.email);
        
        const { data, error } = await supabase
            .from('customer')
            .insert([
                {
                    email: user.email,
                    name: user.name || '사용자',
                    phone: user.phone || '',
                    addr: user.addr || '',
                    password: user.password || '$2b$10$default_hash',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ])
            .select();

        if (error) {
            console.error('사용자 생성 오류:', error);
            throw error;
        }

        console.log('사용자 생성 성공:', data);
        return data;
    } catch (error) {
        console.error('사용자 생성 중 예외 발생:', error);
        throw error;
    }
}

// 알림 표시 함수
function showNotification(message, type = 'info') {
    // 간단한 알림 표시 (선택사항)
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // 더 나은 사용자 경험을 위해 실제 알림 UI를 추가할 수 있습니다
    // 예: toast 메시지, 모달 등
}

// === 프로필 수정 ===
function setupProfileForm() {
    if (!profileForm) return;
    profileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('profile-name').value;
        const phone = document.getElementById('profile-phone').value;
        const email = document.getElementById('profile-email').value;
        const addr = document.getElementById('profile-address').value;
        try {
            const customerData = {
                name: name,
                phone: phone,
                addr: addr
            };
            const { data: result, error: updateError } = await supabase
                .from('customer')
                .update(customerData)
                .eq('email', email)
                .select();
            if (updateError) {
                throw updateError;
            }
            currentUser = {
                ...currentUser,
                name: name,
                phone: phone,
                addr: addr
            };
            localStorage.setItem('mypageUser', JSON.stringify(currentUser));
            localStorage.setItem('userInfo', JSON.stringify(currentUser));
            Swal.fire({
                icon: 'success',
                title: '프로필 저장 완료',
                text: '프로필 정보가 성공적으로 저장되었습니다.',
            });
        } catch (error) {
            console.error('프로필 저장 오류:', error);
            Swal.fire({
                icon: 'error',
                title: '저장 실패',
                text: '프로필 저장 중 오류가 발생했습니다: ' + error.message,
            });
        }
    });
}

// === 로그아웃 ===
logoutBtn.addEventListener('click', function() {
    Swal.fire({
        icon: 'question',
        title: '로그아웃',
        text: '정말 로그아웃 하시겠습니까?',
        showCancelButton: true,
        confirmButtonText: '로그아웃',
        cancelButtonText: '취소',
        confirmButtonColor: '#dc3545'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('mypageUser');
            localStorage.removeItem('userInfo');
            localStorage.removeItem('isLoggedIn');
            currentUser = null;
            showLogin();
            Swal.fire({ icon: 'success', title: '로그아웃 완료', text: '안전하게 로그아웃되었습니다.' });
        }
    });
});

// === 탭/예약 관련 ===
tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        const targetTab = this.getAttribute('data-tab');
        tabBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`${targetTab}-tab`).classList.add('active');
        if (targetTab === 'reservations') loadUserReservations();
    });
});
refreshBtn.addEventListener('click', function() {
    loadUserReservations();
    Swal.fire({ icon: 'success', title: '새로고침 완료', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
});

// 예약 내역 불러오기(reservation 테이블에 user_email 기준)
async function loadUserReservations() {
    if (!currentUser) return;
    
    try {
        console.log('예약 내역 로드 시작:', currentUser.email);
        
        const { data, error } = await window.supabase
            .from('reservation') // ice_res 대신 reservation 테이블 사용
            .select('*')
            .eq('user_email', currentUser.email) // email 대신 user_email 사용
            .order('date', { ascending: false });
            
        if (error) {
            console.error('예약 내역 조회 오류:', error);
            throw error;
        }
        
        console.log('조회된 예약 내역:', data);
        
        // 로컬 스토리지에서 즐겨찾기 정보 가져오기
        const favorites = JSON.parse(localStorage.getItem('reservation_favorites') || '[]');
        
        // 예약 데이터에 즐겨찾기 정보 추가
        allReservations = (data || []).map(reservation => ({
            ...reservation,
            is_favorite: favorites.includes(reservation.res_no)
        }));
        
        updateReservationStats(allReservations);
        applyFilter(); // 현재 필터 적용
        
    } catch (error) {
        console.error('예약 내역 로드 오류:', error);
        Swal.fire({ 
            icon: 'error', 
            title: '오류', 
            text: '예약 내역을 불러오는 중 오류가 발생했습니다.' 
        });
    }
}

function updateReservationStats(reservations) {
    const total = reservations.length;
    const newReservation = reservations.filter(r => r.state === 1).length;
    const paymentWaiting = reservations.filter(r => r.state === 2).length;
    const paymentCompleted = reservations.filter(r => r.state === 3).length;
    const assigned = reservations.filter(r => r.state === 4).length;
    const completed = reservations.filter(r => r.state === 5).length;
    const cancelled = reservations.filter(r => r.state === 6).length;
    
    const statsElement = document.getElementById('reservation-stats');
    if (statsElement) {
        statsElement.innerHTML = `
            <div class="stat-item">
                <span class="stat-number">${total}</span>
                <span class="stat-label">전체 예약</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">${newReservation}</span>
                <span class="stat-label">신규예약</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">${paymentWaiting}</span>
                <span class="stat-label">결제대기</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">${paymentCompleted}</span>
                <span class="stat-label">결제완료</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">${assigned}</span>
                <span class="stat-label">기사배정</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">${completed}</span>
                <span class="stat-label">청소완료</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">${cancelled}</span>
                <span class="stat-label">예약취소</span>
            </div>
        `;
    }
}

function displayReservations(reservations) {
    if (!reservationsList) return;
    
    if (reservations.length === 0) {
        reservationsList.innerHTML = `
            <div class="no-reservations">
                <div class="no-reservations-icon">
                    <i class="fas fa-calendar-times"></i>
                </div>
                <h3>등록된 예약이 없습니다</h3>
                <p>아직 예약한 내역이 없습니다.<br>새로운 예약을 해보세요!</p>
                <button class="new-reservation-btn" onclick="goToReservation()">
                    <i class="fas fa-plus"></i> 새 예약하기
                </button>
            </div>
        `;
        return;
    }
    
    // 즐겨찾기 예약을 상단으로 정렬
    const sortedReservations = reservations.sort((a, b) => {
        const aIsFavorite = a.is_favorite || false;
        const bIsFavorite = b.is_favorite || false;
        if (aIsFavorite && !bIsFavorite) return -1;
        if (!aIsFavorite && bIsFavorite) return 1;
        return 0;
    });
    
    reservationsList.innerHTML = sortedReservations.map(reservation => {
        const statusInfo = getStatusInfo(reservation.state);
        const isFavorite = reservation.is_favorite || false;
        
        // 결제금액 표시 로직
        let paymentDisplay = '';
        if (reservation.state >= 3) { // 결제완료(3) 이상인 경우
            paymentDisplay = `
                <div class="detail-item">
                    <span class="detail-label">결제금액</span>
                    <span class="detail-value">${reservation.price ? reservation.price + '원' : '미정'}</span>
                </div>
            `;
        } else { // 결제완료 미만인 경우
            paymentDisplay = `
                <div class="detail-item">
                    <span class="detail-label">결제금액</span>
                    <span class="detail-value">기사배정중</span>
                </div>
            `;
        }
        
        return `
            <div class="reservation-card ${isFavorite ? 'favorite' : ''}">
                <div class="reservation-card-header">
                    <div class="reservation-id">
                        <span class="reservation-number">예약 #${reservation.res_no}</span>
                        <button class="favorite-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavorite(${reservation.res_no})" title="${isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}">
                            <i class="fas fa-star"></i>
                        </button>
                    </div>
                    <span class="reservation-status status-${reservation.state}">${statusInfo.text}</span>
                </div>
                
                <div class="reservation-details">
                    <div class="detail-item">
                        <span class="detail-label">예약 날짜</span>
                        <span class="detail-value">${formatDate(reservation.date)} ${reservation.time}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">서비스 주소</span>
                        <span class="detail-value">${reservation.addr || '미입력'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">제빙기 모델</span>
                        <span class="detail-value">${reservation.model || '미입력'}</span>
                    </div>
                    ${paymentDisplay}
                </div>
                
                ${reservation.remark ? `
                    <div class="detail-item">
                        <span class="detail-label">특별 요청사항</span>
                        <span class="detail-value">${reservation.remark}</span>
                    </div>
                ` : ''}
                
                <div class="reservation-actions">
                    ${statusInfo.canCancel ? `
                        <button class="cancel-btn" onclick="cancelReservation(${reservation.res_no})">
                            <i class="fas fa-times"></i> 예약취소
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// 예약 상태 정보 반환
function getStatusInfo(state) {
    const stateConfig = {
        1: { text: "신규예약 (취소 가능)", class: "status-pending", canCancel: true },
        2: { text: "결제대기", class: "status-payment-waiting", canCancel: false },
        3: { text: "결제완료", class: "status-payment-completed", canCancel: false },
        4: { text: "기사배정", class: "status-assigned", canCancel: false },
        5: { text: "청소완료", class: "status-completed", canCancel: false },
        6: { text: "예약취소", class: "status-cancelled", canCancel: false }
    };
    
    return stateConfig[state] || { text: "알 수 없음", class: "status-unknown", canCancel: false };
}

// 날짜 포맷팅
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// 예약 취소
async function cancelReservation(reservationId) {
    const result = await Swal.fire({
        title: '예약 취소',
        text: '정말로 이 예약을 취소하시겠습니까?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '취소하기',
        cancelButtonText: '돌아가기',
        confirmButtonColor: '#dc3545',
        customClass: {
            icon: 'swal2-icon-custom'
        }
    });
    
    if (result.isConfirmed) {
        try {
            const { error } = await window.supabase
                .from('reservation')
                .update({ state: 6 }) // 6 = 예약취소
                .eq('res_no', reservationId);
                
            if (error) throw error;
            
            Swal.fire({
                icon: 'success',
                title: '예약 취소 완료',
                text: '예약이 성공적으로 취소되었습니다.',
                customClass: {
                    icon: 'swal2-icon-custom'
                }
            });
            
            // 예약 내역 새로고침
            loadUserReservations();
            
        } catch (error) {
            console.error('예약 취소 오류:', error);
            Swal.fire({
                icon: 'error',
                title: '취소 실패',
                text: '예약 취소 중 오류가 발생했습니다.',
                customClass: {
                    icon: 'swal2-icon-custom'
                }
            });
        }
    }
}

// ===== 기타 =====
function setupMobileOptimization() {
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="tel"]');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            if (window.innerWidth <= 768) this.style.fontSize = '16px';
        });
        input.addEventListener('blur', function() {
            if (window.innerWidth <= 768) this.style.fontSize = '';
        });
    });
    document.body.style.webkitOverflowScrolling = 'touch';
}

function showLogin() {
    showLoginForm();
    document.getElementById('user-name').textContent = '사용자님';
    document.getElementById('user-email').textContent = 'user@example.com';
}
function showLoginForm() {
    loginSection.classList.remove('hidden');
    registerSection.classList.add('hidden');
    mypageSection.classList.add('hidden');
}
function showRegisterForm() {
    loginSection.classList.add('hidden');
    registerSection.classList.remove('hidden');
    mypageSection.classList.add('hidden');
}
function showMypage() {
    loginSection.classList.add('hidden');
    registerSection.classList.add('hidden');
    mypageSection.classList.remove('hidden');
    if (currentUser) {
        document.getElementById('user-name').textContent = currentUser.name + '님';
        document.getElementById('user-email').textContent = currentUser.email;
        document.getElementById('profile-name').value = currentUser.name;
        document.getElementById('profile-phone').value = currentUser.phone;
        document.getElementById('profile-email').value = currentUser.email;
        document.getElementById('profile-address').value = currentUser.addr;
        // img_url, state 등 필요시 추가
    }
}
function goToReservation() {
    // 로그인 상태 확인
    const userInfo = localStorage.getItem('userInfo');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (!isLoggedIn || !userInfo) {
        // 로그인되지 않은 경우 경고 메시지 표시
        Swal.fire({
            icon: 'warning',
            title: '로그인이 필요합니다',
            text: '예약 서비스를 이용하려면 로그인이 필요합니다.',
            confirmButtonText: '로그인하기',
            showCancelButton: true,
            cancelButtonText: '취소',
            confirmButtonColor: '#0066CC',
            customClass: {
                icon: 'swal2-icon-custom'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // 현재 페이지에서 로그인 폼 표시
                showLoginForm();
            }
        });
        return;
    }
    
    // 로그인된 경우 예약 페이지로 이동
    window.location.href = './reservation.html';
}

// === 기존 평문 비밀번호 마이그레이션 ===
async function migratePlainPassword(userEmail, plainPassword) {
    try {
        console.log('비밀번호 마이그레이션 시작:', userEmail);
        
        const passwordHash = await hashPassword(plainPassword);
        
        // 데이터베이스에서 비밀번호 업데이트
        const { error } = await supabase
            .from('customer')
            .update({ password: passwordHash })
            .eq('email', userEmail);
            
        if (error) {
            console.error('비밀번호 마이그레이션 오류:', error);
            return false;
        }
        
        console.log('비밀번호 마이그레이션 완료:', userEmail);
        return true;
    } catch (error) {
        console.error('비밀번호 마이그레이션 오류:', error);
        return false;
    }
}

// === 필터 버튼 설정 ===
function setupFilterButtons() {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 모든 필터 버튼에서 active 클래스 제거
            filterBtns.forEach(b => b.classList.remove('active'));
            // 클릭된 버튼에 active 클래스 추가
            this.classList.add('active');
            
            // 필터 적용
            currentFilter = this.getAttribute('data-filter');
            applyFilter();
        });
    });
}

// === 필터 적용 ===
function applyFilter() {
    let filteredReservations = [];
    
    if (currentFilter === 'all') {
        filteredReservations = allReservations;
    } else {
        filteredReservations = allReservations.filter(reservation => 
            reservation.state.toString() === currentFilter
        );
    }
    
    displayReservations(filteredReservations);
}

// === 즐겨찾기 토글 기능 ===
function toggleFavorite(reservationId) {
    try {
        // 로컬 스토리지에서 즐겨찾기 정보 가져오기
        const favorites = JSON.parse(localStorage.getItem('reservation_favorites') || '[]');
        
        // 현재 예약의 즐겨찾기 상태 확인
        const isCurrentlyFavorite = favorites.includes(reservationId);
        const newFavorite = !isCurrentlyFavorite;
        
        if (newFavorite) {
            // 즐겨찾기 추가
            if (!favorites.includes(reservationId)) {
                favorites.push(reservationId);
            }
        } else {
            // 즐겨찾기 제거
            const index = favorites.indexOf(reservationId);
            if (index > -1) {
                favorites.splice(index, 1);
            }
        }
        
        // 로컬 스토리지에 저장
        localStorage.setItem('reservation_favorites', JSON.stringify(favorites));
        
        // 로컬 데이터 업데이트
        const reservationIndex = allReservations.findIndex(r => r.res_no === reservationId);
        if (reservationIndex !== -1) {
            allReservations[reservationIndex].is_favorite = newFavorite;
        }
        
        // UI 새로고침
        applyFilter();
        
        // 성공 메시지
        const message = newFavorite ? '즐겨찾기에 추가되었습니다.' : '즐겨찾기에서 제거되었습니다.';
        Swal.fire({
            icon: 'success',
            title: '즐겨찾기',
            text: message,
            timer: 1500,
            showConfirmButton: false,
            customClass: {
                icon: 'swal2-icon-custom'
            }
        });
        
    } catch (error) {
        console.error('즐겨찾기 토글 오류:', error);
        Swal.fire({
            icon: 'error',
            title: '오류',
            text: '즐겨찾기 설정 중 오류가 발생했습니다.',
            customClass: {
                icon: 'swal2-icon-custom'
            }
        });
    }
}

// === 비밀번호 토글 기능 ===
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.password-toggle-btn');
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
        button.setAttribute('title', '비밀번호 숨기기');
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
        button.setAttribute('title', '비밀번호 보기');
    }
}

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
let favoriteReservations = new Set(); // 즐겨찾기된 예약 ID들을 저장

// ===== 페이지 로드시 처리 =====
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    setupProfileForm();
    setupRegisterForm();
    setupMobileOptimization();
    setupPhoneFormatting();
    setupAddressSearch();
    setupFilterButtons();
    setupPasswordToggles();
    const refreshFavoritesBtn = document.getElementById('refresh-favorites');
    if (refreshFavoritesBtn) {
        refreshFavoritesBtn.addEventListener('click', function() {
            loadFavorites();
            Swal.fire({ icon: 'success', title: '즐겨찾기 새로고침 완료', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
        });
    }
    
    // 비밀번호 보안 기능 초기화
    if (typeof initializePasswordSecurity === 'function') {
        initializePasswordSecurity();
    }
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

        // 비밀번호 검증 (SHA-256 해시 사용)
        let isPasswordValid = false;
        
        try {
            if (data.password && data.password.includes(':')) {
                // SHA-256 해시로 저장된 경우
                const [salt, storedHash] = data.password.split(':');
                const encoder = new TextEncoder();
                const dataToHash = encoder.encode(password + salt);
                const hashBuffer = await crypto.subtle.digest('SHA-256', dataToHash);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                isPasswordValid = (hashHex === storedHash);
            } else {
                // 평문 또는 다른 형태로 저장된 경우 (기존 사용자 호환성)
                isPasswordValid = (data.password === password);
                
                // 평문 비밀번호인 경우 자동 마이그레이션
                if (isPasswordValid && !data.password.includes(':')) {
                    console.log('평문 비밀번호 감지, 자동 마이그레이션 시작');
                    const migrationSuccess = await migratePlainPassword(data.email, password);
                    if (migrationSuccess) {
                        console.log('비밀번호 마이그레이션 완료');
                    } else {
                        console.warn('비밀번호 마이그레이션 실패');
                    }
                }
            }
        } catch (hashError) {
            console.warn('비밀번호 검증 중 오류:', hashError);
            // 오류 발생 시 평문 비교로 폴백
            isPasswordValid = (data.password === password);
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

        // 전역 변수로 설정 (알림 시스템에서 접근)
        window.currentUser = currentUser;

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

        // 2단계: 비밀번호 해시 (SHA-256 사용)
        let passwordHash;
        
        // SHA-256 해시 함수
        async function secureHash(password, salt) {
            const encoder = new TextEncoder();
            const data = encoder.encode(password + salt);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex;
        }
        
        // 고정된 salt 사용 (보안을 위해 더 복잡한 salt 생성)
        const salt = 'icecare_' + Math.random().toString(36).substr(2, 15) + '_' + Date.now().toString(36);
        passwordHash = await secureHash(password, salt);
        passwordHash = salt + ':' + passwordHash; // salt와 해시를 함께 저장

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

// 사용자 프로필 표시 함수
function displayUserProfile(user) {
    if (!user) return;
    
    try {
        // 사용자 정보 표시
        document.getElementById('user-name').textContent = (user.name || '사용자') + '님 반갑습니다.';
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
        confirmButtonColor: '#dc3545',
        customClass: {
            icon: 'swal2-icon-question-custom'
        }
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
        if (targetTab === 'reservations') {
            loadUserReservations();
        }
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
        
        // 즐겨찾기 로드
        await loadFavorites();
        
        // 예약 데이터와 고객 정보를 함께 조회
        const { data, error } = await window.supabase
            .from('reservation')
            .select(`
                *,
                customer:user_email(
                    name
                )
            `)
            .eq('user_email', currentUser.email)
            .order('date', { ascending: false });
            
        if (error) {
            console.error('예약 내역 조회 오류:', error);
            throw error;
        }
        
        console.log('조회된 예약 내역:', data);
        
        // 고객 이름 정보를 예약 데이터에 추가
        const reservationsWithName = data.map(reservation => ({
            ...reservation,
            name: reservation.customer?.name || currentUser.name || ''
        }));
        
        // 즐겨찾기 순으로 정렬 (즐겨찾기가 위로)
        const sortedReservations = reservationsWithName.sort((a, b) => {
            const aIsFavorite = favoriteReservations.has(Number(a.res_no));
            const bIsFavorite = favoriteReservations.has(Number(b.res_no));
            
            if (aIsFavorite && !bIsFavorite) return -1;
            if (!aIsFavorite && bIsFavorite) return 1;
            
            // 즐겨찾기 상태가 같으면 날짜순 정렬
            return new Date(b.date) - new Date(a.date);
        });
        
        allReservations = sortedReservations || []; // 모든 예약 데이터 저장
        applyFilter(); // 필터 적용
        updateReservationStats(allReservations); // 전체 통계 업데이트
        
        // 디버깅: 기사배정 예약 확인
        console.log('=== 예약 데이터 디버깅 ===');
        allReservations.forEach((reservation, index) => {
            console.log(`예약 ${index + 1}:`, {
                res_no: reservation.res_no,
                state: reservation.state,
                engineer_id: reservation.engineer_id,
                isAssigned: reservation.state === 4,
                hasEngineer: !!reservation.engineer_id,
                showEngineerButton: reservation.state === 4 && !!reservation.engineer_id
            });
        });
        
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
    const newReservations = reservations.filter(r => r.state === 1).length;
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
                <span class="stat-number">${newReservations}</span>
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
    
    reservationsList.innerHTML = reservations.map(reservation => {
        const statusInfo = getStatusInfo(reservation.state);
        const canCancel = reservation.state === 1; // 신규예약 상태일 때만 취소 가능
        const hasEngineer = reservation.engineer_id; // 엔지니어 할당 여부
        const isAssigned = reservation.state === 4; // 기사배정 상태
        
        // 디버깅: 각 예약의 조건 확인
        console.log(`예약 #${reservation.res_no} 조건:`, {
            state: reservation.state,
            engineer_id: reservation.engineer_id,
            isAssigned,
            hasEngineer,
            showEngineerButton: isAssigned && hasEngineer
        });
        
        return `
            <div class="reservation-card ${favoriteReservations.has(Number(reservation.res_no)) ? 'favorite' : ''}">
                <div class="reservation-header">
                    <div class="reservation-id">
                        <span class="reservation-number">${reservation.name ? reservation.name + '님 ' : ''}예약 #${reservation.res_no}</span>
                        <i class="fas fa-star favorite-star ${favoriteReservations.has(Number(reservation.res_no)) ? 'active' : ''}" 
                           style="color: ${favoriteReservations.has(Number(reservation.res_no)) ? '#0066cc' : '#ccc'}; margin-left: 8px; font-size: 16px; cursor: pointer;" 
                           onclick="toggleFavorite('${reservation.res_no}')" 
                           title="${favoriteReservations.has(Number(reservation.res_no)) ? '즐겨찾기 해제' : '즐겨찾기 추가'}"></i>
                        <span class="reservation-status ${statusInfo.class}">${statusInfo.text}</span>
                    </div>
                    <div class="reservation-date-time">
                        <i class="fas fa-calendar-alt"></i>
                        <span>${formatDate(reservation.date)} ${reservation.time}</span>
                    </div>
                </div>
                
                <div class="reservation-content">
                    <div class="reservation-info-grid">
                        <div class="info-item">
                            <label><i class="fas fa-map-marker-alt"></i> 서비스 주소</label>
                            <span>${reservation.addr || '미입력'}</span>
                            ${reservation.addr ? `
                                <button class="map-btn" onclick="showReservationMap('${reservation.addr}', '${reservation.res_no}', '${reservation.name || ''}')" style="margin-left: 10px; background: #0066cc; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                    <i class="fas fa-map"></i> 지도보기
                                </button>
                            ` : ''}
                        </div>
                        <div class="info-item">
                            <label><i class="fas fa-cube"></i> 모델명</label>
                            <span>${reservation.model || '미입력'}</span>
                        </div>
                        <div class="info-item">
                            <label><i class="fas fa-won-sign"></i> 결제금액</label>
                            <span class="price">${reservation.price ? formatPrice(reservation.price) + '원' : '미정'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="reservation-actions">
                    ${isAssigned && hasEngineer ? `
                        <button class="engineer-info-btn" onclick="showEngineerInfo('${reservation.engineer_id}')">
                            <i class="fas fa-user-tie"></i> 기사 정보
                        </button>
                    ` : ''}
                    ${canCancel ? `
                        <button class="cancel-btn" onclick="cancelReservation('${reservation.res_no}')">
                            <i class="fas fa-times"></i> 예약 취소
                        </button>
                    ` : ''}
                    ${reservation.state === 6 ? `
                        <button class="delete-btn" onclick="deleteReservation('${reservation.res_no}')" style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; margin-left: 8px;">
                            <i class="fas fa-trash"></i> 삭제
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// 예약 상태 정보 반환
function getStatusInfo(state) {
    switch (state) {
        case 1:
            return { text: '신규예약', class: 'status-new' };
        case 2:
            return { text: '결제대기', class: 'status-payment-waiting' };
        case 3:
            return { text: '결제완료', class: 'status-payment-completed' };
        case 4:
            return { text: '기사배정', class: 'status-assigned' };
        case 5:
            return { text: '청소완료', class: 'status-completed' };
        case 6:
            return { text: '예약취소', class: 'status-cancelled' };
        default:
            return { text: '알 수 없음', class: 'status-unknown' };
    }
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

// 예약 삭제
async function deleteReservation(reservationId) {
    const result = await Swal.fire({
        title: '예약 삭제',
        text: '정말로 이 예약을 삭제하시겠습니까?\n삭제된 예약은 복구할 수 없습니다.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '삭제하기',
        cancelButtonText: '돌아가기',
        confirmButtonColor: '#dc3545',
        dangerMode: true
    });
    
    if (result.isConfirmed) {
        try {
            const { error } = await window.supabase
                .from('reservation')
                .delete()
                .eq('res_no', reservationId);
                
            if (error) throw error;
            
            Swal.fire({
                icon: 'success',
                title: '예약 삭제 완료',
                text: '예약이 성공적으로 삭제되었습니다.'
            });
            
            // 예약 내역 새로고침
            loadUserReservations();
            
        } catch (error) {
            console.error('예약 삭제 오류:', error);
            Swal.fire({
                icon: 'error',
                title: '예약 삭제 실패',
                text: '예약 삭제 중 오류가 발생했습니다.'
            });
        }
    }
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
        confirmButtonColor: '#dc3545'
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
                text: '예약이 성공적으로 취소되었습니다.'
            });
            
            // 예약 내역 새로고침
            loadUserReservations();
            
        } catch (error) {
            console.error('예약 취소 오류:', error);
            Swal.fire({
                icon: 'error',
                title: '예약 취소 실패',
                text: '예약 취소 중 오류가 발생했습니다.'
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
    document.getElementById('user-name').textContent = '사용자님 반갑습니다.';
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
        document.getElementById('user-name').textContent = currentUser.name + '님 반갑습니다.';
        document.getElementById('user-email').textContent = currentUser.email;
        document.getElementById('profile-name').value = currentUser.name;
        document.getElementById('profile-phone').value = currentUser.phone;
        document.getElementById('profile-email').value = currentUser.email;
        document.getElementById('profile-address').value = currentUser.addr;
        // img_url, state 등 필요시 추가
    }
}
function goToReservation() {
    checkLoginAndRedirect('./reservation.html');
}

// === 기존 평문 비밀번호 마이그레이션 ===
async function migratePlainPassword(userEmail, plainPassword) {
    try {
        console.log('비밀번호 마이그레이션 시작:', userEmail);
        
        // SHA-256 해시 사용
        const salt = 'icecare_' + Math.random().toString(36).substr(2, 15) + '_' + Date.now().toString(36);
        const encoder = new TextEncoder();
        const data = encoder.encode(plainPassword + salt);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        const passwordHash = salt + ':' + hashHex;
        
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
        const filterState = parseInt(currentFilter);
        filteredReservations = allReservations.filter(reservation => reservation.state === filterState);
    }
    
    displayReservations(filteredReservations);
}

function formatPrice(price) {
    if (!price || isNaN(price)) return '미정';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// === 엔지니어 정보 조회 함수 ===
async function getEngineerInfo(engineerId) {
    try {
        const { data, error } = await supabase
            .from('member')
            .select('nm, tel, file_url')
            .eq('idx', engineerId)
            .eq('auth', 2) // 기사/엔지니어 권한
            .single();

        if (error) {
            console.error('엔지니어 정보 조회 오류:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('엔지니어 정보 조회 중 오류:', error);
        return null;
    }
}

// === 엔지니어 정보 팝업 표시 ===
async function showEngineerInfo(engineerId) {
    try {
        const engineer = await getEngineerInfo(engineerId);
        
        if (!engineer) {
            Swal.fire({
                icon: 'error',
                title: '엔지니어 정보 없음',
                text: '할당된 엔지니어 정보를 찾을 수 없습니다.'
            });
            return;
        }

        // 엔지니어 정보 팝업 HTML 생성
        const engineerInfoHtml = `
            <div class="engineer-info-popup">
                <div class="engineer-photo">
                    ${engineer.file_url ? 
                        `<img src="${engineer.file_url}" alt="엔지니어 사진" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; margin-bottom: 15px;">` :
                        `<div style="width: 120px; height: 120px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; color: #666;">
                            <i class="fas fa-user" style="font-size: 3rem;"></i>
                        </div>`
                    }
                </div>
                <div class="engineer-details">
                    <h4 style="margin: 0 0 10px 0; color: #333; font-size: 1.2rem;">${engineer.nm || '이름 없음'}</h4>
                    <p style="margin: 5px 0; color: #666;">
                        <i class="fas fa-phone" style="color: #0066cc; margin-right: 8px;"></i>
                        ${engineer.tel || '연락처 없음'}
                    </p>
                </div>
            </div>
        `;

        Swal.fire({
            title: '담당 엔지니어 정보',
            html: engineerInfoHtml,
            icon: 'info',
            confirmButtonText: '확인',
            confirmButtonColor: '#0066cc',
            width: '400px'
        });

    } catch (error) {
        console.error('엔지니어 정보 표시 중 오류:', error);
        Swal.fire({
            icon: 'error',
            title: '오류',
            text: '엔지니어 정보를 불러오는 중 오류가 발생했습니다.'
        });
    }
}

// === 예약 주소 지도 표시 ===
async function showReservationMap(address, reservationId, customerName = '') {
    try {
        console.log('지도 표시 시작:', { address, reservationId, customerName });
        
        // 주소가 비어있는지 확인
        if (!address || address.trim() === '') {
            console.error('주소가 비어있습니다:', address);
            Swal.fire({
                icon: 'error',
                title: '주소 없음',
                text: '표시할 주소가 없습니다.',
                confirmButtonColor: '#0066cc'
            });
            return;
        }
        
        // 주소 파싱: 우편번호, 기본주소, 상세주소 분리
        const addressParts = address.split(' ');
        let searchAddress = '';
        let displayAddress = '';
        
        // 우편번호는 제외하고 나머지 주소 부분만 사용
        if (addressParts.length >= 2) {
            // 우편번호(첫 번째)를 제외한 나머지 주소 부분
            searchAddress = addressParts.slice(1).join(' ');
            displayAddress = addressParts.slice(1).join(' ');
        } else {
            searchAddress = address;
            displayAddress = address;
        }
        
        console.log('파싱된 주소:', { searchAddress, displayAddress });
        
        const mapId = `swal-map-${reservationId}`;
        const titleText = customerName ? `${customerName}님 서비스 주소` : `예약 #${reservationId} 서비스 주소`;
        
        Swal.fire({
            title: titleText,
            html: `<div id="${mapId}" style="width:400px;height:300px;border-radius:8px;"></div>`,
            width: '450px',
            showConfirmButton: true,
            confirmButtonText: '닫기',
            confirmButtonColor: '#0066cc',
            didOpen: () => {
                console.log('SweetAlert 열림, 지도 초기화 시작');
                const geocoder = new kakao.maps.services.Geocoder();
                
                // 단계별 주소 검색 함수
                const searchAddressStep = (searchText, step = 1) => {
                    console.log(`주소 검색 시도 ${step}:`, searchText);
                    
                    geocoder.addressSearch(searchText, function(result, status) {
                        console.log(`주소 검색 결과 ${step}:`, { result, status });
                        
                        if (status === kakao.maps.services.Status.OK) {
                            const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
                            const map = new kakao.maps.Map(document.getElementById(mapId), {
                                center: coords,
                                level: 3
                            });
                            const marker = new kakao.maps.Marker({ position: coords });
                            marker.setMap(map);
                            const infowindow = new kakao.maps.InfoWindow({
                                content: `<div style=\"padding:10px;min-width:200px;\"><h4 style=\"margin:0 0 5px 0;color:#333;font-size:14px;\">${customerName ? customerName + '님' : '예약 #' + reservationId}</h4><p style=\"margin:0;color:#666;font-size:12px;line-height:1.4;\">${displayAddress}</p></div>`
                            });
                            kakao.maps.event.addListener(marker, 'mouseover', function() {
                                infowindow.open(map, marker);
                            });
                            kakao.maps.event.addListener(marker, 'mouseout', function() {
                                infowindow.close();
                            });
                            console.log('지도 표시 완료');
                        } else {
                            // 다음 단계로 진행
                            if (step === 1) {
                                // 1단계 실패: 원본 주소로 재시도
                                searchAddressStep(address, 2);
                            } else if (step === 2) {
                                // 2단계 실패: 주소의 첫 번째 부분만 사용
                                const firstPart = searchAddress.split(' ')[0];
                                if (firstPart && firstPart !== searchAddress) {
                                    searchAddressStep(firstPart, 3);
                                } else {
                                    // 3단계 실패: 서울 시청으로 기본 표시
                                    showDefaultMap();
                                }
                            } else {
                                // 모든 단계 실패: 서울 시청으로 기본 표시
                                showDefaultMap();
                            }
                        }
                    });
                };
                
                // 기본 지도 표시 함수 (서울 시청)
                const showDefaultMap = () => {
                    console.log('기본 지도 표시 (서울 시청)');
                    const coords = new kakao.maps.LatLng(37.5665, 126.9780);
                    const map = new kakao.maps.Map(document.getElementById(mapId), {
                        center: coords,
                        level: 3
                    });
                    const marker = new kakao.maps.Marker({ position: coords });
                    marker.setMap(map);
                    const infowindow = new kakao.maps.InfoWindow({
                        content: `<div style=\"padding:10px;min-width:200px;\"><h4 style=\"margin:0 0 5px 0;color:#333;font-size:14px;\">${customerName ? customerName + '님' : '예약 #' + reservationId}</h4><p style=\"margin:0;color:#666;font-size:12px;line-height:1.4;\">주소를 찾을 수 없어 서울 시청으로 표시합니다.<br>원본 주소: ${address}</p></div>`
                    });
                    kakao.maps.event.addListener(marker, 'mouseover', function() {
                        infowindow.open(map, marker);
                    });
                    kakao.maps.event.addListener(marker, 'mouseout', function() {
                        infowindow.close();
                    });
                };
                
                // 1단계: 파싱된 주소로 검색 시작
                searchAddressStep(searchAddress, 1);
            }
        });
    } catch (error) {
        console.error('지도 표시 오류:', error);
        Swal.fire({
            icon: 'error',
            title: '지도 표시 실패',
            text: '지도를 불러오는 중 오류가 발생했습니다.',
            confirmButtonColor: '#0066cc'
        });
    }
}

// === 즐겨찾기 기능 ===

// 즐겨찾기 로드
async function loadFavorites() {
    if (!currentUser) return;
    try {
        const { data, error } = await window.supabase
            .from('favorite_reservations')
            .select('reservation_id')
            .eq('user_email', currentUser.email);
        if (error) throw error;
        favoriteReservations.clear();
        if (data) {
            data.forEach(fav => favoriteReservations.add(Number(fav.reservation_id)));
        }
    } catch (error) {
        console.error('즐겨찾기 로드 오류:', error);
    }
}

// 즐겨찾기 토글
async function toggleFavorite(reservationId) {
    if (!currentUser) return;
    const numericReservationId = Number(reservationId);
    try {
        if (favoriteReservations.has(numericReservationId)) {
            // 즐겨찾기 제거
            const { error } = await window.supabase
                .from('favorite_reservations')
                .delete()
                .eq('user_email', currentUser.email)
                .eq('reservation_id', numericReservationId);
            if (error) throw error;
            favoriteReservations.delete(numericReservationId);
        } else {
            // 즐겨찾기 추가
            const { error } = await window.supabase
                .from('favorite_reservations')
                .insert({
                    user_email: currentUser.email,
                    reservation_id: numericReservationId
                });
            if (error) {
                if (error.code === '23505' || error.message?.includes('unique')) {
                    Swal.fire({
                        icon: 'info',
                        title: '이미 즐겨찾기됨',
                        text: '이미 즐겨찾기된 예약입니다.',
                        confirmButtonColor: '#0066cc'
                    });
                    return;
                }
                throw error;
            }
            favoriteReservations.add(numericReservationId);
        }
        loadUserReservations();
    } catch (error) {
        console.error('즐겨찾기 토글 오류:', error);
        Swal.fire({
            icon: 'error',
            title: '즐겨찾기 오류',
            text: '즐겨찾기 처리 중 오류가 발생했습니다.'
        });
    }
}

// 취소된 예약 삭제
async function deleteCancelledReservation(reservationId) {
    const result = await Swal.fire({
        title: '예약 삭제',
        text: '정말로 이 취소된 예약을 삭제하시겠습니까?\n삭제된 예약은 복구할 수 없습니다.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '삭제하기',
        cancelButtonText: '취소',
        confirmButtonColor: '#dc3545',
        customClass: {
            icon: 'swal2-icon-custom'
        }
    });
    
    if (result.isConfirmed) {
        try {
            // 먼저 즐겨찾기에서 제거
            await window.supabase
                .from('favorite_reservations')
                .delete()
                .eq('user_email', currentUser.email)
                .eq('reservation_id', reservationId);
            
            // 예약 삭제
            const { error } = await window.supabase
                .from('reservation')
                .delete()
                .eq('res_no', reservationId);
                
            if (error) throw error;
            
            Swal.fire({
                icon: 'success',
                title: '예약 삭제 완료',
                text: '취소된 예약이 성공적으로 삭제되었습니다.',
                confirmButtonColor: '#0066CC'
            });
            
            // 예약 내역 새로고침
            loadUserReservations();
            
        } catch (error) {
            console.error('예약 삭제 오류:', error);
            Swal.fire({
                icon: 'error',
                title: '예약 삭제 실패',
                text: '예약 삭제 중 오류가 발생했습니다.'
            });
        }
    }
}

// 비밀번호 토글 기능 설정
function setupPasswordToggles() {
    const toggleButtons = document.querySelectorAll('.password-toggle-btn');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
                this.classList.add('show-password');
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
                this.classList.remove('show-password');
            }
        });
    });
}

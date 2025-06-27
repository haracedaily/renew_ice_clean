// === 공통 함수들 ===

// 로그인 상태 확인 및 리다이렉트 함수
function checkLoginAndRedirect(targetUrl) {
    console.log('checkLoginAndRedirect 호출됨:', targetUrl);
    
    try {
        // 여러 로그인 키 확인
        const mypageUser = JSON.parse(localStorage.getItem('mypageUser') || 'null');
        const userInfo = localStorage.getItem('userInfo');
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        
        console.log('로그인 상태 확인:', { mypageUser, userInfo, isLoggedIn });
        
        // 로그인 상태 확인 (여러 키 중 하나라도 있으면 로그인된 것으로 판단)
        const isUserLoggedIn = (mypageUser && mypageUser.email) || 
                              (userInfo && isLoggedIn === 'true');
        
        if (!isUserLoggedIn) {
            console.log('로그인되지 않은 상태 - 팝업 표시');
            
            // SweetAlert 사용 가능 여부 확인
            if (typeof Swal === 'undefined') {
                console.error('SweetAlert가 로드되지 않음');
                alert('예약을 하려면 먼저 로그인해주세요.');
                window.location.href = './mypage.html';
                return;
            }
            
            // 로그인되지 않은 경우
            Swal.fire({
                icon: 'warning',
                title: '로그인 필요',
                text: '예약을 하려면 먼저 로그인해주세요.',
                confirmButtonText: '로그인하기',
                cancelButtonText: '취소',
                confirmButtonColor: '#0066cc',
                showCancelButton: true
            }).then((result) => {
                console.log('팝업 결과:', result);
                if (result.isConfirmed) {
                    window.location.href = './mypage.html';
                }
            }).catch((error) => {
                console.error('SweetAlert 오류:', error);
                alert('예약을 하려면 먼저 로그인해주세요.');
                window.location.href = './mypage.html';
            });
            return;
        }
        
        console.log('로그인된 상태 - 예약 페이지로 이동');
        window.location.href = targetUrl;
        
    } catch (error) {
        console.error('checkLoginAndRedirect 오류:', error);
        const shouldLogin = confirm('예약을 하려면 먼저 로그인해주세요.\n\n로그인하시겠습니까?');
        if (shouldLogin) {
            window.location.href = './mypage.html';
        }
    }
}

// 팝업 열기 함수 (팝업 차단 감지 포함)
function openPopup(url, name, features) {
    try {
        const popup = window.open(url, name, features);
        
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
            // 팝업이 차단된 경우
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'warning',
                    title: '팝업 차단됨',
                    text: '팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.',
                    confirmButtonText: '확인'
                });
            } else {
                alert('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.');
            }
            return null;
        }
        
        return popup;
    } catch (error) {
        console.error('팝업 열기 오류:', error);
        return null;
    }
}

// 로그인 상태 확인 함수
function isLoggedIn() {
    try {
        const mypageUser = JSON.parse(localStorage.getItem('mypageUser') || 'null');
        const userInfo = localStorage.getItem('userInfo');
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        
        return (mypageUser && mypageUser.email) || (userInfo && isLoggedIn === 'true');
    } catch (error) {
        console.error('로그인 상태 확인 오류:', error);
        return false;
    }
}

// 현재 사용자 정보 가져오기
function getCurrentUser() {
    try {
        const mypageUser = JSON.parse(localStorage.getItem('mypageUser') || 'null');
        if (mypageUser && mypageUser.email) {
            return mypageUser;
        }
        
        const userInfo = localStorage.getItem('userInfo');
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        
        if (userInfo && isLoggedIn === 'true') {
            return JSON.parse(userInfo);
        }
        
        return null;
    } catch (error) {
        console.error('사용자 정보 가져오기 오류:', error);
        return null;
    }
} 
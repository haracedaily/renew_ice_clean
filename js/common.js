// === 공통 함수들 ===

// 로그인 상태 확인 및 리다이렉트 함수
async function checkLoginAndRedirect(targetUrl) {
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
            
            // 로그인되지 않은 경우
            const shouldLogin = await showPopup({ message: '예약을 하려면 먼저 로그인해주세요.\n\n로그인하시겠습니까?', type: 'confirm' });
            if (shouldLogin) {
                window.location.href = './mypage.html';
            }
            return;
        }
        
        console.log('로그인된 상태 - 예약 페이지로 이동');
        window.location.href = targetUrl;
        
    } catch (error) {
        console.error('checkLoginAndRedirect 오류:', error);
        const shouldLogin = await showPopup({ message: '예약을 하려면 먼저 로그인해주세요.\n\n로그인하시겠습니까?', type: 'confirm' });
        if (shouldLogin) {
            window.location.href = './mypage.html';
        }
    }
}

// 팝업 열기 함수 (팝업 차단 감지 포함)
async function openPopup(url, name, features) {
    try {
        const popup = window.open(url, name, features);
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
            await showPopup({ message: '팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.' });
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

// === 통일된 커스텀 팝업 ===
(function() {
    if (window.showPopup) return; // 중복 방지
    const style = document.createElement('style');
    style.textContent = `
    .unipopup-backdrop {
        position: fixed; left: 0; top: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.35); z-index: 9999; display: flex; align-items: center; justify-content: center;
    }
    .unipopup-modal {
        background: #fff; border-radius: 10px; min-width: 300px; max-width: 90vw; box-shadow: 0 4px 24px rgba(0,0,0,0.18);
        padding: 24px 20px 16px 20px; text-align: center; position: relative;
        animation: unipopup-fadein 0.2s;
    }
    .unipopup-title { font-size: 1.15rem; font-weight: bold; margin-bottom: 10px; color: #222; }
    .unipopup-message { font-size: 1rem; color: #444; margin-bottom: 18px; white-space: pre-line; }
    .unipopup-btns { display: flex; gap: 10px; justify-content: center; }
    .unipopup-btn { min-width: 70px; padding: 7px 0; border: none; border-radius: 5px; font-size: 1rem; cursor: pointer; background: #eee; color: #222; transition: background 0.15s; }
    .unipopup-btn-primary { background: #3b82f6; color: #fff; }
    .unipopup-btn-danger { background: #ef4444; color: #fff; }
    .unipopup-btn:hover { filter: brightness(0.95); }
    @keyframes unipopup-fadein { from { opacity: 0; transform: translateY(30px);} to { opacity: 1; transform: none; } }
    `;
    document.head.appendChild(style);

    window.showPopup = function({ title = '', message = '', type = 'alert', buttons } = {}) {
        return new Promise(resolve => {
            const backdrop = document.createElement('div');
            backdrop.className = 'unipopup-backdrop';
            const modal = document.createElement('div');
            modal.className = 'unipopup-modal';
            if (title) {
                const titleEl = document.createElement('div');
                titleEl.className = 'unipopup-title';
                titleEl.textContent = title;
                modal.appendChild(titleEl);
            }
            if (message) {
                const msgEl = document.createElement('div');
                msgEl.className = 'unipopup-message';
                msgEl.innerHTML = message;
                modal.appendChild(msgEl);
            }
            const btnsDiv = document.createElement('div');
            btnsDiv.className = 'unipopup-btns';
            // 버튼 구성
            let btnList = [];
            if (buttons && Array.isArray(buttons)) {
                btnList = buttons;
            } else if (type === 'confirm') {
                btnList = [
                    { text: '확인', value: true, class: 'unipopup-btn unipopup-btn-primary' },
                    { text: '취소', value: false, class: 'unipopup-btn' }
                ];
            } else {
                btnList = [ { text: '확인', value: true, class: 'unipopup-btn unipopup-btn-primary' } ];
            }
            btnList.forEach(btn => {
                const b = document.createElement('button');
                b.textContent = btn.text;
                b.className = btn.class || 'unipopup-btn';
                b.onclick = () => {
                    document.body.removeChild(backdrop);
                    resolve(btn.value);
                };
                btnsDiv.appendChild(b);
            });
            modal.appendChild(btnsDiv);
            backdrop.appendChild(modal);
            backdrop.onclick = e => { if (e.target === backdrop && type !== 'alert') { document.body.removeChild(backdrop); resolve(false); } };
            document.body.appendChild(backdrop);
        });
    };
})(); 
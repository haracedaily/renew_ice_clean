(async function() {
    const supabaseUrl = 'https://wqetnltlnsvjidubewia.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxZXRubHRsbnN2amlkdWJld2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NzI5NDksImV4cCI6MjA1ODM0ODk0OX0.-Jw0jqyq93rA7t194Kq4_umPoTci8Eqx9j-oCwoZc6k';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    async function getActivePopups() {
        const now = new Date().toISOString();
        console.log('팝업 조회 시작:', now);
        
        const { data, error } = await supabase
            .from('popups')
            .select('*')
            .eq('display_status', 'show')
            .lte('start_date', now)
            .gte('end_date', now)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('활성 팝업 조회 에러:', error.message, error);
            return [];
        }
        
        console.log('조회된 팝업:', data);
        return data || [];
    }

    // 팝업 1개만 띄우고, 클릭 시 link_url(없으면 reservation.html)로 이동
    const popups = await getActivePopups();
    console.log('활성 팝업 개수:', popups.length);
    
    if (popups.length > 0) {
        const popup = popups[0];
        console.log('표시할 팝업:', popup);
        
        // 24시간 동안 열지 않기 체크
        const popupKey = `custom_popup_${popup.id}_hidden`;
        const hiddenUntil = localStorage.getItem(popupKey);
        if (hiddenUntil && new Date().getTime() < parseInt(hiddenUntil)) {
            console.log('24시간 동안 열지 않기 설정됨:', popupKey);
            return; // 24시간 동안 열지 않기 설정된 경우 팝업 표시하지 않음
        }
        
        const div = document.createElement('div');
        div.id = 'custom-popup';
        div.style.position = 'fixed';
        // 관리자에서 설정한 위치값 사용 (없으면 기본값)
        if (popup.position_x && popup.position_y) {
            div.style.left = popup.position_x;
            div.style.top = popup.position_y;
            div.style.right = '';
        } else {
            div.style.top = '40px';
            div.style.right = '40px';
        }
        div.style.width = popup.width || '400px';
        div.style.height = popup.height || 'auto';
        div.style.background = 'white';
        div.style.zIndex = 9999;
        div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        div.style.borderRadius = '12px';
        div.style.overflow = 'hidden';
        div.style.cursor = 'pointer';
        div.innerHTML = `
            <div id="popup-close-btn" style="position:absolute;top:5px;right:5px;width:18px;height:18px;background:rgba(255,255,255,0.8);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;color:#333;z-index:10000;">×</div>
            <img src="${popup.image_url}" style="width:100%;display:block;">
            <div style="padding: 15px; background: #f8f9fa; border-top: 1px solid #e9ecef;">
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="dont-show-24h-btn" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500; transition: background-color 0.2s;">24시간 동안 열지 않기</button>
                    <button id="close-popup-btn" style="background: #0066CC; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500; transition: background-color 0.2s;">닫기</button>
                </div>
            </div>
        `;
        
        // 팝업 클릭 시 링크 이동
        div.onclick = function(e) {
            // 버튼 클릭은 링크 이동하지 않음
            if (e.target.closest('button')) {
                return;
            }
            window.location.href = popup.link_url || 'reservation.html';
        };
        
        // 24시간 동안 열지 않기 버튼
        div.querySelector('#dont-show-24h-btn').onclick = function(e) {
            e.stopPropagation();
            const hideUntil = new Date().getTime() + (24 * 60 * 60 * 1000); // 24시간
            localStorage.setItem(popupKey, hideUntil.toString());
            console.log('24시간 동안 열지 않기 설정:', popupKey, hideUntil);
            div.remove();
        };
        
        // 닫기 버튼
        div.querySelector('#close-popup-btn').onclick = function(e) {
            e.stopPropagation();
            div.remove();
        };
        
        // 우상단 닫기 버튼
        div.querySelector('#popup-close-btn').onclick = function(e) {
            e.stopPropagation();
            div.remove();
        };
        
        // 버튼 호버 효과
        const dontShowBtn = div.querySelector('#dont-show-24h-btn');
        const closeBtn = div.querySelector('#close-popup-btn');
        
        dontShowBtn.onmouseover = () => dontShowBtn.style.backgroundColor = '#5a6268';
        dontShowBtn.onmouseout = () => dontShowBtn.style.backgroundColor = '#6c757d';
        
        closeBtn.onmouseover = () => closeBtn.style.backgroundColor = '#0052a3';
        closeBtn.onmouseout = () => closeBtn.style.backgroundColor = '#0066CC';
        
        document.body.appendChild(div);
        console.log('팝업이 DOM에 추가됨');
    } else {
        console.log('활성 팝업이 없어서 테스트 팝업을 생성합니다.');
        
        // 테스트용 팝업 생성 (항상 표시)
        const div = document.createElement('div');
        div.id = 'custom-popup';
        div.style.position = 'fixed';
        div.style.top = '40px';
        div.style.right = '40px';
        div.style.width = '400px';
        div.style.height = 'auto';
        div.style.background = 'white';
        div.style.zIndex = 9999;
        div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        div.style.borderRadius = '12px';
        div.style.overflow = 'hidden';
        div.style.cursor = 'pointer';
        div.innerHTML = `
            <div id="popup-close-btn" style="position:absolute;top:5px;right:5px;width:18px;height:18px;background:rgba(255,255,255,0.8);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;color:#333;z-index:10000;">×</div>
            <div style="padding: 20px; text-align: center; background: #f0f8ff;">
                <h3 style="margin: 0 0 10px 0; color: #0066CC;">테스트 팝업</h3>
                <p style="margin: 0 0 15px 0; color: #666;">이것은 테스트용 팝업입니다.</p>
                <p style="margin: 0; font-size: 12px; color: #999;">24시간 동안 열지 않기와 닫기 버튼이 표시됩니다.</p>
            </div>
            <div style="padding: 15px; background: #f8f9fa; border-top: 1px solid #e9ecef;">
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="dont-show-24h-btn" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500; transition: background-color 0.2s;">24시간 동안 열지 않기</button>
                    <button id="close-popup-btn" style="background: #0066CC; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500; transition: background-color 0.2s;">닫기</button>
                </div>
            </div>
        `;
        
        // 24시간 동안 열지 않기 버튼
        div.querySelector('#dont-show-24h-btn').onclick = function(e) {
            e.stopPropagation();
            const popupKey = 'custom_popup_test_hidden';
            const hideUntil = new Date().getTime() + (24 * 60 * 60 * 1000); // 24시간
            localStorage.setItem(popupKey, hideUntil.toString());
            console.log('테스트 팝업 24시간 동안 열지 않기 설정:', popupKey, hideUntil);
            console.log('localStorage에 저장된 값:', localStorage.getItem(popupKey));
            div.remove();
            alert('24시간 동안 팝업이 표시되지 않습니다.');
        };
        
        // 닫기 버튼
        div.querySelector('#close-popup-btn').onclick = function(e) {
            e.stopPropagation();
            div.remove();
            console.log('팝업이 닫혔습니다.');
        };
        
        // 우상단 닫기 버튼
        div.querySelector('#popup-close-btn').onclick = function(e) {
            e.stopPropagation();
            div.remove();
            console.log('팝업이 닫혔습니다.');
        };
        
        // 버튼 호버 효과
        const dontShowBtn = div.querySelector('#dont-show-24h-btn');
        const closeBtn = div.querySelector('#close-popup-btn');
        
        dontShowBtn.onmouseover = () => dontShowBtn.style.backgroundColor = '#5a6268';
        dontShowBtn.onmouseout = () => dontShowBtn.style.backgroundColor = '#6c757d';
        
        closeBtn.onmouseover = () => closeBtn.style.backgroundColor = '#0052a3';
        closeBtn.onmouseout = () => closeBtn.style.backgroundColor = '#0066CC';
        
        document.body.appendChild(div);
        console.log('테스트 팝업이 DOM에 추가됨');
        console.log('24시간 열지 않기 버튼이 표시됩니다.');
    }
})(); 
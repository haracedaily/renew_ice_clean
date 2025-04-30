(async function() {
    // 전역 supabase 클라이언트 사용
    if (!window.supabase) {
        console.error('Supabase client is not initialized');
        return;
    }

    async function getActivePopups() {
        const now = new Date().toISOString();
        const { data, error } = await window.supabase
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
        return data || [];
    }

    // 팝업 1개만 띄우고, 클릭 시 link_url(없으면 reservation.html)로 이동
    const popups = await getActivePopups();
    if (popups.length > 0) {
        const popup = popups[0];
        const div = document.createElement('div');
        div.id = 'custom-popup';
        div.style.position = 'fixed';
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.backgroundColor = 'white';
        div.style.padding = '10px';
        div.style.borderRadius = '12px';
        div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        div.style.zIndex = '9999';
        div.style.cursor = 'pointer';
        div.style.transition = 'all 0.3s ease';
        
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
        div.style.maxWidth = '90vw';
        div.style.maxHeight = '90vh';
        
        div.innerHTML = `
            <div id="popup-close-btn" style="position:absolute;top:5px;right:5px;width:24px;height:24px;background:rgba(0,0,0,0.1);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#333;z-index:10000;transition:all 0.2s ease;">×</div>
            <img src="${popup.image_url}" style="width:100%;height:auto;display:block;border-radius:8px;">
        `;

        // 닫기 버튼 호버 효과
        const closeBtn = div.querySelector('#popup-close-btn');
        closeBtn.onmouseover = function() {
            this.style.background = 'rgba(0,0,0,0.2)';
        };
        closeBtn.onmouseout = function() {
            this.style.background = 'rgba(0,0,0,0.1)';
        };

        div.onclick = function(e) {
            if (e.target === closeBtn) return;
            window.location.href = popup.link_url || 'reservation.html';
        };

        // 닫기 버튼만 클릭 시 팝업 닫기(링크 이동 X)
        closeBtn.onclick = function(e) {
            e.stopPropagation();
            div.style.opacity = '0';
            setTimeout(() => div.remove(), 300);
        };

        document.body.appendChild(div);
        
        // 팝업 애니메이션
        setTimeout(() => {
            div.style.opacity = '1';
        }, 100);
    }
})();
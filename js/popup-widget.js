(async function() {
    const supabaseUrl = 'https://wqetnltlnsvjidubewia.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxZXRubHRsbnN2amlkdWJld2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NzI5NDksImV4cCI6MjA1ODM0ODk0OX0.-Jw0jqyq93rA7t194Kq4_umPoTci8Eqx9j-oCwoZc6k';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    async function getActivePopups() {
        const now = new Date().toISOString();
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
        return data || [];
    }

    // 팝업 1개만 띄우고, 클릭 시 link_url(없으면 reservation.html)로 이동
    const popups = await getActivePopups();
    if (popups.length > 0) {
        const popup = popups[0];
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
        `;
        div.onclick = function() {
            window.location.href = popup.link_url || 'reservation.html';
        };
        // 닫기 버튼만 클릭 시 팝업 닫기(링크 이동 X)
        div.querySelector('#popup-close-btn').onclick = function(e) {
            e.stopPropagation();
            div.remove();
        };
        document.body.appendChild(div);
    }
})();
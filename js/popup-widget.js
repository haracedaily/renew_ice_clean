(async function() {
    // 1. Supabase에서 팝업 데이터 가져오기
    const res = await fetch('https://haracedaily.github.io/renew_ice_clean');
    const popups = await res.json();

    // 2. 활성화된 팝업이 있으면 DOM에 추가
    if (popups.length > 0) {
        const popup = popups[0]; // 예시: 첫 번째 팝업만
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = popup.position_y || '50%';
        div.style.left = popup.position_x || '50%';
        div.style.width = popup.width || '400px';
        div.style.height = popup.height || 'auto';
        div.style.background = 'white';
        div.style.zIndex = 9999;
        div.style.transform = 'translate(-50%, -50%)';
        div.innerHTML = `
      <img src="${popup.image_url}" style="width:100%">
      <button onclick="this.parentNode.remove()">닫기</button>
    `;
        document.body.appendChild(div);
    }
})();
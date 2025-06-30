// SweetAlert2 스타일의 커스텀 팝업
window.customPopup = {
  fire({ title = '', text = '', icon = '', showCancelButton = false, confirmButtonText = '확인', cancelButtonText = '취소', confirmButtonColor = '#0066CC', cancelButtonColor = '#aaa', customClass = {}, html = '' } = {}) {
    return new Promise((resolve) => {
      // 기존 팝업 제거
      const old = document.getElementById('custom-popup-modal');
      if (old) old.remove();
      const backdrop = document.createElement('div');
      backdrop.id = 'custom-popup-modal';
      backdrop.style.position = 'fixed';
      backdrop.style.left = '0';
      backdrop.style.top = '0';
      backdrop.style.width = '100vw';
      backdrop.style.height = '100vh';
      backdrop.style.background = 'rgba(0,0,0,0.35)';
      backdrop.style.zIndex = '99999';
      backdrop.style.display = 'flex';
      backdrop.style.alignItems = 'center';
      backdrop.style.justifyContent = 'center';
      // 팝업 박스
      const modal = document.createElement('div');
      modal.style.background = '#fff';
      modal.style.borderRadius = '12px';
      modal.style.minWidth = '320px';
      modal.style.maxWidth = '90vw';
      modal.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
      modal.style.padding = '32px 24px 20px 24px';
      modal.style.textAlign = 'center';
      modal.style.position = 'relative';
      // 아이콘
      if (icon) {
        const iconDiv = document.createElement('div');
        iconDiv.style.fontSize = '2.5rem';
        iconDiv.style.marginBottom = '10px';
        if (icon === 'success') iconDiv.innerHTML = '✅';
        else if (icon === 'error') iconDiv.innerHTML = '❌';
        else if (icon === 'warning') iconDiv.innerHTML = '⚠️';
        else if (icon === 'info') iconDiv.innerHTML = 'ℹ️';
        else iconDiv.innerHTML = icon;
        modal.appendChild(iconDiv);
      }
      // 타이틀
      if (title) {
        const titleEl = document.createElement('div');
        titleEl.style.fontSize = '1.25rem';
        titleEl.style.fontWeight = 'bold';
        titleEl.style.marginBottom = '10px';
        titleEl.textContent = title;
        modal.appendChild(titleEl);
      }
      // 텍스트 or html
      if (html) {
        const htmlEl = document.createElement('div');
        htmlEl.innerHTML = html;
        htmlEl.style.marginBottom = '18px';
        modal.appendChild(htmlEl);
      } else if (text) {
        const textEl = document.createElement('div');
        textEl.textContent = text;
        textEl.style.marginBottom = '18px';
        modal.appendChild(textEl);
      }
      // 버튼 영역
      const btnsDiv = document.createElement('div');
      btnsDiv.style.display = 'flex';
      btnsDiv.style.gap = '10px';
      btnsDiv.style.justifyContent = 'center';
      // 확인 버튼
      const okBtn = document.createElement('button');
      okBtn.textContent = confirmButtonText;
      okBtn.style.background = confirmButtonColor;
      okBtn.style.color = '#fff';
      okBtn.style.border = 'none';
      okBtn.style.borderRadius = '5px';
      okBtn.style.padding = '10px 24px';
      okBtn.style.fontSize = '1rem';
      okBtn.style.cursor = 'pointer';
      okBtn.onclick = () => {
        document.body.removeChild(backdrop);
        resolve({ isConfirmed: true });
      };
      btnsDiv.appendChild(okBtn);
      // 취소 버튼
      if (showCancelButton) {
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = cancelButtonText;
        cancelBtn.style.background = cancelButtonColor;
        cancelBtn.style.color = '#fff';
        cancelBtn.style.border = 'none';
        cancelBtn.style.borderRadius = '5px';
        cancelBtn.style.padding = '10px 24px';
        cancelBtn.style.fontSize = '1rem';
        cancelBtn.style.cursor = 'pointer';
        cancelBtn.onclick = () => {
          document.body.removeChild(backdrop);
          resolve({ isConfirmed: false });
        };
        btnsDiv.appendChild(cancelBtn);
      }
      modal.appendChild(btnsDiv);
      backdrop.appendChild(modal);
      document.body.appendChild(backdrop);
      // ESC로 닫기
      document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
          if (document.body.contains(backdrop)) {
            document.body.removeChild(backdrop);
            resolve({ isConfirmed: false });
          }
          document.removeEventListener('keydown', escHandler);
        }
      });
    });
  }
};

// 패스워드 보안 강화 유틸리티 함수들

// 1. 패스워드 복잡도 검증
function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const errors = [];
    
    if (password.length < minLength) {
        errors.push(`패스워드는 최소 ${minLength}자 이상이어야 합니다.`);
    }
    if (!hasUpperCase) {
        errors.push('대문자를 포함해야 합니다.');
    }
    if (!hasLowerCase) {
        errors.push('소문자를 포함해야 합니다.');
    }
    if (!hasNumbers) {
        errors.push('숫자를 포함해야 합니다.');
    }
    if (!hasSpecialChar) {
        errors.push('특수문자를 포함해야 합니다.');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors,
        score: calculatePasswordScore(password)
    };
}

// 2. 패스워드 강도 점수 계산
function calculatePasswordScore(password) {
    let score = 0;
    
    // 길이 점수
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    
    // 문자 종류 점수
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    
    // 복잡성 점수
    if (/(?=.*[a-z])(?=.*[A-Z])/.test(password)) score += 1;
    if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) score += 1;
    if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) score += 1;
    
    return Math.min(score, 10); // 최대 10점
}

// 3. 패스워드 강도 표시
function getPasswordStrengthText(score) {
    if (score <= 2) return { text: '매우 약함', color: '#dc3545', class: 'very-weak' };
    if (score <= 4) return { text: '약함', color: '#fd7e14', class: 'weak' };
    if (score <= 6) return { text: '보통', color: '#ffc107', class: 'medium' };
    if (score <= 8) return { text: '강함', color: '#28a745', class: 'strong' };
    return { text: '매우 강함', color: '#20c997', class: 'very-strong' };
}

// 4. 패스워드 입력 필드 실시간 검증
function setupPasswordValidation(passwordInputId, confirmInputId = null, strengthIndicatorId = null) {
    const passwordInput = document.getElementById(passwordInputId);
    const confirmInput = confirmInputId ? document.getElementById(confirmInputId) : null;
    const strengthIndicator = strengthIndicatorId ? document.getElementById(strengthIndicatorId) : null;
    
    if (!passwordInput) return;
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const validation = validatePassword(password);
        const strength = getPasswordStrengthText(validation.score);
        
        // 입력 필드 스타일 업데이트
        this.classList.remove('password-valid', 'password-error');
        if (password.length > 0) {
            if (validation.isValid) {
                this.classList.add('password-valid');
            } else {
                this.classList.add('password-error');
            }
        }
        
        // 강도 표시기 업데이트
        if (strengthIndicator) {
            strengthIndicator.innerHTML = `
                <div class="password-strength">
                    <div class="strength-bar">
                        <div class="strength-fill ${strength.class}" style="width: ${validation.score * 10}%; background-color: ${strength.color};"></div>
                    </div>
                    <span class="strength-text" style="color: ${strength.color};">${strength.text}</span>
                </div>
            `;
        }
        
        // 확인 패스워드 검증
        if (confirmInput && confirmInput.value) {
            validatePasswordConfirm(password, confirmInput.value);
        }
    });
    
    // 확인 패스워드 검증
    if (confirmInput) {
        confirmInput.addEventListener('input', function() {
            if (passwordInput.value) {
                validatePasswordConfirm(passwordInput.value, this.value);
            }
        });
    }
}

// 5. 패스워드 확인 검증
function validatePasswordConfirm(password, confirmPassword) {
    const confirmInput = document.getElementById('register-password-confirm');
    if (!confirmInput) return;
    
    confirmInput.classList.remove('password-valid', 'password-error');
    
    if (confirmPassword.length === 0) return;
    
    if (password === confirmPassword) {
        confirmInput.classList.add('password-valid');
    } else {
        confirmInput.classList.add('password-error');
    }
}

// 6. 패스워드 표시/숨김 토글
function setupPasswordToggle(passwordInputId, toggleButtonId) {
    const passwordInput = document.getElementById(passwordInputId);
    const toggleButton = document.getElementById(toggleButtonId);
    
    if (!passwordInput || !toggleButton) return;
    
    toggleButton.addEventListener('click', function() {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        
        // 아이콘 변경
        this.innerHTML = type === 'password' ? '👁️' : '🙈';
        this.title = type === 'password' ? '패스워드 표시' : '패스워드 숨김';
    });
}

// 7. 안전한 패스워드 생성
function generateSecurePassword(length = 12) {
    const charset = {
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        numbers: '0123456789',
        symbols: '!@#$%^&*(),.?":{}|<>'
    };
    
    let password = '';
    
    // 각 카테고리에서 최소 1개씩 선택
    password += charset.lowercase[Math.floor(Math.random() * charset.lowercase.length)];
    password += charset.uppercase[Math.floor(Math.random() * charset.uppercase.length)];
    password += charset.numbers[Math.floor(Math.random() * charset.numbers.length)];
    password += charset.symbols[Math.floor(Math.random() * charset.symbols.length)];
    
    // 나머지 길이만큼 랜덤 선택
    const allChars = charset.lowercase + charset.uppercase + charset.numbers + charset.symbols;
    for (let i = 4; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // 패스워드 순서 섞기
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

// 8. 패스워드 생성 버튼 설정
function setupPasswordGenerator(passwordInputId, generateButtonId) {
    const passwordInput = document.getElementById(passwordInputId);
    const generateButton = document.getElementById(generateButtonId);
    
    if (!passwordInput || !generateButton) return;
    
    generateButton.addEventListener('click', function() {
        const newPassword = generateSecurePassword(12);
        passwordInput.value = newPassword;
        passwordInput.type = 'text'; // 생성된 패스워드 표시
        
        // 입력 이벤트 트리거하여 검증 실행
        passwordInput.dispatchEvent(new Event('input'));
        
        // 3초 후 다시 패스워드 모드로 변경
        setTimeout(() => {
            passwordInput.type = 'password';
        }, 3000);
        
        // 사용자에게 알림
        Swal.fire({
            icon: 'success',
            title: '안전한 패스워드 생성 완료!',
            text: '생성된 패스워드가 입력되었습니다. 3초 후 자동으로 숨겨집니다.',
            timer: 3000,
            showConfirmButton: false
        });
    });
}

// 9. 패스워드 보안 체크리스트
function getPasswordSecurityChecklist(password) {
    const checklist = [
        { item: '8자 이상', check: password.length >= 8 },
        { item: '대문자 포함', check: /[A-Z]/.test(password) },
        { item: '소문자 포함', check: /[a-z]/.test(password) },
        { item: '숫자 포함', check: /\d/.test(password) },
        { item: '특수문자 포함', check: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
        { item: '연속된 문자 없음', check: !/(.)\1{2,}/.test(password) },
        { item: '키보드 패턴 없음', check: !/(qwerty|asdf|123|abc)/i.test(password) }
    ];
    
    return checklist;
}

// 10. 패스워드 보안 점수 표시
function showPasswordSecurityScore(password) {
    const validation = validatePassword(password);
    const checklist = getPasswordSecurityChecklist(password);
    const passedChecks = checklist.filter(item => item.check).length;
    
    const checklistHtml = checklist.map(item => 
        `<div class="checklist-item ${item.check ? 'passed' : 'failed'}">
            <span class="check-icon">${item.check ? '✅' : '❌'}</span>
            <span class="check-text">${item.item}</span>
        </div>`
    ).join('');
    
    return `
        <div class="password-security-score">
            <div class="score-header">
                <h4>패스워드 보안 점수: ${validation.score}/10</h4>
                <p>통과한 검사: ${passedChecks}/${checklist.length}</p>
            </div>
            <div class="checklist">
                ${checklistHtml}
            </div>
        </div>
    `;
}

// 11. 초기화 함수
function initializePasswordSecurity() {
    // 로그인 패스워드 토글
    setupPasswordToggle('login-password', 'login-password-toggle');
    
    // 회원가입 패스워드 검증
    setupPasswordValidation('register-password', 'register-password-confirm', 'password-strength-indicator');
    
    // 회원가입 패스워드 토글
    setupPasswordToggle('register-password', 'register-password-toggle');
    setupPasswordToggle('register-password-confirm', 'register-password-confirm-toggle');
    
    // 패스워드 생성기
    setupPasswordGenerator('register-password', 'generate-password-btn');
}

// 12. CSS 스타일 추가
function addPasswordSecurityStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .password-strength {
            margin-top: 0.5rem;
        }
        
        .strength-bar {
            width: 100%;
            height: 4px;
            background-color: #e9ecef;
            border-radius: 2px;
            overflow: hidden;
        }
        
        .strength-fill {
            height: 100%;
            transition: width 0.3s ease, background-color 0.3s ease;
        }
        
        .strength-text {
            font-size: 0.8rem;
            margin-top: 0.25rem;
            display: block;
        }
        
        .password-security-score {
            margin-top: 1rem;
            padding: 1rem;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            background-color: #f8f9fa;
        }
        
        .checklist-item {
            display: flex;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        
        .checklist-item.passed {
            color: #28a745;
        }
        
        .checklist-item.failed {
            color: #dc3545;
        }
        
        .check-icon {
            margin-right: 0.5rem;
            font-size: 0.9rem;
        }
        
        .password-toggle-btn {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1.2rem;
        }
        
        .form-group {
            position: relative;
        }
        
        .generate-password-btn {
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            margin-top: 0.5rem;
        }
        
        .generate-password-btn:hover {
            background: linear-gradient(135deg, #218838, #1ea085);
        }
    `;
    document.head.appendChild(style);
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    addPasswordSecurityStyles();
    initializePasswordSecurity();
}); 
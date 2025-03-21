
const $PdetailBtn = document.querySelector('.privacy-detail-btn');
const $Pdetail = document.querySelector('.privacy-details');
const $agreeInput = document.querySelector('#privacy');
const $Gobtn = document.querySelector('.gobtn');
const $Step01 = document.querySelector('.step01');
const $Step02 = document.querySelector('.step02');
const $name = document.getElementById('name');
const $email = document.getElementById('email');
const $phone = document.getElementById('phone');


// 개인정보제공 동의 [보기] 버튼
$PdetailBtn.addEventListener('click', () => {
    const isVisible = $Pdetail.style.display === 'block';
    $Pdetail.style.display = isVisible ? 'none' : 'block';
});


// 예약확인 버튼 
$Gobtn.addEventListener('click', async function(){
    if(!($name.value)){
        Swal.fire({
            icon: "error",
            text: "이름을 입력하세요.",
        });
        return;
    }
    if(!($phone.value)){
        Swal.fire({
            icon: "error",
            text: "연락처를 입력하세요.",
        });
        return;
    }
    if(!($email.value)){
        Swal.fire({
            icon: "error",
            text: "email 입력하세요.",
        });
        return;
    }
    if(!($agreeInput.checked)){
        Swal.fire({
            icon: "error",
            text: "개인정보 제공에 동의하셔야 합니다.",
        });
    }
    else{
        $Step01.style.display = 'none';
        $Step02.classList.remove('hidden2');    
        const $Qtxt = document.querySelector('.Q-txt');
        $Qtxt.innerHTML = '예약 정보를 확인하세요';

    }

});




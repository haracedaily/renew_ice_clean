
const $PdetailBtn = document.querySelector('.privacy-detail-btn');
const $Pdetail = document.querySelector('.privacy-details');
const $agreeInput = document.querySelector('#privacy');
const $Gobtn = document.querySelector('.gobtn');
const $Step01 = document.querySelector('.step01');
const $Step02 = document.querySelector('.step02');
const $name = document.getElementById('name');
const $email = document.getElementById('email');
const $phone = document.getElementById('phone');
const $view = document.querySelector('.view');


// 개인정보제공 동의 [보기] 버튼
$PdetailBtn.addEventListener('click', () => {
    const isVisible = $Pdetail.style.display === 'block';
    $Pdetail.style.display = isVisible ? 'none' : 'block';
});


// 예약확인 버튼 
$Gobtn.addEventListener('click', async function() {
    if (!($name.value)) {
        Swal.fire({
            icon: "error",
            text: "이름을 입력하세요.",
        });
        return;
    }
    if (!($phone.value)) {
        Swal.fire({
            icon: "error",
            text: "연락처를 입력하세요.",
        });
        return;
    }
    if (!($email.value)) {
        Swal.fire({
            icon: "error",
            text: "email 입력하세요.",
        });
        return;
    }
    if (!($agreeInput.checked)) {
        Swal.fire({
            icon: "error",
            text: "개인정보 제공에 동의하셔야 합니다.",
        });
    }
    $Step01.style.display = 'none';
    $Step02.classList.remove('hidden2');
    const $Qtxt = document.querySelector('.Q-txt');
    $Qtxt.innerHTML = '예약 정보를 확인하세요';

    const data = await supabase
        .from('ice_res')
        .select('*')
        .eq('name', $name.value)
        .eq('email', $email.value)
        .eq('tel', $phone.value);
    // console.log(data);

    let rows = '';
    for(let i = 0; i < data.data.length; i++) {
        rows = rows + `<div className="reservation-details">
        <p><strong>이름 : </strong>${data.name}</p>
        <p><strong>연락처 : </strong>${data.tel}</p>
        <p><strong>email : </strong>${data.email}</p>
        <p><strong>주소 : </strong>${data.addr}</p>
        <p><strong>날짜 : </strong>${data.date}</p>
        <p><strong>시간 : </strong>${data.time}</p>
        <p><strong>제빙기 모델명 : </strong>${data.model}</p>
        <p><strong>제빙기 용량 : </strong>${data.capacity}</p>
        <p><strong>선택 서비스 : </strong>${data.service}</p>
        <p><strong>서비스 주기 : </strong>${data.cycle}</p>
        <p><strong>추가 서비스 선택 : </strong>${data.add}</p>
        <p><strong>특별 요청사항 : </strong>${data.remark}</p>
        <p><strong>예약금 : </strong>${data.deposit}</p>
    </div>`;
    }
    let look = `${rows}`;
    $Step02.innerHTML = look;

    // <div className="reservation-details">
    //     <p><strong>이름 : </strong>${data.name}</p>
    //     <p><strong>연락처 : </strong>${data.tel}</p>
    //     <p><strong>email : </strong>${data.email}</p>
    //     <p><strong>주소 : </strong>${data.addr}</p>
    //     <p><strong>날짜 : </strong>${data.date}</p>
    //     <p><strong>시간 : </strong>${data.time}</p>
    //     <p><strong>제빙기 모델명 : </strong>${data.model}</p>
    //     <p><strong>제빙기 용량 : </strong>${data.capacity}</p>
    //     <p><strong>선택 서비스 : </strong>${data.service}</p>
    //     <p><strong>서비스 주기 : </strong>${data.cycle}</p>
    //     <p><strong>추가 서비스 선택 : </strong>${data.add}</p>
    //     <p><strong>특별 요청사항 : </strong>${data.remark}</p>
    //     <p><strong>예약금 : </strong>${data.deposit}</p>
    // </div>


});




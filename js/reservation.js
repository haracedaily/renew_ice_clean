document.getElementById('reservation-date').addEventListener('change', function() {
    const RTime = document.querySelector('.r-time');
    if (this.value) {
        RTime.classList.remove('hidden2')
        RTime.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});

document.querySelectorAll('.reservationTime').forEach((node)=>{
    node.addEventListener('change', function() {
        const Rinfo = document.querySelector('.r-info');
        if(this.checked) {
            Rinfo.classList.remove('hidden2');
            Rinfo.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    })
});

document.querySelectorAll('.reserInfo').forEach((node,idx)=>{
    node.addEventListener('change', function() {

        const Raddr = document.querySelector('.r-addr');
        if(idx==0){
            if(document.querySelectorAll('.reserInfo')[1].value&&!!document.querySelectorAll('.reserInfo')[2].value&&!!this.value){
                Raddr.classList.remove('hidden2');
                Raddr.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }else if(idx==1){
            if(!!document.querySelectorAll('.reserInfo')[0].value&&!!document.querySelectorAll('.reserInfo')[2].value&&!!this.value){
                Raddr.classList.remove('hidden2');
                Raddr.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }else{
            if(!!document.querySelectorAll('.reserInfo')[1].value&&!!document.querySelectorAll('.reserInfo')[0].value&&!!this.value){
                Raddr.classList.remove('hidden2');
                Raddr.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    })
});

document.querySelectorAll('.reserAddr').forEach((node)=>{
    node.addEventListener('change', function() {
        const Rmodel = document.querySelector('.r-model');
        if(this.value) {
            Rmodel.classList.remove('hidden2');
            Rmodel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    })
});

document.getElementById('modelname').addEventListener('change', function() {
    const Rselectserv = document.querySelector('.r-selectServ');
    if(this.value) {
        Rselectserv.classList.remove('hidden2');
        Rselectserv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});

document.querySelectorAll('.selectServ').forEach((node)=>{
    node.addEventListener('change', function() {
        const Rselectcyc = document.querySelector('.r-selectCyc');
        if(this.value) {
            Rselectcyc.classList.remove('hidden2');
            Rselectcyc.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    })
});

document.querySelectorAll('.selectCyc').forEach((node)=>{
    node.addEventListener('change', function() {
        const Rselectadd = document.querySelector('.r-selectAdd');
        if(this.checked) {
            Rselectadd.classList.remove('hidden2');
            Rselectadd.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    })
});

document.querySelectorAll('.selectAdd').forEach((node)=>{
    node.addEventListener('change', function() {
        const Rspecial = document.querySelector('.r-Special');
        if(this.checked) {
            Rspecial.classList.remove('hidden2');
            Rspecial.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
})




const CheckInfo = document.querySelector('.check-info');
const CheckDate = document.querySelector('.check-date');
const CheckTime = document.querySelector('.check-time');
const CheckAddr = document.querySelector('.check-addr');
const CheckModel = document.querySelector('.check-model');
const CheckSelectSer = document.querySelector('.check-select-ser');
const CheckSelectCyc = document.querySelector('.check-select-cyc');
const CheckSelectAdd = document.querySelector('.check-select-add');
const CheckSpecial = document.querySelector('.check-special');

const OutputRDate = document.getElementById('reservation-date');
const OutputRTime = document.querySelectorAll('.reservationTime');
const OutputName = document.getElementById('name');
const OutputPhone = document.getElementById('phone');
const OutputEmail = document.getElementById('email');
const OutputPost = document.getElementById('postcode');
const OutputAddress = document.getElementById('address');
const OutputDetailAddress = document.getElementById('detailAddress');
const OutputSelectServ = document.querySelectorAll('.selectServ');
const OutputSelectCyc = document.querySelectorAll('.selectCyc');
const OutputSelectAdd = document.querySelectorAll('.selectAdd');
const OutputSpecial = document.getElementById('specialR');

const $confirmReserve = document.querySelector('#confirm-reserve');


$confirmReserve.addEventListener('click', function(){
    CheckInfo.innerHTML = `이름 : ${OutputName.value} 전화번호 : ${OutputPhone.value} 이메일 ${OutputEmail.value}`;
});






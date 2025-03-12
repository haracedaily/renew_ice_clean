document.getElementById('reservation-date').addEventListener('change', function() {
    const RTime = document.querySelector('.r-time');
    if (this.value) {
        RTime.classList.remove('hidden2')
    }
});

document.querySelectorAll('.reservationTime').forEach((node)=>{
    node.addEventListener('change', function(test) {
        const Rinfo = document.querySelector('.r-info');
        if(this.checked) {
            Rinfo.classList.remove('hidden2')
        }
    })
});



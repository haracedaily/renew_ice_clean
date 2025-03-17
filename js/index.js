var element_wrap = document.getElementById('daumcdn');

function foldDaumPostcode() {
    // iframe을 넣은 element를 안보이게 한다.
    element_wrap.style.display = 'none';
}

function execDaumPostcode(zipcode, addr1, addr2) {
    // 현재 scroll 위치를 저장해놓는다.
    var currentScroll = Math.max(document.body.scrollTop, document.documentElement.scrollTop);
    new daum.Postcode({
        oncomplete: function(data) {
            // 검색결과 항목을 클릭했을때 실행할 코드를 작성하는 부분.

            // 각 주소의 노출 규칙에 따라 주소를 조합한다.
            // 내려오는 변수가 값이 없는 경우엔 공백('')값을 가지므로, 이를 참고하여 분기 한다.
            var addr = ''; // 주소 변수
            var extraAddr = ''; // 참고항목 변수

            //사용자가 선택한 주소 타입에 따라 해당 주소 값을 가져온다.
            if (data.userSelectedType === 'R') { // 사용자가 도로명 주소를 선택했을 경우
                addr = data.roadAddress;
            } else { // 사용자가 지번 주소를 선택했을 경우(J)
                addr = data.jibunAddress;
            }

            // 사용자가 선택한 주소가 도로명 타입일때 참고항목을 조합한다.
            if(data.userSelectedType === 'R'){
                // 법정동명이 있을 경우 추가한다. (법정리는 제외)
                // 법정동의 경우 마지막 문자가 "동/로/가"로 끝난다.
                if(data.bname !== '' && /[동|로|가]$/g.test(data.bname)){
                    extraAddr += data.bname;
                }
                // 건물명이 있고, 공동주택일 경우 추가한다.
                if(data.buildingName !== '' && data.apartment === 'Y'){
                    extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
                }
                // 표시할 참고항목이 있을 경우, 괄호까지 추가한 최종 문자열을 만든다.
                if(extraAddr !== ''){
                    extraAddr = ' (' + extraAddr + ') ';
                }
                // 조합된 참고항목을 해당 필드에 넣는다.
                document.querySelector(addr2).value = extraAddr;
            } else {
                document.querySelector(addr2).value = '';
            }

            // 우편번호와 주소 정보를 해당 필드에 넣는다.
            document.querySelector(zipcode).value = data.zonecode;
            document.querySelector(addr1).value = addr;

            // 커서를 상세주소 필드로 이동한다.
            document.querySelector(addr2).focus();

            // iframe을 넣은 element를 안보이게 한다.
            // (autoClose:false 기능을 이용한다면, 아래 코드를 제거해야 화면에서 사라지지 않는다.)
            element_wrap.style.display = 'none';

            // 우편번호 찾기 화면이 보이기 이전으로 scroll 위치를 되돌린다.
            document.body.scrollTop = currentScroll;
        },
        // 우편번호 찾기 화면 크기가 조정되었을때 실행할 코드를 작성하는 부분. iframe을 넣은 element의 높이값을 조정한다.
        onresize : function(size) {
            element_wrap.style.height = size.height+'px';
        },
        width : '100%',
        height : '100%'
    }).embed(element_wrap);

    // iframe을 넣은 element를 보이게 한다.
    element_wrap.style.display = 'block';
}

/*
function execDaumPostcode(zipcode, addr1, addr2) {
	new daum.Postcode({
		oncomplete: function(data) {
			var fullRoadAddr = data.roadAddress; // 도로명 주소 변수
			var extraRoadAddr = ''; // 도로명 조합형 주소 변수

			// 법정동명이 있을 경우 추가한다. (법정리는 제외)
			// 법정동의 경우 마지막 문자가 "동/로/가"로 끝난다.
			if(data.bname !== '' && /[동|로|가]$/g.test(data.bname)){
				extraRoadAddr += data.bname;
			}
			// 건물명이 있고, 공동주택일 경우 추가한다.
			if(data.buildingName !== '' && data.apartment === 'Y'){
			   extraRoadAddr += (extraRoadAddr !== '' ? ', ' + data.buildingName : data.buildingName);
			}
			// 도로명, 지번 조합형 주소가 있을 경우, 괄호까지 추가한 최종 문자열을 만든다.
			if(extraRoadAddr !== ''){
				extraRoadAddr = ' (' + extraRoadAddr + ')';
			}
			// 도로명, 지번 주소의 유무에 따라 해당 조합형 주소를 추가한다.
			if(fullRoadAddr !== ''){
				fullRoadAddr += extraRoadAddr;
			}
			// 주소 정보를 해당 필드에 넣는다.


			document.getElementsByName(zipcode)[0].value = data.zonecode;
			document.getElementsByName(addr1)[0].value = fullRoadAddr;
			document.getElementsByName(addr2)[0].focus();
		}
	}).open();
}
*/

function get_popup_data (idx)
{
    var params = '?idx=' + idx;

    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
        if (this.readyState === this.DONE && this.status === 200) {
            try {
                var obj = JSON.parse(this.response);
            } catch (e) {
                alert('오류가 발생했습니다.');
                return;
            }

            if (obj.status == 'OK') {
                document.querySelector('.inquiry#pop_title').innerText = obj.data.parent_subject;
                document.querySelector('.inquiry#pop_symptom').innerText = obj.data.symptom;
                document.querySelector('.inquiry#pop_cause').innerText = obj.data.content;

                document.getElementsByName('idx')[0].value = obj.data.idx;
            } else {
                alert('오류가 발생했습니다.');
                return;
            }
        }
    }

    xhr.open('GET', '/get_popup_data.ajax.php' + params, true);
    xhr.send();
}

function general_inquiry_ok ()
{
    var frm = document.pop_fwrite;
    var formData = new FormData(frm);

    if (frm.name.value.trim() == '') {
        alert('성함을 입력해주세요.');
        frm.name.focus();
        return;
    }

    if (frm.phone.value.trim() == '') {
        alert('연락처를 입력해주세요.');
        frm.phone.focus();
        return false;
    }

    if (frm.address1.value == '' && frm.address2.value == '') {
        alert('주소를 검색해주세요.');
        return false;
    }

    if (frm.address3.value.trim() == '') {
        alert('상세주소를 입력해주세요.');
        frm.address3.focus();
        return false;
    }

    if (frm.symptom.value.trim() == '') {
        alert('문의내용을 입력해주세요.');
        frm.symptom.focus();
        return false;
    }

    if (frm.agree.checked === false) {
        alert('개인정보 수집 및 이용에 동의해주세요.');
        return false;
    }

    inquiry_ok(formData);
}

function fast_inquiry_ok ()
{
    var frm = document.fwrite;
    var formData = new FormData(frm);

    if (frm.name.value.trim() == '') {
        alert('성함을 입력해주세요.');
        frm.name.focus();
        return false;
    }

    if (frm.phone.value.trim() == '') {
        alert('연락처를 입력해주세요.');
        frm.phone.focus();
        return false;
    }
    /*
        if (frm.address2.value.trim() == '') {
            alert('주소를 입력해주세요.');
            frm.address2.focus();
            return false;
        }

        if (frm.symptom.value.trim() == '') {
            alert('증상을 입력해주세요.');
            frm.symptom.focus();
            return false;
        }
    */
    if (frm.agree.checked === false) {
        alert('개인정보 수집 및 이용에 동의해주세요.');
        return false;
    }

    var order_data = $(frm).serialize();
    var save_result = "";
    $.ajax({
        type  : "POST",
        data  : order_data,
        url   :  "./ajax.inquiry_ok.php",
        cache : false,
        async : false,
        success: function(data, textStatus) {
            save_result = data;
            //alert('save_result- '+save_result);
            var obj = jQuery.parseJSON(save_result);
            var message = obj.message;
            alert(message);
            location.reload();
        },
        error:function(request,status,error){
            alert("code = "+ request.status + " message = " + request.responseText + " error = " + error); // 실패 시 처리
        }
    });
}

function inquiry_ok(formData)
{
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
        if (this.readyState === this.DONE && this.status === 200) {
            var response = this.response.trim();

            if (response == 'OK') {
                alert('문의가 등록되었습니다.');
            } else {
                alert('오류가 발생했습니다.');
            }

            location.reload();
        }
    }

    xhr.open('POST', '/inquiry_ok.ajax.php');
    xhr.send(formData);
}
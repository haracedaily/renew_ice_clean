setInterval(()=>{
    let first_li = document.querySelector("#process_ul").children[0];
    first_li.remove();
    document.querySelector("#process_ul").appendChild(first_li);
},3000);
let fileNo = 0;
let filesArr = new Array();
/*TODO 글쓰기 작성 닫을때 내부 내용 초기화 및 전역 변수 초기화,
*  파일 정보들 초기화
* 파일 전송 및 데이터 저장 */
document.addEventListener("DOMContentLoaded", ()=>{
    let $body = document.querySelector("body");
    document.querySelector("#review_write").addEventListener("click", ()=>{
        document.querySelector("#re_popup").classList.toggle("hidden");
        $body.style.touchAction="none";
        $body.style.overflow="hidden";
        document.querySelector("#re_title").focus();
    })
    document.querySelector("#can_re").addEventListener("click", ()=>{
        document.querySelector("#re_popup").classList.toggle("hidden");


    })
        const quill = new Quill('#editor', {
        theme: 'snow'
    });
})





/* 첨부파일 추가 */
function addFile(obj){
    var maxFileCnt = 10;   // 첨부파일 최대 개수
    var attFileCnt = document.querySelectorAll('.filebox').length;    // 기존 추가된 첨부파일 개수
    var remainFileCnt = maxFileCnt - attFileCnt;    // 추가로 첨부가능한 개수
    var curFileCnt = obj.files.length;  // 현재 선택된 첨부파일 개수

    // 첨부파일 개수 확인
    if (curFileCnt > remainFileCnt) {
        alert("첨부파일은 최대 " + maxFileCnt + "개 까지 첨부 가능합니다.");
    }

    for (var i = 0; i < Math.min(curFileCnt, remainFileCnt); i++) {

        const file = obj.files[i];

        // 첨부파일 검증
        if (validation(file)) {
            // 파일 배열에 담기
            var reader = new FileReader();
            reader.onload = function () {
                filesArr.push(file);
            };
            reader.readAsDataURL(file)

            // 목록 추가
            let htmlData = '';
            htmlData += '<div id="file' + fileNo + '" class="filebox flex">';
            htmlData += `   <p class="name" data-files="${file}"> ${file.name}  </p>`;
            htmlData += '   <a class="delete" onclick="deleteFile(' + fileNo + ');"><span class="cursor-pointer ml-2 pl-2 pr-2 rounded-sm border-[1px] border-red-400 text-red-600">-</span></a>';
            htmlData += '</div>';
            document.querySelector("#re_file_list").innerHTML+=htmlData;
            fileNo++;
        } else {
            continue;
        }
    }
    // 초기화
    document.querySelector("input[type=file]").value = "";
}

/* 첨부파일 검증 */
function validation(obj){
    const fileTypes = ['application/pdf', 'image/gif', 'image/jpeg', 'image/png', 'image/bmp', 'image/tif', 'application/haansofthwp', 'application/x-hwp'];
    if (obj.name.length > 100) {
        alert("파일명이 100자 이상인 파일은 제외되었습니다.");
        return false;
    } else if (obj.size > (50 * 1024 * 1024)) {
        alert("최대 파일 용량인 50MB를 초과한 파일은 제외되었습니다.");
        return false;
    } else if (obj.name.lastIndexOf('.') == -1) {
        alert("확장자가 없는 파일은 제외되었습니다.");
        return false;
    } else if (!fileTypes.includes(obj.type)) {
        alert("첨부가 불가능한 파일은 제외되었습니다.");
        return false;
    } else {
        return true;
    }
}

/* 첨부파일 삭제 */
function deleteFile(num) {
    document.querySelector("#file" + num).remove();
    filesArr[num].is_delete = true;
}

/* 폼 전송 */
/*
function submitForm() {
    // 폼데이터 담기
    var form = document.querySelector("form");
    var formData = new FormData(form);
    for (var i = 0; i < filesArr.length; i++) {
        // 삭제되지 않은 파일만 폼데이터에 담기
        if (!filesArr[i].is_delete) {
            formData.append("attach_file", filesArr[i]);
        }
    }

    $.ajax({
        method: 'POST',
        url: '/register',
        dataType: 'json',
        data: formData,
        async: true,
        timeout: 30000,
        cache: false,
        headers: {'cache-control': 'no-cache', 'pragma': 'no-cache'},
        success: function () {
            alert("파일업로드 성공");
        },
        error: function (xhr, desc, err) {
            alert('에러가 발생 하였습니다.');
            return;
        }
    })
}*/

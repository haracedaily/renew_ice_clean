setInterval(() => {
    let first_li = document.querySelector("#process_ul").children[0];
    first_li.remove();
    document.querySelector("#process_ul").appendChild(first_li);
}, 3000);

class today {
    constructor(date) {
        this.year = date.getFullYear();
        this.month = date.getMonth() + 1;
        this.date = date.getDate();
    }

    getDate() {
        if (this.date < 10) {
            return '0' + this.date;
        }
        return this.date;
    }

    getMonth() {
        if (this.month < 10) {
            return '0' + this.month;
        }
        return this.month;
    }
}

let fileNo = 0;
let filesArr = new Array();
/* 글쓰기 작성 닫을때 내부 내용 초기화 및 전역 변수 초기화,
*  파일 정보들 초기화
* 파일 전송 및 데이터 저장 완료
* TODO 페이지네이션 o, 단일갤러리, 호출순서 o
*  다음페이지 이전페이지
*   */
document.addEventListener("DOMContentLoaded", () => {
    let $today = new today(new Date());
    let $body = document.querySelector("body");
    let $reTitle = document.querySelector("#re_title");
    let $reDate = document.querySelector("#re_date");
    let $reservNo = document.querySelector("#reserv_no");
    const quill = new Quill('#editor', {
        theme: 'snow'
    });
    document.querySelector("#review_write").addEventListener("click", () => {
        document.querySelector("#re_popup").classList.toggle("hidden");
        $body.classList.toggle("scroll_lock");
        $reDate.value = `${$today.year}-${$today.getMonth()}-${$today.getDate()}`;
        $reTitle.focus();
    })
    document.querySelector("#can_re").addEventListener("click", () => {
        $reTitle.value = '';

        document.querySelector("#re_popup").classList.toggle("hidden");
        $body.classList.toggle("scroll_lock");
        filesArr=[];
        quill.deleteText(0, 9999999);
    })

    document.querySelector("#con_re").addEventListener("click", async () => {
        /*let re_title = $reTitle.value;
        let re_content = quill.getSemanticHTML(0, 9999999);
        let reservNo = $reservNo.value;*/
        /*let res = await supabase.from('review_gallery').insert([{title: re_title, content: re_content}]).select()
        if (!res.error) {
            console.log(res);*/
            //let res = await re_upload(filesArr, res.data[0].re_no);
            let res = await re_upload(filesArr,quill);
            console.log(res);
            if (!res.error) {
                document.querySelector("#re_file_list").innerHTML = '';
                $reTitle.value = '';

                document.querySelector("#re_popup").classList.toggle("hidden");
                $body.classList.toggle("scroll_lock");
                filesArr=[];
                quill.deleteText(0, 9999999);

                //갤러리 첫화면 재호출
                fetchGallery(0);

            }
       // }
    })

})
/*

async function re_img_insert(ary) {
    let res = await supabase.from('images').insert(ary).select();
    if (!res.error) {
        alert('이미지 테이블 저장 성공');
    }
    return res;
}
*/

async function re_upload(arr, quill) {
    let re_title =  document.querySelector("#re_title").value;
    let re_content = quill.getSemanticHTML(0, 9999999);

    let filesUrl = [];
    for (const file of arr) {
        let filenm = crypto.randomUUID() + file.name;
        let res = await supabase.storage.from('iceCareBucket').upload(filenm, file);
        if (!res.error) {
            let re_img_url = await supabase.storage.from('iceCareBucket').getPublicUrl(filenm).data.publicUrl;
            // filesUrl.push({conn_no: conn_no, file_name: filenm, image_url: re_img_url});
            filesUrl.push({file_name: filenm, image_url: re_img_url});
        }
    }
    let res2 = await supabase.rpc("insert_gallery",{title: re_title,content:re_content,file_data:filesUrl});
    // let res2 = await re_img_insert(filesUrl);
    return res2;
}

/* 첨부파일 추가 */
function addFile(obj) {
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
            htmlData += `<div id="file${fileNo}" data-files="${file}" class="filebox flex">`;
            htmlData += `   <p class="name" data-files="${file}"> ${file.name}  </p>`;
            htmlData += '   <a class="delete" onclick="deleteFile(' + fileNo + ');"><span class="cursor-pointer ml-2 pl-2 pr-2 rounded-sm border-[1px] border-red-400 text-red-600">-</span></a>';
            htmlData += '</div>';
            document.querySelector("#re_file_list").innerHTML += htmlData;
            fileNo++;
        } else {
            continue;
        }
    }
    // 초기화
    document.querySelector("input[type=file]").value = "";
}

/* 첨부파일 검증 */
function validation(obj) {
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

//갤러리 불러오기(페이지별)
async function fetchGallery(page){
    let res = await supabase.rpc("fetch_gallery", {page});
    if(!res.error){
        console.log(res);
        let htmlData = '';
        res.data.forEach(item => {
            htmlData+=`  <div class="rounded-2xl flex flex-col justify-baseline w-full h-full gap-4">
                <div class="p-1 bg-gray-200 rounded-2xl">
                    <div onclick="openGallery('${item.re_no}')" class="w-full h-[25vh] rounded-2xl" data-id="1"
                         style="background-image:url('${item.image}'); background-size:cover; background-repeat:no-repeat; cursor:pointer;"></div>
                </div>
                <div class="text-2xl">${item.title}</div>
                <div>${item.cpdt.slice(0,10)}</div>
            </div>`;
        })
        document.querySelector("#galleryPage").innerHTML = htmlData;
    }
}

//갤러리 페이지네이션 구성하고 거기서 갤러리 열기로 변경 => 다음 넘길때 구성 변경형태
document.addEventListener("DOMContentLoaded", galleryPagination(0));

//단일 갤러리 열기
async function openGallery(re_no){
    let $gallery_popup = document.querySelector("#select_gallery");
    let res = await supabase.rpc("select_gallery",{gallery_no:re_no});
    console.log(res);
    //     $gallery_popup.classList.remove("hidden");
    // if(!res.error){
    //     res.data.forEach(item => {
    //
    //     })
    // }
}

//갤러리 페이지 구성하기
async function galleryPagination(d){
    let $pagination = document.querySelector("#gallery_pagination");
    let res = await supabase.from("review_gallery").select('*', { count: 'exact', head: true }).range(d,d+89);
    if(res.count>0) {
        await fetchGallery(d);
        let htmlData = '';
        for(let i =0; i<Math.ceil(res.count / 9);i++){
            htmlData+=` <div class="cursor-pointer" onclick="fetchGallery(${d+i})">${i+1}</div> `
        }
        $pagination.innerHTML = htmlData;
    }
}

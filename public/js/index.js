// 전역 변수 선언
let map = null;
let markers = [];
let currentPosition;
let geocoder;
let infowindows = [];
let currentMarker = null;
let currentRoute = null; // 현재 표시된 경로
let currentRouteInfo = null; // 현재 표시된 경로 정보

// 간단한 현재위치 테스트 함수
function testCurrentLocation() {
    console.log('=== 현재위치 테스트 시작 ===');
    
    // 1. 브라우저 지원 확인
    if (!navigator.geolocation) {
        console.error('❌ 이 브라우저에서는 위치 정보를 지원하지 않습니다.');
        customPopup.show('이 브라우저에서는 위치 정보를 지원하지 않습니다.');
        return;
    }
    console.log('✅ 브라우저에서 위치 정보 지원됨');
    
    // 2. 간단한 위치 정보 요청
    console.log('📍 위치 정보 요청 중...');
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            console.log('✅ 위치 정보 성공!');
            console.log('위도:', position.coords.latitude);
            console.log('경도:', position.coords.longitude);
            console.log('정확도:', position.coords.accuracy, '미터');
            
            // 전역 변수에 저장
            currentPosition = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            // 지도에 표시
            if (typeof kakao !== 'undefined' && map) {
                const currentPos = new kakao.maps.LatLng(position.coords.latitude, position.coords.longitude);
                map.setCenter(currentPos);
                map.setLevel(3);
                
                // 현재 위치 마커 생성
                if (currentMarker) {
                    currentMarker.setMap(null);
                }
                
                currentMarker = new kakao.maps.Marker({
                    position: currentPos,
                    map: map,
                    image: new kakao.maps.MarkerImage(
                        './image/user.png', // user.png 마커 사용
                        new kakao.maps.Size(30, 30)
                    )
                });
                
                console.log('✅ 지도에 현재위치 마커 표시 완료');
                
                // 현재 위치에서 카페/커피점 검색 (100m 반경)
                setTimeout(() => {
                    console.log('🔍 주변 커피점 검색 시작');
                    searchNearbyCafes();
                }, 1000);
            } else {
                console.log('❌ 카카오맵이 로드되지 않음');
            }
        },
        function(error) {
            console.error('❌ 위치 정보 가져오기 실패:', error);
            
            let errorMessage = '';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = '위치 정보 접근이 거부되었습니다.\n브라우저 설정에서 위치 정보 접근을 허용해주세요.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = '위치 정보를 사용할 수 없습니다.';
                    break;
                case error.TIMEOUT:
                    errorMessage = '위치 정보 요청 시간이 초과되었습니다.';
                    break;
                default:
                    errorMessage = '알 수 없는 오류가 발생했습니다.';
                    break;
            }
            
            customPopup.show('위치 정보 오류:\n' + errorMessage);
        },
        {
            enableHighAccuracy: true, // 정확도 높임
            timeout: 10000, // 10초로 증가
            maximumAge: 30000 // 30초
        }
    );
}

function getCurrentLocation() {
    console.log('getCurrentLocation 함수 호출됨');
    
    // 간단한 테스트 함수 호출
    testCurrentLocation();
}

// 지도 초기화 함수
function initMap() {
    if (map) return;
    const container = document.getElementById('map');
    if (!container) {
        console.error('지도 컨테이너 없음');
        return;
    }
    
    // 대구 중심점으로 설정 (대구 중구 동성로)
    const options = {
        center: new kakao.maps.LatLng(35.8714354, 128.601763),
        level: 3
    };
    
    console.log('🗺️ 지도 초기화 - 대구 중심점으로 설정');
    map = new kakao.maps.Map(container, options);
    geocoder = new kakao.maps.services.Geocoder();

    // 지도 클릭 시 인포윈도우와 경로만 닫기 (마커는 찍지 않음)
    kakao.maps.event.addListener(map, 'click', function() {
        if (infowindows) {
            infowindows.forEach(iw => iw.close());
        }
        if (currentRoute) {
            currentRoute.setMap(null);
            currentRoute = null;
        }
        if (currentRouteInfo) {
            currentRouteInfo.close();
            currentRouteInfo = null;
        }
    });
}

// 이벤트 리스너 설정
function setupEventListeners() {
    const currentLocationBtn = document.getElementById('current-location');
    if (currentLocationBtn) {
        currentLocationBtn.addEventListener('click', getCurrentLocation);
    }
    const searchCafesBtn = document.getElementById('search-cafes');
    if (searchCafesBtn) {
        searchCafesBtn.addEventListener('click', () => searchPlaces('카페'));
    }
    const searchStoresBtn = document.getElementById('search-stores');
    if (searchStoresBtn) {
        searchStoresBtn.addEventListener('click', () => searchPlaces('가맹점'));
    }
    const searchAddressBtn = document.getElementById('search-address');
    const addressInput = document.getElementById('address-input');
    if (searchAddressBtn) {
        searchAddressBtn.addEventListener('click', searchAddress);
    }
    if (addressInput) {
        addressInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchAddress();
            }
        });
    }
}

// 페이지 로드 시 초기화
window.addEventListener('load', function() {
    console.log('=== 페이지 로드 시작 ===');
    
    const checkKakaoMap = setInterval(function() {
        if (typeof kakao !== 'undefined') {
            console.log('✅ 카카오맵 API 로드 완료');
            clearInterval(checkKakaoMap);
            initMap();
            setupEventListeners();
            
            // 페이지 로드 시 자동으로 현재 위치 가져오기
            setTimeout(() => {
                console.log('🔄 페이지 로드 후 자동으로 현재 위치 가져오기 시작');
                testCurrentLocation(); // 직접 테스트 함수 호출
            }, 2000);
        }
    }, 100);
});

// DOMContentLoaded 이벤트도 추가
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOMContentLoaded 이벤트 발생 ===');
    
    // 카카오맵이 이미 로드되어 있다면 바로 초기화
    if (typeof kakao !== 'undefined') {
        console.log('✅ 카카오맵 API가 이미 로드됨');
        initMap();
        setupEventListeners();
        
        setTimeout(() => {
            console.log('🔄 DOMContentLoaded 후 현재 위치 가져오기 시작');
            testCurrentLocation(); // 직접 테스트 함수 호출
        }, 1000);
    }
});

// 현재 위치 좌표 가져오기
function getCurrentCoordinates() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                console.log('현재 위치:', latitude, longitude);
                
                // 카카오맵에 현재 위치 표시
                if (typeof kakao !== 'undefined' && map) {
                    const currentPos = new kakao.maps.LatLng(latitude, longitude);
                    map.setCenter(currentPos);
                    
                    // 기존 현재 위치 마커가 있다면 제거
                    if (currentMarker) {
                        currentMarker.setMap(null);
                    }
                    
                    // 현재 위치 마커 생성 (user.png 마커 사용)
                    currentMarker = new kakao.maps.Marker({
                        position: currentPos,
                        map: map,
                        image: new kakao.maps.MarkerImage(
                            './image/user.png', // user.png 마커 사용
                            new kakao.maps.Size(30, 30)
                        )
                    });
                }
            },
            (error) => {
                console.error('위치 정보를 가져오는데 실패했습니다:', error);
            }
        );
    } else {
        console.error('이 브라우저에서는 위치 정보를 지원하지 않습니다.');
    }
}

// 두 지점 간의 거리 계산 (Haversine 공식) - 미터 단위로 반환
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 지구의 반경 (km)
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance * 1000; // km를 미터로 변환
}

// 각도를 라디안으로 변환
function toRad(degrees) {
    return degrees * (Math.PI/180);
}

// 거리 포맷팅
function formatDistance(distance) {
    if (distance < 1000) {
        return `${Math.round(distance)}m`;
    } else {
        return `${(distance / 1000).toFixed(1)}km`;
    }
}

// 페이지 로드 시 현재 위치 가져오기
// document.addEventListener('DOMContentLoaded', getCurrentCoordinates); // 중복 제거

setInterval(() => {
    const processUl = document.querySelector("#process_ul");
    if (processUl && processUl.children.length > 0) {
        let first_li = processUl.children[0];
        first_li.remove();
        processUl.appendChild(first_li);
    }
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
* 페이지네이션 o, 단일갤러리, 호출순서 o
* TODO 다음페이지 이전페이지 단일갤러리 slicker
*   */
document.addEventListener("DOMContentLoaded", () => {
    // 메인 페이지에서만 실행되어야 하는 코드
    const reviewWrite = document.querySelector("#review_write");
    const canRe = document.querySelector("#can_re");
    const conRe = document.querySelector("#con_re");
    const reTitle = document.querySelector("#re_title");
    const reDate = document.querySelector("#re_date");
    const rePopup = document.querySelector("#re_popup");
    const editor = document.querySelector("#editor");

    if (reviewWrite && canRe && conRe && reTitle && reDate && rePopup && editor) {
        let $today = new today(new Date());
        let $body = document.querySelector("body");
        let $reservNo = document.querySelector("#reserv_no");
        //let $symptoms = document.querySelector("#symptoms");
        const quill = new Quill('#editor', {
            theme: 'snow'
        });
        reviewWrite.addEventListener("click", () => {
            rePopup.classList.toggle("hidden");
            $body.classList.toggle("scroll_lock");
            reDate.value = `${$today.year}-${$today.getMonth()}-${$today.getDate()}`;
            reTitle.focus();
        })
        canRe.addEventListener("click", () => {
            reTitle.value = '';
            rePopup.classList.toggle("hidden");
            $body.classList.toggle("scroll_lock");
            filesArr=[];
            quill.deleteText(0, 9999999);
        })

        conRe.addEventListener("click", async () => {
            let btn = conRe;
            let btn2 = canRe;
            btn.disabled=true;
            btn2.disabled=true;
            /*let re_title = $reTitle.value;
            let re_content = quill.getSemanticHTML(0, 9999999);
            let reservNo = $reservNo.value;*/
            /*let res = await supabase.from('review_gallery').insert([{title: re_title, content: re_content}]).select()
            if (!res.error) {
                console.log(res);*/
                //let res = await re_upload(filesArr, res.data[0].re_no);
                let res = await re_upload(filesArr,quill);
                if (!res.error) {
                    document.querySelector("#re_file_list").innerHTML = '';
                    reTitle.value = '';

                    rePopup.classList.toggle("hidden");
                    $body.classList.toggle("scroll_lock");
                    filesArr=[];
                    quill.deleteText(0, 9999999);

                    //갤러리 첫화면 재호출
                    fetchGallery(0);

                }
            btn.disabled=false;
            btn2.disabled=false;
           // }
        })
       /* for(let item of $symptoms.children) {
            item.addEventListener("click", () => {
                location.href = './reservation.html';
            })
        }*/

    }
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
        //storage 폴더 경로 추가 예시
        let filenm = "review_img/"+crypto.randomUUID()+'.' + file.name.split('.').pop();
        let res = await supabase.storage.from('icecarebucket').upload(filenm, file);
        // let res = await supabase.storage.from('iceCareBucket').upload(filenm, file);
        if (!res.error) {
            let re_img_url = await supabase.storage.from('icecarebucket').getPublicUrl(filenm).data.publicUrl;
             // let re_img_url = await supabase.storage.from('iceCareBucket').getPublicUrl(filenm).data.publicUrl;
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
    var maxFileCnt = 8;   // 첨부파일 최대 개수
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
async function fetchGallery_search(page,keyword,key){
    let page_children = document.querySelector("#gallery_pagination").children;
    for(let i = 0; i<page_children.length; i++) {
        if(i===page){
            page_children[i].style.color='red';
        }else{
            page_children[i].style.color='black';
        }
    }
    let res = await supabase.rpc("fetch_gallery_search", {page,keyword,key});
    if (!res.error) {
        let htmlData = '';
        res.data.forEach(item => {
            htmlData += `  <div class="rounded-2xl flex flex-col justify-baseline w-full h-[370px] gap-4 gallery_fetch">
                <div class="p-1 bg-gray-200 rounded-2xl">
                    <div onclick="openGallery('${item.re_no}')" class="w-full h-[25vh] rounded-2xl" data-id="1"
                         style="background-image:url('${item.image}'); background-size:cover; background-repeat:no-repeat; cursor:pointer;"></div>
                </div>
                <div class="text-2xl">${item.title}</div>
                <div>${item.cpdt.slice(0, 10)}</div>
            </div>`;
        })
        document.querySelector("#galleryPage").innerHTML = htmlData;
    }
}

//갤러리 불러오기(페이지별)
async function fetchGallery(page,keyword=''){
    let page_children = document.querySelector("#gallery_pagination").children;
    for(let i = 0; i<page_children.length; i++) {
        if(i===page){
            page_children[i].style.color='red';
        }else{
            page_children[i].style.color='black';
        }
    }
        let res = await supabase.rpc("fetch_gallery", {page});
        if (!res.error) {
            let htmlData = '';
            res.data.forEach(item => {
                htmlData += `  <div class="rounded-2xl flex flex-col justify-baseline w-full h-[370px] gap-4 gallery_fetch">
                <div class="p-1 bg-gray-200 rounded-2xl">
                    <div onclick="openGallery('${item.re_no}')" class="w-full h-[25vh] rounded-2xl" data-id="1"
                         style="background-image:url('${item.image}'); background-size:cover; background-repeat:no-repeat; cursor:pointer;"></div>
                </div>
                <div class="text-2xl">${item.title}</div>
                <div>${item.cpdt.slice(0, 10)}</div>
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
    document.querySelector('body').classList.add("scroll_lock");
    let res = await supabase.rpc("select_gallery",{gallery_no:re_no});
        $gallery_popup.classList.remove("hidden");
    if(!res.error){
        document.querySelector("#gallery_date").innerHTML = res.data[0].cpdt.slice(0,10);
        document.querySelector("#gallery_title").innerHTML = res.data[0].title;
        document.querySelector("#gallery_content").innerHTML = res.data[0].content;
        let htmlData = '';
        let htmlData2 = '';
        res.data[0].image.forEach(url=>{
            htmlData+=`<li style="overflow:hidden;">
<img src="${url}" style="height:300px; margin:0 auto;" alt="">
</li>
`;
            htmlData2+=`<li class="relative cursor-pointer rounded-[10px]">
<img src="${url}" style="height:60px; width:60px; border-radius:10px;"  alt="">
</li>
`;
        })
        document.querySelector("#gallery_slider").innerHTML = htmlData;
        document.querySelector("#gallery_nav_slider").innerHTML = htmlData2;
        $("#gallery_slider").slick('refresh');
        $("#gallery_nav_slider").slick('refresh');
        $('#gallery_slider').trigger('resize');
        $('#gallery_nav_slider').trigger('resize');
        $('#gallery_nav_slider').slick('slickGoTo', 1);
        $('#gallery_slider').slick('slickGoTo', 1);
    }

}

$('#gallery_slider').slick({
    slide: 'li',
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 2000,
    asNavFor: '#gallery_nav_slider',
    prevArrow : `<button type='button' style='background:url("./image/pop_prev.png") no-repeat center / 22px auto;' class='w-[44px] h-[80px] slick-prev absolute top-[40%] left-2 cursor-pointer'></button>`,
    nextArrow : `<button type='button' style='background:url("./image/pop_next.png") no-repeat center / 22px auto;' class='w-[44px] h-[80px] slick-next absolute top-[40%] right-2 cursor-pointer'></button>`,
    responsive: [
        {
            breakpoint: 850,
            settings: {
                slidesToShow: 1
            }
        },

    ]
});
$('#gallery_nav_slider').slick({
    arrows: false,
    variableWidth: true,
    slidesToShow: 'auto',
    slidesToScroll: 1,
    asNavFor: '#gallery_slider',
    arrows: false,
    // centerMode: true,
    focusOnSelect: true,
    responsive: [
        {
            breakpoint: 850,
            settings: {
                slidesToShow: 5,
            }
        },

    ]
});
function close_gallery(){
    let $gallery_popup = document.querySelector("#select_gallery");
    $gallery_popup.classList.add("hidden");
    document.querySelector('body').classList.remove("scroll_lock");
    $('#gallery_slider').slick('slickRemove', null, null, true)
    $('#gallery_nav_slider').slick('slickRemove', null, null, true)
    $('#gallery_slider').html("")
    $('#gallery_nav_slider').html("")
}
function gallery_search(){
    let $keyword = document.querySelector("#search_gallery").value;
    let $key = document.querySelector("#search_gallery_select").value;
    if($keyword.trim().length>0){
        galleryPagination_search(0,$keyword,$key);
    }else{
        galleryPagination(0);
    }

}
//갤러리 검색 페이지 구성하기
async function galleryPagination_search(d,keyword,key){
    let $pagination = document.querySelector("#gallery_pagination");
    let $prev = document.querySelector("#gallery_prev");
    let $next = document.querySelector("#gallery_next");
    let res;
    if(key==1) {
        res = await supabase.from("review_gallery").select('re_no').or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`).range(d * 9, (d * 9) + 90);
    }else if(key==2){
        res = await supabase.from("review_gallery").select('re_no').ilike('title',`%${keyword}%`).range(d * 9, (d * 9) + 90);
    }else{
        res = await supabase.from("review_gallery").select('re_no').ilike('content',`%${keyword}%`).range(d * 9, (d * 9) + 90);
    }
    if(res.data?.length>0) {

        let htmlData = '';
        let prevData = '';
        let nextData = '';
        if(d>=10){
            prevData=`<button class="pager_prev" onclick="galleryPagination_search(${d-10},'${keyword}',${key})"></button>`;
        }
        if(res.data?.length===91){
            nextData=`<button class="pager_prev rotate-180" onclick="galleryPagination_search(${d+10},'${keyword}',${key})"></button>`;
            res.data.length=90;
        }

        for(let i =0; i<Math.ceil(res.data.length / 9);i++){
            htmlData+=` <div class="cursor-pointer page" onclick="fetchGallery_search(${d+i},'${keyword}',${key})">${i+1}</div> `
        }
        $prev.innerHTML = prevData;
        $next.innerHTML = nextData;
        $pagination.innerHTML = htmlData;
        await fetchGallery_search(d,keyword,key);
    }else{
        $prev.innerHTML = '';
        $next.innerHTML = '';
        $pagination.innerHTML = '';
        document.querySelector("#galleryPage").innerHTML = `<div>조회 결과가 없습니다.</div>`;
        customPopup.show('조회된 결과가 없습니다.');
    }
}
//갤러리 페이지 구성하기
async function galleryPagination(d){
    const paginationContainer = document.querySelector("#pagination-container");
    if (!paginationContainer) return;

    try {
        const res = await fetchGallery(d);
        if (res && res.data) {
            paginationContainer.innerHTML = res.data;
        }
    } catch (error) {
        console.error("Gallery pagination error:", error);
    }
}

// Swiper 초기화
let swiper;
let partnerSwiper;

document.addEventListener("DOMContentLoaded", () => {
    try {
        // 메인 비주얼 Swiper 초기화
        const mainVisualElement = document.querySelector('.main_visual .swiper');
        if (mainVisualElement) {
            const swiper = new Swiper(mainVisualElement, {
                slidesPerView: 1,
                spaceBetween: 0,
                loop: true,
                speed: 10000,  // 전환 시간을 10초로 늘림
                effect: 'fade',
                fadeEffect: {
                    crossFade: true
                },
                autoplay: {
                    delay: 8000,
                    disableOnInteraction: false,
                    waitForTransition: true  // 전환이 완료될 때까지 대기
                },
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
                on: {
                    init: function() {
                        // 추가 슬라이드 제거
                        const wrapper = this.wrapperEl;
                        const slides = wrapper.querySelectorAll('.swiper-slide');
                        if (slides.length > 2) {
                            for (let i = slides.length - 1; i >= 2; i--) {
                                slides[i].remove();
                            }
                        }
                    },
                    slideChange: function() {
                        // 슬라이드 전환 시 배경색 유지
                        const activeSlide = this.slides[this.activeIndex];
                        if (activeSlide) {
                            activeSlide.style.backgroundColor = '#fff';
                        }
                    }
                }
            });
        }

        // 페이지 로드 시 Swiper 처리
        window.addEventListener('load', function() {
            const mainVisual = document.querySelector(".main_visual");
            if (mainVisual) {
                mainVisual.classList.add("on");
            }
        });

        // 파트너 Swiper 초기화
        const partnersRowElement = document.querySelector('.partners_row');
        if (partnersRowElement) {
            partnerSwiper = new Swiper(partnersRowElement, {
                loop: true,
                slidesPerView: 5.8,
                spaceBetween: 120,
                autoplay: {
                    delay: 5000,
                    disableOnInteraction: false,
                },
                breakpoints: {
                    1200: {
                        slidesPerView: 5.8,
                        spaceBetween: 60,
                    },
                    1080: {
                        slidesPerView: 4.5,
                        spaceBetween: 60,
                    },
                    850: {
                        slidesPerView: 2.5,
                        spaceBetween: 0,
                    },
                }
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

/*개인정보취급 팝업 닫기*/
function close_popup(){
    document.querySelector("#personal_popup").classList.add("hidden");
    document.querySelector('body').classList.remove("scroll_lock");
}

/*개인정보취급 팝업 열기*/
function open_popup(){
    document.querySelector("#personal_popup").classList.remove("hidden");
    document.querySelector('body').classList.add("scroll_lock");
}
function search_chk(ev){
    if(ev.keyCode == 13){
        gallery_search();
    }
}

window.addEventListener("scroll", ()=>{
    let $advantage = document.querySelector("#advantage")
    let $state = document.querySelector("#state");
    let $gallery = document.querySelector("#gallery");
    let $process = document.querySelector("#process");

    if($advantage && document.documentElement.scrollTop>=$advantage.offsetTop-500){
        $advantage.classList.add("fade-in-animation");
    }

    if($state && document.documentElement.scrollTop>=$state.offsetTop-500){
        $state.classList.add("fade-in-animation");
    }

    if($gallery && document.documentElement.scrollTop>=$gallery.offsetTop-500){
        $gallery.classList.add("fade-in-animation");
    }

    if($process && document.documentElement.scrollTop>=$process.offsetTop-500){
        $process.classList.add("fade-in-animation");
    }
});

/*
function counseling(){
    const form = document.getElementById('fwrite');

    const formData = new FormData(form);
    let counseler=true;
    let counseling = '';
    let counsel_info = {name:'성함',phone:'휴대전화'};
    if(!formData.has('agree')){
        Swal.fire({icon: 'error', title: `개인정보처리방침 미동의`, text: `개인정보처리방침을 동의하지 않으셨습니다.`});
    }else {
        formData.forEach((value, key) => {
            if (value.trim().length === 0) {
                counseling.length === 0 ? counseling += counsel_info[key] : counseling += ', ' + counsel_info[key];
                counseler = false;
            }
        });
        if (counseler) {
            Swal.fire({icon: 'success', title: '상담신청완료', text: '상담신청이 완료 되었습니다.'});
        } else {
            Swal.fire({icon: 'error', title: `${counseling} 미입력`, text: `미입력하신 내용을 입력해주세요.`});
        }
    }
}*/

// 페이드 인 효과: 스크롤 시 요소가 보이면 나타나게 (반복)
function handleFadeInOnScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                entry.target.classList.remove('visible');
            }
        });
    }, { threshold: 0.2 });
    document.querySelectorAll('.fade-in-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

document.addEventListener('DOMContentLoaded', handleFadeInOnScroll);

// ====== 시공사례 갤러리 검색/페이지네이션 ======

document.addEventListener('DOMContentLoaded', function () {
    // 카드 데이터 (예시 32개, 실제로는 서버에서 받아올 수 있음)
    const galleryData = Array.from({length: 32}, (_, i) => ({
        title: `경남 제빙기 청소 음식점 분해 세척 ${i+1}`,
        date: '2025-02-21'
    }));
    const cardsPerPage = 16;
    let currentPage = 1;
    let filteredData = [...galleryData];

    const grid = document.querySelector('.gallery-grid');
    const searchInput = document.querySelector('.gallery-search');
    const pagination = document.querySelector('.gallery-pagination');

    function renderCards() {
        if (!grid) return; // grid가 없으면 함수 종료
        grid.innerHTML = '';
        const start = (currentPage - 1) * cardsPerPage;
        const end = start + cardsPerPage;
        const pageData = filteredData.slice(start, end);
        pageData.forEach(card => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'gallery-card';
            cardDiv.innerHTML = `
                <div class="gallery-thumb"></div>
                <div class="gallery-title">${card.title}</div>
                <div class="gallery-date">${card.date}</div>
            `;
            grid.appendChild(cardDiv);
        });
    }

    function renderPagination() {
        if (!pagination) return; // pagination이 없으면 함수 종료
        pagination.innerHTML = '';
        const totalPages = Math.ceil(filteredData.length / cardsPerPage);
        // Prev arrow
        const prev = document.createElement('span');
        prev.className = 'page-arrow';
        prev.innerHTML = '&lt;';
        prev.onclick = () => { if(currentPage > 1) { currentPage--; update(); } };
        pagination.appendChild(prev);
        // Page numbers
        for(let i=1; i<=totalPages; i++) {
            const num = document.createElement('span');
            num.className = 'page-num' + (i === currentPage ? ' active' : '');
            num.textContent = i;
            num.onclick = () => { currentPage = i; update(); };
            pagination.appendChild(num);
        }
        // Next arrow
        const next = document.createElement('span');
        next.className = 'page-arrow';
        next.innerHTML = '&gt;';
        next.onclick = () => { if(currentPage < totalPages) { currentPage++; update(); } };
        pagination.appendChild(next);
    }

    function update() {
        renderCards();
        renderPagination();
    }

    // searchInput이 존재할 때만 이벤트 리스너 등록
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const q = this.value.trim();
            filteredData = galleryData.filter(card => card.title.includes(q));
            currentPage = 1;
            update();
        });
    }

    update();
});

// 마커 제거 함수 개선
function removeMarkers() {
    // 카페 마커만 지움
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
    
    // 기존 인포윈도우 제거
    infowindows.forEach((infowindow) => {
        infowindow.close();
    });
    infowindows = [];
    
    // 기존 경로 제거
    if (currentRoute) {
        currentRoute.setMap(null);
        currentRoute = null;
    }
    if (currentRouteInfo) {
        currentRouteInfo.close();
        currentRouteInfo = null;
    }
}

// 카페 마커 클릭 시 카카오맵 길찾기로 이동하는 함수
function showKakaoMapRoute(destinationLat, destinationLng, placeName) {
    if (!currentPosition) {
        customPopup.show('현재 위치를 먼저 확인해주세요.');
        return;
    }
    
    // 기존 경로 제거
    if (currentRoute) {
        currentRoute.setMap(null);
    }
    if (currentRouteInfo) {
        currentRouteInfo.close();
    }
    
    // 거리 계산
    const distance = calculateDistance(
        currentPosition.lat,
        currentPosition.lng,
        destinationLat,
        destinationLng
    );
    
    // 도보 예상 시간 계산 (평균 도보 속도: 4km/h)
    const walkingSpeed = 4; // km/h
    const walkingTimeMinutes = Math.round((distance / walkingSpeed) * 60);
    
    // 경로 그리기 (직선)
    const path = new kakao.maps.LatLng(
        currentPosition.lat,
        currentPosition.lng
    );
    const path2 = new kakao.maps.LatLng(
        destinationLat,
        destinationLng
    );
    
    const polyline = new kakao.maps.Polyline({
        path: [path, path2],
        strokeWeight: 3,
        strokeColor: '#FF0000',
        strokeOpacity: 0.7,
        strokeStyle: 'solid'
    });
    
    polyline.setMap(map);
    currentRoute = polyline;
    
    // 카카오맵 길찾기 링크 생성
    const kakaoMapUrl = `https://map.kakao.com/link/to/${encodeURIComponent(placeName)},${destinationLat},${destinationLng}`;
    
    // 경로 정보 인포윈도우 생성 (길찾기 버튼 포함)
    const routeContent = `
        <div style="padding:10px;min-width:200px;">
            <div style="font-weight:bold;margin-bottom:5px;color:#333;">🚶 도보 경로</div>
            <div style="font-size:12px;color:#666;margin-bottom:3px;">
                <strong>${placeName}</strong>
            </div>
            <div style="font-size:11px;color:#888;margin-bottom:3px;">
                거리: ${formatDistance(distance)}
            </div>
            <div style="font-size:11px;color:#888;margin-bottom:8px;">
                예상 시간: 약 ${walkingTimeMinutes}분
            </div>
            <button onclick="window.open('${kakaoMapUrl}', '_blank')" 
                    style="background:#FF6B35;color:white;border:none;padding:5px 10px;border-radius:3px;font-size:11px;cursor:pointer;width:100%;">
                🗺️ 카카오맵에서 실제 경로 보기
            </button>
        </div>
    `;
    
    const routeInfo = new kakao.maps.InfoWindow({
        content: routeContent,
        position: new kakao.maps.LatLng(destinationLat, destinationLng)
    });
    
    routeInfo.open(map);
    currentRouteInfo = routeInfo;
}

// 장소 검색 함수 개선 (유명 프랜차이즈 카페/커피점 전용 검색 - ice.png 마커 사용)
function searchPlaces(keyword) {
    if (!currentPosition) {
        customPopup.show('먼저 위치를 확인해주세요.');
        return;
    }

    // 기존 마커와 인포윈도우 제거
    removeMarkers();

    const places = new kakao.maps.services.Places();
    const allResults = []; // 모든 검색 결과를 저장할 배열
    let searchCount = 0; // 검색 완료 카운트
    
    // 유명 프랜차이즈 카페/커피점 키워드 배열
    const franchiseKeywords = [
        '스타벅스',
        '백다방',
        '투썸플레이스',
        '할리스커피',
        '이디야커피',
        '탐앤탐스',
        '커피빈',
        '엔제리너스',
        '파스쿠찌',
        '카페베네',
        '드롭탑',
        '커피스미스',
        '메가MGC커피',
        '커피에반하다',
        '빽다방',
        '스무디킹',
        '공차',
        '올리브영',
        '이마트24',
        '세븐일레븐'
    ];
    
    const totalSearches = franchiseKeywords.length; // 총 검색 횟수
    const searchRadius = 100; // 100m 반경으로 제한
    
    // 검색 완료 후 마커 생성 함수
    function createMarkers() {
        searchCount++;
        if (searchCount < totalSearches) return; // 모든 검색이 완료될 때까지 대기
        
        // 중복 제거 (같은 장소명과 주소)
        const uniqueResults = [];
        const seen = new Set();
        
        allResults.forEach(place => {
            const key = `${place.place_name}_${place.road_address_name || place.address_name}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueResults.push(place);
            }
        });
        
        // 카페(CE7) 또는 편의점(CS2) 카테고리 필터링
        const franchiseResults = uniqueResults.filter(place => 
            place.category_group_code === 'CE7' || 
            place.category_group_code === 'CS2' ||
            place.category_group_code === 'FD6'
        );
        
        console.log(`총 ${allResults.length}개 검색, 중복 제거 후 ${uniqueResults.length}개, 프랜차이즈점 ${franchiseResults.length}개 발견`);
        
        // 검색 결과 마커 표시 (프랜차이즈점만) - ice.png 마커 사용
        franchiseResults.forEach((place) => {
            const marker = new kakao.maps.Marker({
                position: new kakao.maps.LatLng(place.y, place.x),
                map: map,
                image: new kakao.maps.MarkerImage(
                    './image/ice.png', // ice.png 마커 사용
                    new kakao.maps.Size(40, 40) // 크기 조정
                )
            });
            
            // 마커 클릭 시 카카오맵 상세페이지로 이동
            kakao.maps.event.addListener(marker, 'click', function() {
                // 기존 InfoWindow 모두 닫기
                infowindows.forEach((iw) => iw.close());
                // 도보 예상 시간 계산 (평균 도보 속도: 4km/h, 직선거리의 1.3배 보정)
                const distance = calculateDistance(
                    currentPosition.lat,
                    currentPosition.lng,
                    parseFloat(place.y),
                    parseFloat(place.x)
                );
                const walkingDistance = distance * 1.3; // 보정값 적용
                const walkingSpeed = 67; // m/분 (4km/h)
                const walkingTimeMinutes = Math.round(walkingDistance / walkingSpeed);
                const placeId = place.id || place.place_id;
                const kakaoMapUrl = placeId ? `https://place.map.kakao.com/${placeId}` : null;
                const infoHtml = `
                    <div style='padding:8px;min-width:200px;'>
                        <b>${place.place_name}</b><br>
                        ${place.road_address_name || place.address_name}<br>
                        ${place.phone || ''}<br>
                        <span style='color:#0066CC;font-size:12px;'>도보 약 ${walkingTimeMinutes}분</span><br>
                        ${kakaoMapUrl ? `<button onclick=\"window.open('${kakaoMapUrl}', '_blank')\" style='margin-top:6px;padding:4px 10px;background:#007bff;color:white;border:none;border-radius:3px;font-size:12px;cursor:pointer;'>카카오맵 상세보기</button>` : ''}
                    </div>
                `;
                const infoWindow = new kakao.maps.InfoWindow({
                    position: marker.getPosition(),
                    content: infoHtml
                });
                infoWindow.open(map, marker);
                // 현재 열린 InfoWindow만 배열에 저장
                infowindows.length = 0;
                infowindows.push(infoWindow);
            });
            
            markers.push(marker);
        });
        
        // 검색 결과가 있는 경우 지도 중심 이동
        if (franchiseResults.length > 0) {
            const bounds = new kakao.maps.LatLngBounds();
            franchiseResults.forEach((place) => {
                bounds.extend(new kakao.maps.LatLng(place.y, place.x));
            });
            map.setBounds(bounds);
            
            console.log(`✅ 100m 반경 내에서 ${franchiseResults.length}개의 커피점을 찾았습니다.`);
        }
    }
    
    // 각 프랜차이즈 키워드로 검색
    franchiseKeywords.forEach((keyword, index) => {
        places.keywordSearch(keyword, (results, status) => {
            console.log(`"${keyword}" 키워드 검색 결과:`, status, results?.length || 0);
            
            if (status === kakao.maps.services.Status.OK && results) {
                allResults.push(...results);
                console.log(`"${keyword}" 키워드 검색 결과: ${results.length}개`);
            }
            createMarkers();
        }, {
            location: new kakao.maps.LatLng(currentPosition.lat, currentPosition.lng),
            radius: searchRadius
        });
    });
}

// 주소 검색 함수 개선
function searchAddress() {
    const addressInput = document.getElementById('address-input');
    if (!addressInput) return;

    const address = addressInput.value;
    if (!address) {
        customPopup.show('주소를 입력해주세요.');
        return;
    }

    // 기존 마커와 인포윈도우 제거
    removeMarkers();

    geocoder.addressSearch(address, function(results, status) {
        if (status === kakao.maps.services.Status.OK) {
            const coords = new kakao.maps.LatLng(results[0].y, results[0].x);
            
            // 지도 중심 이동
            map.setCenter(coords);
            
            // 현재 위치 업데이트
            currentPosition = {
                lat: results[0].y,
                lng: results[0].x
            };
            
            // 검색 위치 마커 표시
            const marker = new kakao.maps.Marker({
                position: coords,
                map: map
            });
            
            // 인포윈도우 생성
            const infowindow = new kakao.maps.InfoWindow({
                content: `<div style="padding:5px;font-size:12px;">
                    <strong>${results[0].address_name}</strong>
                </div>`
            });
            
            infowindow.open(map, marker);
            markers.push(marker);
            infowindows.push(infowindow);
            
            // 주변 카페 자동 검색
            searchPlaces('카페');
        } else {
            customPopup.show('주소를 찾을 수 없습니다.');
        }
    });
}

// 위치 정보 접근 권한 확인
function checkLocationPermission() {
    if (!navigator.geolocation) {
        console.log('이 브라우저에서는 위치 정보를 지원하지 않습니다.');
        return;
    }

    // 위치 정보 접근 권한 상태 확인
    navigator.permissions.query({ name: 'geolocation' }).then(function(result) {
        if (result.state === 'granted') {
            // 권한이 이미 허용된 경우
            getCurrentLocation();
        } else if (result.state === 'prompt') {
            // 권한 요청 대기 중인 경우
            console.log('위치 정보 접근 권한을 요청합니다.');
            getCurrentLocation();
        } else if (result.state === 'denied') {
            // 권한이 거부된 경우
            console.log('위치 정보 접근이 거부되었습니다. 브라우저 설정에서 위치 정보 접근을 허용해주세요.');
            // 서울시청 좌표로 지도 중심 이동
            const seoulCityHall = new kakao.maps.LatLng(37.566826, 126.978656);
            map.setCenter(seoulCityHall);
        }
    });
}

// 전역에 닫기 함수 추가 (window에 등록)
window.closeCafeRoute = function(button) {
    // 모든 인포윈도우 닫기
    infowindows.forEach((iw) => {
        iw.close();
    });
    
    // 현재 경로 제거
    if (currentRoute) {
        currentRoute.setMap(null);
        currentRoute = null;
    }
    
    // 현재 경로 정보창 닫기
    if (currentRouteInfo) {
        currentRouteInfo.close();
        currentRouteInfo = null;
    }
};

// 주변 카페/커피점 검색 함수 (100m 반경)
function searchNearbyCafes() {
    if (!currentPosition) {
        customPopup.show('위치 정보 없음', '먼저 현재 위치를 확인해주세요.', '#0066CC');
        return;
    }

    console.log('현재 위치에서 카페 검색 시작:', currentPosition);

    // 기존 마커와 인포윈도우 제거
    removeMarkers();

    const places = new kakao.maps.services.Places();
    const allResults = []; // 모든 검색 결과를 저장할 배열
    
    // 주요 프랜차이즈 키워드 (간소화)
    const franchiseKeywords = [
        '스타벅스',
        '투썸플레이스',
        '할리스커피',
        '이디야커피',
        '메가MGC커피',
        '빽다방',
        '커피에반하다',
        '커피빈',
        '엔제리너스',
        '파스쿠찌',
        '카페베네',
        '드롭탑',
        '커피스미스'
    ];
    
    let searchCount = 0;
    const totalSearches = franchiseKeywords.length + 1; // +1은 일반 카페 검색
    
    // 검색 완료 후 마커 생성 함수
    function createCafeMarkers() {
        searchCount++;
        console.log(`검색 진행률: ${searchCount}/${totalSearches}`);
        
        if (searchCount < totalSearches) return; // 모든 검색이 완료될 때까지 대기
        
        console.log('모든 검색 완료, 결과 처리 시작');
        console.log('총 검색 결과:', allResults.length);
        
        // 중복 제거 (같은 장소명과 주소)
        const uniqueResults = [];
        const seen = new Set();
        
        allResults.forEach(place => {
            const key = `${place.place_name}_${place.road_address_name || place.address_name}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueResults.push(place);
            }
        });
        
        console.log('중복 제거 후 결과:', uniqueResults.length);
        
        // 카페 필터링 및 거리 계산
        const cafeResults = uniqueResults.filter(place => {
            // 카테고리 또는 장소명으로 카페 확인
            const isCafe = place.category_group_code === 'CE7' || 
                          place.category_group_name?.includes('카페') ||
                          place.category_group_name?.includes('커피') ||
                          place.place_name?.includes('카페') ||
                          place.place_name?.includes('커피') ||
                          franchiseKeywords.some(keyword => 
                              place.place_name?.includes(keyword)
                          );
            
            if (isCafe) {
                // 현재 위치에서의 거리 계산
                const distance = calculateDistance(
                    currentPosition.lat, 
                    currentPosition.lng, 
                    parseFloat(place.y), 
                    parseFloat(place.x)
                );
                console.log(`${place.place_name}: ${distance}m`);
                return distance <= 100; // 100m 이내만 포함
            }
            return false;
        });
        
        console.log(`100m 내 카페 ${cafeResults.length}개 발견`);
        
        if (cafeResults.length === 0) {
            console.log('100m 반경 내에 카페/커피점이 없습니다.');
            return;
        }
        
        // 검색 결과 마커 표시
        cafeResults.forEach((place) => {
            const marker = new kakao.maps.Marker({
                position: new kakao.maps.LatLng(place.y, place.x),
                map: map
            });

            // 마커 클릭 시 카카오맵 상세페이지로 이동
            kakao.maps.event.addListener(marker, 'click', function() {
                // 기존 InfoWindow 모두 닫기
                infowindows.forEach((iw) => iw.close());
                // 도보 예상 시간 계산 (평균 도보 속도: 4km/h, 직선거리의 1.3배 보정)
                const distance = calculateDistance(
                    currentPosition.lat,
                    currentPosition.lng,
                    parseFloat(place.y),
                    parseFloat(place.x)
                );
                const walkingDistance = distance * 1.3; // 보정값 적용
                const walkingSpeed = 67; // m/분 (4km/h)
                const walkingTimeMinutes = Math.round(walkingDistance / walkingSpeed);
                const placeId = place.id || place.place_id;
                const kakaoMapUrl = placeId ? `https://place.map.kakao.com/${placeId}` : null;
                const infoHtml = `
                    <div style='padding:8px;min-width:200px;'>
                        <b>${place.place_name}</b><br>
                        ${place.road_address_name || place.address_name}<br>
                        ${place.phone || ''}<br>
                        <span style='color:#0066CC;font-size:12px;'>도보 약 ${walkingTimeMinutes}분</span><br>
                        ${kakaoMapUrl ? `<button onclick=\"window.open('${kakaoMapUrl}', '_blank')\" style='margin-top:6px;padding:4px 10px;background:#007bff;color:white;border:none;border-radius:3px;font-size:12px;cursor:pointer;'>카카오맵 상세보기</button>` : ''}
                    </div>
                `;
                const infoWindow = new kakao.maps.InfoWindow({
                    position: marker.getPosition(),
                    content: infoHtml
                });
                infoWindow.open(map, marker);
                // 현재 열린 InfoWindow만 배열에 저장
                infowindows.length = 0;
                infowindows.push(infoWindow);
            });
            markers.push(marker);
        });
        
        // 검색 결과가 있는 경우 지도 중심 이동
        if (cafeResults.length > 0) {
            const bounds = new kakao.maps.LatLngBounds();
            cafeResults.forEach((place) => {
                bounds.extend(new kakao.maps.LatLng(place.y, place.x));
            });
            // 현재 위치도 포함
            bounds.extend(new kakao.maps.LatLng(currentPosition.lat, currentPosition.lng));
            map.setBounds(bounds);
            
            console.log(`✅ 100m 반경 내에서 ${cafeResults.length}개의 커피점을 찾았습니다.`);
        }
    }
    
    // 일반 카페 검색
    places.keywordSearch('카페', (results, status) => {
        console.log('일반 카페 검색 결과:', status, results?.length || 0);
        
        if (status === kakao.maps.services.Status.OK && results) {
            allResults.push(...results);
            console.log('일반 카페 검색 결과:', results.length, '개');
        }
        createCafeMarkers();
    }, {
        location: new kakao.maps.LatLng(currentPosition.lat, currentPosition.lng),
        radius: 100,
        size: 15
    });
    
    // 각 프랜차이즈 키워드로 검색
    franchiseKeywords.forEach((keyword) => {
        console.log(`"${keyword}" 키워드로 검색 시작`);
        
        places.keywordSearch(keyword, (results, status) => {
            console.log(`"${keyword}" 검색 결과:`, status, results?.length || 0);
            
            if (status === kakao.maps.services.Status.OK && results) {
                allResults.push(...results);
                console.log(`"${keyword}" 키워드 검색 결과: ${results.length}개`);
            }
            createCafeMarkers();
        }, {
            location: new kakao.maps.LatLng(currentPosition.lat, currentPosition.lng),
            radius: 100,
            size: 15
        });
    });
}

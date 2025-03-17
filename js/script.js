new WOW().init();


$(window).load(function () {
    mobile();
    swiper.autoplay.stop();
    setTimeout(function () {
        $(".main_visual").addClass("on");
        swiper.autoplay.start()
    }, 100);



});

$('.re-comt select').click(function () {
    $(this).toggleClass('on')
})





// main swiper----------------
var swiper = new Swiper(".mySwiper", {
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
    },
    loop: true,
    speed: 1500,
    autoplay: true,
});
$('button.swiper-play').click(function () {
    $(this).toggleClass('on')

    if ($(this).hasClass('on')) {
        swiper.autoplay.stop();
    } else {
        swiper.autoplay.start();
    }
})

// popup

$('.close_popup').on('click', function (e) {
    e.preventDefault();
    $(this).parents(".pop").fadeOut();
    $('.img_gallery_slider').slick('slickRemove', null, null, true)
    $('.img_nav_slider').slick('slickRemove', null, null, true)
    $('.img_gallery_slider').html("")
    $('.img_nav_slider').html("")
    closePop();
})

$('.more').on('click', function (e) {
    e.preventDefault();
    $(".pop.collection").fadeIn();
    openPop()
})

$('.gallery_list li').on('click', function (e) {
    $(".img_gallery_slider").slick('refresh');
    $(".img_nav_slider").slick('refresh');
    $('.img_gallery_slider').trigger('resize');
    $('.img_nav_slider').trigger('resize');
    $('.img_nav_slider').slick('slickGoTo', 1);
    $('.img_gallery_slider').slick('slickGoTo', 1);
    e.preventDefault();

    // $(".pop.gallery_pop").fadeIn();

    // openPop()
})


$('.img_gallery_slider').slick({
    slide: 'li',
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 5000,
    asNavFor: '.img_nav_slider',
    responsive: [
        {
            breakpoint: 850,
            settings: {
                slidesToShow: 1
            }
        },

    ]
});
$('.img_nav_slider').slick({
    arrows: false,
    variableWidth: true,
    slidesToShow: 'auto',
    slidesToScroll: 1,
    asNavFor: '.img_gallery_slider',
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
// 파트너 슬라이더
var partnerSwiper = new Swiper(".partners_row", {
    loop: true,
    slidesPerView: 5.8,
    spaceBetween: 120,
    autoplay: {
        delay: 5000,
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

    },
});

function openPop() {
    $('html').addClass('hidden');
};

function closePop() {
    $('html').removeClass('hidden');
    // document.pop_fwrite.reset();
};

$('.pop-exam').on('click', function (e) {
    e.preventDefault();
    // get_popup_data($(this).attr('data-idx'));
    $(".noti").fadeIn();
    openPop();

});

$('.agree_pop').on('click', function (e) {
    e.preventDefault();
    // get_popup_data($(this).attr('data-idx'));
    $(".collection").fadeIn();
    openPop();
});

$('.Terms_pop').on('click', function (e) {
    e.preventDefault();
    // get_popup_data($(this).attr('data-idx'));
    $(".Terms").fadeIn();
    openPop();
});


$('.sym_tab .tab_btn').on('click', function () {
    var idx = $(this).index();

    $(this).addClass('on').siblings().removeClass('on');

    var onTxt = $('.sym_tab .tab_btn.on').text()

    $('#symptom .sec_ttl h2').text(onTxt)

    $('.sym_tab_box').removeClass('on')
    $('.sym_tab_box').eq(idx).addClass('on')
})



{
    $('.repair_nav ul li a').click(function (e) {
        e.preventDefault();
        let target = this.hash;
        $('html, body').animate({
            'scrollTop': $(target).offset().top
        })
    })

    $('.gnb ul li a').click(function (e) {
        e.preventDefault();
        let target = this.hash;
        $('html, body').animate({
            'scrollTop': $(target).offset().top
        })
    })
}

// repair nav


// 모바일 햄버거버튼
$('.ham_btn').on('click', function () {
    $(this).toggleClass('on');
    $('.all_menu').toggleClass('open');
    $('#header').toggleClass('open');
    $('html').toggleClass('hidden');
})

// 모바일 전체메뉴 클릭시
$('.all_menu li a').on('click', function () {
    setTimeout(function () {
        $('.ham_btn').toggleClass('on');
        $('.all_menu').toggleClass('open');
        $('#header').toggleClass('open');
        $('html').toggleClass('hidden');
    })

})

$('.member_btn').on('click', function () {
    $(this).toggleClass('on')
    $(this).siblings().toggleClass('on')

    if ($(this).hasClass("on") === true) {
        $('html').addClass('hidden');

    } else {

        $('html').removeClass('hidden');
    }


})


// 실시간 처리현황 
setInterval(function () {
    const boxIn = $('#live .boxIn');
    const boxRow = $('.boxIn li:first');
    const ARea = function () {
        boxRow.appendTo(boxIn).show(300);
    };
    $(boxRow).hide(300, ARea);
}, 3000);

//function todayIn() {
//       let today = new Date();   
//    let year = today.getFullYear();
//    let month = today.getMonth() + 1;  
//    let date = today.getDate();  
//document.write(`${year}-${month}-${date}`)
//}


// anidiv-----------------------------------
// var aniDiv = document.querySelectorAll(".ani_div");
// var aniDivArry = new Array();

// Array.prototype.forEach.call(aniDiv, function (ele) {
//     aniDivArry.push(ele);
// });

// $(window).on('scroll', function () {
//     var scrollTop = $(window).scrollTop(),
//         windowH = $(window).height() / 3 * 2;

//     for (var i = 0; i < aniDivArry.length; i++) {
//         if ($(aniDivArry[i]).offset().top < scrollTop + windowH) {
//             $(aniDivArry[i]).addClass('on');

//             aniDivArry.splice(i, 1);
//         }
//     }

// });
function mobile() {
    if ($(window).width() < 851) {
        $('.service_item li').attr('data-wow-delay', 0);

    }
}

$(function () {
    const rightLi = $('.right_content ul li');
    $(rightLi).on('mouseenter', function () {
        let item = $(this).find('.re_bg').attr('src');
        if (item == "") {
            $(this).find('.re_bg').hide();
        }
        console.log(item);
    });

})

function heightV() {
    const rightLi = $('.right_content ul li');
    let liW = $(rightLi).width();
    let liH = $(rightLi).height();
    let imgSrc = $(rightLi).find('.re_bg').attr('src');

    console.log(liW, liH, imgSrc)

    $('.right_content ul li').css({
        'height': liW
    })

};
heightV();


$(window).resize(function () {
    // introBgChange();
    heightV();
    mobile();
})



// function mobileF() {
//     const repair = document.querySelectorAll('.repair');

//     const repairItem = repair.querySelectorAll('li');
//     let repairLast = repair.querySelectorAll('ul li:last-child')
//     let itemidx = getIndex(repairItem);

//     if(repairLast(itemidx) % 2 == 1){
//         console.log('ghfghf')
//     }
//    $('.repair').addClass('on')
// }

// $(window).resize(function () {
//     let widW = $(this).width();

//     if(widW <= 850){
//         $('.repair').addClass('on')
//     }else{
//         $('.repair').removeClass('on')
//     }

// });
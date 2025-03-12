setInterval(()=>{
    let first_li = document.querySelector("#process_ul").children[0];
    first_li.remove();
    document.querySelector("#process_ul").appendChild(first_li);
},3000);
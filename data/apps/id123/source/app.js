var $ = require("jquery");
var window=require("window");
var document=require("document");
var pine=require("pine");
var win=require("win");

$("#bdy").html(
'<div>  Hello</div>'
);









/*
pine.isDarkMode((is)=>{
if(is){
  document.getElementById("all").style.backgroundColor="#272727";
}
})
*/
notify=()=>{
  let myNotification = new Notification('Amy Stone', {
    body: 'TEXT: Meet me in 15min'
  })
  
  myNotification.onclick = () => {
    console.log('Notification clicked')
  }
}

//$("#notifyButt").click(notify);


 // document.getElementById('infobox').innerHTML=pine.info();

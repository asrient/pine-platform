function sayHi(boxId){
    pine.box.send(boxId,'hi!','hello from background!');
}

pine.box.on('hello back!',(data)=>{
console.log('hello back received from',data.from,data.body);
})

function setUpShowCase(){
//var appsFile=new nedb({ filename: dir+'/data/core/apps.txt', autoload: true });
}

pine.box.on('open-app',(data)=>{
    pine.openAppById(data.body,(r)=>{
        console.log('open tried',r);
        });
    })

var showCase=pine.store("showCase.txt");

showCase.count({},(err,c)=>{
if(err==null){
if(c){
    console.log('all good!',c);
}
else{
    console.log('no records in showCase, reading from apps.txt');
    setUpShowCase();
}
}
else{
    console.log('could not read showCase file')
}
})



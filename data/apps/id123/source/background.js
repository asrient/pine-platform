
console.log('bg dir:',__dirname);


 ///////////////
 function sayHi(boxId){
    pine.box.send(boxId,'hi!','hello from background!');
}

pine.box.on('hello back!',(data)=>{
console.log('hello back received from',data.from,data.body);
//sayHi(data.from)
})

 /*  setTimeout(function(){
       console.log('checking for new boxes..');
       pine.apis.get('getBoxes',null,(ids)=>{    
       if(ids.length){
           console.log('a box found!');
           sayHi(ids[0]);
       }
   else{
       console.log('no boxes attached yet');
   }
})
   },2000)*/




   /*
   ////OPEN CLOSE WINDOW
pine.box.on('opened',(details)=>{
    console.log('new box opened!',details.from);
})

pine.box.on('closed',(details)=>{
    console.log('new box closed!',details.from);
})

pine.box.add((bid)=>{
if(bid!=null){
    console.log('box added successfully',bid);
    setTimeout(()=>{pine.box.remove(bid)},5000)
}
})
*/




///IAC ECHO


pine.iac.request('lol.pine.about','echo','ping',{file:'big.txt',mode:'w'},(client,body,file)=>{
console.log('echo received!',body)
if(file!=null){
    console.log('got file access',file.mode);
    if(file.mode=='r'){
        file.read((err,r)=>{
            console.log('file received: ',err,r)
        },'utf-8')
    }
}
})

pine.iac.set('echo',(client,body,file,done)=>{
console.log('echo req received',body);
if(file!=null){
    console.log('got file access',file.mode);
    if(file.mode=='w'){
        file.write('eryh5rtjuit7yijk yjuyiokjyth rjhuyf',(err,r)=>{
            console.log('file written',err,r)
        })
    }
}
done('pong',{file:'big.txt',mode:'r'});
})




/*
///DATASTORE

db=pine.dataStore('conf');

var doc = { hello: 'world'
               , n: 5
               , today: new Date()
               , nedbIsAwesome: true
               , notthere: null
               , notToBeSaved: undefined  // Will not be saved
               , fruits: [ 'apple', 'orange', 'pear' ]
               , infos: { name: 'nedb' }
               };

db.insert(doc, function (err, newDoc) {   
    console.log('inserted!',err);
});

db.find({ }, function (err, docs) {
    console.log(docs);
  });
*/




///////////////////
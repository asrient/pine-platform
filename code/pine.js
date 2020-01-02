const { app, BrowserWindow, Tray, systemPreferences } = require('electron');
const fs=require('fs');
var backyard=null;
//var prompt=require('./prompts/prompt.js');
var setupRequired=false;
var dirResolved=false;
var appReady=false;

var dataDir=app.getPath('home')+'/Pine';

fs.readdir(dataDir,(err,info)=>{
  if(err==null){
    console.log(info)
   if(info.includes('redirect.txt')){
     fs.readFile(dataDir+'/redirect.txt','utf-8',(err,r)=>{
      if(err!=null){
       forceQuit();
      }
      else{
       dataDir=r;
       dirResolved=true;
       console.log('redirected dir:',dataDir);
    TryInit();
      }
     })
   }
   else if(info.includes('data')){
    dirResolved=true;
    TryInit();
   }
   else{
     forceQuit();
   }
  }
  else{
    setupRequired=true;
    dirResolved=true;
    TryInit();
  }
})



function init(){
  if(setupRequired){
    console.log('setup required');
    
    }
    else{
  backyard=require("./host/backyard.js")({dataDir});
 showLaunchPad();
}
}

function TryInit(){
if(dirResolved&&appReady){
  init();
}
}


app.name="Pine";
app.clearRecentDocuments();
const gotTheLock=app.requestSingleInstanceLock();


showLaunchPad=()=>{
  backyard.openApp('launchpad',(r)=>{
       if(!r){
         //forceQuit();
       }
        })

}



if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if(!setupRequired)
    { showLaunchPad();}
  })
}

app.commandLine.appendSwitch('enable-transparent-visuals');

app.on('ready',()=>{
  appReady=true;
  TryInit();
});


app.on('window-all-closed', (e) =>{ 
  e.preventDefault()
})



app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
if(!setupRequired)
   { showLaunchPad();}
})

forceQuit=()=>{
  app.quit();
}
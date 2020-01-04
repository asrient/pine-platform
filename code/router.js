/**
 * @ASRIENT 4.1.20
 */
const fs = require('fs');
const electron = require('electron');
const crypto = require('crypto');
const { fork } = require('child_process');
var Emitter = require('component-emitter');
var Datastore = require('nedb');

var dir = electron.app.getAppPath();
var dataDir = null;
var appsFile = null;


var app=null;

function createWindow(){
    var props = {
        width: 1060,
        height: 640,
        show: true,
        transparent: false,
        opacity: 1,
        title: app.info.name,
        minHeight: 20,
        minWidth: 40,
        frame: false,
        icon: dataDir + '/apps/' + app.id + '/source/' + app.info.icon,
        webPreferences: {
            nodeIntegration: false,
            webSecurity: true,
            allowRunningInsecureContent: false,
            experimentalFeatures: true,
            partition: app.id 
        }
    }
    var box = new electron.BrowserWindow(props);
    

    box.webContents.session.protocol.registerFileProtocol('common', (req, cb) => {
    var url = req.url.substr(9);
    cb( dataDir + '/shared/' + url);
})


box.webContents.session.protocol.registerFileProtocol('source', (req, cb) => {
    var url = req.url.substr(9);
    if(url=='root'){
        cb(dataDir + '/apps/' + app.id + '/source/' + app.info.entry);
    }
    else{
        cb(dataDir + '/apps/' + app.id + '/source/' + url);
    }
})

box.webContents.session.protocol.registerFileProtocol('files', (req, cb) => {
    var url = req.url.substr(8);
    //console.log('req url:',url);
    cb( dataDir + '/apps/' + app.id + '/files/' + url);
})


box.loadURL('file://root');

box.webContents.session.protocol.interceptFileProtocol('file',(req,cb)=>{
    var url = req.url.substr(7);
    console.log('--ACCESS FILE--',url);
    if(url=='root'||url=='root/'){
        cb(dir+'/ghost/ghost.html');
    }
    else{
         cb( dataDir + '/apps/' + app.id + '/files/' + url);
    }
})
}


var router={
openApp:function(appId){
    app={
        id:appId
    }
    appsFile.findOne({id:appId},(err,rec)=>{
      if(err==null&&rec!=null){
        app.info=rec;
        createWindow();
      }
      else{
          console.error("Cant find app in db");
      }
    })
}
}


module.exports = function (vars) {
    dataDir = vars.dataDir;
    appsFile = new Datastore({ filename: dataDir + '/core/apps.txt', autoload: true });
    return router;
}
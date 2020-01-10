/**
 * @ASRIENT 9.1.20
 * Service to create a new window
 */
const fs = require('fs');
var electron = require('electron');
const crypto = require('crypto');

const winObj = require('./winObjCutter.js');

if(electron.remote!=undefined){
    electron=electron.remote;
}

var dir = electron.app.getAppPath();
var app=null;
var dataDir=null;

function api (){
    const pRand = crypto.randomBytes(2).toString();
    var props = {
        width: 1060,
        height: 640,
        show: true,
        transparent: false,
        opacity: 1,
        title: app.name,
        minHeight: 20,
        minWidth: 40,
        frame: false,
        icon: dataDir + '/apps/' + app.id + '/source/' + app.icon,
        webPreferences: {
            nodeIntegration: false,
            webSecurity: true,
            allowRunningInsecureContent: false,
            experimentalFeatures: true,
            partition: app.id+pRand,
            preload: dir + '/ghost/preload.js'
        }
    }

    var box = new electron.BrowserWindow(props);

    box.webContents.session.protocol.registerFileProtocol('common', (req, cb) => {
        var url = req.url.substr(9);
        cb(dataDir + '/shared/' + url);
    })

    box.webContents.session.protocol.registerFileProtocol('source', (req, cb) => {
        var url = req.url.substr(9);
        if (url == 'root') {
            cb(dataDir + '/apps/' + app.id + '/source/' + app.entry);
        }
        else {
            cb(dataDir + '/apps/' + app.id + '/source/' + url);
        }
    })

    box.webContents.session.protocol.registerFileProtocol('files', (req, cb) => {
        var url = req.url.substr(8);
        //console.log('req url:',url);
        cb(dataDir + '/apps/' + app.id + '/files/' + url);
    })

    box.loadURL('file://root');

    box.webContents.session.protocol.interceptFileProtocol('file', (req, cb) => {
        var url = req.url.substr(7);
        console.log('--ACCESS FILE--', url);
        if (url == 'root' || url == 'root/') {
            cb(dir + '/ghost/ghost.html');
        }
        else {
            cb(dataDir + '/apps/' + app.id + '/source/' + url);
        }
    })

    return winObj(box);
}

module.exports = function (appRec,dDir) {
    app=appRec;
    dataDir=dDir;
    return api;
}
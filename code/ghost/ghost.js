/**
 * @ASRIENT 29 July 19
 */

const host = require('electron');
const fs = require('fs');
const $ = require('jquery');
var handlers = require('./apiHandler.js');
var Datastore = require('nedb');
var path = require('path');

var dir = host.remote.app.getAppPath();
var dataDir=null;



var win = host.remote.getCurrentWindow();

win.setContentProtection(false);


const ipc = host.ipcRenderer;

var appId = null;
var isReady = false;
var appRec = null;
var boxId = null;

/*
win.webContents.session.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    details.requestHeaders['User-Agent'] = "Pine" ;
    details.requestHeaders['Origin'] = "source://bot.txt" ;
    callback({ cancel: false, requestHeaders: details.requestHeaders });
});
*/

win.webContents.session.protocol.registerFileProtocol('common', (req, cb) => {
    var url = req.url.substr(8);
    //console.log('req url:',url);
    cb(dataDir + '/data/files/common/' + url);
})


win.webContents.session.protocol.registerFileProtocol('source', (req, cb) => {
    var url = req.url.substr(8);
    //console.log('req ',req.headers['User-Agent']);
    cb(dataDir + '/data/files/' + appId + '/' + url);
})

win.webContents.session.protocol.registerFileProtocol('files', (req, cb) => {
    var url = req.url.substr(7);
    //console.log('req url:',url);
    cb(dataDir + '/data/appData/files/' + appId + '/' + url);
})
var filter = {
    urls: ["file://*"]
};
win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
       // 'Content-Security-Policy': ['default-src \'none\'']
      }
    })
  })

ipc.on('open', (event, message) => {
    appId = message.appId;
    boxId = message.boxId;
    appRec = message.appRec;
    dataDir = message.dataDir;
             TryInit();
})



$(document).ready(function () {
    isReady = true;
    TryInit();
});

function TryInit() {
    if (appId != null&&appRec != null && isReady) {
        console.log('Opened as: ',appId);
         document.getElementById("APP_BOX").setAttribute("src", 'source://' + appRec.entry);
        win.show();
        handlers.init(appId, boxId, appRec,dataDir);
    }
}


/**
 * @ASRIENT 8.1.20
 * Code to run the app background script in sandbox
 */

const fs = require('fs');
const electron = require('electron');
const { NodeVM } = require('vm2');

const apis = require('../services/shared.js');

var dir = electron.app.getAppPath();
var dataDir = null;
var app = null;

function run() {
    const pine = apis(app, dataDir);
    pine.ipc = {
        on: function (event, cb) {
            electron.ipcMain.on(event, (e, args) => {
                //disable webContents
                e.sender = undefined;
                cb(e, args);
            })
        },
        once: function (event, cb) {
            electron.ipcMain.once(event, (e, args) => {
                //disable webContents
                e.sender = undefined;
                cb(e, args);
            })
        },
        sendTo: function(webId,event,args){
            electron.webContents.fromId(webId).send(event,args);
        },
        removeListener: electron.ipcMain.removeListener,
        removeAllListeners: electron.ipcMain.removeAllListeners
    }
    const vm = new NodeVM({
        console: 'inherit',
        sandbox: {},
        require: {
            external: true,
            mock: { pine }
        }
    });
    fs.readFile(dataDir + '/apps/' + app.id + '/source/' + app.background, function (err, code) {
        if (err != null) {
            console.error("cant read background file", err)
        }
        else {
            code = "const pine=require('pine');" + code;
            vm.run(code);
        }
    })
}

module.exports = function (appRec, dDir) {
    dataDir = dDir;
    app = appRec;
    return { run }
}
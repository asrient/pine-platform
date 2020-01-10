/**
 * @ASRIENT 4.1.20
 */
const fs = require('fs');
const electron = require('electron');
const crypto = require('crypto');
const { fork } = require('child_process');
var Emitter = require('component-emitter');
var Datastore = require('nedb');

var background = require('./ghost/background.js');
var createWindow = require('./services/createWindow.js');

var dir = electron.app.getAppPath();
var dataDir = null;
var appsFile = null;
var app = null;
var appId = null;


var router = {
    createWindow: function () {
        if (app != null)
            createWindow();
    }
}


module.exports = function (id, dDir, cb) {
    dataDir = dDir;
    appId = id;
    global.dataDir = dataDir;

    appsFile = new Datastore({ filename: dataDir + '/core/apps.txt', autoload: true });
    appsFile.findOne({ id: appId }, (err, rec) => {
        if (err == null && rec != null) {
            app = rec;
            global.app = app;
            background = background(app, dataDir);
            background.run();
            createWindow = createWindow(app, dataDir);
            cb(router);
        }
        else {
            console.error("Cant find app in db");
        }
    })
}
/**
 * @ASRIENT 4.1.20
 */
const fs = require('fs');
const electron = require('electron');
const crypto = require('crypto');
const { fork } = require('child_process');
var Emitter = require('component-emitter');
var Datastore = require('nedb');

var createWindow = require('./services/createWindow.js');

var dir = electron.app.getAppPath();
var dataDir = null;
var appsFile = null;
var app = null;
var appId = null;

module.exports = function (id, dDir) {
    dataDir = dDir;
    appId = id;
    global.dataDir = dataDir;

    appsFile = new Datastore({ filename: dataDir + '/core/apps.txt', autoload: true });
    appsFile.findOne({ id: appId }, (err, rec) => {
        if (err == null && rec != null) {
            app = rec;
            global.app = app;
            createWindow = createWindow(app, dataDir);
            createWindow();
        }
        else {
            console.error("Cant find app in db");
        }
    })
}
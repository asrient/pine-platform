/**
 * @ASRIENT 14.1.20
 * Provides api to open a pine app
 */
const { remote, shell } = require('electron');
const { spawn } = require("child_process");
var Datastore = require('nedb');

const exePath = remote.app.getPath('exe');
const resPath = remote.app.getAppPath();

var dataDir = null;

function open(ns) {
    var appsFile = new Datastore({ filename: dataDir + '/core/apps.txt', autoload: true });
    appsFile.findOne({ name_space: ns }, (err, rec) => {
        if (err == null && rec != null) {
            openById(rec.id);
        }
        else {
            console.error("Cant find app in db");
        }
    })
}

function openById(id) {
    spawn(exePath, [resPath, id]);
    //remote.app.relaunch({ args: process.argv.slice(1) })
}

module.exports = function (dDir) {
    dataDir = dDir;
    return ({ open, openById })
};


/**
 * @ASRIENT 14.1.20
 * Provides apis to open a pine app
 */
const { remote, shell } = require('electron');
const { exec } = require("child_process");
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
    exec(exePath+' '+resPath+' '+ id);
}

module.exports = function (dDir) {
    dataDir = dDir;
    return ({ open, openById })
};


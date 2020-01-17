/**
 * @ASRIENT 17.1.20
 * Provides apis to create a new app shortcut
 */

const { remote, shell } = require('electron');
var Datastore = require('nedb');
const fs = require('fs');

var dataDir = null;

const exePath = remote.app.getPath('exe');
const resPath = remote.app.getAppPath();

function add(id, cb = function () { }) {

    var appsFile = new Datastore({ filename: dataDir + '/core/apps.txt', autoload: true });

    appsFile.findOne({ id }, (err, rec) => {
        if (err == null) {
            var res = shell.writeShortcutLink(process.env.APPDATA + '/Microsoft/Windows/Start Menu/Programs/' + rec.name + '.lnk',
                { target: exePath, args: resPath + ' ' + id })
            cb(res);
        }
    })
}

function remove(id, cb = function () { }) {
    var appsFile = new Datastore({ filename: dataDir + '/core/apps.txt', autoload: true });
    appsFile.findOne({ id }, (err, rec) => {
        if (err == null) {
            var loc = process.env.APPDATA + '/Microsoft/Windows/Start Menu/Programs/' + rec.name + '.lnk';
            fs.unlink(loc, cb)
        }
    })
}

module.exports = function (dDir) {
    dataDir = dDir;
    return ({ add, remove })
};
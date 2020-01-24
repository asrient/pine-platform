const fs = require('fs');
var zlib = require('zlib');
var tar = require('tar');
const crypto = require('crypto');
var Datastore = require('nedb');

const exePath = electron.remote.app.getPath('exe');
const codeDir = electron.remote.app.getAppPath();
const homeDir = electron.remote.app.getPath('home');

var dataDir = homeDir;

function extract(to, cb) {
    tar.x({
        cwd: to,
        file: codeDir + '/data.tar'
    }).then(cb);
}
//extract(baseDir + '/Pine',cb)
function prepareFolder(baseDir, cb) {
    fs.mkdir(baseDir + '/Pine', { recursive: true }, cb);
}

function addShortcuts(cb) {
    var appsFile = new Datastore({ filename: dataDir + '/core/apps.txt', autoload: true });
    appsFile.find({}, (err, recs) => {
        if (err == null) {
            recs.forEach((rec) => {
                electron.shell.writeShortcutLink(process.env.APPDATA + '/Microsoft/Windows/Start Menu/Programs/' + rec.name + '.lnk',
                    { target: exePath, args: codeDir + ' ' + rec.id })
            })
            cb();
        }
    })
}

function start(pth, cb) {
    dataDir = pth + '/Pine';
    prepareFolder(homeDir, () => {
        if (pth == homeDir) {
            //to the stored in default dir, no redirect needed
            extract(homeDir + '/Pine', cb);
        }
        else {
            //redirect needed
            prepareFolder(pth, () => {
                extract(pth + '/Pine', () => {
                    //now write the redirect.txt in home dir
                    fs.writeFile(homeDir + '/Pine/redirect.txt', pth + '/Pine','utf8', cb)
                });
            })
        }
    })
}

$("#loc-txt").html(dataDir);

$('#cncl-btn').click(() => {
    win.destroy();
})

$('#cls-btn').click(() => {
    win.destroy();
})

$('#chng-btn').click(() => {
    electron.remote.dialog.showOpenDialog( {
        title: 'Store pine data in',
        properties: ['openDirectory', 'createDirectory'],
        defaultPath: dataDir,
        buttonLabel: 'Choose'
    }).then(res => {
        if(!res.canceled){
             dataDir = res.filePaths[0];
        $("#loc-txt").html(dataDir);
        console.log('Data dir updated', dataDir);
        }
       else{
           console.log('edit data dir canceled');
       }
    })
})

function done() {
    $("#b1-txt").html("Done");
    $("#b2-s2").css({ display: 'none' });
    $("#b2-s3").css({ display: 'grid' });
}

$('#install-btn').click(() => {
    $("#b1-txt").html("Installing Pine");
    $("#b2-s1").css({ display: 'none' });
    $("#b2-s2").css({ display: 'flex' });
    start(dataDir, () => {
        addShortcuts(() => {
            done();
        })
    })
})
const fs = require('fs');
var zlib = require('zlib');
var tar = require('tar');
const crypto = require('crypto');

const codeDir = electron.remote.app.getAppPath();
const homeDir = electron.remote.app.getPath('home');

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

function start(pth, cb) {
    prepareFolder(homeDir, () => {
        if (pth == homeDir) {
            //to the stored in default dir, no redirect needed
            extract(homeDir + '/Pine', cb);
        }
        else {
            //redirect needed
            prepareFolder(pth,()=>{
                extract(pth + '/Pine', ()=>{
                    //now write the redirect.txt in home dir
                    fs.writeFile(homeDir+'/Pine',pth+'/Pine',cb)
                });
            })
        }
    })
}

$("#loc-txt").html(homeDir);

$('#cncl-btn').click(()=>{
    win.destroy();
})

$('#cls-btn').click(()=>{
    win.destroy();
})

$('#install-btn').click(()=>{
    $("#b1-txt").html("Installing Pine");
    $("#b2-s1").css({display:'none'});
    $("#b2-s2").css({display:'flex'});
    start(homeDir,()=>{
        $("#b1-txt").html("Done");
    $("#b2-s2").css({display:'none'});
    $("#b2-s3").css({display:'grid'});
    })
})
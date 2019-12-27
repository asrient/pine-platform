const fs = require('fs');
var zlib = require('zlib');
var tar = require('tar');
const crypto = require('crypto');
var Emitter = require('component-emitter');
var Datastore = require('nedb');

var appsFile = null;
var showCase = null;
var nameSpaces = null;
var dataDir = null;

function newId(len = 7) {
    return crypto.randomBytes(len).toString('hex')
}

/** 
 @pram appId: of the source
 @pram path: absolute path of .pine file
 @pram callback
*/

function setupAppData(id, cb) {
    fs.mkdir(dataDir + '/data/appData/db/' + id, { recursive: true }, (err) => {
        fs.mkdir(dataDir + '/data/appData/files/' + id, { recursive: true }, (err) => {
            cb();
        })
    })
}

function register(id, rec, cb) {
    appsFile.insert(rec, (err, r) => {
        if (err == null) {
            var scRec = {
                "id": rec.id,
                "name": rec.name,
                "name_space": rec.name_space,
                "icon": rec.icon,
                "app_type": rec.app_type,
                "alwaysOn": rec.alwaysOn
            }
            showCase.insert(scRec, (err, r) => {
                if (err == null) {
                    fs.copyFile(dataDir + '/data/files/' + id + '/' + rec.icon, dataDir + '/data/appData/files/launchpad/appIcons' + id + '.png', (err) => {
                        var nsRec = { "id": rec.id, "name": rec.name, "name_space": rec.name_space }
                        nameSpaces.insert(nsRec, (err, r) => {
                            if (err == null) {
                                console.log('App sucessfully installed');
                                cb(id);
                            }
                            else {
                                rollback(id);
                                cb(null);
                            }
                        })
                    });
                }
                else {
                    rollback(id);
                    cb(null);
                }
            })
        }
        else {
            rollback(id);
            cb(null);
        }
    })
}


function validate(id, conf, cb) {
    var rec = {
        id,
        name: conf.name,
        icon: conf.icon,
        entry: conf.entry,
        background: conf.background,
        added_on: new Date().getTime(),
        version: conf.version || '1.0',
        name_space: conf.name_space || 'app.' + name + '.' + id,
        prefer_single_window: conf.prefer_single_window || false,
        prefer_theme: conf.prefer_theme || 'light',
        show_on_launchpad: true,
        app_type: conf.app_type || 'normal',
        required_modules: conf.required_modules || [],
        alwaysOn: conf.always_on || false,
        settings: { alwaysOn: true }
    };

    appsFile.findOne({ name_space: rec.name_space }, { id: 1 }, (err, r) => {
        if (r != null) {
            //namespace already taken
            rollback(id);
            cb(null);
        }
        else {
            //ns available
            if (typeof rec.alwaysOn == 'boolean' &&
                typeof rec.name_space == 'string' &&
                typeof rec.version == 'string' &&
                typeof rec.prefer_single_window == 'boolean'
            ) {
                if ((rec.app_type == 'system_app' || rec.app_type == 'normal') &&
                    (rec.prefer_theme == 'light' || rec.prefer_theme == 'dark' || rec.prefer_theme == 'auto')
                ) {
                    if (rec.app_type != 'system_app') {
                        rec.required_modules = [];
                    }
                    if (!rec.alwaysOn) {
                        rec.settings = {}
                    }
                    register(id, rec, cb)
                }
                else {
                    rollback(id);
                    cb(null);
                }
            }
            else {
                rollback(id);
                cb(null);
            }
        }
    })

}

function rollback(id) {
    //delete the folders
    fs.readdir(dataDir + '/data/files/' + id, (err, dir) => {
        if (dir != undefined) {
            rimraf(dataDir + '/data/files/' + id, () => { })
        }
    })
    fs.readdir(dataDir + '/data/appData/files/' + id, (err, dir) => {
        if (dir != undefined) {
            rimraf(dataDir + '/data/appData/files/' + id, () => { })
        }
    })
    fs.readdir(dataDir + '/data/appData/db/' + id, (err, dir) => {
        if (dir != undefined) {
            rimraf(dataDir + '/data/appData/db/' + id, () => { })
        }
    })
    //remove records
    appsFile.remove({ id }, {}, function (err, num) {
        console.log('rollback: removed from apps db', num);
    });
    showCase.remove({ id }, {}, function (err, num) {
        console.log('rollback: removed from showCase db', num);
    });
    nameSpaces.remove({ id }, {}, function (err, num) {
        console.log('rollback: removed from nameSpaces db', num);
    });
    //remove icon from launchpad files
    fs.unlink(dataDir + '/data/appData/files/launchpad/appIcons/' + id + '.png', (err) => { })

}

function askConfirmation(appId, id, conf, cb) {
    var allow = true;
    //show dialog for permission
    if (allow) {
        validate(id, conf, cb);
    }
    else {
        cb(null);
    }
}

function setupFolder(cb) {
    var id = newId();
    fs.readdir(dataDir + '/data/files/' + id, (err, dir) => {
        if (dir != undefined) {
            //dir already exists, try again.
            setupFolder(cb);
        }
        else {
            fs.mkdir(dataDir + '/data/files/' + id, { recursive: true }, (err) => {
                cb(id);
            });
        }
    })
}

function install(appId, path, cb = function () { }) {
    //read->extract->write
    //check for .pine extension

    if (path.slice(path.length - 5) == '.pine') {
        setupFolder((id) => {
            tar.x(  // or tar.extract
                {
                    cwd: dataDir + '/data/files/' + id,
                    file: path
                }
            ).then(() => {
                fs.readFile(dataDir + '/data/files/' + id + '/pine.json', 'utf8', (err, confFile) => {
                    if (confFile != undefined) {
                        var conf = JSON.parse(confFile);
                        if (typeof conf.name == 'string' && typeof conf.entry == 'string' && typeof conf.background == 'string' && typeof conf.icon == 'string') {
                            setupAppData(id, () => {
                                if (appId == 'launchpad' || appId == 'appinstaller') {
                                    validate(id, conf, cb);
                                }
                                else {
                                    askConfirmation(appId, id, conf, cb);
                                }
                            })
                        }
                        else {
                            //conf file not good, rollback!
                            rollback(id);
                            cb(null);
                        }
                    }
                    else {
                        //conf file does not exists, rollback!
                        rollback(id);
                        cb(null);
                    }
                })

            })
        })
    }
    else {
        //We only accept .pine extensions
        //sometimes being a jerk is fun
        cb(null);
    }
}

function uninstall(appId,id,cb){
    if(appId=='launchpad'||appId=='appstore'){
        rollback(id);
    }
else{
    //ask for confirmation from user first
    rollback(id);
}
cb(true);
}

module.exports = {
    init: function (vars) {
        dataDir = vars.dataDir;
        appsFile = new Datastore({ filename: dataDir + '/data/core/apps.txt', autoload: true });
        nameSpaces = new Datastore({ filename: dataDir + '/data/core/nameSpaces.txt', autoload: true });
        showCase = new Datastore({ filename: dataDir + '/data/appData/db/launchpad/showCase.txt', autoload: true });
    },
    install,uninstall
}
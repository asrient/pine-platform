const fs = require('fs');
var zlib = require('zlib');
var tar = require('tar');
const crypto = require('crypto');
var Emitter = require('component-emitter');
var Datastore = require('nedb');

var shortcuts = require('./shortcuts.js');

var appsFile = null;
var showCase = null;
var dataDir = null;

function newId(len = 7) {
    return crypto.randomBytes(len).toString('hex')
}

/** 
 @pram appId: of the source
 @pram path: absolute path of .pine file
 @pram callback
*/


function register(id, rec, cb) {
    appsFile.insert(rec, (err, r) => {
        if (err == null) {
            //record in showCase (lp)
            var scRec = {
                "id": rec.id,
                "name": rec.name,
                "name_space": rec.name_space,
                "icon": rec.icon,
                "app_type": rec.app_type,
            }
            showCase.insert(scRec, (err, r) => {
                if (err == null) {
                    //copy the app icon to lp
                    fs.copyFile(dataDir + '/apps/' + id + '/source/' + rec.icon, dataDir + '/apps/launchpad/files/appIcons' + id + '.png', (err) => {
                        shortcuts.add(id);
                        console.log('App sucessfully installed!');
                        cb(id);
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
        added_on: new Date().getTime(),
        version: conf.version || '1.0',
        name_space: conf.name_space || 'app.' + name + '.' + id,
        prefer_single_window: conf.prefer_single_window || false,
        prefer_theme: conf.prefer_theme || 'light',
        show_on_launchpad: true,
        app_type: conf.app_type || 'normal',
    };

    appsFile.findOne({ name_space: rec.name_space }, { id: 1 }, (err, r) => {
        if (r != null) {
            //namespace already taken
            rollback(id);
            cb(null);
        }
        else {
            //ns available
            if (
                typeof rec.name_space == 'string' &&
                typeof rec.version == 'string' &&
                typeof rec.prefer_single_window == 'boolean'
            ) {
                if ((rec.app_type == 'system_app' || rec.app_type == 'normal') &&
                    (rec.prefer_theme == 'light' || rec.prefer_theme == 'dark' || rec.prefer_theme == 'auto')
                ) {
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
    fs.readdir(dataDir + '/apps/' + id, (err, dir) => {
        if (dir != undefined) {
            rimraf(dataDir + '/apps/' + id, () => { })
        }
    })
    shortcuts.remove(id, () => {
        //remove records
        appsFile.remove({ id }, {}, function (err, num) {
            console.log('rollback: removed from apps db', num);
        });
        showCase.remove({ id }, {}, function (err, num) {
            console.log('rollback: removed from showCase db', num);
        });
        //remove icon from launchpad files
        fs.unlink(dataDir + '/data/appData/files/launchpad/appIcons/' + id + '.png', (err) => { })
    })
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
    fs.readdir(dataDir + '/apps/' + id, (err, dir) => {
        if (dir != undefined) {
            //dir already exists, try again.
            setupFolder(cb);
        }
        else {
            fs.mkdir(dataDir + '/apps/' + id, { recursive: true }, (err) => {
                fs.mkdir(dataDir + '/apps/' + id + '/db', { recursive: true }, (err) => {
                    fs.mkdir(dataDir + '/apps/' + id + '/files', { recursive: true }, (err) => {
                        fs.mkdir(dataDir + '/apps/' + id + '/source', { recursive: true }, (err) => {
                            cb(id);
                        })
                    })
                })

            });
        }
    })
}

function install(appId, path, cb = function () { }) {
    //read->extract->write
    //check for .pine extension
    appsFile = new Datastore({ filename: dataDir + '/core/apps.txt', autoload: true });
    showCase = new Datastore({ filename: dataDir + '/apps/launchpad/db/showCase.txt', autoload: true });
    if (path.slice(path.length - 5) == '.pine') {
        setupFolder((id) => {
            tar.x(  // or tar.extract
                {
                    cwd: dataDir + '/apps/' + id + '/source',
                    file: path
                }
            ).then(() => {
                fs.readFile(dataDir + '/apps/' + id + '/source/pine.json', 'utf8', (err, confFile) => {
                    if (confFile != undefined) {
                        var conf = JSON.parse(confFile);
                        if (typeof conf.name == 'string' && typeof conf.entry == 'string' && typeof conf.icon == 'string') {
                            if (appId == 'launchpad' || appId == 'appinstaller') {
                                validate(id, conf, cb);
                            }
                            else {
                                askConfirmation(appId, id, conf, cb);
                            }
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

function uninstall(appId, id, cb) {
    appsFile = new Datastore({ filename: dataDir + '/core/apps.txt', autoload: true });
    showCase = new Datastore({ filename: dataDir + '/apps/launchpad/db/showCase.txt', autoload: true });
    if (appId == 'launchpad' || appId == 'appstore') {
        rollback(id);
    }
    else {
        //ask for confirmation from user first
        rollback(id);
    }
    cb(true);
}

module.exports =  function (dDir) {
        dataDir = dDir;
        return {install, uninstall}
    }
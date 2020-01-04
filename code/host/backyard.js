const fs = require('fs');
const { app, ipcMain, BrowserWindow } = require('electron');
const crypto = require('crypto');
const { fork } = require('child_process');
var Emitter = require('component-emitter');
var Datastore = require('nedb');

var dir = app.getAppPath();
var dataDir = null;
var appsFile = null;
var airSync = require('./airSync.js');
var appInstaller = require('./appInstaller.js');


ipcMain.on('relay', (event, data) => {
    //console.log('a msg from boxId',data.boxId,'appId',data.appId,'to appSrvice',data.body)
    runtime.activeApps[data.appId].appService.send('relay', { from: data.boxId, body: data.body });
})

var ns = {
    directory: {}, //nameSpace:appId
    lookUp: function (appId, cb) {
        var nameSpace = Object.keys(this.directory).find(function (key) {
            return this.directory[key] == appId
        });
        if (nameSpace != undefined) {
            cb(nameSpace)
        }
        else {
            appsFile.findOne({ id: appId }, { name_space: 1 }, (err, rec) => {
                if (rec != null) {
                    this.set(rec.name_space, appId);
                    cb(rec.name_space);
                }
                else {
                    console.log('could not find an app with appId:', appId);
                    cb(null)
                }
            })
        }
    },
    getId: function (nameSpace, cb) {
        if (this.directory[nameSpace] != undefined) {
            cb(this.directory[nameSpace])
        }
        else {
            appsFile.findOne({ name_space: nameSpace }, { id: 1 }, (err, rec) => {
                if (rec != null) {
                    this.set(nameSpace, rec.id);
                    cb(rec.id);
                }
                else {
                    console.log('could not find an app with nameSpace:', nameSpace);
                    cb(null)
                }
            })
        }
    },
    set: function (nameSpace, appId) {
        if (this.directory[nameSpace] == undefined) {
            this.directory[nameSpace] = appId
        }
        else {
            console.error('nameSpace already registered!');
        }
    }
};

var runtime = {
    UID: function () {
        return (crypto.randomBytes(5).toString())
    },
    activeApps: {},
    startAppService: function (appId, forced = false, cb1 = function () { }) {
        canRun = () => {
            if (this.activeApps[appId] != undefined && this.activeApps[appId].info.background != undefined) {
                if (this.activeApps[appId].appService == null) {
                    if (!forced) {
                        if (!Object.keys(this.activeApps[appId].boxes).length) {
                            if (this.activeApps[appId].info.alwaysOn && this.activeApps[appId].info.settings.alwaysOn) {
                                return true;
                            }
                            else {
                                return false;
                            }
                        }
                        else {
                            return true;
                        }
                    }
                    else {
                        return true;
                    }

                }
                else {
                    return false;
                }
            }
            else {
                return false;
            }
        }
        if (this.activeApps[appId] != undefined) {
            if (canRun()) {

                var bgPath = dataDir + '/data/files/' + appId + '/' + this.activeApps[appId].info.background;
                var cwd = dataDir + '/data/files/' + appId;
                var filesPath = dataDir + '/data/appData/files/' + appId;
                var required_modules = this.activeApps[appId].info.required_modules;
                var app_type = this.activeApps[appId].info.app_type;
                var nameSpace = this.activeApps[appId].info.name_space;
                var dbPath = dataDir + '/data/appData/db/' + appId;
                ns.set(nameSpace, appId);
                //
                var service = fork(dir + '/host/appService.js', { env: { 'bgPath': bgPath, filesPath, required_modules, app_type, dbPath, nameSpace, dir, dataDir }, cwd });


                service.send({ type: 'run', body: { path: bgPath, appId: appId } });
                this.activeApps[appId].appService = {
                    replies: new Emitter,
                    send: (type, body = {}, key = null, isReply = false) => {
                        service.send({ type, body, key, isReply });
                    },
                    reply: (type, data, key = null) => {
                        this.activeApps[appId].appService.send(type, data, key, true)
                    },
                    wait: (type, key, cb) => {
                        var isCompleated = false;

                        this.activeApps[appId].appService.replies.once(type, (message) => {
                            if (isCompleated) {
                                console.error("BUG: Still waiting even after callback");
                            }
                            if (message.key == key) {
                                isCompleated = true;
                                cb(message.data);
                            }
                            else {
                                this.activeApps[appId].appService.wait(type, key, cb);
                            }
                        }, false);
                    },
                    get: (type, data, cb) => {
                        if (cb == undefined) {
                            cb = function () { }
                        }
                        var key = this.UID()
                        this.activeApps[appId].appService.send(type, data, key);
                        this.activeApps[appId].appService.wait(type, key, cb, true);
                    },
                    set: (type, cb) => {
                        this.activeApps[appId].appService.on(type, (m) => {
                            done = (data) => {
                                this.activeApps[appId].appService.reply(type, data, m.key);
                            }
                            cb(m.body, done);
                        })
                    },
                    kill: (cb = function () { }) => {
                        if (!Object.keys(this.activeApps[appId].boxes).length) {
                            //force kill
                            this.activeApps[appId].appService.send('kill');
                            delete this.activeApps[appId];
                            cb(true);
                        }
                        else {
                            cb(false)
                        }
                    }
                }

                Emitter(this.activeApps[appId].appService);

                this.activeApps[appId].appService.set('getBoxes', (data, done) => {
                    ids = [];
                    ids = Object.keys(this.activeApps[appId].boxes);
                    done(ids);
                })
                this.activeApps[appId].appService.set('addBox', (data, done) => {
                    // console.log('adding a box')
                    this.addBox(appId, (bid) => {
                        done(bid);
                    })
                })
                this.activeApps[appId].appService.set('closeBox', (data, done) => {
                    console.log('killing bid:', data);
                    this.activeApps[appId].boxes[data].kill();
                    done();
                })
                this.activeApps[appId].appService.set('openApp', (data, done) => {
                    ns.getId(data, (id) => {
                        if (id != null) {
                            this.openApp(id, (r) => {
                                done(r);
                            });
                        }
                        else {
                            done(false);
                        }
                    })

                })
                this.activeApps[appId].appService.set('openAppById', (data, done) => {
                    this.openApp(data, (r) => {
                        done(r);
                    });
                })
                this.activeApps[appId].appService.set('forceQuitApp', (data, done) => {
                    if (this.activeApps[appId].info.app_type == 'system_app') {
                        this.activeApps[data].forceQuit();
                        done(true)
                    }
                    else {
                        done(false);
                    }
                })
                this.activeApps[appId].appService.set('installApp', (path, done) => {
                    appInstaller.install(appId,dataDir + '/data/appData/files/' + appId + '/'+ path,done);
                })
                this.activeApps[appId].appService.set('uninstallApp', (id, done) => {
                    appInstaller.uninstall(appId,id,done);
                })
                
                service.on('message', (msg) => {
                    if (msg.type == 'relay') {
                        this.activeApps[appId].boxes[msg.to].send('relay', msg.body);
                    }
                    else if(msg.type=='airSync-send'){
                        airSync.send(msg.body);
                    }
                    else if (msg.type == 'iac-request') {
                        var ToNameSpace = msg.body.to;
                        if (msg.body.access != null) {
                            msg.body.access.basePath = dataDir + '/data/appData/files/' + appId + '/';
                        }
                        else {
                            msg.body.access == null;
                        }
                        var data = { client: { appId, nameSpace }, type: msg.body.type, data: msg.body.data, access: msg.body.access, key: msg.body.key }
                        iac.request(ToNameSpace, data)
                    }
                    else if (msg.type == 'iac-reply') {
                        var ToNameSpace = msg.body.to;
                        if (msg.body.access != null) {
                            msg.body.access.basePath = dataDir + '/data/appData/files/' + appId + '/';
                        }
                        else {
                            msg.body.access == null;
                        }
                        var data = { client: { appId, nameSpace }, type: msg.body.type, data: msg.body.data, access: msg.body.access, key: msg.body.key }
                        iac.reply(ToNameSpace, data)
                    }
                    else if (msg.type == 'killed') {
                        console.log('appService died!');
                        if (this.activeApps[appId] != undefined) {
                            //appService died for some reason, but app is still active!
                            this.activeApps[appId].appService = null;
                            if (this.activeApps[appId].info.alwaysOn && this.activeApps[appId].info.settings.alwaysOn) {
                                console.log('restarting appService...');
                                this.startAppService(appId);
                            }

                        }
                    }
                    else {
                        if (msg.key != null && msg.key != undefined) {
                            if (msg.isReply) {
                                this.activeApps[appId].appService.replies.emit(msg.type, { body: msg.body, key: msg.key });
                            }
                            else {
                                this.activeApps[appId].appService.emit(msg.type, { body: msg.body, key: msg.key });
                            }
                        }
                    }
                })

                cb1(true)



            }
            else {
                console.log('appService cannot run');
                cb1(false);
            }
        }
        else {
            appsFile.findOne({ id: appId }, (err, rec) => {
                if (rec != null) {
                    this.activeApps[appId] = {
                        appId: appId,
                        info: rec,
                        boxes: {},
                        appService: null,
                        forceQuit: () => {
                            //There is every chance, instance gets undefined in every step, so checking for it is necessery
                            Object.keys(this.activeApps[appId].boxes).forEach((bid) => {
                                this.activeApps[appId].boxes[bid].kill();
                            })
                            if (this.activeApps[appId] != undefined && this.activeApps[appId].appService != null) {
                                this.activeApps[appId].appService.kill()
                            }
                            if (this.activeApps[appId] != undefined) {
                                delete this.activeApps[appId];
                            }
                        }
                    }
                    // console.log('app rec',err,rec)
                    this.startAppService(appId, forced, cb1);
                }
                else {
                    cb1(false);
                }
            })
        }
    },
    addBox: function (appId, maincb = function () { }) {
        if (this.activeApps[appId] != undefined) {
            const pRand = crypto.randomBytes(2).toString();
            var props = {
                width: 1060,
                height: 640,
                show: true,
                transparent: false,
                opacity: 1,
                title: this.activeApps[appId].info.name,
                minHeight: 20,
                minWidth: 40,
                frame: false,
                icon: dataDir + '/data/files/' + appId + '/' + this.activeApps[appId].info.icon,
                webPreferences: {
                    nodeIntegration: false,
                    webSecurity: true,
                    allowRunningInsecureContent: false,
                    experimentalFeatures: true,
                    partition: appId + pRand
                }
            }
            var box = new BrowserWindow(props)

            var boxId = crypto.randomBytes(4).toString();

            this.activeApps[appId].boxes[boxId] = {
                win: box,
                boxId,
                send: (type, body = {}) => {
                    //relay to ghost
                    box.webContents.send(type, body);
                },
                kill: () => {
                    if (box != undefined && box != null) { box.destroy(); }
                    delete this.activeApps[appId].boxes[boxId];
                    console.log('releasing box ref', this.activeApps[appId].boxes)
                    box = undefined;
                    if (!Object.keys(this.activeApps[appId].boxes).length) {
                        //all boxes closed
                        this.activeApps[appId].appService.send('all-boxes-closed');
                        if (!(this.activeApps[appId].info.alwaysOn && this.activeApps[appId].info.settings.alwaysOn)) {
                            this.activeApps[appId].appService.kill();
                        }
                    }
                }
            }

            this.activeApps[appId].boxes[boxId].win.loadFile('./ghost/ghost.html');


            this.activeApps[appId].boxes[boxId].win.on('closed', () => {
                console.log('////WINDOW CLOSED////');
                if (this.activeApps[appId] != undefined) {
                    if (this.activeApps[appId].appService != null) {
                        this.activeApps[appId].appService.send('relay', { from: boxId, body: { type: 'closed' } })
                    }
                    if (this.activeApps[appId].boxes[boxId] != undefined) {
                        //box ref still there
                        this.activeApps[appId].boxes[boxId].kill();
                    }
                }

            })


            this.activeApps[appId].boxes[boxId].win.webContents.on('did-finish-load', () => {
                console.log('///INIT BOX///', boxId);
                box.webContents.send('open', { 'dataDir': dataDir, 'appId': appId, 'boxId': boxId, 'appRec': this.activeApps[appId].info });
                this.activeApps[appId].appService.send('relay', { from: boxId, body: { type: 'opened' } })
            });

            maincb(boxId);
        }
        else {
            console.error("cannot add window, app is not  in active records");
            maincb(null);
        }
    },
    openApp: function (appId, cb = function () { }) {
        if (this.activeApps[appId] == undefined || this.activeApps[appId].appService == null) {
            this.startAppService(appId, true, (r) => {
                if (r) {
                    console.log('opening first box')
                    this.addBox(appId);
                    cb(true);
                }
                else {
                    console.log('could not open first box')
                    cb(false);
                }
            });
        }
        else {

            if (Object.keys(this.activeApps[appId].boxes).length) {
                console.log('no of boxes attached:', Object.keys(this.activeApps[appId].boxes).length)
                //boxes attached already
                if (!this.activeApps[appId].info.prefer_single_window) {
                    this.addBox(appId);
                    cb(true);
                }
                else {
                    this.activeApps[appId].appService.send('open-app-requested');
                    cb(true);
                }
            }
            else {
                this.addBox(appId);
                cb(true);
            }

        }
    }
}


var iac = {
    request: function (nameSpace, data, cb = function () { }) {

        function ping(appId) {
            runtime.activeApps[appId].appService.send('iac-request', data);
        }

        ns.getId(nameSpace, (appId) => {
            if (appId != null) {
                if (runtime.activeApps[appId] != undefined) {
                    ping(appId);
                }
                else {
                    //app not active
                    //First try, try to run app in background.
                    runtime.startAppService(appId, true, (r) => {
                        if (r) {
                            ping(appId);
                        }
                        else {
                            //could not start appService
                            //Second try, Launch app
                            runtime.openApp(appId, (r1) => {
                                if (r1) {
                                    ping(appId);
                                }
                                else {
                                    cb(null)
                                }
                            })
                        }
                    })
                }
            }
            else {
                cb(null);
            }
        })
    },
    reply: function (nameSpace, data) {
        ns.getId(nameSpace, (appId) => {
            if (appId != null) {
                if (runtime.activeApps[appId] != undefined) {
                    runtime.activeApps[appId].appService.send('iac-reply', data);
                }
                else {
                    console.error('cannot send reply to inactive app');
                }
            }
        })
    }
}

function airReceiver(nameSpace,data){
    function ping(appId) {
        runtime.activeApps[appId].appService.send('airSync-receive', data);
    }
    ns.getId(nameSpace, (appId) => {
        if (appId != null) {
            if (runtime.activeApps[appId] != undefined) {
                ping(appId);
            }
            else {
                runtime.startAppService(appId, true, (r) => {
                    if (r) {
                        ping(appId);
                    }
                    else {
                        //could not start appService
                        //Second try, Launch app
                        runtime.openApp(appId, (r1) => {
                            if (r1) {
                                ping(appId);
                            }
                            else {
                                cb(null)
                            }
                        })
                    }
                })
            }
        }
        else{
            console.error('AirSync: cant send receive msg, '+appId+' not valid id')
        }
    })
}

module.exports = function (vars) {
    dataDir = vars.dataDir;
    airSync.init(vars,airReceiver);
    appInstaller.init(vars);
    //console.log('dataDir: ', dataDir);
    appsFile = new Datastore({ filename: dataDir + '/data/core/apps.txt', autoload: true });
    return runtime;
}
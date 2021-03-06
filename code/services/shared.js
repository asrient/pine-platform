/**
 * @ASRIENT 8.1.20
 * These are the shared services APIs accessable from both ghost and background
 */
const fs = require('fs');
var electron = require('electron');
const crypto = require('crypto');
var Datastore = require('nedb');

var createWindow = require('./createWindow.js');
const winObj = require('./winObjCutter.js');
const dataApis = require('./data.js');
const ext = require('./extension.js');
const shortcuts = require('./shortcuts.js');
const media = require('./media.js');
const airPeer = require('./airPeer/lib.js');

function prox(func) {
    return function (arg1, arg2, arg3, arg4, arg5) {
        var res = func(arg1, arg2, arg3, arg4, arg5);
        return res;
    }
}

var app = null;
var dataDir = null;

function appEvents(event, cb) {
    if (event == 'window-all-closed') {
        electron.remote.app.on(event, cb)
    }
    else if (event == 'ready') {
        electron.remote.app.on(event, cb)
    }
    else if (event == 'browser-window-created') {
        electron.remote.app.on(event, (e, win) => {
            cb(e, winObj(win));
        })
    }
}

const publicMods = ['net', 'stream', 'http', 'zlib', 'http2', 'dgram', 'buffer','crypto'];
const systemMods = ['process', 'nedb', 'os', 'fs'];

function include(mod) {
    if (systemMods.includes(mod) && app.app_type == 'system_app') {
        return require(mod);
    }
    else if (publicMods.includes(mod)) {
        return require(mod);
    }
}

module.exports = function (appRec, dDir) {
    app = appRec;
    dataDir = dDir;
    var openApp = require("./openApp.js")(dataDir);
    var appInstaller = require('./appInstaller.js')(dDir);
    var apis = {
        version: '1.0',
        info: app,
        app: {
            createWindow: createWindow(app, dataDir),
            getAllWindows: function () {
                var wins = electron.remote.BrowserWindow.getAllWindows();
                return wins.map((win) => {
                    return winObj(win);
                })
            },
            getWindowById: function (id) {
                return winObj(electron.remote.BrowserWindow.fromId(id));
            },
            getFocusedWindow: function () {
                return winObj(electron.remote.BrowserWindow.getFocusedWindow());
            },
            quit: prox(electron.remote.app.quit),
            exit: prox(electron.remote.app.exit),
            isReady: prox(electron.remote.app.isReady),
            whenReady: prox(electron.remote.app.whenReady),
            setUserTasks: prox(electron.remote.app.setUserTasks),
            showAboutPanel: prox(electron.remote.app.showAboutPanel),
            on: appEvents,
            info: app
        },
        data: dataApis(app, dataDir),
        media: media(app, dataDir),
        extension: {
            include: function (ns, extName, cb) {
                appsFile = new Datastore({ filename: dataDir + '/core/apps.txt', autoload: true });
                appsFile.findOne({ name_space: ns }, (err, rec) => {
                    if (err == null && rec != null) {
                        ext(rec, dataDir).run(extName, cb);
                    }
                    else {
                        console.error("Cant find app in db");
                    }
                })
            }
        },
        window: winObj(electron.remote.getCurrentWindow()),
        ipc: electron.ipcRenderer,
        openApp: openApp.open,
        openAppById: openApp.openById,
        addShortcut: function () {
            shortcuts(dataDir).add(app.id);
        },
        include,
        installApp: function (pth, cb) {
            appInstaller.install(app.id, dataDir + '/apps/' + app.id + '/files/' + pth, cb);
        },
        uninstallApp: function (id) {
            appInstaller.uninstall(id);
        },
        airPeer
    }

    apis.ipc.invoke = undefined;
    if (app.app_type == 'system_app') {
        apis.dialog = electron.remote.dialog;
        apis.paths = {
            data: dataDir,
            pictures: electron.remote.app.getPath('pictures'),
            downloads: electron.remote.app.getPath('downloads'),
            temp: electron.remote.app.getPath('temp'),
            videos: electron.remote.app.getPath('videos'),
            userData: electron.remote.app.getPath('userData'),
            home: electron.remote.app.getPath('home'),
            desktop: electron.remote.app.getPath('desktop'),
            music: electron.remote.app.getPath('music'),
        }
    }

    return apis;
}
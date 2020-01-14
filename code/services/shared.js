/**
 * @ASRIENT 8.1.20
 * These are the shared services APIs accessable from both ghost and background
 */
const fs = require('fs');
var electron = require('electron');
const crypto = require('crypto');

var createWindow = require('./createWindow.js');
const winObj = require('./winObjCutter.js');
const dataApis = require('./data.js');

if (electron.remote != undefined) {
    electron = electron.remote;
}

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
        electron.app.on(event, cb)
    }
    else if (event == 'ready') {
        electron.app.on(event, cb)
    }
    else if (event == 'browser-window-created') {
        electron.app.on(event, (e, win) => {
            cb(e, winObj(win));
        })
    }
}

module.exports = function (appRec, dDir) {
    app = appRec;
    dataDir = dDir;
    return {
        version: '1.0',
        info: app,
        app: {
            createWindow: createWindow(app, dataDir),
            getAllWindows: function () {
                var wins = electron.BrowserWindow.getAllWindows();
                return wins.map((win) => {
                    return winObj(win);
                })
            },
            getWindowById: function (id) {
                return winObj(electron.BrowserWindow.fromId(id));
            },
            getFocusedWindow: function () {
                return winObj(electron.BrowserWindow.getFocusedWindow());
            },
            quit: prox(electron.app.quit),
            exit: prox(electron.app.exit),
            isReady: prox(electron.app.isReady),
            whenReady: prox(electron.app.whenReady),
            setUserTasks: prox(electron.app.setUserTasks),
            showAboutPanel: prox(electron.app.showAboutPanel),
            on: appEvents,
            info: app
        },
        data: dataApis(app, dataDir)
    }
}
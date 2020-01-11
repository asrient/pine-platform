/**
 * @ASRIENT 5.1.20
 * Script that loads and initializes the APIs before the main window sets up
 */
const fs=require('fs');
const electron = require('electron');
const apis = require('../services/shared.js');
const winObj = require('../services/winObjCutter.js');

var app=electron.remote.getGlobal('app');
var dataDir=electron.remote.getGlobal('dataDir');

// load the shared apis set
const pine=apis(app,dataDir);

pine.ipc=electron.ipcRenderer;
pine.ipc.invoke=undefined;
pine.window=winObj(electron.remote.getCurrentWindow());

process.once('loaded', () => {
    global.pine = pine
  })
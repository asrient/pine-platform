/**
 * @ASRIENT 8.1.20
 * These are the shared services APIs accessable from both ghost and background
 */
const fs = require('fs');
const electron = require('electron');
const crypto = require('crypto');

var createWindow = require('./createWindow.js');

var app = null;
var dataDir = null;

module.exports = function (appRec, dDir) {
    app = appRec;
    dataDir = dDir;
    return {
        version: '1.0',
        createWindow:createWindow(app, dataDir),
        
    }
}
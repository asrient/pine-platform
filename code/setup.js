/**
 * @ASRIENT 18.1.20
 * This script sets up the data directory of pine after Fresh install or update
 */
const fs = require('fs');
const crypto = require('crypto');
const { app, BrowserWindow } = require('electron');

function createWindow(type) {
    // Create the browser window.
    let win = new BrowserWindow({
        width: 600,
        height: 300,
        frame: false,
        transparent: false,
        opacity: 1,
        setResezable: false,
        webPreferences: {
            nodeIntegration: true
        }
    })
    // and load the index.html of the app.
    if (type == 'installer') {
        win.loadFile('./setup/installer.html');
    }
    else if (type == 'updater') {
        win.loadFile('./setup/updater.html');
    }
    return win;
}

function installer() {
    createWindow('installer');
}

function updater() {
    createWindow('updater');
}

module.exports = { installer, updater }
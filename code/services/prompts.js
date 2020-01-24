/**
 * @ASRIENT 20.1.20
 * Provides custom prompt dialog windows
 */
const fs = require('fs');
const crypto = require('crypto');
const { app, dialog } = require('electron');

function show(title, body, buttons, cb) {
    var options = {
        type: 'none',
        title: 'Pine',
        message: title,
        detail: body,
        buttons
    }
    dialog.showMessageBox(options).then((r) => {
        cb(r.response);
    });
}

function ask(title, body = null, buttons = ['OK'], cb = function () { }) {
    show(title, body, buttons, cb);
}

function alert(title, body = null, cb = function () { }) {
    if (typeof body == 'function') {
        cb = body;
    }
    show(title, body, ['OK'], cb);
}

module.exports = { ask, alert }
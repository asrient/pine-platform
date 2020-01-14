/**
 * @ASRIENT 14.1.20
 * Provides files, dbs and source files IO services
 */

const fs = require('fs');
const crypto = require('crypto');
var Datastore = require('nedb');
var sqlite3 = require('sqlite3');

var app = null;
var dataDir = null;
var dbDir = null;
var filesDir = null;
var sourceDir = null;

const api = {
    store: function (pth) {
        return new Datastore({ filename: dbDir + '/' + pth, autoload: true });
    },
    sqlite: function (pth, mode, cb) {
        return new sqlite3.Database(dbDir + '/' + pth, mode, cb)
    },
    files: {
        //TODO: open,close,stats
        dirInfo: function (dirPath, cb, opts = {}) {
            fs.readdir(filesDir + '/' + dirPath, opts, cb);
        },
        readStream: function (file, enc = null) {
            var stream = fs.createReadStream(filesDir + '/' + file, { encoding: enc });
            return (stream);

        },
        writeStream: function (file, enc = null) {
            var stream = fs.createWriteStream(filesDir + '/' + file, { encoding: enc });
            return (stream);

        },
        read: function (file, cb, opts) {
            if (opts != undefined) {
                fs.readFile(filesDir + '/' + file, opts, cb)
            }
            else {
                fs.readFile(filesDir + '/' + file, cb)
            }
        },
        write: function (file, data, cb, opts) {
            if (opts != undefined) {
                fs.writeFile(filesDir + '/' + file, data, opts, cb)
            }
            else {
                fs.writeFile(filesDir + '/' + file, data, cb)
            }
        },
        mkdir: function (path, cb) {
            fs.mkdir(filesDir + '/' + path, { recursive: true }, cb);
        },
        append: function (file, data, cb, opt) {
            if (opt == undefined) {
                fs.appendFile(filesDir + '/' + file, data, cb);
            }
            else {
                fs.appendFile(filesDir + '/' + file, data, opt, cb);
            }
        },
        delete: function (file, cb = function () { }) {
            fs.unlink(filesDir + '/' + file, cb);
        },
        rename: function (from, to, cb = function () { }) {
            fs.rename(filesDir + '/' + from, filesDir + '/' + to, cb);
        },
    },
    source: function (path, cb = function () { }, opts = null) {
        if (opts == null) { fs.readFile(sourceDir + '/' + path, cb); }
        else { fs.readFile(sourceDir + '/' + path, opts, cb); }
    }
}

module.exports = function (appRec, dDir) {
    app = appRec;
    dataDir = dDir;
    dbDir = dataDir + '/apps/' + app.id + '/db';
    filesDir = dataDir + '/apps/' + app.id + '/files';
    sourceDir = dataDir + '/apps/' + app.id + '/source';
    return api;
}
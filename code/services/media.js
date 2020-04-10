/**
 * @ASRIENT 23.2.20
 * Provides Media manipulation services
 */

const fs = require('fs');
const crypto = require('crypto');
var Datastore = require('nedb');
var sqlite3 = require('sqlite3');
var mime = require('mime-types');
var Exif = require('exif').ExifImage;
var Jimp = require('jimp');
const sharp = require('sharp');
var FFmpeg = require('fluent-ffmpeg');
var ffmpegPath = require('ffmpeg-static');
var ffprobePath = require('ffprobe-static');

FFmpeg.setFfmpegPath(ffmpegPath);
FFmpeg.setFfprobePath(ffprobePath);

var app = null;
var dataDir = null;
var dbDir = null;
var filesDir = null;
var sourceDir = null;

const api = {
    getType: function (pth) {
        return (mime.lookup(filesDir + '/' + pth));
    },
    Image: class {
        file = null;
        proceed = false;
        constructor(pth) {
            this.file = filesDir + '/' + pth;
            const types = ['image/jpeg', 'image/png'];
            if (!types.includes(mime.lookup(this.file))) {
                this.file = null;
            }
        }
        getInfo = (cb) => {
            function getDate(dt) {
                dt = dt.split(" ");
                var date = dt[0];
                var time = dt[1];
                date = date.split(':');
                time = time.split(':');
                var dt = new Date(date[0], date[1], date[2], time[0], time[1], time[2]);
                return (dt.getTime());
            }
            new Exif({ image: this.file }, function (err, info) {
                if (err) {
                    info = { "image": {}, "thumbnail": {}, "exif": {}, "gps": {} };
                }
                if (info.exif.DateTimeOriginal != undefined) {
                    info.date = getDate(info.exif.DateTimeOriginal);
                }
                else if (info.exif.CreateDate != undefined) {
                    info.date = getDate(info.exif.CreateDate);
                }
                else if (info.image.ModifyDate != undefined) {
                    info.date = getDate(info.image.ModifyDate);
                }
                if (info.image.Orientation) {
                    info.orientation = info.image.Orientation;
                }
                if (info.image.Make) {
                    info.make = info.image.Make.toString();
                }
                if (info.image.Model) {
                    info.model = info.image.Model.toString();
                }
                if (info.exif.ExifImageWidth) {
                    info.width = info.exif.ExifImageWidth;
                }
                if (info.exif.ExifImageHeight) {
                    info.height = info.exif.ExifImageHeight;
                }
                cb(info);

            });
        }
        fixOrientation = (out = this.file, cb) => {
            if (out != this.file) {
                out = filesDir + '/' + out;
            }
            sharp(this.file)
                .rotate()
                .toFile(out, (err) => {
                    cb(1)
                })
        }
        resize = (size = 150, out = this.file, cb) => {
            if (out != this.file) {
                out = filesDir + '/' + out;
            }
            sharp(this.file)
                .rotate()
                .resize({ height: size })
                .toFile(out, (err) => {
                    cb(1)
                });
        }
    },
    Video: class {
        file = null;
        proceed = false;
        constructor(pth) {
            this.filesDir=filesDir;
            this.file = filesDir + '/' + pth;
            const types = ['video/mp4', 'video/avi','video/3gp','video/avi'];
            if (!types.includes(mime.lookup(this.file))) {
                this.file = null;
            }
        }
        editor(){
            if(this.file!=null){
                return new FFmpeg(this.file);
            }
        }
        getInfo(cb){
            new FFmpeg.Metadata(
                this.file,
                (metadata, err)=> {
                    cb(metadata);
                }
            );
        }
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
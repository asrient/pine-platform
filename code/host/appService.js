var process = require('process');
const crypto = require('crypto');
const Emitter = require('component-emitter');


function loot() {
  console.log('GOLD WAS LOOTED!')
}

iacEvents = {
  req: new Emitter,
  res: new Emitter,
}

function InitIAC() {

  //sending req -> to,type,data,access,key
  //receiving req -> [type],client,data,access,key

  function readObj(path) {
    var isValid = true;
    return {
      mode: 'r',
      read: function (cb, enc = null) {
        if (isValid) {
          fs.readFile(path, { encoding: enc }, (err, data) => {
            isValid = false;
            cb(err, data)
          });
        }
      },
      readStream: function (enc = null) {
        if (isValid) {
          var stream = fs.createReadStream(path, { encoding: enc });
          isValid = false;
          return (stream);
        }
      }
    }
  }

  function writeObj(path) {
    var isValid = true;
    return {
      mode: 'w',
      write: function (data, cb = function () { }, enc = null) {
        if (isValid) {
          fs.writeFile(path, data, { encoding: enc }, (err, r) => {
            isValid = false;
            cb(err, r)
          });
        }
      },
      writeStream: function (enc = null) {
        if (isValid) {
          var stream = fs.createWriteStream(path, { encoding: enc });
          isValid = false;
          return (stream);
        }
      }
    }
  }

  var fs = require('fs');
  api = {

    UID: function () {
      return (crypto.randomBytes(5).toString())
    },
    set: function (type, cb) {
      iacEvents.req.on(type, (m) => {
        done = (data, access = null) => {
          this.reply(m.client.nameSpace, type, data, access, m.key);
        }
        var fileObj = null;
        if (m.access != null && m.access != undefined) {
          var opts = m.access;
          var appId = m.client.appId;
          var filePath = opts.basePath + opts.file;
          if (opts.mode == 'r') {
            fileObj = readObj(filePath);
          }
          else if (opts.mode == 'w') {
            fileObj = writeObj(filePath);
          }

        }
        cb(m.client, m.data, fileObj, done);
      })
    },
    sendReq: function (to, type, data, access, key) {
      // console.log('sending message',type,data,key)
      process.send({ type: 'iac-request', body: { to, type, data, access, key } });
    },
    reply: function (to, type, data, access, key) {
      process.send({ type: 'iac-reply', body: { to, type, data, access, key } });
    },

    wait: function (from, type, key, cb) {
      var isCompleated = false;

      iacEvents.res.once(type, (message) => {
        if (isCompleated) {
          console.error("BUG: Still waiting even after callback");
        }
        if (message.key == key && message.client.nameSpace == from) {
          isCompleated = true;
          var fileObj = null;
          if (message.access != null && message.access != undefined) {
            var opts = message.access;
            var appId = message.client.appId;
            var filePath = opts.basePath + opts.file;
            if (opts.mode == 'r') {
              fileObj = readObj(filePath);
            }
            else if (opts.mode == 'w') {
              fileObj = writeObj(filePath);
            }
          }
          cb(message.client, message.data, fileObj);
        }
        else {
          this.wait(from, type, key, cb);
        }
      }, false);
    },
    request: function (to, type, data, access, cb) {
      if (typeof access == 'function' && cb == undefined) {
        cb = access;
        access = null;
      }
      var key = this.UID()
      this.sendReq(to, type, data, access, key);
      this.wait(to, type, key, cb);
    },
  }
  return api;
}


function InitDb() {
  var Datastore = require('nedb');
  var dbPath = process.env['dbPath'];
  return ((path) => {
    return new Datastore({ filename: dbPath + '/' + path, autoload: true });
  })
}

function InitFiles() {

  const fs = require('fs');

  const filesPath = process.env['filesPath'];
  const basePath = filesPath + '/';

  //TODO: open,close,stats
  return {
    dirInfo: function (dirPath, cb, opts = {}) {
      fs.readdir(basePath + dirPath, opts, cb);
    },
    readStream: function (file, enc=null) {
      var stream = fs.createReadStream(basePath + file, { encoding: enc });
      return (stream);

    },
    writeStream: function (file, enc = null) {
      var stream = fs.createWriteStream(basePath + file, { encoding: enc });
      return (stream);

    },
    read: function (file, cb, opts) {
      if (opts != undefined) {
        fs.readFile(basePath + file, opts, cb)
      }
      else {
        fs.readFile(basePath + file, cb)
      }
    },
    write: function (file, data, cb, opts) {
      if (opts != undefined) {
        fs.writeFile(basePath + file, data, opts, cb)
      }
      else {
        fs.writeFile(basePath + file, data, cb)
      }
    },
    mkdir: function (path, cb) {
      fs.mkdir(basePath + path, { recursive: true }, cb);
    },
    append: function (file, data, cb, opt) {
      if (opt == undefined) {
        fs.appendFile(basePath + file, data, cb);
      }
      else {
        fs.appendFile(basePath + file, data, opt, cb);
      }
    },
    delete: function (file, cb = function () { }) {
      fs.unlink(basePath + file, cb);
    },
    rename: function (from, to, cb = function () { }) {
      fs.rename(basePath + from, basePath + to, cb);
    },
  }
}

var apis = {
  replies: new Emitter,
  UID: function () {
    return (crypto.randomBytes(5).toString())
  },
  set: function (type, cb) {
    this.on(type, (m) => {
      done = (data) => {
        this.reply(type, data, m.key);
      }
      cb(m.body, done);
    })
  },
  send: function (type, data, key = null, isReply = false) {
    // console.log('sending message',type,data,key)
    process.send({ type, body: data, key, isReply });
  },
  reply: function (type, data, key = null) {
    this.send(type, data, key, true)
  },

  wait: function (type, key, cb) {
    var isCompleated = false;

    this.replies.once(type, (message) => {
      if (isCompleated) {
        console.error("BUG: Still waiting even after callback");
      }
      if (message.key == key) {
        isCompleated = true;
        // console.error("reply received!",message.body);
        cb(message.body);
      }
      else {
        this.wait(type, key, cb);
      }
    }, false);
  },
  get: function (type, data, cb) {
    if (cb == undefined) {
      cb = function () { }
    }
    var key = this.UID()
    this.send(type, data, key);
    this.wait(type, key, cb, true);
  },
}

Emitter(apis);




function stop(c = 0) {
  console.log('appService stopped with code: ', c);
  process.send({ type: 'killed', code: c });
  // process.exit(0);
}

function InitSource(){
  const cwd=process.cwd()
  return function (path, cb = function () { }, opts = null) {
    const fs = require('fs');
    if (opts == null) { fs.readFile( cwd+ '/' + path, cb); }
    else { fs.readFile(cwd + '/' + path, opts, cb); }
  }
  
}


var pine = {
  iac: InitIAC(),
  source: InitSource(),
  store: InitDb(),
  modules: process.env['required_modules'],
  app_type: process.env['app_type'],
  files: InitFiles(),
  box: {
    send: function (to, type, body) {
      process.send({ type: 'relay', to, body: { type, body } });
    },
    add: function (cb = function () { }) {
      apis.get('addBox', null, cb);
    },
    remove: function (bid, cb = function () { }) {
      apis.get('closeBox', bid, cb);
    }
  },
  openApp:function(ns,cb){
   apis.get('openApp',ns,cb);
  },
  openAppById:function(id,cb){
    apis.get('openAppById',id,cb);
   },
  setTimeout: (func, timeout) => {
    setTimeout(func, timeout);
  },
  setInterval: (func, interval) => {
    setInterval(func, interval);
  },
  apis: apis
}

Emitter(pine.box);
Emitter(pine);


process.on('message', (msg) => {
  if (msg.type == 'relay') {
    console.log('a relay message', msg);
    pine.box.emit(msg.body.body.type, { from: msg.body.from, body: msg.body.body.body });
  }
  else if (msg.type == 'iac-request') {
    iacEvents.req.emit(msg.body.type, { key: msg.body.key, data: msg.body.data, access: msg.body.access, client: msg.body.client });
  }
  else if (msg.type == 'iac-reply') {
    iacEvents.res.emit(msg.body.type, { key: msg.body.key, data: msg.body.data, access: msg.body.access, client: msg.body.client });
  }
  else if (msg.key != undefined && msg.key != null) {
    if (msg.isReply) {
      pine.apis.replies.emit(msg.type, { body: msg.body, key: msg.key });
    }
    else {
      pine.apis.emit(msg.type, { body: msg.body, key: msg.key });
    }
  }

  else if (msg.type == 'kill') {
    stop(0);
  }
  else {
    pine.emit(msg.type, msg.body)
  }
  // console.log('msg',msg);
})

pine.on('open-app-requested',()=>{
  console.log('open-app-requested');
})

if(pine.app_type == 'system_app'){
  var dir=process.env['dir'];
  var dataDir=process.env['dataDir'];
}

function readCode(cb) {
  const fs = require('fs');
  fs.readFile(process.env['bgPath'], 'utf-8', (err, code) => {
    if (code != null) {
      cb(code);
    }
  })
}

function runCode() {
  readCode(function (code) {

    if (pine.modules.includes('fs') && pine.app_type == 'system_app') {
      const fs = require('fs');
    }
    if (pine.modules.includes('net')) {
      const net = require('net');
    }
    if (pine.modules.includes('os') && pine.app_type == 'system_app') {
      const os = require('os');
    }
    if (pine.modules.includes('stream')) {
      const stream = require('stream');
    }
    if (pine.modules.includes('nedb') && pine.app_type == 'system_app') {
      const nedb = require('nedb');
    }
    if (!(pine.modules.includes('process') && pine.app_type == 'system_app')) {
      var process = undefined;
    }
    if (pine.modules.includes('http')) {
      const http = require('http');
    }
    if (pine.modules.includes('http2')) {
      const http2 = require('http2');
    }
    if (pine.modules.includes('dgram')) {
      const dgram = require('dgram');
    }
    if (pine.modules.includes('dgram')) {
      const dgram = require('dgram');
    }

    'use strict';
    require = function () {
      console.log('Access denied :P');
      return {}
    }
    var runCode = undefined;
    var InitFiles = undefined;
    var iacEvents = undefined;
    var InitIAC = undefined;
    module = {};
    var InitDb = undefined;
    var InitSource=undefined;

    eval(code);
  }.bind(undefined))
}

runCode();
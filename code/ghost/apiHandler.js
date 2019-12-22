const host = require('electron');
const fs = require('fs');
const $ = require('jquery');
const crypto = require("crypto");
var Emitter = require('component-emitter');
const process = require("process");
var Datastore = require('nedb');
var dataDir = null;
if (process.platform === "win32") { var Registry = require('winreg'); }


var handlers = {
    child: null,
    events: new Emitter,
    replies: new Emitter,
    UID: function () {
        return (crypto.randomBytes(5))
    },

    stores: {},
    win: host.remote.getCurrentWindow(),

    set: function (type, cb) {
        this.on(type, (m) => {
            done = (data) => {
                this.reply(type, data, m.key);
            }
            cb(m.data, done);
        })
    },

    resize: function () {
        if (this.win.isMaximized()) {
            this.win.unmaximize();
        }
        else {
            this.win.maximize();
        }
    },

    state: {
        controls: {
            isVisible: true,
            html: '',
            disabledHtml: ''
        },
        bar: {
            isVisible: true,
            title: 'Pine pizza',
            isFloating: false,
            background: "rgb(236, 236, 236)",
            color: "rgb(107, 107, 107)",
            blur: false
        }
    },

    setTitleBar: function (set, opts) {
        if (set) {
            this.state.bar.isVisible = true;
            $('#BAR').css({ display: 'block' });
            if (this.state.controls.isVisible) {
                $('#BAR_TXT').css({ 'margin-left': '6rem', 'padding-right': '6rem' })
            }
            else {
                $('#BAR_TXT').css({ 'margin-left': '0rem', 'padding-right': '0rem' })
            }
            if (opts != undefined) {
                if (opts.float != undefined) {
                    if (opts.float) {
                        this.state.bar.isFloating = true;
                        $('#BAR').css({ position: 'fixed', top: '0px', left: '0px' });
                    }
                    else {
                        this.state.bar.isFloating = false;
                        $('#BAR').css({ position: 'relative', top: '0px', left: '0px' });
                    }
                }
                if (opts.background != undefined && typeof opts.background == 'string') {
                    this.state.bar.background = opts.background;
                    $('#BAR').css({ 'background': opts.background })
                }
                if (opts.color != undefined && typeof opts.color == 'string') {
                    this.state.bar.color = opts.color;
                    $('#BAR').css({ 'color': opts.color })
                }
            }
        }
        else {
            this.state.isVisible = false;
            $('#BAR').css({ display: 'none' });
        }
    },
    getTitleBarStatus: function () {
        return (this.state.bar)
    },

    updateControls: function () {
        getControls = () => {
            var red = '<div class="bar_butts bar_butt_red" onClick=win.close()></div>';
            var yellow = '<div class="bar_butts bar_butt_yellow" onClick=win.minimize()></div>';
            var green = '<div class="bar_butts bar_butt_green" onClick=handlers.resize()></div>';
            var grey = '<div class="bar_butts" ></div>';
            var controls = red;
            if (this.win.isMinimizable()) {
                controls += yellow;
            }
            else {
                controls += grey;
            }
            if (this.win.isMaximizable() && this.win.isResizable()) {
                controls += green;
            }
            return (controls)
        }
        getControlsDisabled = () => {
            var grey = '<div class="bar_butts" ></div>';
            var controls = grey + grey;
            if (this.win.isMaximizable()) {
                controls += grey;
            }
            return (controls)
        }
        if (this.state.controls.isVisible) {
            this.state.controls.html = getControls();
            this.state.controls.disabledHtml = getControlsDisabled();
            if (this.win.isFocused()) { $("#controls").html(this.state.controls.html) }
            else {
                $("#controls").html(this.state.controls.disabledHtml)
            }
        }
    },

    isControlsVisible: function () {
        return (this.state.controls.isVisible)
    },

    setControls: function (val) {
        if (val == false) {
            this.state.controls.isVisible = val;
            $("#controls").css({ display: 'none' });
        }
        else {
            this.state.controls.isVisible = true;
            $("#controls").css({ display: 'flex' });
            this.updateControls()
        }
        if (this.state.controls.isVisible) {
            $('#BAR_TXT').css({ 'margin-left': '6rem', 'padding-right': '6rem' })
        }
        else {
            $('#BAR_TXT').css({ 'margin-left': '0rem', 'padding-right': '0rem' })
        }
    },






    initAPIs: function () {

        this.set('store.open', (req, reply) => {
            if (this.stores[req] == undefined) {
                this.stores[req] = new Datastore({ filename: dataDir + '/data/appData/db/' + this.info.appId + '/' + req, autoload: false });
                this.stores[req].loadDatabase(function (err) {
                    var n = req;
                    if (err != null) { n = null }
                    reply({ error: err, data: n })
                });
            }
            else {
                reply({ error: 'STORE_ALREADY_OPEN', data: null });
            }
        })
        this.set('store.find', (req, reply) => {
            this.stores[req.store].find(req.query, req.projection).skip(req.skip).limit(req.limit).sort(req.sort).exec((err, data) => {
                reply({ error: err, data })
            })
        })
        this.set('store.findOne', (req, reply) => {
            if (req.projection == undefined || req.projection == null) {
                req.projection = {};
            }
            this.stores[req.store].findOne(req.query, req.projection, (err, data) => {
                reply({ error: err, data })
            })
        })
        this.set('store.insert', (req, reply) => {
            this.stores[req.store].insert(req.data, (err, doc) => {
                reply({ error: err, data: doc })
            })
        })
        this.set('store.count', (req, reply) => {
            this.stores[req.store].count(req.query, (err, no) => {
                reply({ error: err, data: no })
            })
        })
        this.set('store.update', (req, reply) => {
            if (req.options == undefined || req.options == null) {
                req.options = {};
            }
            this.stores[req.store].update(req.query, req.action, req.options, (err, res) => {
                reply({ error: err, data: res })
            })
        })
        this.set('store.remove', (req, reply) => {
            this.stores[req.store].remove(req.query, req.options, (err, res) => {
                reply({ error: err, data: res })
            })
        })
        this.set('store.deleteStore', (req, reply) => {
            this.stores[req] = undefined;
            fs.unlink(dataDir + '/data/appData/db/' + this.info.appId + '/' + req, (err) => {
                reply(err)
            })
        })
        this.set('store.close', (req, reply) => {
            if (this.stores[req] != undefined) {
                this.stores[req] = undefined;
                reply({ error: null, data: req });
            }
            else {
                reply({ error: 'STORE_ALREADY_CLOSED', data: null });
            }
        })
        this.set('showTitleBar', (req, reply) => {
            this.setTitleBar(true, req);
            reply();
        })
        this.set('hideTitleBar', (req, reply) => {
            this.setTitleBar(false);
            reply();
        })
        this.set('titleBarStatus', (req, reply) => {
            reply(this.getTitleBarStatus());
        })
        this.set('showControls', (req, reply) => {
            this.setControls(true);
            reply();
        })
        this.set('hideControls', (req, reply) => {
            this.setControls(false);
            reply();
        })
        this.set('isControlsVisible', (req, reply) => {
            reply(this.isControlsVisible());
        })
        this.set('setTitle', (req, reply) => {
            this.state.bar.title = req;
            $("#BAR_TXT").text(req);
            reply(win.setTitle(req));
        })
        this.set('getTitle', (req, reply) => {
            reply(win.getTitle());
        })
        this.set('setOpacity', (req, reply) => {
            this.win.setOpacity(req);
            reply();
        })
        this.set('getOpacity', (req, reply) => {
            reply(this.win.getOpacity());
        })
        this.set('flashFrame', (req, reply) => {
            this.win.flashFrame(req);
            reply();
        })
        this.set('setThumbnailToolTip', (req, reply) => {
            this.win.setThumbnailToolTip(req);
            reply();
        })
        this.set('setThumbnailClip', (req, reply) => {
            this.win.setThumbnailClip(req);
            reply();
        })
        this.set('setProgressBar', (req, reply) => {
            if (req.mode != null || req.mode != undefined) {
                this.win.setProgressBar(req.progress, { mode: req.mode });
            }
            else {
                this.win.setProgressBar(req.progress);
            }
            reply();
        })
        this.set('isMovable', (req, reply) => {
            reply(this.win.isMovable());
        })
        this.set('setMovable', (req, reply) => {
            this.win.setMovable(req);
            reply();
        })
        this.set('getPosition', (req, reply) => {
            reply(this.win.getPosition());
        })
        this.set('setPosition', (req, reply) => {
            this.win.setPosition(req.x, req.y);
            reply();
        })
        this.set('getSize', (req, reply) => {
            reply(this.win.getSize());
        })
        this.set('setSize', (req, reply) => {
            this.win.setSize(req.width, req.height);
            reply();
        })
        this.set('isResizable', (req, reply) => {
            reply(this.win.isResizable());
        })
        this.set('setResizable', (req, reply) => {
            this.win.setResizable(req);
            this.updateControls();
            reply();
        })
        this.set('getMinimumSize', (req, reply) => {
            reply(this.win.getMinimumSize());
        })
        this.set('setMinimumSize', (req, reply) => {
            this.win.setMinimumSize(req.width, req.height);
            reply();
        })
        this.set('getMaximumSize', (req, reply) => {
            reply(this.win.getMaximumSize());
        })
        this.set('setMaximumSize', (req, reply) => {
            this.win.setMaximumSize(req.width, req.height);
            reply();
        })
        this.set('isAlwaysOnTop', (req, reply) => {
            reply(this.win.isAlwaysOnTop());
        })
        this.set('setAlwaysOnTop', (req, reply) => {
            this.win.setAlwaysOnTop(req);
            reply();
        })
        this.set('center', (req, reply) => {
            this.win.center();
            reply();
        })
        this.set('moveTop', (req, reply) => {
            this.win.moveTop();
            reply();
        })
        this.set('isFullScreenable', (req, reply) => {
            reply(this.win.isFullScreenable());
        })
        this.set('setFullScreenable', (req, reply) => {
            this.win.setFullScreenable(req);
            reply();
        })
        this.set('isFullScreen', (req, reply) => {
            reply(this.win.isFullScreen());
        })
        this.set('setFullScreen', (req, reply) => {
            this.win.setFullScreen(req);
            reply();
        })
        this.set('setFocusable', (req, reply) => {
            this.win.setFocusable(req);
            reply();
        })
        this.set('isFocused', (req, reply) => {
            reply(this.win.isFocused());
        })
        this.set('focus', (req, reply) => {
            this.win.focus();
            reply();
        })
        this.set('blur', (req, reply) => {
            this.win.blur();
            reply();
        })
        this.set('alert', (req, reply) => {
            alert(req);
            reply();
        })
        this.set('destroy', (req, reply) => {
            this.win.destroy();
            reply();
        })
        this.set('close', (req, reply) => {
            this.win.close();
            reply();
        })
        this.set('minimize', (req, reply) => {
            this.win.minimize();
            reply();
        })
        this.set('isMinimized', (req, reply) => {
            reply(this.win.isMinimized());
        })
        this.set('isMinimizable', (req, reply) => {
            reply(this.win.isMinimizable());
        })
        this.set('setMinimizable', (req, reply) => {
            this.win.setMinimizable(req);
            this.updateControls();
            reply();
        })
        this.set('maximize', (req, reply) => {
            this.win.maximize();
            reply();
        })
        this.set('isMaximized', (req, reply) => {
            reply(this.win.isMaximized());
        })
        this.set('isMaximizable', (req, reply) => {
            reply(this.win.isMaximizable());
        })
        this.set('setMaximizable', (req, reply) => {
            this.win.setMaximizable(req);
            this.updateControls();
            reply();
        })
        this.set('unmaximize', (req, reply) => {
            this.win.unmaximize();
            reply();
        })
        this.set('resize', (req, reply) => {
            this.resize();
            reply();
        })
        this.set('restore', (req, reply) => {
            this.win.restore();
            reply();
        })
        this.set('isNormal', (req, reply) => {
            reply(this.win.isNormal());
        })
        this.set('ping', (req, reply) => {
            this.win.show();
            reply();
        })
        this.set('get_info', (req, reply) => {
            reply('Pine Open Source Software for Desktops [version 0.0.1]');
        })
        this.set('isDarkMode', (req, res) => {

            if (process.platform === "win32") {
                regKey = new Registry({
                    hive: Registry.HKCU, // open registry hive HKEY_CURRENT_USER
                    key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize'
                })
                regKey.values(function (err, items /* array of RegistryItem */) {
                    if (err) {
                        console.error('ERROR: ' + err);
                        res(false);
                    }
                    else {
                        var prop = items.find((item) => {
                            if (item.name == 'AppsUseLightTheme') { return true }
                            else { return false }
                        })
                        if (prop.value == "0x1") {
                            res(false);
                        }
                        else {
                            res(true);
                        }
                    }
                });
            }
            else {
                res(host.remote.systemPreferences.isDarkMode());
            }

        })

        this.set('getAccentColor', (req, res) => {
            res(host.remote.systemPreferences.getAccentColor())
        })
    },

    info: {
        appId: null,
        boxId: null
    },
    init: function (appId, boxId, appRec, dDir) {
        dataDir = dDir;
        this.child = document.getElementById("APP_BOX");
        // console.log('initializing apiHandelers..');
        this.info.appId = appId;
        this.info.boxId = boxId;
        if (appRec.prefer_theme != undefined && appRec.prefer_theme == 'dark') {
            this.setTitleBar(true, { float: false, background: 'black', color: 'white' })
        }

        this.setControls(true);

        

        this.state.bar.title = appRec.name;
        $("#BAR_TXT").text(appRec.name);

        this.win.on('focus', (e) => {
            this.send("focus");
            if (this.state.controls.isVisible) {
                $('#controls').html(this.state.controls.html);
            }
        })
        this.win.on('blur', (e) => {
            this.send("blur");
            if (this.state.controls.isVisible) {
                $('#controls').html(this.state.controls.disabledHtml);
            }
        })
        this.win.on('maximize', (e) => {
            this.send("maximize");
        })
        this.win.on('minimize', (e) => {
            this.send("minimize");
        })
        this.win.on('unmaximize', (e) => {
            this.send("unmaximize");
        })
        this.win.on('restore', (e) => {
            this.send("restore");
        })
        this.win.on('resize', (e) => {
            this.send("resize");
        })
        this.win.on('move', (e) => {
            this.send("move");
        })
        this.win.on('enter-full-screen', (e) => {
            this.send("enter-fullScreen");
        })
        this.win.on('leave-full-screen', (e) => {
            this.send("leave-fullScreen");
        })


        host.ipcRenderer.on('relay', (event, data) => {
            //  console.log('a message from host:',data);
            this.send('relay', data);
        })

        emit = (e) => {
            //console.log('emiting..',e)
            if (e.key == undefined) {
                e.key = null;
            }
            if (e.type != undefined && e.type != null && e.type != 'message') {
                if (e.key != null) {
                    //its a query
                    this.emit(e.type, { data: e.data, key: e.key })
                }
                else {
                    //its an event
                    if (e.type == 'relay') {
                       // console.log('sending to appService!', e.data);
                        host.ipcRenderer.send('relay', { appId, boxId, body: e.data })
                    }
                    else {
                        this.events.emit(e.type, e.data)
                    }
                }
            }
        }
        window.addEventListener('message', (m) => {
            var req = m.data;
            if (!req.isReply) {
                emit(req);
            }
            else {
                this.replies.emit(req.type, { data: req.data, key: req.key })
            }
        }, false);

        this.initAPIs();
        this.win.show();
    },

    send: function (type, data, key = null, isReply = false) {
        this.child.contentWindow.postMessage({ type, data, key, isReply }, '*')
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
                cb(message.data);
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

Emitter(handlers);

module.exports = handlers;
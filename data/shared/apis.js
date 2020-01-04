
/**
 * Expose `Emitter`.
 */

if (typeof module !== 'undefined') {
    module.exports = Emitter;
}

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
    if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
    for (var key in Emitter.prototype) {
        obj[key] = Emitter.prototype[key];
    }
    return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
    Emitter.prototype.addEventListener = function (event, fn) {
        this._callbacks = this._callbacks || {};
        (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
            .push(fn);
        return this;
    };

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function (event, fn) {
    function on() {
        this.off(event, on);
        fn.apply(this, arguments);
    }

    on.fn = fn;
    this.on(event, on);
    return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
    Emitter.prototype.removeListener =
    Emitter.prototype.removeAllListeners =
    Emitter.prototype.removeEventListener = function (event, fn) {
        this._callbacks = this._callbacks || {};

        // all
        if (0 == arguments.length) {
            this._callbacks = {};
            return this;
        }

        // specific event
        var callbacks = this._callbacks['$' + event];
        if (!callbacks) return this;

        // remove all handlers
        if (1 == arguments.length) {
            delete this._callbacks['$' + event];
            return this;
        }

        // remove specific handler
        var cb;
        for (var i = 0; i < callbacks.length; i++) {
            cb = callbacks[i];
            if (cb === fn || cb.fn === fn) {
                callbacks.splice(i, 1);
                break;
            }
        }

        // Remove event specific arrays for event types that no
        // one is subscribed for to avoid memory leak.
        if (callbacks.length === 0) {
            delete this._callbacks['$' + event];
        }

        return this;
    };

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function (event) {
    this._callbacks = this._callbacks || {};

    var args = new Array(arguments.length - 1)
        , callbacks = this._callbacks['$' + event];

    for (var i = 1; i < arguments.length; i++) {
        args[i - 1] = arguments[i];
    }

    if (callbacks) {
        callbacks = callbacks.slice(0);
        for (var i = 0, len = callbacks.length; i < len; ++i) {
            callbacks[i].apply(this, args);
        }
    }

    return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function (event) {
    this._callbacks = this._callbacks || {};
    return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function (event) {
    return !!this.listeners(event).length;
};


/*=================================================================================================== */


window.addEventListener("beforeunload", (e) => {
    console.log("href changing", e);
})

var pine = {
    ver: '0.0.1',
    parent: null,
    events: new Emitter,
    replies: new Emitter,
    appService: {
        send: function (type, body) {
            console.log('sending relay', type, body)
            pine.send('relay', { type, body })
        }
    },
    UID: function () {
        var str = '';
        var dt = new Date();
        str += dt.getSeconds();
        str += dt.getMilliseconds();
        str += Math.floor(Math.random() * 1000);
        return str;
    },
    init: function () {

        Emitter(this);
        Emitter(this.appService);

        this.appService.on('hi!', (body) => {
            console.log('relay event reached app_box', body);
            this.appService.send('hello back!', 'hello from box');
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
                        this.appService.emit(e.data.type, e.data.body);
                    }
                    else {
                        console.log("emitting event:", e.type)
                        this.events.emit(e.type, e.data)
                    }

                }
            }
            else {
                console.error('event obj not proper in emit>init>pineAPIs', e)
            }
        }

        console.log('Pine APIs ' + this.ver);
        this.parent = window.parent;

        window.addEventListener('message', (m) => {
            var req = m.data;
            if (!req.isReply) {
                emit(req);
            }
            else {
                this.replies.emit(req.type, { data: req.data, key: req.key })
            }
        }, false);

        this.get('ping', null, (data) => {
            console.log("[APIs working]")
        });
    },
    send: function (type, data, key = null, isReply = false) {
        this.parent.postMessage({ type, data, key, isReply }, '*')
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
        var key = this.UID();
        this.send(type, data, key);
        this.wait(type, key, cb);
    },
    set: function (type, cb) {
        this.on(type, (m) => {
            done = (data) => {
                this.reply(type, data, m.key);
            }
            cb(m.data, done);
        })
    },
    dev: function () {
        document.onkeyup = function (e) {
            if (e.ctrlKey && e.key == 'l') {
              window.location.reload();
            }
        }
    },
    showTitleBar: function (opts) {
        this.get('showTitleBar', opts);
    },
    hideTitleBar: function () {
        this.get('hideTitleBar', null);
    },
    titleBarStatus: function (cb) {
        this.get('titleBarStatus', null, cb);
    },
    showControls: function () {
        this.get('showControls', null);
    },
    hideControls: function () {
        this.get('hideControls', null);
    },
    isControlsVisible: function (cb) {
        this.get('isControlsVisible', null, cb);
    },
    getTitle: function (cb) {
        this.get('getTitle', null, cb)
    },
    setTitle: function (val) {
        this.get('setTitle', val)
    },
    flashFrame: function (val) {
        this.get('flashFrame', val)
    },
    setFocusable: function (val) {
        this.get('setFocusable', val)
    },
    setOpacity: function (val) {
        this.get('setOpacity', val)
    },
    getOpacity: function (cb) {
        this.get('getOpacity', null, cb)
    },
    setThumbnailToolTip: function (str) {
        this.get('setThumbnailToolTip', str)
    },
    setThumbnailClip: function (rect) {
        if (rect == undefined) { rect = { x: 0, y: 0, width: 0, height: 0 } }
        this.get('setThumbnailClip', rect)
    },
    setProgressBar: function (progress, mode) {
        this.get('setProgressBar', { progress, mode })
    },
    info: function (cb) {
        this.get('get_info', null, cb)
    },
    isDarkMode: function (cb) {
        this.get('isDarkMode', null, cb);
    },
    accentColor: function (cb) {
        this.get('getAccentColor', null, cb);
    },
    isMovable: function (cb) {
        this.get('isMovable', null, cb);
    },
    setMovable: function (val, cb) {
        this.get('setMovable', val, cb);
    },
    getPosition: function (cb) {
        this.get('getPosition', null, cb);
    },
    setPosition: function (x, y, cb) {
        this.get('setPosition', { x, y }, cb);
    },
    getSize: function (cb) {
        this.get('getSize', null, cb);
    },
    setSize: function (width, height, cb) {
        this.get('setSize', { width, height }, cb);
    },
    isResizable: function (cb) {
        this.get('isResizable', null, cb);
    },
    setResizable: function (val, cb) {
        this.get('setResizable', val, cb);
    },
    getMinimumSize: function (cb) {
        this.get('getMinimumSize', null, cb);
    },
    setMinimumSize: function (width, height, cb) {
        this.get('setMinimumSize', { width, height }, cb);
    },
    getMaximumSize: function (cb) {
        this.get('getMaximumSize', null, cb);
    },
    setMaximumSize: function (width, height, cb) {
        this.get('setMaximumSize', { width, height }, cb);
    },
    isAlwaysOnTop: function (cb) {
        this.get('isAlwaysOnTop', null, cb);
    },
    setAlwaysOnTop: function (val, cb) {
        this.get('setAlwaysOnTop', val, cb);
    },
    center: function (cb) {
        this.get('center', null, cb);
    },
    moveTop: function (cb) {
        this.get('moveTop', null, cb);
    },
    isFullScreenable: function (cb) {
        this.get('isFullScreenable', null, cb);
    },
    setFullScreenable: function (val, cb) {
        this.get('setFullScreenable', val, cb);
    },
    isFullScreen: function (cb) {
        this.get('isFullScreen', null, cb);
    },
    setFullScreen: function (val, cb) {
        this.get('setFullScreen', val, cb);
    },
    isFocused: function (cb) {
        this.get('isFocused', null, cb);
    },
    focus: function (cb) {
        this.get('focus', null, cb);
    },
    blur: function (cb) {
        this.get('blur', null, cb);
    },
    resize: function (cb) {
        this.get('resize', null, cb);
    },
    maximize: function (cb) {
        this.get('maximize', null, cb);
    },
    isMaximized: function (cb) {
        this.get('isMaximized', null, cb);
    },
    isMaximizable: function (cb) {
        this.get('isMaximizable', null, cb);
    },
    setMaximizable: function (val, cb) {
        this.get('setMaximizable', val, cb);
    },
    unmaximize: function (cb) {
        this.get('unmaximize', null, cb);
    },
    minimize: function (cb) {
        this.get('minimize', null, cb);
    },
    isMinimized: function (cb) {
        this.get('isMinimized', null, cb);
    },
    isMinimizable: function (cb) {
        this.get('isMinimizable', null, cb);
    },
    setMinimizable: function (val, cb) {
        this.get('setMinimizable', val, cb);
    },
    isNormal: function (cb) {
        this.get('isNormal', null, cb);
    },
    restore: function (cb) {
        this.get('restore', null, cb);
    },
    close: function (cb) {
        this.get('close', null, cb);
    },
    destroy: function (cb) {
        this.get('destroy', null, cb);
    },
    confirmClose: function (cb) {
        window.onbeforeunload = (e) => {
            cb((confirm = true) => {
                if (!confirm) {
                    e.returnValue = false;
                }
            })
        }
    },
    alert: function (message) {
        this.get('alert', message)
    },
    store: function (db) {
        if (db != undefined || db != null) {
            var self = this;
            return ({
                find: function (query, projection, callback) {
                    if (typeof projection == 'function') {
                        callback = projection;
                        projection = {};
                    }
                    var req = { store: db, query, projection }
                    var actions = {
                        exec: function (cb) {
                            self.get('store.find', req, (res) => {
                                cb(res.error, res.data);
                            })
                        },
                        sort: function (val) {
                            res.sort = val;
                        },
                        limit: function (val) {
                            res.limit = val;
                        },
                        skip: function (val) {
                            res.skip = val;
                        }
                    }
                    if (callback != undefined) {
                        actions.exec(callback);
                    }
                    return actions;
                },
                findOne: function (query, projection, cb) {
                    if (typeof projection == 'function') {
                        cb = projection;
                        projection = {};
                    }
                    self.get('store.findOne', { store: db, query, projection }, (res) => {
                        cb(res.error, res.data);
                    })
                },
                count: function (query, cb) {
                    self.get('store.count', { store: db, query }, (res) => {
                        cb(res.error, res.data);
                    })
                },
                update: function (query, action, options, cb) {
                    if (typeof options == 'function') {
                        cb = options;
                        options = {};
                    }
                    self.get('store.update', { store: db, query, action, options }, (res) => {
                        if (cb != undefined)
                            cb(res.error, res.data);
                    })
                },
                insert: function (doc, cb) {
                    self.get('store.insert', { store: db, data: doc }, (res) => {
                        if (cb != undefined)
                            cb(res.error, res.data);
                    })
                },
                remove: function (query, options, cb) {
                    if (typeof options == 'function') {
                        cb = options;
                        options = {};
                    }
                    self.get('store.remove', { store: db, query, options }, (res) => {
                        if (cb != undefined)
                            cb(res.error, res.data);
                    })
                },
                open: function (cb) {
                    self.get('store.open', db, (res) => {
                        if (cb != undefined)
                            cb(res.error, res.data);
                    })
                },
                close: function (cb) {
                    self.get('store.close', db, (res) => {
                        if (cb != undefined)
                            cb(res.error, res.data);
                    })
                },
                deleteStore: function (cb) {
                    self.get('store.deleteStore', db, (res) => {
                        if (cb != undefined)
                            cb(res.error, res.data);
                    })
                }
            })
        }
        else {
            console.log("Store name not mentioned");
            return ({})
        }

    }
}

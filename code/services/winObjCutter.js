/**
 * @ASRIENT 9.1.20
 * Fixes the BrowserWindow object, so that it is less exploitable
 */
const fs = require('fs');
const electron = require('electron');
const crypto = require('crypto');

function cutter(win) {

    function prox(func) {
        return function (arg1, arg2, arg3, arg4, arg5) {
            var res = func(arg1, arg2, arg3, arg4, arg5);
            return res;
        }
    }

    var x = {
        on: prox(win.on),
        off: prox(win.off),
        once: prox(win.once),

        id: win.id,
        minimizable: win.minimizable,
        maximizable: win.maximizable,
        fullScreenable: win.fullScreenable,
        resizable: win.resizable,
        closable: win.closable,

        resize: function () {
            if (win.isMaximized()) {
                win.unmaximize();
            }
            else {
                win.maximize();
            }
        },
        loadURL:prox(win.loadURL),
        send: prox(win.webContents.send),
        destroy: prox(win.destroy),
        close: prox(win.close),
        focus: prox(win.focus),
        blur: prox(win.blur),
        isFocused: prox(win.isFocused),
        isDestroyed: prox(win.isDestroyed),
        show: prox(win.show),
        showInactive: prox(win.showInactive),
        hide: prox(win.hide),
        isVisible: prox(win.isVisible),
        isModal: prox(win.isModal),
        maximize: prox(win.maximize),
        unmaximize: prox(win.unmaximize),
        isMaximized: prox(win.isMaximized),
        minimize: prox(win.minimize),
        restore: prox(win.restore),
        isMinimized: prox(win.isMinimized),
        setFullScreen: prox(win.setFullScreen),
        isFullScreen: prox(win.isFullScreen),
        setSimpleFullScreen: prox(win.setSimpleFullScreen),
        isSimpleFullScreen: prox(win.isSimpleFullScreen),
        isNormal: prox(win.isNormal),
        setBackgroundColor: prox(win.setBackgroundColor),
        setBounds: prox(win.setBounds),
        getBounds: prox(win.getBounds),
        setContentBounds: prox(win.setContentBounds),
        getContentBounds: prox(win.getContentBounds),
        getNormalBounds: prox(win.getNormalBounds),
        setEnabled: prox(win.setEnabled),
        isEnabled: prox(win.isEnabled),
        setSize: prox(win.setSize),
        getSize: prox(win.getSize),
        setContentSize: prox(win.setContentSize),
        setMinimumSize: prox(win.setMinimumSize),
        getMinimumSize: prox(win.getMinimumSize),
        setMaximumSize: prox(win.setMaximumSize),
        getMaximumSize: prox(win.getMaximumSize),
        setResizable: prox(win.setResizable),
        isResizable: prox(win.isResizable),
        setMovable: prox(win.setMovable),
        isMovable: prox(win.isMovable),
        setMinimizable: prox(win.setMinimizable),
        isMinimizable: prox(win.isMinimizable),
        setMaximizable: prox(win.setMaximizable),
        isMaximizable: prox(win.isMaximizable),
        setFullScreenable: prox(win.setFullScreenable),
        isFullScreenable: prox(win.isFullScreenable),
        setClosable: prox(win.setClosable),
        isClosable: prox(win.isClosable),
        setAlwaysOnTop: prox(win.setAlwaysOnTop),
        isAlwaysOnTop: prox(win.isAlwaysOnTop),
        moveTop: prox(win.moveTop),
        center: prox(win.center),
        setPosition: prox(win.setPosition),
        getPosition: prox(win.getPosition),
        setTitle: prox(win.setTitle),
        getTitle: prox(win.getTitle),
        flashFrame: prox(win.flashFrame),
        setSkipTaskbar: prox(win.setSkipTaskbar),
        setKiosk: prox(win.setKiosk),
        isKiosk: prox(win.isKiosk),
        setProgressBar: prox(win.setProgressBar),
        setOverlayIcon: prox(win.setOverlayIcon),
        setHasShadow: prox(win.setHasShadow),
        setOpacity: prox(win.setOpacity),
        getOpacity: prox(win.getOpacity),
        setShape: prox(win.setShape),
        setThumbarButtons: prox(win.setThumbarButtons),
        setThumbnailClip: prox(win.setThumbnailClip),
        setThumbnailToolTip: prox(win.setThumbnailToolTip),
        setAutoHideMenuBar: prox(win.setAutoHideMenuBar),
        isMenuBarAutoHide: prox(win.isMenuBarAutoHide),
        isMenuBarVisible: prox(win.isMenuBarVisible),
        setFocusable: prox(win.setFocusable),
        setVibrancy: prox(win.setVibrancy),
        setTouchBar: prox(win.setTouchBar)
    }

    return x;
}



module.exports = function (win) {
    if (win != undefined && win != null) {
        return cutter(win)
    }
    else {
        return win;
    }
}
const { app, BrowserWindow } = require('electron');
var dataDir = null;
function createWindow() {
    // Create the browser window.
    let win = new BrowserWindow({
        width: 600,
        height: 300,
        frame: false,
        transparent: false,
        opacity: 1,
        setResezable:false,
        webPreferences: {
            nodeIntegration: true
        }
    })

    // and load the index.html of the app.
    win.loadFile('./prompts/pannel.html');
}

function alert(title = "Alert!", body = null, click = function () { }) {
    ask(title, body, { label: "Okay", click })
}

//opts={label:"okay",click:function(){},color:"blue"}

function ask(title, body, opts) {
    createWindow();
}

module.exports = {
    init: function (vars) {
        dataDir = vars.dataDir;

    },
    alert, ask
}
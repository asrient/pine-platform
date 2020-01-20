const { app, BrowserWindow, Tray, systemPreferences } = require('electron');
const fs = require('fs');
var Router = require("./router.js");
var setup = require("./setup.js");

var setupRequired = false;
var dirResolved = false;
var appReady = false;

const version = '1.0';
var dataDir = app.getPath('home') + '/Pine';

fs.readdir(dataDir, (err, info) => {
  if (err == null) {
    console.log(info)
    if (info.includes('redirect.txt')) {
      fs.readFile(dataDir + '/redirect.txt', 'utf-8', (err, r) => {
        if (err != null) {
          forceQuit();
        }
        else {
          dataDir = r;
          dirResolved = true;
          console.log('redirected dir:', dataDir);
          TryInit();
        }
      })
    }
    else if (info.includes('core')) {
      dirResolved = true;
      TryInit();
    }
    else {
      setupRequired = true;
      dirResolved = true;
      TryInit();
    }
  }
  else {
    setupRequired = true;
    dirResolved = true;
    TryInit();
  }
})


function init() {
  if (setupRequired) {
    console.log('setup required!');
    setup.installer();
  }
  else {
    //check if pine has been recently updated
    fs.readFile(dataDir + '/core/info.json', 'utf-8', (err, info) => {
      if (err == null) {
        info = JSON.parse(info);
        if (info.version == version) {
          //check for args to determine which app to run
          console.log(process.argv)
          if (process.argv[2] != undefined) {
            Router(process.argv[2], dataDir);
          }
          else {
            Router('launchpad', dataDir);
          }
        }
        else if (version > info.version) {
          //pine has been updated!
          console.log('setup required! [POST UPDATE]');
          setup.updater();
        }
      }
      else {
        forceQuit();
      }
    })
  }
}

function TryInit() {
  if (dirResolved && appReady) {
    init();
  }
}


app.name = "Pine";
app.clearRecentDocuments();



app.commandLine.appendSwitch('enable-transparent-visuals');

app.on('ready', () => {
  appReady = true;
  TryInit();
});


app.on('window-all-closed', (e) => {
  forceQuit();
})




forceQuit = () => {
  app.quit();
}
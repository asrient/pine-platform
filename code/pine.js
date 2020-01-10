const { app, BrowserWindow, Tray, systemPreferences } = require('electron');
const fs = require('fs');
var Router = require("./router.js");
var setupRequired = false;
var dirResolved = false;
var appReady = false;

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
    else if (info.includes('data')) {
      dirResolved = true;
      TryInit();
    }
    else {
      forceQuit();
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
    console.log('setup required');

  }
  else {
    //check for args to determine which app to run
    Router('launchpad', dataDir, (router) => {
      router.createWindow();
    });

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
  //e.preventDefault()
})




forceQuit = () => {
  app.quit();
}
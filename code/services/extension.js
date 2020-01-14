/**
 * @ASRIENT 15.1.20
 * Code to run the app background script in sandbox
 */

const fs = require('fs');
const electron = require('electron');
const { NodeVM } = require('vm2');

var dataDir = null;
var app = null;

function run(ext,cb) {
    const apis = require('./shared.js');
    const pine = apis(app, dataDir);

    function exp(obj){
      cb(obj)
    }
    const vm = new NodeVM({
        console: 'inherit',
        sandbox: {},
        require: {
            external: true,
            mock: { pine, exp }
        }
    });
    fs.readFile(dataDir + '/apps/' + app.id + '/source/' + app.extensions/* .ext */, function (err, code) {
        if (err != null) {
            console.error("cant read background file", err)
        }
        else {
            code = "const pine=require('pine');" + code;
            vm.run(code);
        }
    })
}

module.exports = function (appRec, dDir) {
    dataDir = dDir;
    app = appRec;
    return { run }
}
const fs = require('fs');
var Emitter = require('component-emitter');
var Datastore = require('nedb');

var dataDir = null;
var receive=function(ns,data){
console.log('receiver not initialised yet');
}

function send(body){

}

function scan(){

}

//export: init,send,scan,register,unregister,receiver 'emitter'

module.exports={
    init:function(vars,receiver){
        dataDir = vars.dataDir;
        relay=receiver;
    },
    send,scan
}
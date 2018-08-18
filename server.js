var cluster = require('cluster');
var process = require("process");
const sleep = require("sleep-promise");

if(cluster.isMaster) {
  var os = require('os');
  for (var i = 0; i < 4; i++) {
    cluster.fork();
  }
  cluster.on('exit', function(worker, code, signal) {
    console.log('worker ' + worker.process.pid + ' died');
    sleep(500).then(() => cluster.fork())
  });
} else {
  require("./index");
}

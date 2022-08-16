var path = require('path');
var express = require('express');
var router = express.Router();

/**
 * 
 * */
var isBuffer = require('is-buffer')
var wavHeader = require("waveheader");
var fs = require('fs');

var chunkSize = 50 * 60; // eg. 50hz * 60s =~ 60s

/**
 * 
 * */
router.ws('/recorder', async (ws, req) => {
  var sessionId = null;
  var rawarray = [];
  var lastClip = 0;
  console.log("ws opened");
  ws.on('message', async function(msg) {
    if (isBuffer(msg)) {
      rawarray.push(msg);
      //
      var type = 'clip';
      var filename = path.join(__dirname, '/../public/output/') 
              + 'sample-' + sessionId + '-' + type + '-'
              + Date.now()
              +'.wav';
      var len = rawarray.length;
      var start = len - chunkSize;
      if ((len % chunkSize) == 0) {
        lastClip = len;
        await saveAsShortAudio(rawarray, start, len, filename);
        req.app.emit('audioFileCreated', { sessionId, filename, type });
      }
    }
    else {
      console.log('ws received:', msg); 
      try {
        let { xSessionId } = JSON.parse(msg);
        sessionId = xSessionId;
      } catch (e) {
        console.log(e.message)
      }
    }
  });
  ws.on('close', async function() {
    console.log("ws on close");
    var type = '';
    var filename = '';
    // --- last clip audio
    if (rawarray.length && sessionId) {
      type = 'clip';
      filename = path.join(__dirname, '/../public/output/') 
              + 'sample-' + sessionId + '-' + type + '-'
              + Date.now()
              +'.wav';
      await saveAsShortAudio(rawarray, lastClip, rawarray.length, 
          filename);
      req.app.emit('audioFileCreated', { sessionId, filename, type });
    }
    // --- the whole audio
    if (rawarray.length && sessionId) {
      type = 'whole';
      filename = path.join(__dirname, '/../public/output/') 
              + 'sample-' + sessionId + '-' + type + '-'
              + Date.now()
              +'.wav';
      // file = fs.createWriteStream(filename);
      // file.write(wavHeader(16000 * rawarray.length / 50 * 2, {
      //       sampleRate: 16000,
      //       channels: 1,
      //       bitDepth: 16
      // }));
      // rawarray.forEach(function(data){
      //   file.write(data);// data: type of Buffer
      // });
      // file.end();
      await saveAsShortAudio(rawarray, 0, rawarray.length, 
          filename);
      req.app.emit('audioFileCreated', { sessionId, filename, type });
    }
    rawarray = [];
    console.log("ws saved");
  });
});

async function saveAsShortAudio (rawarray, start, end, filename) {
  file = fs.createWriteStream(filename);
  file.write(wavHeader(16000 * chunkSize / 50 * 2, {
        sampleRate: 16000,
        channels: 1,
        bitDepth: 16
  }));
  rawarray.slice(start, end).forEach(function(data){
    file.write(data); // data: type of Buffer
  });
  file.end();
  return true;
}

/**
 * 
 * */
router.ws('/echo', (ws, req) => {
  ws.on('message', (msg) => {
    console.log(msg)
    ws.send(msg);
  });
});

module.exports = router;
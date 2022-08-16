var express = require('express');
var router = express.Router();
var abridgeApi = require('../modules/AbridgeApi');
const DbApi = require('../modules/DbApi');

router.get('/test', async function(req, res, next) {
  try {
    res.json(['test ok!']); 
  } catch (err) {
    console.error(err)
    next(err);
  }
});

router.get('/reset/:sessionId', async function(req, res, next) {
  try {
    var { sessionId } = req.params;
    if (!sessionId) throw "empty sessionId";
    res.app.set(`app-events-${sessionId}`, []);
    res.json(['reset ok!']);
  } catch (err) {
    console.error(err)
    next(err);
  }
});

/* just for test */
router.get('/mimic/:encounterId', async function(req, res, next) {
  var payload;
  try {
    var { encounterId } = req.params;
    if (!encounterId) throw "empty encounterId";
    var dataDB = await abridgeApi.findDbById(encounterId);
    if (dataDB && ['NOTE_AVAILABLE', 'PROCESSING_FAILED'].includes(dataDB.status)) {
      payload = {
        status: dataDB.status,
        id: dataDB.id,
        externalId: dataDB.external_id,
        updatedAt: Date.now()
      }
    } else {
      var data = await abridgeApi.getEncounter(encounterId);
      if (['NOTE_AVAILABLE', 'PROCESSING_FAILED'].includes(data.status)) {
        await abridgeApi.storeDb(data);
      }
      payload = {
        status: data.status,
        id: data.id,
        externalId: data.externalId,
        updatedAt: Date.now()
      }
    }
    //---
    var externalIdArr = payload.externalId.split('@');
    payload.sessionId = externalIdArr[0];
    payload.type = externalIdArr[1];
    payload.externalId = externalIdArr[0] +'@'+ externalIdArr[1] +'@'+ Date.now();
    //---
    res.app.emit('noteUpdated', payload);
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

router.get('/webhooks', function(req, res, next) {
  try {
    console.log('Abridge-Signature', req.get('Abridge-Signature'));
    res.json(['ok!']);
  } catch (err) {
    next(err);
  }
});

router.post('/webhooks', function(req, res, next) {
  var payload = req.body;
  try {
    console.log('Abridge-Signature', req.get('Abridge-Signature'));
    console.log('payload', payload);
    if (payload 
          && payload.id 
          && payload.status 
          && ( payload.status == 'NOTE_AVAILABLE' 
                || payload.status == 'PROCESSING_FAILED' )
          && abridgeApi.verifyWebhook(payload, req.get('Abridge-Signature')) 
    ) {
      var externalIdArr = payload.externalId.split('@');
      payload.sessionId = externalIdArr[0];
      payload.type = externalIdArr[1];
      payload.externalId = externalIdArr[0] +'@'+ externalIdArr[1] +'@'+ Date.now();
      res.app.emit('noteUpdated', payload);
    }
    res.json(['ok!']);
  } catch (err) {
    next(err);
  }
});

router.get('/sse/:sessionId', function(req, res, next) {
  try {
    var { sessionId } = req.params;
    if (!sessionId) throw "empty sessionId";
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();
    res.write("retry: 10000\n\n");

    //
    var sent = new Map();
    var _events = res.app.get(`app-events-${sessionId}`);
    if (_events) {
      _events.forEach((_event) => {
        res.write(`data: ${JSON.stringify(_event)}\n\n`);
        sent.set(_event.externalId, true)
      })
    }
    //
    let intervalTask = setInterval(() => {
      res.write("event: ping\n\n");
      let _events = res.app.get(`app-events-${sessionId}`);
      if (_events) {
        _events.forEach((_event) => {
          if (!sent.has(_event.externalId)) {
            res.write(`data: ${JSON.stringify(_event)}\n\n`);
            sent.set(_event.externalId, true);
          }
        })
      }
    }, 2000);
    res.on('close', () => {
      clearInterval(intervalTask);
      res.end();
    }, false);
  } catch (err) {
    console.log(err);
    res.end();
    //next(err);
  }
});

router.get('/notes/:encounterId', async function(req, res, next) {
  var { encounterId } = req.params;
  try {
    if (!encounterId) throw "empty encounterId";
    var dataDB = await abridgeApi.findDbById(encounterId);
    if (dataDB && ['NOTE_AVAILABLE', 'PROCESSING_FAILED'].includes(dataDB.status)) {
      return res.json(dataDB); 
    }
    var data = await abridgeApi.getEncounter(encounterId);
    res.json(data); 
  } catch (e) {
    next(e)
  }
});

module.exports = router;

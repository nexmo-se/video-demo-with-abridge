var express = require('express');
var router = express.Router();
var openTokApi = require('../modules/OpenTokApi');
var apiKey = process.env.OT_API_KEY;

/***
 * 
***/
router.all('/', async function(req, res, next) {
  console.log(req.body);
  res.json(['ok!']); 
});

router.get('/session/:sessionId/audio-streamer/start', async function(req, res, next) {
  // return setTimeout(() => {
  //   return res.json({
  //     id: 'e966bc38-b58c-4970-99b5-7ac74d185aee',
  //     connectionId: 'c35fd2b0-a374-4082-9985-6d788c719b5f'
  //   });
  // }, 3000);
  var { sessionId } = req.params;
  try {
    if (!sessionId) throw "empty sessionId";
    var { connectionId } = await openTokApi.startAudioStreamer(sessionId);
    res.json({ connectionId });
  } catch (e) {
    next(e)
  }
});

router.get('/session/:sessionId/audio-streamer/stop/:connectionId', async function(req, res, next) {
  // return setTimeout(() => {
  //   return res.json(['audio stream is stopped']);
  // }, 3000)
  var { sessionId, connectionId } = req.params;
  try {
    if (!sessionId || !connectionId) throw 'empty sessionId or connectionId'
    if (!sessionId) throw "empty sessionId";
    await openTokApi.stopAudioStreamer(sessionId, connectionId);
    res.json(['audio stream is stopped']); 
  } catch (e) {
    next(e)
  }
});

router.get('/session/:roomId', async function(req, res, next) {
  var { roomId } = req.params;
  var sessionId = null;
  try {
    if (!roomId) throw "empty roomId";
    var dataDb = await openTokApi.dbFindRoomById(roomId);
    if (dataDb)
      sessionId = dataDb.session_id;
    else {
      var sessionId = await openTokApi.createSession();
      await openTokApi.dbStore({
        id: roomId,
        name: roomId,
        sessionId: sessionId,
      });
    }
    // State: init app-events-${sessionId}
    if (undefined == res.app.get(`app-events-${sessionId}`)) {
      res.app.set(`app-events-${sessionId}`, []);
    }
    return res.json({ apiKey, sessionId })
  } catch (e) {
    next(e)
  }
});

router.get('/session/:sessionId/token(/:name)?', async function (req, res, next) {
  var { sessionId, name } = req.params;
  try {
    if (!sessionId) throw "empty sessionId";
    var token = await openTokApi.generateToken(sessionId, name);
    res.json( { token } );
  } catch (e) {
    next(e)
  }
});

module.exports = router;

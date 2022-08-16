require('dotenv').config();
var PORT = process.env.PORT || 3002;
const DbApi = require("./modules/DbApi");
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var createHttpError = require('http-errors');
var fs = require('fs');

(async () => {
  await DbApi.migrate();
})();

var app = express();

/***
 * Setup express-ws.
***/
var wsInstance = require('express-ws')(app);
var wss = wsInstance.getWss();
wss.on('connection', function(ws) {
  console.log('wss on connection');
});

// ----------------------------------------------------------------------------
var indexRouter = require('./routes/index');
var abridgeRouter = require('./routes/abridge');
var wsRouter = require('./routes/ws');

// interact with AbridgeApi
var abridgeApi = require('./modules/AbridgeApi');

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var dir = './public/output'
if (!fs.existsSync(dir)){
  fs.mkdirSync(dir, { mask: 0o0766, recursive: true });
}

// ----------------------------------------------------------------------------
app.on('audioFileCreated', async function({ sessionId, filename, type }) {
  try {
    console.log('on audioFileCreated', { sessionId, filename, type });
    if (sessionId) {
      var data = await abridgeApi.createEncounter(`${sessionId}@${type}@${Date.now()}`);
      if (data && data.id) {
        try {
          await abridgeApi.storeDb(data);
          console.log('on audioFileCreated', 'done storeDb')
          await abridgeApi.uploadAudio(data.id, filename);
        } catch (e) {
          console.log(e.message)
        }
        // ---
        var events = app.get(`app-events-${sessionId}`);
        events = events.length? events : [];
        events.push({...data, sessionId, filename, type});
        app.set(`app-events-${sessionId}`, events);
      }
    }
  } catch (e) {
    console.log(e.message)
  }
});
app.on('noteUpdated', async function(data) {
  console.log('on noteUpdated', data)
  try {
    if (['NOTE_AVAILABLE', 'PROCESSING_FAILED'].includes(data.status)) {
      let { sessionId } = data;
      if (sessionId) {
        // ---
        try {
          let _data = await abridgeApi.getEncounter(data.id);
          if (['NOTE_AVAILABLE', 'PROCESSING_FAILED'].includes(_data.status)) {
            await abridgeApi.storeDb(_data);
            console.log('on noteUpdated', 'done storeDb')
          }
        } catch (e) {
          console.log(e.message);
        }
        // ---
        var events = app.get(`app-events-${sessionId}`);
        events = events.length? events : [];
        events.push(data);
        app.set(`app-events-${sessionId}`, events);
      }
    }
  } catch (e) {
    console.log(e.message)
  }
})

// ----------------------------------------------------------------------------
app.use('/api/monitoring', function (req, res, next) {
  //console.log(req.body);
  res.json(['ok!']); 
});
app.use('/api/abridge', abridgeRouter);
app.use('/api/ws', wsRouter);
app.use('/api', indexRouter);
// ----------------------------------------------------------------------------
/** error Not Found */
app.use(function(req, res, next) {
  next(createHttpError(404, `Not Found [${req.originalUrl}]`));
})
/** error Final handler */
app.use(function (err, req, res, next) {
  console.error(err)
  res.status(500).json({"message": "Something is wrong", "error": err.message?? err});
})
// ----------------------------------------------------------------------------
app.listen(PORT, () => console.log(`listening on port ${PORT}!`));

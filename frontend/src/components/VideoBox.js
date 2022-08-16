import React, {useEffect, useState} from 'react';
import { Stack, Box, Button } from '@mui/material';

import { getQueryVariable } from '../hooks/Utils';
import OT from "@opentok/client";

var APP_SERVER_BASE_URL = process.env.PUBLIC_URL? process.env.PUBLIC_URL : 'http://localhost:3002';
var publisher = null;
var session = null;

function handleError(error) {
  if (error) {
    console.log(error)
 }
}
export default function VideoBox(props) {
  const [connected, setConnected] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [connectionId, setConnectionId] = useState(null); // the connection of the audio streamer
 
  const width = getQueryVariable('role') === 'doctor'? 320 : 720;
  const height = getQueryVariable('role') === 'doctor'? 240 : 640;

  const startAnalyser = async (e) => {
    e.preventDefault();
    e.target.disabled = true;
    if (sessionId) {
      fetch(`${APP_SERVER_BASE_URL}/api/session/${sessionId}/audio-streamer/start`, { headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }})
      .then((res) => res.json())
      .then(data => {
        console.log(data);
        if (data.connectionId) {
          setConnectionId(data.connectionId);
        }
      }).catch(console.error).finally(() => {
        e.target.disabled = false;
      })
    }
  }

  const stopAnalyser = async (e) => {
    e.preventDefault();
    e.target.disabled = true;
    if (sessionId && connectionId) {
      fetch(`${APP_SERVER_BASE_URL}/api/session/${sessionId}/audio-streamer/stop/${connectionId}`, { headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }})
      .then((res) => res.json())
      .then(data => {
        console.log(data);
        setConnectionId(null);
      }).catch(console.error).finally(() => {
        e.target.disabled = false;
      })
    }
  }
  
  const onStreamCreated = (e) => {
    console.log("on", e.type);
    session.subscribe(e.stream, 'subscriber', {
        insertMode: 'append',
        width: width,
        height: height,
     }, handleError);
  };

  const onSessionConnected = (e) => {
    console.log("on", e.type);
    publisher && session.publish(publisher, handleError);
  }

  useEffect(() => {
    publisher = OT.initPublisher('publisher', {
      insertMode: 'append',
      width: '320',
      height: '240',
    }, handleError);

    try {
      if (!connected) {
        let room = getQueryVariable('room');
        // get session ID
        fetch(`${APP_SERVER_BASE_URL}/api/session/${room}`)
          .then(res => res.json())
          .then(({apiKey, sessionId}) => {
              // get token
              fetch(`${APP_SERVER_BASE_URL}/api/session/${sessionId}/token`)
                .then(res => res.json())
                .then(({token}) => {
                    session = OT.initSession(apiKey, sessionId);
                    session.on('sessionConnected', onSessionConnected);
                    session.on('streamCreated', onStreamCreated);
                    //
                    console.log('connect ...', apiKey, sessionId);
                    session.connect(token, error => {
                      if (error) handleError(error);
                      else setConnected(true);
                      setSessionId(sessionId);
                    });
                    //
                }).catch(console.error);
              //
          }).catch(console.error);
      }
    } catch (e) {
      console.log(e)
    }

    return () => {
      publisher && publisher.destroy();
      session && session.disconnect()
      window.removeEventListener('unhandledrejection', (e) => {
        console.log(e)
      });
    }
  }, []);

  useEffect(() => {
    if (connected) {
      console.log('connected', connected, 'publish ...');
      // todo here render buttons <> NoteBox
    }
  }, [connected]);
 
  return (
    <Stack 
      sx={{ height:{height}, width:'100%'}}
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      spacing={1}
    >
      <Box
        id="subscriber" 
        sx={{
          p:1, m:1,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-evenly',
          alignContent: 'flex-start',
          maxWidth: 1200,
        }}
        spacing={1}
      >
      </Box>

      {getQueryVariable('role') === 'doctor'?
        <Stack
          direction="column"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={2}
        >
          <Button key="start" variant="contained" 
            onClick={startAnalyser} disabled={connected && !connectionId? false:true}>Start Analyser</Button>
          <Button key="stop" variant="contained" 
            onClick={stopAnalyser} disabled={connected && connectionId? false:true}>Stop Analyser </Button>
        </Stack>
      : ''}

      <Box id="publisher" 
        sx={{ p:1, m:1,
            position: 'absolute',
            bottom: 10,
            right: 10,
      }}></Box>
    </Stack>
  );
}

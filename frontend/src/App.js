import React, { useState } from 'react';
import { Stack, Box, Button, ButtonGroup, TextField } from '@mui/material';

import InstructionBox from './components/InstructionBox';
import Sample1Box from './components/Sample1Box';
import Sample2Box from './components/Sample2Box';
import NoteBox from './components/NoteBox';
import VideoBox from './components/VideoBox';

import { getQueryVariable } from './hooks/Utils';

import './App.css';

function App() {
  var now = new Date();
  var index = `${now.getFullYear()}${now.getUTCMonth()}${now.getUTCDate()}${now.getUTCDay()}`;

  const [roomName, setRoomName] = useState('Room ' + index);

  const join = (role) => {
    const roomId = roomName.toLowerCase().replace(/[^\d^\w]/g, " ").replace(/[\s]+/g, "-");
    const paramsString = `room=${roomId}&role=${role === 'doctor'? role : 'visitor'}`;; 
    var url = '/?' + paramsString;
    var win = window.open(url, '_blank');
    if (win) {
      win.focus();
    }
  }

  if (getQueryVariable('sample')) {
    if (getQueryVariable('sample') == '2') {
      return (<Box sx={{p: 2}}><Sample2Box /></Box>)
    } else {
      return (<Box sx={{p: 2}}><Sample1Box /></Box>)
    }
  }
  else if (!getQueryVariable('room')) {
    return (<>
      <Stack
        direction="row"
        justifyContent="center"
        alignItems="center"
        spacing={2}
        sx={{p: 20}}
      >
        <TextField
          required
          id="room"
          label="Room Name"
          value={roomName}
          onChange={e => setRoomName(e.target.value)}
        />
        <ButtonGroup aria-label="outlined primary button group">
          <Button variant="contained" onClick={e => join('doctor')}>Join as Doctor</Button>
          <Button variant="outlined" onClick={e => join('visitor')}>Join as Visitor</Button>
        </ButtonGroup>
      </Stack>
    </>);
  } 
  else {
    return (<>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="stretch"
        spacing={2}
        sx={{ m: 0, p: 0}}
      >
        <Stack
          direction="column"
          justifyContent="space-between"
          alignItems="stretch"
          spacing={2}
          sx={{ m: 0, p: 0, 
            width: '80%'}}
        >
          <Box sx={{ m: 0, p: 2, pr: 3, pb: 3}} >
            <VideoBox></VideoBox>
          </Box>

          {getQueryVariable('role') === 'doctor'?
            <Box sx={{ m: 1, p: 2, 
              borderTop: 1, 
              borderColor: 'divider'
              }}>
              <NoteBox></NoteBox>
            </Box> : ''}
        </Stack>

        <Box sx={{ 
          width: '20%',
          borderLeft: 1, 
          borderColor: 'divider',
          height:'60%'
        }} >
          <InstructionBox></InstructionBox>
        </Box>
      </Stack>
    </>);    
  }

}

export default App;

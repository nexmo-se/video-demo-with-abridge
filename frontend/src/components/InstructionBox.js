import React from "react";
import { Drawer, Box, Button, Typography, List, ListItem, ListItemText } from '@mui/material';

import Sample1Box from '../components/Sample2Box';
import Sample2Box from '../components/Sample2Box';

function AboutBox(props) {
  return (<List dense={false}>
    {[
      ['utlize Vonage ConnectAPI to record Video Sessions'],
      ['get clinical notes from Abridge API'],
      ['upload recording-clips every minute, so it can get a note each minute'],
      ['also upload one recording that contains the whole conversation to get a note'],
    ].map((t, i) => (
      <ListItem key={i}>
        <Typography sx={{ mr:2 }} variant="body2" gutterBottom component="span">{'- '}</Typography>
        <ListItemText
          primary={<Typography sx={{ mr:2 }} gutterBottom component="span">{t[0]}</Typography>}
          secondary={" "}
        />
      </ListItem>
    ))}
  </List>);
}

function TestingTtepsBox(props) {
  return (<List dense={false}>
    {[
      ['User doctor and patient both join the session', '- use the same room name'],
      ['Doctor Click button [START ANALYSER]', '- app starts recording and uploading recording-clips'],
      ['Doctor and patient start the conversation', '- users may choose to read [Testing Script 1] or [Testing Script 2] for testing'],
      ['', '- Available notes and transcripts are shown in [NOTE (CLIPS)]'],
      ['Doctor Click button [STOP ANALYSER]', '- app stops recording, and then it starts uploading an audio file that contains the whole conversation'],
      ['', '- Available notes and transcripts are shown in [NOTE (WHOLE)]'],
    ].map((t, i) => (
      <ListItem key={i}>
        <Typography sx={{ mr:2 }} variant="body2" component="span">{i + 1}{'. '}</Typography>
        <ListItemText
          primary={t[0]}
          secondary={t[1]}
        />
      </ListItem>
    ))}
  </List>)
}

export default function InstructionBox() {
  const [state, setState] = React.useState({
    'about': false,
    'testing-steps': false,
    'sample-1': false,
    'sample-2': false,
  });

  const toggleDrawer = (container, open) => (event) => {
    if (event.type === 'keydown' 
        && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setState({ ...state, [container]: open });
  };

  return (
    <div>

      <React.Fragment key={'about'}>
        <Button onClick={toggleDrawer('about', true)}>{'about'}</Button><br></br><br></br>
        <Drawer
          variant="temporary"
          ModalProps={{ keepMounted: true }}
          anchor='left'
          open={state['about']}
          onClose={toggleDrawer('about', false)}
        >
          <Box
            sx={{ width: 850, p: 2}}
            role="presentation"
            onClick={toggleDrawer('about', false)}
            onKeyDown={toggleDrawer('about', false)}
          > 
          <Typography sx={{ pb:0 }} variant="h6" gutterBottom>{' The APP '}</Typography>
          <AboutBox></AboutBox>
          </Box>
        </Drawer>
      </React.Fragment>

      <React.Fragment key={'testing-steps'}>
        <Button onClick={toggleDrawer('testing-steps', true)}>{'testing steps'}</Button><br></br><br></br>
        <Drawer
          variant="temporary"
          ModalProps={{ keepMounted: true }}
          anchor='left'
          open={state['testing-steps']}
          onClose={toggleDrawer('testing-steps', false)}
        >
        <Box
          sx={{ width: 850, padding: 2}}
          role="presentation"
          onClick={toggleDrawer('testing-steps', false)}
          onKeyDown={toggleDrawer('testing-steps', false)}
        > 
          <TestingTtepsBox></TestingTtepsBox>
        </Box>
        </Drawer>
      </React.Fragment>

      <React.Fragment key={'sample-1'}>
        <Button 
          href='/?sample=1' 
          target={'_blank'}
          //onClick={toggleDrawer('sample-1', true)}
          >{'testing script 1'}</Button><br></br><br></br>
        {/* <Drawer
          variant="temporary"
          ModalProps={{ keepMounted: true }}
          anchor='left'
          open={state['sample-1']}
          onClose={toggleDrawer('sample-1', false)}
        >
          <Box
            sx={{ width: 850, padding: 2}}
            role="presentation"
            onClick={toggleDrawer('sample-1', false)}
            onKeyDown={toggleDrawer('sample-1', false)}
          > 
          <Sample1Box></Sample1Box>
          </Box>
        </Drawer> */}
      </React.Fragment>

      <React.Fragment key={'sample-2'}>
        <Button 
          href='/?sample=2' 
          target={'_blank'}
          //onClick={toggleDrawer('sample-2', true)}
          >{'testing script 2'}</Button><br></br><br></br>
        {/* <Drawer
          variant="temporary"
          ModalProps={{ keepMounted: true }}
          anchor='left'
          open={state['sample-2']}
          onClose={toggleDrawer('sample-2', false)}
        >
        <Box
          sx={{ width: 850, padding: 2}}
          role="presentation"
          onClick={toggleDrawer('sample-2', false)}
          onKeyDown={toggleDrawer('sample-2', false)}
        > 
        <Sample2Box></Sample2Box>
        </Box>
        </Drawer> */}
      </React.Fragment>

    </div>
  );
}

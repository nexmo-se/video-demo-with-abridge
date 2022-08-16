import React, { useEffect, useState } from 'react';
import { Stack, Box, Button, ButtonGroup, Typography, Tabs, Tab } from '@mui/material';
import PropTypes from 'prop-types';

import { getQueryVariable } from '../hooks/Utils';

var APP_SERVER_BASE_URL = process.env.PUBLIC_URL? process.env.PUBLIC_URL : 'http://localhost:3002';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography component="div">{children}</Typography>
        </Box>
      )}
    </div>
  );
}
TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};
function a11yProps(index) {
  return {
    id: `vertical-tab-${index}`,
    'aria-controls': `vertical-tabpanel-${index}`,
    sx: {alignItems: 'flex-start'}
  };
}
// ----
export default function NoteBox(props) {

  const [sessionId, setSessionId] = useState(null);

  const [value, setValue] = React.useState(0);
  const [clipNotes, setClipNotes] = React.useState(new Map());
  const [clipTranscripts, setClipTranscripts] = React.useState([]);
  const [wholeNote, setWholeNote] = React.useState(new Map());
  const [wholeTranscript, setWholeTranscript] = React.useState([]);

  const handleReset = async (e) => {
    e.preventDefault();
    e.target.disabled = true;
    if (sessionId) {
      fetch(`${APP_SERVER_BASE_URL}/api/abridge/reset/${sessionId}`, { headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }})
      .then((res) => res.json())
      .then(data => {
        console.log('reset ... ', data);
        setClipNotes((prev) => {
          const next = new Map(prev);
          next.clear();
          return next;
        });
        setClipTranscripts(() => {
          return [];
        });
        setWholeNote((prev) => {
          const next = new Map(prev);
          next.clear();
          return next;
        });
        setWholeTranscript(() => {
          return [];
        });
      }).catch(console.error).finally(() => {
        e.target.disabled = false;
      })
    }
  }

  const fetchEncounter = async (encounterId) => {
    return fetch(`${APP_SERVER_BASE_URL}/api/abridge/notes/${encounterId}`, { headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }})
    .then((res) => res.json())
    .then(data => {
      return data;
    }).catch(console.error);
  }

  const updateEvents = async (str) => {
    const data = JSON.parse(str);
    const { id, externalId, status, updatedAt, sessionId, filename, type } = data;
    console.log('updateEvents', {status, type, externalId, id});
    if (status === 'NOTE_AVAILABLE') {
      var encounter = await fetchEncounter(id, type);
      //console.log('fetchEncounter', encounter, {status, type, externalId, id});
      if (type === 'clip') {
        setClipNotes((prev) => {
          const next = new Map(prev);
          for (const [key, arr] of Object.entries(encounter.note)) {
            if (!next.has(key)) next.set(key, []);
            next.set(key, next.get(key).concat(arr)); //concatenate
          }
          return next;
        });
        //
        setClipTranscripts((prev) => {
          // var next = [...prev];
          // for (const [key, sentence] of Object.entries(encounter.transcript)) {
          //   next.push(sentence)
          // }
          // return next
          return [...prev, ...Object.values(encounter.transcript)];
        });

      } else if (type === 'whole') {
        setWholeNote(() => {
          const next = new Map();
          for (const [key, arr] of Object.entries(encounter.note)) {
            if (!next.has(key)) next.set(key, []);
            next.set(key, next.get(key).concat(arr)); //concatenate
          }
          return next;
        });
        //
        setWholeTranscript(Object.values(encounter.transcript))
      } else {
        console.log('updateEvents - neither [clip, whole]', {status, type, externalId, id});
      }
    } 
    else {
      // <button class="to-mimic">Load Note from Abridge</button>
      console.log('updateEvents - [not NOTE_AVAILABLE]', {status, type, externalId, id});
    }
  };

  useEffect(() => {
    let room = getQueryVariable('room');
    console.log(room)
    // get session ID
    fetch(`${APP_SERVER_BASE_URL}/api/session/${room}`)
      .then(res => res.json())
      .then(({apiKey, sessionId}) => {
        console.log(sessionId)
        const eventSource = new EventSource(`${APP_SERVER_BASE_URL}/api/abridge/sse/${sessionId}`);
        eventSource.onmessage = async ({ data }) =>  {
          //console.log('sse onmessage', data)
          await updateEvents(data);
        };
        eventSource.onerror = (event) => {
          eventSource.close()
        };
        setSessionId(sessionId);
        return () => {
          eventSource.close();
        };
      }).catch(console.error);
  }, []);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const showContent = (content) => {
    var rows = [];
    if (content.size > 0 ) {
      var i = 0;
      content.forEach((arr, key) => {
        rows.push(<Typography variant="h6" gutterBottom component="div" key={key+'-cat-'+i}>{key}</Typography>);
        arr.forEach((item, j) => {
          rows.push(<Typography variant="body1" gutterBottom key={key+'-summary-'+j} sx={{pl:2}} >{item.summary}</Typography>);
        })
        i++;
      })
    }
    return (<>{rows}</>); 
  }

  const showTranscript= (content) => {
    var rows = [];
    if (content.length > 0 ) {
      content.forEach((line, i) => {
        if (line.speaker && line.sent) {
          rows.push(
            <Typography variant="body1" gutterBottom key={i + '-speaker'} component="span">
              {'Speaker '}{line.speaker}{': '}
            </Typography>
          )
          var sentence = [];
          line.sent.forEach((word, j) => {
            if (word.isConcept) {
              sentence.push(
                <Typography variant="body1" gutterBottom key={j + '-word'} component="span" color="error">
                  {' '} {word.conceptNormalized}
                </Typography>)
            } else {
              sentence.push(' ' + word.word)
            }
          });
          rows.push(
            <Typography variant="body1" gutterBottom key={i + '-sentence'} component="span">
              {sentence}
            </Typography>
          )
          rows.push(<br key={i} ></br>)
        }
      });
    }
    return (<>{rows}</>); 
  }

  return (<>
    <Box
      sx={{ 
        flexGrow: 2, 
        display: 'flex', 
        height: '100%',
        justifyContent: 'space-between',
      }}
    >
      <Box sx={{ p:0, m:0, height: 600, overflowY:'scroll'}} >
        <TabPanel value={value} index={0}>
          <Box sx={{ p:0, m:0 }} >
          {showContent(clipNotes)}
          </Box>
        </TabPanel>
        <TabPanel value={value} index={1}>
          <Box sx={{ p:0, m:0 }} >
          {showTranscript(clipTranscripts)}
          </Box>
        </TabPanel>
        <TabPanel value={value} index={2}>
          <Box sx={{ p:0, m:0 }} >
          {showContent(wholeNote)}
          </Box>
        </TabPanel>
        <TabPanel value={value} index={3}>
          <Box sx={{ p:0, m:0 }} >
          {showTranscript(wholeTranscript)}
          </Box>
        </TabPanel>
      </Box>
      <Tabs
        orientation="vertical"
        variant="fullWidth"
        value={value}
        onChange={handleChange}
        aria-label="Notes and Transcripts"
        sx={{ 
          borderLeft: 1, 
          borderColor: 'divider', 
          minWidth: 280, 
          height: 0.68,
        }}
      >
        <Tab label="Note (clips)" {...a11yProps(0)} />
        <Tab label="Transcript (clips)" {...a11yProps(1)} />
        <Tab label="Note (whole)" {...a11yProps(2)} />
        <Tab label="Transcript (whole)" {...a11yProps(3)} />
      </Tabs>
    </Box>
    <Button 
      sx={{alignItems: "flex-end"}}
      key="reset" variant="text" size="small" 
      onClick={handleReset} disabled={sessionId? false : true}
      >Start Over</Button>
    <br></br>
    <br></br>
    </>
  );
}

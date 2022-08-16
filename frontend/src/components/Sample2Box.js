import React from "react";
import { Typography } from '@mui/material';

export default function Sample2Box(props){
  return (<>
     {[
        ['Doctor', 'Good morning, Mr. Stone. What\'s the problem? '],
        ['Patient', 'I\'ve got a toothache. I think it\'s in this tooth.'],
        ['Doctor', 'Right. Let me have a look. Open your mouth wide. That\'s good. Does it hurt when I touch it?'],
        ['Patient', 'Yes. It\'s very painful.'],
        ['Doctor', 'You\'ve gotten some bad decay in there. We need to take X-Rays to identify other decay.'],
        ['Patient', 'Okay.'],
        ['Doctor', 'Things doesn\'t look good. We will have to fill those teeth.'],
        ['Patient', 'Okay.'],
        ['Doctor', 'First, I\'ll just to get these two fillings, drilled and taken care of and then you\'ll get your teeth cleaned.'],
        ['Patient', 'Sounds Good.'],
        ['Doctor', 'We\'ve clean your teeht. Rinse out your mouth. How do you feel now?'],
        ['Patient', 'Good.'],
        ['Doctor', 'And remember to clean your teeth twice a day.'],
        ['Patient', 'I will. Thank you, doctor. ']
      ].map((t, i) => (
          <Typography gutterBottom key={i} component="div">
            <Typography variant="body1" color={i%2? '' : 'secondary'} gutterBottom component="span">
              {t[0]}: {' '}
            </Typography>
            <Typography variant="body1" gutterBottom key={i} component="span">
              {t[1]}
            </Typography>
          </Typography>
      ))}
  </>);
}
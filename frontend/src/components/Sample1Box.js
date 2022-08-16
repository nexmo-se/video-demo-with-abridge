import React from "react";
import { Typography } from '@mui/material';

export default function Sample1Box(props){
  return (<>
    {[
      ['Doctor', 'Good morning, please sit down.'],
      ['Patient', 'Good morning, Doctor Anderson. '],
      ['Doctor', 'What\'s wrong with you?'],
      ['Patient', 'I have been suffering from fever since yesterday. '],
      ['Doctor', 'Do you have any other symptoms? '],
      ['Patient', 'I also feel headaches, and shivering.'],
      ['Doctor', 'Let me take your temperature. Don\'t worry, there is nothing serious. I am giving you the medicine, and you will be all right in a couple of days'],
      ['Patient', 'Thank you, Doctor.'],
      ['Doctor', 'But get your blood tested for malaria.'],
      ['Patient', 'Right now? '],
      ['Doctor', 'Yes.'],
      ['Patient', 'Thank you very much. Please tell me how shall I take this medicine? '],
      ['Doctor', 'This medicine is for one day only. Take this dose as soon as you reach your home. And the second at 6:00 PM and the third at night before sleeping.'],
      ['Patient', 'What should I eat, Doctor? '],
      ['Doctor', 'You should eat only light food. You can take the milk and fresh fruit also.'],
      ['Patient', 'How shall I pay you, doctor? '],
      ['Doctor', 'At the reception desk, please. Miss White will instruct you.'],
      ['Patient', 'Thanks, doctor. '],
      ['Doctor', 'It\'s all right.']
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
  </>)
}

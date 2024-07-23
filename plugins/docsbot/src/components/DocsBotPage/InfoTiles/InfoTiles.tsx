import React from 'react';
import { Typography, Grid } from '@material-ui/core';
import FaqIcon from '../../../utils/faq.png';
import DocsBotIcon from '../../../utils/docsbot.png';
import FolderIcon from '../../../utils/folder.png';
import useStyles from './InfoTiles.styles';

const InfoTiles: React.FC = () => {
  const classes = useStyles();
  const tileInfo = [
    {
      title: 'Knowledge at Your Fingertips',
      frontText: 'Get instant answers to your technical questions.',
      backText: [
        'Search through PDFs',
        'Markdown files',
        'Slack conversations',
        'No more digging - find what you need, fast.',
      ],
      icon: FolderIcon,
    },
    {
      title: 'FAQs & Troubleshooting',
      frontText: 'Find answers and troubleshoot problems quickly.',
      backText: [
        'Explore our comprehensive FAQ section',
        'Save time and get the information you need right away.',
        'Resolve common issues',
        'Get back on track quickly and efficiently.',
      ],
      icon: FaqIcon,
    },
    {
      title: 'Chat with DocsBot',
      frontText:
        'Need personalized assistance? Chat with our friendly Doc Bot.',
      backText: [
        'Ask questions',
        'Clarify doubts',
        'Get expert guidance',
        '24/7 support, always at your service.',
      ],
      icon: DocsBotIcon,
    },
  ];
  return (
    <div className={classes.root}>
      <Typography variant="h2" className={classes.welcomeMessage}>
        Hi, I'm here to assist you!
      </Typography>
      <Grid container spacing={3} justifyContent="center">
        {tileInfo.map((card, index) => (
          <Grid item key={index}>
            <div className={classes.cardContainer}>
              <div className={classes.card}>
                <div className={classes.cardFront}>
                  <Typography variant="h2" className={classes.title}>
                    {card.title}
                  </Typography>
                  <Typography variant="body1" className={classes.frontText}>
                    {card.frontText}
                  </Typography>
                  <img src={card.icon} alt="icon" className={classes.icon} />
                </div>
                <div className={classes.cardBack}>
                  <Typography
                    variant="body2"
                    component="div"
                    className={classes.list}
                  >
                    <ul>
                      {card.backText.map((text, idx) => (
                        <li key={idx}>{text}</li>
                      ))}
                    </ul>
                  </Typography>
                </div>
              </div>
            </div>
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default InfoTiles;

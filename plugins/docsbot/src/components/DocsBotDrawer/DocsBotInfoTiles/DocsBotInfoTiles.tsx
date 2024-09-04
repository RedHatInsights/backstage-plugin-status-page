import { Grid, Typography, useTheme } from '@material-ui/core';
import React from 'react';
import DocsBotIcon from '../../../utils/docsbot.png';
import FaqIcon from '../../../utils/faq.png';
import FolderIcon from '../../../utils/folder.png';
import TutorialIcon from '../../../utils/tutorials.png';
import useStyles from './DocsBotInfoTiles.styles';

export const DocsBotInfoTiles: React.FC = () => {
  const theme = useTheme();
  const classes = useStyles(theme);
  const cardInfo = [
    {
      title: 'Easy Answers',
      frontText: 'Get help quickly.',
      backText: [
        'Quick searches',
        'Access PDFs & Markdown files',
        'Slack content',
        'Find information fast.',
      ],
      icon: FolderIcon,
    },
    {
      title: 'Troubleshooting & FAQs',
      frontText: 'Save time.',
      backText: [
        'Extensive FAQs',
        'Save time',
        'Fix common problems',
        'Quick solutions.',
      ],
      icon: FaqIcon,
    },
    {
      title: '24x7 Support',
      frontText: 'Get help quickly.',
      backText: [
        'Ask questions',
        'Clarify doubts',
        'Expert guidance',
        '24/7 support.',
      ],
      icon: DocsBotIcon,
    },
    {
      title: 'Use DocsBot for Your Documentation',
      frontText: 'Connect Your Data with Backstage.',
      backText: [
        'Keep your information up-to-date',
        'Boost search accuracy and relevance',
      ],
      icon: TutorialIcon,
    },
  ];
  return (
    <div className={classes.root}>
      <Typography
        variant="h4"
        className={classes.welcomeMessage}
        style={{ marginTop: '40px' }}
      >
        Hi, I'm here to assist you!
      </Typography>
      <Grid container spacing={1} justifyContent="center">
        {cardInfo.map((card, index) => (
          <Grid item xs={6} key={index}>
            <div className={classes.cardContainer}>
              <div className={classes.card}>
                <div className={classes.cardFront}>
                  <Typography variant="h6" className={classes.title}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" className={classes.frontText}>
                    {card.frontText}
                  </Typography>
                  <img src={card.icon} alt="icon" className={classes.icon} />
                </div>
                <div className={classes.cardBack}>
                  <Typography variant="body2" component="div">
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

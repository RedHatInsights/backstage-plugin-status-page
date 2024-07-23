import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '70vh',
    position: 'relative',
  },
  cardContent: {
    flex: 1,
    overflowY: 'auto',
  },
  inputContainer: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderTop: `1px solid ${theme.palette.divider}`,
    flexShrink: 0,
  },
  chatBubble: {
    backgroundColor: theme.palette.grey[200],
    padding: theme.spacing(1, 2),
    borderRadius: 15,
    borderBottomLeftRadius: 0,
    display: 'inline-block',
    maxWidth: '80%',
  },
  typing: {
    alignItems: 'center',
    display: 'flex',
    height: theme.spacing(3),
  },
  dot: {
    animation: '$mercuryTypingAnimation 1.8s infinite ease-in-out',
    backgroundColor: theme.palette.primary.main,
    borderRadius: '50%',
    height: theme.spacing(1.5),
    marginRight: theme.spacing(1),
    verticalAlign: 'middle',
    width: theme.spacing(1.5),
    display: 'inline-block',
  },
  dot1: {
    animationDelay: '200ms',
  },
  dot2: {
    animationDelay: '300ms',
  },
  dot3: {
    animationDelay: '400ms',
  },
  '@keyframes mercuryTypingAnimation': {
    '0%': {
      transform: 'translateY(0px)',
      backgroundColor: theme.palette.primary.main,
    },
    '28%': {
      transform: 'translateY(-7px)',
      backgroundColor: theme.palette.primary.light,
    },
    '44%': {
      transform: 'translateY(0px)',
      backgroundColor: theme.palette.primary.dark,
    },
  },
  welcomecardCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
  },
  botImage: {
    width: 100,
    height: 100,
  },
  botName: {
    fontSize: '60px',
    margin: 0,
    color: '#3a6478',
  },
  botDescription: {
    color: 'grey',
    maxWidth: '300px',
    textAlign: 'center',
    marginTop: theme.spacing(2),
  },
  menuSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
}));

export default useStyles;

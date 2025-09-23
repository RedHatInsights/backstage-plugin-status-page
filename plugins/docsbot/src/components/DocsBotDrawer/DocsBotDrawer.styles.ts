import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
  root: {
    marginTop: 'calc(6rem - 8px)',
    marginRight: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius * 4,
    height: 'calc(100vh - 5 * 1.3rem)', // Same as Root.css height
  },

  fullHeightContainer: {
    width: 400,
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflowY: 'hidden',
  },
  cardContent: {
    flex: 1,
    overflowY: 'auto',
    padding: theme.spacing(2),
  },
  inputContainer: {
    padding: theme.spacing(2),
    paddingBottom: theme.spacing(6),
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
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    padding: theme.spacing(1.25),
  },
  botImage: {
    width: 100,
    height: 100,
    top: '30%',
    left: '40%',
    position: 'absolute',
  },
  botName: {
    fontSize: theme.typography.pxToRem(60),
    margin: 0,
    color: '#3a6478',
  },
  botDescription: {
    color: theme.palette.text.secondary,
    maxWidth: 300,
    margin: '0 auto',
    textAlign: 'center',
  },
  menuSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1, 2),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  docsBotSection: {
    display: 'flex',
    alignItems: 'center',
  },
  docsBotName: {
    marginLeft: theme.spacing(1),
  },
  iconsSection: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  disclaimer: {
    textAlign: 'center',
    borderRadius: 4,
    color: '#6a6a6a',
    fontSize: '12px',
    marginBottom: theme.spacing(1),
  },
  betaChip: {
    padding: '0!important',
    margin: '8px 0px 0px 0px',
  },
  linkDecoration: {
    textDecoration: 'underline',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    border: 0,
    padding: 0,
    color: '#6A6A6A',
  },
}));

export default useStyles;

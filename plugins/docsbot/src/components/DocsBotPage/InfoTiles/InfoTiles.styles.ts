import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(2.5),
  },
  cardContainer: {
    perspective: 1000,
    margin: theme.spacing(1.25),
    flex: 1,
    position: 'relative',
    width: 275,
    height: 220,
    '&:hover $card': {
      transform: 'rotateY(180deg)',
    },
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    transition: 'transform 0.6s',
    transformStyle: 'preserve-3d',
  },
  cardFront: {
    backfaceVisibility: 'hidden',
    position: 'absolute',
    width: '100%',
    height: '100%',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1.25),
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBack: {
    backfaceVisibility: 'hidden',
    position: 'absolute',
    width: '100%',
    height: '100%',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1.25),
    transform: 'rotateY(180deg)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.pxToRem(18),
    textAlign: 'center',
  },
  frontText: {
    textAlign: 'center',
    marginBottom: theme.spacing(1.5),
  },
  welcomeMessage: {
    textAlign: 'center',
    marginBottom: theme.spacing(2.5),
  },
  list: {
    textAlign: 'left',
  },
  icon: {
    position: 'absolute',
    bottom: theme.spacing(1.25),
    right: theme.spacing(1.25),
    width: 24,
    height: 24,
  },
}));

export default useStyles;

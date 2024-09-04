import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(1),
  },
  cardContainer: {
    margin: theme.spacing(1),
    flex: 1,
    width: 150,
    height: 150,
    '&:hover $card': {
      transform: 'rotateY(180deg)',
    },
  },
  card: {
    position: 'relative',
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
    padding: theme.spacing(0.625),
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.palette.background.paper, // Ensure background color is set
    zIndex: 2,
  },
  cardBack: {
    backfaceVisibility: 'hidden',
    position: 'absolute',
    width: '100%',
    height: '100%',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(0.625),
    transform: 'rotateY(180deg)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.palette.background.paper, // Ensure background color is set
    zIndex: 3,
  },
  title: {
    fontSize: theme.typography.pxToRem(12),
    textAlign: 'center',
  },
  frontText: {
    textAlign: 'center',
    marginBottom: theme.spacing(1),
  },
  icon: {
    width: 24,
    height: 24,
  },
  welcomeMessage: {
    textAlign: 'center',
    marginBottom: theme.spacing(2.5),
  },
}));

export default useStyles;

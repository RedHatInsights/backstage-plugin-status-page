import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    padding: theme.spacing(4, 6),
    width: '80%',
    maxWidth: 600,
    borderRadius: 8,
  },
  textarea: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  charCounter: {
    textAlign: 'right',
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
  },
}));
export default useStyles;

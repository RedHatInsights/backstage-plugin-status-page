import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles(theme => ({
  epicChip: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.main,
    },
  },
  epicLink: {
    color: theme.palette.primary.main,
    textDecoration: 'underline',
    '&:hover': {
      textDecoration: 'none',
    },
  },
  epicText: {
    color: theme.palette.text.primary,
  },
}));

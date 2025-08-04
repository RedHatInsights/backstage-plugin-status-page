import { makeStyles, Theme } from '@material-ui/core/styles';

export const useStyles = makeStyles((theme: Theme) => ({
  searchSection: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    border: `1px solid ${theme.palette.divider}`,
  },
  controlsSection: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
  },
  applicationsSection: {
    minHeight: '600px',
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
  },
  configSection: {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    position: 'sticky',
    top: theme.spacing(2),
  },
  applicationItem: {
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '&.Mui-selected': {
      backgroundColor: theme.palette.action.selected,
    },
  },
  selectedAppItem: {
    padding: theme.spacing(1, 0),
    '& .MuiListItemText-primary': {
      fontSize: '0.875rem',
      fontWeight: 500,
    },
    '& .MuiListItemText-secondary': {
      fontSize: '0.75rem',
    },
  },
  emptyIcon: {
    fontSize: '4rem',
    color: theme.palette.text.disabled,
    marginBottom: theme.spacing(2),
  },
  divider: {
    margin: theme.spacing(2, 0),
  },
  initiateButton: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(1.5),
    fontSize: '1rem',
    fontWeight: 600,
    textTransform: 'none',
    boxShadow: theme.shadows[2],
    '&:hover': {
      boxShadow: theme.shadows[4],
    },
    '&:disabled': {
      backgroundColor: theme.palette.action.disabled,
      color: theme.palette.action.disabledBackground,
    },
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  searchField: {
    '& .MuiOutlinedInput-root': {
      '&:hover fieldset': {
        borderColor: theme.palette.primary.main,
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.primary.main,
      },
    },
  },
  filterChip: {
    margin: theme.spacing(0.5),
    '&.MuiChip-colorPrimary': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
    },
  },
  alert: {
    marginTop: theme.spacing(2),
    '& .MuiAlert-icon': {
      fontSize: '1.25rem',
    },
  },
  snackbar: {
    '& .MuiSnackbarContent-root': {
      borderRadius: theme.shape.borderRadius,
    },
  },
}));

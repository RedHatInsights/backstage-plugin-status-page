import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles(theme => ({
  tabsRoot: {
    marginTop: theme.spacing(3),
  },
  tabPanel: {
    marginTop: theme.spacing(2),
  },
  finalSignOffButton: {
    marginLeft: theme.spacing(2),
    backgroundColor: theme.palette.success.main,
    color: theme.palette.common.white,
    '&:hover': {
      backgroundColor: theme.palette.success.dark,
    },
  },
  summaryButton: {
    marginLeft: theme.spacing(2),
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  dialogContent: {
    minWidth: '400px',
    padding: theme.spacing(3),
  },
  summarySection: {
    marginBottom: theme.spacing(3),
  },
  summaryTitle: {
    marginBottom: theme.spacing(2),
    fontWeight: 'bold',
  },
  chipContainer: {
    display: 'flex',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
  approvedChip: {
    borderColor: theme.palette.success.main,
    color: theme.palette.success.main,
  },
  rejectedChip: {
    borderColor: theme.palette.error.main,
    color: theme.palette.error.main,
  },
  pendingChip: {
    borderColor: theme.palette.grey[500],
    color: theme.palette.grey[500],
  },
}));

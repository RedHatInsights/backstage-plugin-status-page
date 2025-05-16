import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles(theme => ({
  statCard: {
    padding: theme.spacing(3),
    textAlign: 'center',
    borderRadius: 16,
    boxShadow: '0px 2px 12px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s',
    '&:hover': {
      transform: 'translateY(-4px)',
    },
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: theme.spacing(1),
  },
  statValue: {
    fontSize: 28,
    fontWeight: 700,
  },
  greenText: {
    color: '#2e7d32', // Approved
  },
  redText: {
    color: '#c62828', // Rejected
  },
  blueTitle: {
    // color: '#1565c0',
    fontWeight: 'bold',
  },
  chipApproved: {
    backgroundColor: '#d1f1bb',
  },
  chipRejected: {
    backgroundColor: '#fbc5c5',
  },
  chipDefault: {
    backgroundColor: '#cbc9c9',
  },
  tableTitle: {
    color: '#1565c0',
    fontWeight: 'bold',
  },
}));

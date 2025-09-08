import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles(theme => ({
  container: {
    padding: theme.spacing(3),
    borderRadius: '12px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #e9ecef',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: theme.spacing(2),
    color: '#333',
  },
  subtitle: {
    marginBottom: '16px',
  },
  buttonContainer: {
    display: 'flex',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
  },
  primaryButton: {
    borderRadius: '8px',
    padding: '12px 24px',
    fontWeight: 600,
    textTransform: 'none',
    fontSize: '16px',
    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
    },
  },
  secondaryButton: {
    borderRadius: '8px',
    padding: '12px 24px',
    fontWeight: 600,
    textTransform: 'none',
    fontSize: '16px',
    backgroundColor: '#6c757d',
    color: 'white',
    boxShadow: '0 2px 8px rgba(108, 117, 125, 0.3)',
    '&:hover': {
      backgroundColor: '#5a6268',
      boxShadow: '0 4px 12px rgba(108, 117, 125, 0.4)',
    },
  },
}));

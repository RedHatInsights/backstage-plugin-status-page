import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles(theme => ({
  card: {
    height: '200px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
    },
  },
  cardContent: {
    textAlign: 'center',
    padding: theme.spacing(4),
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  label: {
    fontSize: '18px',
    fontWeight: 500,
    marginBottom: theme.spacing(3),
    color: theme.palette.text.secondary,
    letterSpacing: '0.5px',
  },
  number: {
    fontSize: '64px',
    fontWeight: 700,
    lineHeight: 1,
    marginBottom: theme.spacing(2),
  },
  totalNumber: {
    fontSize: '64px',
    fontWeight: 700,
    lineHeight: 1,
    marginBottom: theme.spacing(2),
    color: '#1976d2',
  },
  compliantNumber: {
    fontSize: '64px',
    fontWeight: 700,
    lineHeight: 1,
    marginBottom: theme.spacing(2),
    color: '#4CAF50',
  },
  inProgressNumber: {
    fontSize: '64px',
    fontWeight: 700,
    lineHeight: 1,
    marginBottom: theme.spacing(2),
    color: '#FF9800',
  },
  nonCompliantNumber: {
    fontSize: '64px',
    fontWeight: 700,
    lineHeight: 1,
    marginBottom: theme.spacing(2),
    color: '#F44336',
  },
  subtitle: {
    fontSize: '14px',
    color: theme.palette.text.secondary,
    fontWeight: 400,
  },
  title: {
    textAlign: 'center',
    marginBottom: '48px',
    fontWeight: 300,
    color: '#333',
    letterSpacing: '-0.5px',
  },
}));

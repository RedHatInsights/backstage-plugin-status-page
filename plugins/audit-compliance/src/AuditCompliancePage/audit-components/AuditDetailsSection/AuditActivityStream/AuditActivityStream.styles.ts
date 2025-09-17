import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles(theme => ({
  cardContainer: {
    maxHeight: '70vh',
    minHeight: '400px', // Ensure minimum height for scrolling
    overflowY: 'auto',
    padding: theme.spacing(3),
  },
  activityStream: {
    fontFamily: 'Red Hat Display',
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: '24px',
  },
  timestamp: {
    fontFamily: 'Red Hat Display',
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '24px',
  },
  date: {
    fontFamily: 'Red Hat Display',
    fontSize: '12px',
    fontWeight: 500,
  },
  boldText: {
    fontWeight: 600,
  },
  successIcon: {
    width: '20px',
    height: '20px',
    color: '#3E8635',
  },
  errorIcon: {
    width: '20px',
    height: '20px',
    color: '#C9190B',
  },
  infoIcon: {
    width: '20px',
    height: '20px',
    color: '#4394E5',
  },
}));

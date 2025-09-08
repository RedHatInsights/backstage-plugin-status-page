import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles(theme => ({
  card: {
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  cardContent: {
    padding: theme.spacing(3),
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#333',
  },
  expandButton: {
    borderRadius: '8px',
    textTransform: 'none',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: theme.spacing(2),
    borderBottom: '1px solid #f0f0f0',
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  timestamp: {
    minWidth: '120px',
    marginRight: theme.spacing(2),
  },
  timeText: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#666',
  },
  dateText: {
    fontSize: '11px',
    color: '#999',
  },
  iconContainer: {
    marginRight: theme.spacing(2),
    marginTop: '2px',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: '14px',
    lineHeight: 1.4,
    color: '#333',
  },
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(4),
    color: '#666',
  },
  showMoreButton: {
    marginTop: theme.spacing(2),
    borderRadius: '8px',
    textTransform: 'none',
  },
}));

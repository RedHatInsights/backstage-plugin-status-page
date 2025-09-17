import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles(theme => ({
  card: {
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  cardContent: {
    padding: theme.spacing(3),
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: theme.spacing(3),
    color: '#333',
  },
  filtersContainer: {
    display: 'flex',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchField: {
    minWidth: '300px',
  },
  statusFilter: {
    minWidth: '150px',
  },
  refreshButton: {
    borderRadius: '8px',
    textTransform: 'none',
  },
  statusChip: {
    fontWeight: 600,
  },
  viewButton: {
    borderRadius: '6px',
    textTransform: 'none',
    fontWeight: 500,
  },
}));

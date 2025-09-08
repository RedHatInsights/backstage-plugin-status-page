import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles(theme => ({
  section: {
    marginBottom: theme.spacing(4),
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: theme.spacing(3),
    color: '#333',
  },
  tableContainer: {
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
  },
  tableHeaderCell: {
    fontWeight: 600,
    fontSize: '16px',
    color: '#333',
  },
  tableRow: {
    '&:hover': {
      backgroundColor: '#f8f9fa',
    },
  },
  appName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
  },
  statusChip: {
    fontWeight: 600,
    marginRight: theme.spacing(1),
  },
  expandButton: {
    borderRadius: '6px',
    textTransform: 'none',
    fontWeight: 500,
  },
  expandIcon: {
    marginLeft: theme.spacing(1),
  },
  collapsedContent: {
    padding: theme.spacing(2),
    backgroundColor: '#f8f9fa',
  },
  auditCard: {
    marginBottom: theme.spacing(2),
    borderRadius: '8px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    '&:last-child': {
      marginBottom: 0,
    },
  },
  auditCardContent: {
    padding: theme.spacing(2),
  },
  progressContainer: {
    marginBottom: theme.spacing(1),
  },
  progressLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: theme.spacing(0.5),
  },
  progressBar: {
    height: '6px',
    borderRadius: '3px',
  },
  actionButton: {
    borderRadius: '6px',
    textTransform: 'none',
    fontWeight: 500,
    fontSize: '12px',
  },
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(4),
    color: '#666',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
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
}));

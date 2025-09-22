import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles(theme => ({
  section: {
    marginBottom: theme.spacing(4),
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: theme.spacing(3),
    color: theme.palette.text.primary,
  },
  tableContainer: {
    borderRadius: theme.shape.borderRadius,
  },
  tableHeader: {
    backgroundColor: theme.palette.background.paper,
  },
  tableHeaderCell: {
    fontWeight: 600,
    fontSize: '16px',
    color: theme.palette.text.primary,
  },
  tableRow: {
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  appName: {
    fontSize: '16px',
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
  statusChip: {
    fontWeight: 600,
    marginRight: theme.spacing(1),
  },
  expandButton: {
    borderRadius: theme.shape.borderRadius,
    textTransform: 'none',
    fontWeight: 500,
  },
  expandIcon: {
    marginLeft: theme.spacing(1),
  },
  collapsedContent: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
  },
  auditCard: {
    marginBottom: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
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
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5),
  },
  progressBar: {
    height: '6px',
    borderRadius: theme.shape.borderRadius,
  },
  actionButton: {
    borderRadius: theme.shape.borderRadius,
    textTransform: 'none',
    fontWeight: 500,
    fontSize: '12px',
  },
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(4),
    color: theme.palette.text.secondary,
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
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

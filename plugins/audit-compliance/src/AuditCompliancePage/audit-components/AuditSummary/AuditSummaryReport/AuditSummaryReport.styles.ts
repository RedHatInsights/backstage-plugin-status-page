import { makeStyles } from '@material-ui/core/styles';

// Utility functions
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'success':
      return '#4caf50';
    case 'warning':
      return '#ff9800';
    case 'error':
      return '#f44336';
    default:
      return '#2196f3';
  }
};

export const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2),
  },
  card: {
    marginBottom: theme.spacing(2),
  },
  cardContent: {
    padding: theme.spacing(3),
  },
  sectionTitle: {
    marginBottom: theme.spacing(3),
    fontWeight: 600,
  },
  infoBox: {
    marginBottom: theme.spacing(2),
  },
  infoLabel: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
  },
  infoValue: {
    fontWeight: 500,
  },
  statusChange: {
    marginTop: theme.spacing(1),
  },
  positiveChange: {
    color: theme.palette.success.main,
    display: 'flex',
    alignItems: 'center',
  },
  negativeChange: {
    color: theme.palette.error.main,
    display: 'flex',
    alignItems: 'center',
  },
  neutralChange: {
    color: theme.palette.text.secondary,
    display: 'flex',
    alignItems: 'center',
  },
  refreshButton: {
    marginTop: theme.spacing(2),
    display: 'flex',
    justifyContent: 'flex-end',
  },
  tableContainer: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  tableHeaderCell: {
    backgroundColor: theme.palette.background.default,
    fontWeight: 600,
    padding: theme.spacing(2),
  },
  tableCell: {
    padding: theme.spacing(2),
    '&:first-child': {
      fontWeight: 500,
    },
  },
  successChip: {
    borderColor: theme.palette.success.main,
    color: theme.palette.success.main,
    '& .MuiChip-icon': {
      color: theme.palette.success.main,
    },
  },
  warningChip: {
    borderColor: theme.palette.warning.main,
    color: theme.palette.warning.main,
    '& .MuiChip-icon': {
      color: theme.palette.warning.main,
    },
  },
  errorChip: {
    borderColor: theme.palette.error.main,
    color: theme.palette.error.main,
    '& .MuiChip-icon': {
      color: theme.palette.error.main,
    },
  },
  infoChip: {
    borderColor: theme.palette.info.main,
    color: theme.palette.info.main,
    '& .MuiChip-icon': {
      color: theme.palette.info.main,
    },
  },
  errorMessage: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    backgroundColor: 'rgba(244, 67, 54, 0.08)',
    border: `1px solid ${theme.palette.error.light}`,
    borderRadius: theme.shape.borderRadius,
    '& .MuiTypography-root': {
      color: theme.palette.text.primary,
    },
  },
  statisticsCard: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  accountList: {
    marginTop: theme.spacing(1),
    '& > *': {
      marginBottom: theme.spacing(0.5),
    },
  },
  metricCard: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  statCard: {
    padding: theme.spacing(2),
    textAlign: 'center',
    height: '100%',
  },
  section: {
    marginBottom: theme.spacing(4),
  },
  loadingOverlay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(4),
  },
  generateButton: {
    marginBottom: theme.spacing(2),
  },
  applicationDetailsPaper: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },
  auditDetailsPaper: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },
  documentationList: {
    listStyle: 'none',
    padding: 0,
    '& li': {
      display: 'flex',
      alignItems: 'center',
      marginBottom: theme.spacing(1),
      '& svg': {
        marginRight: theme.spacing(1),
      },
    },
  },
  outstandingItemsTable: {
    marginTop: theme.spacing(2),
  },
  auditorNotes: {
    '& > div': {
      display: 'flex',
      alignItems: 'center',
      marginBottom: theme.spacing(1),
      '& svg': {
        marginRight: theme.spacing(1),
      },
    },
  },
  metadataPaper: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
  },
  metadataField: {
    '& .MuiOutlinedInput-root': {
      backgroundColor: theme.palette.background.paper,
    },
  },
  completeButton: {
    marginBottom: theme.spacing(2),
  },
  completedBanner: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    backgroundColor: theme.palette.success.light,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
  sourceChip: {
    textTransform: 'capitalize',
    padding: '0 8px',
    height: '24px',
    minHeight: '24px',
    fontSize: '0.75rem',
    '& .MuiChip-label': {
      padding: '0 8px',
      fontSize: '0.75rem',
    },
    '& .MuiChip-icon': {
      marginLeft: '4px',
      marginRight: '-4px',
      fontSize: '1rem',
    },
  },
  statusChip: {
    backgroundColor: theme.palette.grey[200],
    '&.approved': {
      backgroundColor: '#d1f1bb',
    },
    '&.rejected': {
      backgroundColor: '#fbc5c5',
    },
    '&.pending': {
      backgroundColor: '#fff3cd',
    },
  },
}));

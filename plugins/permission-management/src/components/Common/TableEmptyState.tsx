import {
  Box,
  Typography,
  Button,
  TableRow,
  TableCell,
  makeStyles,
  Theme,
} from '@material-ui/core';
import Assignment from '@material-ui/icons/Assignment';
import CheckCircle from '@material-ui/icons/CheckCircle';
import Search from '@material-ui/icons/Search';
import Group from '@material-ui/icons/Group';
import Refresh from '@material-ui/icons/Refresh';
import FilterList from '@material-ui/icons/FilterList';

const DocumentIcon = Assignment;
const CheckCircleIcon = CheckCircle;
const SearchIcon = Search;
const UsersIcon = Group;
const RefreshIcon = Refresh;
const FilterIcon = FilterList;

const useStyles = makeStyles((theme: Theme) => ({
  emptyStateRow: {
    '&:hover': {
      backgroundColor: 'transparent !important',
    },
    width: '100%',
    height: theme.spacing(40),
    minHeight: theme.spacing(40),
  },
  emptyStateCell: {
    padding: '0 !important',
    margin: '0 !important',
    textAlign: 'center',
    borderBottom: 'none',
    height: theme.spacing(40),
    minHeight: theme.spacing(40),
    verticalAlign: 'top',
    position: 'relative',
    width: '100% !important',
    maxWidth: 'none !important',
    minWidth: 'auto !important',
    border: 'none !important',
  },
  icon: {
    fontSize: 56,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },
  title: {
    marginBottom: theme.spacing(2),
    color: theme.palette.text.primary,
    fontWeight: 500,
  },
  description: {
    color: theme.palette.text.secondary,
    maxWidth: 450,
    margin: '0 auto',
    marginBottom: theme.spacing(1),
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    gap: theme.spacing(2),
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: theme.spacing(3),
    padding: theme.spacing(1, 0),
  },
  contentWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: theme.spacing(6, 2),
    margin: 0,
    width: '100%',
    height: '100%',
    minHeight: '100%',
    boxSizing: 'border-box',
    backgroundColor: theme.palette.background.paper,
    borderRadius: 0,
  },
}));

export type TableEmptyStateType = 
  | 'no-requests'
  | 'no-pending-requests' 
  | 'no-filtered-results'
  | 'no-admin-requests';

interface TableEmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'primary' | 'secondary' | 'default';
}

interface TableEmptyStateProps {
  type: TableEmptyStateType;
  colSpan: number;
  title?: string;
  description?: string;
  actions?: TableEmptyStateAction[];
}

const getEmptyStateConfig = (type: TableEmptyStateType) => {
  switch (type) {
    case 'no-requests':
      return {
        icon: DocumentIcon,
        defaultTitle: 'No Permission Requests Yet',
        defaultDescription: 'You haven\'t submitted any permission requests. Your submitted requests will appear here.',
      };
    case 'no-pending-requests':
      return {
        icon: CheckCircleIcon,
        defaultTitle: 'All Caught Up!',
        defaultDescription: 'You have no pending permission requests. All your requests have been processed.',
      };
    case 'no-filtered-results':
      return {
        icon: SearchIcon,
        defaultTitle: 'No Results Found',
        defaultDescription: 'No permission requests match your current search criteria. Try adjusting your filters.',
      };
    case 'no-admin-requests':
      return {
        icon: UsersIcon,
        defaultTitle: 'No Permission Requests Found',
        defaultDescription: 'No permission requests are available. This includes pending, approved, and rejected requests. New requests will appear here when submitted.',
      };
    default:
      return {
        icon: DocumentIcon,
        defaultTitle: 'No Data',
        defaultDescription: 'No information available.',
      };
  }
};

/**
 * Empty state component specifically designed for use inside table rows
 */
export const TableEmptyState: React.FC<TableEmptyStateProps> = ({
  type,
  colSpan,
  title,
  description,
  actions = [],
}) => {
  const classes = useStyles();
  const config = getEmptyStateConfig(type);
  const IconComponent = config.icon;

  return (
    <TableRow className={classes.emptyStateRow}>
      <TableCell colSpan={colSpan} className={classes.emptyStateCell}>
        <Box className={classes.contentWrapper}>
          <IconComponent className={classes.icon} />
          
          <Typography variant="h6" className={classes.title}>
            {title || config.defaultTitle}
          </Typography>
          
          <Typography variant="body2" className={classes.description}>
            {description || config.defaultDescription}
          </Typography>

          {actions.length > 0 && (
            <Box className={classes.actions}>
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'outlined'}
                  color={action.color || 'primary'}
                  onClick={action.onClick}
                  size="small"
                  startIcon={(() => {
                    const label = action.label.toLowerCase();
                    if (label.includes('refresh')) return <RefreshIcon />;
                    if (label.includes('clear')) return <FilterIcon />;
                    return undefined;
                  })()}
                >
                  {action.label}
                </Button>
              ))}
            </Box>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
};

/**
 * Pre-configured table empty states for common scenarios
 */
export const TableNoRequestsEmptyState: React.FC<{ 
  colSpan: number;
  onRefresh?: () => void;
}> = ({ colSpan, onRefresh }) => (
  <TableEmptyState
    type="no-requests"
    colSpan={colSpan}
    actions={onRefresh ? [{ label: 'Refresh', onClick: onRefresh, variant: 'outlined' as const }] : []}
  />
);

export const TableNoPendingRequestsEmptyState: React.FC<{ 
  colSpan: number;
  onRefresh?: () => void;
}> = ({ colSpan, onRefresh }) => (
  <TableEmptyState
    type="no-pending-requests"
    colSpan={colSpan}
    actions={onRefresh ? [{ label: 'Refresh', onClick: onRefresh, variant: 'outlined' as const }] : []}
  />
);

export const TableNoFilteredResultsEmptyState: React.FC<{ 
  colSpan: number;
  onRefresh?: () => void;
}> = ({ colSpan, onRefresh }) => (
  <TableEmptyState
    type="no-filtered-results"
    colSpan={colSpan}
    actions={onRefresh ? [{ label: 'Refresh', onClick: onRefresh, variant: 'outlined' as const }] : []}
  />
);

export const TableNoAdminRequestsEmptyState: React.FC<{ 
  colSpan: number;
  onRefresh?: () => void;
}> = ({ colSpan, onRefresh }) => (
  <TableEmptyState
    type="no-admin-requests"
    colSpan={colSpan}
    actions={onRefresh ? [{ label: 'Refresh', onClick: onRefresh, variant: 'outlined' as const }] : []}
  />
);

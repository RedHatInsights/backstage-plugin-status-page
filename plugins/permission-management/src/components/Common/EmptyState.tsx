import {
  Box,
  Typography,
  Button,
  Paper,
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
  root: {
    padding: theme.spacing(6, 4),
    textAlign: 'center',
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
  },
  icon: {
    fontSize: 64,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },
  title: {
    marginBottom: theme.spacing(1),
    color: theme.palette.text.primary,
    fontWeight: 500,
  },
  description: {
    color: theme.palette.text.secondary,
    maxWidth: 400,
    margin: '0 auto',
    marginBottom: theme.spacing(3),
  },
  actions: {
    display: 'flex',
    gap: theme.spacing(1),
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
}));

export type EmptyStateType = 
  | 'no-requests'
  | 'no-pending-requests' 
  | 'no-filtered-results'
  | 'no-admin-requests';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'primary' | 'secondary' | 'default';
}

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  actions?: EmptyStateAction[];
}

const getEmptyStateConfig = (type: EmptyStateType) => {
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
        defaultTitle: 'No Permission Requests',
        defaultDescription: 'No users have submitted permission requests yet. New requests will appear here for review.',
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
 * Reusable empty state component for permission management
 * Provides consistent empty state UI across different scenarios
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  actions = [],
}) => {
  const classes = useStyles();
  const config = getEmptyStateConfig(type);
  const IconComponent = config.icon;

  return (
    <Paper className={classes.root} elevation={0}>
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
    </Paper>
  );
};

/**
 * Pre-configured empty state components for common scenarios
 */
export const NoRequestsEmptyState: React.FC<{ onRefresh?: () => void }> = ({ onRefresh }) => (
  <EmptyState
    type="no-requests"
    actions={onRefresh ? [{ label: 'Refresh', onClick: onRefresh, variant: 'outlined' as const }] : []}
  />
);

export const NoPendingRequestsEmptyState: React.FC<{ onRefresh?: () => void }> = ({ onRefresh }) => (
  <EmptyState
    type="no-pending-requests"
    actions={onRefresh ? [{ label: 'Refresh', onClick: onRefresh, variant: 'outlined' as const }] : []}
  />
);

export const NoFilteredResultsEmptyState: React.FC<{ 
  onClearFilters: () => void;
  onRefresh?: () => void;
}> = ({ onClearFilters, onRefresh }) => (
  <EmptyState
    type="no-filtered-results"
    actions={[
      { label: 'Clear Filters', onClick: onClearFilters, variant: 'contained' as const },
      ...(onRefresh ? [{ label: 'Refresh', onClick: onRefresh, variant: 'outlined' as const }] : []),
    ]}
  />
);

export const NoAdminRequestsEmptyState: React.FC<{ onRefresh?: () => void }> = ({ onRefresh }) => (
  <EmptyState
    type="no-admin-requests"
    actions={onRefresh ? [{ label: 'Refresh', onClick: onRefresh, variant: 'outlined' as const }] : []}
  />
);

import React from 'react';
import { Box, Card, Chip, Paper, Typography } from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import InfoIcon from '@material-ui/icons/Info';
import TrendingDownIcon from '@material-ui/icons/TrendingDown';
import TrendingFlatIcon from '@material-ui/icons/TrendingFlat';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import WarningIcon from '@material-ui/icons/Warning';
import { useStyles } from './AuditSummaryReport.styles';

interface StatCardProps {
  title: string;
  value: number;
  type: 'total' | 'approved' | 'rejected' | 'pending';
  subtitle?: string;
  before?: number;
  after?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  type,
  subtitle,
  before,
  after,
}) => {
  const classes = useStyles();

  const getColor = () => {
    switch (type) {
      case 'approved':
        return '#4caf50';
      case 'rejected':
        return '#f44336';
      case 'pending':
        return '#ff9800';
      default:
        return '#0066cc';
    }
  };

  return (
    <Card className={classes.statCard}>
      <Typography
        variant="h3"
        align="center"
        style={{ color: getColor(), fontWeight: 'bold' }}
      >
        {value}
      </Typography>
      <Typography variant="subtitle1" align="center" gutterBottom>
        {title}
      </Typography>
      {subtitle && (
        <Typography
          variant="body2"
          align="center"
          color="textSecondary"
          gutterBottom
        >
          {subtitle}
        </Typography>
      )}
      {(before !== undefined || after !== undefined) && (
        <Typography variant="body2" align="center" color="textSecondary">
          Before: {before || 0} | After: {after || 0}
        </Typography>
      )}
    </Card>
  );
};

interface AccountListProps {
  accounts?: string[];
}

export const AccountList: React.FC<AccountListProps> = ({ accounts }) => {
  const classes = useStyles();

  if (!accounts || accounts.length === 0) {
    return (
      <Typography variant="body2" color="textSecondary">
        No accounts found
      </Typography>
    );
  }

  return (
    <Box className={classes.accountList}>
      {accounts.map((account: string, index: number) => (
        <Typography key={index} variant="body2">
          • {account}
        </Typography>
      ))}
    </Box>
  );
};

export const getChangeIcon = (change: number, classes: any) => {
  if (change > 0) return <TrendingUpIcon className={classes.positiveChange} />;
  if (change < 0)
    return <TrendingDownIcon className={classes.negativeChange} />;
  return <TrendingFlatIcon className={classes.neutralChange} />;
};

export const getStatusChip = (
  status: string,
  color: 'success' | 'warning' | 'error' | 'info' = 'success',
  classes: any,
) => {
  const chipStyles = {
    success: classes.successChip,
    warning: classes.warningChip,
    error: classes.errorChip,
    info: classes.infoChip,
  };

  const icons = {
    success: <CheckCircleIcon />,
    warning: <WarningIcon />,
    error: <ErrorIcon />,
    info: <InfoIcon />,
  };

  return (
    <Chip
      icon={icons[color]}
      label={status}
      variant="outlined"
      size="small"
      className={chipStyles[color]}
    />
  );
};

interface DataInconsistencyWarningProps {
  validationResult: {
    isValid: boolean;
    totalBefore: number;
    totalAccessReviewsBefore: number;
    difference: number;
  };
  isSyncing?: boolean;
}

export const DataInconsistencyWarning: React.FC<
  DataInconsistencyWarningProps
> = ({ validationResult, isSyncing }) => {
  if (isSyncing || validationResult.isValid) return null;

  return (
    <Box mb={3}>
      <Paper
        elevation={0}
        style={{
          backgroundColor: '#fff3e0',
          border: '1px solid #ffb74d',
          borderRadius: '8px',
          padding: '16px 24px',
        }}
      >
        <Box display="flex" alignItems="flex-start">
          <WarningIcon
            style={{ color: '#e65100', marginRight: 12, marginTop: 2 }}
          />
          <Box>
            <Typography
              variant="h6"
              style={{ color: '#e65100', fontWeight: 500 }}
            >
              Data Inconsistency Detected
            </Typography>
            <Typography
              variant="body2"
              style={{ color: '#bf360c', marginTop: 4 }}
            >
              Total reviews (approved + rejected ={' '}
              {validationResult.totalBefore}) do not match total access reviews
              ({validationResult.totalAccessReviewsBefore}). Difference:{' '}
              {validationResult.difference > 0 ? '+' : ''}
              {validationResult.difference} accounts.
            </Typography>
            <Typography
              variant="body2"
              style={{ color: '#bf360c', marginTop: 8 }}
            >
              Please verify the data source. The data below shows the current
              information for reference.
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

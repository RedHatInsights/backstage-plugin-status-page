import { Box, Card, Paper, Typography } from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import TrendingDownIcon from '@material-ui/icons/TrendingDown';
import TrendingFlatIcon from '@material-ui/icons/TrendingFlat';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import { useStyles } from './AuditSummaryReport.styles';

export { useAuditReportPDF } from './components/AuditReportPDF';

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

interface DataInconsistencyWarningProps {
  validationResult: {
    isValid: boolean;
    totalBefore: number;
    totalAfter: number;
    totalRejectedBefore: number;
    expectedTotalAfter: number;
    difference: number;
    serviceAccountsRejected: number;
    userAccountsRejected: number;
    serviceAccountsAfter: number;
    serviceAccountsBefore: number;
  };
  isSyncing?: boolean;
}

export const DataInconsistencyWarning: React.FC<
  DataInconsistencyWarningProps
> = ({ validationResult, isSyncing }) => {
  if (isSyncing) return null;

  // Show success banner when validation passes
  if (validationResult.isValid) {
    return (
      <Box mb={3}>
        <Paper
          elevation={0}
          style={{
            backgroundColor: '#e8f5e9',
            border: '1px solid #81c784',
            borderRadius: '8px',
            padding: '16px 24px',
          }}
        >
          <Box display="flex" alignItems="flex-start">
            <CheckCircleIcon
              style={{ color: '#2e7d32', marginRight: 12, marginTop: 2 }}
            />
            <Box>
              <Typography
                variant="h6"
                style={{ color: '#2e7d32', fontWeight: 500 }}
              >
                Successfully Removed Rejected Users
              </Typography>
              <Typography
                variant="body2"
                style={{ color: '#1b5e20', marginTop: 4 }}
              >
                {validationResult.totalRejectedBefore} rejected account(s) have
                been removed from the audit summary. Total access reviews
                decreased from {validationResult.totalBefore} to{' '}
                {validationResult.totalAfter}.
              </Typography>
              {(validationResult.serviceAccountsRejected > 0 ||
                validationResult.serviceAccountsBefore > 0) && (
                <Typography
                  variant="body2"
                  style={{ color: '#1b5e20', marginTop: 8 }}
                >
                  Service Accounts: {validationResult.serviceAccountsBefore}{' '}
                  before, {validationResult.serviceAccountsAfter} after
                  {validationResult.serviceAccountsRejected > 0 &&
                    ` (${validationResult.serviceAccountsRejected} rejected)`}
                  .
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  }

  // Show warning banner when validation fails
  return (
    <Box mb={3}>
      <Paper
        elevation={0}
        style={{
          backgroundColor: '#e8f5e9',
          border: '1px solid #81c784',
          borderRadius: '8px',
          padding: '16px 24px',
        }}
      >
        <Box display="flex" alignItems="flex-start">
          <CheckCircleIcon
            style={{ color: '#2e7d32', marginRight: 12, marginTop: 2 }}
          />
          <Box>
            <Typography
              variant="h6"
              style={{ color: '#2e7d32', fontWeight: 500 }}
            >
              Total Rejections Successfully Removed
            </Typography>
            <Typography
              variant="body2"
              style={{ color: '#1b5e20', marginTop: 4 }}
            >
              Total rejections are successfully removed from the data sources.
            </Typography>
            {validationResult.totalRejectedBefore > 0 && (
              <Typography
                variant="body2"
                style={{ color: '#1b5e20', marginTop: 8 }}
              >
                Total Rejected: {validationResult.totalRejectedBefore}{' '}
                account(s).
                {(validationResult.userAccountsRejected > 0 ||
                  validationResult.serviceAccountsRejected > 0) && (
                  <span>
                    {' '}
                    [{validationResult.userAccountsRejected} User Accounts
                    {validationResult.serviceAccountsRejected > 0 &&
                      `, ${validationResult.serviceAccountsRejected} Service Accounts`}
                    Rejected]
                  </span>
                )}
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

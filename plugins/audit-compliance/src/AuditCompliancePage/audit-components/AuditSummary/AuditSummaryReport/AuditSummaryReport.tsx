import {
  alertApiRef,
  configApiRef,
  discoveryApiRef,
  fetchApiRef,
  identityApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { EntityDisplayName } from '@backstage/plugin-catalog-react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Link,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import SaveIcon from '@material-ui/icons/Save';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import html2canvas from 'html2canvas';
import { jsPDF as JsPDF } from 'jspdf';
import { useEffect, useState } from 'react';
import { formatDisplayName } from '../../AuditApplicationList/AuditApplicationList';
import { useStyles } from './AuditSummaryReport.styles';
import {
  AccountList as AccountListComponent,
  DataInconsistencyWarning,
  StatCard,
} from './components';
import { ReviewDataTable } from './ReviewDataTable';
import { StatisticsData, SummaryReportProps } from './types';
import { calculateTotals } from './utils';

const StatisticsTable: React.FC<{
  statistics: StatisticsData;
  isSyncing?: boolean;
}> = ({ statistics, isSyncing }) => {
  const classes = useStyles();
  const totals = calculateTotals(statistics);

  const rows = [
    {
      category: 'Total Access Reviews',
      before: totals.totalAccessReviews.before,
      after: totals.totalAccessReviews.after,
      change: totals.totalAccessReviews.change,
      status: 'Under Review',
      statusColor: 'info' as const,
    },
    {
      category: 'Total User Accounts',
      before: totals.totalUserAccounts.before,
      after: totals.totalUserAccounts.after,
      change: totals.totalUserAccounts.change,
      status: 'Under Review',
      statusColor: 'info' as const,
    },
    {
      category: 'Total Service Accounts',
      before: totals.totalServiceAccounts.before,
      after: totals.totalServiceAccounts.after,
      change: totals.totalServiceAccounts.change,
      status: 'Under Review',
      statusColor: 'info' as const,
    },
    {
      category: 'Rover Accounts',
      before: totals.rover.before,
      after: totals.rover.after,
      change:
        totals.rover.before > 0
          ? ((totals.rover.after - totals.rover.before) / totals.rover.before) *
            100
          : 0,
      status: `${totals.rover.approved} Approved, ${totals.rover.rejected} Rejected`,
      statusColor: 'info' as const,
    },
    {
      category: 'GitLab Accounts',
      before: totals.gitlab.before,
      after: totals.gitlab.after,
      change:
        totals.gitlab.before > 0
          ? ((totals.gitlab.after - totals.gitlab.before) /
              totals.gitlab.before) *
            100
          : 0,
      status: `${totals.gitlab.approved} Approved, ${totals.gitlab.rejected} Rejected`,
      statusColor: 'info' as const,
    },
    {
      category: 'LDAP Accounts',
      before: totals.ldap.before,
      after: totals.ldap.after,
      change:
        totals.ldap.before > 0
          ? ((totals.ldap.after - totals.ldap.before) / totals.ldap.before) *
            100
          : 0,
      status: `${totals.ldap.approved} Approved, ${totals.ldap.rejected} Rejected`,
      statusColor: 'info' as const,
    },
  ];

  return (
    <>
      <DataInconsistencyWarning
        validationResult={totals.validationResult}
        isSyncing={isSyncing}
      />
      <TableContainer component={Paper} className={classes.tableContainer}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className={classes.tableHeaderCell}>
                Category
              </TableCell>
              <TableCell align="center" className={classes.tableHeaderCell}>
                Before
              </TableCell>
              <TableCell align="center" className={classes.tableHeaderCell}>
                After
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(row => (
              <TableRow key={row.category}>
                <TableCell
                  component="th"
                  scope="row"
                  className={classes.tableCell}
                >
                  {row.category}
                </TableCell>
                <TableCell align="center" className={classes.tableCell}>
                  {row.before}
                </TableCell>
                <TableCell align="center" className={classes.tableCell}>
                  {row.after}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

interface AccountEntry {
  type: 'service-account' | 'rover-group-name';
  source: 'rover' | 'gitlab' | 'ldap';
  account_name: string;
}

interface ApplicationDetails {
  app_name: string;
  cmdb_id: string;
  environment: string;
  app_owner: string;
  app_delegate: string;
  jira_project: string;
  app_owner_email?: string;
  app_delegate_email?: string;
  accounts: AccountEntry[];
  jira_metadata?: Record<string, string>;
}

export const AuditSummaryReport: React.FC<SummaryReportProps> = ({
  data,
  error,
  isAuditCompleted,
  isSyncing,
  onAuditCompleted,
}): JSX.Element => {
  const classes = useStyles();
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const configApi = useApi(configApiRef);
  const alertApi = useApi(alertApiRef);
  const identityApi = useApi(identityApiRef);
  const jiraUrl = configApi.getString('auditCompliance.jiraUrl');
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [applicationDetails, setApplicationDetails] =
    useState<ApplicationDetails | null>(null);
  const [isLoadingAppDetails, setIsLoadingAppDetails] = useState(false);
  const [documentationEvidence, setDocumentationEvidence] = useState('');
  const [auditorNotes, setAuditorNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [userRef, setUserRef] = useState<string>('');
  const [isCompleting, setIsCompleting] = useState(false);

  // Helper function to filter accounts by type and source
  const getFilteredAccounts = (
    type: 'rover-group-name' | 'service-account',
    source: 'rover' | 'gitlab' | 'ldap',
  ) => {
    if (!applicationDetails?.accounts) return [];
    return applicationDetails.accounts
      .filter(acc => acc.type === type && acc.source === source)
      .map(acc => acc.account_name);
  };

  // Function to fetch statistics
  const fetchStatistics = async () => {
    if (!data || isAuditCompleted) return;

    setIsLoadingStats(true);
    try {
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const statsResponse = await fetchApi.fetch(
        `${baseUrl}/audits/${data.app_name}/${data.frequency}/${data.period}/statistics`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      if (statsResponse.status === 404) {
        setStatistics(null);
        return;
      }

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const statsData = await statsResponse.json();
      setStatistics(statsData.statistics);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch statistics:', err);
      setStatistics(null);
      alertApi.post({
        message: 'Failed to fetch statistics. Please try again.',
        severity: 'error',
      });
      throw err;
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Effect to fetch application details
  useEffect(() => {
    const fetchApplicationDetails = async () => {
      if (!data?.app_name) return;

      setIsLoadingAppDetails(true);
      try {
        const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
        const response = await fetchApi.fetch(
          `${baseUrl}/application-details/${data.app_name}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          },
        );

        if (!response.ok) {
          throw new Error('Failed to fetch application details');
        }

        const details = await response.json();
        setApplicationDetails(details);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch application details:', err);
        alertApi.post({
          message: 'Failed to fetch application details. Please try again.',
          severity: 'error',
        });
      } finally {
        setIsLoadingAppDetails(false);
      }
    };

    fetchApplicationDetails();
  }, [data?.app_name, discoveryApi, fetchApi, alertApi]);

  // Add useEffect to fetch metadata when component mounts
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
        const response = await fetchApi.fetch(
          `${baseUrl}/audits/${data.app_name}/${data.frequency}/${data.period}/metadata`,
        );

        if (response.ok) {
          const metadata = await response.json();
          setDocumentationEvidence(
            metadata.documentation_evidence?.content || '',
          );
          setAuditorNotes(metadata.auditor_notes?.content || '');
        }
      } catch (metaDataerror) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch metadata:', metaDataerror);
        alertApi.post({
          message: 'Failed to fetch metadata',
          severity: 'error',
        });
      }
    };

    if (data.app_name && data.frequency && data.period) {
      fetchMetadata();
    }
  }, [
    data.app_name,
    data.frequency,
    data.period,
    discoveryApi,
    fetchApi,
    alertApi,
  ]);

  // Add effect to get user identity
  useEffect(() => {
    const getUserIdentity = async () => {
      const identity = await identityApi.getBackstageIdentity();
      if (identity) {
        setUserRef(identity.userEntityRef);
      }
    };
    getUserIdentity();
  }, [identityApi]);

  // Effect to fetch data (fetch statistics)
  useEffect(() => {
    const fetchData = async () => {
      if (!data || isAuditCompleted) return;

      try {
        await fetchStatistics();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch statistics:', err);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, discoveryApi, fetchApi, alertApi, isAuditCompleted]);

  useEffect(() => {
    // If sync just finished, refetch statistics
    if (!isSyncing) {
      fetchStatistics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSyncing]);

  const handleTabChange = (_event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSaveMetadata = async () => {
    setIsSaving(true);
    try {
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const response = await fetchApi.fetch(
        `${baseUrl}/audits/${data.app_name}/${data.frequency}/${data.period}/metadata`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            documentation_evidence: { content: documentationEvidence },
            auditor_notes: { content: auditorNotes },
          }),
        },
      );

      if (response.ok) {
        alertApi.post({
          message: 'Metadata saved successfully',
          severity: 'success',
        });
      } else {
        throw new Error('Failed to save metadata');
      }
    } catch (saveError) {
      // eslint-disable-next-line no-console
      console.error('Failed to save metadata:', saveError);
      alertApi.post({
        message: 'Failed to save metadata',
        severity: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Update handleCompleteAudit to use userRef
  const handleCompleteAudit = async () => {
    if (!data || isCompleting) return;

    setIsCompleting(true);
    try {
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const response = await fetchApi.fetch(
        `${baseUrl}/audits/${data.app_name}/${data.frequency}/${data.period}/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            performed_by: userRef,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to complete audit');
      }

      alertApi.post({
        message: 'Audit completed successfully',
        severity: 'success',
      });
      if (onAuditCompleted) onAuditCompleted();
    } catch (auditCompleteError) {
      // eslint-disable-next-line no-console
      console.error('Failed to complete audit:', auditCompleteError);
      alertApi.post({
        message: 'Failed to complete audit',
        severity: 'error',
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const renderStatisticsContent = () => {
    if (isSyncing || isLoadingStats) {
      return (
        <div className={classes.loadingOverlay}>
          <CircularProgress />
          <Typography variant="h6" style={{ marginTop: '16px' }}>
            {isSyncing ? 'Syncing data...' : 'Loading statistics...'}
          </Typography>
        </div>
      );
    }
    if (!statistics) {
      return (
        <Paper className={classes.errorMessage}>
          <Typography>
            No audit data found for this period. Please initiate an audit first.
          </Typography>
        </Paper>
      );
    }

    const totals = calculateTotals(statistics);

    return viewMode === 'cards' ? (
      <>
        <DataInconsistencyWarning
          validationResult={totals.validationResult}
          isSyncing={isSyncing}
        />
        <Grid container spacing={2} style={{ marginBottom: '16px' }}>
          <Grid item xs={3}>
            <StatCard
              title="Total Reviews"
              value={
                statistics.group_access.rover.total +
                statistics.group_access.gitlab.total +
                statistics.group_access.ldap.total +
                statistics.service_accounts.rover.total +
                statistics.service_accounts.gitlab.total +
                statistics.service_accounts.ldap.total
              }
              type="total"
              subtitle="All Access Reviews"
              before={
                statistics.group_access.rover.fresh +
                statistics.group_access.gitlab.fresh +
                statistics.group_access.ldap.fresh +
                statistics.service_accounts.rover.fresh +
                statistics.service_accounts.gitlab.fresh +
                statistics.service_accounts.ldap.fresh
              }
              after={
                statistics.group_access.rover.total +
                statistics.group_access.gitlab.total +
                statistics.group_access.ldap.total +
                statistics.service_accounts.rover.total +
                statistics.service_accounts.gitlab.total +
                statistics.service_accounts.ldap.total
              }
            />
          </Grid>
          <Grid item xs={3}>
            <StatCard
              title="Total Approvals"
              value={statistics.statusOverview.totalReviews.approved}
              type="approved"
              subtitle="Approved Access Reviews"
              before={
                statistics.group_access.rover.approved +
                statistics.group_access.gitlab.approved +
                statistics.group_access.ldap.approved +
                statistics.service_accounts.rover.approved +
                statistics.service_accounts.gitlab.approved +
                statistics.service_accounts.ldap.approved
              }
              after={statistics.statusOverview.totalReviews.approved}
            />
          </Grid>
          <Grid item xs={3}>
            <StatCard
              title="Total Rejections"
              value={statistics.statusOverview.totalReviews.rejected}
              type="rejected"
              subtitle="Rejected Access Reviews"
              before={
                statistics.group_access.rover.rejected +
                statistics.group_access.gitlab.rejected +
                statistics.group_access.ldap.rejected +
                statistics.service_accounts.rover.rejected +
                statistics.service_accounts.gitlab.rejected +
                statistics.service_accounts.ldap.rejected
              }
              after={statistics.statusOverview.totalReviews.rejected}
            />
          </Grid>
          <Grid item xs={3}>
            <StatCard
              title="Service Accounts"
              value={
                statistics.service_accounts.rover.total +
                statistics.service_accounts.gitlab.total +
                statistics.service_accounts.ldap.total
              }
              type="total"
              subtitle={`${
                statistics.service_accounts.rover.approved +
                statistics.service_accounts.gitlab.approved +
                statistics.service_accounts.ldap.approved
              } Approved, ${
                statistics.service_accounts.rover.rejected +
                statistics.service_accounts.gitlab.rejected +
                statistics.service_accounts.ldap.rejected
              } Rejected`}
              before={
                statistics.service_accounts.rover.fresh +
                statistics.service_accounts.gitlab.fresh +
                statistics.service_accounts.ldap.fresh
              }
              after={
                statistics.service_accounts.rover.total +
                statistics.service_accounts.gitlab.total +
                statistics.service_accounts.ldap.total
              }
            />
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <StatCard
              title="Rover Reviews"
              value={statistics.group_access.rover.total}
              type="total"
              subtitle={`${statistics.group_access.rover.approved} Approved, ${statistics.group_access.rover.rejected} Rejected`}
              before={statistics.group_access.rover.fresh}
              after={statistics.group_access.rover.total}
            />
          </Grid>
          <Grid item xs={4}>
            <StatCard
              title="GitLab Reviews"
              value={statistics.group_access.gitlab.total}
              type="total"
              subtitle={`${statistics.group_access.gitlab.approved} Approved, ${statistics.group_access.gitlab.rejected} Rejected`}
              before={statistics.group_access.gitlab.fresh}
              after={statistics.group_access.gitlab.total}
            />
          </Grid>
          <Grid item xs={4}>
            <StatCard
              title="LDAP Reviews"
              value={statistics.group_access.ldap.total}
              type="total"
              subtitle={`${statistics.group_access.ldap.approved} Approved, ${statistics.group_access.ldap.rejected} Rejected`}
              before={statistics.group_access.ldap.fresh}
              after={statistics.group_access.ldap.total}
            />
          </Grid>
        </Grid>
      </>
    ) : (
      <StatisticsTable statistics={statistics} isSyncing={isSyncing} />
    );
  };

  const renderReviewDetailsContent = () => {
    if (isLoadingStats) {
      return (
        <div className={classes.loadingOverlay}>
          <CircularProgress />
          <Typography variant="h6" style={{ marginTop: '16px' }}>
            Loading review details...
          </Typography>
        </div>
      );
    }
    if (!statistics) {
      return (
        <Paper className={classes.errorMessage}>
          <Typography>
            No review details available. Please initiate an audit first.
          </Typography>
        </Paper>
      );
    }
    return (
      <>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="User Access" />
          <Tab label="Service Accounts" />
        </Tabs>
        <Box mt={2}>
          {tabValue === 0 && (
            <ReviewDataTable
              app_name={data.app_name}
              frequency={data.frequency}
              period={data.period}
              type="user_access"
            />
          )}
          {tabValue === 1 && (
            <ReviewDataTable
              app_name={data.app_name}
              frequency={data.frequency}
              period={data.period}
              type="service_account"
            />
          )}
        </Box>
      </>
    );
  };

  if (error) {
    return (
      <Paper className={classes.errorMessage}>
        <Typography>{error}</Typography>
      </Paper>
    );
  }

  const exportPDF = async () => {
    const sections = [
      'application-details',
      'access-review-statistics',
      'documentation-evidence',
      'auditor-notes',
    ];

    // Create a wrapper container with styles
    const wrapper = document.createElement('div');
    wrapper.style.padding = '20px';
    wrapper.style.background = 'white';
    wrapper.style.width = 'fit-content';

    // Add title section
    const titleDiv = document.createElement('div');
    titleDiv.style.textAlign = 'center';
    titleDiv.style.marginBottom = '30px';
    titleDiv.style.padding = '20px';
    titleDiv.style.borderBottom = '2px solid #333';
    titleDiv.innerHTML = `
      <h1 style="margin: 0; font-size: 24px; color: #333;">${data.frequency.toUpperCase()} Access Review</h1>
      <h2 style="margin: 10px 0; font-size: 20px; color: #666;">${data.app_name.toUpperCase()} - ${
      data.period
    }</h2>
    `;
    wrapper.appendChild(titleDiv);

    sections.forEach(id => {
      const original = document.getElementById(id);
      if (!original) return;

      const clone = original.cloneNode(true) as HTMLElement;
      clone.style.border = '1px solid #ccc';
      clone.style.padding = '16px';
      clone.style.marginBottom = '20px';
      clone.style.boxSizing = 'border-box';
      wrapper.appendChild(clone);
    });

    document.body.appendChild(wrapper);

    // Capture the styled wrapper
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = 595.28;
    const scaleFactor = pdfWidth / canvas.width;
    const pdfHeight = canvas.height * scaleFactor;

    const PDF = new JsPDF('p', 'pt', [pdfWidth, pdfHeight]);

    PDF.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    PDF.save(`${data.frequency}-${data.app_name}-${data.period}.pdf`);
    document.body.removeChild(wrapper);
  };
  return (
    <div className={classes.root}>
      {/* Add download button at the top */}
      <Box display="flex" justifyContent="flex-end" mb={2} className="no-print">
        <Button onClick={exportPDF}>Download PDF</Button>
      </Box>

      {!isAuditCompleted && (
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<CheckCircleIcon />}
            onClick={handleCompleteAudit}
            className={classes.completeButton}
            disabled={isSyncing || isCompleting}
          >
            {isCompleting ? 'Completing Audit...' : 'Complete Audit'}
          </Button>
        </Box>
      )}

      {isAuditCompleted && (
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
            <Box display="flex" alignItems="center">
              <CheckCircleIcon style={{ color: '#2e7d32', marginRight: 12 }} />
              <Box>
                <Typography
                  variant="h6"
                  style={{ color: '#2e7d32', fontWeight: 500 }}
                >
                  Audit Completed
                </Typography>
                <Typography variant="body2" style={{ color: '#1b5e20' }}>
                  This audit has been completed and is now in read-only mode.
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Application Details Section */}
      <div className={classes.section} id="application-details">
        <Paper className={classes.applicationDetailsPaper}>
          <Typography variant="h5" gutterBottom>
            Application Details
          </Typography>
          {isLoadingAppDetails ? (
            <div className={classes.loadingOverlay}>
              <CircularProgress />
              <Typography variant="h6" style={{ marginTop: '16px' }}>
                Loading application details...
              </Typography>
            </div>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  Application Name
                </Typography>
                <Typography variant="body1">
                  {formatDisplayName(
                    applicationDetails?.app_name ?? data.app_name ?? '',
                  )}
                </Typography>
                {applicationDetails?.cmdb_id && (
                  <>
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      gutterBottom
                      style={{ marginTop: '16px' }}
                    >
                      CMDB Codes
                    </Typography>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {applicationDetails.cmdb_id
                        .split(',')
                        .map((code, index) => (
                          <Chip
                            key={index}
                            label={code.trim().toUpperCase()}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                    </div>
                  </>
                )}
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  Application Owner
                </Typography>
                <Typography variant="body1">
                  {applicationDetails?.app_owner
                    ? applicationDetails.app_owner
                        .split(' ')
                        .map(
                          word =>
                            word.charAt(0).toUpperCase() +
                            word.slice(1).toLowerCase(),
                        )
                        .join(' ')
                    : 'Not specified'}
                </Typography>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                  style={{ marginTop: '16px' }}
                >
                  Application Delegate
                </Typography>
                <Typography variant="body1">
                  {applicationDetails?.app_delegate ? (
                    <EntityDisplayName
                      entityRef={{
                        name: applicationDetails.app_delegate,
                        kind: 'User',
                        namespace: 'redhat',
                      }}
                    />
                  ) : (
                    'Not specified'
                  )}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  Environment
                </Typography>
                <Typography variant="body1">
                  {(
                    applicationDetails?.environment || 'Not specified'
                  ).toUpperCase()}
                </Typography>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                  style={{ marginTop: '16px' }}
                >
                  Jira ID
                </Typography>
                <Typography variant="body1">
                  {data.jira_key ? (
                    <Link
                      href={`${jiraUrl}/browse/${data.jira_key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {data.jira_key.toUpperCase()}
                    </Link>
                  ) : (
                    'Not specified'.toUpperCase()
                  )}
                </Typography>
              </Grid>
            </Grid>
          )}

          {/* Account Names Section */}
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Account Names
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  Rover Accounts
                </Typography>
                <AccountListComponent
                  accounts={getFilteredAccounts('rover-group-name', 'rover')}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  GitLab Accounts
                </Typography>
                <AccountListComponent
                  accounts={getFilteredAccounts('rover-group-name', 'gitlab')}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  LDAP Accounts
                </Typography>
                <AccountListComponent
                  accounts={getFilteredAccounts('rover-group-name', 'ldap')}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  Service Accounts
                </Typography>
                <AccountListComponent
                  accounts={[
                    ...getFilteredAccounts('service-account', 'rover'),
                    ...getFilteredAccounts('service-account', 'gitlab'),
                    ...getFilteredAccounts('service-account', 'ldap'),
                  ]}
                />
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </div>

      {/* Statistics Section */}
      <div className={classes.section} id="access-review-statistics">
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h5">Access Review Statistics</Typography>
          {!isLoadingStats && statistics && (
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_e, value) => value && setViewMode(value)}
              size="small"
            >
              <ToggleButton value="cards">Cards</ToggleButton>
              <ToggleButton value="table">Table</ToggleButton>
            </ToggleButtonGroup>
          )}
        </Box>
        {renderStatisticsContent()}
      </div>

      {/* Access Review Details Section */}
      <div className={classes.section}>
        <Typography variant="h5" gutterBottom>
          Access Review Details
        </Typography>
        {renderReviewDetailsContent()}
      </div>

      {/* Documentation and Evidence Section */}
      <div className={classes.section} id="documentation-evidence">
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h5">Documentation and Evidence</Typography>
          {!isAuditCompleted && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveMetadata}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}
        </Box>
        <Paper className={classes.metadataPaper}>
          <TextField
            fullWidth
            multiline
            rows={6}
            variant="outlined"
            value={documentationEvidence}
            onChange={e => setDocumentationEvidence(e.target.value)}
            placeholder="Enter documentation and evidence..."
            className={classes.metadataField}
            disabled={isAuditCompleted}
          />
        </Paper>
      </div>

      {/* Auditor Notes Section */}
      <div className={classes.section} id="auditor-notes">
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h5">Auditor Notes</Typography>
        </Box>
        <Paper className={classes.metadataPaper}>
          <TextField
            fullWidth
            multiline
            rows={6}
            variant="outlined"
            value={auditorNotes}
            onChange={e => setAuditorNotes(e.target.value)}
            placeholder="Enter auditor notes..."
            className={classes.metadataField}
            disabled={isAuditCompleted}
          />
        </Paper>
      </div>
    </div>
  );
};

import {
  Breadcrumbs,
  Content,
  Header,
  HeaderLabel,
  Page,
  Table,
} from '@backstage/core-components';
import {
  alertApiRef,
  configApiRef,
  discoveryApiRef,
  fetchApiRef,
  useApi,
  identityApiRef,
} from '@backstage/core-plugin-api';
import {
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Typography,
  IconButton,
} from '@material-ui/core';
import Group from '@material-ui/icons/Group';
import EditIcon from '@material-ui/icons/Edit';
import RefreshIcon from '@material-ui/icons/Refresh';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { formatDisplayName } from '../AuditApplicationList/AuditApplicationList';
import {
  AuditProgressStepper,
  AuditStep,
} from '../AuditProgressStepper/AuditProgressStepper';
import { EpicDisplay } from '../../../components/EpicDisplay';

const getQuarterOptions = () => [
  { value: 'Q1', label: 'Q1 (Jan - Mar)' },
  { value: 'Q2', label: 'Q2 (Apr - Jun)' },
  { value: 'Q3', label: 'Q3 (Jul - Sep)' },
  { value: 'Q4', label: 'Q4 (Oct - Dec)' },
];

const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return [currentYear, currentYear + 1];
};

interface AuditHistoryItem {
  frequency: string;
  period: string;
  status: string;
  auditFrequency: string;
  auditPeriod: string;
  created_at: string;
  progress: AuditStep;
  jira_key: string;
  epic_key?: string;
  epic_title?: string;
  epic_created_at?: string;
  epic_created_by?: string;
}
export const AuditInitiation = () => {
  const { app_name } = useParams<{ app_name: string }>();

  const navigate = useNavigate();
  const [frequency, setFrequency] = useState<'quarterly' | 'yearly' | ''>('');
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [auditHistory, setAuditHistory] = useState<AuditHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const alertApi = useApi(alertApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const configApi = useApi(configApiRef);
  const identityApi = useApi(identityApiRef);
  const [currentUser, setCurrentUser] = useState('');
  const [appOwnerEmail, setAppOwnerEmail] = useState('');
  const [manualJiraKey, setManualJiraKey] = useState('');
  const [manualEpicKey, setManualEpicKey] = useState('');
  const [editingFields, setEditingFields] = useState<{
    jiraKey: string;
    epicKey: string;
    freq: string;
    period: string;
  } | null>(null);
  const [savingFields, setSavingFields] = useState(false);
  const jiraUrl = configApi.getString('auditCompliance.jiraUrl');

  // Fetch current user and app owner
  useEffect(() => {
    const fetchUserAndOwner = async () => {
      try {
        const identity = await identityApi.getBackstageIdentity();
        setCurrentUser(identity.userEntityRef);
        if (app_name) {
          const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
          const response = await fetchApi.fetch(
            `${baseUrl}/application-details/${encodeURIComponent(app_name)}`,
          );
          const data = await response.json();
          setAppOwnerEmail(data.app_owner_email);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch user or owner', e);
      }
    };
    fetchUserAndOwner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app_name]);

  const fetchAuditHistory = async () => {
    try {
      if (!app_name) {
        setAuditHistory([]);
        return;
      }

      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const auditResponse = await fetchApi.fetch(
        `${baseUrl}/audits?app_name=${encodeURIComponent(app_name)}`,
      );
      const result = await auditResponse.json();
      setAuditHistory(result || []);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching audit history', error);
      alertApi.post({
        message: 'Failed to load audit history.',
        severity: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkDuplicate = async (auditFrequency: string, period: string) => {
    try {
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const response = await fetchApi.fetch(
        `${baseUrl}/audits/check-duplicate`,
        {
          method: 'POST',
          body: JSON.stringify({ app_name, frequency: auditFrequency, period }),
          headers: { 'Content-Type': 'application/json' },
        },
      );
      const result = await response.json();
      if (result.duplicate) {
        alertApi.post({
          message: 'Selected audit period is already in progress or completed.',
          severity: 'error',
        });
        return true;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error checking duplicate audit', err);
      alertApi.post({
        message: 'Failed to check for duplicate audit.',
        severity: 'error',
      });
    }
    return false;
  };

  const handleStartAudit = async () => {
    if (!frequency) {
      alertApi.post({
        message: 'Please select an audit frequency.',
        severity: 'warning',
      });
      return;
    }
    if (frequency === 'quarterly' && !selectedQuarter) {
      alertApi.post({
        message: 'Please select a quarter.',
        severity: 'warning',
      });
      return;
    }
    if (!selectedYear) {
      alertApi.post({ message: 'Please select a year.', severity: 'warning' });
      return;
    }

    const period =
      frequency === 'quarterly'
        ? `${selectedQuarter}-${selectedYear}`
        : String(selectedYear);

    const isDuplicate = await checkDuplicate(frequency, period);
    if (isDuplicate) return;

    setIsLoading(true);
    // Show temporary loading alert
    alertApi.post({
      message: 'Initiating audit and fetching data...',
      severity: 'info',
      display: 'transient', // This will auto-dismiss after a few seconds
    });

    try {
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');

      const auditResponse = await fetchApi.fetch(`${baseUrl}/audits`, {
        method: 'POST',
        body: JSON.stringify({ app_name, frequency, period }),
        headers: { 'Content-Type': 'application/json' },
      });

      const auditResult = await auditResponse.json();

      if (!auditResponse.ok) {
        alertApi.post({
          message:
            auditResult.error || 'Failed to initiate audit. Please try again.',
          severity: 'error',
        });
        return;
      }

      // Show alert if JIRA creation failed
      if (auditResult.jira_creation_failed) {
        alertApi.post({
          message: 'Failed to create a JIRA story',
          severity: 'warning',
          display: 'transient',
        });
      }

      // Show success message with Jira ticket and report information
      const successMessage = [
        `Audit initiated successfully${
          auditResult.jira_ticket?.key
            ? ` with Jira ticket ${auditResult.jira_ticket.key}.`
            : '.'
        }`,
        auditResult.reports_generated > 0
          ? `Generated ${auditResult.reports_generated} reports from ${
              auditResult.sources?.join(' and ') || 'Rover and GitLab'
            }.`
          : 'No reports were generated for this audit.',
      ].join(' ');

      alertApi.post({
        message: successMessage,
        severity: auditResult.reports_generated > 0 ? 'success' : 'warning',
      });

      // Refresh audit history
      await fetchAuditHistory();
    } catch (err) {
      alertApi.post({
        message: 'Failed to initiate audit. Please try again.',
        severity: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (rowData: AuditHistoryItem) => {
    const freq = rowData.frequency;
    const prd = rowData.period;

    navigate(`/audit-access-manager/${app_name}/${freq}/${prd}/details`, {
      state: { ...rowData, app_name },
    });
  };

  // Save manual Jira key and Epic key
  const handleSaveFields = async (row: AuditHistoryItem) => {
    setSavingFields(true);
    try {
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const response = await fetchApi.fetch(
        `${baseUrl}/audits/${app_name}/${row.frequency}/${row.period}/jira-key`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jira_key: manualJiraKey,
            epic_key: manualEpicKey,
            user: currentUser,
          }),
        },
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        alertApi.post({
          message:
            errorData.error || 'Failed to update Jira Story and Epic keys',
          severity: 'error',
        });
        return;
      }
      // Determine what was updated for better user feedback
      const updatedFields = [];
      if (manualJiraKey !== row.jira_key) updatedFields.push('Story');
      if (manualEpicKey !== row.epic_key) updatedFields.push('Epic');

      const message =
        updatedFields.length > 0
          ? `${updatedFields.join(' and ')} key${
              updatedFields.length > 1 ? 's' : ''
            } updated successfully${
              manualEpicKey !== row.epic_key ? ' and synced to Jira' : ''
            }`
          : 'Keys updated successfully';

      alertApi.post({
        message,
        severity: 'success',
      });
      setEditingFields(null);
      setManualJiraKey('');
      setManualEpicKey('');
      fetchAuditHistory();
    } catch (e) {
      alertApi.post({
        message: 'Failed to update Jira Story and Epic keys',
        severity: 'error',
      });
    } finally {
      setSavingFields(false);
    }
  };

  // Refresh data for existing audit
  const handleRefreshData = async (row: AuditHistoryItem) => {
    setIsLoading(true);
    // Show temporary loading alert
    alertApi.post({
      message: 'Refreshing audit data...',
      severity: 'info',
      display: 'transient',
    });

    try {
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');

      const refreshResponse = await fetchApi.fetch(
        `${baseUrl}/audits/refresh-data`,
        {
          method: 'POST',
          body: JSON.stringify({
            app_name,
            frequency: row.frequency,
            period: row.period,
            performed_by: currentUser,
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const refreshResult = await refreshResponse.json();

      if (!refreshResponse.ok) {
        alertApi.post({
          message:
            refreshResult.error ||
            'Failed to refresh audit data. Please try again.',
          severity: 'error',
        });
        return;
      }

      // Show success message with statistics
      const successMessage = [
        'Audit data refreshed successfully.',
        refreshResult.total_records > 0
          ? `Total records refreshed: ${refreshResult.total_records}`
          : 'No records were refreshed.',
        refreshResult.sources?.length > 0
          ? `Sources: ${refreshResult.sources.join(', ')}`
          : '',
        'Previous data was cleared and replaced with fresh data.',
      ]
        .filter(Boolean)
        .join(' ');

      alertApi.post({
        message: successMessage,
        severity: refreshResult.total_records > 0 ? 'success' : 'warning',
      });

      // Refresh audit history
      await fetchAuditHistory();
    } catch (err) {
      alertApi.post({
        message: 'Failed to refresh audit data. Please try again.',
        severity: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if the current user is the application owner (component-level)
  const isOwner =
    currentUser &&
    appOwnerEmail &&
    currentUser.split('/').pop() === appOwnerEmail.split('@')[0];

  return (
    <Page themeId="tool">
      <Header
        title=" Audit Access Manager"
        subtitle={
          <Box>
            <Typography variant="subtitle1" style={{ marginBottom: '8px' }}>
              Ensure Trust. Enforce Standards. Empower Teams.
            </Typography>
            <Breadcrumbs aria-label="breadcrumb">
              <RouterLink to="/audit-access-manager">
                Audit Access Manager
              </RouterLink>
              <Typography color="textPrimary">Audit Initiation</Typography>
            </Breadcrumbs>
          </Box>
        }
      >
        <HeaderLabel
          label="Owner"
          value={
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Group fontSize="small" /> Appdev
            </span>
          }
        />
        <HeaderLabel label="Lifecycle" value="Alpha" />
      </Header>

      <Content>
        <Box padding={3}>
          <Typography variant="h4" gutterBottom>
            Audit for Application ID:{' '}
            <strong>{formatDisplayName(app_name ?? '')}</strong>
          </Typography>
          <Box mb={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth required>
                  <InputLabel required>Audit Frequency</InputLabel>
                  <Select
                    value={frequency}
                    onChange={e =>
                      setFrequency(e.target.value as 'quarterly' | 'yearly')
                    }
                    required
                  >
                    <MenuItem value="quarterly">Quarterly</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {frequency === 'quarterly' && (
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth required>
                    <InputLabel required>Select Quarter</InputLabel>
                    <Select
                      value={selectedQuarter}
                      onChange={e =>
                        setSelectedQuarter(e.target.value as string)
                      }
                      required
                    >
                      {getQuarterOptions().map(q => (
                        <MenuItem key={q.value} value={q.value}>
                          {q.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {(frequency === 'yearly' || frequency === 'quarterly') && (
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth required>
                    <InputLabel required>Select Year</InputLabel>
                    <Select
                      value={selectedYear}
                      onChange={e => setSelectedYear(Number(e.target.value))}
                      required
                    >
                      {getYearOptions().map(year => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>

            <Box mt={3}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleStartAudit}
                disabled={isLoading}
              >
                {isLoading ? 'Initiating Audit...' : 'Initiate New Audit'}
              </Button>
            </Box>
          </Box>

          {auditHistory.length > 0 ? (
            <Box mt={5}>
              <Typography variant="h6" gutterBottom>
                Previous Audits
              </Typography>
              <Table
                title="Audit History"
                columns={[
                  {
                    title: 'Parent Audit Epic',
                    field: 'epic_key',
                    render: (row: AuditHistoryItem) => {
                      if (
                        editingFields &&
                        editingFields.freq === row.frequency &&
                        editingFields.period === row.period
                      ) {
                        return (
                          <Box
                            display="flex"
                            alignItems="center"
                            style={{ gap: 8 }}
                          >
                            <input
                              type="text"
                              value={manualEpicKey}
                              onChange={e => setManualEpicKey(e.target.value)}
                              placeholder="Enter Epic Key"
                              style={{ minWidth: '120px' }}
                            />
                          </Box>
                        );
                      }
                      return (
                        <EpicDisplay
                          epicKey={row.epic_key}
                          epicTitle={row.epic_title}
                          variant="link"
                          size="small"
                          showKey
                          showTitle={false}
                        />
                      );
                    },
                  },
                  {
                    title: 'Jira Ticket',
                    field: 'jira_key',
                    render: (row: AuditHistoryItem) => {
                      if (
                        editingFields &&
                        editingFields.freq === row.frequency &&
                        editingFields.period === row.period
                      ) {
                        return (
                          <Box
                            display="flex"
                            alignItems="center"
                            style={{ gap: 8 }}
                          >
                            <input
                              type="text"
                              value={manualJiraKey}
                              onChange={e => setManualJiraKey(e.target.value)}
                              placeholder="Enter Jira Story Key"
                              style={{ minWidth: '120px' }}
                            />
                            <Button
                              size="small"
                              color="primary"
                              variant="contained"
                              onClick={() => handleSaveFields(row)}
                              disabled={savingFields}
                            >
                              {savingFields ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                              size="small"
                              onClick={() => {
                                setEditingFields(null);
                                setManualJiraKey('');
                                setManualEpicKey('');
                              }}
                              disabled={savingFields}
                            >
                              Cancel
                            </Button>
                          </Box>
                        );
                      }
                      if (
                        !row.jira_key ||
                        row.jira_key.toUpperCase() === 'N/A'
                      ) {
                        return 'N/A';
                      }
                      return (
                        <Link
                          href={`${jiraUrl}/browse/${row.jira_key}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {row.jira_key}
                        </Link>
                      );
                    },
                  },
                  { title: 'Frequency', field: 'frequency' },
                  { title: 'Period', field: 'period' },

                  {
                    title: 'Status',
                    render: (row: AuditHistoryItem) => {
                      const status = row.status?.toUpperCase() || '';
                      let chipStyle: React.CSSProperties = { fontWeight: 600 };

                      // Gradient color system: lighter colors for early stages, darker for completion
                      if (status === 'AUDIT_STARTED') {
                        // Blue for kickoff phase
                        chipStyle = {
                          backgroundColor: '#E3F2FD',
                          color: '#1565C0',
                          borderColor: '#42A5F5',
                          fontWeight: 600,
                        };
                      } else if (status === 'IN_PROGRESS') {
                        // Amber for midway/in progress
                        chipStyle = {
                          backgroundColor: '#FFF3E0',
                          color: '#E65100',
                          borderColor: '#FF9800',
                          fontWeight: 600,
                        };
                      } else if (status === 'ACCESS_REVIEW_COMPLETE') {
                        // Dark amber for review done
                        chipStyle = {
                          backgroundColor: '#E65100',
                          color: '#FFFFFF',
                          borderColor: '#E65100',
                          fontWeight: 600,
                        };
                      } else if (status === 'COMPLETED') {
                        // Green for success/fully complete
                        chipStyle = {
                          backgroundColor: '#E8F5E8',
                          color: '#1B5E20',
                          borderColor: '#4CAF50',
                          fontWeight: 600,
                        };
                      } else {
                        // Default gray for unknown statuses
                        chipStyle = {
                          backgroundColor: '#F5F5F5',
                          color: '#616161',
                          borderColor: '#9E9E9E',
                          fontWeight: 600,
                        };
                      }

                      return (
                        <Chip
                          label={status}
                          size="small"
                          variant="outlined"
                          style={chipStyle}
                        />
                      );
                    },
                  },
                  {
                    title: 'Audit Progress',
                    field: 'progress',
                    render: (row: AuditHistoryItem) => (
                      <AuditProgressStepper activeStep={row.progress} />
                    ),
                  },
                  { title: 'Created At', field: 'created_at' },
                  // Only show Actions column if isOwner
                  ...(isOwner
                    ? [
                        {
                          title: 'Actions',
                          field: 'actions',
                          render: (row: AuditHistoryItem) => (
                            <Box
                              display="flex"
                              alignItems="center"
                              style={{ gap: 8 }}
                            >
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setEditingFields({
                                    jiraKey: row.jira_key || '',
                                    epicKey: row.epic_key || '',
                                    freq: row.frequency,
                                    period: row.period,
                                  });
                                  setManualJiraKey(row.jira_key || '');
                                  setManualEpicKey(row.epic_key || '');
                                }}
                                title="Edit Jira Story & Epic"
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleRefreshData(row)}
                                title="Refresh Data"
                                disabled={isLoading}
                              >
                                <RefreshIcon />
                              </IconButton>
                            </Box>
                          ),
                          sorting: false,
                          hidden: false,
                        },
                      ]
                    : []),
                  {
                    title: 'View Details',
                    render: (row: AuditHistoryItem) => (
                      <Button
                        variant="outlined"
                        onClick={() => handleViewDetails(row)}
                      >
                        View Details
                      </Button>
                    ),
                  },
                ]}
                data={auditHistory}
                options={{ paging: false, search: false }}
              />
            </Box>
          ) : (
            <Typography variant="body1">No audit history available.</Typography>
          )}
        </Box>
      </Content>
    </Page>
  );
};

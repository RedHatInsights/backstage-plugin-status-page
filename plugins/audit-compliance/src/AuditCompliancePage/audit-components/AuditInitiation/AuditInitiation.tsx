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
} from '@material-ui/core';
import Group from '@material-ui/icons/Group';
import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { formatDisplayName } from '../AuditApplicationList/AuditApplicationList';
import {
  AuditProgressStepper,
  AuditStep,
} from '../AuditProgressStepper/AuditProgressStepper';

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
  const jiraUrl = configApi.getString('auditCompliance.jiraUrl');

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
          message: 'Failed to create a JIRA epic',
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

    navigate(`/audit-compliance/${app_name}/${freq}/${prd}/details`, {
      state: { ...rowData, app_name },
    });
  };

  return (
    <Page themeId="tool">
      <Header
        title=" Audit and Compliance"
        subtitle={
          <Box>
            <Typography variant="subtitle1" style={{ marginBottom: '8px' }}>
              Ensure Trust. Enforce Standards. Empower Teams.
            </Typography>
            <Breadcrumbs aria-label="breadcrumb">
              <RouterLink to="/audit-compliance">
                Audit and Compliance
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
                    title: 'Jira Ticket',
                    field: 'jira_key',
                    render: (row: AuditHistoryItem) => {
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

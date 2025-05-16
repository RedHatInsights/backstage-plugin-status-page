import {
  Content,
  Header,
  HeaderLabel,
  Page,
  Table,
} from '@backstage/core-components';
import {
  alertApiRef,
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
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from '@material-ui/core';
import Group from '@material-ui/icons/Group';
import SettingsIcon from '@material-ui/icons/Settings';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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
}
export const AuditInitiation = () => {
  const { app_name } = useParams<{ app_name: string }>();

  const navigate = useNavigate();
  const [frequency, setFrequency] = useState<'quarterly' | 'yearly' | ''>('');
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [auditHistory, setAuditHistory] = useState<AuditHistoryItem[]>([]);
  const alertApi = useApi(alertApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  const fetchAuditHistory = async () => {
    try {
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const response = await fetchApi.fetch(`${baseUrl}/audits`);
      const result = await response.json();
      setAuditHistory(result || []);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching audit history', err);
      alertApi.post({
        message: 'Failed to load audit history.',
        severity: 'error',
      });
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
          message: `Error: ${auditResult.error || 'Failed to initiate audit.'}`,
          severity: 'error',
        });
        return;
      }

      alertApi.post({
        message: 'Audit initiated successfully.',
        severity: 'success',
      });

      // 🚨 Let user know rover data is now being fetched
      alertApi.post({
        message: 'Rover data is being pulled for the requested audit.',
        severity: 'info',
      });

      // ✅ Refresh audit history right after audit creation
      fetchAuditHistory();

      // Step 2: Generate rover report in the background
      const roverResponse = await fetchApi.fetch(`${baseUrl}/rover-report`, {
        method: 'POST',
        body: JSON.stringify({ appname: app_name, frequency, period }),
        headers: { 'Content-Type': 'application/json' },
      });

      const roverResult = await roverResponse.json();

      if (!roverResponse.ok) {
        alertApi.post({
          message: `Rover report error: ${
            roverResult.error || 'Unknown error'
          }`,
          severity: 'error',
        });
      } else {
        alertApi.post({
          message: 'Rover report generated successfully.',
          severity: 'success',
        });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error during audit initiation or report generation', err);
      alertApi.post({
        message: 'Failed to initiate audit or generate report.',
        severity: 'error',
      });
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
        title="Audit and Compliance"
        subtitle="Ensure Trust. Enforce Standards. Empower Teams."
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
        <Tooltip title="Configuration">
          <IconButton color="primary">
            <SettingsIcon onClick={() => navigate('/audit/configurations')} />
          </IconButton>
        </Tooltip>
      </Header>

      <Content>
        <Box padding={3}>
          <Typography variant="h4" gutterBottom>
            Audit for Application ID: <strong>{app_name}</strong>
          </Typography>
          <Box mb={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Audit Frequency</InputLabel>
                  <Select
                    value={frequency}
                    onChange={e =>
                      setFrequency(e.target.value as 'quarterly' | 'yearly')
                    }
                  >
                    <MenuItem value="quarterly">Quarterly</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {frequency === 'quarterly' && (
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Select Quarter</InputLabel>
                    <Select
                      value={selectedQuarter}
                      onChange={e =>
                        setSelectedQuarter(e.target.value as string)
                      }
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
                  <FormControl fullWidth>
                    <InputLabel>Select Year</InputLabel>
                    <Select
                      value={selectedYear}
                      onChange={e => setSelectedYear(Number(e.target.value))}
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
              >
                Initiate New Audit
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
                  { title: 'Frequency', field: 'frequency' },
                  { title: 'Period', field: 'period' },
                  {
                    title: 'Status',
                    render: rowData => {
                      const status = rowData.status?.toUpperCase() || '';
                      let chipStyle: React.CSSProperties = { fontWeight: 600 };

                      if (status === 'IN_PROGRESS') {
                        chipStyle = {
                          backgroundColor: '#FFA500',
                          fontWeight: 600,
                        };
                      } else if (status === 'COMPLETED') {
                        chipStyle = {
                          backgroundColor: '#d1f1bb',
                          fontWeight: 600,
                        };
                      }

                      return (
                        <Chip label={status} size="small" style={chipStyle} />
                      );
                    },
                  },
                  { title: 'Created At', field: 'created_at' },
                  {
                    title: 'View Details',
                    render: rowData => (
                      <Button
                        variant="outlined"
                        onClick={() => handleViewDetails(rowData)}
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

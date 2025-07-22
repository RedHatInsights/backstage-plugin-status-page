import {
  Breadcrumbs,
  Content,
  Header,
  HeaderLabel,
  Page,
} from '@backstage/core-components';
import Group from '@material-ui/icons/Group';
import {
  alertApiRef,
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import {
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
} from '@material-ui/core';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuditSummaryReport } from './AuditSummaryReport/AuditSummaryReport';
import { AccessReviewSummary } from './AuditSummaryReport/types';

export const AuditSummary: React.FC = () => {
  const { app_name, frequency, period } = useParams<{
    app_name: string;
    frequency: string;
    period: string;
  }>();
  const navigate = useNavigate();
  const alertApi = useApi(alertApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditDetails, setAuditDetails] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<AccessReviewSummary>({
    app_name: app_name || '',
    frequency: frequency || '',
    period: period || '',
    app_owner: '',
    app_delegate: '',
    reviewPeriod: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    },
    reviewedBy: '',
    reviewScope: '',
    statusOverview: {
      totalReviews: { before: 0, after: 0, change: 0, status: 'neutral' },
      rejections: { before: 0, after: 0, change: 0, status: 'neutral' },
    },
    actionTypes: [],
    documentation: [],
    outstandingItems: [],
    auditorNotes: [],
    progress: 'in_progress',
  });
  const [isAuditCompleted, setIsAuditCompleted] = useState(false);

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // First check if audit is completed
        const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
        const auditResponse = await fetchApi.fetch(
          `${baseUrl}/audits?app_name=${encodeURIComponent(
            app_name || '',
          )}&frequency=${encodeURIComponent(
            frequency || '',
          )}&period=${encodeURIComponent(period || '')}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          },
        );

        if (!auditResponse.ok) {
          throw new Error('Failed to fetch audit status');
        }

        const audits = await auditResponse.json();
        const audit = audits.find(
          (a: any) =>
            a.app_name === app_name &&
            a.frequency === frequency &&
            a.period === period,
        );

        if (!audit) {
          throw new Error('Audit not found');
        }

        // Set audit status and details first
        const isCompleted = audit.status === 'completed';
        setIsAuditCompleted(isCompleted);
        setAuditDetails(audit);
        setSummaryData(prev => ({
          ...prev,
          app_owner: audit.app_owner || '',
          app_delegate: audit.app_delegate || '',
          jira_key: audit.jira_key || '',
          progress: audit.status,
        }));

        // Only proceed with sync if audit is not completed
        if (!isCompleted) {
          // Show loading message
          alertApi.post({
            message: 'Syncing fresh data for summary generation...',
            severity: 'info',
            display: 'transient',
          });
          setIsSyncing(true);

          // Call the sync-fresh-data API
          const syncResponse = await fetchApi.fetch(
            `${baseUrl}/sync-fresh-data`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                appname: app_name,
                frequency,
                period,
              }),
            },
          );

          if (!syncResponse.ok) {
            throw new Error('Failed to sync fresh data');
          }

          const syncResult = await syncResponse.json();

          // Show success message
          alertApi.post({
            message: `Fresh data sync completed. ${syncResult.statistics.total_records} records processed.`,
            severity: 'success',
          });
        } else {
          // Show message that audit is completed and in read-only mode
          alertApi.post({
            message:
              'This audit is completed and in read-only mode. Using existing data for summary.',
            severity: 'info',
          });
        }

        // Always fetch statistics after sync or if already completed
        const statsResponse = await fetchApi.fetch(
          `${baseUrl}/audits/${app_name}/${frequency}/${period}/statistics`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          },
        );
        if (!statsResponse.ok) {
          throw new Error('Failed to fetch statistics');
        }
        const statsData = await statsResponse.json();
        setSummaryData(prev => ({
          ...prev,
          statistics: statsData.statistics,
        }));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch data';
        setError(errorMessage);
        alertApi.post({
          message: `Failed to fetch data: ${errorMessage}`,
          severity: 'error',
        });
        // eslint-disable-next-line no-console
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
        setIsSyncing(false);
      }
    };

    if (app_name && frequency && period) {
      fetchData();
    }
  }, [app_name, frequency, period, discoveryApi, fetchApi, alertApi]);

  const handleBack = async () => {
    navigate(
      `/audit-access-manager/${app_name}/${frequency}/${period}/details`,
    );
  };

  const handleAuditCompleted = () => {
    setSummaryData(prev => ({
      ...prev,
      progress: 'completed',
    }));
    setIsAuditCompleted(true);
  };

  return (
    <Page themeId="tool">
      <Header
        title="Audit Access Manager"
        subtitle={
          <Box>
            <Typography variant="subtitle1" style={{ marginBottom: '8px' }}>
              Ensure Trust. Enforce Standards. Empower Teams.
            </Typography>
            <Breadcrumbs aria-label="breadcrumb">
              <Link to="/audit-access-manager">Audit Access Manager</Link>
              <Link to={`/audit-access-manager/${app_name}`}>
                Audit Initiation
              </Link>
              <Link
                to={`/audit-access-manager/${app_name}/${frequency}/${period}/details`}
              >
                Audit Details
              </Link>
              <Typography color="textPrimary">Audit Summary</Typography>
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
        <Tooltip title="Configuration">
          <IconButton color="primary" />
        </Tooltip>
      </Header>

      <Content>
        {isSyncing && (
          <Box display="flex" justifyContent="center" alignItems="center" p={2}>
            <CircularProgress />
            <Box ml={2}>
              <Typography>Syncing fresh data...</Typography>
            </Box>
          </Box>
        )}
        <AuditSummaryReport
          data={summaryData}
          isLoading={isLoading}
          error={error || undefined}
          onGenerateSummary={handleBack}
          jira_key={auditDetails?.jira_key || ''}
          isAuditCompleted={isAuditCompleted}
          isSyncing={isSyncing}
          onAuditCompleted={handleAuditCompleted}
        />
      </Content>
    </Page>
  );
};

export default AuditSummary;

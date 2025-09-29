import {
  Content,
  Header,
  HeaderLabel,
  Page,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import {
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { Box, Typography } from '@material-ui/core';
import { useCallback, useEffect, useState } from 'react';
import { AuditActivityStream } from '../AuditCompliancePage/audit-components/AuditDetailsSection/AuditActivityStream/AuditActivityStream';
import {
  BulkActionsBar,
  OngoingAuditsSection,
  SummaryCardsNew,
  TwoStepAuditDialog,
} from './components';

interface Application {
  id: string;
  app_name: string;
  app_owner: string;
  app_owner_email?: string;
  app_delegate?: string;
  cmdb_id: string;
}

interface ComplianceSummary {
  totalApplications: number;
  compliant: number;
  nonCompliant: number;
  inProgress: number;
  pending: number;
}

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

export const ComplianceManagerPageNew = () => {
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  // Application selection state
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<string[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Audit configuration state
  const [frequency, setFrequency] = useState<'quarterly' | 'yearly' | ''>('');
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Data loading state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  // Audit history and summary state
  const [complianceSummary, setComplianceSummary] = useState<ComplianceSummary>(
    {
      totalApplications: 0,
      compliant: 0,
      nonCompliant: 0,
      inProgress: 0,
      pending: 0,
    },
  );

  // Dialog state
  const [initiateDialogOpen, setInitiateDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Current user state

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const response = await fetchApi.fetch(`${baseUrl}/applications`);

      if (!response.ok) {
        throw new Error(`Failed to fetch applications: ${response.statusText}`);
      }

      const data = await response.json();
      // Ensure each application has a valid ID
      const applicationsWithIds = data.map((app: any, index: number) => ({
        ...app,
        id: app.id?.toString() || index.toString(),
      }));
      setApplications(applicationsWithIds);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to fetch applications'),
      );
    } finally {
      setLoading(false);
    }
  }, [discoveryApi, fetchApi]);

  const fetchComplianceSummary = useCallback(async () => {
    try {
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const response = await fetchApi.fetch(`${baseUrl}/compliance/summary`);

      if (response.ok) {
        const data = await response.json();
        setComplianceSummary(data);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch compliance summary:', err);
    }
  }, [discoveryApi, fetchApi]);

  // Fetch applications on component mount
  useEffect(() => {
    fetchApplications();
    fetchComplianceSummary();
  }, [fetchApplications, fetchComplianceSummary]);

  if (loading) {
    return (
      <Page themeId="tool">
        <Header title="Audit Compliance Manager" />
        <Content>
          <Progress />
        </Content>
      </Page>
    );
  }

  if (error) {
    return (
      <Page themeId="tool">
        <Header title="AuditCompliance Manager" />
        <Content>
          <ResponseErrorPanel error={error} />
        </Content>
      </Page>
    );
  }

  return (
    <Page themeId="tool">
      <Header
        title="Audit Compliance Manager"
        subtitle={
          <Box>
            <Typography variant="subtitle1" style={{ marginBottom: '8px' }}>
              Clean & Minimal Audit Management Dashboard
            </Typography>
          </Box>
        }
      >
        <HeaderLabel label="Owner" value="Compliance Team" />
        <HeaderLabel label="Lifecycle" value="Alpha" />
      </Header>

      <Content>
        <Box padding={4}>
          {/* Top Summary Cards - Large and Centered */}
          <Box mb={6}>
            <SummaryCardsNew summary={complianceSummary} />
          </Box>

          {/* Bulk Actions Bar */}
          <Box mb={4}>
            <BulkActionsBar
              onInitiateAudit={() => setInitiateDialogOpen(true)}
            />
          </Box>

          {/* Audits Section */}
          <Box mb={4}>
            <OngoingAuditsSection
              applications={applications}
              refreshTrigger={refreshTrigger}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
          </Box>

          {/* Global Activity Stream */}
          <Box>
            <AuditActivityStream global />
          </Box>
        </Box>

        {/* Two-Step Audit Dialog */}
        <TwoStepAuditDialog
          open={initiateDialogOpen}
          onClose={() => setInitiateDialogOpen(false)}
          applications={applications}
          selectedApplications={selectedApplications}
          frequency={frequency}
          selectedQuarter={selectedQuarter}
          selectedYear={selectedYear}
          onFrequencyChange={setFrequency}
          onQuarterChange={setSelectedQuarter}
          onYearChange={setSelectedYear}
          onApplicationsChange={setSelectedApplications}
          initiating={false}
          getQuarterOptions={getQuarterOptions}
          getYearOptions={getYearOptions}
          onRefresh={() => {
            fetchApplications();
            fetchComplianceSummary();
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      </Content>
    </Page>
  );
};

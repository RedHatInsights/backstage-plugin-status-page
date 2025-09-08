import React, { useState, useEffect, useCallback } from 'react';
import {
  Breadcrumbs,
  Content,
  Header,
  HeaderLabel,
  Page,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import { Box, Typography } from '@material-ui/core';
import { useApi } from '@backstage/core-plugin-api';
import {
  discoveryApiRef,
  fetchApiRef,
  alertApiRef,
} from '@backstage/core-plugin-api';
import {
  SummaryCardsNew,
  BulkActionsBar,
  OngoingAuditsSection,
  CollapsibleActivityStream,
  InitiateAuditDialog,
} from './components';
import { AuditEvent } from '../AuditCompliancePage/audit-components/AuditDetailsSection/AuditActivityStream/types';

interface Application {
  id: string;
  app_name: string;
  app_owner: string;
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
  const alertApi = useApi(alertApiRef);

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
  const [initiatingAudits, setInitiatingAudits] = useState(false);

  // Audit history and summary state
  const [auditHistory, setAuditHistory] = useState<AuditEvent[]>([]);
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

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const response = await fetchApi.fetch(
        `${baseUrl}/compliance/applications`,
      );

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

  const fetchAuditHistory = useCallback(async () => {
    try {
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      // Use existing activity stream API without app_name to get all events
      const response = await fetchApi.fetch(
        `${baseUrl}/activity-stream?limit=20`,
      );

      if (response.ok) {
        const data = await response.json();
        setAuditHistory(data);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch activity stream:', err);
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
    fetchAuditHistory();
    fetchComplianceSummary();
  }, [fetchApplications, fetchAuditHistory, fetchComplianceSummary]);

  const handleApplicationSelection = (applicationId: string) => {
    setSelectedApplications(prev => {
      if (prev.includes(applicationId)) {
        return prev.filter(id => id !== applicationId);
      }
      return [...prev, applicationId];
    });
  };

  const handleSelectAll = () => {
    if (selectedApplications.length === applications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(applications.map(app => app.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedApplications([]);
  };

  const handleInitiateBulkAudits = async () => {
    if (selectedApplications.length === 0) {
      alertApi.post({
        message: 'Please select at least one application to initiate audits',
        severity: 'warning',
      });
      return;
    }

    if (
      !frequency ||
      (frequency === 'quarterly' && !selectedQuarter) ||
      !selectedYear
    ) {
      alertApi.post({
        message: 'Please complete all audit configuration fields',
        severity: 'warning',
      });
      return;
    }

    try {
      setInitiatingAudits(true);
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');

      const period =
        frequency === 'quarterly'
          ? `${selectedQuarter}-${selectedYear}`
          : selectedYear.toString();

      const auditRequests = selectedApplications.map(applicationId => {
        const application = applications.find(app => app.id === applicationId);
        return {
          application_id: applicationId,
          app_name: application?.app_name || '',
          frequency,
          period,
          initiated_by: 'compliance-manager',
        };
      });

      const response = await fetchApi.fetch(
        `${baseUrl}/compliance/bulk-initiate-audits`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ audits: auditRequests }),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to initiate audits: ${response.statusText}`);
      }

      alertApi.post({
        message: `Successfully initiated ${selectedApplications.length} audit(s)`,
        severity: 'success',
      });

      // Clear selection and refresh data
      setSelectedApplications([]);
      setFrequency('');
      setSelectedQuarter('');
      setInitiateDialogOpen(false);
      fetchAuditHistory();
      fetchApplications(); // Refresh applications to show new audits
      setRefreshTrigger(prev => prev + 1); // Trigger table refresh
    } catch (err) {
      alertApi.post({
        message:
          err instanceof Error ? err.message : 'Failed to initiate audits',
        severity: 'error',
      });
    } finally {
      setInitiatingAudits(false);
    }
  };

  const getStatusChipStyle = (status: string) => {
    const statusUpper = status?.toUpperCase() || '';

    if (statusUpper === 'COMPLETED') {
      return {
        backgroundColor: '#E8F5E8',
        color: '#1B5E20',
        borderColor: '#4CAF50',
        fontWeight: 600,
      };
    }
    if (
      statusUpper === 'IN_PROGRESS' ||
      statusUpper === 'ACCESS_REVIEW_COMPLETE'
    ) {
      return {
        backgroundColor: '#FFF3E0',
        color: '#E65100',
        borderColor: '#FF9800',
        fontWeight: 600,
      };
    }
    if (statusUpper === 'AUDIT_STARTED') {
      return {
        backgroundColor: '#E3F2FD',
        color: '#1565C0',
        borderColor: '#42A5F5',
        fontWeight: 600,
      };
    }
    return {
      backgroundColor: '#F5F5F5',
      color: '#666666',
      borderColor: '#CCCCCC',
      fontWeight: 600,
    };
  };

  if (loading) {
    return (
      <Page themeId="tool">
        <Header title="Compliance Manager" />
        <Content>
          <Progress />
        </Content>
      </Page>
    );
  }

  if (error) {
    return (
      <Page themeId="tool">
        <Header title="Compliance Manager" />
        <Content>
          <ResponseErrorPanel error={error} />
        </Content>
      </Page>
    );
  }

  return (
    <Page themeId="tool">
      <Header
        title="Compliance Manager"
        subtitle={
          <Box>
            <Typography variant="subtitle1" style={{ marginBottom: '8px' }}>
              Clean & Minimal Audit Management Dashboard
            </Typography>
            <Breadcrumbs aria-label="breadcrumb">
              <Typography color="textPrimary">Compliance Manager</Typography>
            </Breadcrumbs>
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
              onSendEmail={() => {
                // TODO: Implement email functionality
                alertApi.post({
                  message: 'Email functionality coming soon',
                  severity: 'info',
                });
              }}
            />
          </Box>

          {/* Ongoing Audits Section */}
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

          {/* Collapsible Activity Stream */}
          <Box>
            <CollapsibleActivityStream
              auditHistory={auditHistory}
              onRefresh={fetchAuditHistory}
              getStatusChipStyle={getStatusChipStyle}
            />
          </Box>
        </Box>

        {/* Initiate Audit Dialog */}
        <InitiateAuditDialog
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
          onInitiate={handleInitiateBulkAudits}
          initiating={initiatingAudits}
          getQuarterOptions={getQuarterOptions}
          getYearOptions={getYearOptions}
        />
      </Content>
    </Page>
  );
};

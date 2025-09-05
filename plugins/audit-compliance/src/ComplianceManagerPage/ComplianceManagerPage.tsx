import React, { useState, useEffect } from 'react';
import {
  Breadcrumbs,
  Content,
  Header,
  HeaderLabel,
  Page,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import { Box, Button, Grid, Typography } from '@material-ui/core';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import { useApi } from '@backstage/core-plugin-api';
import {
  discoveryApiRef,
  fetchApiRef,
  alertApiRef,
} from '@backstage/core-plugin-api';
import { useStyles } from './styles';
import {
  ComplianceSummaryCards,
  ApplicationsTable,
  ActivityStream,
  InitiateAuditDialog,
} from './components';
import { AuditEvent } from '../AuditCompliancePage/audit-components/AuditDetailsSection/AuditActivityStream/types';

interface Application {
  id: string;
  app_name: string;
  app_owner: string;
  cmdb_id: string;
}

// Using AuditEvent from existing component

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

export const ComplianceManagerPage = () => {
  const classes = useStyles();
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const alertApi = useApi(alertApiRef);

  // Application selection state
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<
    Application[]
  >([]);
  const [selectedApplications, setSelectedApplications] = useState<string[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = useState('');

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

  const fetchApplications = async () => {
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
      setFilteredApplications(applicationsWithIds);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to fetch applications'),
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditHistory = async () => {
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
  };

  const fetchComplianceSummary = async () => {
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
  };

  // Fetch applications on component mount
  useEffect(() => {
    fetchApplications();
    fetchAuditHistory();
    fetchComplianceSummary();
  }, []);

  // Filter applications based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredApplications(applications);
    } else {
      const filtered = applications.filter(
        app =>
          app.app_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.app_owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.cmdb_id.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredApplications(filtered);
    }
  }, [searchTerm, applications]);

  const handleApplicationSelection = (applicationId: string) => {
    setSelectedApplications(prev => {
      if (prev.includes(applicationId)) {
        return prev.filter(id => id !== applicationId);
      }
      return [...prev, applicationId];
    });
  };

  const handleSelectAll = () => {
    if (selectedApplications.length === filteredApplications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(filteredApplications.map(app => app.id));
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
    } else if (
      statusUpper === 'IN_PROGRESS' ||
      statusUpper === 'ACCESS_REVIEW_COMPLETE'
    ) {
      return {
        backgroundColor: '#FFF3E0',
        color: '#E65100',
        borderColor: '#FF9800',
        fontWeight: 600,
      };
    } else if (statusUpper === 'AUDIT_STARTED') {
      return {
        backgroundColor: '#E3F2FD',
        color: '#1565C0',
        borderColor: '#42A5F5',
        fontWeight: 600,
      };
    } else {
      return {
        backgroundColor: '#F5F5F5',
        color: '#666666',
        borderColor: '#CCCCCC',
        fontWeight: 600,
      };
    }
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
              Bulk Audit Management & Compliance Overview
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
        <Box padding={3}>
          {/* Compliance Dashboard Overview - Numbers at Top */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography variant="h4">Compliance Overview</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrowIcon />}
              onClick={() => setInitiateDialogOpen(true)}
              size="large"
              style={{
                borderRadius: '24px',
                padding: '12px 24px',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              }}
            >
              Initiate Audit →
            </Button>
          </Box>

          {/* Compliance Summary Cards */}
          <ComplianceSummaryCards summary={complianceSummary} />

          {/* Two Sections: Table and Activity Stream */}
          <Grid container spacing={3} style={{ minHeight: '700px' }}>
            {/* Applications Table Section */}
            <Grid item xs={12} md={6} style={{ height: '700px' }}>
              <ApplicationsTable
                applications={filteredApplications}
                selectedApplications={selectedApplications}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onSelectionChange={setSelectedApplications}
                onRefresh={fetchApplications}
                refreshTrigger={refreshTrigger}
              />
            </Grid>

            {/* Activity Stream Section */}
            <Grid item xs={12} md={6} style={{ height: '700px' }}>
              <ActivityStream
                auditHistory={auditHistory}
                onRefresh={fetchAuditHistory}
                getStatusChipStyle={getStatusChipStyle}
              />
            </Grid>
          </Grid>
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

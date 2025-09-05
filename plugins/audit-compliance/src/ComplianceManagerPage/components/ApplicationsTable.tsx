import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  TextField,
  Typography,
  InputAdornment,
} from '@material-ui/core';
import { Table, Link } from '@backstage/core-components';
import {
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import SearchIcon from '@material-ui/icons/Search';
import ClearIcon from '@material-ui/icons/Clear';
import RefreshIcon from '@material-ui/icons/Refresh';

interface Application {
  id: string;
  app_name: string;
  app_owner: string;
  cmdb_id: string;
}

interface AuditInfo {
  app_name: string;
  frequency: string;
  period: string;
  status: string;
  progress?: string;
  jira_key?: string;
  created_at: string;
}

interface ApplicationsTableProps {
  applications: Application[];
  selectedApplications: string[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelectionChange: (selectedIds: string[]) => void;
  onRefresh: () => void;
  refreshTrigger?: number; // Add this to trigger refresh from parent
}

export const ApplicationsTable: React.FC<ApplicationsTableProps> = ({
  applications,
  selectedApplications,
  searchTerm,
  onSearchChange,
  onSelectionChange,
  onRefresh,
  refreshTrigger,
}) => {
  const [auditData, setAuditData] = useState<Record<string, AuditInfo[]>>({});
  const [loading, setLoading] = useState(false);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  const fetchAuditData = useCallback(async () => {
    try {
      setLoading(true);
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const response = await fetchApi.fetch(`${baseUrl}/audits`);

      if (!response.ok) {
        throw new Error('Failed to fetch audit data');
      }

      const audits = await response.json();
      // eslint-disable-next-line no-console
      console.log('Fetched audits from API:', audits);

      // Group audits by application name
      const groupedAudits: Record<string, AuditInfo[]> = {};
      audits.forEach((audit: any) => {
        if (!groupedAudits[audit.app_name]) {
          groupedAudits[audit.app_name] = [];
        }
        groupedAudits[audit.app_name].push({
          app_name: audit.app_name,
          frequency: audit.frequency,
          period: audit.period,
          status: audit.progress || audit.status || 'UNKNOWN', // Use progress as status
          progress: audit.progress || 'NOT_STARTED',
          jira_key: audit.jira_key || audit.jira_ticket || '', // Handle different field names
          created_at: audit.created_at,
        });
      });

      setAuditData(groupedAudits);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching audit data:', error);
    } finally {
      setLoading(false);
    }
  }, [discoveryApi, fetchApi]);

  useEffect(() => {
    fetchAuditData();
  }, [fetchAuditData]);

  // Refresh audit data when applications change (new audits added)
  useEffect(() => {
    fetchAuditData();
  }, [applications, fetchAuditData]);

  // Refresh audit data when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      fetchAuditData();
    }
  }, [refreshTrigger, fetchAuditData]);

  const getAuditInfo = (appName: string): AuditInfo[] => {
    return auditData[appName] || [];
  };

  // Create flattened data structure where each audit gets its own row
  const getFlattenedData = () => {
    const flattenedData: any[] = [];

    applications.forEach(app => {
      const audits = getAuditInfo(app.app_name);
      if (audits.length === 0) {
        // If no audits, still show the application
        flattenedData.push({
          ...app,
          frequency: '',
          period: '',
          status: '',
          progress: '',
          jira_key: '',
        });
      } else {
        // Create a row for each audit
        audits.forEach(audit => {
          flattenedData.push({
            ...app,
            frequency: audit.frequency,
            period: audit.period,
            status: audit.status,
            progress: audit.progress,
            jira_key: audit.jira_key,
          });
        });
      }
    });

    return flattenedData;
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
    }
    return {
      backgroundColor: '#F5F5F5',
      color: '#666666',
      borderColor: '#CCCCCC',
      fontWeight: 600,
    };
  };

  const getProgressChipStyle = (progress?: string) => {
    const progressUpper = progress?.toUpperCase() || '';

    if (
      progressUpper === 'COMPLETED' ||
      progressUpper === 'FINAL_SIGN_OFF_DONE'
    ) {
      return {
        backgroundColor: '#E8F5E8',
        color: '#1B5E20',
        borderColor: '#4CAF50',
        fontWeight: 600,
      };
    } else if (progressUpper === 'SUMMARY_GENERATED') {
      return {
        backgroundColor: '#E1F5FE',
        color: '#0277BD',
        borderColor: '#29B6F6',
        fontWeight: 600,
      };
    } else if (progressUpper === 'DETAILS_UNDER_REVIEW') {
      return {
        backgroundColor: '#FFF8E1',
        color: '#F57F17',
        borderColor: '#FFC107',
        fontWeight: 600,
      };
    } else if (progressUpper === 'AUDIT_STARTED') {
      return {
        backgroundColor: '#F3E5F5',
        color: '#7B1FA2',
        borderColor: '#AB47BC',
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

  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6">Applications & Audit Status</Typography>
          <TextField
            size="small"
            variant="outlined"
            placeholder="Search applications..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => onSearchChange('')}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <Table
            options={{
              selection: false,
              search: false,
              filtering: false,
              pageSize: 5,
              paginationType: 'stepped',
              showFirstLastPageButtons: true,
              showSelectAllCheckbox: false,
              emptyRowsWhenPaging: false,
            }}
            data={getFlattenedData()}
            columns={[
              {
                title: 'Application Name',
                field: 'app_name',
                render: (row: any) => (
                  <Link to={`/audit-access-manager/${row.app_name}`}>
                    <Typography variant="body2" style={{ fontWeight: 500 }}>
                      {row.app_name}
                    </Typography>
                  </Link>
                ),
              },

              {
                title: 'Frequency',
                field: 'frequency',
                render: (row: any) => (
                  <Typography variant="body2" style={{ fontWeight: 500 }}>
                    {row.frequency || '-'}
                  </Typography>
                ),
              },
              {
                title: 'Period',
                field: 'period',
                render: (row: any) => (
                  <Typography variant="body2" style={{ fontWeight: 500 }}>
                    {row.period || '-'}
                  </Typography>
                ),
              },

              {
                title: 'Progress',
                field: 'progress',
                render: (row: any) =>
                  row.progress ? (
                    <Chip
                      size="small"
                      label={row.progress?.replace(/_/g, ' ') || 'NOT STARTED'}
                      style={getProgressChipStyle(row.progress)}
                    />
                  ) : (
                    <Typography variant="caption" color="textSecondary">
                      -
                    </Typography>
                  ),
              },
              {
                title: 'Jira Ticket',
                field: 'jira_key',
                render: (row: any) =>
                  row.jira_key ? (
                    <Chip
                      size="small"
                      label={row.jira_key}
                      variant="outlined"
                      style={{
                        backgroundColor: '#E3F2FD',
                        color: '#1565C0',
                        borderColor: '#42A5F5',
                        fontWeight: 500,
                      }}
                    />
                  ) : (
                    <Typography variant="caption" color="textSecondary">
                      No ticket
                    </Typography>
                  ),
              },
              {
                title: 'Owner',
                field: 'app_owner',
              },
              {
                title: 'CMDB ID',
                field: 'cmdb_id',
                render: (row: any) => (
                  <Chip size="small" label={row.cmdb_id} variant="outlined" />
                ),
              },
            ]}
            style={{ height: '100%' }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

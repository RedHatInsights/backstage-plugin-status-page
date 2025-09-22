import { useCallback, useEffect, useState } from 'react';
import { Link, Table } from '@backstage/core-components';
import {
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@material-ui/core';
import ClearIcon from '@material-ui/icons/Clear';
import RefreshIcon from '@material-ui/icons/Refresh';
import SearchIcon from '@material-ui/icons/Search';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { useStyles } from './styles';
import { AuditInfo, SimplifiedApplicationsTableProps } from './types';

export const SimplifiedApplicationsTable = ({
  applications,
  searchTerm,
  onSearchChange,
  onRefresh,
  refreshTrigger,
}: SimplifiedApplicationsTableProps) => {
  const classes = useStyles();
  const [auditData, setAuditData] = useState<Record<string, AuditInfo[]>>({});
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
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
          status: audit.progress || audit.status || 'UNKNOWN',
          progress: audit.progress || 'NOT_STARTED',
          jira_key: audit.jira_key || audit.jira_ticket || '',
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

  useEffect(() => {
    if (refreshTrigger) {
      fetchAuditData();
    }
  }, [refreshTrigger, fetchAuditData]);

  const getAuditInfo = (appName: string): AuditInfo[] => {
    return auditData[appName] || [];
  };

  const getLatestAuditStatus = (appName: string): string => {
    const audits = getAuditInfo(appName);
    if (audits.length === 0) return 'NO_AUDIT';

    // Get the most recent audit
    const latestAudit = audits.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];

    return latestAudit.status || 'UNKNOWN';
  };

  const getLatestAuditProgress = (appName: string): string => {
    const audits = getAuditInfo(appName);
    if (audits.length === 0) return 'NOT_STARTED';

    // Get the most recent audit
    const latestAudit = audits.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];

    return latestAudit.progress || 'NOT_STARTED';
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
    } else if (statusUpper === 'NO_AUDIT') {
      return {
        backgroundColor: '#F5F5F5',
        color: '#666666',
        borderColor: '#CCCCCC',
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

  // Filter applications based on status filter
  const getFilteredApplications = () => {
    if (statusFilter === 'all') {
      return applications;
    }

    return applications.filter(app => {
      const status = getLatestAuditStatus(app.app_name);
      return status.toUpperCase() === statusFilter.toUpperCase();
    });
  };

  const filteredApplications = getFilteredApplications();

  return (
    <Card className={classes.card}>
      <CardContent className={classes.cardContent}>
        <Typography className={classes.title}>
          Applications {loading ? '...' : `(${filteredApplications.length})`}
        </Typography>

        <Box className={classes.filtersContainer}>
          <TextField
            size="small"
            variant="outlined"
            placeholder="Search applications..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className={classes.searchField}
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

          <FormControl size="small" className={classes.statusFilter}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as string)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="audit_started">Audit Started</MenuItem>
              <MenuItem value="no_audit">No Audit</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            className={classes.refreshButton}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>

        <Table
          options={{
            selection: false,
            search: false,
            filtering: false,
            pageSize: 10,
            paginationType: 'stepped',
            showFirstLastPageButtons: true,
            showSelectAllCheckbox: false,
            emptyRowsWhenPaging: false,
          }}
          data={loading ? [] : filteredApplications}
          isLoading={loading}
          columns={[
            {
              title: 'Application Name',
              field: 'app_name',
              render: (row: any) => (
                <Typography variant="body2" style={{ fontWeight: 500 }}>
                  {row.app_name}
                </Typography>
              ),
            },
            {
              title: 'Status',
              field: 'status',
              render: (row: any) => {
                const status = getLatestAuditStatus(row.app_name);
                return (
                  <Chip
                    size="small"
                    label={
                      status === 'NO_AUDIT'
                        ? 'No Audit'
                        : status?.replace(/_/g, ' ') || 'Unknown'
                    }
                    style={getStatusChipStyle(status)}
                    className={classes.statusChip}
                  />
                );
              },
            },
            {
              title: 'Progress',
              field: 'progress',
              render: (row: any) => {
                const progress = getLatestAuditProgress(row.app_name);
                return progress !== 'NOT_STARTED' ? (
                  <Chip
                    size="small"
                    label={progress?.replace(/_/g, ' ') || 'Not Started'}
                    style={getProgressChipStyle(progress)}
                    className={classes.statusChip}
                  />
                ) : (
                  <Typography variant="caption" color="textSecondary">
                    -
                  </Typography>
                );
              },
            },
            {
              title: 'Actions',
              field: 'actions',
              render: (row: any) => (
                <Link to={`/audit-access-manager/${row.app_name}`}>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<VisibilityIcon />}
                    className={classes.viewButton}
                    size="small"
                  >
                    View
                  </Button>
                </Link>
              ),
            },
          ]}
        />
      </CardContent>
    </Card>
  );
};

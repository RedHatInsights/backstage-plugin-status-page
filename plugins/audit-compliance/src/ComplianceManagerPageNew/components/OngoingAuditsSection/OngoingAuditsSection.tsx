import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse,
} from '@material-ui/core';
import { Table as BackstageTable } from '@backstage/core-components';
import {
  discoveryApiRef,
  fetchApiRef,
  configApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import SearchIcon from '@material-ui/icons/Search';
import ClearIcon from '@material-ui/icons/Clear';
import { useStyles } from './styles';
import { AuditInfo, OngoingAuditsSectionProps, AppAuditSummary } from './types';
import {
  AuditProgressStepper,
  AuditStep,
} from '../../../AuditCompliancePage/audit-components/AuditProgressStepper/AuditProgressStepper';

export const OngoingAuditsSection = ({
  applications,
  refreshTrigger,
  searchTerm = '',
  onSearchChange,
  statusFilter = 'all',
  onStatusFilterChange,
}: OngoingAuditsSectionProps) => {
  const classes = useStyles();
  const [auditData, setAuditData] = useState<Record<string, AuditInfo[]>>({});
  const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set());
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [localStatusFilter, setLocalStatusFilter] = useState(statusFilter);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const configApi = useApi(configApiRef);

  // Color palette definitions
  const chipColors = {
    // Blue theme colors
    lightBlue: '#E3F2FD',
    darkBlue: '#1565C0',
    mediumBlue: '#42A5F5',

    // Amber/warning theme colors
    lightAmber: '#FFF3E0',
    darkAmber: '#E65100',
    mediumAmber: '#FF9800',

    // Green/success theme colors
    lightGreen: '#E8F5E8',
    darkGreen: '#1B5E20',
    mediumGreen: '#4CAF50',

    // Gray/neutral theme colors
    lightGray: '#F5F5F5',
    mediumGray: '#616161',
    mediumGrayBorder: '#9E9E9E',

    // Common colors
    white: '#FFFFFF',
  };

  // Status chip color definitions using named color variables
  const statusColors = {
    AUDIT_STARTED: {
      backgroundColor: chipColors.lightBlue,
      color: chipColors.darkBlue,
      borderColor: chipColors.mediumBlue,
    },
    IN_PROGRESS: {
      backgroundColor: chipColors.lightAmber,
      color: chipColors.darkAmber,
      borderColor: chipColors.mediumAmber,
    },
    ACCESS_REVIEW_COMPLETE: {
      backgroundColor: chipColors.darkAmber,
      color: chipColors.white,
      borderColor: chipColors.darkAmber,
    },
    COMPLETED: {
      backgroundColor: chipColors.lightGreen,
      color: chipColors.darkGreen,
      borderColor: chipColors.mediumGreen,
    },
    DEFAULT: {
      backgroundColor: chipColors.lightGray,
      color: chipColors.mediumGray,
      borderColor: chipColors.mediumGrayBorder,
    },
  };

  const fetchAuditData = useCallback(async () => {
    try {
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
          status: audit.status || 'UNKNOWN',
          progress: audit.progress || 'audit_started',
          jira_key: audit.jira_key || audit.jira_ticket || '',
          created_at: audit.created_at,
        });
      });

      setAuditData(groupedAudits);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching audit data:', error);
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

  const mapProgressToAuditStep = (progress: string): AuditStep => {
    // Map progress values to AuditStep enum (from AuditProgressStepper)
    switch (progress) {
      case 'audit_started':
        return 'audit_started';
      case 'details_under_review':
        return 'details_under_review';
      case 'final_sign_off_done':
        return 'final_sign_off_done';
      case 'summary_generated':
        return 'summary_generated';
      case 'completed':
        return 'completed';
      default:
        return 'audit_started';
    }
  };

  const formatAppName = (appName: string): string => {
    return appName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Get audit summaries for all applications
  const toggleExpanded = (appName: string) => {
    setExpandedApps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appName)) {
        newSet.delete(appName);
      } else {
        newSet.add(appName);
      }
      return newSet;
    });
  };

  const getAppAuditSummaries = (): AppAuditSummary[] => {
    const summaries: AppAuditSummary[] = [];

    applications.forEach(app => {
      // Apply search filter
      const searchLower = localSearchTerm.toLowerCase();
      if (searchLower && !app.app_name.toLowerCase().includes(searchLower)) {
        return;
      }

      const audits = auditData[app.app_name] || [];

      // Apply status filter to ALL audits first
      let filteredAudits = audits;
      if (localStatusFilter !== 'all') {
        filteredAudits = audits.filter(audit => {
          const statusUpper = audit.status?.toUpperCase() || '';
          return statusUpper === localStatusFilter.toUpperCase();
        });
      }

      // Only include applications that have audits after filtering
      if (filteredAudits.length > 0) {
        // Count all audits for status summary
        const allAudits = audits;
        const inProgressCount = allAudits.filter(audit => {
          const statusUpper = audit.status?.toUpperCase() || '';
          return (
            statusUpper === 'IN_PROGRESS' ||
            statusUpper === 'AUDIT_STARTED' ||
            statusUpper === 'ACCESS_REVIEW_COMPLETE'
          );
        }).length;

        const completedCount = allAudits.filter(audit => {
          const statusUpper = audit.status?.toUpperCase() || '';
          return statusUpper === 'COMPLETED';
        }).length;

        const notStartedCount = allAudits.filter(audit => {
          const statusUpper = audit.status?.toUpperCase() || '';
          const progressLower = audit.progress?.toLowerCase() || '';
          return (
            statusUpper === 'NOT_STARTED' || progressLower === 'not_started'
          );
        }).length;

        const statusSummary = `${inProgressCount} in-progress, ${completedCount} completed, ${notStartedCount} not started`;

        summaries.push({
          app,
          audits: filteredAudits,
          totalAudits: filteredAudits.length,
          inProgressCount,
          completedCount,
          statusSummary,
        });
      }
    });

    return summaries;
  };

  const appSummaries = getAppAuditSummaries();

  const handleSearchChange = (term: string) => {
    setLocalSearchTerm(term);
    if (onSearchChange) {
      onSearchChange(term);
    }
  };

  const handleStatusFilterChange = (status: string) => {
    setLocalStatusFilter(status);
    if (onStatusFilterChange) {
      onStatusFilterChange(status);
    }
  };

  const handleClearFilters = () => {
    setLocalSearchTerm('');
    setLocalStatusFilter('all');
    if (onSearchChange) {
      onSearchChange('');
    }
    if (onStatusFilterChange) {
      onStatusFilterChange('all');
    }
  };

  return (
    <Box className={classes.section}>
      <Typography className={classes.title}>
        Applications with Audits ({appSummaries.length})
      </Typography>

      <Box className={classes.filtersContainer}>
        <TextField
          size="small"
          variant="outlined"
          placeholder="Search applications..."
          value={localSearchTerm}
          onChange={e => handleSearchChange(e.target.value)}
          className={classes.searchField}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: localSearchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => handleSearchChange('')}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" className={classes.statusFilter}>
          <InputLabel>Status</InputLabel>
          <Select
            value={localStatusFilter}
            onChange={e => handleStatusFilterChange(e.target.value as string)}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="AUDIT_STARTED">Audit Started</MenuItem>
            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
            <MenuItem value="ACCESS_REVIEW_COMPLETE">
              Access Review Complete
            </MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            <MenuItem value="NOT_STARTED">Not Started</MenuItem>
          </Select>
        </FormControl>

        {(localSearchTerm || localStatusFilter !== 'all') && (
          <Button
            variant="outlined"
            size="small"
            onClick={handleClearFilters}
            startIcon={<ClearIcon />}
            style={{ marginLeft: 8 }}
          >
            Clear Filters
          </Button>
        )}
      </Box>

      {appSummaries.length === 0 ? (
        <Box className={classes.emptyState}>
          <Typography variant="h6" color="textSecondary">
            No audits found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            No audits match the current filter criteria
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} className={classes.tableContainer}>
          <Table>
            <TableHead className={classes.tableHeader}>
              <TableRow>
                <TableCell className={classes.tableHeaderCell}>
                  App Name
                </TableCell>
                <TableCell className={classes.tableHeaderCell}>
                  Audits
                </TableCell>
                <TableCell className={classes.tableHeaderCell}>
                  Status Summary
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appSummaries.map(summary => {
                const isExpanded = expandedApps.has(summary.app.app_name);

                return (
                  <div key={summary.app.id}>
                    <TableRow
                      className={classes.tableRow}
                      onClick={() => toggleExpanded(summary.app.app_name)}
                      style={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Typography className={classes.appName}>
                            {formatAppName(summary.app.app_name)}
                          </Typography>
                          <Box ml={1}>
                            {isExpanded ? (
                              <ExpandLessIcon />
                            ) : (
                              <ExpandMoreIcon />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {summary.totalAudits}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {summary.statusSummary}
                        </Typography>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell colSpan={3} style={{ padding: 0 }}>
                        <Collapse in={isExpanded}>
                          <Box className={classes.collapsedContent}>
                            <BackstageTable
                              title={`${formatAppName(
                                summary.app.app_name,
                              )} - Audit Details`}
                              columns={[
                                {
                                  title: 'Jira Ticket',
                                  field: 'jira_key',
                                  render: (row: any) => {
                                    if (
                                      !row.jira_key ||
                                      row.jira_key.toUpperCase() === 'N/A'
                                    ) {
                                      return 'N/A';
                                    }
                                    const jiraUrl = configApi.getString(
                                      'auditCompliance.jiraUrl',
                                    );
                                    return (
                                      <a
                                        href={`${jiraUrl}/browse/${row.jira_key}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          color: '#1976d2',
                                          textDecoration: 'underline',
                                          cursor: 'pointer',
                                        }}
                                      >
                                        {row.jira_key}
                                      </a>
                                    );
                                  },
                                },
                                { title: 'Frequency', field: 'frequency' },
                                { title: 'Period', field: 'period' },
                                {
                                  title: 'Status',
                                  render: (row: any) => {
                                    const status =
                                      row.status?.toUpperCase() || '';

                                    // Get colors for the status, fallback to DEFAULT if not found
                                    const colors =
                                      statusColors[
                                        status as keyof typeof statusColors
                                      ] || statusColors.DEFAULT;

                                    const chipStyle: React.CSSProperties = {
                                      ...colors,
                                      fontWeight: 600,
                                    };

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
                                  render: (row: any) => (
                                    <AuditProgressStepper
                                      activeStep={mapProgressToAuditStep(
                                        row.progress || 'audit_started',
                                      )}
                                    />
                                  ),
                                },
                                { title: 'Created At', field: 'created_at' },
                                {
                                  title: 'Actions',
                                  render: (row: any) => (
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      onClick={() => {
                                        const url = `/audit-access-manager/${encodeURIComponent(
                                          row.app_name,
                                        )}`;
                                        window.open(url, '_blank');
                                      }}
                                    >
                                      View Details
                                    </Button>
                                  ),
                                },
                              ]}
                              data={summary.audits}
                              options={{
                                paging: false,
                                search: false,
                                showTitle: false,
                              }}
                            />
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </div>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

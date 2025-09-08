import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Link } from '@backstage/core-components';
import {
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import VisibilityIcon from '@material-ui/icons/Visibility';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import SearchIcon from '@material-ui/icons/Search';
import ClearIcon from '@material-ui/icons/Clear';

const useStyles = makeStyles(theme => ({
  section: {
    marginBottom: theme.spacing(4),
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: theme.spacing(3),
    color: '#333',
  },
  tableContainer: {
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
  },
  tableHeaderCell: {
    fontWeight: 600,
    fontSize: '16px',
    color: '#333',
  },
  tableRow: {
    '&:hover': {
      backgroundColor: '#f8f9fa',
    },
  },
  appName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
  },
  statusChip: {
    fontWeight: 600,
    marginRight: theme.spacing(1),
  },
  expandButton: {
    borderRadius: '6px',
    textTransform: 'none',
    fontWeight: 500,
  },
  expandIcon: {
    marginLeft: theme.spacing(1),
  },
  collapsedContent: {
    padding: theme.spacing(2),
    backgroundColor: '#f8f9fa',
  },
  auditCard: {
    marginBottom: theme.spacing(2),
    borderRadius: '8px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    '&:last-child': {
      marginBottom: 0,
    },
  },
  auditCardContent: {
    padding: theme.spacing(2),
  },
  progressContainer: {
    marginBottom: theme.spacing(1),
  },
  progressLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: theme.spacing(0.5),
  },
  progressBar: {
    height: '6px',
    borderRadius: '3px',
  },
  actionButton: {
    borderRadius: '6px',
    textTransform: 'none',
    fontWeight: 500,
    fontSize: '12px',
  },
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(4),
    color: '#666',
  },
  filtersContainer: {
    display: 'flex',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchField: {
    minWidth: '300px',
  },
  statusFilter: {
    minWidth: '150px',
  },
}));

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

interface OngoingAuditsSectionProps {
  applications: Application[];
  refreshTrigger?: number;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
}

interface AppAuditSummary {
  app: Application;
  audits: AuditInfo[];
  totalAudits: number;
  inProgressCount: number;
  completedCount: number;
  statusSummary: string;
}

export const OngoingAuditsSection: React.FC<OngoingAuditsSectionProps> = ({
  applications,
  refreshTrigger,
  searchTerm = '',
  onSearchChange,
  statusFilter = 'all',
  onStatusFilterChange,
}) => {
  const classes = useStyles();
  const [auditData, setAuditData] = useState<Record<string, AuditInfo[]>>({});
  const [loading, setLoading] = useState(false);
  const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set());
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [localStatusFilter, setLocalStatusFilter] = useState(statusFilter);
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

  const getProgressValue = (progress: string) => {
    const progressUpper = progress?.toUpperCase() || '';

    switch (progressUpper) {
      case 'NOT_STARTED':
        return 0;
      case 'AUDIT_STARTED':
        return 20;
      case 'DETAILS_UNDER_REVIEW':
        return 40;
      case 'SUMMARY_GENERATED':
        return 70;
      case 'FINAL_SIGN_OFF_DONE':
      case 'COMPLETED':
        return 100;
      default:
        return 0;
    }
  };

  const getProgressLabel = (progress: string) => {
    const progressUpper = progress?.toUpperCase() || '';

    switch (progressUpper) {
      case 'NOT_STARTED':
        return 'Not Started';
      case 'AUDIT_STARTED':
        return 'Audit Started';
      case 'DETAILS_UNDER_REVIEW':
        return 'Under Review';
      case 'SUMMARY_GENERATED':
        return 'Summary Generated';
      case 'FINAL_SIGN_OFF_DONE':
        return 'Final Sign-off Done';
      case 'COMPLETED':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  // Get ongoing audits (in progress, started, etc.)
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

      // Filter for ongoing audits only
      const ongoingAudits = audits.filter(audit => {
        const statusUpper = audit.status?.toUpperCase() || '';
        return (
          statusUpper === 'IN_PROGRESS' ||
          statusUpper === 'AUDIT_STARTED' ||
          statusUpper === 'ACCESS_REVIEW_COMPLETE' ||
          (audit.progress &&
            audit.progress !== 'COMPLETED' &&
            audit.progress !== 'NOT_STARTED')
        );
      });

      if (ongoingAudits.length > 0) {
        const inProgressCount = ongoingAudits.filter(audit => {
          const statusUpper = audit.status?.toUpperCase() || '';
          return (
            statusUpper === 'IN_PROGRESS' || statusUpper === 'AUDIT_STARTED'
          );
        }).length;

        const completedCount = ongoingAudits.filter(audit => {
          const statusUpper = audit.status?.toUpperCase() || '';
          return statusUpper === 'COMPLETED';
        }).length;

        // Apply status filter
        if (localStatusFilter !== 'all') {
          const hasMatchingStatus = ongoingAudits.some(audit => {
            const statusUpper = audit.status?.toUpperCase() || '';
            return statusUpper === localStatusFilter.toUpperCase();
          });

          if (!hasMatchingStatus) {
            return;
          }
        }

        const statusSummary = `${inProgressCount} in-progress${
          completedCount > 0 ? `, ${completedCount} completed` : ''
        }`;

        summaries.push({
          app,
          audits: ongoingAudits,
          totalAudits: ongoingAudits.length,
          inProgressCount,
          completedCount,
          statusSummary,
        });
      }
    });

    return summaries;
  };

  const appSummaries = getAppAuditSummaries();

  if (appSummaries.length === 0) {
    return (
      <Box className={classes.section}>
        <Typography className={classes.title}>Ongoing Audits</Typography>
        <Box className={classes.emptyState}>
          <Typography variant="h6" color="textSecondary">
            No ongoing audits
          </Typography>
          <Typography variant="body2" color="textSecondary">
            All audits are either completed or not yet started
          </Typography>
        </Box>
      </Box>
    );
  }

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

  return (
    <Box className={classes.section}>
      <Typography className={classes.title}>
        Applications with Ongoing Audits ({appSummaries.length})
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
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="audit_started">Audit Started</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper} className={classes.tableContainer}>
        <Table>
          <TableHead className={classes.tableHeader}>
            <TableRow>
              <TableCell className={classes.tableHeaderCell}>
                App Name
              </TableCell>
              <TableCell className={classes.tableHeaderCell}>
                Ongoing Audits
              </TableCell>
              <TableCell className={classes.tableHeaderCell}>
                Status Summary
              </TableCell>
              <TableCell className={classes.tableHeaderCell}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appSummaries.map(summary => {
              const isExpanded = expandedApps.has(summary.app.app_name);

              return (
                <React.Fragment key={summary.app.id}>
                  <TableRow className={classes.tableRow}>
                    <TableCell>
                      <Typography className={classes.appName}>
                        {summary.app.app_name}
                      </Typography>
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
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => toggleExpanded(summary.app.app_name)}
                        className={classes.expandButton}
                        endIcon={
                          isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />
                        }
                      >
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </Button>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell colSpan={4} style={{ padding: 0 }}>
                      <Collapse in={isExpanded}>
                        <Box className={classes.collapsedContent}>
                          {summary.audits.map((audit, index) => (
                            <Card
                              key={`${summary.app.id}-${audit.period}-${index}`}
                              className={classes.auditCard}
                            >
                              <CardContent className={classes.auditCardContent}>
                                <Box
                                  display="flex"
                                  justifyContent="space-between"
                                  alignItems="flex-start"
                                >
                                  <Box flex={1}>
                                    <Box
                                      display="flex"
                                      alignItems="center"
                                      style={{ marginBottom: 8 }}
                                    >
                                      <Chip
                                        size="small"
                                        label={
                                          audit.status?.replace(/_/g, ' ') ||
                                          'Unknown'
                                        }
                                        style={getStatusChipStyle(audit.status)}
                                        className={classes.statusChip}
                                      />
                                      <Typography
                                        variant="caption"
                                        color="textSecondary"
                                        style={{ marginLeft: 8 }}
                                      >
                                        {audit.period} • {audit.frequency}
                                      </Typography>
                                    </Box>

                                    <Box className={classes.progressContainer}>
                                      <Typography
                                        className={classes.progressLabel}
                                      >
                                        Progress:{' '}
                                        {getProgressLabel(
                                          audit.progress || 'NOT_STARTED',
                                        )}
                                      </Typography>
                                      <LinearProgress
                                        variant="determinate"
                                        value={getProgressValue(
                                          audit.progress || 'NOT_STARTED',
                                        )}
                                        className={classes.progressBar}
                                        color="primary"
                                      />
                                    </Box>
                                  </Box>

                                  <Box ml={2}>
                                    <Link
                                      to={`/audit-access-manager/${summary.app.app_name}`}
                                    >
                                      <Button
                                        variant="outlined"
                                        color="primary"
                                        startIcon={<VisibilityIcon />}
                                        className={classes.actionButton}
                                        size="small"
                                      >
                                        View Details
                                      </Button>
                                    </Link>
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

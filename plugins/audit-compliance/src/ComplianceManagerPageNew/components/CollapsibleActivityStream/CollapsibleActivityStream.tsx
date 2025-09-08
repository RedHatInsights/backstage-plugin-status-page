import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Collapse,
  Chip,
  Button,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import RefreshIcon from '@material-ui/icons/Refresh';
import CancelIcon from '@material-ui/icons/Cancel';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import InfoIcon from '@material-ui/icons/Info';
import { format } from 'date-fns';
import { useStyles } from './styles';
import { CollapsibleActivityStreamProps } from './types';

const getActivityIcon = (eventType: string) => {
  switch (eventType) {
    case 'ACCESS_REVOKED':
      return <CancelIcon style={{ color: '#dd2c00' }} />;
    case 'ACCESS_APPROVED':
    case 'AUDIT_COMPLETED':
    case 'AUDIT_INITIATED':
    case 'AUDIT_FINAL_SIGNOFF_COMPLETED':
      return <CheckCircleIcon style={{ color: '#43a047' }} />;
    default:
      return <InfoIcon style={{ color: '#0066CC' }} />;
  }
};

const ACTIVITY_MESSAGES = {
  AUDIT_INITIATED: (event: AuditEvent) => (
    <span>
      [{event.period}], {event.frequency?.toUpperCase()}{' '}
      <strong>Audit initiated</strong> for <strong>{event.app_name}</strong> by{' '}
      <strong>{event.performed_by}</strong>
      {event.metadata?.jira_key && <> (Jira: {event.metadata.jira_key})</>}
    </span>
  ),
  AUDIT_COMPLETED: (event: AuditEvent) => (
    <span>
      [{event.period}], {event.frequency?.toUpperCase()}{' '}
      <strong>Audit completed</strong> for <strong>{event.app_name}</strong> by{' '}
      <strong>{event.performed_by}</strong>
    </span>
  ),
  AUDIT_SUMMARY_GENERATED: (event: AuditEvent) => (
    <span>
      [{event.period}], {event.frequency?.toUpperCase()}{' '}
      <strong>Audit summary generated</strong> for{' '}
      <strong>{event.app_name}</strong> by <strong>{event.performed_by}</strong>
    </span>
  ),
  AUDIT_FINAL_SIGNOFF_COMPLETED: (event: AuditEvent) => (
    <span>
      [{event.period}], {event.frequency?.toUpperCase()}{' '}
      <strong>Audit final sign-off</strong> for{' '}
      <strong>{event.app_name}</strong> by <strong>{event.performed_by}</strong>
    </span>
  ),
  ACCESS_APPROVED: (event: AuditEvent) => (
    <span>
      <strong>Access approved</strong> for <strong>{event.user_id}</strong>
      {event.event_data?.full_name && <> ({event.event_data.full_name})</>}
      {' for '}
      <strong>{event.app_name}</strong>
      {event.source && <> for {event.source}</>}
      {event.account_name && <> account: {event.account_name}</>}
      {' by '}
      <strong>{event.performed_by}</strong>
      {event.metadata?.reason && <>: {event.metadata.reason}</>}
    </span>
  ),
  ACCESS_REVOKED: (event: AuditEvent) => (
    <span>
      <strong>Access revoked</strong> for <strong>{event.user_id}</strong>
      {event.event_data?.full_name && <> ({event.event_data.full_name})</>}
      {' for '}
      <strong>{event.app_name}</strong>
      {event.source && <> for {event.source}</>}
      {event.account_name && <> account: {event.account_name}</>}
      {' by '}
      <strong>{event.performed_by}</strong>
      {event.metadata?.reason && <>: {event.metadata.reason}</>}
    </span>
  ),
  AUDIT_PROGRESS_UPDATED: (event: AuditEvent) => (
    <span>
      [{event.period}], {event.frequency?.toUpperCase()}{' '}
      <strong>Audit progress updated</strong> for{' '}
      <strong>{event.app_name}</strong>
      {event.metadata?.previous_progress && event.metadata?.new_progress && (
        <>
          {' '}
          from {event.metadata.previous_progress} to{' '}
          {event.metadata.new_progress}
        </>
      )}
      {' by '}
      <strong>{event.performed_by}</strong>
    </span>
  ),
  APPLICATION_CREATED: (event: AuditEvent) => (
    <span>
      <strong>Application created</strong> for <strong>{event.app_name}</strong>{' '}
      by <strong>{event.performed_by}</strong>
      {event.metadata?.account_count && (
        <> with {event.metadata.account_count} account(s)</>
      )}
    </span>
  ),
  APPLICATION_UPDATED: (event: AuditEvent) => (
    <span>
      <strong>Application updated</strong> for <strong>{event.app_name}</strong>{' '}
      by <strong>{event.performed_by}</strong>
    </span>
  ),
  data_refresh: (event: AuditEvent) => (
    <span>
      [{event.period}], {event.frequency?.toUpperCase()}{' '}
      <strong>Data Refresh</strong> for <strong>{event.app_name}</strong> by{' '}
      <strong>{event.performed_by}</strong>
      {event.metadata?.refresh_stats?.total_records && (
        <> - {event.metadata.refresh_stats.total_records} records refreshed</>
      )}
    </span>
  ),
  default: (event: AuditEvent) => (
    <span>
      [{event.period}], {event.frequency?.toUpperCase()}
      <strong>
        {' : '}
        {(event.event_type || event.event_name)
          ?.split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')}
      </strong>{' '}
      for <strong>{event.app_name}</strong> by{' '}
      <strong>{event.performed_by}</strong>
    </span>
  ),
};

export const CollapsibleActivityStream: React.FC<
  CollapsibleActivityStreamProps
> = ({ auditHistory, onRefresh, getStatusChipStyle }) => {
  const classes = useStyles();
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  const handleShowAll = () => {
    setShowAll(!showAll);
  };

  const displayedEvents = showAll ? auditHistory : auditHistory.slice(0, 5);

  if (auditHistory.length === 0) {
    return (
      <Card className={classes.card}>
        <CardContent className={classes.cardContent}>
          <Box className={classes.emptyState}>
            <Typography variant="h6" color="textSecondary">
              No recent activity
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Activity will appear here as audits are performed
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={classes.card}>
      <CardContent className={classes.cardContent}>
        <Box className={classes.header}>
          <Typography className={classes.title}>
            Recent Activity ({auditHistory.length})
          </Typography>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onRefresh}
              className={classes.expandButton}
              size="small"
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={handleToggleExpanded}
              className={classes.expandButton}
              size="small"
            >
              {expanded ? 'Collapse' : 'Expand'}
            </Button>
          </Box>
        </Box>

        <Collapse in={expanded || !expanded}>
          <Box>
            {displayedEvents.map((event, index) => {
              const eventType = event.event_type || event.event_name;
              const dateString =
                event.created_at ||
                event.performed_at ||
                new Date().toISOString();
              const dateObj = new Date(dateString);

              return (
                <Box key={event.id || index} className={classes.activityItem}>
                  <Box className={classes.timestamp}>
                    <Typography className={classes.timeText}>
                      {format(dateObj, 'hh:mm a')}
                    </Typography>
                    <Typography className={classes.dateText}>
                      {format(dateObj, 'MMM dd yyyy')}
                    </Typography>
                  </Box>

                  <Box className={classes.iconContainer}>
                    {getActivityIcon(eventType)}
                  </Box>

                  <Box className={classes.activityContent}>
                    <Typography className={classes.activityText}>
                      {ACTIVITY_MESSAGES[
                        eventType as keyof typeof ACTIVITY_MESSAGES
                      ]?.(event) || ACTIVITY_MESSAGES.default(event)}
                    </Typography>
                  </Box>
                </Box>
              );
            })}

            {auditHistory.length > 5 && (
              <Box textAlign="center" mt={2}>
                <Button
                  variant="outlined"
                  onClick={handleShowAll}
                  className={classes.showMoreButton}
                >
                  {showAll
                    ? 'Show Less'
                    : `Show All ${auditHistory.length} Activities`}
                </Button>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

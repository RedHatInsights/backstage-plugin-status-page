import React, { useEffect, useRef, useState } from 'react';
import { InfoCard } from '@backstage/core-components';
import {
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { Box, CircularProgress, Grid, Typography } from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import InfoIcon from '@material-ui/icons/Info';
import { format } from 'date-fns';
import { AuditEvent } from '../../AuditCompliancePage/audit-components/AuditDetailsSection/AuditActivityStream/types';
import { useStyles } from '../../AuditCompliancePage/audit-components/AuditDetailsSection/AuditActivityStream/AuditActivityStream.styles';

interface Props {
  auditHistory: AuditEvent[];
  onRefresh: () => void;
  getStatusChipStyle: (status: string) => any;
}

const getActivityIcon = (eventType: string, classes: any) => {
  switch (eventType) {
    case 'ACCESS_REVOKED':
      return <CancelIcon className={classes.errorIcon} />;
    case 'ACCESS_APPROVED':
    case 'AUDIT_COMPLETED':
    case 'AUDIT_INITIATED':
    case 'AUDIT_FINAL_SIGNOFF_COMPLETED':
      return <CheckCircleIcon className={classes.successIcon} />;
    default:
      return <InfoIcon className={classes.infoIcon} />;
  }
};

const ACTIVITY_MESSAGES = {
  AUDIT_INITIATED: (event: AuditEvent) => (
    <Typography className="activityStream">
      [{event.period}], {event.frequency?.toUpperCase()}{' '}
      <span className="boldText">{' : '}Audit initiated</span> for{' '}
      <span className="boldText">{event.app_name}</span> by{' '}
      <span className="boldText">{event.performed_by}</span>
      {event.metadata?.jira_key && <> (Jira: {event.metadata.jira_key})</>}
    </Typography>
  ),
  AUDIT_COMPLETED: (event: AuditEvent) => (
    <Typography className="activityStream">
      [{event.period}], {event.frequency?.toUpperCase()}{' '}
      <span className="boldText">{' : '}Audit completed</span> for{' '}
      <span className="boldText">{event.app_name}</span> by{' '}
      <span className="boldText">{event.performed_by}</span>
    </Typography>
  ),
  AUDIT_SUMMARY_GENERATED: (event: AuditEvent) => (
    <Typography className="activityStream">
      <span className="boldText">Audit summary generated</span> for{' '}
      <span className="boldText">{event.app_name}</span> by{' '}
      <span className="boldText">{event.performed_by}</span>
    </Typography>
  ),
  AUDIT_FINAL_SIGNOFF_COMPLETED: (event: AuditEvent) => (
    <Typography className="activityStream">
      [{event.period}], {event.frequency?.toUpperCase()}{' '}
      <span className="boldText">{' : '}Audit final sign-off</span> for{' '}
      <span className="boldText">{event.app_name}</span> by{' '}
      <span className="boldText">{event.performed_by}</span>
    </Typography>
  ),
  ACCESS_APPROVED: (event: AuditEvent) => (
    <Typography className="activityStream">
      <span className="boldText">Access approved</span> for{' '}
      <span className="boldText">{event.user_id}</span>
      {event.event_data?.full_name && <> ({event.event_data.full_name})</>}
      {' for '}
      <span className="boldText">{event.app_name}</span>
      {event.source && <> for {event.source}</>}
      {event.account_name && <> account: {event.account_name}</>}
      {' by '}
      <span className="boldText">{event.performed_by}</span>
      {event.metadata?.reason && <>: {event.metadata.reason}</>}
    </Typography>
  ),
  ACCESS_REVOKED: (event: AuditEvent) => (
    <Typography className="activityStream">
      <span className="boldText">Access revoked</span> for{' '}
      <span className="boldText">{event.user_id}</span>
      {event.event_data?.full_name && <> ({event.event_data.full_name})</>}
      {' for '}
      <span className="boldText">{event.app_name}</span>
      {event.source && <> for {event.source}</>}
      {event.account_name && <> account: {event.account_name}</>}
      {' by '}
      <span className="boldText">{event.performed_by}</span>
      {event.metadata?.reason && <>: {event.metadata.reason}</>}
    </Typography>
  ),
  AUDIT_PROGRESS_UPDATED: (event: AuditEvent) => (
    <Typography className="activityStream">
      [{event.period}], {event.frequency?.toUpperCase()}{' '}
      <span className="boldText">audit progress updated</span> for{' '}
      <span className="boldText">{event.app_name}</span>
      {event.metadata?.previous_progress && event.metadata?.new_progress && (
        <>
          {' '}
          from {event.metadata.previous_progress} to{' '}
          {event.metadata.new_progress}
        </>
      )}
      {' by '}
      <span className="boldText">{event.performed_by}</span>
    </Typography>
  ),
  default: (event: AuditEvent) => (
    <Typography className="activityStream">
      <span className="boldText">{event.event_type}</span> for{' '}
      <span className="boldText">{event.app_name}</span> by{' '}
      <span className="boldText">{event.performed_by}</span>
    </Typography>
  ),
};

export const ActivityStream: React.FC<Props> = ({
  auditHistory,
  onRefresh,
  getStatusChipStyle,
}) => {
  const classes = useStyles();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  const fetchEvents = async (currentOffset: number) => {
    try {
      setLoading(true);
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const response = await fetchApi.fetch(
        `${baseUrl}/activity-stream?limit=20&offset=${currentOffset}`,
      );

      if (!response.ok) {
        throw new Error('Failed to fetch activity events');
      }

      const newEvents = await response.json();
      console.log(
        'Fetched events:',
        newEvents.length,
        'offset:',
        currentOffset,
      );

      if (currentOffset === 0) {
        setEvents(newEvents);
      } else {
        setEvents(prev => [...prev, ...newEvents]);
      }

      setHasMore(newEvents.length === 20);
      setOffset(currentOffset + newEvents.length);
    } catch (error) {
      console.error('Error fetching activity events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(0);
  }, []);

  const handleScroll = () => {
    const el = ref.current;
    if (
      el &&
      el.scrollTop + el.clientHeight >= el.scrollHeight - 100 &&
      !loading &&
      hasMore
    ) {
      console.log('Loading more events, offset:', offset);
      fetchEvents(offset);
    }
  };

  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (el) {
        el.removeEventListener('scroll', handleScroll);
      }
    };
  }, [loading, hasMore, offset]);

  return (
    <Box style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <InfoCard title="Activity Stream" noPadding>
        <div ref={ref} className={classes.cardContainer} style={{ flex: 1 }}>
          {events.map(event => {
            const eventType = event.event_type || event.event_name;
            const dateString =
              event.created_at ||
              event.performed_at ||
              new Date().toISOString();
            const dateObj = new Date(dateString);

            return (
              <Grid
                key={event.id}
                container
                spacing={2}
                style={{ marginBottom: '8px' }}
              >
                <Grid item xs={2}>
                  <div>
                    <Typography className={classes.timestamp}>
                      {format(dateObj, 'hh:mm a')}
                    </Typography>
                    <Typography className={classes.date}>
                      {format(dateObj, 'MMM dd yyyy')}
                    </Typography>
                  </div>
                </Grid>

                <Grid item xs={1} style={{ marginTop: '4px' }}>
                  {getActivityIcon(eventType, classes)}
                </Grid>

                <Grid item xs={8}>
                  <Box mb={1}>
                    {ACTIVITY_MESSAGES[
                      eventType as keyof typeof ACTIVITY_MESSAGES
                    ]?.(event) || ACTIVITY_MESSAGES.default(event)}
                  </Box>
                </Grid>
              </Grid>
            );
          })}

          {loading && (
            <Box display="flex" justifyContent="center" mt={2}>
              <CircularProgress size={20} />
            </Box>
          )}
        </div>
      </InfoCard>
    </Box>
  );
};

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
import React, { useEffect, useRef, useState } from 'react';
import { useStyles } from './AuditActivityStream.styles';
import { AuditEvent } from './types';

interface Props {
  key?: string;
  app_name: string;
  frequency: string;
  period: string;
}

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
    <Typography className="activityStream">
      [{event.period}], {event.frequency?.toUpperCase()}{' '}
      <b>{' : '}Audit initiated</b> for <b>{event.app_name}</b> by{' '}
      <b>{event.performed_by}</b>
      {event.metadata?.jira_key && <> (Jira: {event.metadata.jira_key})</>}
    </Typography>
  ),
  AUDIT_COMPLETED: (event: AuditEvent) => (
    <Typography className="activityStream">
      [{event.period}], {event.frequency?.toUpperCase()}{' '}
      <b>{' : '}Audit completed</b> for <b>{event.app_name}</b> by{' '}
      <b>{event.performed_by}</b>
    </Typography>
  ),
  AUDIT_SUMMARY_GENERATED: (event: AuditEvent) => (
    <Typography className="activityStream">
      <b>Audit summary generated</b> for <b>{event.app_name}</b> by{' '}
      <b>{event.performed_by}</b>
    </Typography>
  ),
  AUDIT_FINAL_SIGNOFF_COMPLETED: (event: AuditEvent) => (
    <Typography className="activityStream">
      [{event.period}], {event.frequency?.toUpperCase()}{' '}
      <b>{' : '}Audit final sign-off</b> for <b>{event.app_name}</b> by{' '}
      <b>{event.performed_by}</b>
    </Typography>
  ),
  ACCESS_APPROVED: (event: AuditEvent) => (
    <Typography className="activityStream">
      <b>Access approved</b> for <b>{event.user_id}</b>
      {event.event_data?.full_name && <> ({event.event_data.full_name})</>}
      {' for '}
      <b>{event.app_name}</b>
      {event.source && <> for {event.source}</>}
      {event.account_name && <> account: {event.account_name}</>}
      {' by '}
      <b>{event.performed_by}</b>
      {event.metadata?.reason && <>: {event.metadata.reason}</>}
    </Typography>
  ),
  ACCESS_REVOKED: (event: AuditEvent) => (
    <Typography className="activityStream">
      <b>Access revoked</b> for <b>{event.user_id}</b>
      {event.event_data?.full_name && <> ({event.event_data.full_name})</>}
      {' for '}
      <b>{event.app_name}</b>
      {event.source && <> for {event.source}</>}
      {event.account_name && <> account: {event.account_name}</>}
      {' by '}
      <b>{event.performed_by}</b>
      {event.metadata?.reason && <>: {event.metadata.reason}</>}
    </Typography>
  ),
  AUDIT_PROGRESS_UPDATED: (event: AuditEvent) => (
    <Typography className="activityStream">
      [{event.period}], {event.frequency?.toUpperCase()}{' '}
      <b>audit progress updated</b> for <b>{event.app_name}</b>
      {event.metadata?.previous_progress && event.metadata?.new_progress && (
        <>
          {' '}
          from {event.metadata.previous_progress} to{' '}
          {event.metadata.new_progress}
        </>
      )}
      {' by '}
      <b>{event.performed_by}</b>
    </Typography>
  ),
  default: (event: AuditEvent) => (
    <Typography className="activityStream">
      [{event.period}], {event.frequency?.toUpperCase()}
      <b>
        {' : '}
        {(event.event_type || event.event_name)
          ?.split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')}
      </b>{' '}
      for <b>{event.app_name}</b> by <b>{event.performed_by}</b>
    </Typography>
  ),
};

export const AuditActivityStream: React.FC<Props> = ({
  app_name,
  frequency,
  period,
}) => {
  const classes = useStyles();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  const fetchEvents = async (currentOffset: number) => {
    try {
      setLoading(true);
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const response = await fetchApi.fetch(
        `${baseUrl}/activity-stream?app_name=${app_name}&frequency=${frequency}&period=${period}&limit=10&offset=${currentOffset}`,
      );

      if (!response.ok) {
        throw new Error('Failed to fetch activity events');
      }

      const data = await response.json();
      setEvents(prev => [...prev, ...data]);
      setHasMore(data.length === 10); // If we got 10 items, there might be more
      setOffset(currentOffset + data.length);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch activity events',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app_name, frequency, period]);

  const handleScroll = () => {
    const el = ref.current;
    if (
      el &&
      el.scrollTop + el.clientHeight >= el.scrollHeight - 100 &&
      !loading &&
      hasMore
    ) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, hasMore, offset]);

  if (error) {
    return (
      <InfoCard title="Activity Stream" noPadding>
        <Box p={2}>
          <Typography color="error">{error}</Typography>
        </Box>
      </InfoCard>
    );
  }

  return (
    <InfoCard title="Activity Stream" noPadding>
      <div ref={ref} className={classes.cardContainer}>
        {events.map(event => {
          const eventType = event.event_type || event.event_name;
          const dateString =
            event.created_at || event.performed_at || new Date().toISOString();
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
                {getActivityIcon(eventType)}
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
  );
};

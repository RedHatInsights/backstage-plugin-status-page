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
import { useCallback, useEffect, useRef, useState } from 'react';
import { useStyles } from './AuditActivityStream.styles';
import { AuditEvent } from './types';

interface Props {
  key?: string;
  app_name?: string;
  frequency?: string;
  period?: string;
  showAll?: boolean; // When true, shows all data without pagination/scrolling for export
  global?: boolean; // When true, shows activities from all applications
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
      [{event.period}], {event.frequency?.toUpperCase()}{' '}
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
      <b>Audit progress updated</b> for <b>{event.app_name}</b>
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
  APPLICATION_CREATED: (event: AuditEvent) => (
    <Typography className="activityStream">
      <b>Application created</b> for <b>{event.app_name}</b> by{' '}
      <b>{event.performed_by}</b>
      {event.metadata?.account_count && (
        <> with {event.metadata.account_count} account(s)</>
      )}
    </Typography>
  ),
  APPLICATION_UPDATED: (event: AuditEvent) => (
    <Typography className="activityStream">
      <b>Application updated</b> for <b>{event.app_name}</b> by{' '}
      <b>{event.performed_by}</b>
    </Typography>
  ),
  data_refresh: (event: AuditEvent) => (
    <Typography className="activityStream">
      [{event.period}], {event.frequency?.toUpperCase()} <b>Data Refresh</b> for{' '}
      <b>{event.app_name}</b> by <b>{event.performed_by}</b>
      {event.metadata?.refresh_stats?.total_records && (
        <> - {event.metadata.refresh_stats.total_records} records refreshed</>
      )}
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
  showAll = false,
  global = false,
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

  const fetchEvents = useCallback(
    async (currentOffset: number) => {
      try {
        setLoading(true);
        const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');

        let endpoint: string;

        if (global) {
          // Global mode - fetch activities from all applications
          endpoint = `/activity-stream?all=true&limit=20&offset=${currentOffset}`;
        } else if (showAll) {
          // ShowAll mode for specific app
          endpoint = `/activity-stream/export?app_name=${encodeURIComponent(
            app_name!,
          )}&frequency=${encodeURIComponent(
            frequency!,
          )}&period=${encodeURIComponent(period!)}`;
        } else {
          // Regular paginated mode for specific app
          endpoint = `/activity-stream?app_name=${encodeURIComponent(
            app_name!,
          )}&frequency=${encodeURIComponent(
            frequency!,
          )}&period=${encodeURIComponent(
            period!,
          )}&limit=10&offset=${currentOffset}`;
        }

        const response = await fetchApi.fetch(`${baseUrl}${endpoint}`);

        if (!response.ok) {
          throw new Error('Failed to fetch activity events');
        }

        const data = await response.json();

        if (showAll) {
          // For showAll mode, set all events at once
          setEvents(data);
          setHasMore(false);
        } else {
          // For paginated mode (including global), append to existing events
          setEvents(prev => [...prev, ...data]);
          setHasMore(data.length === (global ? 20 : 10)); // Global uses limit 20, regular uses 10
          setOffset(currentOffset + data.length);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch activity events',
        );
      } finally {
        setLoading(false);
      }
    },
    [app_name, frequency, period, showAll, global, discoveryApi, fetchApi],
  );

  useEffect(() => {
    fetchEvents(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app_name, frequency, period, global]);

  const handleScroll = useCallback(() => {
    const el = ref.current;
    if (
      el &&
      el.scrollTop + el.clientHeight >= el.scrollHeight - 100 &&
      !loading &&
      hasMore
    ) {
      fetchEvents(offset);
    }
  }, [loading, hasMore, offset, fetchEvents]);

  useEffect(() => {
    // Only add scroll listeners when not in showAll mode (global mode should allow scrolling)
    if (!showAll) {
      const el = ref.current;
      if (el) {
        el.addEventListener('scroll', handleScroll);
      }
      return () => {
        if (el) {
          el.removeEventListener('scroll', handleScroll);
        }
      };
    }
    // Return undefined for showAll mode
    return undefined;
  }, [loading, hasMore, offset, showAll, handleScroll]);

  if (error) {
    return (
      <InfoCard title="Activity Stream" noPadding>
        <Box p={2}>
          <Typography color="error">{error}</Typography>
        </Box>
      </InfoCard>
    );
  }

  const containerClassName = showAll ? undefined : classes.cardContainer;
  const containerStyle = showAll ? { padding: '20px' } : undefined;

  const activityContent = (
    <div ref={ref} className={containerClassName} style={containerStyle}>
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
  );

  // For showAll mode, render without InfoCard wrapper
  if (showAll) {
    return activityContent;
  }

  // For regular mode, wrap in InfoCard
  return (
    <InfoCard title="Activity Stream" noPadding>
      {activityContent}
    </InfoCard>
  );
};

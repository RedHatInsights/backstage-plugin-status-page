import { Typography } from '@material-ui/core';
import { AuditEvent } from './types';

export const ACTIVITY_MESSAGES = {
  AUDIT_INITIATED: (event: AuditEvent) => (
    <Typography className="activityStream">
      [{event.period}], {event.frequency?.toUpperCase()}{' '}
      <b>{' : '}Audit initiated</b> for <b>{event.app_name}</b> performed by{' '}
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
  AUDIT_METADATA_UPDATED: (event: AuditEvent) => (
    <Typography className="activityStream">
      [{event.period}], {event.frequency?.toUpperCase()}{' '}
      <b>Audit metadata updated</b> for <b>{event.app_name}</b> by{' '}
      <b>{event.performed_by}</b>
    </Typography>
  ),
  AUDIT_DATA_REFRESHED: (event: AuditEvent) => (
    <Typography className="activityStream">
      [{event.period}], {event.frequency?.toUpperCase()}{' '}
      <b>Audit data refreshed</b> for <b>{event.app_name}</b> by{' '}
      <b>{event.performed_by}</b>
      {event.metadata?.refresh_stats?.total_records && (
        <> - {event.metadata.refresh_stats.total_records} records refreshed</>
      )}
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

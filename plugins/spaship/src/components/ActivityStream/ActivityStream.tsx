import React from 'react';
import { Chip, Grid } from '@material-ui/core';
import {
  Check as CheckIcon,
  Dialpad as CubesIcon,
  Camera as ClusterIcon,
  AlarmOutlined as OutlinedClockIcon,
  Person as UserIcon,
  Adjust as TimesIcon,
  ErrorRounded as ExclamationCircleIcon,
  SyncAlt as SyncAltIcon,
  Delete as TrashIcon,
} from '@material-ui/icons';
import { TActivityStream } from '../../hooks/types';

type Props = TActivityStream & { isGlobal: boolean };

const toPascalCase = (sentence: string) =>
  sentence
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace('_', ' ')
    .trim()
    .split(' ')
    .map(word => word[0].toUpperCase().concat(word.slice(1)))
    .join(' ');

const activities = {
  APPLICATION_DEPLOYED: ({
    props,
    message,
    propertyIdentifier,
    isGlobal,
  }: Props): JSX.Element => (
    <div>
      Deployment
      <Chip
        color="primary"
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        icon={<CheckIcon style={{ fontSize: 16 }} />}
        variant="outlined"
        size="small"
        label="completed"
      />
      for
      {isGlobal && (
        <>
          <Chip
            color="primary"
            style={{ marginBottom: 0, marginLeft: '0.5rem' }}
            icon={<CubesIcon style={{ fontSize: 16 }} />}
            variant="outlined"
            size="small"
            label={propertyIdentifier}
          />
          {' -> '}
        </>
      )}
      <Chip
        icon={<CubesIcon style={{ fontSize: 16 }} />}
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        color="primary"
        size="small"
        label={props.applicationIdentifier}
      />
      in
      <Chip
        label={props.env}
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        icon={<ClusterIcon style={{ fontSize: 16 }} />}
        color="primary"
        size="small"
      />
      env with
      <Chip
        label={message}
        style={{ marginBottom: 0, marginLeft: '0.5rem', marginTop: '1rem' }}
        icon={<OutlinedClockIcon style={{ fontSize: 16 }} />}
        color="primary"
        size="small"
      />
    </div>
  ),
  PROPERTY_CREATED: ({ propertyIdentifier }: Props): JSX.Element => (
    <div>
      <Chip
        label={propertyIdentifier}
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        icon={<CubesIcon style={{ fontSize: 16 }} />}
        color="primary"
        size="small"
      />
      has been created.
    </div>
  ),
  ENV_CREATED: ({ props }: Props): JSX.Element => (
    <div>
      <Chip
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        label={props.env}
        icon={<ClusterIcon style={{ fontSize: 16 }} />}
        color="primary"
        size="small"
      />
      environment has been created.
    </div>
  ),
  APPLICATION_DEPLOYMENT_STARTED: ({ props }: Props): JSX.Element => (
    <div>
      Deployment
      <Chip
        color="primary"
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        icon={<OutlinedClockIcon style={{ fontSize: 16 }} />}
        variant="outlined"
        size="small"
        label="started"
      />
      for
      <Chip
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        icon={<CubesIcon style={{ fontSize: 16 }} />}
        color="primary"
        size="small"
        label={props.applicationIdentifier}
      />
      App in the
      <Chip
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        icon={<ClusterIcon style={{ fontSize: 16 }} />}
        color="primary"
        size="small"
        label={props.env}
      />
      env.
    </div>
  ),
  APIKEY_CREATED: ({ props, propertyIdentifier }: Props): JSX.Element => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      API key has been
      <Chip
        color="primary"
        icon={<CheckIcon style={{ fontSize: 16 }} />}
        variant="outlined"
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        size="small"
        label="created"
      />
      for
      <Chip
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        icon={<CubesIcon style={{ fontSize: 16 }} />}
        color="primary"
        size="small"
        label={propertyIdentifier}
      />
      with scope
      <Chip
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        icon={<OutlinedClockIcon style={{ fontSize: 16 }} />}
        color="primary"
        size="small"
        label={props.env}
      />
    </div>
  ),
  APIKEY_DELETED: ({ propertyIdentifier }: Props): JSX.Element => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      API key has been
      <Chip
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        color="secondary"
        icon={<TimesIcon style={{ fontSize: 16 }} />}
        variant="outlined"
        label="deleted"
      />
      for
      <Chip
        icon={<CubesIcon style={{ fontSize: 16 }} />}
        color="primary"
        size="small"
        label={propertyIdentifier}
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
      />
      with scope
      <Chip
        icon={<OutlinedClockIcon style={{ fontSize: 16 }} />}
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        color="primary"
        size="small"
        label={propertyIdentifier}
      />
    </div>
  ),
  ENV_SYNCED: ({ props }: Props): JSX.Element => (
    <div>
      <Chip
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        icon={<SyncAltIcon style={{ fontSize: 16 }} />}
        color="primary"
        size="small"
        label="Sync"
      />
      completed for
      <Chip
        label={props.env}
        icon={<ClusterIcon style={{ fontSize: 16 }} />}
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        color="primary"
        size="small"
      />
      environment
    </div>
  ),
  APPLICATION_DELETED: ({ props, message }: Props): JSX.Element => (
    <div>
      <Chip
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        icon={<CubesIcon style={{ fontSize: 16 }} />}
        color="primary"
        size="small"
        label={props.applicationIdentifier}
      />
      has been
      <Chip
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        color="secondary"
        icon={<TimesIcon style={{ fontSize: 16 }} />}
        variant="outlined"
        label="deleted"
      />
      for
      <Chip
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        icon={<ClusterIcon style={{ fontSize: 16 }} />}
        color="primary"
        size="small"
        label={props.env}
      />
      Misc:
      <Chip
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        icon={<OutlinedClockIcon style={{ fontSize: 16 }} />}
        color="primary"
        size="small"
        label={message}
      />
    </div>
  ),
  APPLICATION_DEPLOYMENT_FAILED: ({ props }: Props): JSX.Element => (
    <div>
      <Chip
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        icon={<CubesIcon style={{ fontSize: 16 }} />}
        color="primary"
        size="small"
        label={props.applicationIdentifier}
      />
      has
      <Chip
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        color="secondary"
        icon={<ExclamationCircleIcon style={{ fontSize: 16 }} />}
        variant="outlined"
        label="failed to deploy"
      />
      in
      <Chip
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        icon={<OutlinedClockIcon style={{ fontSize: 16 }} />}
        color="primary"
        size="small"
        label={props.env}
      />
    </div>
  ),
  ENV_DELETED: ({ props }: Props): JSX.Element => (
    <div>
      <Chip
        icon={<ClusterIcon style={{ fontSize: 16 }} />}
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        color="primary"
        size="small"
        label={props.env}
      />
      environment has been
      <Chip
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        color="default"
        icon={<TimesIcon style={{ fontSize: 16 }} />}
        variant="outlined"
        label="deleted"
      />
    </div>
  ),
  PERMISSION_CREATED: ({ message }: Props): JSX.Element => (
    <div>
      <Chip
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        icon={<CubesIcon style={{ fontSize: 16 }} />}
        color="primary"
        size="small"
        label={toPascalCase(message.split(' ')[0]).replace('_', ' ')}
      />
      access
      <Chip
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        icon={<CheckIcon style={{ fontSize: 16 }} />}
        variant="outlined"
        size="small"
        label={message.split(' ')[2]}
      />
      for
      <Chip
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        color="primary"
        icon={<UserIcon style={{ fontSize: 16 }} />}
        size="small"
        label={message.split(' ')[4]}
      />
    </div>
  ),
  PERMISSION_DELETED: ({ message }: Props): JSX.Element => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Chip
        icon={<CubesIcon style={{ fontSize: 16 }} />}
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        color="primary"
        size="small"
        label={toPascalCase(message?.split(' ')[0]).replace('_', ' ')}
      />
      access
      <Chip
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        color="secondary"
        icon={<TrashIcon style={{ fontSize: 16 }} />}
        variant="outlined"
        size="small"
        label={message?.split(' ')[2]}
      />
      for
      <Chip
        color="primary"
        style={{ marginBottom: 0, marginLeft: '0.5rem' }}
        icon={<UserIcon style={{ fontSize: 16 }} />}
        size="small"
        label={message?.split(' ')[4]}
      />
    </div>
  ),
} as any;

const DeploymentKind = ({
  activity,
  isGlobal,
}: {
  activity: TActivityStream;
  isGlobal: boolean;
}) => {
  if (Object.prototype.hasOwnProperty.call(activities, activity.action)) {
    return activities[activity.action]({ ...activity, isGlobal });
  }
  return <div>Activity message - {activity.message}</div>;
};

export const ActivityStream = ({
  activities,
  isGlobal = false,
}: {
  activities: TActivityStream[];
  isGlobal?: boolean;
}) => {
  return (
    <Grid container spacing={3}>
      {activities.map(activity => (
        <Grid
          item
          xs={12}
          key={activity._id}
          style={{
            boxShadow: '0 1px 1px rgba(0,0,0,0.23)',
            padding: '1.25rem',
          }}
        >
          <DeploymentKind activity={activity} isGlobal={isGlobal} />
        </Grid>
      ))}
    </Grid>
  );
};

import { stringifyEntityRef } from '@backstage/catalog-model';
import {
  InfoCard,
  InfoCardVariants,
  Progress
} from '@backstage/core-components';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import { EntityRefLink, useAsyncEntity } from '@backstage/plugin-catalog-react';
import { RequirePermission } from '@backstage/plugin-permission-react';
import {
  WorkstreamEntity,
  workstreamUpdatePermission,
} from '@compass/backstage-plugin-workstream-automation-common';
import {
  Box,
  Divider,
  Grid,
  IconButton,
  makeStyles,
  Tooltip,
  Typography,
  withStyles,
} from '@material-ui/core';
import CachedIcon from '@material-ui/icons/Cached';
import EditTwoTone from '@material-ui/icons/EditTwoTone';
import UpdateIcon from '@material-ui/icons/UpdateTwoTone';
import { DateTime } from 'luxon';
import { useState } from 'react';
import { JiraIcon } from '../Icons/JiraIcon';
import { AboutEditModal } from './AboutEditModal';
import { LinkCard, LinkIcon } from './LinkCard';

const useStyles = makeStyles(theme => ({
  action: {
    '& $button $span': {
      color: theme.palette.text.primary,
    },
  },
  cardContent: {
    padding: '16px',
  },
}));


const StyledGrid = withStyles(theme => ({
  root: {
    paddingBottom: theme.spacing(1),
  },
}))(Grid);

export const WorkstreamAboutCard = (props: { variant: InfoCardVariants }) => {
  const { entity, refresh } = useAsyncEntity<WorkstreamEntity>();
  const alertApi = useApi(alertApiRef);
  const classes = useStyles();
  const artRef = entity?.relations?.find(p =>
    p.targetRef.startsWith('art:'),
  )?.targetRef;

  const [editModalOpen, setEditModalOpen] = useState(false);

  return entity ? (
    <InfoCard
      {...props}
      title="About"
      noPadding
      subheader={
        <Box display="flex" flexDirection="row">
          {entity.metadata.links
            .filter(p => p.type?.match(/Contact|Email/g))
            .map(val => {
              return (
                <LinkCard
                  key={val.title}
                  href={val.url}
                  title={val.title}
                  Icon={<LinkIcon val={val.icon} />}
                />
              );
            })}
          {entity.metadata.annotations['jira/project-key'] && (
            <LinkCard
              href={`https://issues.redhat.com/browse/${entity.metadata.annotations['jira/project-key']}`}
              title="Jira"
              Icon={<JiraIcon fontSize="large" />}
            />
          )}
        </Box>
      }
      headerProps={{
        classes: { action: classes.action },
        action: (
          <RequirePermission
            permission={workstreamUpdatePermission}
            resourceRef={stringifyEntityRef(entity)}
            errorPage={<></>}
          >
            <IconButton
              onClick={() => {
                alertApi.post({
                  message: 'Entity refresh scheduled',
                  severity: 'info',
                  display: 'transient',
                });
                refresh?.();
              }}
            >
              <CachedIcon />
            </IconButton>
            <IconButton onClick={() => setEditModalOpen(true)}>
              <EditTwoTone />
            </IconButton>
          </RequirePermission>
        ),
      }}
    >
      {editModalOpen && (
        <AboutEditModal
          entity={entity}
          editModalCloseFn={setEditModalOpen}
          open={editModalOpen}
        />
      )}
      <Grid container className={classes.cardContent}>
        <Grid item xs={12}>
          <Typography variant="body1" color="textSecondary">
            Description
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body2">
            {entity.metadata.description
              ? entity.metadata.description
              : 'No Description'}
          </Typography>
        </Grid>
        <Grid item xs={artRef ? 4 : 6}>
          <StyledGrid xs={12}>
            <Typography variant="body1" color="textSecondary">
              Workstream Lead
            </Typography>
          </StyledGrid>
          <StyledGrid xs={12}>
            {entity.spec.lead ? (
              <EntityRefLink entityRef={entity.spec.lead} />
            ) : (
              'No Lead'
            )}
          </StyledGrid>
        </Grid>
        <Grid item xs={artRef ? 4 : 6}>
          <StyledGrid xs={12}>
            <Typography variant="body1" color="textSecondary">
              Pillar name
            </Typography>
          </StyledGrid>
          <StyledGrid xs={12}>{entity.spec.pillar}</StyledGrid>
        </Grid>
        {artRef ? (
          <Grid item xs={4}>
            <StyledGrid xs={12}>
              <Typography variant="body1" color="textSecondary">
                ART
              </Typography>
            </StyledGrid>
            <StyledGrid xs={12}>
              <EntityRefLink entityRef={artRef} />
            </StyledGrid>
          </Grid>
        ) : null}
      </Grid>
      <Divider />
      <Tooltip
        title={DateTime.fromISO(entity.metadata.updatedAt).toLocaleString({
          timeStyle: 'long',
          dateStyle: 'long',
        })}
      >
        <Typography
          variant="caption"
          color="textSecondary"
          style={{ padding: '8px', float: 'right', display: 'flex' }}
        >
          Last updated:&nbsp;
          {DateTime.fromISO(entity.metadata.updatedAt).toRelative()}
          <UpdateIcon fontSize="small" style={{ marginLeft: '4px' }} />
        </Typography>
      </Tooltip>
    </InfoCard>
  ) : (
    <Progress />
  );
};

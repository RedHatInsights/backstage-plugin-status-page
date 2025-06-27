import {
  WorkstreamEntity,
  workstreamUpdatePermission,
} from '@appdev-platform/backstage-plugin-workstream-automation-common';
import { stringifyEntityRef } from '@backstage/catalog-model';
import {
  InfoCard,
  InfoCardVariants,
  Progress,
} from '@backstage/core-components';
import { alertApiRef, useApi, useApp } from '@backstage/core-plugin-api';
import { EntityRefLink, useAsyncEntity } from '@backstage/plugin-catalog-react';
import { RequirePermission } from '@backstage/plugin-permission-react';
import {
  Box,
  Grid,
  IconButton,
  makeStyles,
  Typography,
  withStyles,
} from '@material-ui/core';
import CachedIcon from '@material-ui/icons/Cached';
import EditTwoTone from '@material-ui/icons/EditTwoTone';
import LinkTwoTone from '@material-ui/icons/LinkTwoTone';
import { useState } from 'react';
import { JiraIcon } from '../Icons/JiraIcon';
import { LinkCard } from './LinkCard';
import { AboutEditModal } from './AboutEditModal';

const useStyles = makeStyles(theme => ({
  action: {
    '& $button $span': {
      color: theme.palette.text.primary,
    },
  },
}));

const LinkIcon = (props: { val?: string }) => {
  const app = useApp();
  const { val: key } = props;
  const Icon = key ? app.getSystemIcon(key) ?? LinkTwoTone : LinkTwoTone;
  return <Icon color="primary" fontSize="large" />;
};

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
      <Grid container>
        <Grid item xs={12}>
          <Typography variant="body1" color="textSecondary">
            Links
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Box display="flex" flexDirection="row">
            {entity.metadata.annotations['jira/project-key'] && (
              <LinkCard
                href={`https://issues.redhat.com/browse/${entity.metadata.annotations['jira/project-key']}`}
                title="Jira"
                Icon={<JiraIcon fontSize="large" />}
              />
            )}
            {entity.metadata.links.map(val => {
              return (
                <LinkCard
                  key={val.title}
                  href={val.url}
                  title={val.title}
                  Icon={<LinkIcon val={val.icon} />}
                />
              );
            })}
          </Box>
        </Grid>
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
    </InfoCard>
  ) : (
    <Progress />
  );
};

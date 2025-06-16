import {
  ArtEntity,
  artUpdatePermission,
} from '@appdev-platform/backstage-plugin-workstream-automation-common';
import {
  InfoCard,
  InfoCardVariants,
  Progress,
} from '@backstage/core-components';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import {
  EntityPeekAheadPopover,
  EntityRefLink,
  useAsyncEntity,
} from '@backstage/plugin-catalog-react';
import { RequirePermission } from '@backstage/plugin-permission-react';
import {
  Grid,
  IconButton,
  makeStyles,
  Typography,
  withStyles,
} from '@material-ui/core';
import CachedIcon from '@material-ui/icons/Cached';
import EditTwoTone from '@material-ui/icons/EditTwoTone';
import React, { useState } from 'react';
import { AboutEditModal } from './AboutEditModal';

const useStyles = makeStyles(theme => ({
  action: {
    '& $button $span': {
      color: theme.palette.text.primary,
    },
  },
}));

const StyledGrid = withStyles(theme => ({
  root: {
    paddingBottom: theme.spacing(1),
  },
}))(Grid);

export const ArtAboutCard = (props: { variant: InfoCardVariants }) => {
  const { entity, refresh } = useAsyncEntity<ArtEntity>();
  const alertApi = useApi(alertApiRef);
  const classes = useStyles();
  const [editModalOpen, setEditModalOpen] = useState(false);

  return entity ? (
    <InfoCard
      {...props}
      title="About"
      headerProps={{
        classes: { action: classes.action },
        action: (
          <RequirePermission permission={artUpdatePermission} errorPage={<></>}>
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
        <Grid item xs={6}>
          <StyledGrid xs={12}>
            <Typography variant="body1" color="textSecondary">
              Release Train Engineer
            </Typography>
          </StyledGrid>
          <StyledGrid xs={12}>
            {entity.spec.rte ? (
              <EntityPeekAheadPopover entityRef={entity.spec.rte}>
                <EntityRefLink entityRef={entity.spec.rte} />
              </EntityPeekAheadPopover>
            ) : (
              'No RTE'
            )}
          </StyledGrid>
        </Grid>
        <Grid item xs={6}>
          <StyledGrid xs={12}>
            <Typography variant="body1" color="textSecondary">
              Pillar name
            </Typography>
          </StyledGrid>
          <StyledGrid xs={12}>{entity.spec.pillar}</StyledGrid>
        </Grid>
      </Grid>
    </InfoCard>
  ) : (
    <Progress />
  );
};

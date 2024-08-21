import {
  WorkstreamDataV1alpha1,
  workstreamUpdatePermission,
} from '@appdev-platform/backstage-plugin-workstream-automation-common';
import { stringifyEntityRef } from '@backstage/catalog-model';
import {
  HeaderActionMenu,
  InfoCard,
  InfoCardVariants,
} from '@backstage/core-components';
import { EntityRefLink, useAsyncEntity } from '@backstage/plugin-catalog-react';
import { RequirePermission } from '@backstage/plugin-permission-react';
import { List, ListItem, makeStyles } from '@material-ui/core';
import EditTwoTone from '@material-ui/icons/EditTwoTone';
import React, { useMemo, useState } from 'react';
import { PortfolioEditModal } from './PortfolioEditModal';

const useStyles = makeStyles(theme => ({
  action: {
    '& $button $span': {
      color: theme.palette.text.primary,
    },
  },
}));

export const WorkstreamPortfolioCard = (props: {
  variant: InfoCardVariants;
}) => {
  const { entity } = useAsyncEntity<WorkstreamDataV1alpha1>();
  const classes = useStyles();
  const portfolios = useMemo(
    () => (entity ? entity.spec.portfolio : []),
    [entity],
  );

  const [editModalOpen, setEditModalOpen] = useState(false);

  return (
    <InfoCard
      {...props}
      title={`Portfolios (${portfolios.length})`}
      headerProps={{
        classes: { action: classes.action },
        action: (
          <RequirePermission
            permission={workstreamUpdatePermission}
            resourceRef={stringifyEntityRef(entity!)}
            errorPage={<></>}
          >
            <HeaderActionMenu
              actionItems={[
                {
                  label: 'Edit Portfolio',
                  icon: <EditTwoTone />,
                  onClick: () => setEditModalOpen(true),
                },
              ]}
            />
          </RequirePermission>
        ),
      }}
    >
      {editModalOpen && (
        <PortfolioEditModal
          setEditModalOpen={setEditModalOpen}
          open={editModalOpen}
          portfolio={portfolios}
        />
      )}

      <List style={{ overflow: 'auto' }}>
        {portfolios.map(portfolio => (
          <ListItem key={portfolio} divider>
            <EntityRefLink entityRef={portfolio} defaultKind="system" />
          </ListItem>
        ))}
      </List>
    </InfoCard>
  );
};

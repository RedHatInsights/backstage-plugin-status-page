import {
  WorkstreamDataV1alpha1,
  workstreamUpdatePermission,
} from '@appdev-platform/backstage-plugin-workstream-automation-common';
import { Entity, stringifyEntityRef } from '@backstage/catalog-model';
import {
  InfoCard,
  InfoCardVariants,
  Progress,
  Table,
  TableColumn,
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import {
  catalogApiRef,
  EntityRefLink,
  useAsyncEntity,
} from '@backstage/plugin-catalog-react';
import { RequirePermission } from '@backstage/plugin-permission-react';
import { IconButton, makeStyles, Typography } from '@material-ui/core';
import EditTwoTone from '@material-ui/icons/EditTwoTone';
import React, { useEffect, useMemo, useState } from 'react';
import { PortfolioEditModal } from './PortfolioEditModal';

const useStyles = makeStyles(theme => ({
  action: {
    '& $button $span': {
      color: theme.palette.text.primary,
    },
  },
  cardContent: {
    padding: '0px',
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
  const catalogApi = useApi(catalogApiRef);
  const [portfoliosData, setPortfoliosData] = useState<(Entity | undefined)[]>(
    [],
  );
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    catalogApi
      .getEntitiesByRefs({ entityRefs: portfolios })
      .then(({ items }) => {
        setPortfoliosData(items);
        setLoading(false);
      });
  }, [portfolios, catalogApi]);

  const [editModalOpen, setEditModalOpen] = useState(false);

  const columns: TableColumn<Entity>[] = [
    {
      title: 'Name',
      field: 'metadata.name',
      cellStyle: { lineHeight: '1.6rem' },
      render: data => <EntityRefLink entityRef={data} />,
      width: '80%',
    },
    {
      sorting: false,
      title: 'Appcode',
      align: 'center',
      field: 'metadata.annotations.servicenow.com/appcode',
      render: data =>
        data.metadata?.annotations?.['servicenow.com/appcode'] ?? '-',
    },
  ];

  return loading ? (
    <Progress />
  ) : (
    <>
      {editModalOpen && (
        <PortfolioEditModal
          setEditModalOpen={setEditModalOpen}
          open={editModalOpen}
          portfolio={portfolios}
        />
      )}
      <InfoCard
        {...props}
        title={`Portfolios (${portfolios.length})`}
        noPadding
        headerProps={{
          classes: { action: classes.action },
          action: (
            <RequirePermission
              permission={workstreamUpdatePermission}
              resourceRef={stringifyEntityRef(entity!)}
              errorPage={<></>}
            >
              <IconButton onClick={() => setEditModalOpen(true)}>
                <EditTwoTone />
              </IconButton>
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

        <Table
          style={{ borderRadius: 0, padding: 0 }}
          isLoading={loading}
          data={portfoliosData as Entity[]}
          columns={columns}
          emptyContent={
            <Typography
              align="center"
              style={{
                height: '3rem',
                alignContent: 'center',
                alignItems: 'center',
              }}
            >
              This workstream does not contain any portfolio.
            </Typography>
          }
          options={{
            toolbar: false,
            padding: 'dense',
            draggable: false,
            pageSize: 10,
            pageSizeOptions: [5, 10, 25],
          }}
        />
      </InfoCard>
    </>
  );
};

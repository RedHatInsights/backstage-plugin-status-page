import {
  WorkstreamEntity,
  workstreamUpdatePermission,
} from '@appdev-platform/backstage-plugin-workstream-automation-common';
import { Entity, stringifyEntityRef } from '@backstage/catalog-model';
import {
  ErrorPanel,
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
import React, { useEffect, useState } from 'react';
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
  const { entity, loading: entityLoading } = useAsyncEntity<WorkstreamEntity>();
  const classes = useStyles();
  const catalogApi = useApi(catalogApiRef);
  const [portfoliosData, setPortfoliosData] = useState<Entity[]>([]);
  const [entitiesNotFound, setEntitesNotFound] = useState<string[]>([]);
  useEffect(() => {
    if (!entityLoading && entity) {
      const portfolios = entity.spec.portfolio;
      portfolios.forEach(portfolio => {
        catalogApi
          .getEntityByRef(portfolio)
          .then(res =>
            res
              ? setPortfoliosData(pf => pf.concat(res))
              : setEntitesNotFound(nf => nf.concat(portfolio)),
          );
      });
    } else {
      setPortfoliosData([]);
      setEntitesNotFound([]);
    }
  }, [catalogApi, entity, entityLoading]);

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

  return entityLoading || entity === undefined ? (
    <Progress />
  ) : (
    <>
      {editModalOpen && (
        <PortfolioEditModal
          setEditModalOpen={setEditModalOpen}
          open={editModalOpen}
          entitiesNotFound={entitiesNotFound}
          portfoliosData={portfoliosData}
        />
      )}
      <InfoCard
        {...props}
        title={`Portfolios (${portfoliosData.length})`}
        noPadding
        headerProps={{
          classes: { action: classes.action, content: classes.cardContent },
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
        <Table
          style={{ borderRadius: 0 }}
          isLoading={entityLoading}
          data={portfoliosData}
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
            pageSize: portfoliosData.length > 5 ? 10 : 5,
            pageSizeOptions: [5, 10, 25],
          }}
        />
        {entitiesNotFound.length > 0 && (
          <ErrorPanel
            error={{
              name: 'Missing portfolio',
              message: `Following entites are not found in catalog`,
              stack: ` - ${entitiesNotFound.join('\n - ')}`,
            }}
            title="Following entites are not found in catalog"
          />
        )}
      </InfoCard>
    </>
  );
};

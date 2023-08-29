import React, { useState } from 'react';
import {
  Content,
  ContentHeader,
  CreateButton,
  PageWithHeader,
  SupportButton,
} from '@backstage/core-components';
import { configApiRef, useApi, useRouteRef } from '@backstage/core-plugin-api';
import { EntityListProvider } from '@backstage/plugin-catalog-react';
import { catalogPlugin } from '@backstage/plugin-catalog';
import { Typography, makeStyles } from '@material-ui/core';
import { CatalogList } from './CatalogList';
import { CatalogToolbar } from './CatalogToolbar';

const useStyles = makeStyles({
  heading: {
    fontSize: '2rem',
    textTransform: 'capitalize',
  },
});

/** @public */
export const CatalogPage = () => {
  const [kind, setKind] = useState('');
  const [count, setCount] = useState(0);
  const { heading } = useStyles();

  const orgName =
    useApi(configApiRef).getOptionalString('organization.name') ?? 'Backstage';

  const createComponentLink = useRouteRef(
    catalogPlugin.externalRoutes.createComponent,
  );

  const handleDispatch = (values: any) => {
    setKind(values.kind);
    setCount(values.count);
  };

  return (
    <PageWithHeader title={`${orgName} Catalog`} themeId="home">
      <EntityListProvider>
        <Content>
          <ContentHeader
            titleComponent={
              <Typography variant="h2" className={heading}>
                All {kind}s ({count})
              </Typography>
            }
          >
            <CreateButton title="Create" to={createComponentLink?.()} />
            <SupportButton />
          </ContentHeader>
          <CatalogToolbar />
          <CatalogList dispatchActiveKind={handleDispatch} />
        </Content>
      </EntityListProvider>
    </PageWithHeader>
  );
};

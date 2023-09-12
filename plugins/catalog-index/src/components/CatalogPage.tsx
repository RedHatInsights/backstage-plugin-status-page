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
import { Container, Typography, makeStyles } from '@material-ui/core';
import { CatalogList } from './CatalogList';
import { capitalizeWord } from '../utils/capitalizeWord';

const useStyles = makeStyles({
  heading: {
    fontSize: '2rem',
  },
});

/** @public */
export const CatalogPage = () => {
  const [kind, setKind] = useState('Component');
  const [count, setCount] = useState(0);
  const { heading } = useStyles();

  const orgName =
    useApi(configApiRef).getOptionalString('organization.name') ?? 'Backstage';

  const createComponentLink = useRouteRef(
    catalogPlugin.externalRoutes.createComponent,
  );

  const handleDispatch = (values: any) => {
    setKind(capitalizeWord(values.kind));
    setCount(values.count);
  };

  return (
    <PageWithHeader title={`${orgName} Catalog`} pageTitleOverride={`${orgName} Catalog`} themeId="home">
      <EntityListProvider>
        <Content>
          <Container>
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
            <CatalogList dispatchActiveKind={handleDispatch} />
          </Container>
        </Content>
      </EntityListProvider>
    </PageWithHeader>
  );
};

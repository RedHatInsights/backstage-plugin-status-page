import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { contactDetailsPlugin, ContactDetailsCard } from '../src/plugin';
import {
  CatalogApi,
  EntityProvider,
  catalogApiRef,
} from '@backstage/plugin-catalog-react';
import { mockEntity, mockGroup1, mockGroup2 } from '../src/mocks';
import { Grid } from '@material-ui/core';

createDevApp()
  .registerPlugin(contactDetailsPlugin)
  .registerApi({
    api: catalogApiRef,
    deps: {},
    factory: () =>
      ({
        getEntityByRef: async (entityRef: string) => {
          await new Promise(r => setTimeout(r, 1000));

          if (entityRef.endsWith('group-qes')) {
            return mockGroup2;
          }
          return mockGroup1;
        },
      } as any as CatalogApi),
  })
  .addPage({
    title: 'Entity Page',
    path: '/catalog/default/component/example-application',
    element: (
      <EntityProvider entity={mockEntity}>
        <Grid item md={4}>
          <ContactDetailsCard />
        </Grid>
      </EntityProvider>
    ),
  })
  .render();

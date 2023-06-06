import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { cmdbPlugin, ServiceDetailsCard } from '../src/plugin';
import { ServiceNowApi, serviceNowApiRef } from '../src/apis';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import { Grid } from '@material-ui/core';
import { mockEntity, mockService, mockUser1 } from '../src/mocks';

const mockServiceNowApi: ServiceNowApi = {
  getBusinessApplication: () =>
    Promise.resolve({
      result: [mockService],
    }),
  getUserDetails: () =>
    Promise.resolve({
      result: mockUser1,
    }),
};

createDevApp()
  .registerPlugin(cmdbPlugin)
  .registerApi({
    api: serviceNowApiRef,
    deps: {},
    factory: () => mockServiceNowApi,
  })
  .addPage({
    title: 'Root Page',
    path: '/cmdb',
    element: (
      <EntityProvider entity={mockEntity}>
        <Grid item md={6}>
          <ServiceDetailsCard />
        </Grid>
      </EntityProvider>
    ),
  })
  .render();

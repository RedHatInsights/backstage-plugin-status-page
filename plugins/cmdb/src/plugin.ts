import {
  createApiFactory,
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

import { infraDetailsRouteRef, rootRouteRef } from './routes';
import { serviceNowApiRef } from './apis';
import { ServiceNowClient } from './apis/ServiceNowClient';

export const cmdbPlugin = createPlugin({
  id: 'cmdb',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: serviceNowApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) => new ServiceNowClient(discoveryApi, fetchApi),
    }),
  ],
});

export const ServiceDetailsCard = cmdbPlugin.provide(
  createRoutableExtension({
    name: 'ServiceDetailsCard',
    component: () =>
      import('./components/ServiceDetailsCard').then(m => m.ServiceDetailsCard),
    mountPoint: rootRouteRef,
  }),
);

export const InfraDetailsPage = cmdbPlugin.provide(
  createRoutableExtension({
    name: 'InfraDetailsPage',
    mountPoint: infraDetailsRouteRef,
    component: () =>
      import('./components/InfraDetailsPage').then(
        m => m.InfraDetailsComponent,
      ),
  }),
);

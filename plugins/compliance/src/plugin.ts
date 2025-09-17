import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const compliancePlugin = createPlugin({
  id: 'compliance',
  routes: {
    root: rootRouteRef,
  },
});

export const CompliancePage = compliancePlugin.provide(
  createRoutableExtension({
    name: 'CompliancePage',
    component: () =>
      import('./components/CompliancePage').then(m => m.CompliancePage),
    mountPoint: rootRouteRef,
  }),
);

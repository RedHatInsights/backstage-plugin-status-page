import { createRouteRef } from '@backstage/core-plugin-api';

export const rootRouteRef = createRouteRef({
  id: 'workstream-automation',
});

export const dashboardRouteRef = createRouteRef({
  id: 'workstream-automation--dashboard',
});

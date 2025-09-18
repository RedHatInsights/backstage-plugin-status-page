import { createRouteRef, createSubRouteRef } from '@backstage/core-plugin-api';

export const rootRouteRef = createRouteRef({
  id: 'ess',
});

export const platformDetailRouteRef = createSubRouteRef({
  id: 'ess-platform-detail',
  parent: rootRouteRef,
  path: '/platform/:name',
});

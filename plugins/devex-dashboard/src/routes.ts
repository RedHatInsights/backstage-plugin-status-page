import { createRouteRef } from '@backstage/core-plugin-api';

export const rootRouteRef = createRouteRef({
  id: 'devex-dashboard',
});

export const appDevRouteRef = createRouteRef({
  id: 'appdev-dashboard',
});
